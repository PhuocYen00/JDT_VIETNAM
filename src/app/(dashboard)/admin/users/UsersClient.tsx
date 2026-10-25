"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldAlert,
  UserCheck,
  Lock,
  Unlock,
} from "lucide-react";

interface Department {
  id: string;
  code: string;
  name: string;
}

interface UserItem {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  title: string;
  status: string;
  role: "ADMIN" | "IT_SUPPORT" | "USER";
  department: { id: string; code: string; name: string };
  ticketCount: number;
  deviceCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function UsersClient({ departments }: { departments: Department[] }) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserItem | null>(null);
  const [lockingUser, setLockingUser] = useState<{ user: UserItem; isLock: boolean } | null>(null);

  // Form create state
  const [formData, setFormData] = useState({
    employeeCode: "",
    fullName: "",
    email: "",
    departmentId: departments[0]?.id || "",
    role: "USER",
    title: "Nhân viên",
    phone: "",
    status: "Đang làm việc",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: "15",
      });
      if (search) params.append("search", search);
      if (departmentId) params.append("departmentId", departmentId);
      if (role) params.append("role", role);
      if (status) params.append("status", status);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, departmentId, role, status]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tạo người dùng thất bại");

      setMessage({ type: "success", text: data.message });
      setIsCreateOpen(false);
      setFormData({
        employeeCode: "",
        fullName: "",
        email: "",
        departmentId: departments[0]?.id || "",
        role: "USER",
        title: "Nhân viên",
        phone: "",
        status: "Đang làm việc",
      });
      fetchUsers(pagination.page);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          fullName: editingUser.fullName,
          departmentId: editingUser.department.id,
          role: editingUser.role,
          title: editingUser.title,
          phone: editingUser.phone,
          status: editingUser.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật thất bại");

      setMessage({ type: "success", text: data.message });
      setEditingUser(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLock = async () => {
    if (!lockingUser) return;
    setActionLoading(true);
    setMessage(null);

    const newStatus = lockingUser.isLock ? "Khóa tài khoản" : "Đang làm việc";

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lockingUser.user.id,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Thao tác thất bại");

      setMessage({
        type: "success",
        text: `Đã ${lockingUser.isLock ? "khóa tài khoản" : "mở khóa tài khoản"} ${
          lockingUser.user.fullName
        }`,
      });
      setLockingUser(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resettingUser) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resettingUser.id,
          resetPassword: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đặt lại mật khẩu thất bại");

      setMessage({
        type: "success",
        text: `Đã đặt lại mật khẩu cho ${resettingUser.fullName} thành Abcd@1234`,
      });
      setResettingUser(null);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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

      {/* Bộ lọc & Thao tác */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã NV, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-200 pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="w-full sm:w-48 text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full sm:w-36 text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tất cả vai trò</option>
            <option value="ADMIN">ADMIN</option>
            <option value="IT_SUPPORT">IT_SUPPORT</option>
            <option value="USER">USER</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full sm:w-36 text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Đang làm việc">Đang làm việc</option>
            <option value="Khóa tài khoản">Khóa tài khoản</option>
            <option value="Nghỉ việc">Nghỉ việc</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex-shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Thêm người dùng mới
        </button>
      </div>

      {/* Bảng danh sách người dùng */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Mã NV</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4">Chức danh / Email</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy người dùng phù hợp điều kiện lọc.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.employeeCode}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{u.fullName}</td>
                    <td className="py-3 px-4 text-slate-600">{u.department.name}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-700">{u.title || "—"}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : u.role === "IT_SUPPORT"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {u.role === "ADMIN" ? (
                          <ShieldAlert className="h-3 w-3 mr-1" />
                        ) : u.role === "IT_SUPPORT" ? (
                          <Shield className="h-3 w-3 mr-1" />
                        ) : (
                          <UserCheck className="h-3 w-3 mr-1" />
                        )}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.status === "Đang làm việc"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : u.status === "Khóa tài khoản"
                            ? "bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {/* Nút Khóa / Mở khóa tài khoản */}
                      <button
                        onClick={() =>
                          setLockingUser({
                            user: u,
                            isLock: u.status !== "Khóa tài khoản",
                          })
                        }
                        title={u.status === "Khóa tài khoản" ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                        className={`p-1.5 rounded-lg transition ${
                          u.status === "Khóa tài khoản"
                            ? "text-rose-600 hover:bg-rose-50"
                            : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        }`}
                      >
                        {u.status === "Khóa tài khoản" ? (
                          <Lock className="h-3.5 w-3.5 text-rose-600" />
                        ) : (
                          <Unlock className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Nút Chỉnh sửa */}
                      <button
                        onClick={() => setEditingUser(u)}
                        title="Chỉnh sửa thông tin"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Nút Đặt lại mật khẩu */}
                      <button
                        onClick={() => setResettingUser(u)}
                        title="Đặt lại mật khẩu về Abcd@1234"
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Hiển thị trang <strong>{pagination.page}</strong> /{" "}
            <strong>{pagination.totalPages || 1}</strong> (Tổng số:{" "}
            <strong>{pagination.total}</strong> người dùng)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tạo người dùng mới */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Thêm tài khoản người dùng mới</h3>
            <p className="text-xs text-slate-500 mb-4">
              Mật khẩu khởi tạo ban đầu cho tài khoản là <strong>Abcd@1234</strong>.
            </p>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã nhân viên *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: NV0181"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn A"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email đăng nhập *</label>
                  <input
                    type="email"
                    required
                    placeholder="nva@jdt.local"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    placeholder="09xx xxx xxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phòng ban *</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vai trò *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="USER">USER (Người dùng)</option>
                    <option value="IT_SUPPORT">IT_SUPPORT (Hỗ trợ CNTT)</option>
                    <option value="ADMIN">ADMIN (Quản trị viên)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chức danh *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhân viên"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Đang làm việc">Đang làm việc</option>
                    <option value="Khóa tài khoản">Khóa tài khoản</option>
                    <option value="Nghỉ việc">Nghỉ việc</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
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
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa người dùng */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Chỉnh sửa: {editingUser.fullName} ({editingUser.employeeCode})
            </h3>
            <p className="text-xs text-slate-500 mb-4">Cập nhật thông tin, chức vụ hoặc trạng thái.</p>

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phòng ban</label>
                  <select
                    value={editingUser.department.id}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        department: {
                          ...editingUser.department,
                          id: e.target.value,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vai trò</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        role: e.target.value as any,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="USER">USER</option>
                    <option value="IT_SUPPORT">IT_SUPPORT</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chức danh</label>
                  <input
                    type="text"
                    value={editingUser.title}
                    onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Đang làm việc">Đang làm việc</option>
                    <option value="Khóa tài khoản">Khóa tài khoản</option>
                    <option value="Nghỉ việc">Nghỉ việc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
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
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Khóa / Mở khóa */}
      {lockingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in duration-150">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                lockingUser.isLock ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {lockingUser.isLock ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {lockingUser.isLock ? "Xác nhận Khóa tài khoản" : "Xác nhận Mở khóa tài khoản"}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Bạn có chắc chắn muốn {lockingUser.isLock ? "khóa quyền truy cập" : "kích hoạt lại"} của{" "}
              <strong>{lockingUser.user.fullName}</strong> ({lockingUser.user.employeeCode})?
              {lockingUser.isLock && " Người này sẽ không thể đăng nhập vào hệ thống sau khi bị khóa."}
            </p>

            <div className="flex items-center justify-center space-x-3 mt-5">
              <button
                type="button"
                onClick={() => setLockingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleToggleLock}
                disabled={actionLoading}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg inline-flex items-center ${
                  lockingUser.isLock
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                {lockingUser.isLock ? "Khóa tài khoản" : "Mở khóa ngay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Đặt lại mật khẩu */}
      {resettingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in duration-150">
            <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Đặt lại mật khẩu</h3>
            <p className="text-xs text-slate-500 mt-2">
              Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản{" "}
              <strong>{resettingUser.fullName}</strong> ({resettingUser.employeeCode}) về mật khẩu
              mặc định <strong>Abcd@1234</strong> không?
            </p>

            <div className="flex items-center justify-center space-x-3 mt-5">
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg inline-flex items-center"
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Xác nhận đặt lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
