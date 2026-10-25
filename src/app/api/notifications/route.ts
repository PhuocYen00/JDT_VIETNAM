import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth();

    // Lấy thông báo lưu trong DB
    let notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Nếu chưa có thông báo trong DB, tự động sinh các thông báo ngữ cảnh thời gian thực
    if (notifications.length === 0) {
      const generatedList: any[] = [];

      if (session.role === "ADMIN" || session.role === "IT_SUPPORT") {
        // Cảnh báo tồn kho thấp
        const lowStockCount = await prisma.part.count({
          where: { stockQuantity: { lte: prisma.part.fields.minimumStock } },
        });
        if (lowStockCount > 0) {
          generatedList.push({
            title: "Cảnh báo linh kiện tồn thấp",
            message: `Hệ thống ghi nhận có ${lowStockCount} loại linh kiện đang dưới định mức an toàn.`,
            link: "/inventory/parts",
          });
        }

        // Ticket khẩn cấp
        const urgentTickets = await prisma.ticket.count({
          where: { priority: "Khẩn cấp", status: { in: ["Mới tiếp nhận", "Đang xử lý"] } },
        });
        if (urgentTickets > 0) {
          generatedList.push({
            title: "Yêu cầu hỗ trợ Khẩn cấp",
            message: `Hiện có ${urgentTickets} yêu cầu hỗ trợ kỹ thuật mức độ KHẨN CẤP cần xử lý.`,
            link: "/tickets",
          });
        }
      }

      // Ticket mới nhất của user
      const userTickets = await prisma.ticket.findMany({
        where: { requesterId: session.id },
        orderBy: { receivedAt: "desc" },
        take: 2,
      });
      userTickets.forEach((t) => {
        generatedList.push({
          title: `Cập nhật Ticket ${t.code}`,
          message: `Yêu cầu của bạn đang ở trạng thái: ${t.status}`,
          link: `/tickets/${t.id}`,
        });
      });

      // Tạo vào DB cho user
      for (const item of generatedList) {
        const created = await prisma.notification.create({
          data: {
            userId: session.id,
            title: item.title,
            message: item.message,
            link: item.link,
          },
        });
        notifications.push(created);
      }
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("Lỗi lấy thông báo:", err);
    return NextResponse.json({ message: "Lỗi lấy thông báo" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { id, markAllAsRead } = body;

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId: session.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ message: "Đã đánh dấu tất cả là đã đọc" });
    }

    if (id) {
      await prisma.notification.update({
        where: { id, userId: session.id },
        data: { isRead: true },
      });
      return NextResponse.json({ message: "Đã đánh dấu đã đọc" });
    }

    return NextResponse.json({ message: "Yêu cầu không hợp lệ" }, { status: 400 });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("Lỗi cập nhật thông báo:", err);
    return NextResponse.json({ message: "Lỗi cập nhật thông báo" }, { status: 500 });
  }
}
