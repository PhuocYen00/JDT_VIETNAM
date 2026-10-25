import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId") || undefined;
    const status = searchParams.get("status") || undefined;
    const timeRange = searchParams.get("timeRange") || undefined;

    // Thiết lập điều kiện lọc linh hoạt cho Ticket
    const ticketWhere: any = {};
    if (departmentId) ticketWhere.departmentId = departmentId;
    if (status) ticketWhere.status = status;

    if (timeRange && timeRange !== "all") {
      const now = new Date();
      if (timeRange === "30d") {
        ticketWhere.receivedAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      } else if (timeRange === "90d") {
        ticketWhere.receivedAt = { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
      } else if (timeRange === "180d") {
        ticketWhere.receivedAt = { gte: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) };
      } else if (timeRange === "365d" || timeRange === "1y") {
        ticketWhere.receivedAt = { gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
      } else if (timeRange === "2026") {
        ticketWhere.receivedAt = {
          gte: new Date("2026-01-01T00:00:00.000Z"),
          lte: new Date("2026-12-31T23:59:59.999Z"),
        };
      } else if (timeRange === "2025") {
        ticketWhere.receivedAt = {
          gte: new Date("2025-01-01T00:00:00.000Z"),
          lte: new Date("2025-12-31T23:59:59.999Z"),
        };
      }
    }

    // Điều kiện lọc cho thiết bị & bảo trì theo phòng ban
    const deviceWhere: any = {};
    if (departmentId) deviceWhere.departmentId = departmentId;

    const maintenanceWhere: any = {};
    if (departmentId) maintenanceWhere.device = { departmentId };

    // 1. Thống kê tổng quan (KPIs)
    const [
      totalDevices,
      activeDevices,
      maintenanceDevices,
      totalTickets,
      completedTickets,
      statusCounts,
      totalMaintenance,
      maintenanceCostAgg,
      totalParts,
      recentTickets,
      categoryCounts,
      deptTicketCounts,
      allParts,
    ] = await Promise.all([
      prisma.device.count({ where: deviceWhere }),
      prisma.device.count({ where: { ...deviceWhere, status: "Đang sử dụng" } }),
      prisma.device.count({ where: { ...deviceWhere, status: { in: ["Đang sửa chữa", "Hỏng"] } } }),
      prisma.ticket.count({ where: ticketWhere }),
      prisma.ticket.count({ where: { ...ticketWhere, status: "Hoàn thành" } }),
      prisma.ticket.groupBy({
        by: ["status"],
        where: departmentId || ticketWhere.receivedAt ? { departmentId, receivedAt: ticketWhere.receivedAt } : undefined,
        _count: { _all: true },
      }),
      prisma.maintenance.count({ where: maintenanceWhere }),
      prisma.maintenance.aggregate({
        where: maintenanceWhere,
        _sum: { cost: true },
      }),
      prisma.part.count(),
      prisma.ticket.findMany({
        where: ticketWhere,
        take: 6,
        orderBy: { receivedAt: "desc" },
        include: {
          requester: { select: { fullName: true, department: { select: { name: true } } } },
          category: { select: { name: true } },
        },
      }),
      prisma.ticket.groupBy({
        by: ["categoryId"],
        where: ticketWhere,
        _count: { _all: true },
        orderBy: { _count: { categoryId: "desc" } },
        take: 8,
      }),
      prisma.ticket.groupBy({
        by: ["departmentId"],
        where: status || ticketWhere.receivedAt ? { status, receivedAt: ticketWhere.receivedAt } : undefined,
        _count: { _all: true },
        orderBy: { _count: { departmentId: "desc" } },
        take: 6,
      }),
      prisma.part.findMany({
        select: { id: true, code: true, name: true, stockQuantity: true, minimumStock: true, unit: true, storageLocation: true },
      }),
    ]);

    // Lọc linh kiện sắp hết hàng (stockQuantity <= minimumStock)
    const lowStockPartsList = allParts
      .filter((p) => p.stockQuantity <= p.minimumStock)
      .sort((a, b) => a.stockQuantity - b.stockQuantity);
    const lowStockCount = lowStockPartsList.length;

    // Lấy tên cho category và department
    const [categories, departments] = await Promise.all([
      prisma.ticketCategory.findMany(),
      prisma.department.findMany(),
    ]);

    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const deptMap = new Map(departments.map((d) => [d.id, d.name]));

    const ticketsByCategory = categoryCounts.map((c) => ({
      name: catMap.get(c.categoryId) || "Khác",
      count: c._count._all,
    }));

    const ticketsByDepartment = deptTicketCounts.map((d) => ({
      name: deptMap.get(d.departmentId) || "Khác",
      count: d._count._all,
    }));

    // Màu sắc cho trạng thái ticket
    const statusColorMap: Record<string, string> = {
      "Hoàn thành": "#10b981", // emerald-500
      "Đang xử lý": "#3b82f6", // blue-500
      "Chờ phản hồi": "#f59e0b", // amber-500
      "Mới tiếp nhận": "#6366f1", // indigo-500
      "Tạm hoãn": "#94a3b8", // slate-400
    };

    const ticketsByStatus = statusCounts.map((s) => ({
      name: s.status,
      value: s._count._all,
      color: statusColorMap[s.status] || "#64748b",
    }));

    // Thống kê theo tháng (lọc theo phòng ban nếu có)
    const allTicketsDates = await prisma.ticket.findMany({
      where: departmentId ? { departmentId } : undefined,
      select: { receivedAt: true, status: true },
    });

    const monthlyMap = new Map<string, { received: number; completed: number }>();
    allTicketsDates.forEach((t) => {
      const d = new Date(t.receivedAt);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap.has(mKey)) {
        monthlyMap.set(mKey, { received: 0, completed: 0 });
      }
      const entry = monthlyMap.get(mKey)!;
      entry.received += 1;
      if (t.status === "Hoàn thành") {
        entry.completed += 1;
      }
    });

    // Sắp xếp theo thứ tự thời gian và lấy 12 tháng gần nhất
    const sortedMonths = Array.from(monthlyMap.keys()).sort();
    const ticketsTrend = sortedMonths.slice(-12).map((m) => {
      const [year, month] = m.split("-");
      const val = monthlyMap.get(m)!;
      return {
        month: `T${parseInt(month)}/${year.slice(2)}`,
        received: val.received,
        completed: val.completed,
      };
    });

    const openTickets = totalTickets - completedTickets;
    const completionRate = totalTickets > 0 ? ((completedTickets / totalTickets) * 100).toFixed(1) : "0";

    return NextResponse.json({
      departments: departments.map((d) => ({ id: d.id, name: d.name })),
      kpis: {
        devices: {
          total: totalDevices,
          active: activeDevices,
          maintenance: maintenanceDevices,
          spare: totalDevices - activeDevices - maintenanceDevices,
        },
        tickets: {
          total: totalTickets,
          completed: completedTickets,
          open: openTickets,
          completionRate: Number(completionRate),
        },
        maintenance: {
          total: totalMaintenance,
          totalCost: Number(maintenanceCostAgg._sum.cost || 0),
        },
        inventory: {
          totalParts,
          lowStockCount,
        },
      },
      charts: {
        ticketsByStatus,
        ticketsByCategory,
        ticketsByDepartment,
        ticketsTrend,
      },
      recentTickets: recentTickets.map((t) => ({
        id: t.id,
        code: t.code,
        description: t.description,
        priority: t.priority,
        status: t.status,
        requesterName: t.requester.fullName,
        departmentName: t.requester.department.name,
        categoryName: t.category.name,
        receivedAt: t.receivedAt.toISOString(),
      })),
      lowStockParts: lowStockPartsList.slice(0, 5).map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        stockQuantity: p.stockQuantity,
        minimumStock: p.minimumStock,
        unit: p.unit,
        storageLocation: p.storageLocation,
      })),
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("Lỗi truy vấn Dashboard stats:", err);
    return NextResponse.json(
      { message: "Không thể lấy dữ liệu thống kê", error: String(err) },
      { status: 500 }
    );
  }
}
