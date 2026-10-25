import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JDT IT Support - Quản lý Thiết bị CNTT & Hỗ trợ Kỹ thuật",
  description: "Hệ thống quản lý thiết bị CNTT và tiếp nhận, xử lý yêu cầu hỗ trợ kỹ thuật tại Công ty TNHH JDT Việt Nam (Dữ liệu mô phỏng học tập/thực tập).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
