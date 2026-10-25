import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const transactionCreateSchema = z.object({
  partId: z.string().min(1, "Vui lòng chọn linh kiện"),
  type: z.enum(["Nhập", "Xuất", "Điều chỉnh"]),
  quantity: z.number().int().min(1, "Số lượng phải lớn hơn 0"),
  reference: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "IT_SUPPORT"]);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "10")));
    const search = (searchParams.get("search") || "").trim();
    const partId = searchParams.get("partId") || "";
    const type = searchParams.get("type") || "";
    const sortBy = searchParams.get("sortBy") || "happenedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where: Prisma.InventoryTransactionWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
        { note: { contains: search, mode: "insensitive" } },
        { part: { code: { contains: search, mode: "insensitive" } } },
        { part: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (partId) {
      where.partId = partId;
    }

    if (type) {
      where.type = type;
    }

    const orderBy: Prisma.InventoryTransactionOrderByWithRelationInput = {};
    if (sortBy === "code") {
      orderBy.code = sortOrder;
    } else if (sortBy === "quantity") {
      orderBy.quantity = sortOrder;
    } else {
      orderBy.happenedAt = sortOrder;
    }

    const [total, items, typeGroups] = await Promise.all([
      prisma.inventoryTransaction.count({ where }),
      prisma.inventoryTransaction.findMany({
        where,
        include: {
          part: true,
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.inventoryTransaction.groupBy({
        by: ["type"],
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
          types: typeGroups.map((t) => ({ type: t.type, count: t._count.id })),
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Không có quyền truy cập lịch sử giao dịch kho" }, { status: 403 });
    }
    console.error("GET /api/inventory/transactions error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi lấy danh sách giao dịch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "IT_SUPPORT"]);

    const body = await req.json();
    const parsed = transactionCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const { partId, type, quantity, reference, note } = parsed.data;

    // QUY TẮC SỐNG CÒN: Giao dịch kho mới và cập nhật tồn phải chạy trong cùng prisma.$transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch current part
      const part = await tx.part.findUnique({
        where: { id: partId },
      });

      if (!part) {
        throw new Error("NOT_FOUND: Không tìm thấy linh kiện yêu cầu");
      }

      // 2. Validate stock for Export
      let newStock = part.stockQuantity;
      if (type === "Xuất") {
        if (part.stockQuantity < quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK: Số lượng xuất kho (${quantity}) vượt quá tồn kho hiện tại (${part.stockQuantity} ${part.unit})`
          );
        }
        newStock = part.stockQuantity - quantity;
      } else if (type === "Nhập") {
        newStock = part.stockQuantity + quantity;
      } else if (type === "Điều chỉnh") {
        newStock = quantity;
      }

      // 3. Update stock on part
      const updatedPart = await tx.part.update({
        where: { id: part.id },
        data: { stockQuantity: newStock },
      });

      // 4. Generate unique transaction code: GD + 5 digits
      const countTrans = await tx.inventoryTransaction.count();
      const nextSeq = countTrans + 1;
      const code = `GD${String(nextSeq).padStart(5, "0")}`;

      // 5. Create transaction record
      const transaction = await tx.inventoryTransaction.create({
        data: {
          code,
          happenedAt: new Date(),
          partId: part.id,
          type,
          quantity,
          reference: reference || null,
          note: note || null,
        },
        include: {
          part: true,
        },
      });

      return { transaction, updatedPart };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Tạo phiếu ${type} kho thành công. Tồn kho mới: ${result.updatedPart.stockQuantity} ${result.updatedPart.unit}.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message.startsWith("INSUFFICIENT_STOCK:")) {
      return NextResponse.json({ success: false, error: message.replace("INSUFFICIENT_STOCK: ", "") }, { status: 400 });
    }
    if (message.startsWith("NOT_FOUND:")) {
      return NextResponse.json({ success: false, error: message.replace("NOT_FOUND: ", "") }, { status: 404 });
    }
    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return NextResponse.json({ success: false, error: "Không có quyền thực hiện giao dịch kho" }, { status: 403 });
    }
    console.error("POST /api/inventory/transactions error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi tạo giao dịch kho" }, { status: 500 });
  }
}
