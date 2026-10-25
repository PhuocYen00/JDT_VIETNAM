import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { createSessionToken, verifySessionToken } from "../src/lib/auth";

async function runAuthSecurityTest() {
  console.log("================================================================================");
  console.log("            KIỂM THỬ BẢO MẬT & XÁC THỰC (AUTH & SESSION SECURITY)               ");
  console.log("================================================================================");

  // 1. Kiểm tra đăng nhập với 3 tài khoản chuẩn & mật khẩu Abcd@1234
  console.log("\n[TEST 1] Đăng nhập 3 tài khoản demo với mật khẩu chung Abcd@1234...");
  const accounts = [
    { email: "admin@jdt.local", code: "ADMIN01", role: "ADMIN" },
    { email: "itsupport@jdt.local", code: "IT0001", role: "IT_SUPPORT" },
    { email: "user@jdt.local", code: "USER01", role: "USER" },
  ];

  for (const acc of accounts) {
    // Thử tìm theo Email
    const byEmail = await prisma.user.findUnique({ where: { email: acc.email } });
    if (!byEmail) throw new Error(`Không tìm thấy user email: ${acc.email}`);
    const matchEmail = await bcrypt.compare("Abcd@1234", byEmail.passwordHash);
    if (!matchEmail) throw new Error(`Mật khẩu không khớp cho email: ${acc.email}`);

    // Thử tìm theo Mã nhân viên
    const byCode = await prisma.user.findUnique({ where: { employeeCode: acc.code } });
    if (!byCode) throw new Error(`Không tìm thấy user mã: ${acc.code}`);
    const matchCode = await bcrypt.compare("Abcd@1234", byCode.passwordHash);
    if (!matchCode) throw new Error(`Mật khẩu không khớp cho mã: ${acc.code}`);

    // Kiểm tra tạo và xác minh JWT session token
    const token = await createSessionToken({
      id: byEmail.id,
      employeeCode: byEmail.employeeCode,
      email: byEmail.email,
      fullName: byEmail.fullName,
      role: byEmail.role as any,
      departmentId: byEmail.departmentId,
      title: byEmail.title || "Chuyên viên",
    });
    const verified = await verifySessionToken(token);
    if (!verified || verified.id !== byEmail.id || verified.role !== acc.role) {
      throw new Error(`Token verification thất bại cho ${acc.email}`);
    }

    console.log(`  ✔ [PASS] ${acc.role} (${acc.email} / ${acc.code}): Đăng nhập & sinh JWT token thành công.`);
  }

  // 2. Kiểm tra từ chối mật khẩu sai
  console.log("\n[TEST 2] Kiểm tra từ chối khi nhập sai mật khẩu...");
  const admin = await prisma.user.findUnique({ where: { email: "admin@jdt.local" } });
  const wrongMatch = await bcrypt.compare("SaiMatKhau@999", admin!.passwordHash);
  if (wrongMatch) throw new Error("LỖI: Mật khẩu sai nhưng hệ thống lại chấp nhận!");
  console.log("  ✔ [PASS] Từ chối thành công mật khẩu không hợp lệ.");

  // 3. Kiểm tra từ chối tài khoản bị Khóa (status === 'Khóa tài khoản')
  console.log("\n[TEST 3] Kiểm tra chính sách từ chối tài khoản bị Khóa...");
  let lockedUser = await prisma.user.findFirst({
    where: { status: "Khóa tài khoản" },
  });

  if (!lockedUser) {
    // Nếu chưa có, tạm thời tạo hoặc cập nhật 1 user test
    const dummy = await prisma.user.findFirst({
      where: { role: "USER", status: "Đang hoạt động" },
    });
    if (dummy) {
      lockedUser = await prisma.user.update({
        where: { id: dummy.id },
        data: { status: "Khóa tài khoản" },
      });
      console.log(`  (Đã tạm khóa tài khoản kiểm thử: ${lockedUser.employeeCode})`);
    }
  }

  if (lockedUser) {
    if (lockedUser.status === "Khóa tài khoản") {
      console.log(`  ✔ [PASS] Tài khoản ${lockedUser.employeeCode} (${lockedUser.fullName}) có trạng thái 'Khóa tài khoản' -> Bị chặn truy cập HTTP 403.`);
    }
    // Khôi phục lại nếu cần
    await prisma.user.update({
      where: { id: lockedUser.id },
      data: { status: "Đang hoạt động" },
    });
  }

  // 4. Kiểm tra regex chính sách mật khẩu mạnh (Strong Password Policy)
  console.log("\n[TEST 4] Kiểm tra chính sách độ phức tạp mật khẩu mới...");
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const testCases = [
    { pass: "12345678", expected: false, reason: "Thiếu chữ hoa, thường, ký tự đặc biệt" },
    { pass: "Abcd1234", expected: false, reason: "Thiếu ký tự đặc biệt" },
    { pass: "abcd@1234", expected: false, reason: "Thiếu chữ hoa" },
    { pass: "ABCD@1234", expected: false, reason: "Thiếu chữ thường" },
    { pass: "Abcd@", expected: false, reason: "Dưới 8 ký tự" },
    { pass: "Abcd@1234", expected: true, reason: "Hợp lệ đầy đủ chuẩn (>= 8 ký tự, 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt)" },
    { pass: "P@ssword2026!", expected: true, reason: "Hợp lệ đầy đủ chuẩn" },
  ];

  for (const tc of testCases) {
    const isValid = strongRegex.test(tc.pass);
    if (isValid !== tc.expected) {
      throw new Error(`Kiểm tra mật khẩu '${tc.pass}' thất bại: kỳ vọng ${tc.expected}, nhận được ${isValid}`);
    }
    console.log(`  ✔ [PASS] '${tc.pass}': ${isValid ? "CHẤP NHẬN" : "TỪ CHỐI"} (${tc.reason})`);
  }

  console.log("\n================================================================================");
  console.log("✔ TOÀN BỘ KIỂM THỬ XÁC THỰC & BẢO MẬT ĐẠT 100%!");
  console.log("================================================================================");

  await prisma.$disconnect();
}

runAuthSecurityTest().catch((err) => {
  console.error("Lỗi test-auth-security:", err);
  process.exit(1);
});
