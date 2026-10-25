import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const rateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const body = await req.json();
    const parsed = rateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Đánh giá không hợp lệ (thang điểm từ 1 đến 5 sao)" },
        { status: 400 }
      );
    }

    const { rating, feedback } = parsed.data;

    const existing = await prisma.ticket.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Không tìm thấy yêu cầu hỗ trợ" }, { status: 404 });
    }

    if (existing.status !== "Hoàn thành") {
      return NextResponse.json(
        { success: false, error: "Chỉ có thể đánh giá chất lượng sau khi yêu cầu đã hoàn thành" },
        { status: 400 }
      );
    }

    // Role check: Only requester or Admin can rate
    if (session.role === "USER" && existing.requesterId !== session.id) {
      return NextResponse.json(
        { success: false, error: "Bạn chỉ có thể đánh giá yêu cầu do chính mình tạo" },
        { status: 403 }
      );
    }

    const now = new Date();
    const histCode = `LS${String(Date.now()).slice(-8)}_${Math.floor(Math.random() * 1000)}`;

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.ticket.update({
        where: { id: existing.id },
        data: { rating },
      });

      await tx.ticketHistory.create({
        data: {
          code: histCode,
          ticketId: t.id,
          happenedAt: now,
          action: "Đánh giá sao",
          content: `Người dùng gửi đánh giá mức độ hài lòng: ${rating}/5 sao.${
            feedback ? ` Nhận xét: "${feedback}"` : ""
          }`,
          actorId: session.id,
        },
      });

      return t;
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Cảm ơn bạn đã gửi đánh giá chất lượng hỗ trợ",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("POST /api/tickets/[id]/rate error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi lưu đánh giá" }, { status: 500 });
  }
}
