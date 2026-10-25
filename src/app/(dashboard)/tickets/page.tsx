"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Star,
  Loader2,
  Clock,
  User,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Ticket {
  id: string;
  code: string;
  receivedAt: string;
  completedAt: string | null;
  description: string;
  priority: string;
  status: string;
  resolution: string | null;
  rating: number | null;
  category: { id: string; name: string };
  department: { id: string; code: string; name: string };
  device: { id: string; code: string; brand: string; model: string } | null;
  requester: { id: string; employeeCode: string; fullName: string };
  assignee: { id: string; employeeCode: string; fullName: string } | null;
}

interface FilterOption {
  id: string;
  name: string;
  code?: string;
  fullName?: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  // Metadata options
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [departments, setDepartments] = useState<FilterOption[]>([]);
  const [assignees, setAssignees] = useState<FilterOption[]>([]);
  const [statuses, setStatuses] = useState<{ status: string; count: number }[]>([]);

  // User session
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCurrentUserRole(data.data.role);
          if (data.data.role === "USER") {
            setOnlyMine(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        status,
        priority,
        categoryId,
        departmentId,
        assigneeId,
        onlyMine: onlyMine.toString(),
        sortBy: "receivedAt",
        sortOrder: "desc",
      });

      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setTickets(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
        if (data.data.filterOptions) {
          setCategories(data.data.filterOptions.categories || []);
          setDepartments(data.data.filterOptions.departments || []);
          setAssignees(data.data.filterOptions.assignees || []);
          setStatuses(data.data.filterOptions.statuses || []);
        }
      }
    } catch (err) {
      console.error("Lỗi tải danh sách ticket:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status, priority, categoryId, departmentId, assigneeId, onlyMine]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setCategoryId("");
    setDepartmentId("");
    setAssigneeId("");
    if (currentUserRole !== "USER") {
      setOnlyMine(false);
    }
    setPage(1);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "Mới tiếp nhận":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Đang xử lý":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Chờ phản hồi":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Tạm hoãn":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "Hoàn thành":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "Khẩn cấp":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "Cao":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Trung bình":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <LifeBuoy className="h-6 w-6 text-amber-500 mr-2.5" />
            Yêu cầu Hỗ trợ Kỹ thuật (Ticket)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng số: <strong className="text-slate-800">{total}</strong> yêu cầu hỗ trợ
          </p>
        </div>

        <Link
          href="/tickets/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Tạo yêu cầu mới
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo mã YC, nội dung, người yêu cầu..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white transition"
            >
              <option value="">Tất cả trạng thái</option>
              {statuses.map((s) => (
                <option key={s.status} value={s.status}>
                  {s.status} ({s.count})
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white transition"
            >
              <option value="">Độ ưu tiên</option>
              <option value="Khẩn cấp">Khẩn cấp</option>
              <option value="Cao">Cao</option>
              <option value="Trung bình">Trung bình</option>
              <option value="Thấp">Thấp</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white transition"
            >
              <option value="">Nhóm sự cố</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department / Assignee Filter */}
          <div>
            {currentUserRole === "ADMIN" || currentUserRole === "IT_SUPPORT" ? (
              <select
                value={assigneeId}
                onChange={(e) => {
                  setAssigneeId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white transition"
              >
                <option value="">Người phụ trách</option>
                <option value="unassigned">Chưa phân công</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName} ({a.code})
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white transition"
              >
                <option value="">Phòng ban</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Quick Filter toggle & Reset */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs gap-2">
          <div className="flex items-center space-x-4">
            {currentUserRole !== "USER" && (
              <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={onlyMine}
                  onChange={(e) => {
                    setOnlyMine(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span>Chỉ xem yêu cầu do tôi tạo</span>
              </label>
            )}
          </div>

          {(search || status || priority || categoryId || departmentId || assigneeId || (currentUserRole !== "USER" && onlyMine)) && (
            <button
              onClick={handleResetFilters}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Mã yêu cầu</th>
                <th className="px-5 py-3.5">Thời điểm tiếp nhận</th>
                <th className="px-5 py-3.5">Người yêu cầu</th>
                <th className="px-5 py-3.5">Nhóm sự cố</th>
                <th className="px-5 py-3.5">Mô tả sự cố</th>
                <th className="px-5 py-3.5">Mức ưu tiên</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Người xử lý</th>
                <th className="px-5 py-3.5 text-center">Đánh giá</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Đang tải dữ liệu ticket từ PostgreSQL...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500">
                    <Filter className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    Không tìm thấy yêu cầu hỗ trợ nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-blue-600">
                      <Link href={`/tickets/${t.id}`} className="hover:underline">
                        {t.code}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatDateTime(t.receivedAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{t.requester.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {t.requester.employeeCode} ({t.department.name})
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{t.category.name}</td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="truncate text-slate-700" title={t.description}>
                        {t.description}
                      </p>
                      {t.device && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Thiết bị: {t.device.code} ({t.device.model})
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(
                          t.priority
                        )}`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {t.assignee ? (
                        <div>
                          <div className="font-medium text-slate-800 text-xs">
                            {t.assignee.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {t.assignee.employeeCode}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa tiếp nhận</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {t.rating ? (
                        <span className="inline-flex items-center text-amber-500 font-bold">
                          {t.rating} <Star className="h-3 w-3 fill-amber-400 ml-0.5" />
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/tickets/${t.id}`}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setPage(1);
              }}
              className="border border-slate-300 rounded px-2 py-1 bg-white outline-none"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span>ticket / trang (Tổng {total} bản ghi)</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 border border-slate-300 rounded-md hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
              Trước
            </button>
            <span className="px-3 py-1 font-semibold text-slate-800">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 border border-slate-300 rounded-md hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center"
            >
              Sau
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
