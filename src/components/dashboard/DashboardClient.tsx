"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Monitor,
  LifeBuoy,
  Wrench,
  Package,
  ArrowRight,
  AlertTriangle,
  Clock,
  Filter,
  RotateCcw,
  Loader2,
  PlusCircle,
  FileSpreadsheet,
} from "lucide-react";
import DashboardCharts from "./DashboardCharts";

interface DashboardClientProps {
  session: {
    fullName: string;
    departmentName: string;
    role: string;
  };
  departments: { id: string; name: string }[];
  initialKpis: {
    devices: { total: number; active: number; maintenance: number; spare: number };
    tickets: { total: number; completed: number; open: number; completionRate: number };
    maintenance: { total: number; totalCost: number };
    inventory: { totalParts: number; lowStockCount: number };
  };
  initialCharts: {
    ticketsByStatus: { name: string; value: number; color: string }[];
    ticketsByCategory: { name: string; count: number }[];
    ticketsByDepartment: { name: string; count: number }[];
    ticketsTrend: { month: string; received: number; completed: number }[];
  };
  initialRecentTickets: any[];
  initialLowStockParts: any[];
}

export default function DashboardClient({
  session,
  departments,
  initialKpis,
  initialCharts,
  initialRecentTickets,
  initialLowStockParts,
}: DashboardClientProps) {
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const [kpis, setKpis] = useState(initialKpis);
  const [charts, setCharts] = useState(initialCharts);
  const [recentTickets, setRecentTickets] = useState(initialRecentTickets);
  const [lowStockParts, setLowStockParts] = useState(initialLowStockParts);

  const fetchFilteredData = async (deptId: string, status: string, timeRange: string) => {
    startTransition(async () => {
      try {
        const params = new URLSearchParams();
        if (deptId) params.append("departmentId", deptId);
        if (status) params.append("status", status);
        if (timeRange && timeRange !== "all") params.append("timeRange", timeRange);

        const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
        if (!res.ok) throw new Error("Không thể tải dữ liệu");
        const data = await res.json();

        setKpis(data.kpis);
        setCharts(data.charts);
        setRecentTickets(data.recentTickets);
        if (data.lowStockParts) setLowStockParts(data.lowStockParts);
      } catch (err) {
        console.error("Lỗi khi lọc dashboard:", err);
      }
    });
  };

  const handleDeptChange = (val: string) => {
    setSelectedDept(val);
    fetchFilteredData(val, selectedStatus, selectedTimeRange);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    fetchFilteredData(selectedDept, val, selectedTimeRange);
  };

  const handleTimeRangeChange = (val: string) => {
    setSelectedTimeRange(val);
    fetchFilteredData(selectedDept, selectedStatus, val);
  };

  const handleResetFilters = () => {
    setSelectedDept("");
    setSelectedStatus("");
    setSelectedTimeRange("all");
    fetchFilteredData("", "", "all");
  };

  const hasActiveFilters = selectedDept !== "" || selectedStatus !== "" || selectedTimeRange !== "all";

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Xin chào, {session.fullName}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Phòng ban:{" "}
            <span className="font-medium text-slate-700">
              {session.departmentName || "Ban Quản trị"}
            </span>{" "}
            | Vai trò:{" "}
            <span className="font-semibold text-blue-600">
              {session.role === "ADMIN"
                ? "Quản trị viên (ADMIN)"
                : session.role === "IT_SUPPORT"
                ? "Nhân viên hỗ trợ CNTT (IT_SUPPORT)"
                : "Người dùng (USER)"}
            </span>
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2.5">
          <Link
            href="/tickets/new"
            className="inline-flex items-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Tạo yêu cầu hỗ trợ
          </Link>
          {(session.role === "ADMIN" || session.role === "IT_SUPPORT") && (
            <Link
              href="/reports"
              className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1.5 text-slate-600" />
              Báo cáo & Xuất dữ liệu
            </Link>
          )}
        </div>
      </div>

      {/* Global Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Filter className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Bộ lọc Dashboard trực tiếp
          </span>
          {isPending && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium ml-2 animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang tính toán lại...
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Lọc theo Phòng ban */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="deptFilter" className="text-xs font-medium text-slate-600">
              Phòng ban:
            </label>
            <select
              id="deptFilter"
              value={selectedDept}
              onChange={(e) => handleDeptChange(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Trạng thái Ticket */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="statusFilter" className="text-xs font-medium text-slate-600">
              Trạng thái:
            </label>
            <select
              id="statusFilter"
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Mới tiếp nhận">Mới tiếp nhận</option>
              <option value="Đang xử lý">Đang xử lý</option>
              <option value="Chờ phản hồi">Chờ phản hồi</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Tạm hoãn">Tạm hoãn</option>
            </select>
          </div>

          {/* Lọc theo Thời gian */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="timeFilter" className="text-xs font-medium text-slate-600">
              Thời gian:
            </label>
            <select
              id="timeFilter"
              value={selectedTimeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toàn bộ thời gian</option>
              <option value="30d">30 ngày qua</option>
              <option value="90d">90 ngày qua</option>
              <option value="180d">6 tháng qua</option>
              <option value="365d">1 năm qua</option>
              <option value="2026">Năm 2026</option>
              <option value="2025">Năm 2025</option>
            </select>
          </div>

          {/* Đặt lại bộ lọc */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* 4 Thẻ KPI chính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Thiết bị */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng Thiết bị CNTT</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Monitor className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {kpis.devices.total.toLocaleString()}
            </span>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
              <span className="text-emerald-600 font-medium">Sử dụng: {kpis.devices.active}</span>
              <span>Dự phòng: {kpis.devices.spare}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Ticket */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Yêu cầu hỗ trợ (Ticket)</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <LifeBuoy className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {kpis.tickets.total.toLocaleString()}
            </span>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
              <span className="text-amber-600 font-medium">Chưa đóng: {kpis.tickets.open}</span>
              <span className="text-emerald-600 font-medium">Tỷ lệ: {kpis.tickets.completionRate}%</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Bảo trì */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Bảo trì & Sửa chữa</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {kpis.maintenance.total.toLocaleString()} lượt
            </span>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
              <span>Tổng chi phí:</span>
              <span className="font-semibold text-slate-700">
                {kpis.maintenance.totalCost.toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Kho linh kiện */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Linh kiện trong kho</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {kpis.inventory.totalParts} loại
            </span>
            <div className="mt-2 flex items-center justify-between text-xs border-t border-slate-100 pt-2">
              <span className="text-slate-500">Cảnh báo tồn thấp:</span>
              <span
                className={`font-semibold ${
                  kpis.inventory.lowStockCount > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {kpis.inventory.lowStockCount} loại
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Biểu đồ Recharts với tính năng chuyển đổi loại biểu đồ */}
      <DashboardCharts charts={charts} />

      {/* Danh sách nhanh: Yêu cầu mới nhất & Cảnh báo tồn kho */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yêu cầu mới nhất */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                Yêu cầu hỗ trợ mới tiếp nhận
              </h3>
              <Link
                href="/tickets"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
              >
                Xem tất cả <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentTickets.map((t: any) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/tickets/${t.id}`}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        {t.code}
                      </Link>
                      <span className="text-[11px] font-medium text-slate-400">•</span>
                      <span className="text-xs text-slate-600 truncate">{t.description}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t.requesterName || t.requester?.fullName} (
                      {t.departmentName || t.requester?.department?.name}) —{" "}
                      {t.categoryName || t.category?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        t.priority === "Khẩn cấp"
                          ? "bg-rose-100 text-rose-700"
                          : t.priority === "Cao"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        t.status === "Hoàn thành"
                          ? "bg-emerald-100 text-emerald-700"
                          : t.status === "Đang xử lý"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cảnh báo tồn kho */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-rose-600" />
                Cảnh báo linh kiện tồn kho thấp ({kpis.inventory.lowStockCount})
              </h3>
              <Link
                href="/inventory/parts"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
              >
                Kho linh kiện <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {lowStockParts.slice(0, 6).map((part: any) => (
                <div key={part.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{part.code}</span>
                      <span className="text-[11px] font-medium text-slate-400">•</span>
                      <span className="text-xs text-slate-700 truncate">{part.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Vị trí lưu: {part.storageLocation}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
                      Tồn: {part.stockQuantity} {part.unit}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Tối thiểu: {part.minimumStock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
