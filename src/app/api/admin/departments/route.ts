import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const departments = await prisma.department.findMany({
      orderBy: { code: "asc" },
      include: {
        _count: {
          select: {
            users: true,
            devices: true,
            tickets: true,
          },
        },
      },
    });

    return NextResponse.json({
      departments: departments.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        userCount: d._count.users,
        deviceCount: d._count.devices,
        ticketCount: d._count.tickets,
      })),
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Lỗi lấy danh sách phòng ban:", err);
    return NextResponse.json(
      { message: "Không thể lấy danh sách phòng ban", error: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);

    const body = await req.json();
    const { code, name } = body;

    if (!code || !name) {
      return NextResponse.json(
        { message: "Mã phòng ban và Tên phòng ban là bắt buộc" },
        { status: 400 }
      );
    }

    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { message: `Mã phòng ban '${code}' đã tồn tại` },
        { status: 400 }
      );
    }

    const dept = await prisma.department.create({
      data: { code: code.trim(), name: name.trim() },
    });

    return NextResponse.json({
      message: "Thêm phòng ban mới thành công",
      department: dept,
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Lỗi tạo phòng ban:", err);
    return NextResponse.json(
      { message: "Tạo phòng ban thất bại", error: String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);

    const body = await req.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ message: "Thiếu ID hoặc Tên phòng ban" }, { status: 400 });
    }

    const updated = await prisma.department.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json({
      message: "Cập nhật phòng ban thành công",
      department: updated,
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Lỗi cập nhật phòng ban:", err);
    return NextResponse.json(
      { message: "Cập nhật phòng ban thất bại", error: String(err) },
      { status: 500 }
    );
  }
}
