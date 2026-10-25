import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      department: { select: { id: true, code: true, name: true } },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Hồ sơ cá nhân & Bảo mật tài khoản</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý thông tin định danh nhân sự, cập nhật thông tin liên hệ và thiết lập mật khẩu bảo mật.
        </p>
      </div>

      <ProfileClient
        user={{
          id: user.id,
          employeeCode: user.employeeCode,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone || "",
          title: user.title,
          status: user.status,
          role: user.role,
          departmentName: user.department.name,
          createdAt: user.createdAt.toISOString(),
        }}
      />
    </div>
  );
}
