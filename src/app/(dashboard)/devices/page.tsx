"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Monitor,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Device {
  id: string;
  code: string;
  brand: string;
  model: string;
  serial: string | null;
  status: string;
  location: string | null;
  condition: string | null;
  purchaseDate: string | null;
  warrantyEndDate: string | null;
  category: { id: string; name: string };
  department: { id: string; code: string; name: string };
  assignedUser: { id: string; employeeCode: string; fullName: string; email: string } | null;
}

interface FilterOption {
  id: string;
  name: string;
  code?: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");

  // Metadata options
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [departments, setDepartments] = useState<FilterOption[]>([]);
  const [statuses, setStatuses] = useState<{ status: string; count: number }[]>([]);

  // User session
  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  // Modal create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newDevice, setNewDevice] = useState({
    code: "",
    categoryId: "",
    brand: "",
    model: "",
    serial: "",
    departmentId: "",
    status: "Đang sử dụng",
    location: "",
    condition: "Tốt",
    purchaseDate: "",
    warrantyEndDate: "",
  });

  // Fetch current user role
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCurrentUserRole(data.data.role);
        }
      })
      .catch(() => {});
  }, []);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        categoryId,
        departmentId,
        status,
        sortBy: "code",
        sortOrder: "asc",
      });

      const res = await fetch(`/api/devices?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setDevices(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
        if (data.data.filterOptions) {
          setCategories(data.data.filterOptions.categories || []);
          setDepartments(data.data.filterOptions.departments || []);
          setStatuses(data.data.filterOptions.statuses || []);
        }
      }
    } catch (err) {
      console.error("Lỗi tải danh sách thiết bị:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, categoryId, departmentId, status]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryId("");
    setDepartmentId("");
    setStatus("");
    setPage(1);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDevice),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setCreateError(data.error || "Thêm mới thiết bị thất bại");
        setCreateLoading(false);
        return;
      }

      setIsModalOpen(false);
      setNewDevice({
        code: "",
        categoryId: "",
        brand: "",
        model: "",
        serial: "",
        departmentId: "",
        status: "Đang sử dụng",
        location: "",
        condition: "Tốt",
        purchaseDate: "",
        warrantyEndDate: "",
      });
      fetchDevices();
    } catch {
      setCreateError("Lỗi kết nối máy chủ");
    } finally {
      setCreateLoading(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "Đang sử dụng":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Ngừng sử dụng":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Cần theo dõi":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Dự phòng":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <Monitor className="h-6 w-6 text-blue-600 mr-2.5" />
            Quản lý Thiết bị CNTT
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng số: <strong className="text-slate-800">{total}</strong> thiết bị được quản lý tập trung
          </p>
        </div>

        {(currentUserRole === "ADMIN" || currentUserRole === "IT_SUPPORT") && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Thêm thiết bị mới
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Tìm theo mã, hãng, model, serial, vị trí..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
            />
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
              <option value="">Tất cả loại thiết bị</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none bg-white transition"
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
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
        </div>

        {/* Reset Filter Button */}
        {(search || categoryId || departmentId || status) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Đang áp dụng bộ lọc</span>
            <button
              onClick={handleResetFilters}
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Mã thiết bị</th>
                <th className="px-5 py-3.5">Loại thiết bị</th>
                <th className="px-5 py-3.5">Hãng / Model</th>
                <th className="px-5 py-3.5">Serial</th>
                <th className="px-5 py-3.5">Phòng ban</th>
                <th className="px-5 py-3.5">Người sử dụng</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Đang tải dữ liệu từ PostgreSQL...
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <Filter className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    Không tìm thấy thiết bị nào khớp với tiêu chí tìm kiếm.
                  </td>
                </tr>
              ) : (
                devices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-blue-600">
                      <Link href={`/devices/${device.id}`} className="hover:underline">
                        {device.code}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {device.category.name}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{device.brand}</div>
                      <div className="text-xs text-slate-500">{device.model}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-600">
                      {device.serial || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600 mr-1.5">
                        {device.department.code}
                      </span>
                      <span className="text-xs">{device.department.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {device.assignedUser ? (
                        <div>
                          <div className="font-medium text-slate-800 text-xs">
                            {device.assignedUser.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {device.assignedUser.employeeCode}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa bàn giao</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                          device.status
                        )}`}
                      >
                        {device.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/devices/${device.id}`}
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
            <span>thiết bị / trang (Tổng {total} bản ghi)</span>
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

      {/* Modal Thêm mới thiết bị */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base flex items-center">
                <Plus className="h-4 w-4 mr-2 text-blue-600" />
                Thêm thiết bị CNTT mới
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã thiết bị *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: TB00901"
                    value={newDevice.code}
                    onChange={(e) => setNewDevice({ ...newDevice, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loại thiết bị *
                  </label>
                  <select
                    required
                    value={newDevice.categoryId}
                    onChange={(e) => setNewDevice({ ...newDevice, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="">-- Chọn loại --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hãng sản xuất *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Dell, HP, Canon..."
                    value={newDevice.brand}
                    onChange={(e) => setNewDevice({ ...newDevice, brand: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: OptiPlex 7090"
                    value={newDevice.model}
                    onChange={(e) => setNewDevice({ ...newDevice, model: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Serial
                  </label>
                  <input
                    type="text"
                    placeholder="Số Serial nhà sx"
                    value={newDevice.serial}
                    onChange={(e) => setNewDevice({ ...newDevice, serial: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phòng ban quản lý *
                  </label>
                  <select
                    required
                    value={newDevice.departmentId}
                    onChange={(e) => setNewDevice({ ...newDevice, departmentId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={newDevice.status}
                    onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Đang sử dụng">Đang sử dụng</option>
                    <option value="Ngừng sử dụng">Ngừng sử dụng</option>
                    <option value="Cần theo dõi">Cần theo dõi</option>
                    <option value="Dự phòng">Dự phòng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vị trí đặt
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Phòng kỹ thuật"
                    value={newDevice.location}
                    onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center"
                >
                  {createLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  )}
                  Lưu thiết bị
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
