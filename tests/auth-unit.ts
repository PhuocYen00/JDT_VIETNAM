import { createSessionToken, verifySessionToken } from "../src/lib/auth";
import bcrypt from "bcryptjs";
import { SessionUser } from "../src/types";

async function runTests() {
  console.log("--- BẮT ĐẦU KIỂM THỬ XÁC THỰC VÀ BẢO MẬT (PHASE 1) ---");

  // 1. Test Password Hashing with bcrypt
  const password = "mySecurePassword2026!";
  const hash = await bcrypt.hash(password, 10);
  const isMatch = await bcrypt.compare(password, hash);
  const isWrong = await bcrypt.compare("wrongPassword", hash);

  if (!isMatch || isWrong) {
    throw new Error("FAIL: Bcrypt password hashing verification failed");
  }
  console.log("✔ Kiểm tra Bcrypt hash & verify: ĐẠT");

  // 2. Test Session JWT generation and parsing
  const mockUser: SessionUser = {
    id: "user_test_123",
    employeeCode: "NV0001",
    fullName: "Nguyễn Văn Test",
    email: "test@jdt.local",
    role: "ADMIN",
    departmentId: "dept_123",
    departmentName: "Công nghệ thông tin",
    title: "Chuyên viên CNTT",
  };

  const token = await createSessionToken(mockUser);
  if (!token || typeof token !== "string") {
    throw new Error("FAIL: createSessionToken did not return a valid string");
  }
  console.log("✔ Kiểm tra tạo Session JWT Token: ĐẠT");

  const verified = await verifySessionToken(token);
  if (
    !verified ||
    verified.employeeCode !== mockUser.employeeCode ||
    verified.role !== mockUser.role
  ) {
    throw new Error("FAIL: verifySessionToken returned unexpected payload");
  }
  console.log("✔ Kiểm tra giải mã và xác thực Session Token: ĐẠT");

  // 3. Test Invalid Token
  const invalidVerified = await verifySessionToken("invalid.token.payload");
  if (invalidVerified !== null) {
    throw new Error("FAIL: Invalid token was not rejected");
  }
  console.log("✔ Kiểm tra từ chối Token không hợp lệ: ĐẠT");

  console.log("--- TẤT CẢ TEST AUTH ĐÃ ĐẠT 100% ---");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
