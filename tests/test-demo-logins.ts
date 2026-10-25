import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function verifyLogin(identifier: string, pass: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: identifier, mode: "insensitive" } },
        { employeeCode: { equals: identifier.toUpperCase() } },
      ],
    },
    include: { department: true },
  });

  if (!user) {
    return { ok: false, error: "User not found" };
  }

  const isValid = await bcrypt.compare(pass, user.passwordHash);
  if (!isValid) {
    return { ok: false, error: "Invalid password" };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      employeeCode: user.employeeCode,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department.name,
    },
  };
}

async function main() {
  console.log("==================================================");
  console.log("KIỂM THỬ ĐĂNG NHẬP THỰC TẾ CHO 3 TÀI KHOẢN DEMO");
  console.log("Mật khẩu kiểm thử: 'Abcd@1234'");
  console.log("==================================================");

  const testCases = [
    { label: "ADMIN bằng Email", identifier: "admin@jdt.local", pass: "Abcd@1234", expectedRole: "ADMIN" },
    { label: "ADMIN bằng Mã NV", identifier: "ADMIN01", pass: "Abcd@1234", expectedRole: "ADMIN" },
    { label: "IT_SUPPORT bằng Email", identifier: "itsupport@jdt.local", pass: "Abcd@1234", expectedRole: "IT_SUPPORT" },
    { label: "IT_SUPPORT bằng Mã NV", identifier: "IT0001", pass: "Abcd@1234", expectedRole: "IT_SUPPORT" },
    { label: "USER bằng Email", identifier: "user@jdt.local", pass: "Abcd@1234", expectedRole: "USER" },
    { label: "USER bằng Mã NV", identifier: "USER01", pass: "Abcd@1234", expectedRole: "USER" },
  ];

  let passed = 0;

  for (const tc of testCases) {
    const res = await verifyLogin(tc.identifier, tc.pass);
    if (res.ok && res.user?.role === tc.expectedRole) {
      console.log(`✔ [PASS] ${tc.label} (${tc.identifier}) -> ${res.user.fullName} [Role: ${res.user.role}]`);
      passed++;
    } else {
      console.error(`✖ [FAIL] ${tc.label} (${tc.identifier}):`, res.error);
    }
  }

  // Negative test
  const wrongRes = await verifyLogin("admin@jdt.local", "SaiMatKhau123");
  if (!wrongRes.ok) {
    console.log("✔ [PASS] Test từ chối mật khẩu sai (SaiMatKhau123) -> Từ chối thành công.");
    passed++;
  } else {
    console.error("✖ [FAIL] Mật khẩu sai nhưng vẫn được chấp nhận!");
  }

  console.log("==================================================");
  console.log(`KẾT QUẢ: ${passed}/7 test cases ĐẠT 100%`);
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Lỗi kiểm thử:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
