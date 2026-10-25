import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ImportClient from "./ImportClient";

export default async function AdminImportPage() {
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
            Quản trị & Đối soát Dữ liệu Excel
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm tra đối chiếu số lượng bản ghi trong cơ sở dữ liệu PostgreSQL so với file dữ liệu mẫu
            Excel và kích hoạt đồng bộ dữ liệu.
          </p>
        </div>
      </div>

      <ImportClient />
    </div>
  );
}
