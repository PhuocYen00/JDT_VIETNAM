"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SessionUser } from "@/types";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Monitor,
  LifeBuoy,
  Wrench,
  Package,
  ArrowLeftRight,
  BarChart3,
  Users,
  Building2,
  Tags,
  FileSpreadsheet,
  History,
} from "lucide-react";

interface SidebarProps {
  user: SessionUser;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Tổng quan",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          roles: ["ADMIN", "IT_SUPPORT", "USER"],
        },
      ],
    },
    {
      title: "Quản lý vận hành",
      items: [
        {
          name: "Thiết bị CNTT",
          href: "/devices",
          icon: Monitor,
          roles: ["ADMIN", "IT_SUPPORT", "USER"],
        },
        {
          name: "Yêu cầu hỗ trợ (Ticket)",
          href: "/tickets",
          icon: LifeBuoy,
          roles: ["ADMIN", "IT_SUPPORT", "USER"],
        },
        {
          name: "Bảo trì / Sửa chữa",
          href: "/maintenance",
          icon: Wrench,
          roles: ["ADMIN", "IT_SUPPORT"],
        },
      ],
    },
    {
      title: "Kho & Báo cáo",
      items: [
        {
          name: "Linh kiện & Tồn kho",
          href: "/inventory/parts",
          icon: Package,
          roles: ["ADMIN", "IT_SUPPORT"],
        },
        {
          name: "Giao dịch linh kiện",
          href: "/inventory/transactions",
          icon: ArrowLeftRight,
          roles: ["ADMIN", "IT_SUPPORT"],
        },
        {
          name: "Báo cáo thống kê",
          href: "/reports",
          icon: BarChart3,
          roles: ["ADMIN", "IT_SUPPORT"],
        },
      ],
    },
    {
      title: "Hệ thống & Quản trị",
      items: [
        {
          name: "Người dùng",
          href: "/admin/users",
          icon: Users,
          roles: ["ADMIN"],
        },
        {
          name: "Phòng ban",
          href: "/admin/departments",
          icon: Building2,
          roles: ["ADMIN"],
        },
        {
          name: "Danh mục",
          href: "/admin/categories",
          icon: Tags,
          roles: ["ADMIN"],
        },
        {
          name: "Nhập dữ liệu Excel",
          href: "/admin/import",
          icon: FileSpreadsheet,
          roles: ["ADMIN"],
        },
        {
          name: "Nhật ký hệ thống",
          href: "/admin/audit-logs",
          icon: History,
          roles: ["ADMIN"],
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 h-screen sticky top-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm mr-3">
          JDT
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-slate-800 tracking-tight leading-tight">
            IT SUPPORT
          </span>
          <span className="text-[11px] text-slate-500 leading-tight">
            JDT Việt Nam
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {navItems.map((group) => {
          const visibleItems = group.items.filter((item) =>
            item.roles.includes(user.role)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title}>
              <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {group.title}
              </div>
              <nav className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <Icon
                        className={cn(
                          "mr-3 h-4 w-4 flex-shrink-0",
                          isActive ? "text-blue-600" : "text-slate-400"
                        )}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* User Info Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs">
            {user.fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user.fullName}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {user.title || user.employeeCode}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
