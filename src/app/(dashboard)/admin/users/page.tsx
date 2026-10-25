import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const session = await getSession();

  // Chỉ cho phép ADMIN
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const departments = await prisma.department.findMany({
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản trị Người dùng & Phân quyền</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý tài khoản nhân viên, phân quyền vai trò (Admin, IT Support, User) và quản trị mật khẩu.
          </p>
        </div>
      </div>

      <UsersClient departments={departments} />
    </div>
  );
}
