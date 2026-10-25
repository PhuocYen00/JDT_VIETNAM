"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Monitor,
  ChevronLeft,
  Calendar,
  User,
  Building2,
  Wrench,
  LifeBuoy,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Shield,
  Loader2,
  X,
} from "lucide-react";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

interface DeviceDetail {
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
  categoryId: string;
  departmentId: string;
  assignedUserId: string | null;
  category: { id: string; name: string };
  department: { id: string; code: string; name: string };
  assignedUser: {
    id: string;
    employeeCode: string;
    fullName: string;
    title: string;
    email: string;
    phone: string | null;
  } | null;
  tickets: Array<{
    id: string;
    code: string;
    receivedAt: string;
    completedAt: string | null;
    description: string;
    priority: string;
    status: string;
    resolution: string | null;
    rating: number | null;
    category: { name: string };
    requester: { fullName: string; employeeCode: string };
    assignee: { fullName: string; employeeCode: string } | null;
  }>;
  maintenances: Array<{
    id: string;
    code: string;
    performedAt: string;
    maintenanceType: string;
    result: string;
    cost: number | string;
    nextCheckAt: string | null;
    performer: { fullName: string; employeeCode: string };
  }>;
  _count: {
    tickets: number;
    maintenances: number;
  };
}

export default function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [device, setDevice] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "tickets" | "maintenance">("overview");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    brand: "",
    model: "",
    serial: "",
    status: "",
    location: "",
    condition: "",
    purchaseDate: "",
    warrantyEndDate: "",
  });

  const [currentUserRole, setCurrentUserRole] = useState<string>("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setCurrentUserRole(d.data.role);
      })
      .catch(() => {});
  }, []);

  const fetchDevice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/devices/${resolvedParams.id}`);
      const data = await res.json();
      if (data.success) {
        setDevice(data.data);
        setEditForm({
          brand: data.data.brand,
          model: data.data.model,
          serial: data.data.serial || "",
          status: data.data.status,
          location: data.data.location || "",
          condition: data.data.condition || "",
          purchaseDate: data.data.purchaseDate ? data.data.purchaseDate.split("T")[0] : "",
          warrantyEndDate: data.data.warrantyEndDate ? data.data.warrantyEndDate.split("T")[0] : "",
        });
      }
    } catch (err) {
      console.error("Lỗi khi tải chi tiết thiết bị:", err);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchDevice();
  }, [fetchDevice]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditLoading(true);
    try {
      const res = await fetch(`/api/devices/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setEditError(data.error || "Cập nhật thất bại");
        setEditLoading(false);
        return;
      }
      setIsEditModalOpen(false);
      fetchDevice();
    } catch {
      setEditError("Lỗi kết nối máy chủ");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa thiết bị ${device?.code}?`)) return;
    try {
      const res = await fetch(`/api/devices/${resolvedParams.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Không thể xóa thiết bị");
        return;
      }
      router.push("/devices");
    } catch {
      alert("Lỗi kết nối máy chủ khi xóa");
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-3" />
        Đang tải thông tin thiết bị...
      </div>
    );
  }

  if (!device) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Không tìm thấy thiết bị</h2>
        <p className="text-xs text-slate-500">Mã thiết bị có thể không tồn tại hoặc đã bị xóa.</p>
        <Link
          href="/devices"
          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:underline"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

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

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "Khẩn cấp":
        return "bg-rose-100 text-rose-800";
      case "Cao":
        return "bg-amber-100 text-amber-800";
      case "Trung bình":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/devices"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition text-slate-600"
            title="Quay lại"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">{device.code}</h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                  device.status
                )}`}
              >
                {device.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {device.category.name} | {device.brand} - {device.model}
            </p>
          </div>
        </div>

        {(currentUserRole === "ADMIN" || currentUserRole === "IT_SUPPORT") && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Edit3 className="h-3.5 w-3.5 mr-1 text-slate-500" />
              Chỉnh sửa
            </button>
            {currentUserRole === "ADMIN" && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Xóa
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white px-4 rounded-t-xl">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center transition ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Tổng quan thiết bị
          </button>

          <button
            onClick={() => setActiveTab("tickets")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center transition ${
              activeTab === "tickets"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <LifeBuoy className="h-4 w-4 mr-2" />
            Yêu cầu hỗ trợ liên quan ({device._count.tickets})
          </button>

          <button
            onClick={() => setActiveTab("maintenance")}
            className={`py-3.5 text-xs font-bold border-b-2 flex items-center transition ${
              activeTab === "maintenance"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Wrench className="h-4 w-4 mr-2" />
            Lịch sử bảo trì / sửa chữa ({device._count.maintenances})
          </button>
        </nav>
      </div>

      {/* TAB 1: TỔNG QUAN */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center">
                <Monitor className="h-4 w-4 text-blue-600 mr-2" />
                Thông số kỹ thuật & Vị trí
              </h2>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Loại thiết bị</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {device.category.name}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Số Serial</span>
                  <span className="font-mono font-semibold text-slate-800 text-sm">
                    {device.serial || "Không có"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Hãng sản xuất</span>
                  <span className="font-semibold text-slate-800 text-sm">{device.brand}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Model máy</span>
                  <span className="font-semibold text-slate-800 text-sm">{device.model}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Phòng ban quản lý</span>
                  <span className="font-semibold text-slate-800">
                    {device.department.name} ({device.department.code})
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Vị trí lắp đặt / sử dụng</span>
                  <span className="font-semibold text-slate-800 flex items-center">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mr-1" />
                    {device.location || "Chưa xác định"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Tình trạng vật lý</span>
                  <span className="font-semibold text-slate-800">
                    {device.condition || "Bình thường"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Trạng thái vận hành</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadge(
                      device.status
                    )}`}
                  >
                    {device.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Warranty & Purchase Date */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center">
                <Shield className="h-4 w-4 text-emerald-600 mr-2" />
                Vòng đời & Bảo hành
              </h2>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Ngày mua sắm</span>
                  <span className="font-semibold text-slate-800 flex items-center">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 mr-1" />
                    {formatDate(device.purchaseDate)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Thời hạn bảo hành</span>
                  <span className="font-semibold text-slate-800 flex items-center">
                    <Clock className="h-3.5 w-3.5 text-slate-400 mr-1" />
                    {formatDate(device.warrantyEndDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User in Charge & Quick Summary */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center">
                <User className="h-4 w-4 text-blue-600 mr-2" />
                Người sử dụng hiện tại
              </h2>

              {device.assignedUser ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                      {device.assignedUser.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {device.assignedUser.fullName}
                      </p>
                      <p className="text-slate-500 font-mono">
                        {device.assignedUser.employeeCode}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-slate-600">
                    <p>
                      Chức danh: <strong>{device.assignedUser.title}</strong>
                    </p>
                    <p>
                      Email: <strong>{device.assignedUser.email}</strong>
                    </p>
                    <p>
                      Điện thoại: <strong>{device.assignedUser.phone || "—"}</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <User className="h-8 w-8 mx-auto text-slate-300 mb-1" />
                  Thiết bị hiện chưa bàn giao cho cá nhân cụ thể (Dùng chung hoặc lưu kho).
                </div>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Lịch sử hoạt động
              </h2>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500">Tổng yêu cầu hỗ trợ (Ticket):</span>
                <span className="font-bold text-blue-600 text-sm">{device._count.tickets}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100">
                <span className="text-slate-500">Số lần bảo trì / sửa chữa:</span>
                <span className="font-bold text-purple-600 text-sm">
                  {device._count.maintenances}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: YÊU CẦU HỖ TRỢ LIÊN QUAN */}
      {activeTab === "tickets" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center">
              <LifeBuoy className="h-4 w-4 text-blue-600 mr-2" />
              Danh sách các yêu cầu hỗ trợ kỹ thuật phát sinh trên thiết bị
            </h3>
            <span className="text-xs text-slate-500">
              Tổng số: <strong>{device.tickets.length}</strong> ticket
            </span>
          </div>

          {device.tickets.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Chưa có yêu cầu hỗ trợ nào phát sinh trên thiết bị này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Mã Ticket</th>
                    <th className="px-5 py-3">Thời điểm tiếp nhận</th>
                    <th className="px-5 py-3">Người yêu cầu</th>
                    <th className="px-5 py-3">Nhóm sự cố</th>
                    <th className="px-5 py-3">Mô tả sự cố</th>
                    <th className="px-5 py-3">Độ ưu tiên</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Người phụ trách</th>
                    <th className="px-5 py-3">Kết quả xử lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {device.tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3 font-bold text-blue-600">
                        <Link href={`/tickets/${t.id}`} className="hover:underline">
                          {t.code}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{formatDateTime(t.receivedAt)}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {t.requester.fullName} ({t.requester.employeeCode})
                      </td>
                      <td className="px-5 py-3 text-slate-700">{t.category.name}</td>
                      <td className="px-5 py-3 text-slate-700 max-w-xs truncate" title={t.description}>
                        {t.description}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${getPriorityBadge(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-slate-700">{t.status}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {t.assignee ? t.assignee.fullName : "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-500 max-w-xs truncate">
                        {t.resolution || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LỊCH SỬ BẢO TRÌ SỬA CHỮA */}
      {activeTab === "maintenance" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center">
              <Wrench className="h-4 w-4 text-purple-600 mr-2" />
              Lịch sử bảo dưỡng định kỳ và sửa chữa thiết bị
            </h3>
            <span className="text-xs text-slate-500">
              Tổng số: <strong>{device.maintenances.length}</strong> lần
            </span>
          </div>

          {device.maintenances.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Thiết bị chưa có ghi nhận bảo trì hoặc sửa chữa nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Mã bảo trì</th>
                    <th className="px-5 py-3">Ngày thực hiện</th>
                    <th className="px-5 py-3">Loại công việc</th>
                    <th className="px-5 py-3">Kỹ thuật viên thực hiện</th>
                    <th className="px-5 py-3">Kết quả kiểm tra</th>
                    <th className="px-5 py-3">Chi phí (VNĐ)</th>
                    <th className="px-5 py-3">Hạn kiểm tra tiếp theo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {device.maintenances.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3 font-bold text-purple-700">{m.code}</td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(m.performedAt)}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{m.maintenanceType}</td>
                      <td className="px-5 py-3 text-slate-700">
                        {m.performer.fullName} ({m.performer.employeeCode})
                      </td>
                      <td className="px-5 py-3 text-slate-600">{m.result}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {formatCurrency(m.cost)}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {m.nextCheckAt ? formatDate(m.nextCheckAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center">
                <Edit3 className="h-4 w-4 mr-2 text-blue-600" />
                Cập nhật thiết bị {device.code}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hãng sx</label>
                  <input
                    type="text"
                    required
                    value={editForm.brand}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    value={editForm.model}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Serial</label>
                  <input
                    type="text"
                    value={editForm.serial}
                    onChange={(e) => setEditForm({ ...editForm, serial: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Đang sử dụng">Đang sử dụng</option>
                    <option value="Ngừng sử dụng">Ngừng sử dụng</option>
                    <option value="Cần theo dõi">Cần theo dõi</option>
                    <option value="Dự phòng">Dự phòng</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vị trí</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tình trạng</label>
                  <input
                    type="text"
                    value={editForm.condition}
                    onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center"
                >
                  {editLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
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
