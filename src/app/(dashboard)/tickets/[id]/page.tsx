"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  ChevronLeft,
  Calendar,
  Clock,
  User,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Star,
  Send,
  Loader2,
  ArrowRight,
  ShieldAlert,
  RotateCcw,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface TicketDetail {
  id: string;
  code: string;
  receivedAt: string;
  completedAt: string | null;
  description: string;
  priority: string;
  status: string;
  channel: string;
  resolutionHours: number | null;
  resolution: string | null;
  rating: number | null;
  requesterId: string;
  assigneeId: string | null;
  category: { id: string; name: string };
  department: { id: string; code: string; name: string };
  device: {
    id: string;
    code: string;
    brand: string;
    model: string;
    category: { name: string };
  } | null;
  requester: {
    id: string;
    employeeCode: string;
    fullName: string;
    email: string;
    phone: string | null;
    title: string;
  };
  assignee: {
    id: string;
    employeeCode: string;
    fullName: string;
    email: string;
    phone: string | null;
    title: string;
  } | null;
  histories: Array<{
    id: string;
    code: string;
    happenedAt: string;
    action: string;
    content: string;
    actor: {
      id: string;
      employeeCode: string;
      fullName: string;
    };
  }>;
}

interface StaffOption {
  id: string;
  employeeCode: string;
  fullName: string;
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; fullName: string } | null>(null);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);

  // Action form state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Resolution modal
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState("");

  // Reopen modal (for Admin)
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenNote, setReopenNote] = useState("");

  // Rating state
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Fetch current user and staff
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCurrentUser(data.data);
      })
      .catch(() => {});

    fetch("/api/tickets?pageSize=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.filterOptions?.assignees) {
          setStaffList(data.data.filterOptions.assignees);
        }
      })
      .catch(() => {});
  }, []);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${resolvedParams.id}`);
      const data = await res.json();
      if (data.success) {
        setTicket(data.data);
        if (data.data.rating) {
          setSelectedRating(data.data.rating);
        }
      }
    } catch (err) {
      console.error("Lỗi tải chi tiết ticket:", err);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleUpdateStatus = async (newStatus: string, resolution?: string, note?: string) => {
    setActionLoading(true);
    setActionError(null);

    try {
      const payload: Record<string, unknown> = {
        status: newStatus,
        actionNote: note,
      };

      // Auto assign to self if currently unassigned and status becomes "Đang xử lý"
      if (newStatus === "Đang xử lý" && !ticket?.assigneeId && currentUser) {
        payload.assigneeId = currentUser.id;
      }

      if (resolution) {
        payload.resolution = resolution;
      }

      const res = await fetch(`/api/tickets/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionError(data.error || "Không thể cập nhật trạng thái yêu cầu");
        setActionLoading(false);
        return;
      }

      setResolutionModalOpen(false);
      setReopenModalOpen(false);
      fetchTicket();
    } catch {
      setActionError("Lỗi kết nối máy chủ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/tickets/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: newAssigneeId || null }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionError(data.error || "Không thể phân công người phụ trách");
        setActionLoading(false);
        return;
      }

      fetchTicket();
    } catch {
      setActionError("Lỗi kết nối máy chủ");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (selectedRating === 0) return;
    setRatingLoading(true);

    try {
      const res = await fetch(`/api/tickets/${resolvedParams.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selectedRating, feedback: ratingFeedback }),
      });
      const data = await res.json();
      if (data.success) {
        setRatingSuccess(true);
        fetchTicket();
      } else {
        alert(data.error || "Không thể gửi đánh giá");
      }
    } catch {
      alert("Lỗi kết nối máy chủ khi gửi đánh giá");
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-3" />
        Đang tải thông tin yêu cầu hỗ trợ...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Không tìm thấy yêu cầu</h2>
        <p className="text-xs text-slate-500">Mã yêu cầu không tồn tại hoặc bạn không có quyền xem.</p>
        <Link
          href="/tickets"
          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:underline"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  const isStaff = currentUser?.role === "ADMIN" || currentUser?.role === "IT_SUPPORT";
  const isRequester = currentUser?.id === ticket.requesterId;

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "Mới tiếp nhận":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Đang xử lý":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Chờ phản hồi":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Tạm hoãn":
        return "bg-slate-100 text-slate-700 border-slate-300";
      case "Hoàn thành":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "Khẩn cấp":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "Cao":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Trung bình":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/tickets"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition text-slate-600"
            title="Quay lại danh sách"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">{ticket.code}</h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                  ticket.status
                )}`}
              >
                {ticket.status}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border ${getPriorityBadge(
                  ticket.priority
                )}`}
              >
                {ticket.priority}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhóm sự cố: <strong>{ticket.category.name}</strong> | Tiếp nhận lúc:{" "}
              {formatDateTime(ticket.receivedAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons for Staff */}
        {isStaff && (
          <div className="flex flex-wrap items-center gap-2">
            {ticket.status === "Mới tiếp nhận" && (
              <>
                <button
                  onClick={() => handleUpdateStatus("Đang xử lý")}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Tiếp nhận & Xử lý
                </button>
                <button
                  onClick={() => handleUpdateStatus("Tạm hoãn")}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition"
                >
                  Tạm hoãn
                </button>
              </>
            )}

            {ticket.status === "Đang xử lý" && (
              <>
                <button
                  onClick={() => handleUpdateStatus("Chờ phản hồi")}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-semibold rounded-lg transition"
                >
                  Chờ phản hồi
                </button>
                <button
                  onClick={() => handleUpdateStatus("Tạm hoãn")}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition"
                >
                  Tạm hoãn
                </button>
                <button
                  onClick={() => setResolutionModalOpen(true)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Hoàn thành yêu cầu
                </button>
              </>
            )}

            {(ticket.status === "Chờ phản hồi" || ticket.status === "Tạm hoãn") && (
              <>
                <button
                  onClick={() => handleUpdateStatus("Đang xử lý")}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  Tiếp tục xử lý
                </button>
                <button
                  onClick={() => setResolutionModalOpen(true)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Hoàn thành
                </button>
              </>
            )}

            {ticket.status === "Hoàn thành" && currentUser?.role === "ADMIN" && (
              <button
                onClick={() => setReopenModalOpen(true)}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Mở lại yêu cầu
              </button>
            )}
          </div>
        )}
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* Main Grid: Left Details & Right Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Description Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center">
              <LifeBuoy className="h-4 w-4 text-amber-500 mr-2" />
              Nội dung yêu cầu hỗ trợ
            </h2>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </div>

            {/* Resolution info if completed */}
            {ticket.status === "Hoàn thành" && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg space-y-2">
                <div className="flex items-center text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" />
                  Kết quả & Hướng xử lý hoàn tất
                </div>
                <p className="text-sm text-emerald-950 whitespace-pre-wrap">
                  {ticket.resolution || "Sự cố đã được kiểm tra và xử lý hoàn tất ổn định."}
                </p>
                <div className="pt-2 border-t border-emerald-200/60 text-xs text-emerald-700 flex items-center justify-between">
                  <span>Hoàn thành lúc: {formatDateTime(ticket.completedAt)}</span>
                  <span>
                    Thời gian xử lý: <strong>{ticket.resolutionHours ?? "—"} giờ</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Rating Box for User */}
            {ticket.status === "Hoàn thành" && (isRequester || isStaff) && (
              <div className="bg-white border border-slate-200 p-5 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                    <Star className="h-4 w-4 text-amber-400 mr-1.5" />
                    Đánh giá chất lượng hỗ trợ
                  </h3>
                  {ticket.rating && (
                    <span className="text-xs font-bold text-amber-600 flex items-center">
                      {ticket.rating}/5 sao
                    </span>
                  )}
                </div>

                {ticket.rating && !ratingSuccess ? (
                  <div className="flex items-center space-x-1 py-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-5 w-5 ${
                          s <= ticket.rating!
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-slate-500 ml-2">
                      (Đã đánh giá {ticket.rating} sao)
                    </span>
                  </div>
                ) : isRequester ? (
                  <div className="space-y-3 pt-1">
                    <p className="text-xs text-slate-600">
                      Vui lòng đánh giá mức độ hài lòng về chất lượng hỗ trợ kỹ thuật:
                    </p>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setSelectedRating(star)}
                          className="p-1 focus:outline-none transition"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= (hoverRating || selectedRating)
                                ? "text-amber-400 fill-amber-400 scale-110"
                                : "text-slate-300"
                            } transition`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">
                        {selectedRating > 0 ? `${selectedRating} sao` : "Chọn số sao"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ghi nhận xét đóng góp (Tùy chọn)..."
                        value={ratingFeedback}
                        onChange={(e) => setRatingFeedback(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        onClick={handleRatingSubmit}
                        disabled={selectedRating === 0 || ratingLoading}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-40 transition"
                      >
                        {ratingLoading ? "Đang gửi..." : "Gửi đánh giá"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Người dùng chưa đánh giá sao.</p>
                )}
              </div>
            )}
          </div>

          {/* Related Device Info */}
          {ticket.device && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                  <Monitor className="h-4 w-4 text-blue-600 mr-2" />
                  Thiết bị gặp sự cố
                </h2>
                <Link
                  href={`/devices/${ticket.device.id}`}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center"
                >
                  Xem hồ sơ thiết bị <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Mã thiết bị</span>
                  <span className="font-bold text-blue-600 text-sm">{ticket.device.code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Loại thiết bị</span>
                  <span className="font-semibold text-slate-800">{ticket.device.category.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Hãng sản xuất</span>
                  <span className="font-semibold text-slate-800">{ticket.device.brand}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Model</span>
                  <span className="font-semibold text-slate-800">{ticket.device.model}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: People & Timeline */}
        <div className="space-y-6">
          {/* Stakeholders Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Thông tin liên quan
            </h2>

            {/* Requester */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Người yêu cầu</span>
              <div className="flex items-center space-x-3 text-xs">
                <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center">
                  {ticket.requester.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{ticket.requester.fullName}</p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    {ticket.requester.employeeCode} ({ticket.department.name})
                  </p>
                  <p className="text-slate-400 text-[11px]">{ticket.requester.email}</p>
                </div>
              </div>
            </div>

            {/* Assignee / Responsible Staff */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Người phụ trách xử lý</span>
              {isStaff ? (
                <div className="space-y-2">
                  <select
                    value={ticket.assigneeId || ""}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                    disabled={actionLoading}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="">-- Chưa gán người xử lý --</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              ) : ticket.assignee ? (
                <div className="flex items-center space-x-3 text-xs">
                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                    {ticket.assignee.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{ticket.assignee.fullName}</p>
                    <p className="text-slate-500 font-mono text-[11px]">
                      {ticket.assignee.employeeCode}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Đang chờ phân công kỹ thuật viên</p>
              )}
            </div>

            {/* Channel & Timing */}
            <div className="pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Kênh tiếp nhận:</span>
                <span className="font-semibold text-slate-800">{ticket.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời điểm gửi:</span>
                <span>{formatDateTime(ticket.receivedAt)}</span>
              </div>
              {ticket.completedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Thời điểm hoàn thành:</span>
                  <span>{formatDateTime(ticket.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* TIMELINE / AUDIT TRAIL */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <Clock className="h-4 w-4 text-blue-600 mr-2" />
                Tiến trình xử lý (Timeline)
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">{ticket.histories.length} bước</span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {ticket.histories.map((h) => (
                <div key={h.id} className="relative text-xs">
                  {/* Bullet */}
                  <div className="absolute -left-6 top-0.5 h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-sm" />

                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-slate-800">{h.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateTime(h.happenedAt)}
                    </span>
                  </div>

                  <p className="text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {h.content}
                  </p>

                  <div className="mt-1 text-[11px] text-slate-400 flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    Thực hiện bởi: <strong className="ml-1 text-slate-600">{h.actor.fullName}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL HOÀN THÀNH TICKET */}
      {resolutionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
                Hoàn thành yêu cầu hỗ trợ {ticket.code}
              </h3>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Vui lòng ghi lại tóm tắt giải pháp / hướng xử lý kỹ thuật đã thực hiện để hoàn tất yêu cầu:
              </p>
              <textarea
                rows={4}
                required
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="VD: Đã cập nhật bản vá driver máy in, in thử test page ổn định..."
                className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolutionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !resolutionText.trim()}
                  onClick={() => handleUpdateStatus("Hoàn thành", resolutionText.trim())}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Đang xử lý..." : "Xác nhận hoàn thành"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MỞ LẠI TICKET (CHO ADMIN) */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center">
                <RotateCcw className="h-4 w-4 mr-2 text-amber-600" />
                Mở lại yêu cầu {ticket.code}
              </h3>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Nhập lý do mở lại yêu cầu (Chuyển về trạng thái <strong>Đang xử lý</strong>):
              </p>
              <textarea
                rows={3}
                required
                value={reopenNote}
                onChange={(e) => setReopenNote(e.target.value)}
                placeholder="VD: Sự cố tái phát sau 2 ngày kiểm tra..."
                className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-600 text-sm"
              />
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !reopenNote.trim()}
                  onClick={() => handleUpdateStatus("Đang xử lý", undefined, reopenNote.trim())}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Đang xử lý..." : "Xác nhận mở lại"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
