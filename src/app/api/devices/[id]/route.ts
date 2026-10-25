import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const deviceUpdateSchema = z.object({
  categoryId: z.string().min(1, "Vui lòng chọn loại thiết bị").optional(),
  brand: z.string().min(1, "Vui lòng nhập hãng sản xuất").optional(),
  model: z.string().min(1, "Vui lòng nhập model").optional(),
  serial: z.string().optional().nullable(),
  departmentId: z.string().min(1, "Vui lòng chọn phòng ban").optional(),
  assignedUserId: z.string().optional().nullable(),
  status: z.string().optional(),
  purchaseDate: z.string().optional().nullable(),
  warrantyEndDate: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const device = await prisma.device.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
      include: {
        category: true,
        department: true,
        assignedUser: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            title: true,
            email: true,
            phone: true,
          },
        },
        tickets: {
          orderBy: { receivedAt: "desc" },
          take: 50,
          include: {
            category: true,
            requester: {
              select: {
                id: true,
                employeeCode: true,
                fullName: true,
              },
            },
            assignee: {
              select: {
                id: true,
                employeeCode: true,
                fullName: true,
              },
            },
          },
        },
        maintenances: {
          orderBy: { performedAt: "desc" },
          take: 50,
          include: {
            performer: {
              select: {
                id: true,
                employeeCode: true,
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
            maintenances: true,
          },
        },
      },
    });

    if (!device) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy thiết bị yêu cầu" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: device,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("GET /api/devices/[id] error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi lấy chi tiết thiết bị" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    if (session.role !== "ADMIN" && session.role !== "IT_SUPPORT") {
      return NextResponse.json({ success: false, error: "Bạn không có quyền chỉnh sửa thiết bị" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = deviceUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await prisma.device.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Không tìm thấy thiết bị" }, { status: 404 });
    }

    const updated = await prisma.device.update({
      where: { id: existing.id },
      data: {
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.brand && { brand: data.brand }),
        ...(data.model && { model: data.model }),
        ...(data.serial !== undefined && { serial: data.serial }),
        ...(data.departmentId && { departmentId: data.departmentId }),
        ...(data.assignedUserId !== undefined && { assignedUserId: data.assignedUserId }),
        ...(data.status && { status: data.status }),
        ...(data.purchaseDate !== undefined && {
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        }),
        ...(data.warrantyEndDate !== undefined && {
          warrantyEndDate: data.warrantyEndDate ? new Date(data.warrantyEndDate) : null,
        }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.condition !== undefined && { condition: data.condition }),
      },
      include: {
        category: true,
        department: true,
        assignedUser: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Cập nhật thiết bị thành công",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("PUT /api/devices/[id] error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi cập nhật thiết bị" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    if (session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Chỉ Quản trị viên (ADMIN) mới có quyền xóa thiết bị" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.device.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: {
        _count: {
          select: { tickets: true, maintenances: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Không tìm thấy thiết bị" }, { status: 404 });
    }

    if (existing._count.tickets > 0 || existing._count.maintenances > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Không thể xóa thiết bị đang có ${existing._count.tickets} yêu cầu hỗ trợ và ${existing._count.maintenances} lượt bảo trì liên kết. Hãy chuyển trạng thái sang "Ngừng sử dụng" thay vì xóa.`,
        },
        { status: 400 }
      );
    }

    await prisma.device.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa thiết bị thành công",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("DELETE /api/devices/[id] error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi xóa thiết bị" }, { status: 500 });
  }
}
