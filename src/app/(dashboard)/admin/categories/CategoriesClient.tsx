"use client";

import { useState } from "react";
import {
  Tags,
  Plus,
  Edit2,
  Monitor,
  LifeBuoy,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  count: number;
}

interface CategoriesClientProps {
  initialDeviceCategories: CategoryItem[];
  initialTicketCategories: CategoryItem[];
}

export default function CategoriesClient({
  initialDeviceCategories,
  initialTicketCategories,
}: CategoriesClientProps) {
  const [deviceCats, setDeviceCats] = useState<CategoryItem[]>(initialDeviceCategories);
  const [ticketCats, setTicketCats] = useState<CategoryItem[]>(initialTicketCategories);

  // Modal create
  const [createModal, setCreateModal] = useState<"device" | "ticket" | null>(null);
  const [createName, setCreateName] = useState("");

  // Modal edit
  const [editingItem, setEditingItem] = useState<{
    type: "device" | "ticket";
    id: string;
    name: string;
  } | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createModal || !createName.trim()) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: createModal, name: createName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Thêm danh mục thất bại");

      setMessage({ type: "success", text: data.message });
      if (createModal === "device") {
        setDeviceCats([...deviceCats, { id: data.item.id, name: data.item.name, count: 0 }]);
      } else {
        setTicketCats([...ticketCats, { id: data.item.id, name: data.item.name, count: 0 }]);
      }
      setCreateModal(null);
      setCreateName("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editingItem.type,
          id: editingItem.id,
          name: editingItem.name.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật thất bại");

      setMessage({ type: "success", text: data.message });
      if (editingItem.type === "device") {
        setDeviceCats(
          deviceCats.map((c) =>
            c.id === editingItem.id ? { ...c, name: editingItem.name.trim() } : c
          )
        );
      } else {
        setTicketCats(
          ticketCats.map((c) =>
            c.id === editingItem.id ? { ...c, name: editingItem.name.trim() } : c
          )
        );
      }
      setEditingItem(null);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột 1: Danh mục Loại thiết bị CNTT */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                <Monitor className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Loại Thiết bị CNTT</h2>
                <p className="text-[11px] text-slate-500">Phân loại 900 trang thiết bị</p>
              </div>
            </div>
            <button
              onClick={() => {
                setCreateModal("device");
                setCreateName("");
              }}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Thêm loại
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[500px]">
            {deviceCats.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                  <span className="text-[11px] text-slate-400 ml-2">
                    ({cat.count} thiết bị gắn)
                  </span>
                </div>
                <button
                  onClick={() =>
                    setEditingItem({ type: "device", id: cat.id, name: cat.name })
                  }
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Cột 2: Nhóm sự cố Yêu cầu hỗ trợ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <LifeBuoy className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Nhóm Sự cố Hỗ trợ</h2>
                <p className="text-[11px] text-slate-500">Phân loại 3.500 yêu cầu hỗ trợ</p>
              </div>
            </div>
            <button
              onClick={() => {
                setCreateModal("ticket");
                setCreateName("");
              }}
              className="inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Thêm nhóm
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[500px]">
            {ticketCats.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                  <span className="text-[11px] text-slate-400 ml-2">
                    ({cat.count} ticket gắn)
                  </span>
                </div>
                <button
                  onClick={() =>
                    setEditingItem({ type: "ticket", id: cat.id, name: cat.name })
                  }
                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Thêm danh mục */}
      {createModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Thêm {createModal === "device" ? "Loại thiết bị" : "Nhóm sự cố"} mới
            </h3>
            <p className="text-xs text-slate-500 mb-4">Nhập tên phân loại vào ô dưới đây.</p>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thiết bị mạng không dây"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModal(null)}
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
                  Lưu danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sửa danh mục */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Chỉnh sửa: {editingItem.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Cập nhật tên danh mục mới.</p>

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
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
