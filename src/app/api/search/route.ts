import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length < 2) {
      return NextResponse.json({
        devices: [],
        tickets: [],
        users: [],
        parts: [],
      });
    }

    const [devices, tickets, users, parts] = await Promise.all([
      // 1. Tìm kiếm thiết bị theo mã, serial, model, brand
      prisma.device.findMany({
        where: {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { serial: { contains: q, mode: "insensitive" } },
            { model: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          code: true,
          brand: true,
          model: true,
          status: true,
        },
      }),

      // 2. Tìm kiếm Ticket theo mã, mô tả
      prisma.ticket.findMany({
        where: {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          code: true,
          description: true,
          priority: true,
          status: true,
        },
      }),

      // 3. Tìm kiếm người dùng theo mã NV, họ tên, email
      prisma.user.findMany({
        where: {
          OR: [
            { employeeCode: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          email: true,
          role: true,
        },
      }),

      // 4. Tìm kiếm linh kiện theo mã, tên
      prisma.part.findMany({
        where: {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: {
          id: true,
          code: true,
          name: true,
          stockQuantity: true,
          unit: true,
        },
      }),
    ]);

    return NextResponse.json({
      devices,
      tickets,
      users,
      parts,
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    console.error("Lỗi tìm kiếm toàn hệ thống:", err);
    return NextResponse.json({ message: "Lỗi tìm kiếm" }, { status: 500 });
  }
}
