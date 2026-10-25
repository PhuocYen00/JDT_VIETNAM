"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wrench,
  Search,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  X,
  Clock,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface MaintenanceItem {
  id: string;
  code: string;
  performedAt: string;
  maintenanceType: string;
  result: string;
  cost: number;
  nextCheckAt: string | null;
  device: {
    id: string;
    code: string;
    brand: string;
    model: string;
    category: { name: string };
    department: { name: string; code: string };
  };
  performer: {
    id: string;
    employeeCode: string;
    fullName: string;
  };
}

interface FilterOption {
  id: string;
  code?: string;
  fullName?: string;
}

export default function MaintenancePage() {
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("");
  const [performerId, setPerformerId] = useState("");
  const [sortBy, setSortBy] = useState("performedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Options
  const [types, setTypes] = useState<{ type: string; count: number }[]>([]);
  const [performers, setPerformers] = useState<FilterOption[]>([]);
  const [devicesList, setDevicesList] = useState<{ id: string; code: string; brand: string; model: string }[]>([]);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newMaint, setNewMaint] = useState({
    deviceId: "",
    performedAt: new Date().toISOString().split("T")[0],
    maintenanceType: "Kiểm tra định kỳ",
    performerId: "",
    result: "Hoạt động ổn định",
    cost: 0,
    nextCheckAt: "",
  });

  const fetchMaintenance = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        maintenanceType,
        performerId,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/maintenance?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setItems(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
        if (data.data.filterOptions) {
          setTypes(data.data.filterOptions.types || []);
          setPerformers(data.data.filterOptions.performers || []);
        }
      }
    } catch (err) {
      console.error("Lỗi tải danh sách bảo trì:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, maintenanceType, performerId, sortBy, sortOrder]);

  useEffect(() => {
    fetchMaintenance();
  }, [fetchMaintenance]);

  // Load devices for modal
  useEffect(() => {
    fetch("/api/devices?pageSize=100&status=Đang+sử+dụng")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setDevicesList(d.data.items || []);
      })
      .catch(() => {});
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMaint),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCreateError(data.error || "Ghi nhận bảo trì thất bại");
        setCreateLoading(false);
        return;
      }

      setIsModalOpen(false);
      setNewMaint({
        deviceId: "",
        performedAt: new Date().toISOString().split("T")[0],
        maintenanceType: "Kiểm tra định kỳ",
        performerId: "",
        result: "Hoạt động ổn định",
        cost: 0,
        nextCheckAt: "",
      });
      fetchMaintenance();
    } catch {
      setCreateError("Lỗi kết nối máy chủ");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setMaintenanceType("");
    setPerformerId("");
    setSortBy("performedAt");
    setSortOrder("desc");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <Wrench className="h-6 w-6 text-purple-600 mr-2.5" />
            Lịch sử Bảo trì & Sửa chữa
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng số: <strong className="text-slate-800">{total}</strong> lượt bảo dưỡng, kiểm tra định kỳ và sửa chữa
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Ghi nhận đợt bảo trì mới
        </button>
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo mã BT, thiết bị, kết quả, người thực hiện..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={maintenanceType}
              onChange={(e) => {
                setMaintenanceType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white transition"
            >
              <option value="">Tất cả loại công việc</option>
              {types.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.type} ({t.count})
                </option>
              ))}
            </select>
          </div>

          {/* Performer Filter */}
          <div>
            <select
              value={performerId}
              onChange={(e) => {
                setPerformerId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white transition"
            >
              <option value="">Kỹ thuật viên thực hiện</option>
              {performers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Option */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                setSortBy(sb);
                setSortOrder(so as "asc" | "desc");
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white transition"
            >
              <option value="performedAt-desc">Ngày thực hiện (Mới nhất)</option>
              <option value="performedAt-asc">Ngày thực hiện (Cũ nhất)</option>
              <option value="cost-desc">Chi phí (Cao nhất)</option>
              <option value="code-asc">Mã bảo trì (A-Z)</option>
            </select>
          </div>
        </div>

        {(search || maintenanceType || performerId) && (
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
                <th className="px-5 py-3.5">Mã bảo trì</th>
                <th className="px-5 py-3.5">Ngày thực hiện</th>
                <th className="px-5 py-3.5">Thiết bị CNTT</th>
                <th className="px-5 py-3.5">Phòng ban</th>
                <th className="px-5 py-3.5">Loại công việc</th>
                <th className="px-5 py-3.5">Kỹ thuật viên</th>
                <th className="px-5 py-3.5">Kết quả kiểm tra</th>
                <th className="px-5 py-3.5 text-right">Chi phí (VNĐ)</th>
                <th className="px-5 py-3.5">Tái kiểm tra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Đang tải dữ liệu bảo trì...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <Filter className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    Không tìm thấy bản ghi bảo trì nào phù hợp.
                  </td>
                </tr>
              ) : (
                items.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-purple-700">{m.code}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {formatDate(m.performedAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/devices/${m.device.id}`}
                        className="font-semibold text-blue-600 hover:underline block"
                      >
                        {m.device.code}
                      </Link>
                      <span className="text-[11px] text-slate-500">
                        {m.device.brand} {m.device.model} ({m.device.category.name})
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      <span className="font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600 mr-1 text-[11px]">
                        {m.device.department.code}
                      </span>
                      {m.device.department.name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200 text-[11px]">
                        {m.maintenanceType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-800 font-medium">
                      {m.performer.fullName}
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {m.performer.employeeCode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 max-w-xs truncate" title={m.result}>
                      {m.result}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-right text-slate-900">
                      {formatCurrency(m.cost)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {m.nextCheckAt ? (
                        <span className="flex items-center text-slate-700">
                          <Clock className="h-3 w-3 mr-1 text-slate-400" />
                          {formatDate(m.nextCheckAt)}
                        </span>
                      ) : (
                        "—"
                      )}
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
            <span>lượt bảo trì / trang (Tổng {total} bản ghi)</span>
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

      {/* Modal Ghi nhận đợt bảo trì mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center">
                <Plus className="h-4 w-4 mr-2 text-purple-600" />
                Ghi nhận đợt bảo trì / sửa chữa mới
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {createError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chọn thiết bị CNTT *
                </label>
                <select
                  required
                  value={newMaint.deviceId}
                  onChange={(e) => setNewMaint({ ...newMaint, deviceId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="">-- Chọn thiết bị --</option>
                  {devicesList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.brand} {d.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày thực hiện *
                  </label>
                  <input
                    type="date"
                    required
                    value={newMaint.performedAt}
                    onChange={(e) => setNewMaint({ ...newMaint, performedAt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Loại công việc *
                  </label>
                  <select
                    value={newMaint.maintenanceType}
                    onChange={(e) => setNewMaint({ ...newMaint, maintenanceType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Kiểm tra định kỳ">Kiểm tra định kỳ</option>
                    <option value="Bảo trì">Bảo trì</option>
                    <option value="Sửa chữa">Sửa chữa</option>
                    <option value="Thay thế linh kiện">Thay thế linh kiện</option>
                    <option value="Vệ sinh thiết bị">Vệ sinh thiết bị</option>
                    <option value="Cập nhật cấu hình">Cập nhật cấu hình</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kỹ thuật viên thực hiện *
                  </label>
                  <select
                    required
                    value={newMaint.performerId}
                    onChange={(e) => setNewMaint({ ...newMaint, performerId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="">-- Chọn kỹ thuật viên --</option>
                    {performers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Chi phí thực hiện (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={newMaint.cost}
                    onChange={(e) => setNewMaint({ ...newMaint, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kết quả kiểm tra / xử lý *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hoạt động ổn định, đã vệ sinh quạt tản nhiệt..."
                  value={newMaint.result}
                  onChange={(e) => setNewMaint({ ...newMaint, result: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ngày dự kiến kiểm tra tiếp theo
                </label>
                <input
                  type="date"
                  value={newMaint.nextCheckAt}
                  onChange={(e) => setNewMaint({ ...newMaint, nextCheckAt: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center"
                >
                  {createLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                  Lưu phiếu bảo trì
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
