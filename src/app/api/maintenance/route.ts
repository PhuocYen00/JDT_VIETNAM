import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const maintenanceCreateSchema = z.object({
  deviceId: z.string().min(1, "Vui lòng chọn thiết bị"),
  performedAt: z.string().min(1, "Vui lòng chọn ngày thực hiện"),
  maintenanceType: z.string().min(1, "Vui lòng chọn loại công việc"),
  performerId: z.string().min(1, "Vui lòng chọn kỹ thuật viên thực hiện"),
  result: z.string().min(1, "Vui lòng nhập kết quả kiểm tra"),
  cost: z.number().min(0, "Chi phí không được âm").default(0),
  nextCheckAt: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "IT_SUPPORT"]);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "10")));
    const search = (searchParams.get("search") || "").trim();
    const maintenanceType = searchParams.get("maintenanceType") || "";
    const deviceId = searchParams.get("deviceId") || "";
    const performerId = searchParams.get("performerId") || "";
    const sortBy = searchParams.get("sortBy") || "performedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where: Prisma.MaintenanceWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { result: { contains: search, mode: "insensitive" } },
        { device: { code: { contains: search, mode: "insensitive" } } },
        { device: { brand: { contains: search, mode: "insensitive" } } },
        { device: { model: { contains: search, mode: "insensitive" } } },
        { performer: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (maintenanceType) {
      where.maintenanceType = maintenanceType;
    }

    if (deviceId) {
      where.deviceId = deviceId;
    }

    if (performerId) {
      where.performerId = performerId;
    }

    const orderBy: Prisma.MaintenanceOrderByWithRelationInput = {};
    if (sortBy === "code") {
      orderBy.code = sortOrder;
    } else if (sortBy === "cost") {
      orderBy.cost = sortOrder;
    } else {
      orderBy.performedAt = sortOrder;
    }

    const [total, items, typeGroups, performers] = await Promise.all([
      prisma.maintenance.count({ where }),
      prisma.maintenance.findMany({
        where,
        include: {
          device: {
            include: {
              category: true,
              department: true,
            },
          },
          performer: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.maintenance.groupBy({
        by: ["maintenanceType"],
        _count: { id: true },
      }),
      prisma.user.findMany({
        where: { role: { in: ["ADMIN", "IT_SUPPORT"] } },
        select: { id: true, employeeCode: true, fullName: true },
        orderBy: { fullName: "asc" },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages,
        filterOptions: {
          types: typeGroups.map((t) => ({ type: t.maintenanceType, count: t._count.id })),
          performers,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Không có quyền truy cập module bảo trì" }, { status: 403 });
    }
    console.error("GET /api/maintenance error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi lấy danh sách bảo trì" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "IT_SUPPORT"]);

    const body = await req.json();
    const parsed = maintenanceCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Generate unique code: BT + 5 digits
    const countMaint = await prisma.maintenance.count();
    const nextSeq = countMaint + 1;
    const code = `BT${String(nextSeq).padStart(5, "0")}`;

    const maintenance = await prisma.maintenance.create({
      data: {
        code,
        deviceId: data.deviceId,
        performedAt: new Date(data.performedAt),
        maintenanceType: data.maintenanceType,
        performerId: data.performerId,
        result: data.result,
        cost: data.cost,
        nextCheckAt: data.nextCheckAt ? new Date(data.nextCheckAt) : null,
      },
      include: {
        device: true,
        performer: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: maintenance,
      message: "Ghi nhận phiếu bảo trì thành công",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Không có quyền thực hiện thao tác" }, { status: 403 });
    }
    console.error("POST /api/maintenance error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi tạo phiếu bảo trì" }, { status: 500 });
  }
}
