import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { logAuditEvent } from "@/lib/audit";

// Regex kiểm tra chính sách mật khẩu: tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: "Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "Mật khẩu mới và xác nhận mật khẩu không trùng khớp" },
        { status: 400 }
      );
    }

    // Kiểm tra chính sách mật khẩu
    if (!PASSWORD_REGEX.test(newPassword)) {
      return NextResponse.json(
        {
          message:
            "Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt.",
        },
        { status: 400 }
      );
    }

    // Lấy thông tin user trong DB để xác thực mật khẩu hiện tại
    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json({ message: "Không tìm thấy tài khoản người dùng" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Mật khẩu hiện tại không chính xác" },
        { status: 400 }
      );
    }

    // Băm mật khẩu mới bằng bcryptjs
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: session.id },
      data: { passwordHash: newPasswordHash },
    });

    await logAuditEvent({
      actorId: session.id,
      actorName: session.fullName,
      actorRole: session.role,
      action: "CHANGE_PASSWORD",
      entityType: "USER",
      entityId: session.id,
      entityCode: session.employeeCode,
      description: "Người dùng đổi mật khẩu tài khoản thành công theo chính sách bảo mật",
    });

    return NextResponse.json({
      success: true,
      message: "Đổi mật khẩu thành công. Vui lòng ghi nhớ mật khẩu mới của bạn.",
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("Lỗi đổi mật khẩu:", err);
    return NextResponse.json({ message: "Đổi mật khẩu thất bại" }, { status: 500 });
  }
}
