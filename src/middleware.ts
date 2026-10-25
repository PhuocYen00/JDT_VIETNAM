import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "jdt_it_management_super_secure_session_secret_2026_key!"
);
const COOKIE_NAME = "jdt_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(COOKIE_NAME)?.value;
  let session: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY, { algorithms: ["HS256"] });
      session = payload;
    } catch {
      session = null;
    }
  }

  // 1. Kiểm tra xác thực (Authentication)
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { message: "Chưa xác thực danh tính", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Phân quyền cấp cao (RBAC)
  // Chỉ ADMIN mới được vào các trang và API /admin/*
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (session.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { message: "Quyền truy cập bị từ chối", error: "FORBIDDEN" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Phân hệ kho /inventory/* chỉ dành cho ADMIN và IT_SUPPORT
  if (pathname.startsWith("/inventory") || pathname.startsWith("/api/inventory")) {
    if (session.role !== "ADMIN" && session.role !== "IT_SUPPORT") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { message: "Quyền truy cập bị từ chối", error: "FORBIDDEN" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Báo cáo /reports/* chỉ dành cho ADMIN và IT_SUPPORT
  if (pathname.startsWith("/reports") || pathname.startsWith("/api/reports")) {
    if (session.role !== "ADMIN" && session.role !== "IT_SUPPORT") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { message: "Quyền truy cập bị từ chối", error: "FORBIDDEN" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/devices/:path*",
    "/tickets/:path*",
    "/maintenance/:path*",
    "/inventory/:path*",
    "/reports/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/api/admin/:path*",
    "/api/devices/:path*",
    "/api/tickets/:path*",
    "/api/maintenance/:path*",
    "/api/inventory/:path*",
    "/api/parts/:path*",
    "/api/reports/:path*",
    "/api/dashboard/:path*",
    "/api/profile/:path*",
  ],
};
