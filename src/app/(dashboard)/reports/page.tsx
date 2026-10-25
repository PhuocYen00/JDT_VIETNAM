import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const session = await getSession();

  // Kiểm tra quyền: Chỉ ADMIN hoặc IT_SUPPORT
  if (!session || (session.role !== "ADMIN" && session.role !== "IT_SUPPORT")) {
    redirect("/dashboard");
  }

  // Lấy các danh mục phục vụ bộ lọc
  const [departments, deviceCategories, ticketCategories, partsSummary] = await Promise.all([
    prisma.department.findMany({ orderBy: { code: "asc" } }),
    prisma.deviceCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.ticketCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.part.findMany({
      select: {
        stockQuantity: true,
        minimumStock: true,
        unitPrice: true,
      },
    }),
  ]);

  const totalInventoryValue = partsSummary.reduce(
    (sum, p) => sum + p.stockQuantity * Number(p.unitPrice),
    0
  );
  const lowStockCount = partsSummary.filter((p) => p.stockQuantity <= p.minimumStock).length;

  const [deviceCount, ticketCount, maintenanceCount] = await Promise.all([
    prisma.device.count(),
    prisma.ticket.count(),
    prisma.maintenance.count(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">
          Trung tâm Báo cáo Thống kê & Xuất dữ liệu
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Xuất dữ liệu chi tiết định dạng Excel (.xlsx) hoặc CSV chuẩn UTF-8 phục vụ công tác quản lý,
          báo cáo định kỳ và lưu trữ.
        </p>
      </div>

      {/* Client Component tương tác bộ lọc và tải file */}
      <ReportsClient
        departments={departments.map((d) => ({ id: d.id, code: d.code, name: d.name }))}
        stats={{
          deviceCount,
          ticketCount,
          maintenanceCount,
          partCount: partsSummary.length,
          lowStockCount,
          totalInventoryValue,
        }}
      />
    </div>
  );
}
