import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AuditLogsClient from "./AuditLogsClient";

export default async function AdminAuditLogsPage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Nhật ký Hoạt động Hệ thống (Audit Log)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ghi nhận và giám sát toàn bộ các hành động quản trị quan trọng: tạo/sửa tài khoản, đổi vai trò, khóa tài khoản, reset mật khẩu, giao dịch kho.
          </p>
        </div>
      </div>

      <AuditLogsClient />
    </div>
  );
}
