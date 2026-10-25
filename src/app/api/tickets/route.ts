import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const ticketCreateSchema = z.object({
  categoryId: z.string().min(1, "Vui lòng chọn nhóm sự cố"),
  deviceId: z.string().optional().nullable(),
  description: z.string().min(5, "Mô tả sự cố cần tối thiểu 5 ký tự"),
  priority: z.enum(["Thấp", "Trung bình", "Cao", "Khẩn cấp"]).default("Trung bình"),
  channel: z.string().default("Biểu mẫu nội bộ"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(5, parseInt(searchParams.get("pageSize") || "10")));
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const assigneeId = searchParams.get("assigneeId") || "";
    const sortBy = searchParams.get("sortBy") || "receivedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const onlyMine = searchParams.get("onlyMine") === "true";

    const where: Prisma.TicketWhereInput = {};

    // Role-based filtering: USER only sees their own requests
    if (session.role === "USER" || onlyMine) {
      where.requesterId = session.id;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { resolution: { contains: search, mode: "insensitive" } },
        { requester: { fullName: { contains: search, mode: "insensitive" } } },
        { requester: { employeeCode: { contains: search, mode: "insensitive" } } },
        { device: { code: { contains: search, mode: "insensitive" } } },
        { device: { model: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (assigneeId) {
      if (assigneeId === "unassigned") {
        where.assigneeId = null;
      } else {
        where.assigneeId = assigneeId;
      }
    }

    const orderBy: Prisma.TicketOrderByWithRelationInput = {};
    if (sortBy === "code") {
      orderBy.code = sortOrder;
    } else if (sortBy === "priority") {
      orderBy.priority = sortOrder;
    } else if (sortBy === "status") {
      orderBy.status = sortOrder;
    } else {
      orderBy.receivedAt = sortOrder;
    }

    const [total, items, categories, departments, assignees, statusGroups] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        include: {
          category: true,
          department: true,
          device: {
            select: {
              id: true,
              code: true,
              brand: true,
              model: true,
            },
          },
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
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.ticketCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.department.findMany({ orderBy: { code: "asc" } }),
      prisma.user.findMany({
        where: { role: { in: ["ADMIN", "IT_SUPPORT"] } },
        select: { id: true, employeeCode: true, fullName: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.ticket.groupBy({
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
          assignees,
          statuses: statusGroups.map((s) => ({ status: s.status, count: s._count.id })),
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("GET /api/tickets error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi lấy danh sách ticket" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = ticketCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    const { categoryId, deviceId, description, priority, channel } = parsed.data;

    // Generate unique code: YC + 5 digits
    const countTickets = await prisma.ticket.count();
    const nextSeq = countTickets + 1;
    const ticketCode = `YC${String(nextSeq).padStart(5, "0")}`;
    const historyCode = `LS${String(Date.now()).slice(-8)}`;

    const now = new Date();

    // Create ticket and initial TicketHistory atomically
    const newTicket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          code: ticketCode,
          receivedAt: now,
          requesterId: session.id,
          departmentId: session.departmentId,
          deviceId: deviceId || null,
          categoryId,
          description,
          priority,
          status: "Mới tiếp nhận",
          channel,
        },
        include: {
          category: true,
          department: true,
          device: true,
          requester: true,
        },
      });

      await tx.ticketHistory.create({
        data: {
          code: historyCode,
          ticketId: created.id,
          happenedAt: now,
          action: "Tiếp nhận",
          content: `Tạo mới yêu cầu hỗ trợ qua ${channel}. Nội dung: "${description.slice(0, 100)}${
            description.length > 100 ? "..." : ""
          }"`,
          actorId: session.id,
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      data: newTicket,
      message: "Tạo yêu cầu hỗ trợ thành công",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("POST /api/tickets error:", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ khi tạo ticket" }, { status: 500 });
  }
}
