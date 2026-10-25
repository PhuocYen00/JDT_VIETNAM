import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { logAuditEvent } from "@/lib/audit";

// GET: Danh sách người dùng với tìm kiếm, lọc & phân trang server-side
export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const departmentId = searchParams.get("departmentId") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "15"));

    const where: any = {};

    if (search) {
      where.OR = [
        { employeeCode: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (departmentId) where.departmentId = departmentId;
    if (role) where.role = role;
    if (status) where.status = status;

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { employeeCode: "asc" },
        include: {
          department: { select: { id: true, code: true, name: true } },
          _count: {
            select: {
              requestedTickets: true,
              assignedTickets: true,
              assignedDevices: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        employeeCode: u.employeeCode,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        title: u.title,
        status: u.status,
        role: u.role,
        department: u.department,
        ticketCount: u._count.requestedTickets,
        deviceCount: u._count.assignedDevices,
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
    console.error("Lỗi lấy danh sách người dùng:", err);
    return NextResponse.json(
      { message: "Không thể lấy danh sách người dùng", error: String(err) },
      { status: 500 }
    );
  }
}

// POST: Tạo người dùng mới
export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(["ADMIN"]);

    const body = await req.json();
    const { employeeCode, fullName, email, departmentId, role, title, phone, status } = body;

    if (!employeeCode || !fullName || !email || !departmentId || !role) {
      return NextResponse.json(
        { message: "Vui lòng điền đầy đủ các trường bắt buộc (Mã NV, Họ tên, Email, Phòng ban, Vai trò)" },
        { status: 400 }
      );
    }

    const cleanCode = employeeCode.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    const existingCode = await prisma.user.findFirst({
      where: { employeeCode: { equals: cleanCode, mode: "insensitive" } },
    });
    if (existingCode) {
      return NextResponse.json(
        { message: `Mã nhân viên '${cleanCode}' đã tồn tại trong hệ thống` },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
    });
    if (existingEmail) {
      return NextResponse.json(
        { message: `Email '${cleanEmail}' đã được sử dụng bởi nhân viên khác` },
        { status: 400 }
      );
    }

    // Hash mật khẩu khởi tạo mặc định Abcd@1234
    const passwordHash = await bcrypt.hash("Abcd@1234", 10);

    const newUser = await prisma.user.create({
      data: {
        employeeCode: cleanCode,
        fullName: fullName.trim(),
        email: cleanEmail,
        departmentId,
        role,
        title: title ? title.trim() : "Nhân viên",
        phone: phone ? phone.trim() : "",
        status: status || "Đang làm việc",
        passwordHash,
      },
      include: {
        department: { select: { name: true } },
      },
    });

    await logAuditEvent({
      actorId: admin.id,
      actorName: admin.fullName,
      actorRole: admin.role,
      action: "CREATE_USER",
      entityType: "USER",
      entityId: newUser.id,
      entityCode: newUser.employeeCode,
      description: `Admin tạo tài khoản mới cho ${newUser.fullName} (${newUser.employeeCode}) với vai trò ${newUser.role}`,
    });

    return NextResponse.json({
      message: "Tạo người dùng thành công với mật khẩu khởi tạo Abcd@1234",
      user: {
        id: newUser.id,
        employeeCode: newUser.employeeCode,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Lỗi tạo người dùng:", err);
    return NextResponse.json(
      { message: "Không thể tạo người dùng mới", error: String(err) },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật thông tin, khóa/mở khóa hoặc đặt lại mật khẩu người dùng
export async function PUT(req: NextRequest) {
  try {
    const admin = await requireRole(["ADMIN"]);

    const body = await req.json();
    const { id, fullName, departmentId, role, title, phone, status, resetPassword } = body;

    if (!id) {
      return NextResponse.json({ message: "Thiếu ID người dùng" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser) {
      return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
    }

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (departmentId) updateData.departmentId = departmentId;
    if (role) updateData.role = role;
    if (title !== undefined) updateData.title = title ? title.trim() : null;
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (status) updateData.status = status;

    if (resetPassword) {
      updateData.passwordHash = await bcrypt.hash("Abcd@1234", 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Ghi Audit Log tương ứng từng hành vi
    if (resetPassword) {
      await logAuditEvent({
        actorId: admin.id,
        actorName: admin.fullName,
        actorRole: admin.role,
        action: "RESET_PASSWORD",
        entityType: "USER",
        entityId: updated.id,
        entityCode: updated.employeeCode,
        description: `Admin đặt lại mật khẩu của ${updated.fullName} (${updated.employeeCode}) về Abcd@1234`,
      });
    } else if (status && status !== currentUser.status) {
      const isLock = status === "Khóa tài khoản";
      await logAuditEvent({
        actorId: admin.id,
        actorName: admin.fullName,
        actorRole: admin.role,
        action: isLock ? "LOCK_USER" : "UNLOCK_USER",
        entityType: "USER",
        entityId: updated.id,
        entityCode: updated.employeeCode,
        description: `Admin ${isLock ? "khóa tài khoản" : "mở khóa tài khoản"} của ${updated.fullName} (${updated.employeeCode})`,
      });
    } else if (role && role !== currentUser.role) {
      await logAuditEvent({
        actorId: admin.id,
        actorName: admin.fullName,
        actorRole: admin.role,
        action: "UPDATE_ROLE",
        entityType: "USER",
        entityId: updated.id,
        entityCode: updated.employeeCode,
        description: `Admin thay đổi vai trò của ${updated.fullName} từ ${currentUser.role} sang ${updated.role}`,
      });
    } else {
      await logAuditEvent({
        actorId: admin.id,
        actorName: admin.fullName,
        actorRole: admin.role,
        action: "UPDATE_USER",
        entityType: "USER",
        entityId: updated.id,
        entityCode: updated.employeeCode,
        description: `Admin cập nhật thông tin hồ sơ của ${updated.fullName} (${updated.employeeCode})`,
      });
    }

    return NextResponse.json({
      message: resetPassword
        ? "Đã đặt lại mật khẩu về Abcd@1234 thành công"
        : "Cập nhật thông tin người dùng thành công",
      user: {
        id: updated.id,
        employeeCode: updated.employeeCode,
        fullName: updated.fullName,
        role: updated.role,
        status: updated.status,
      },
    });
  } catch (err: any) {
    if (err?.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }
    if (err?.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Lỗi cập nhật người dùng:", err);
    return NextResponse.json(
      { message: "Cập nhật người dùng thất bại", error: String(err) },
      { status: 500 }
    );
  }
}
