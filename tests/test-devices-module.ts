import prisma from "../src/lib/prisma";

async function main() {
  console.log("==================================================");
  console.log("KIỂM THỬ TỰ ĐỘNG MODULE DEVICES (THIẾT BỊ CNTT)");
  console.log("==================================================");

  // 1. Test count and pagination
  const total = await prisma.device.count();
  console.log(`✔ Tổng số thiết bị trong DB: ${total} (Kỳ vọng: 900)`);
  if (total !== 900) throw new Error("Total devices count mismatch!");

  const page1 = await prisma.device.findMany({
    take: 10,
    skip: 0,
    include: { category: true, department: true },
    orderBy: { code: "asc" },
  });
  console.log(`✔ Phân trang trang 1 (10 bản ghi): Đầu tiên là ${page1[0].code}, cuối cùng là ${page1[9].code}`);

  // 2. Test search
  const searched = await prisma.device.findMany({
    where: {
      OR: [
        { code: { contains: "TB00001", mode: "insensitive" } },
        { brand: { contains: "Dell", mode: "insensitive" } },
      ],
    },
    take: 5,
  });
  console.log(`✔ Tìm kiếm thiết bị theo mã/hãng: Tìm thấy ${searched.length} bản ghi mẫu.`);

  // 3. Test filter by Department
  const pb11Devices = await prisma.device.count({
    where: { department: { code: "PB11" } },
  });
  console.log(`✔ Thiết bị thuộc PB11 (CNTT): ${pb11Devices} thiết bị`);

  // 4. Test Device detail with relations
  const devDetail = await prisma.device.findUnique({
    where: { code: "TB00001" },
    include: {
      category: true,
      department: true,
      assignedUser: true,
      tickets: { take: 5 },
      maintenances: { take: 5 },
      _count: { select: { tickets: true, maintenances: true } },
    },
  });

  if (!devDetail) throw new Error("Device TB00001 not found");
  console.log(`✔ Chi tiết TB00001:`);
  console.log(`  - Hãng/Model: ${devDetail.brand} - ${devDetail.model}`);
  console.log(`  - Loại: ${devDetail.category.name}`);
  console.log(`  - Phòng ban: ${devDetail.department.name}`);
  console.log(`  - Người sử dụng: ${devDetail.assignedUser?.fullName || "Chưa bàn giao"}`);
  console.log(`  - Số ticket liên quan: ${devDetail._count.tickets}`);
  console.log(`  - Số lượt bảo trì: ${devDetail._count.maintenances}`);

  // 5. Test create new test device and delete
  const testCode = "TBTEST99";
  const cat = await prisma.deviceCategory.findFirst();
  const dept = await prisma.department.findFirst();

  const created = await prisma.device.create({
    data: {
      code: testCode,
      categoryId: cat!.id,
      brand: "TestBrand",
      model: "TestModel",
      departmentId: dept!.id,
      status: "Dự phòng",
    },
  });
  console.log(`✔ Tạo mới thiết bị test thành công: ${created.code} (ID: ${created.id})`);

  // Update
  const updated = await prisma.device.update({
    where: { id: created.id },
    data: { status: "Đang sử dụng" },
  });
  console.log(`✔ Cập nhật thiết bị test thành công -> Trạng thái: ${updated.status}`);

  // Clean up test device
  await prisma.device.delete({ where: { id: created.id } });
  console.log(`✔ Dọn dẹp thiết bị test thành công.`);

  console.log("==================================================");
  console.log("KIỂM THỬ MODULE DEVICES THÀNH CÔNG 100%!");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Lỗi test Devices:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
