import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSession } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  identifier: z.string().min(1, "Vui lòng nhập Email hoặc Mã nhân viên"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.errors[0]?.message || "Dữ liệu đăng nhập không hợp lệ",
        },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;

    // Search user by email or employeeCode
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
          { employeeCode: { equals: identifier.toUpperCase() } },
        ],
      },
      include: {
        department: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản hoặc mật khẩu không chính xác",
        },
        { status: 401 }
      );
    }

    // Verify password hash
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản hoặc mật khẩu không chính xác",
        },
        { status: 401 }
      );
    }

    // Check status
    if (user.status !== "Đang làm việc") {
      return NextResponse.json(
        {
          success: false,
          error: `Tài khoản của bạn đang ở trạng thái '${user.status}'. Vui lòng liên hệ Quản trị viên.`,
        },
        { status: 403 }
      );
    }

    const sessionUser = {
      id: user.id,
      employeeCode: user.employeeCode,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: user.department.name,
      title: user.title,
    };

    await setSession(sessionUser);

    return NextResponse.json({
      success: true,
      data: sessionUser,
      message: "Đăng nhập thành công",
    });
  } catch (err: unknown) {
    console.error("Login error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Đã xảy ra lỗi máy chủ trong quá trình xử lý",
      },
      { status: 500 }
    );
  }
}
