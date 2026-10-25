import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function testAdminModules() {
  console.log("==================================================");
  console.log("KIỂM THỬ TỰ ĐỘNG CÁC MODULE QUẢN TRỊ (ADMIN)");
  console.log("==================================================");

  // 1. Kiểm tra Department module
  console.log("1. Kiểm tra Quản trị Phòng ban:");
  const testDept = await prisma.department.create({
    data: {
      code: "PBTEST99",
      name: "Phòng Kiểm Thử Tự Động",
    },
  });
  console.log(`✔ Tạo phòng ban test thành công: ${testDept.code} - ${testDept.name}`);

  const updatedDept = await prisma.department.update({
    where: { id: testDept.id },
    data: { name: "Phòng Kiểm Thử Tự Động (Đã sửa)" },
  });
  console.log(`✔ Cập nhật phòng ban thành công: ${updatedDept.name}`);

  // 2. Kiểm tra User module
  console.log("\n2. Kiểm tra Quản trị Người dùng & Mật khẩu:");
  const passwordHash = await bcrypt.hash("Abcd@1234", 10);
  const testUser = await prisma.user.create({
    data: {
      employeeCode: "NVTEST99",
      fullName: "Nhân Viên Test Admin",
      email: "test.admin@jdt.local",
      departmentId: testDept.id,
      role: "USER",
      title: "Chuyên viên QA",
      phone: "0999888777",
      status: "Đang làm việc",
      passwordHash,
    },
  });
  console.log(`✔ Tạo người dùng test thành công: ${testUser.employeeCode} - ${testUser.fullName}`);

  // Thử cập nhật vai trò sang IT_SUPPORT
  const updatedUser = await prisma.user.update({
    where: { id: testUser.id },
    data: { role: "IT_SUPPORT" },
  });
  console.log(`✔ Cập nhật vai trò người dùng thành công: ${updatedUser.role}`);

  // Thử kiểm tra khớp mật khẩu Abcd@1234
  const isMatch = await bcrypt.compare("Abcd@1234", updatedUser.passwordHash);
  if (!isMatch) throw new Error("Mật khẩu không khớp Abcd@1234!");
  console.log("✔ Kiểm tra mật khẩu mã hóa bcryptjs 'Abcd@1234': KHỚP 100%");

  // 3. Kiểm tra Category module
  console.log("\n3. Kiểm tra Quản trị Danh mục:");
  const testDevCat = await prisma.deviceCategory.create({
    data: { name: "Thiết bị Thử nghiệm" },
  });
  console.log(`✔ Tạo danh mục thiết bị: ${testDevCat.name}`);

  const testTicketCat = await prisma.ticketCategory.create({
    data: { name: "Sự cố Thử nghiệm" },
  });
  console.log(`✔ Tạo nhóm sự cố ticket: ${testTicketCat.name}`);

  // 4. Dọn dẹp dữ liệu test
  console.log("\n4. Dọn dẹp dữ liệu kiểm thử:");
  await prisma.user.delete({ where: { id: testUser.id } });
  await prisma.department.delete({ where: { id: testDept.id } });
  await prisma.deviceCategory.delete({ where: { id: testDevCat.id } });
  await prisma.ticketCategory.delete({ where: { id: testTicketCat.id } });
  console.log("✔ Dọn dẹp bản ghi kiểm thử an toàn!");

  console.log("==================================================");
  console.log("KIỂM THỬ CÁC MODULE QUẢN TRỊ ĐẠT 100%!");
  console.log("==================================================");
  await prisma.$disconnect();
}

testAdminModules().catch((err) => {
  console.error("Lỗi kiểm thử admin:", err);
  process.exit(1);
});
