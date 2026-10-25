import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const validTransitions: Record<string, string[]> = {
  "Mới tiếp nhận": ["Đang xử lý", "Tạm hoãn"],
  "Đang xử lý": ["Chờ phản hồi", "Tạm hoãn", "Hoàn thành"],
  "Chờ phản hồi": ["Đang xử lý", "Tạm hoãn", "Hoàn thành"],
  "Tạm hoãn": ["Đang xử lý", "Hoàn thành"],
  "Hoàn thành": ["Đang xử lý"], // Only ADMIN
};

const ticketUpdateSchema = z.object({
  status: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
  resolution: z.string().optional().nullable(),
  priority: z.enum(["Thấp", "Trung bình", "Cao", "Khẩn cấp"]).optional(),
  actionNote: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
      include: {
        category: true,
        department: true,
        device: {
          include: {
            category: true,
          },
        },
        requester: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            phone: true,
            title: true,
          },
        },
        assignee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            phone: true,
            title: true,
          },
        },
        histories: {
          orderBy: { happenedAt: "asc" },
          include: {
            actor: {
              select: {
                id: true,
                employeeCode: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: "Không tìm thấy yêu cầu hỗ trợ" }, { status: 404 });
    }

    // Role check: USER can only view their own ticket
    if (session.role === "USER" && ticket.requesterId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Bạn không có quyền truy cập yêu cầu này" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("GET /api/tickets/[id] error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi lấy chi tiết ticket" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const parsed = ticketUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const { status, assigneeId, resolution, priority, actionNote } = parsed.data;

    const existing = await prisma.ticket.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: { assignee: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Không tìm thấy yêu cầu hỗ trợ" }, { status: 404 });
    }

    // RBAC: USER cannot modify status/assignee
    if (session.role === "USER") {
      return NextResponse.json(
        { success: false, error: "Người dùng thông thường không có quyền cập nhật tiến trình ticket" },
        { status: 403 }
      );
    }

    // Validate workflow status transition
    if (status && status !== existing.status) {
      if (existing.status === "Hoàn thành" && session.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Chỉ Quản trị viên (ADMIN) mới có quyền mở lại ticket đã hoàn thành" },
          { status: 403 }
        );
      }

      const allowedNext = validTransitions[existing.status] || [];
      if (!allowedNext.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Quy trình không hợp lệ: Không thể chuyển từ [${existing.status}] sang [${status}]. Các trạng thái cho phép: ${allowedNext.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const historyEntries: {
      action: string;
      content: string;
    }[] = [];

    let completedAt = existing.completedAt;
    let resolutionHours = existing.resolutionHours;

    if (status && status !== existing.status) {
      if (status === "Hoàn thành") {
        completedAt = now;
        const diffMs = now.getTime() - new Date(existing.receivedAt).getTime();
        resolutionHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        historyEntries.push({
          action: "Hoàn thành",
          content: actionNote || `Hoàn tất xử lý yêu cầu (Thời gian xử lý: ${resolutionHours} giờ). Giải pháp: ${resolution || existing.resolution || "Đã giải quyết ổn định"}`,
        });
      } else {
        if (existing.status === "Hoàn thành") {
          // Re-opened by Admin
          completedAt = null;
          historyEntries.push({
            action: "Mở lại",
            content: actionNote || `Quản trị viên mở lại yêu cầu sang trạng thái [${status}].`,
          });
        } else {
          historyEntries.push({
            action: "Đổi trạng thái",
            content: actionNote || `Chuyển trạng thái từ [${existing.status}] sang [${status}].`,
          });
        }
      }
    }

    if (assigneeId !== undefined && assigneeId !== existing.assigneeId) {
      if (assigneeId) {
        const newAssignee = await prisma.user.findUnique({ where: { id: assigneeId } });
        historyEntries.push({
          action: "Phân công",
          content: `Phân công xử lý cho ${newAssignee ? `${newAssignee.fullName} (${newAssignee.employeeCode})` : "kỹ thuật viên"}`,
        });
      } else {
        historyEntries.push({
          action: "Hủy phân công",
          content: "Hủy gán người phụ trách xử lý yêu cầu",
        });
      }
    }

    if (resolution !== undefined && resolution !== existing.resolution && resolution) {
      historyEntries.push({
        action: "Cập nhật giải pháp",
        content: `Nội dung giải pháp/hướng xử lý: "${resolution}"`,
      });
    }

    if (priority && priority !== existing.priority) {
      historyEntries.push({
        action: "Đổi ưu tiên",
        content: `Điều chỉnh mức độ ưu tiên từ [${existing.priority}] sang [${priority}].`,
      });
    }

    // Execute update and history creation in single database transaction
    const updated = await prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.update({
        where: { id: existing.id },
        data: {
          ...(status && { status }),
          ...(assigneeId !== undefined && { assigneeId }),
          ...(resolution !== undefined && { resolution }),
          ...(priority && { priority }),
          completedAt,
          resolutionHours,
        },
        include: {
          category: true,
          department: true,
          device: true,
          requester: true,
          assignee: true,
        },
      });

      // Insert all generated TicketHistory entries
      for (const h of historyEntries) {
        const histCode = `LS${String(Date.now()).slice(-8)}_${Math.floor(Math.random() * 1000)}`;
        await tx.ticketHistory.create({
          data: {
            code: histCode,
            ticketId: ticket.id,
            happenedAt: now,
            action: h.action,
            content: h.content,
            actorId: session.id,
          },
        });
      }

      return ticket;
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Cập nhật yêu cầu hỗ trợ thành công",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("PUT /api/tickets/[id] error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi cập nhật ticket" }, { status: 500 });
  }
}
