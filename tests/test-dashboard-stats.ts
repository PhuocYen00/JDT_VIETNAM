import prisma from "../src/lib/prisma";

async function runDashboardTest() {
  console.log("==================================================");
  console.log("KIỂM THỬ TÍNH TOÁN SỐ LIỆU CHO DASHBOARD");
  console.log("==================================================");

  const [
    totalDevices,
    activeDevices,
    totalTickets,
    completedTickets,
    totalMaintenance,
    totalParts,
    statusCounts,
    categoryCounts,
  ] = await Promise.all([
    prisma.device.count(),
    prisma.device.count({ where: { status: "Đang sử dụng" } }),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "Hoàn thành" } }),
    prisma.maintenance.count(),
    prisma.part.count(),
    prisma.ticket.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ["categoryId"],
      _count: { _all: true },
    }),
  ]);

  console.log(`✔ Tổng thiết bị: ${totalDevices} (Đang sử dụng: ${activeDevices})`);
  console.log(`✔ Tổng yêu cầu hỗ trợ: ${totalTickets} (Đã hoàn thành: ${completedTickets})`);
  console.log(`✔ Tổng lượt bảo trì: ${totalMaintenance}`);
  console.log(`✔ Tổng loại linh kiện: ${totalParts}`);

  console.log("✔ Thống kê theo trạng thái Ticket:");
  statusCounts.forEach((s) => {
    console.log(`   - ${s.status}: ${s._count._all}`);
  });

  if (totalDevices !== 900) {
    throw new Error(`Kỳ vọng 900 thiết bị, thực tế: ${totalDevices}`);
  }
  if (totalTickets !== 3500) {
    throw new Error(`Kỳ vọng 3500 tickets, thực tế: ${totalTickets}`);
  }
  if (completedTickets !== 2754) {
    throw new Error(`Kỳ vọng 2754 tickets hoàn thành, thực tế: ${completedTickets}`);
  }

  console.log("==================================================");
  console.log("KIỂM THỬ SỐ LIỆU DASHBOARD ĐẠT 100%!");
  console.log("==================================================");
  await prisma.$disconnect();
}

runDashboardTest().catch((err) => {
  console.error("Lỗi kiểm thử dashboard:", err);
  process.exit(1);
});
