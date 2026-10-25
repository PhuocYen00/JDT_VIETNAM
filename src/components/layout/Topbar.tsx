"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { SessionUser } from "@/types";
import {
  LogOut,
  ChevronRight,
  Loader2,
  Search,
  Bell,
  User,
  KeyRound,
  Shield,
  Monitor,
  LifeBuoy,
  Users,
  Package,
  Check,
  AlertTriangle,
  X,
} from "lucide-react";

interface TopbarProps {
  user: SessionUser;
}

const roleBadgeMap: Record<string, { label: string; className: string }> = {
  ADMIN: {
    label: "Quản trị viên",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  IT_SUPPORT: {
    label: "Hỗ trợ CNTT",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  USER: {
    label: "Người dùng",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

const routeTitleMap: Record<string, string> = {
  "/dashboard": "Bảng điều khiển",
  "/devices": "Thiết bị CNTT",
  "/tickets": "Yêu cầu hỗ trợ",
  "/tickets/new": "Tạo yêu cầu mới",
  "/maintenance": "Bảo trì / Sửa chữa",
  "/inventory/parts": "Linh kiện & Kho",
  "/inventory/transactions": "Giao dịch linh kiện",
  "/reports": "Báo cáo thống kê",
  "/profile": "Hồ sơ cá nhân",
  "/admin/users": "Quản lý người dùng",
  "/admin/departments": "Quản lý phòng ban",
  "/admin/categories": "Quản lý danh mục",
  "/admin/import": "Nhập dữ liệu Excel",
  "/admin/audit-logs": "Nhật ký hệ thống (Audit Log)",
};

export default function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    devices: any[];
    tickets: any[];
    users: any[];
    parts: any[];
  } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // User Dropdown State
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Logout Confirm Modal
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close popups on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [pathname]);

  // Debounced Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setSearchOpen(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  };

  const roleInfo = roleBadgeMap[user.role] || {
    label: user.role,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const currentTitle = routeTitleMap[pathname] || "Hệ thống";

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Breadcrumb / Title */}
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-slate-500 font-medium">JDT Việt Nam</span>
        <ChevronRight className="h-4 w-4 text-slate-400" />
        <span className="font-semibold text-slate-800">{currentTitle}</span>
      </div>

      {/* Center Search Input */}
      <div className="relative w-72 hidden md:block" ref={searchRef}>
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm thiết bị, ticket, người dùng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchResults) setSearchOpen(true);
          }}
          className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />
        )}

        {/* Search Results Dropdown */}
        {searchOpen && searchResults && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50 text-xs divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {/* Devices */}
            {searchResults.devices.length > 0 && (
              <div className="p-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center">
                  <Monitor className="h-3 w-3 mr-1" /> Thiết bị CNTT
                </span>
                {searchResults.devices.map((d) => (
                  <Link
                    key={d.id}
                    href={`/devices/${d.id}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{d.code}</span>{" "}
                      <span className="text-slate-500 font-normal">
                        ({d.brand} {d.model})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{d.status}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Tickets */}
            {searchResults.tickets.length > 0 && (
              <div className="p-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center">
                  <LifeBuoy className="h-3 w-3 mr-1" /> Yêu cầu hỗ trợ (Ticket)
                </span>
                {searchResults.tickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <div className="truncate max-w-[200px]">
                      <span className="font-bold text-blue-600">{t.code}</span>{" "}
                      <span className="text-slate-600 truncate">{t.description}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{t.status}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Users */}
            {searchResults.users.length > 0 && (
              <div className="p-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center">
                  <Users className="h-3 w-3 mr-1" /> Người dùng
                </span>
                {searchResults.users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded-md"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{u.fullName}</span>{" "}
                      <span className="text-slate-400">({u.employeeCode})</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Parts */}
            {searchResults.parts.length > 0 && (
              <div className="p-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center">
                  <Package className="h-3 w-3 mr-1" /> Linh kiện kho
                </span>
                {searchResults.parts.map((p) => (
                  <Link
                    key={p.id}
                    href="/inventory/parts"
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{p.code}</span>{" "}
                      <span className="text-slate-600">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600">
                      Tồn: {p.stockQuantity} {p.unit}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {searchResults.devices.length === 0 &&
              searchResults.tickets.length === 0 &&
              searchResults.users.length === 0 &&
              searchResults.parts.length === 0 && (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Không tìm thấy kết quả phù hợp với "{searchQuery}".
                </div>
              )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Role badge */}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleInfo.className}`}
        >
          {roleInfo.label}
        </span>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Thông báo"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-100">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-xs font-bold text-slate-800">
                  Thông báo hệ thống ({unreadCount} mới)
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-600 hover:underline font-medium flex items-center"
                  >
                    <Check className="h-3 w-3 mr-0.5" /> Đã đọc tất cả
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto text-xs">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">Không có thông báo mới.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 hover:bg-slate-50 transition-colors ${
                        !n.isRead ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px]">{n.title}</span>
                        {!n.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => setNotifOpen(false)}
                          className="inline-block text-[10px] font-semibold text-blue-600 hover:underline mt-1"
                        >
                          Xem chi tiết →
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user.fullName.charAt(0)}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[120px]">
                {user.fullName}
              </span>
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in duration-100 text-xs divide-y divide-slate-100">
              <div className="px-3 py-2">
                <p className="font-bold text-slate-800 truncate">{user.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>

              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-slate-700 hover:bg-slate-50 transition"
                >
                  <User className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  Hồ sơ cá nhân
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center px-3 py-2 text-slate-700 hover:bg-slate-50 transition"
                >
                  <KeyRound className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  Đổi mật khẩu
                </Link>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setLogoutModalOpen(true);
                  }}
                  className="w-full flex items-center px-3 py-2 text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog Logout */}
      {logoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in duration-150">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <LogOut className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Xác nhận đăng xuất</h3>
            <p className="text-xs text-slate-500 mt-2">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống JDT IT Support không?
            </p>

            <div className="flex items-center justify-center space-x-3 mt-5">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Ở lại
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg inline-flex items-center shadow-xs transition"
              >
                {loggingOut && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Đăng xuất ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
