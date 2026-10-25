"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LifeBuoy,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Monitor,
  HelpCircle,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface DeviceOption {
  id: string;
  code: string;
  brand: string;
  model: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  const [formData, setFormData] = useState({
    categoryId: "",
    deviceId: "",
    priority: "Trung bình",
    channel: "Biểu mẫu nội bộ",
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch categories and devices from backend
    Promise.all([
      fetch("/api/tickets?pageSize=1").then((r) => r.json()),
      fetch("/api/devices?pageSize=100&status=Đang+sử+dụng").then((r) => r.json()),
    ])
      .then(([ticketData, deviceData]) => {
        if (ticketData.success && ticketData.data.filterOptions) {
          setCategories(ticketData.data.filterOptions.categories || []);
          if (ticketData.data.filterOptions.categories?.length > 0) {
            setFormData((prev) => ({
              ...prev,
              categoryId: ticketData.data.filterOptions.categories[0].id,
            }));
          }
        }
        if (deviceData.success) {
          setDevices(deviceData.data.items || []);
        }
      })
      .catch((err) => console.error("Lỗi tải thông tin danh mục:", err))
      .finally(() => setLoadingMetadata(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.categoryId) {
      setError("Vui lòng chọn nhóm sự cố");
      return;
    }

    if (formData.description.trim().length < 5) {
      setError("Mô tả chi tiết sự cố cần ít nhất 5 ký tự");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Không thể tạo yêu cầu. Vui lòng kiểm tra lại.");
        setSubmitting(false);
        return;
      }

      // Redirect to the newly created ticket detail page
      router.push(`/tickets/${data.data.id}`);
    } catch {
      setError("Lỗi kết nối máy chủ");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-center space-x-3">
        <Link
          href="/tickets"
          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition text-slate-600"
          title="Quay lại danh sách"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <LifeBuoy className="h-6 w-6 text-amber-500 mr-2" />
            Tạo Yêu cầu Hỗ trợ Kỹ thuật Mới
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Điền thông tin mô tả chi tiết sự cố để đội ngũ CNTT tiếp nhận và xử lý nhanh chóng
          </p>
        </div>
      </div>

      {/* Form Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {loadingMetadata ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
            Đang tải dữ liệu biểu mẫu...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nhóm sự cố */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nhóm sự cố <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Thiết bị gặp sự cố (nếu có) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Thiết bị gặp sự cố (Tùy chọn)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Để trống nếu lỗi mạng/phần mềm</span>
                </label>
                <select
                  value={formData.deviceId}
                  onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="">-- Không gắn thiết bị cụ thể --</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code} ({d.brand} {d.model})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mức độ ưu tiên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mức độ ưu tiên <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="Thấp">Thấp (Có thể xử lý trong ngày)</option>
                  <option value="Trung bình">Trung bình (Ảnh hưởng công việc thông thường)</option>
                  <option value="Cao">Cao (Ảnh hưởng tiến độ sản xuất / báo cáo)</option>
                  <option value="Khẩn cấp">Khẩn cấp (Ngừng dây chuyền hoặc hệ thống trọng yếu)</option>
                </select>
              </div>

              {/* Kênh tiếp nhận */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kênh tiếp nhận
                </label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="Biểu mẫu nội bộ">Biểu mẫu nội bộ (Web portal)</option>
                  <option value="Điện thoại">Điện thoại</option>
                  <option value="Email">Email</option>
                  <option value="Trực tiếp">Trực tiếp</option>
                </select>
              </div>
            </div>

            {/* Mô tả chi tiết */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mô tả chi tiết hiện tượng / sự cố <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả cụ thể hiện tượng xảy ra: Thông báo lỗi hiển thị, thời điểm xuất hiện, các thao tác đã thử..."
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center">
                <HelpCircle className="h-3.5 w-3.5 mr-1" />
                Mô tả càng chi tiết sẽ giúp kỹ thuật viên chẩn đoán và khắc phục sự cố nhanh hơn.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <Link
                href="/tickets"
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Hủy bỏ
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Đang gửi yêu cầu...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Gửi yêu cầu hỗ trợ
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
