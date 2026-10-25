import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo accounts with unified password 'Abcd@1234'...");

  // Ensure departments exist
  const itDept = await prisma.department.upsert({
    where: { code: "PB11" },
    update: {},
    create: {
      code: "PB11",
      name: "Công nghệ thông tin",
    },
  });

  const generalDept = await prisma.department.upsert({
    where: { code: "PB01" },
    update: {},
    create: {
      code: "PB01",
      name: "Ban Giám đốc",
    },
  });

  // Unified password hash using bcryptjs
  const commonPassword = "Abcd@1234";
  const passwordHash = await bcrypt.hash(commonPassword, 10);

  // 1. ADMIN Account (admin@jdt.local / ADMIN01)
  const admin = await prisma.user.upsert({
    where: { email: "admin@jdt.local" },
    update: {
      employeeCode: "ADMIN01",
      passwordHash: passwordHash,
      role: "ADMIN",
      departmentId: itDept.id,
      status: "Đang làm việc",
    },
    create: {
      employeeCode: "ADMIN01",
      fullName: "Quản trị viên Hệ thống",
      departmentId: itDept.id,
      title: "Trưởng ban CNTT",
      email: "admin@jdt.local",
      phone: "0900000001",
      status: "Đang làm việc",
      role: "ADMIN",
      passwordHash: passwordHash,
    },
  });

  // 2. IT_SUPPORT Account (itsupport@jdt.local / IT0001)
  const support = await prisma.user.upsert({
    where: { email: "itsupport@jdt.local" },
    update: {
      employeeCode: "IT0001",
      passwordHash: passwordHash,
      role: "IT_SUPPORT",
      departmentId: itDept.id,
      status: "Đang làm việc",
    },
    create: {
      employeeCode: "IT0001",
      fullName: "Nguyễn Văn IT",
      departmentId: itDept.id,
      title: "Chuyên viên Hỗ trợ CNTT",
      email: "itsupport@jdt.local",
      phone: "0900000002",
      status: "Đang làm việc",
      role: "IT_SUPPORT",
      passwordHash: passwordHash,
    },
  });

  // 3. USER Account (user@jdt.local / USER01)
  const user = await prisma.user.upsert({
    where: { email: "user@jdt.local" },
    update: {
      employeeCode: "USER01",
      passwordHash: passwordHash,
      role: "USER",
      departmentId: generalDept.id,
      status: "Đang làm việc",
    },
    create: {
      employeeCode: "USER01",
      fullName: "Trần Thị Nhân Viên",
      departmentId: generalDept.id,
      title: "Nhân viên Hành chính",
      email: "user@jdt.local",
      phone: "0900000003",
      status: "Đang làm việc",
      role: "USER",
      passwordHash: passwordHash,
    },
  });

  console.log("--------------------------------------------------");
  console.log("✔ Đã cập nhật thành công 3 tài khoản demo với mật khẩu: 'Abcd@1234'");
  console.log(`1. ADMIN: ${admin.email} (Mã: ${admin.employeeCode}) | Quyền: ${admin.role}`);
  console.log(`2. IT_SUPPORT: ${support.email} (Mã: ${support.employeeCode}) | Quyền: ${support.role}`);
  console.log(`3. USER: ${user.email} (Mã: ${user.employeeCode}) | Quyền: ${user.role}`);
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Lỗi khi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
