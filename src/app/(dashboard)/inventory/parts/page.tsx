"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Part {
  id: string;
  code: string;
  name: string;
  unit: string;
  stockQuantity: number;
  minimumStock: number;
  unitPrice: number;
  storageLocation: string | null;
  status: string;
}

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("code");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Create Part Modal
  const [isCreatePartOpen, setIsCreatePartOpen] = useState(false);
  const [createPartLoading, setCreatePartLoading] = useState(false);
  const [createPartError, setCreatePartError] = useState<string | null>(null);
  const [newPart, setNewPart] = useState({
    code: "",
    name: "",
    unit: "Cái",
    stockQuantity: 0,
    minimumStock: 5,
    unitPrice: 0,
    storageLocation: "Kho kỹ thuật",
    status: "Đang sử dụng",
  });

  // Transaction Modal (Quick In/Out)
  const [selectedPartForTrans, setSelectedPartForTrans] = useState<Part | null>(null);
  const [transType, setTransType] = useState<"Nhập" | "Xuất">("Xuất");
  const [transQuantity, setTransQuantity] = useState(1);
  const [transRef, setTransRef] = useState("");
  const [transNote, setTransNote] = useState("");
  const [transLoading, setTransLoading] = useState(false);
  const [transError, setTransError] = useState<string | null>(null);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        status,
        lowStock: lowStockOnly.toString(),
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/parts?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setParts(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
        setLowStockCount(data.data.lowStockCount || 0);
      }
    } catch (err) {
      console.error("Lỗi tải danh mục linh kiện:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status, lowStockOnly, sortBy, sortOrder]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatePartError(null);
    setCreatePartLoading(true);

    try {
      const res = await fetch("/api/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPart),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCreatePartError(data.error || "Thêm linh kiện thất bại");
        setCreatePartLoading(false);
        return;
      }

      setIsCreatePartOpen(false);
      setNewPart({
        code: "",
        name: "",
        unit: "Cái",
        stockQuantity: 0,
        minimumStock: 5,
        unitPrice: 0,
        storageLocation: "Kho kỹ thuật",
        status: "Đang sử dụng",
      });
      fetchParts();
    } catch {
      setCreatePartError("Lỗi kết nối máy chủ");
    } finally {
      setCreatePartLoading(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartForTrans) return;

    setTransError(null);
    setTransLoading(true);

    try {
      const res = await fetch("/api/inventory/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: selectedPartForTrans.id,
          type: transType,
          quantity: transQuantity,
          reference: transRef,
          note: transNote,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setTransError(data.error || "Giao dịch thất bại");
        setTransLoading(false);
        return;
      }

      setSelectedPartForTrans(null);
      setTransQuantity(1);
      setTransRef("");
      setTransNote("");
      fetchParts();
    } catch {
      setTransError("Lỗi kết nối máy chủ");
    } finally {
      setTransLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <Package className="h-6 w-6 text-emerald-600 mr-2.5" />
            Linh kiện & Tồn kho kỹ thuật
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng số: <strong className="text-slate-800">{total}</strong> loại linh kiện | Cảnh báo tồn thấp:{" "}
            <strong className="text-amber-600 font-bold">{lowStockCount}</strong> mặt hàng
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/inventory/transactions"
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Lịch sử giao dịch kho
          </Link>
          <button
            onClick={() => setIsCreatePartOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Thêm linh kiện mới
          </button>
        </div>
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
              placeholder="Tìm theo mã, tên linh kiện, vị trí lưu..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition"
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
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white transition"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Đang sử dụng">Đang sử dụng</option>
              <option value="Theo dõi tồn">Theo dõi tồn</option>
              <option value="Dự phòng">Dự phòng</option>
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
              <option value="code-asc">Mã linh kiện (A-Z)</option>
              <option value="stockQuantity-asc">Tồn kho (Tăng dần)</option>
              <option value="stockQuantity-desc">Tồn kho (Giảm dần)</option>
              <option value="unitPrice-desc">Đơn giá (Cao nhất)</option>
            </select>
          </div>

          {/* Low stock checkbox filter */}
          <div className="flex items-center">
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 w-full justify-center">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => {
                  setLowStockOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
              />
              <span>Chỉ hiển thị tồn thấp ({lowStockCount})</span>
            </label>
          </div>
        </div>

        {(search || status || lowStockOnly) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Đang áp dụng bộ lọc</span>
            <button
              onClick={() => {
                setSearch("");
                setStatus("");
                setLowStockOnly(false);
                setPage(1);
              }}
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
                <th className="px-5 py-3.5">Mã linh kiện</th>
                <th className="px-5 py-3.5">Tên linh kiện</th>
                <th className="px-5 py-3.5">Đơn vị tính</th>
                <th className="px-5 py-3.5 text-center">Tồn kho hiện tại</th>
                <th className="px-5 py-3.5 text-center">Tồn tối thiểu</th>
                <th className="px-5 py-3.5 text-right">Đơn giá (VNĐ)</th>
                <th className="px-5 py-3.5">Vị trí lưu</th>
                <th className="px-5 py-3.5">Cảnh báo</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Đang tải danh mục linh kiện...
                  </td>
                </tr>
              ) : parts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    <Filter className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    Không tìm thấy linh kiện nào phù hợp.
                  </td>
                </tr>
              ) : (
                parts.map((p) => {
                  const isLow = p.stockQuantity <= p.minimumStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-emerald-700 font-mono">{p.code}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">{p.name}</td>
                      <td className="px-5 py-3.5 text-slate-600">{p.unit}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`font-bold text-sm ${
                            isLow ? "text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200" : "text-slate-800"
                          }`}
                        >
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-slate-500 font-medium">
                        {p.minimumStock}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-right text-slate-800">
                        {formatCurrency(p.unitPrice)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{p.storageLocation || "—"}</td>
                      <td className="px-5 py-3.5">
                        {isLow ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Cần bổ sung
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium text-[11px] flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Đủ tồn kho
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => {
                            setSelectedPartForTrans(p);
                            setTransType("Xuất");
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[11px] font-semibold transition"
                          title="Xuất kho"
                        >
                          Xuất
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPartForTrans(p);
                            setTransType("Nhập");
                          }}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-semibold transition"
                          title="Nhập kho"
                        >
                          Nhập
                        </button>
                      </td>
                    </tr>
                  );
                })
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
            <span>linh kiện / trang (Tổng {total} bản ghi)</span>
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

      {/* Modal Xuất / Nhập linh kiện */}
      {selectedPartForTrans && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center">
                {transType === "Xuất" ? (
                  <ArrowDownRight className="h-4 w-4 mr-1.5 text-amber-600" />
                ) : (
                  <ArrowUpRight className="h-4 w-4 mr-1.5 text-emerald-600" />
                )}
                Tạo phiếu {transType} kho: {selectedPartForTrans.name}
              </h3>
              <button onClick={() => setSelectedPartForTrans(null)} className="text-slate-400 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4 text-xs">
              {transError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {transError}
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[11px]">Mã linh kiện</span>
                  <span className="font-mono font-bold text-slate-800">{selectedPartForTrans.code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tồn kho hiện tại</span>
                  <span className="font-bold text-blue-600">
                    {selectedPartForTrans.stockQuantity} {selectedPartForTrans.unit}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loại giao dịch *</label>
                  <select
                    value={transType}
                    onChange={(e) => setTransType(e.target.value as "Nhập" | "Xuất")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none bg-white font-semibold"
                  >
                    <option value="Xuất">Xuất kho (Cấp phát/Sửa chữa)</option>
                    <option value="Nhập">Nhập kho (Bổ sung tồn)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số lượng ({selectedPartForTrans.unit}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={transType === "Xuất" ? selectedPartForTrans.stockQuantity : 9999}
                    required
                    value={transQuantity}
                    onChange={(e) => setTransQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số chứng từ / Mã tham chiếu</label>
                <input
                  type="text"
                  placeholder="VD: YC00012 hoặc PN0045"
                  value={transRef}
                  onChange={(e) => setTransRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú giao dịch</label>
                <input
                  type="text"
                  placeholder="VD: Cấp linh kiện thay thế màn hình khu sản xuất"
                  value={transNote}
                  onChange={(e) => setTransNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPartForTrans(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={transLoading}
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center"
                >
                  {transLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                  Xác nhận giao dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm linh kiện mới */}
      {isCreatePartOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center">
                <Plus className="h-4 w-4 mr-2 text-emerald-600" />
                Thêm linh kiện mới vào danh mục
              </h3>
              <button onClick={() => setIsCreatePartOpen(false)} className="text-slate-400 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePart} className="p-6 space-y-4 text-xs">
              {createPartError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {createPartError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã linh kiện *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: LK0121"
                    value={newPart.code}
                    onChange={(e) => setNewPart({ ...newPart, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn vị tính *</label>
                  <input
                    type="text"
                    required
                    placeholder="Cái, Bộ, Sợi..."
                    value={newPart.unit}
                    onChange={(e) => setNewPart({ ...newPart, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên linh kiện *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: RAM DDR4 16GB Kingston"
                  value={newPart.name}
                  onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tồn kho ban đầu</label>
                  <input
                    type="number"
                    min="0"
                    value={newPart.stockQuantity}
                    onChange={(e) => setNewPart({ ...newPart, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mức tồn tối thiểu *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPart.minimumStock}
                    onChange={(e) => setNewPart({ ...newPart, minimumStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 font-bold text-amber-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn giá (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={newPart.unitPrice}
                    onChange={(e) => setNewPart({ ...newPart, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vị trí lưu kho</label>
                  <input
                    type="text"
                    value={newPart.storageLocation}
                    onChange={(e) => setNewPart({ ...newPart, storageLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatePartOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createPartLoading}
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center"
                >
                  {createPartLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                  Thêm vào danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
