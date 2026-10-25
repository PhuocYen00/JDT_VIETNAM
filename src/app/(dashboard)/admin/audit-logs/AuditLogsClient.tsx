"use client";

import { useState, useEffect } from "react";
import {
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield,
  Activity,
  Filter,
} from "lucide-react";

interface LogItem {
  id: string;
  createdAt: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityCode: string | null;
  description: string;
}

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: "15",
      });
      if (search) params.append("search", search);
      if (action) params.append("action", action);
      if (entityType) params.append("entityType", entityType);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, action, entityType]);

  const getActionBadge = (actionName: string) => {
    if (actionName.includes("CREATE")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (actionName.includes("LOCK") || actionName.includes("DELETE")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (actionName.includes("PASSWORD") || actionName.includes("ROLE")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  return (
    <div className="space-y-4">
      {/* Bộ lọc */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo người thực hiện, mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 pl-9 pr-3 py-2 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full sm:w-48 text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tất cả hành động</option>
            <option value="CREATE_USER">Tạo người dùng</option>
            <option value="UPDATE_USER">Sửa người dùng</option>
            <option value="LOCK_USER">Khóa tài khoản</option>
            <option value="UNLOCK_USER">Mở khóa tài khoản</option>
            <option value="UPDATE_ROLE">Đổi vai trò</option>
            <option value="RESET_PASSWORD">Đặt lại mật khẩu</option>
            <option value="CHANGE_PASSWORD">Đổi mật khẩu</option>
            <option value="INVENTORY_TX">Giao dịch kho</option>
            <option value="IMPORT_DATA">Đồng bộ dữ liệu</option>
          </select>

          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full sm:w-40 text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tất cả đối tượng</option>
            <option value="USER">Người dùng</option>
            <option value="DEPARTMENT">Phòng ban</option>
            <option value="CATEGORY">Danh mục</option>
            <option value="DEVICE">Thiết bị</option>
            <option value="PART">Kho linh kiện</option>
            <option value="SYSTEM">Hệ thống</option>
          </select>
        </div>
      </div>

      {/* Bảng Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Đối tượng</th>
                <th className="py-3 px-4">Nội dung chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải nhật ký kiểm toán...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Chưa có bản ghi nhật ký kiểm toán nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {log.createdAt.replace("T", " ").slice(0, 19)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{log.actorName}</div>
                      <span className="text-[10px] text-slate-400">{log.actorRole}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700">{log.entityType}</span>
                      {log.entityCode && (
                        <span className="text-[11px] text-slate-400 ml-1 font-mono">
                          ({log.entityCode})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-md">{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị trang <strong>{page}</strong> / <strong>{totalPages || 1}</strong> (Tổng số:{" "}
            <strong>{total}</strong> bản ghi)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
