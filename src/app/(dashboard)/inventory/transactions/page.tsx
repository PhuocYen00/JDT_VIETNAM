"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Package,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TransactionItem {
  id: string;
  code: string;
  happenedAt: string;
  type: string;
  quantity: number;
  reference: string | null;
  note: string | null;
  part: {
    id: string;
    code: string;
    name: string;
    unit: string;
  };
}

export default function TransactionsPage() {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [sortBy, setSortBy] = useState("happenedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        type,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/inventory/transactions?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setItems(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } catch (err) {
      console.error("Lỗi tải lịch sử giao dịch:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, type, sortBy, sortOrder]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleResetFilters = () => {
    setSearch("");
    setType("");
    setSortBy("happenedAt");
    setSortOrder("desc");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <ArrowLeftRight className="h-6 w-6 text-blue-600 mr-2.5" />
            Lịch sử Giao dịch Kho Linh kiện
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Nhật ký biến động kho: <strong className="text-slate-800">{total}</strong> lượt giao dịch
          </p>
        </div>

        <Link
          href="/inventory/parts"
          className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
        >
          <Package className="h-4 w-4 mr-1.5" />
          Danh mục linh kiện tồn kho
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              placeholder="Tìm theo mã giao dịch, linh kiện, số phiếu, ghi chú..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white transition"
            >
              <option value="">Tất cả loại giao dịch</option>
              <option value="Nhập">Nhập kho (Bổ sung)</option>
              <option value="Xuất">Xuất kho (Cấp phát / Sửa chữa)</option>
              <option value="Điều chỉnh">Điều chỉnh kiểm kê</option>
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
              <option value="happenedAt-desc">Ngày giao dịch (Mới nhất)</option>
              <option value="happenedAt-asc">Ngày giao dịch (Cũ nhất)</option>
              <option value="quantity-desc">Số lượng (Nhiều nhất)</option>
              <option value="code-asc">Mã giao dịch (A-Z)</option>
            </select>
          </div>
        </div>

        {(search || type) && (
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
                <th className="px-5 py-3.5">Mã giao dịch</th>
                <th className="px-5 py-3.5">Ngày thực hiện</th>
                <th className="px-5 py-3.5">Mã linh kiện</th>
                <th className="px-5 py-3.5">Tên linh kiện</th>
                <th className="px-5 py-3.5">Loại giao dịch</th>
                <th className="px-5 py-3.5 text-center">Số lượng</th>
                <th className="px-5 py-3.5">Số tham chiếu</th>
                <th className="px-5 py-3.5">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Đang tải lịch sử giao dịch kho...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    <Filter className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    Không tìm thấy giao dịch nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                items.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800 font-mono">{tr.code}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {formatDate(tr.happenedAt)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-emerald-700 font-semibold">
                      {tr.part.code}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{tr.part.name}</td>
                    <td className="px-5 py-3.5">
                      {tr.type === "Nhập" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          Nhập kho
                        </span>
                      ) : tr.type === "Xuất" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                          Xuất kho
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Điều chỉnh
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-sm text-slate-800">
                      {tr.quantity} {tr.part.unit}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {tr.reference || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate" title={tr.note || ""}>
                      {tr.note || "—"}
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
            <span>giao dịch / trang (Tổng {total} bản ghi)</span>
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
