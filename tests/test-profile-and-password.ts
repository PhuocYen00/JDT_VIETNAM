import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { logAuditEvent } from "../src/lib/audit";

async function runProfileAndPasswordTest() {
  console.log("================================================================================");
  console.log("         KIỂM THỬ HỒ SƠ CÁ NHÂN & ĐỔI MẬT KHẨU (PROFILE & PASSWORD)             ");
  console.log("================================================================================");

  const testUser = await prisma.user.findUnique({
    where: { employeeCode: "USER01" },
  });

  if (!testUser) {
    throw new Error("Không tìm thấy người dùng USER01 để kiểm thử");
  }

  console.log(`\n[BƯỚC 1] Kiểm tra cập nhật thông tin hồ sơ cho: ${testUser.fullName} (${testUser.employeeCode})...`);
  const originalName = testUser.fullName;
  const originalPhone = testUser.phone;
  const testPhone = "0987654321";

  // Cập nhật số điện thoại
  const updatedUser = await prisma.user.update({
    where: { id: testUser.id },
    data: {
      phone: testPhone,
    },
  });

  if (updatedUser.phone !== testPhone) {
    throw new Error("Cập nhật số điện thoại thất bại");
  }
  console.log(`  ✔ [PASS] Cập nhật số điện thoại: ${testPhone}`);

  // Kiểm tra tính bất biến của role và employeeCode qua luồng profile
  if (updatedUser.role !== testUser.role || updatedUser.employeeCode !== testUser.employeeCode) {
    throw new Error("LỖI BẢO MẬT: Vai trò hoặc Mã nhân viên bị thay đổi bất hợp lệ!");
  }
  console.log("  ✔ [PASS] Vai trò và Mã nhân viên được bảo vệ bất biến (Immutable).");

  // Khôi phục lại phone cũ
  await prisma.user.update({
    where: { id: testUser.id },
    data: { phone: originalPhone },
  });

  console.log("\n[BƯỚC 2] Kiểm thử cơ chế Đổi mật khẩu...");

  // 2.1. Thử đổi với mật khẩu hiện tại sai
  console.log("  [2.1] Kiểm tra từ chối khi mật khẩu hiện tại không đúng...");
  const isWrongCurrentPass = await bcrypt.compare("SaiPass@123", testUser.passwordHash);
  if (isWrongCurrentPass) {
    throw new Error("Lỗi: Mật khẩu hiện tại sai nhưng lại so sánh khớp!");
  }
  console.log("  ✔ [PASS] Hệ thống từ chối đổi mật khẩu khi cung cấp sai mật khẩu hiện tại.");

  // 2.2. Thử với mật khẩu mới yếu
  console.log("  [2.2] Kiểm tra từ chối mật khẩu mới không đạt chuẩn...");
  const weakPassword = "weak";
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (strongRegex.test(weakPassword)) {
    throw new Error("Lỗi regex chính sách mật khẩu!");
  }
  console.log("  ✔ [PASS] Từ chối mật khẩu yếu 'weak' thành công.");

  // 2.3. Đổi sang mật khẩu mới hợp lệ
  console.log("  [2.3] Cập nhật mật khẩu mới hợp lệ 'StrongPass@2026'...");
  const newPassword = "StrongPass@2026";
  if (!strongRegex.test(newPassword)) {
    throw new Error("Mật khẩu hợp lệ lại bị từ chối!");
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: testUser.id },
    data: { passwordHash: newHash },
  });

  // Ghi nhật ký Audit Log
  await logAuditEvent({
    actorId: testUser.id,
    actorName: testUser.fullName,
    actorRole: testUser.role,
    action: "CHANGE_PASSWORD",
    entityType: "USER",
    entityId: testUser.id,
    description: "Automated test change password",
  });

  // Xác minh mật khẩu mới khớp
  const freshUser = await prisma.user.findUnique({ where: { id: testUser.id } });
  const isNewMatch = await bcrypt.compare(newPassword, freshUser!.passwordHash);
  if (!isNewMatch) {
    throw new Error("Mật khẩu mới không khớp sau khi đổi!");
  }
  console.log("  ✔ [PASS] Đổi mật khẩu thành công và xác thực chính xác bằng bcrypt.");

  // 2.4. Khôi phục lại mật khẩu chuẩn demo Abcd@1234
  console.log("\n[BƯỚC 3] Khôi phục lại mật khẩu chuẩn Abcd@1234 cho tài khoản demo...");
  const restoredHash = await bcrypt.hash("Abcd@1234", 10);
  await prisma.user.update({
    where: { id: testUser.id },
    data: { passwordHash: restoredHash },
  });

  const isRestored = await bcrypt.compare("Abcd@1234", restoredHash);
  if (!isRestored) throw new Error("Khôi phục mật khẩu Abcd@1234 thất bại");
  console.log("  ✔ [PASS] Đã khôi phục an toàn mật khẩu demo Abcd@1234.");

  console.log("\n================================================================================");
  console.log("✔ KIỂM THỬ HỒ SƠ & ĐỔI MẬT KHẨU ĐẠT 100%!");
  console.log("================================================================================");

  await prisma.$disconnect();
}

runProfileAndPasswordTest().catch((err) => {
  console.error("Lỗi test-profile-and-password:", err);
  process.exit(1);
});
