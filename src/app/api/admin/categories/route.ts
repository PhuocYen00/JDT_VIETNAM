import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole(["ADMIN"]);

    const [deviceCategories, ticketCategories] = await Promise.all([
      prisma.deviceCategory.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: { select: { devices: true } },
        },
      }),
      prisma.ticketCategory.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: { select: { tickets: true } },
        },
      }),
    ]);

    return NextResponse.json({
      deviceCategories: deviceCategories.map((c) => ({
        id: c.id,
        name: c.name,
        count: c._count.devices,
      })),
      ticketCategories: ticketCategories.map((c) => ({
        id: c.id,
        name: c.name,
        count: c._count.tickets,
      })),
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Lỗi lấy danh mục:", err);
    return NextResponse.json(
      { message: "Không thể lấy danh mục", error: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);

    const body = await req.json();
    const { type, name } = body; // type: "device" | "ticket"

    if (!name || !type) {
      return NextResponse.json(
        { message: "Tên danh mục và loại danh mục là bắt buộc" },
        { status: 400 }
      );
    }

    if (type === "device") {
      const existing = await prisma.deviceCategory.findUnique({ where: { name: name.trim() } });
      if (existing) {
        return NextResponse.json({ message: "Danh mục thiết bị này đã tồn tại" }, { status: 400 });
      }
      const item = await prisma.deviceCategory.create({ data: { name: name.trim() } });
      return NextResponse.json({ message: "Thêm danh mục thiết bị thành công", item });
    } else if (type === "ticket") {
      const existing = await prisma.ticketCategory.findUnique({ where: { name: name.trim() } });
      if (existing) {
        return NextResponse.json({ message: "Nhóm sự cố này đã tồn tại" }, { status: 400 });
      }
      const item = await prisma.ticketCategory.create({ data: { name: name.trim() } });
      return NextResponse.json({ message: "Thêm nhóm sự cố thành công", item });
    } else {
      return NextResponse.json({ message: "Loại danh mục không hợp lệ" }, { status: 400 });
    }
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Lỗi tạo danh mục:", err);
    return NextResponse.json(
      { message: "Thêm danh mục thất bại", error: String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);

    const body = await req.json();
    const { type, id, name } = body;

    if (!id || !name || !type) {
      return NextResponse.json(
        { message: "Thiếu ID, tên danh mục hoặc loại danh mục" },
        { status: 400 }
      );
    }

    if (type === "device") {
      const updated = await prisma.deviceCategory.update({
        where: { id },
        data: { name: name.trim() },
      });
      return NextResponse.json({ message: "Cập nhật danh mục thành công", item: updated });
    } else if (type === "ticket") {
      const updated = await prisma.ticketCategory.update({
        where: { id },
        data: { name: name.trim() },
      });
      return NextResponse.json({ message: "Cập nhật nhóm sự cố thành công", item: updated });
    } else {
      return NextResponse.json({ message: "Loại danh mục không hợp lệ" }, { status: 400 });
    }
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Lỗi cập nhật danh mục:", err);
    return NextResponse.json(
      { message: "Cập nhật thất bại", error: String(err) },
      { status: 500 }
    );
  }
}
