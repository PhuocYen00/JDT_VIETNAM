"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Loader2,
  TableProperties,
  Info,
  Layers,
  X,
} from "lucide-react";

interface StatItem {
  name: string;
  current: number;
  expected: number;
  sheet: string;
}

interface BreakdownGroup {
  read: number;
  unique: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

interface SyncBreakdown {
  departments: BreakdownGroup;
  deviceCategories: BreakdownGroup;
  ticketCategories: BreakdownGroup;
}

export default function ImportClient() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [isFullySynced, setIsFullySynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [breakdown, setBreakdown] = useState<SyncBreakdown | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Execution lock / mutex ref to prevent race conditions & double-clicks
  const isSyncingRef = useRef(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/import");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setIsFullySynced(data.isFullySynced);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleOpenConfirm = () => {
    if (syncing || isSyncingRef.current) return;
    setShowConfirmModal(true);
  };

  const handleConfirmSync = async () => {
    if (isSyncingRef.current) return; // Mutex lock
    isSyncingRef.current = true;
    setSyncing(true);
    setShowConfirmModal(false);
    setMessage(null);
    setBreakdown(null);

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đồng bộ thất bại");

      setMessage({ type: "success", text: data.message });
      if (data.breakdown) {
        setBreakdown(data.breakdown);
      }
      fetchStats();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSyncing(false);
      isSyncingRef.current = false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal Xác nhận Đồng bộ */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận đồng bộ danh mục</h3>
                <p className="text-xs text-slate-500">Cơ chế bảo vệ dữ liệu nền hệ thống</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Thao tác này sẽ đọc lại tệp Excel nguồn và đối chiếu, cập nhật các danh mục phòng ban,
              loại thiết bị và nhóm sự cố vào cơ sở dữ liệu PostgreSQL. Quá trình không làm ảnh hưởng đến các bản ghi thiết bị hoặc ticket đã tạo.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSync}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center"
              >
                Tiến hành đồng bộ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thông báo kết quả */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs underline hover:no-underline font-semibold ml-4"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Bảng chi tiết kết quả xử lý sau đồng bộ (Breakdown) */}
      {breakdown && (
        <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm bg-linear-to-r from-blue-50/50 to-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-blue-900 flex items-center">
              <Layers className="h-4 w-4 mr-2 text-blue-600" />
              Chi tiết kết quả lượt đồng bộ vừa thực hiện
            </h4>
            <button
              onClick={() => setBreakdown(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800">Phòng ban (Departments)</span>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Dòng đã đọc:</span>
                  <span className="font-semibold">{breakdown.departments.read}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Thêm mới:</span>
                  <span className="font-semibold">+{breakdown.departments.created}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Cập nhật tên:</span>
                  <span className="font-semibold">{breakdown.departments.updated}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Đã tồn tại (Bỏ qua):</span>
                  <span>{breakdown.departments.skipped}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Lỗi:</span>
                  <span className="font-semibold">{breakdown.departments.errors}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800">Loại thiết bị (Categories)</span>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Mục phân loại:</span>
                  <span className="font-semibold">{breakdown.deviceCategories.unique}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Thêm mới:</span>
                  <span className="font-semibold">+{breakdown.deviceCategories.created}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Đã tồn tại (Bỏ qua):</span>
                  <span>{breakdown.deviceCategories.skipped}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Lỗi:</span>
                  <span className="font-semibold">{breakdown.deviceCategories.errors}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800">Nhóm sự cố (Ticket Categories)</span>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Mục phân loại:</span>
                  <span className="font-semibold">{breakdown.ticketCategories.unique}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Thêm mới:</span>
                  <span className="font-semibold">+{breakdown.ticketCategories.created}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Đã tồn tại (Bỏ qua):</span>
                  <span>{breakdown.ticketCategories.skipped}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Lỗi:</span>
                  <span className="font-semibold">{breakdown.ticketCategories.errors}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trạng thái tổng quát */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div
            className={`p-3 rounded-xl ${
              isFullySynced ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            <Database className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-800">
                {isFullySynced
                  ? "Dữ liệu đã được nạp đầy đủ và khớp 100%"
                  : "Dữ liệu đang được đồng bộ hoặc chưa đầy đủ"}
              </h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isFullySynced
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isFullySynced ? "ĐÃ KHỚP" : "CẦN KIỂM TRA"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              File nguồn:{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-700">
                data/Bo_du_lieu_mau_JDT_Quan_ly_thiet_bi_CNTT_Ho_tro_ky_thuat.xlsx
              </code>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchStats}
            disabled={loading || syncing}
            className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
          <button
            onClick={handleOpenConfirm}
            disabled={syncing}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            {syncing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Đang xử lý đồng bộ...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                Đồng bộ danh mục nền
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bảng đối soát chi tiết */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center">
            <TableProperties className="h-4 w-4 mr-2 text-blue-600" />
            Bảng đối soát số lượng bản ghi giữa PostgreSQL và Excel Workbook
          </h3>
          <span className="text-xs text-slate-400">10 bảng dữ liệu quan hệ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Thực thể / Bảng dữ liệu</th>
                <th className="py-3 px-4">Sheet nguồn trong Excel</th>
                <th className="py-3 px-4 text-center">Số lượng trong DB</th>
                <th className="py-3 px-4 text-center">Kỳ vọng từ File</th>
                <th className="py-3 px-4 text-center">Trạng thái đối chiếu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang kiểm tra đối soát dữ liệu...
                  </td>
                </tr>
              ) : (
                stats.map((s, index) => {
                  const isMatch = s.current >= s.expected;
                  return (
                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                      <td className="py-3 px-4">
                        <code className="text-[11px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {s.sheet}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {s.current.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {s.expected.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isMatch ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                            Đạt 100%
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-600" />
                            Chưa đủ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
