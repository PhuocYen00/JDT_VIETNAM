import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

// GET: Lấy thống kê số lượng dữ liệu hiện tại trong DB và so sánh với file Excel
export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const [
      departments,
      users,
      deviceCategories,
      devices,
      ticketCategories,
      tickets,
      ticketHistories,
      maintenances,
      parts,
      transactions,
    ] = await Promise.all([
      prisma.department.count(),
      prisma.user.count(),
      prisma.deviceCategory.count(),
      prisma.device.count(),
      prisma.ticketCategory.count(),
      prisma.ticket.count(),
      prisma.ticketHistory.count(),
      prisma.maintenance.count(),
      prisma.part.count(),
      prisma.inventoryTransaction.count(),
    ]);

    const stats = [
      { name: "Phòng ban (Department)", current: departments, expected: 11, sheet: "01_Danh_muc" },
      { name: "Người dùng (User)", current: users, expected: 183, sheet: "02_Nguoi_dung" },
      { name: "Loại thiết bị (DeviceCategory)", current: deviceCategories, expected: 12, sheet: "01_Danh_muc" },
      { name: "Thiết bị CNTT (Device)", current: devices, expected: 900, sheet: "03_Thiet_bi_CNTT" },
      { name: "Nhóm sự cố (TicketCategory)", current: ticketCategories, expected: 8, sheet: "01_Danh_muc" },
      { name: "Yêu cầu hỗ trợ (Ticket)", current: tickets, expected: 3500, sheet: "04_Yeu_cau_ho_tro" },
      { name: "Lịch sử xử lý (TicketHistory)", current: ticketHistories, expected: 13224, sheet: "05_Lich_su_xu_ly" },
      { name: "Bảo trì sửa chữa (Maintenance)", current: maintenances, expected: 1500, sheet: "06_Bao_tri_sua_chua" },
      { name: "Linh kiện kho (Part)", current: parts, expected: 120, sheet: "07_Linh_kien" },
      { name: "Giao dịch kho (InventoryTransaction)", current: transactions, expected: 1800, sheet: "08_Giao_dich_linh_kien" },
    ];

    const isFullySynced = stats.every((s) => s.current >= s.expected);

    return NextResponse.json({
      isFullySynced,
      stats,
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Lỗi kiểm tra đối soát import:", err);
    return NextResponse.json(
      { message: "Không thể lấy thông tin đối soát", error: String(err) },
      { status: 500 }
    );
  }
}

// POST: Kích hoạt đồng bộ lại dữ liệu từ file Excel
export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireRole(["ADMIN"]);

    const startTime = Date.now();
    const filePath = path.join(
      process.cwd(),
      "data",
      "Bo_du_lieu_mau_JDT_Quan_ly_thiet_bi_CNTT_Ho_tro_ky_thuat.xlsx"
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { message: "Không tìm thấy file dữ liệu mẫu Excel tại: " + filePath },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

    // 1. Departments
    const deptSheet = workbook.Sheets["01_Danh_muc"];
    const rawDeptRows: any[] = XLSX.utils.sheet_to_json(deptSheet);
    const deptMap = new Map<string, string>();
    for (const r of rawDeptRows) {
      const code = r["Mã bộ phận"] ? String(r["Mã bộ phận"]).trim() : "";
      const name = r["Tên bộ phận"] ? String(r["Tên bộ phận"]).trim() : "";
      if (code && name && !deptMap.has(code)) {
        deptMap.set(code, name);
      }
    }

    const deptBreakdown = { read: rawDeptRows.length, unique: deptMap.size, created: 0, updated: 0, skipped: 0, errors: 0 };
    for (const [code, name] of deptMap.entries()) {
      try {
        const existing = await prisma.department.findUnique({ where: { code } });
        if (existing) {
          if (existing.name !== name) {
            await prisma.department.update({ where: { code }, data: { name } });
            deptBreakdown.updated++;
          } else {
            deptBreakdown.skipped++;
          }
        } else {
          await prisma.department.create({ data: { code, name } });
          deptBreakdown.created++;
        }
      } catch (e) {
        deptBreakdown.errors++;
      }
    }

    // 2. Categories
    const devCats = new Set<string>();
    const ticketCats = new Set<string>();
    for (const r of rawDeptRows) {
      if (r["Loại thiết bị CNTT"]) devCats.add(String(r["Loại thiết bị CNTT"]).trim());
      if (r["Nhóm sự cố"]) ticketCats.add(String(r["Nhóm sự cố"]).trim());
    }

    const devCatBreakdown = { read: rawDeptRows.length, unique: devCats.size, created: 0, updated: 0, skipped: 0, errors: 0 };
    for (const name of devCats) {
      try {
        const existing = await prisma.deviceCategory.findUnique({ where: { name } });
        if (!existing) {
          await prisma.deviceCategory.create({ data: { name } });
          devCatBreakdown.created++;
        } else {
          devCatBreakdown.skipped++;
        }
      } catch (e) {
        devCatBreakdown.errors++;
      }
    }

    const ticketCatBreakdown = { read: rawDeptRows.length, unique: ticketCats.size, created: 0, updated: 0, skipped: 0, errors: 0 };
    for (const name of ticketCats) {
      try {
        const existing = await prisma.ticketCategory.findUnique({ where: { name } });
        if (!existing) {
          await prisma.ticketCategory.create({ data: { name } });
          ticketCatBreakdown.created++;
        } else {
          ticketCatBreakdown.skipped++;
        }
      } catch (e) {
        ticketCatBreakdown.errors++;
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    await logAuditEvent({
      actorId: adminUser.id,
      actorName: adminUser.fullName,
      actorRole: adminUser.role,
      action: "IMPORT_SYNC",
      entityType: "DATABASE",
      description: `Đồng bộ dữ liệu nền từ Excel hoàn tất trong ${elapsed}s`,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({
      message: `Đồng bộ hoàn tất thành công trong ${elapsed} giây!`,
      elapsedSeconds: Number(elapsed),
      breakdown: {
        departments: deptBreakdown,
        deviceCategories: devCatBreakdown,
        ticketCategories: ticketCatBreakdown,
      },
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Lỗi đồng bộ dữ liệu Excel:", err);
    return NextResponse.json(
      { message: "Đồng bộ thất bại", error: String(err) },
      { status: 500 }
    );
  }
}
