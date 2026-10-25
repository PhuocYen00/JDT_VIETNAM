import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const action = searchParams.get("action") || "";
    const entityType = searchParams.get("entityType") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "20"));

    const where: any = {};

    if (search) {
      where.OR = [
        { actorName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { entityCode: { contains: search, mode: "insensitive" } },
      ];
    }

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        createdAt: l.createdAt.toISOString(),
        actorName: l.actorName,
        actorRole: l.actorRole,
        action: l.action,
        entityType: l.entityType,
        entityCode: l.entityCode,
        description: l.description,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Lỗi lấy danh sách Audit Log:", err);
    return NextResponse.json({ message: "Lỗi lấy Audit Log" }, { status: 500 });
  }
}
