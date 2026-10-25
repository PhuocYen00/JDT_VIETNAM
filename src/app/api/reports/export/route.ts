import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import * as XLSX from "xlsx";
import { generateReportPdf } from "@/lib/pdf-generator";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "IT_SUPPORT"]);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "devices"; // devices | tickets | maintenance | inventory
    const format = searchParams.get("format") || "xlsx"; // xlsx | pdf | csv

    // Common Filters
    const departmentId = searchParams.get("departmentId") || "";
    const status = searchParams.get("status") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const priority = searchParams.get("priority") || "";
    const condition = searchParams.get("condition") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    let reportTitle = "";
    let filenamePrefix = "";
    let sheetName = "";
    let filterParts: string[] = [];
    let summaryText = "";

    let headers: string[] = [];
    let tableRows: (string | number)[][] = [];
    let sheetData: any[] = [];

    // =========================================================================
    // 1. BÁO CÁO THIẾT BỊ CNTT
    // =========================================================================
    if (type === "devices") {
      reportTitle = "Báo cáo Danh mục Thiết bị CNTT";
      filenamePrefix = "Bao_cao_Thiet_bi_CNTT";
      sheetName = "Thiet_bi_CNTT";

      const where: any = {};
      if (departmentId) where.departmentId = departmentId;
      if (categoryId) where.categoryId = categoryId;
      if (status) where.status = status;
      if (condition) where.condition = condition;
      if (from || to) {
        where.purchaseDate = {};
        if (from) where.purchaseDate.gte = new Date(from);
        if (to) where.purchaseDate.lte = new Date(to + "T23:59:59.999Z");
      }

      const devices = await prisma.device.findMany({
        where,
        orderBy: { code: "asc" },
        include: {
          category: { select: { name: true } },
          department: { select: { name: true } },
          assignedUser: { select: { fullName: true, employeeCode: true } },
        },
      });

      headers = [
        "Mã TB",
        "Loại thiết bị",
        "Hãng / Model",
        "Số Serial",
        "Phòng ban",
        "Người sử dụng",
        "Trạng thái",
        "Tình trạng",
        "Vị trí",
        "Ngày mua",
      ];

      tableRows = devices.map((d) => [
        d.code,
        d.category.name,
        `${d.brand} ${d.model}`,
        d.serial || "—",
        d.department.name,
        d.assignedUser ? `${d.assignedUser.fullName} (${d.assignedUser.employeeCode})` : "Chưa bàn giao",
        d.status,
        d.condition || "Bình thường",
        d.location || "Văn phòng",
        d.purchaseDate ? d.purchaseDate.toISOString().split("T")[0] : "—",
      ]);

      sheetData = devices.map((d) => ({
        "Mã thiết bị": d.code,
        "Loại thiết bị": d.category.name,
        "Hãng": d.brand,
        "Model": d.model,
        "Số Serial": d.serial || "",
        "Phòng ban": d.department.name,
        "Người sử dụng": d.assignedUser
          ? `${d.assignedUser.fullName} (${d.assignedUser.employeeCode})`
          : "Chưa bàn giao",
        "Trạng thái": d.status,
        "Tình trạng": d.condition || "",
        "Vị trí": d.location || "",
        "Ngày mua": d.purchaseDate ? d.purchaseDate.toISOString().split("T")[0] : "",
        "Hết hạn bảo hành": d.warrantyEndDate ? d.warrantyEndDate.toISOString().split("T")[0] : "",
      }));

      filterParts.push(`Phòng ban: ${departmentId ? "Đã lọc" : "Tất cả"}`);
      if (status) filterParts.push(`Trạng thái: ${status}`);
      if (condition) filterParts.push(`Tình trạng: ${condition}`);
      summaryText = `Tổng số thiết bị: ${devices.length} bản ghi | Đang sử dụng: ${
        devices.filter((d) => d.status === "Đang sử dụng").length
      } | Dự phòng/Khác: ${devices.filter((d) => d.status !== "Đang sử dụng").length}`;
    }

    // =========================================================================
    // 2. BÁO CÁO YÊU CẦU HỖ TRỢ (TICKETS)
    // =========================================================================
    else if (type === "tickets") {
      reportTitle = "Báo cáo Yêu cầu Hỗ trợ Kỹ thuật (Tickets)";
      filenamePrefix = "Bao_cao_Yeu_cau_ho_tro";
      sheetName = "Yeu_cau_ho_tro";

      const where: any = {};
      if (departmentId) where.departmentId = departmentId;
      if (categoryId) where.categoryId = categoryId;
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (from || to) {
        where.receivedAt = {};
        if (from) where.receivedAt.gte = new Date(from);
        if (to) where.receivedAt.lte = new Date(to + "T23:59:59.999Z");
      }

      const tickets = await prisma.ticket.findMany({
        where,
        orderBy: { receivedAt: "desc" },
        include: {
          requester: { select: { fullName: true, employeeCode: true } },
          department: { select: { name: true } },
          device: { select: { code: true } },
          category: { select: { name: true } },
          assignee: { select: { fullName: true, employeeCode: true } },
        },
      });

      headers = [
        "Mã YC",
        "Tiếp nhận",
        "Người yêu cầu",
        "Phòng ban",
        "Sự cố",
        "Thiết bị",
        "Ưu tiên",
        "Trạng thái",
        "Người xử lý",
        "TG (h)",
        "Đánh giá",
      ];

      tableRows = tickets.map((t) => [
        t.code,
        t.receivedAt.toISOString().slice(0, 10),
        t.requester.fullName,
        t.department.name,
        t.category.name,
        t.device?.code || "—",
        t.priority,
        t.status,
        t.assignee ? t.assignee.fullName : "Chưa nhận",
        t.resolutionHours ?? "—",
        t.rating ? `${t.rating}★` : "—",
      ]);

      sheetData = tickets.map((t) => ({
        "Mã yêu cầu": t.code,
        "Thời điểm tiếp nhận": t.receivedAt.toISOString().replace("T", " ").slice(0, 19),
        "Người yêu cầu": `${t.requester.fullName} (${t.requester.employeeCode})`,
        "Phòng ban": t.department.name,
        "Mã thiết bị": t.device?.code || "",
        "Nhóm sự cố": t.category.name,
        "Mô tả sự cố": t.description,
        "Mức ưu tiên": t.priority,
        "Trạng thái": t.status,
        "Người phụ trách": t.assignee ? `${t.assignee.fullName} (${t.assignee.employeeCode})` : "",
        "Thời gian xử lý (h)": t.resolutionHours ?? "",
        "Thời điểm hoàn thành": t.completedAt ? t.completedAt.toISOString().replace("T", " ").slice(0, 19) : "",
        "Kết quả xử lý": t.resolution || "",
        "Đánh giá sao": t.rating ? `${t.rating}/5` : "",
      }));

      filterParts.push(`Phòng ban: ${departmentId ? "Đã lọc" : "Tất cả"}`);
      if (status) filterParts.push(`Trạng thái: ${status}`);
      if (priority) filterParts.push(`Ưu tiên: ${priority}`);
      if (from || to) filterParts.push(`Thời gian: ${from || "—"} đến ${to || "—"}`);

      const completed = tickets.filter((t) => t.status === "Hoàn thành").length;
      summaryText = `Tổng số ticket: ${tickets.length} | Hoàn thành: ${completed} (${
        tickets.length > 0 ? ((completed / tickets.length) * 100).toFixed(1) : 0
      }%) | Đang mở: ${tickets.length - completed}`;
    }

    // =========================================================================
    // 3. BÁO CÁO BẢO TRÌ & SỬA CHỮA
    // =========================================================================
    else if (type === "maintenance") {
      reportTitle = "Báo cáo Bảo trì, Sửa chữa & Chi phí";
      filenamePrefix = "Bao_cao_Bao_tri_sua_chua";
      sheetName = "Bao_tri_sua_chua";

      const where: any = {};
      if (departmentId) where.device = { departmentId };
      if (from || to) {
        where.performedAt = {};
        if (from) where.performedAt.gte = new Date(from);
        if (to) where.performedAt.lte = new Date(to + "T23:59:59.999Z");
      }

      const maintenance = await prisma.maintenance.findMany({
        where,
        orderBy: { performedAt: "desc" },
        include: {
          device: {
            select: {
              code: true,
              category: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
          performer: { select: { fullName: true, employeeCode: true } },
        },
      });

      headers = [
        "Mã BT",
        "Mã TB",
        "Loại thiết bị",
        "Phòng ban",
        "Ngày thực hiện",
        "Loại công việc",
        "Người thực hiện",
        "Kết quả",
        "Chi phí (VNĐ)",
      ];

      tableRows = maintenance.map((m) => [
        m.code,
        m.device.code,
        m.device.category.name,
        m.device.department.name,
        m.performedAt.toISOString().split("T")[0],
        m.maintenanceType,
        m.performer.fullName,
        m.result,
        Number(m.cost).toLocaleString("vi-VN"),
      ]);

      sheetData = maintenance.map((m) => ({
        "Mã bảo trì": m.code,
        "Mã thiết bị": m.device.code,
        "Loại thiết bị": m.device.category.name,
        "Phòng ban": m.device.department.name,
        "Ngày thực hiện": m.performedAt.toISOString().split("T")[0],
        "Loại công việc": m.maintenanceType,
        "Người thực hiện": `${m.performer.fullName} (${m.performer.employeeCode})`,
        "Kết quả": m.result,
        "Chi phí (VNĐ)": Number(m.cost),
        "Ngày kiểm tra tiếp theo": m.nextCheckAt ? m.nextCheckAt.toISOString().split("T")[0] : "",
      }));

      const totalCost = maintenance.reduce((sum, m) => sum + Number(m.cost), 0);
      summaryText = `Tổng số lượt bảo trì: ${maintenance.length} | Tổng chi phí phụ tùng/sửa chữa: ${totalCost.toLocaleString(
        "vi-VN"
      )} VNĐ`;
    }

    // =========================================================================
    // 4. BÁO CÁO KHO LINH KIỆN
    // =========================================================================
    else if (type === "inventory") {
      reportTitle = "Báo cáo Tồn kho & Danh mục Linh kiện";
      filenamePrefix = "Bao_cao_Kho_linh_kien";
      sheetName = "Kho_linh_kien";

      const parts = await prisma.part.findMany({
        orderBy: { code: "asc" },
      });

      let filteredParts = parts;
      if (status === "low_stock") {
        filteredParts = parts.filter((p) => p.stockQuantity <= p.minimumStock);
        filterParts.push("Trạng thái tồn: CẢNH BÁO TỒN THẤP");
      } else if (status === "in_stock") {
        filteredParts = parts.filter((p) => p.stockQuantity > p.minimumStock);
        filterParts.push("Trạng thái tồn: ĐỦ TỒN AN TOÀN");
      } else {
        filterParts.push("Trạng thái tồn: TẤT CẢ");
      }

      headers = [
        "Mã LK",
        "Tên linh kiện",
        "ĐVT",
        "Tồn kho",
        "Mức tối thiểu",
        "Tình trạng tồn",
        "Đơn giá (VNĐ)",
        "Giá trị tồn (VNĐ)",
        "Vị trí lưu",
      ];

      tableRows = filteredParts.map((p) => [
        p.code,
        p.name,
        p.unit,
        p.stockQuantity,
        p.minimumStock,
        p.stockQuantity <= p.minimumStock ? "CẢNH BÁO THẤP" : "Bình thường",
        Number(p.unitPrice).toLocaleString("vi-VN"),
        (p.stockQuantity * Number(p.unitPrice)).toLocaleString("vi-VN"),
        p.storageLocation || "Kho chính",
      ]);

      sheetData = filteredParts.map((p) => ({
        "Mã linh kiện": p.code,
        "Tên linh kiện": p.name,
        "Đơn vị tính": p.unit,
        "Số lượng tồn": p.stockQuantity,
        "Mức tồn tối thiểu": p.minimumStock,
        "Tình trạng tồn kho": p.stockQuantity <= p.minimumStock ? "CẢNH BÁO TỒN THẤP" : "Bình thường",
        "Đơn giá (VNĐ)": Number(p.unitPrice),
        "Tổng giá trị tồn (VNĐ)": p.stockQuantity * Number(p.unitPrice),
        "Vị trí lưu": p.storageLocation || "",
      }));

      const totalVal = filteredParts.reduce((sum, p) => sum + p.stockQuantity * Number(p.unitPrice), 0);
      const lowCount = filteredParts.filter((p) => p.stockQuantity <= p.minimumStock).length;
      summaryText = `Tổng chủng loại: ${filteredParts.length} | Linh kiện tồn thấp: ${lowCount} | Tổng giá trị tồn: ${totalVal.toLocaleString(
        "vi-VN"
      )} VNĐ`;
    } else {
      return NextResponse.json({ message: "Loại báo cáo không hợp lệ" }, { status: 400 });
    }

    const dateSuffix = new Date().toISOString().slice(0, 10);
    const filterDesc = filterParts.length > 0 ? filterParts.join(" | ") : "Tất cả dữ liệu";

    // Ghi AuditLog
    await logAuditEvent({
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      action: "EXPORT_REPORT",
      entityType: "SYSTEM",
      description: `Xuất ${reportTitle} (Định dạng: ${format.toUpperCase()}, Tổng dòng: ${tableRows.length}, Bộ lọc: ${filterDesc})`,
    });

    // =========================================================================
    // XUẤT ĐỊNH DẠNG PDF (.pdf)
    // =========================================================================
    if (format === "pdf") {
      const pdfBuffer = generateReportPdf({
        reportTitle,
        filterDescription: filterDesc,
        summaryText,
        headers,
        rows: tableRows,
        orientation: "landscape",
      });

      const filename = `${filenamePrefix}_${dateSuffix}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    }

    // =========================================================================
    // XUẤT ĐỊNH DẠNG CSV (.csv)
    // =========================================================================
    if (format === "csv") {
      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      const csvWithBOM = "\uFEFF" + csvContent;
      const filename = `${filenamePrefix}_${dateSuffix}.csv`;

      return new NextResponse(csvWithBOM, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    }

    // =========================================================================
    // XUẤT ĐỊNH DẠNG EXCEL (.xlsx)
    // =========================================================================
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    if (sheetData.length > 0) {
      const colWidths = Object.keys(sheetData[0]).map((key) => {
        const maxLen = Math.max(
          key.length,
          ...sheetData.slice(0, 100).map((row) => String(row[key] || "").length)
        );
        return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
      });
      worksheet["!cols"] = colWidths;
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const filename = `${filenamePrefix}_${dateSuffix}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Lỗi xuất báo cáo:", err);
    return NextResponse.json({ message: "Xuất báo cáo thất bại", error: String(err) }, { status: 500 });
  }
}
