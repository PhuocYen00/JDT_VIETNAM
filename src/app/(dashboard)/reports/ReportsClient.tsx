"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Monitor,
  LifeBuoy,
  Wrench,
  Package,
  Calendar,
  Loader2,
} from "lucide-react";

interface DepartmentItem {
  id: string;
  code: string;
  name: string;
}

interface StatsProps {
  deviceCount: number;
  ticketCount: number;
  maintenanceCount: number;
  partCount: number;
  lowStockCount: number;
  totalInventoryValue: number;
}

interface ReportsClientProps {
  departments: DepartmentItem[];
  stats: StatsProps;
}

export default function ReportsClient({ departments, stats }: ReportsClientProps) {
  // Bộ lọc Thiết bị
  const [deviceDept, setDeviceDept] = useState("");
  const [deviceStatus, setDeviceStatus] = useState("");
  const [deviceCondition, setDeviceCondition] = useState("");

  // Bộ lọc Ticket
  const [ticketDept, setTicketDept] = useState("");
  const [ticketStatus, setTicketStatus] = useState("");
  const [ticketPriority, setTicketPriority] = useState("");
  const [ticketFrom, setTicketFrom] = useState("");
  const [ticketTo, setTicketTo] = useState("");

  // Bộ lọc Bảo trì
  const [maintDept, setMaintDept] = useState("");
  const [maintFrom, setMaintFrom] = useState("");
  const [maintTo, setMaintTo] = useState("");

  // Bộ lọc Kho
  const [partStatus, setPartStatus] = useState("all");

  // Loading state for export buttons
  const [loadingExport, setLoadingExport] = useState<string | null>(null);

  const handleDownload = (
    type: string,
    format: "xlsx" | "pdf" | "csv",
    queryParams: Record<string, string> = {}
  ) => {
    const key = `${type}-${format}`;
    setLoadingExport(key);

    const cleanParams: Record<string, string> = { type, format };
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v) cleanParams[k] = v;
    });

    const params = new URLSearchParams(cleanParams);
    const url = `/api/reports/export?${params.toString()}`;

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setLoadingExport(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* 4 Thống kê tổng hợp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Monitor className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Bản ghi Thiết bị</p>
            <p className="text-xl font-bold text-slate-800">{stats.deviceCount.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Bản ghi Yêu cầu hỗ trợ</p>
            <p className="text-xl font-bold text-slate-800">{stats.ticketCount.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Lượt Bảo trì / Sửa chữa</p>
            <p className="text-xl font-bold text-slate-800">{stats.maintenanceCount.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Danh mục Linh kiện</p>
            <p className="text-xl font-bold text-slate-800">{stats.partCount.toLocaleString()} loại</p>
          </div>
        </div>
      </div>

      {/* 4 Nhóm Báo cáo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Báo cáo Thiết bị CNTT */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Báo cáo Danh sách Thiết bị CNTT</h2>
                <p className="text-xs text-slate-500">
                  Xuất dữ liệu thiết bị, cấu hình, phòng ban sử dụng và hạn bảo hành.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Phòng ban:
                </label>
                <select
                  value={deviceDept}
                  onChange={(e) => setDeviceDept(e.target.value)}
                  className="w-full text-xs rounded border border-slate-200 bg-white px-2 py-1.5 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Tất cả</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Trạng thái:
                </label>
                <select
                  value={deviceStatus}
                  onChange={(e) => setDeviceStatus(e.target.value)}
                  className="w-full text-xs rounded border border-slate-200 bg-white px-2 py-1.5 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Tất cả</option>
                  <option value="Đang sử dụng">Đang sử dụng</option>
                  <option value="Dự phòng">Dự phòng</option>
                  <option value="Đang sửa chữa">Đang sửa chữa</option>
                  <option value="Hỏng">Hỏng</option>
                  <option value="Thanh lý">Thanh lý</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tình trạng:
                </label>
                <select
                  value={deviceCondition}
                  onChange={(e) => setDeviceCondition(e.target.value)}
                  className="w-full text-xs rounded border border-slate-200 bg-white px-2 py-1.5 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Tất cả</option>
                  <option value="Tốt">Tốt</option>
                  <option value="Bình thường">Bình thường</option>
                  <option value="Kém">Kém</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
            <button
              onClick={() =>
                handleDownload("devices", "xlsx", {
                  departmentId: deviceDept,
                  status: deviceStatus,
                  condition: deviceCondition,
                })
              }
              disabled={loadingExport === "devices-xlsx"}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              {loadingExport === "devices-xlsx" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              )}
              Xuất Excel
            </button>

            <button
              onClick={() =>
                handleDownload("devices", "pdf", {
                  departmentId: deviceDept,
                  status: deviceStatus,
                  condition: deviceCondition,
                })
              }
              disabled={loadingExport === "devices-pdf"}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              {loadingExport === "devices-pdf" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-1.5" />
              )}
              Xuất PDF
            </button>

            <button
              onClick={() =>
                handleDownload("devices", "csv", {
                  departmentId: deviceDept,
                  status: deviceStatus,
                  condition: deviceCondition,
                })
              }
              disabled={loadingExport === "devices-csv"}
              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              CSV
            </button>
          </div>
        </div>

        {/* 2. Báo cáo Yêu cầu Hỗ trợ (Tickets) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Báo cáo Yêu cầu Hỗ trợ (Tickets)</h2>
                <p className="text-xs text-slate-500">
                  Phân tích thời gian xử lý, mức độ ưu tiên và điểm đánh giá dịch vụ.
                </p>
              </div>
            </div>

            <div className="space-y-2 my-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Phòng ban:
                  </label>
                  <select
                    value={ticketDept}
                    onChange={(e) => setTicketDept(e.target.value)}
                    className="w-full text-xs rounded border border-slate-200 bg-white px-2 py-1.5 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Trạng thái:
                  </label>
                  <select
                    value={ticketStatus}
                    onChange={(e) => setTicketStatus(e.target.value)}
                    className="w-full text-xs rounded border border-slate-200 bg-white px-2 py-1.5 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    <option value="Mới tiếp nhận">Mới tiếp nhận</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Chờ phản hồi">Chờ phản hồi</option>
                    <option value="Tạm hoãn">Tạm hoãn</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mức ưu tiên:
                  </label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                    className="w-full text-xs rounded border border-slate-200 bg-white px-2 py-1.5 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Tất cả</option>
                    <option value="Khẩn cấp">Khẩn cấp</option>
                    <option value="Cao">Cao</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Thấp">Thấp</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Từ ngày:
                  </label>
                  <input
                    type="date"
                    value={ticketFrom}
                    onChange={(e) => setTicketFrom(e.target.value)}
                    className="w-full text-xs rounded border border-slate-200 bg-white px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Đến ngày:
                  </label>
                  <input
                    type="date"
                    value={ticketTo}
                    onChange={(e) => setTicketTo(e.target.value)}
                    className="w-full text-xs rounded border border-slate-200 bg-white px-2 py-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
            <button
              onClick={() =>
                handleDownload("tickets", "xlsx", {
                  departmentId: ticketDept,
                  status: ticketStatus,
                  priority: ticketPriority,
                  from: ticketFrom,
                  to: ticketTo,
                })
              }
              disabled={loadingExport === "tickets-xlsx"}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              {loadingExport === "tickets-xlsx" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              )}
              Xuất Excel
            </button>

            <button
              onClick={() =>
                handleDownload("tickets", "pdf", {
                  departmentId: ticketDept,
                  status: ticketStatus,
                  priority: ticketPriority,
                  from: ticketFrom,
                  to: ticketTo,
                })
              }
              disabled={loadingExport === "tickets-pdf"}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              {loadingExport === "tickets-pdf" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-1.5" />
              )}
              Xuất PDF
            </button>

            <button
              onClick={() =>
                handleDownload("tickets", "csv", {
                  departmentId: ticketDept,
                  status: ticketStatus,
                  priority: ticketPriority,
                  from: ticketFrom,
                  to: ticketTo,
                })
              }
              disabled={loadingExport === "tickets-csv"}
              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              CSV
            </button>
          </div>
        </div>

        {/* 3. Báo cáo Bảo trì & Sửa chữa */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-lg">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Báo cáo Bảo trì, Sửa chữa & Chi phí
                </h2>
                <p className="text-xs text-slate-500">
                  Tổng hợp lượt bảo dưỡng thiết bị, chi phí phụ tùng và lịch tái kiểm tra.
                </p>
              </div>
            </div>

            <div className="space-y-2 my-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Phòng ban sở hữu thiết bị:
                </label>
                <select
                  value={maintDept}
                  onChange={(e) => setMaintDept(e.target.value)}
                  className="w-full text-xs rounded border border-slate-200 bg-white px-2 py-1.5 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Tất cả phòng ban</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Từ ngày:
                  </label>
                  <input
                    type="date"
                    value={maintFrom}
                    onChange={(e) => setMaintFrom(e.target.value)}
                    className="w-full text-xs rounded border border-slate-200 bg-white px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Đến ngày:
                  </label>
                  <input
                    type="date"
                    value={maintTo}
                    onChange={(e) => setMaintTo(e.target.value)}
                    className="w-full text-xs rounded border border-slate-200 bg-white px-2 py-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
            <button
              onClick={() =>
                handleDownload("maintenance", "xlsx", {
                  departmentId: maintDept,
                  from: maintFrom,
                  to: maintTo,
                })
              }
              disabled={loadingExport === "maintenance-xlsx"}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              {loadingExport === "maintenance-xlsx" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              )}
              Xuất Excel
            </button>

            <button
              onClick={() =>
                handleDownload("maintenance", "pdf", {
                  departmentId: maintDept,
                  from: maintFrom,
                  to: maintTo,
                })
              }
              disabled={loadingExport === "maintenance-pdf"}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              {loadingExport === "maintenance-pdf" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-1.5" />
              )}
              Xuất PDF
            </button>

            <button
              onClick={() =>
                handleDownload("maintenance", "csv", {
                  departmentId: maintDept,
                  from: maintFrom,
                  to: maintTo,
                })
              }
              disabled={loadingExport === "maintenance-csv"}
              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              CSV
            </button>
          </div>
        </div>

        {/* 4. Báo cáo Kho Linh kiện */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Báo cáo Tồn kho & Phụ tùng</h2>
                <p className="text-xs text-slate-500">
                  Theo dõi 120 danh mục linh kiện, định mức an toàn và giá trị tồn kho.
                </p>
              </div>
            </div>

            <div className="space-y-2 my-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Trạng thái tồn kho:
                </label>
                <select
                  value={partStatus}
                  onChange={(e) => setPartStatus(e.target.value)}
                  className="w-full text-xs rounded border border-slate-200 bg-white px-2 py-1.5 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tất cả linh kiện</option>
                  <option value="low_stock">Chỉ linh kiện CẢNH BÁO TỒN THẤP</option>
                  <option value="in_stock">Linh kiện đủ mức tồn an toàn</option>
                </select>
              </div>

              <div className="pt-2 text-slate-600 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Tổng giá trị tồn ước tính:</span>
                  <span className="font-bold text-emerald-600">
                    {stats.totalInventoryValue.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mã chạm mức cảnh báo:</span>
                  <span className="font-bold text-rose-600">{stats.lowStockCount} loại</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
            <button
              onClick={() =>
                handleDownload("inventory", "xlsx", {
                  status: partStatus,
                })
              }
              disabled={loadingExport === "inventory-xlsx"}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              {loadingExport === "inventory-xlsx" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
              )}
              Xuất Excel
            </button>

            <button
              onClick={() =>
                handleDownload("inventory", "pdf", {
                  status: partStatus,
                })
              }
              disabled={loadingExport === "inventory-pdf"}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              {loadingExport === "inventory-pdf" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-1.5" />
              )}
              Xuất PDF
            </button>

            <button
              onClick={() =>
                handleDownload("inventory", "csv", {
                  status: partStatus,
                })
              }
              disabled={loadingExport === "inventory-csv"}
              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
