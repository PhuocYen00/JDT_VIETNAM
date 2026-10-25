import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const deviceCreateSchema = z.object({
  code: z.string().min(1, "Mã thiết bị không được để trống").toUpperCase(),
  categoryId: z.string().min(1, "Vui lòng chọn loại thiết bị"),
  brand: z.string().min(1, "Vui lòng nhập hãng sản xuất"),
  model: z.string().min(1, "Vui lòng nhập model"),
  serial: z.string().optional().nullable(),
  departmentId: z.string().min(1, "Vui lòng chọn phòng ban quản lý"),
  assignedUserId: z.string().optional().nullable(),
  status: z.string().default("Đang sử dụng"),
  purchaseDate: z.string().optional().nullable(),
  warrantyEndDate: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "10")));
    const search = (searchParams.get("search") || "").trim();
    const categoryId = searchParams.get("categoryId") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "code";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

    const where: Prisma.DeviceWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { serial: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { assignedUser: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status) {
      where.status = status;
    }

    const orderBy: Prisma.DeviceOrderByWithRelationInput = {};
    if (sortBy === "purchaseDate") {
      orderBy.purchaseDate = sortOrder;
    } else if (sortBy === "brand") {
      orderBy.brand = sortOrder;
    } else if (sortBy === "status") {
      orderBy.status = sortOrder;
    } else {
      orderBy.code = sortOrder;
    }

    const [total, items, categories, departments, statusGroups] = await Promise.all([
      prisma.device.count({ where }),
      prisma.device.findMany({
        where,
        include: {
          category: true,
          department: true,
          assignedUser: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.deviceCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.department.findMany({ orderBy: { code: "asc" } }),
      prisma.device.groupBy({
        by: ["status"],
        _count: { id: true },
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
          categories,
          departments,
          statuses: statusGroups.map((s) => ({ status: s.status, count: s._count.id })),
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("GET /api/devices error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi lấy danh sách thiết bị" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (session.role !== "ADMIN" && session.role !== "IT_SUPPORT") {
      return NextResponse.json({ success: false, error: "Bạn không có quyền thêm thiết bị mới" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = deviceCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check unique code
    const existing = await prisma.device.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Mã thiết bị ${data.code} đã tồn tại trong hệ thống` },
        { status: 409 }
      );
    }

    const device = await prisma.device.create({
      data: {
        code: data.code,
        categoryId: data.categoryId,
        brand: data.brand,
        model: data.model,
        serial: data.serial || null,
        departmentId: data.departmentId,
        assignedUserId: data.assignedUserId || null,
        status: data.status,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        warrantyEndDate: data.warrantyEndDate ? new Date(data.warrantyEndDate) : null,
        location: data.location || null,
        condition: data.condition || null,
      },
      include: {
        category: true,
        department: true,
        assignedUser: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: device,
      message: "Thêm mới thiết bị thành công",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("POST /api/devices error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi tạo thiết bị" }, { status: 500 });
  }
}
