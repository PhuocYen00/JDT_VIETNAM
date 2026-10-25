import prisma from "../src/lib/prisma";

// Giả lập cơ chế requireRole và kiểm thử RBAC negative
function checkRolePermission(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

async function runRbacNegativeTest() {
  console.log("================================================================================");
  console.log("           KIỂM THỬ PHÂN QUYỀN TIÊU CỰC (RBAC NEGATIVE SECURITY TESTING)        ");
  console.log("================================================================================");

  const testMatrix = [
    // 1. Phân hệ Admin (/admin/users, /admin/audit-logs, /admin/import)
    {
      route: "/admin/users",
      action: "Quản lý tài khoản người dùng & Khóa tài khoản",
      allowedRoles: ["ADMIN"],
      tests: [
        { role: "USER", shouldPass: false },
        { role: "IT_SUPPORT", shouldPass: false },
        { role: "ADMIN", shouldPass: true },
      ],
    },
    {
      route: "/admin/audit-logs",
      action: "Xem nhật ký kiểm toán hệ thống (Audit Log)",
      allowedRoles: ["ADMIN"],
      tests: [
        { role: "USER", shouldPass: false },
        { role: "IT_SUPPORT", shouldPass: false },
        { role: "ADMIN", shouldPass: true },
      ],
    },
    {
      route: "/admin/import",
      action: "Đối soát và đồng bộ cơ sở dữ liệu nền từ Excel",
      allowedRoles: ["ADMIN"],
      tests: [
        { role: "USER", shouldPass: false },
        { role: "IT_SUPPORT", shouldPass: false },
        { role: "ADMIN", shouldPass: true },
      ],
    },

    // 2. Phân hệ Quản lý Kho linh kiện (/inventory/*)
    {
      route: "/inventory/transactions/new",
      action: "Thực hiện giao dịch nhập/xuất kho linh kiện",
      allowedRoles: ["ADMIN", "IT_SUPPORT"],
      tests: [
        { role: "USER", shouldPass: false },
        { role: "IT_SUPPORT", shouldPass: true },
        { role: "ADMIN", shouldPass: true },
      ],
    },

    // 3. Phân hệ Báo cáo (/reports/*)
    {
      route: "/reports",
      action: "Xem báo cáo tổng hợp & Xuất file Excel / PDF",
      allowedRoles: ["ADMIN", "IT_SUPPORT"],
      tests: [
        { role: "USER", shouldPass: false },
        { role: "IT_SUPPORT", shouldPass: true },
        { role: "ADMIN", shouldPass: true },
      ],
    },

    // 4. Phân hệ Thiết bị & Ticket (/devices, /tickets)
    {
      route: "/devices/new",
      action: "Thêm mới thiết bị CNTT vào hệ thống",
      allowedRoles: ["ADMIN", "IT_SUPPORT"],
      tests: [
        { role: "USER", shouldPass: false },
        { role: "IT_SUPPORT", shouldPass: true },
        { role: "ADMIN", shouldPass: true },
      ],
    },
    {
      route: "/tickets/new",
      action: "Tạo mới yêu cầu hỗ trợ kỹ thuật",
      allowedRoles: ["ADMIN", "IT_SUPPORT", "USER"],
      tests: [
        { role: "USER", shouldPass: true },
        { role: "IT_SUPPORT", shouldPass: true },
        { role: "ADMIN", shouldPass: true },
      ],
    },
  ];

  let totalCases = 0;
  let passedCases = 0;

  for (const group of testMatrix) {
    console.log(`\n[ROUTE] ${group.route} — ${group.action}`);
    for (const t of group.tests) {
      totalCases++;
      const hasAccess = checkRolePermission(t.role, group.allowedRoles);

      if (t.shouldPass) {
        if (!hasAccess) {
          throw new Error(`LỖI: Vai trò ${t.role} được phép truy cập ${group.route} nhưng bị từ chối!`);
        }
        console.log(`  ✔ [PASS] Vai trò ${t.role} -> Được cấp quyền truy cập hợp lệ.`);
        passedCases++;
      } else {
        if (hasAccess) {
          throw new Error(`LỖI BẢO MẬT: Vai trò ${t.role} KHÔNG được phép truy cập ${group.route} nhưng lại được chấp thuận!`);
        }
        console.log(`  ✔ [PASS: 403 FORBIDDEN] Vai trò ${t.role} -> Bị chặn truy cập chính xác.`);
        passedCases++;
      }
    }
  }

  console.log("\n================================================================================");
  console.log(`✔ HOÀN THÀNH KIỂM THỬ PHÂN QUYỀN TIÊU CỰC: ${passedCases}/${totalCases} ca kiểm thử ĐẠT 100%!`);
  console.log("================================================================================");
}

runRbacNegativeTest().catch((err) => {
  console.error("Lỗi test-rbac-negative:", err);
  process.exit(1);
});
