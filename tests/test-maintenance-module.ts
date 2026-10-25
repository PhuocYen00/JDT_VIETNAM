import prisma from "../src/lib/prisma";

async function main() {
  console.log("==================================================");
  console.log("KIỂM THỬ TỰ ĐỘNG MODULE MAINTENANCE (BẢO TRÌ SỬA CHỮA)");
  console.log("==================================================");

  // 1. Check count
  const total = await prisma.maintenance.count();
  console.log(`✔ Tổng số lượt bảo trì trong DB: ${total} (Kỳ vọng: 1.500)`);
  if (total < 1500) throw new Error("Total maintenance count is lower than expected!");

  // 2. Test pagination and ordering
  const page1 = await prisma.maintenance.findMany({
    take: 10,
    skip: 0,
    include: { device: true, performer: true },
    orderBy: { performedAt: "desc" },
  });
  console.log(`✔ Phân trang trang 1: Lượt mới nhất là ${page1[0].code} (${page1[0].maintenanceType})`);

  // 3. Test filter by type
  const periodicCount = await prisma.maintenance.count({
    where: { maintenanceType: "Kiểm tra định kỳ" },
  });
  const repairCount = await prisma.maintenance.count({
    where: { maintenanceType: "Sửa chữa" },
  });
  console.log(`✔ Phân loại công việc: Kiểm tra định kỳ = ${periodicCount}, Sửa chữa = ${repairCount}`);

  // 4. Test Create new maintenance record
  const device = await prisma.device.findFirst();
  const performer = await prisma.user.findFirst({ where: { role: "IT_SUPPORT" } });

  if (!device || !performer) throw new Error("Missing test entities");

  const testCode = `BTTEST_${Date.now()}`;
  const created = await prisma.maintenance.create({
    data: {
      code: testCode,
      deviceId: device.id,
      performedAt: new Date(),
      maintenanceType: "Vệ sinh thiết bị",
      performerId: performer.id,
      result: "Đã làm sạch bụi tản nhiệt, tra keo tản nhiệt mới",
      cost: 120000,
      nextCheckAt: new Date(Date.now() + 90 * 86400 * 1000),
    },
    include: { device: true, performer: true },
  });

  console.log(`✔ Ghi nhận bảo trì mới thành công: ${created.code} cho thiết bị ${created.device.code}`);

  // 5. Clean up
  await prisma.maintenance.delete({ where: { id: created.id } });
  console.log(`✔ Dọn dẹp bản ghi bảo trì test thành công.`);

  console.log("==================================================");
  console.log("KIỂM THỬ MODULE MAINTENANCE THÀNH CÔNG 100%!");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Lỗi test Maintenance:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
