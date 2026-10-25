import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import DepartmentsClient from "./DepartmentsClient";

export default async function AdminDepartmentsPage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const departments = await prisma.department.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: {
        select: {
          users: true,
          devices: true,
          tickets: true,
        },
      },
    },
  });

  const formattedDepts = departments.map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
    userCount: d._count.users,
    deviceCount: d._count.devices,
    ticketCount: d._count.tickets,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Quản trị Danh mục Phòng ban</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý cơ cấu tổ chức phòng ban trong doanh nghiệp, theo dõi số lượng nhân sự và trang thiết bị trực thuộc.
          </p>
        </div>
      </div>

      <DepartmentsClient initialDepartments={formattedDepts} />
    </div>
  );
}
