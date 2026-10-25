import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import CategoriesClient from "./CategoriesClient";

export default async function AdminCategoriesPage() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [deviceCategories, ticketCategories] = await Promise.all([
    prisma.deviceCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { devices: true } },
      },
    }),
    prisma.ticketCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { tickets: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Quản trị Danh mục Hệ thống</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý danh mục phân loại thiết bị phần cứng CNTT và danh mục nhóm sự cố kỹ thuật.
        </p>
      </div>

      <CategoriesClient
        initialDeviceCategories={deviceCategories.map((c) => ({
          id: c.id,
          name: c.name,
          count: c._count.devices,
        }))}
        initialTicketCategories={ticketCategories.map((c) => ({
          id: c.id,
          name: c.name,
          count: c._count.tickets,
        }))}
      />
    </div>
  );
}
