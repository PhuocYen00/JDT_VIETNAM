import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();

  // Truy vấn toàn bộ dữ liệu thống kê trực tiếp từ PostgreSQL
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
    allTicketsDates,
  ] = await Promise.all([
    prisma.device.count(),
    prisma.device.count({ where: { status: "Đang sử dụng" } }),
    prisma.device.count({ where: { status: { in: ["Đang sửa chữa", "Hỏng"] } } }),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "Hoàn thành" } }),
    prisma.ticket.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.maintenance.count(),
    prisma.maintenance.aggregate({
      _sum: { cost: true },
    }),
    prisma.part.count(),
    prisma.ticket.findMany({
      take: 6,
      orderBy: { receivedAt: "desc" },
      include: {
        requester: { select: { fullName: true, department: { select: { name: true } } } },
        category: { select: { name: true } },
      },
    }),
    prisma.ticket.groupBy({
      by: ["categoryId"],
      _count: { _all: true },
      orderBy: { _count: { categoryId: "desc" } },
      take: 8,
    }),
    prisma.ticket.groupBy({
      by: ["departmentId"],
      _count: { _all: true },
      orderBy: { _count: { departmentId: "desc" } },
      take: 6,
    }),
    prisma.part.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        stockQuantity: true,
        minimumStock: true,
        unit: true,
        storageLocation: true,
      },
    }),
    prisma.ticket.findMany({
      select: { receivedAt: true, status: true },
    }),
  ]);

  // Xử lý danh mục & phòng ban
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

  const statusColorMap: Record<string, string> = {
    "Hoàn thành": "#10b981",
    "Đang xử lý": "#3b82f6",
    "Chờ phản hồi": "#f59e0b",
    "Mới tiếp nhận": "#6366f1",
    "Tạm hoãn": "#94a3b8",
  };

  const ticketsByStatus = statusCounts.map((s) => ({
    name: s.status,
    value: s._count._all,
    color: statusColorMap[s.status] || "#64748b",
  }));

  // Xu hướng theo tháng
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

  // Tính toán chỉ số
  const lowStockPartsList = allParts
    .filter((p) => p.stockQuantity <= p.minimumStock)
    .sort((a, b) => a.stockQuantity - b.stockQuantity);
  const lowStockCount = lowStockPartsList.length;

  const openTickets = totalTickets - completedTickets;
  const completionRate =
    totalTickets > 0 ? ((completedTickets / totalTickets) * 100).toFixed(1) : "0";
  const spareDevices = totalDevices - activeDevices - maintenanceDevices;
  const totalCostNumber = Number(maintenanceCostAgg._sum.cost || 0);

  return (
    <DashboardClient
      session={{
        fullName: session?.fullName || "",
        departmentName: session?.departmentName || "",
        role: session?.role || "USER",
      }}
      departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      initialKpis={{
        devices: {
          total: totalDevices,
          active: activeDevices,
          maintenance: maintenanceDevices,
          spare: spareDevices,
        },
        tickets: {
          total: totalTickets,
          completed: completedTickets,
          open: openTickets,
          completionRate: Number(completionRate),
        },
        maintenance: {
          total: totalMaintenance,
          totalCost: totalCostNumber,
        },
        inventory: {
          totalParts,
          lowStockCount,
        },
      }}
      initialCharts={{
        ticketsByStatus,
        ticketsByCategory,
        ticketsByDepartment,
        ticketsTrend,
      }}
      initialRecentTickets={recentTickets.map((t) => ({
        id: t.id,
        code: t.code,
        description: t.description,
        priority: t.priority,
        status: t.status,
        requesterName: t.requester.fullName,
        departmentName: t.requester.department.name,
        categoryName: t.category.name,
        receivedAt: t.receivedAt.toISOString(),
      }))}
      initialLowStockParts={lowStockPartsList.slice(0, 6).map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        stockQuantity: p.stockQuantity,
        minimumStock: p.minimumStock,
        unit: p.unit,
        storageLocation: p.storageLocation,
      }))}
    />
  );
}
