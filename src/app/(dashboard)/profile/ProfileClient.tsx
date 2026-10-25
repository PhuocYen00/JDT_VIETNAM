"use client";

import { useState } from "react";
import {
  User,
  KeyRound,
  Shield,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Info,
} from "lucide-react";

interface UserProfile {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  title: string;
  status: string;
  role: string;
  departmentName: string;
  createdAt: string;
}

export default function ProfileClient({ user }: { user: UserProfile }) {
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");

  // Form info
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoLoading(true);
    setInfoMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật hồ sơ thất bại");

      setInfoMessage({ type: "success", text: data.message });
    } catch (err: any) {
      setInfoMessage({ type: "error", text: err.message });
    } finally {
      setInfoLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwMessage(null);

    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đổi mật khẩu thất bại");

      setPwMessage({ type: "success", text: data.message });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwMessage({ type: "error", text: err.message });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex items-center px-6 py-3.5 text-xs font-bold transition-colors border-b-2 ${
            activeTab === "info"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <User className="h-4 w-4 mr-2" />
          Thông tin cá nhân
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`flex items-center px-6 py-3.5 text-xs font-bold transition-colors border-b-2 ${
            activeTab === "password"
              ? "border-blue-600 text-blue-600 bg-white"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <KeyRound className="h-4 w-4 mr-2" />
          Đổi mật khẩu
        </button>
      </div>

      <div className="p-6">
        {/* Tab 1: Thông tin cá nhân */}
        {activeTab === "info" && (
          <form onSubmit={handleUpdateInfo} className="space-y-4 max-w-xl">
            {infoMessage && (
              <div
                className={`p-3.5 rounded-lg border flex items-center space-x-2 text-xs font-medium ${
                  infoMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {infoMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{infoMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Mã nhân viên (Cố định)
                </label>
                <input
                  type="text"
                  disabled
                  value={user.employeeCode}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500 cursor-not-allowed font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Vai trò hệ thống
                </label>
                <div className="flex items-center h-[34px]">
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Shield className="h-3.5 w-3.5 mr-1" />
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Phòng ban trực thuộc
                </label>
                <input
                  type="text"
                  disabled
                  value={user.departmentName}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Chức danh công việc
                </label>
                <input
                  type="text"
                  disabled
                  value={user.title || "Nhân viên"}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Email đăng nhập
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full text-xs rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Email do quản trị viên quản lý. Liên hệ Ban CNTT nếu cần thay đổi địa chỉ email.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Thông tin được phép tự cập nhật
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="text"
                  placeholder="09xx xxx xxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={infoLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                {infoLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Lưu thông tin hồ sơ
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Đổi mật khẩu */}
        {activeTab === "password" && (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
            {pwMessage && (
              <div
                className={`p-3.5 rounded-lg border flex items-center space-x-2 text-xs font-medium ${
                  pwMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {pwMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{pwMessage.text}</span>
              </div>
            )}

            {/* Thông báo chính sách mật khẩu */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
              <div className="flex items-center font-bold">
                <Info className="h-4 w-4 mr-1.5 text-blue-600 flex-shrink-0" />
                Chính sách an toàn mật khẩu:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-700 pl-1">
                <li>Tối thiểu <strong>8 ký tự</strong>.</li>
                <li>Có ít nhất <strong>1 chữ cái viết hoa</strong> (A–Z) và <strong>1 chữ thường</strong> (a–z).</li>
                <li>Có ít nhất <strong>1 chữ số</strong> (0–9).</li>
                <li>Có ít nhất <strong>1 ký tự đặc biệt</strong> (ví dụ: @, #, $, !, %, *, ?...).</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu hiện tại *
              </label>
              <input
                type="password"
                required
                placeholder="Nhập mật khẩu hiện tại đang dùng"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu mới *
              </label>
              <input
                type="password"
                required
                placeholder="Nhập mật khẩu mới thỏa mãn chính sách"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Xác nhận mật khẩu mới *
              </label>
              <input
                type="password"
                required
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pwLoading}
                className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                {pwLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Cập nhật mật khẩu mới
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
