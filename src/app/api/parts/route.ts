import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const partCreateSchema = z.object({
  code: z.string().min(1, "Mã linh kiện không được để trống").toUpperCase(),
  name: z.string().min(1, "Tên linh kiện không được để trống"),
  unit: z.string().default("Cái"),
  stockQuantity: z.number().int().min(0, "Số lượng tồn kho không được âm").default(0),
  minimumStock: z.number().int().min(0, "Mức tồn tối thiểu không được âm").default(5),
  unitPrice: z.number().min(0, "Đơn giá không được âm").default(0),
  storageLocation: z.string().optional().nullable(),
  status: z.string().default("Đang sử dụng"),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "IT_SUPPORT"]);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "10")));
    const search = (searchParams.get("search") || "").trim();
    const lowStock = searchParams.get("lowStock") === "true";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "code";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

    const where: Prisma.PartWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { storageLocation: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Low stock filter
    if (lowStock) {
      // In Prisma, compare column to column or fetch ids
      const lowStockParts = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "Part" WHERE "stockQuantity" <= "minimumStock"
      `;
      where.id = { in: lowStockParts.map((p) => p.id) };
    }

    const orderBy: Prisma.PartOrderByWithRelationInput = {};
    if (sortBy === "stockQuantity") {
      orderBy.stockQuantity = sortOrder;
    } else if (sortBy === "unitPrice") {
      orderBy.unitPrice = sortOrder;
    } else if (sortBy === "name") {
      orderBy.name = sortOrder;
    } else {
      orderBy.code = sortOrder;
    }

    const [total, items, lowStockCount] = await Promise.all([
      prisma.part.count({ where }),
      prisma.part.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM "Part" WHERE "stockQuantity" <= "minimumStock"
      `,
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
        lowStockCount: Number(lowStockCount[0]?.count || 0),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Không có quyền truy cập kho linh kiện" }, { status: 403 });
    }
    console.error("GET /api/parts error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi lấy danh sách linh kiện" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "IT_SUPPORT"]);

    const body = await req.json();
    const parsed = partCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await prisma.part.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Mã linh kiện ${data.code} đã tồn tại` },
        { status: 409 }
      );
    }

    const part = await prisma.part.create({
      data: {
        code: data.code,
        name: data.name,
        unit: data.unit,
        stockQuantity: data.stockQuantity,
        minimumStock: data.minimumStock,
        unitPrice: data.unitPrice,
        storageLocation: data.storageLocation || "Kho kỹ thuật",
        status: data.status,
      },
    });

    return NextResponse.json({
      success: true,
      data: part,
      message: "Thêm linh kiện mới thành công",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Không có quyền thực hiện thao tác" }, { status: 403 });
    }
    console.error("POST /api/parts error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi tạo linh kiện" }, { status: 500 });
  }
}
