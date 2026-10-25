"use client";

import { useState } from "react";
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Users,
  Monitor,
  LifeBuoy,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  userCount: number;
  deviceCount: number;
  ticketCount: number;
}

export default function DepartmentsClient({
  initialDepartments,
}: {
  initialDepartments: DepartmentItem[];
}) {
  const [departments, setDepartments] = useState<DepartmentItem[]>(initialDepartments);
  const [search, setSearch] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);

  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [editName, setEditName] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredDepts = departments.filter(
    (d) =>
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: createCode, name: createName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tạo phòng ban thất bại");

      setMessage({ type: "success", text: data.message });
      setDepartments([
        ...departments,
        {
          id: data.department.id,
          code: data.department.code,
          name: data.department.name,
          userCount: 0,
          deviceCount: 0,
          ticketCount: 0,
        },
      ]);
      setIsCreateOpen(false);
      setCreateCode("");
      setCreateName("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/departments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingDept.id, name: editName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật thất bại");

      setMessage({ type: "success", text: data.message });
      setDepartments(
        departments.map((d) =>
          d.id === editingDept.id ? { ...d, name: editName } : d
        )
      );
      setEditingDept(null);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs underline hover:no-underline font-semibold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên phòng ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex-shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Thêm phòng ban mới
        </button>
      </div>

      {/* Bảng danh sách phòng ban */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Mã PB</th>
                <th className="py-3 px-4">Tên phòng ban</th>
                <th className="py-3 px-4 text-center">Số nhân sự</th>
                <th className="py-3 px-4 text-center">Thiết bị sở hữu</th>
                <th className="py-3 px-4 text-center">Yêu cầu hỗ trợ</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredDepts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Không tìm thấy phòng ban phù hợp.
                  </td>
                </tr>
              ) : (
                filteredDepts.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{dept.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{dept.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <Users className="h-3 w-3 mr-1" />
                        {dept.userCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                        <Monitor className="h-3 w-3 mr-1" />
                        {dept.deviceCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                        <LifeBuoy className="h-3 w-3 mr-1" />
                        {dept.ticketCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingDept(dept);
                          setEditName(dept.name);
                        }}
                        title="Chỉnh sửa tên phòng ban"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm phòng ban mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Thêm phòng ban mới</h3>
            <p className="text-xs text-slate-500 mb-4">Nhập mã và tên phòng ban.</p>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã phòng ban *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: PB12"
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên phòng ban *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phòng Nghiên cứu & Phát triển"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold inline-flex items-center"
                >
                  {actionLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Lưu phòng ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa phòng ban */}
      {editingDept && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Chỉnh sửa: {editingDept.code}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Cập nhật tên phòng ban.</p>

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên phòng ban *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold inline-flex items-center"
                >
                  {actionLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
