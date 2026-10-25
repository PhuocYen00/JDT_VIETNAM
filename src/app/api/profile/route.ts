import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

// GET: Lấy thông tin hồ sơ người dùng hiện tại
export async function GET() {
  try {
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        department: { select: { id: true, code: true, name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
    }

    // Không bao giờ trả về passwordHash
    return NextResponse.json({
      user: {
        id: user.id,
        employeeCode: user.employeeCode,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        title: user.title,
        status: user.status,
        role: user.role,
        department: user.department,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("Lỗi lấy hồ sơ:", err);
    return NextResponse.json({ message: "Không thể lấy thông tin hồ sơ" }, { status: 500 });
  }
}

// PUT: Cập nhật thông tin được phép (Họ và tên, Số điện thoại)
export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { fullName, phone } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ message: "Họ và tên không được để trống" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : null,
      },
      include: {
        department: { select: { name: true } },
      },
    });

    await logAuditEvent({
      actorId: session.id,
      actorName: session.fullName,
      actorRole: session.role,
      action: "UPDATE_PROFILE",
      entityType: "USER",
      entityId: session.id,
      entityCode: session.employeeCode,
      description: `Người dùng tự cập nhật thông tin cá nhân (Họ tên: ${updatedUser.fullName}, SĐT: ${updatedUser.phone || "Trống"})`,
    });

    return NextResponse.json({
      message: "Cập nhật thông tin hồ sơ thành công",
      user: {
        id: updatedUser.id,
        employeeCode: updatedUser.employeeCode,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
      },
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("Lỗi cập nhật hồ sơ:", err);
    return NextResponse.json({ message: "Cập nhật hồ sơ thất bại" }, { status: 500 });
  }
}
