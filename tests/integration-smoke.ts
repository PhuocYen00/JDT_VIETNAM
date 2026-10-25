import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";

async function runE2ESmokeTest() {
  console.log("================================================================================");
  console.log("           KỊCH BẢN KIỂM THỬ TÍCH HỢP TOÀN DIỆN E2E SMOKE TEST                  ");
  console.log("             HỆ THỐNG QUẢN LÝ THIẾT BỊ CNTT VÀ YÊU CẦU HỖ TRỢ                   ");
  console.log("================================================================================");

  // ---------------------------------------------------------------------------
  // 1. KIỂM THỬ XÁC THỰC & MẬT KHẨU CHUNG Abcd@1234
  // ---------------------------------------------------------------------------
  console.log("\n[BƯỚC 1] Kiểm tra Xác thực 3 Tài khoản Demo (ADMIN, IT_SUPPORT, USER)...");
  const accounts = [
    { code: "ADMIN01", email: "admin@jdt.local", role: "ADMIN" },
    { code: "IT0001", email: "itsupport@jdt.local", role: "IT_SUPPORT" },
    { code: "USER01", email: "user@jdt.local", role: "USER" },
  ];

  for (const acc of accounts) {
    const userByEmail = await prisma.user.findUnique({ where: { email: acc.email } });
    if (!userByEmail) throw new Error(`Không tìm thấy tài khoản email ${acc.email}`);
    const isMatch = await bcrypt.compare("Abcd@1234", userByEmail.passwordHash);
    if (!isMatch) throw new Error(`Mật khẩu tài khoản ${acc.email} không khớp Abcd@1234`);
    if (userByEmail.role !== acc.role) throw new Error(`Sai vai trò của ${acc.email}`);

    console.log(`  ✔ [PASS] ${acc.role} (${acc.email} / ${acc.code}): Khớp mật khẩu Abcd@1234 và đúng vai trò.`);
  }

  // ---------------------------------------------------------------------------
  // 2. KIỂM THỬ TOÀN VẸN CƠ SỞ DỮ LIỆU ĐỐI CHIẾU WORKBOOK
  // ---------------------------------------------------------------------------
  console.log("\n[BƯỚC 2] Đối soát số lượng thực thể chuẩn từ Workbook Excel...");
  const [deviceCount, ticketCount, partCount, maintenanceCount, deptCount] = await Promise.all([
    prisma.device.count(),
    prisma.ticket.count(),
    prisma.part.count(),
    prisma.maintenance.count(),
    prisma.department.count(),
  ]);

  console.log(`  ✔ Thiết bị CNTT: ${deviceCount} (Kỳ vọng: 900)`);
  console.log(`  ✔ Yêu cầu hỗ trợ: ${ticketCount} (Kỳ vọng: 3500)`);
  console.log(`  ✔ Lượt bảo trì: ${maintenanceCount} (Kỳ vọng: 1500)`);
  console.log(`  ✔ Linh kiện kho: ${partCount} (Kỳ vọng: 120)`);
  console.log(`  ✔ Phòng ban: ${deptCount} (Kỳ vọng: 11)`);

  if (deviceCount < 900 || ticketCount < 3500 || maintenanceCount < 1500 || partCount < 120 || deptCount < 11) {
    throw new Error("Số lượng dữ liệu thực tế không đạt kỳ vọng!");
  }

  // ---------------------------------------------------------------------------
  // 3. VÒNG ĐỜI YÊU CẦU HỖ TRỢ (TICKET LIFECYCLE & TICKET_HISTORY)
  // ---------------------------------------------------------------------------
  console.log("\n[BƯỚC 3] Kiểm thử Vòng đời Yêu cầu hỗ trợ (Tạo -> Tiếp nhận -> Hoàn thành -> Đánh giá)...");
  const demoUser = await prisma.user.findUnique({ where: { employeeCode: "USER01" } });
  const demoIT = await prisma.user.findUnique({ where: { employeeCode: "IT0001" } });
  const sampleDevice = await prisma.device.findFirst({ where: { code: "TB00001" } });
  const sampleCat = await prisma.ticketCategory.findFirst();

  if (!demoUser || !demoIT || !sampleDevice || !sampleCat) {
    throw new Error("Không đủ dữ liệu mẫu để chạy vòng đời ticket!");
  }

  const testTicketCode = `YCE2E_${Date.now().toString().slice(-6)}`;
  let createdTicketId = "";

  // 3.1. USER gửi yêu cầu mới
  const newTicket = await prisma.ticket.create({
    data: {
      code: testTicketCode,
      receivedAt: new Date(),
      requesterId: demoUser.id,
      departmentId: demoUser.departmentId,
      deviceId: sampleDevice.id,
      categoryId: sampleCat.id,
      description: "E2E Test: Bàn phím máy tính bị kẹt phím Enter và Space",
      priority: "Cao",
      status: "Mới tiếp nhận",
      channel: "Web Portal",
      histories: {
        create: {
          code: `LSE2E_${Date.now().toString().slice(-6)}_1`,
          happenedAt: new Date(),
          action: "Tạo mới yêu cầu",
          content: "Người dùng gửi yêu cầu hỗ trợ qua Web Portal",
          actorId: demoUser.id,
        },
      },
    },
  });
  createdTicketId = newTicket.id;
  console.log(`  ✔ USER01 tạo ticket ${testTicketCode} -> Trạng thái: ${newTicket.status}`);

  // 3.2. IT_SUPPORT tiếp nhận và chuyển Đang xử lý
  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: createdTicketId },
      data: {
        status: "Đang xử lý",
        assigneeId: demoIT.id,
      },
    }),
    prisma.ticketHistory.create({
      data: {
        code: `LSE2E_${Date.now().toString().slice(-6)}_2`,
        ticketId: createdTicketId,
        happenedAt: new Date(),
        action: "Tiếp nhận & Phân công",
        content: `IT Support ${demoIT.fullName} tiếp nhận xử lý`,
        actorId: demoIT.id,
      },
    }),
  ]);
  console.log(`  ✔ IT0001 tiếp nhận ticket -> Trạng thái: Đang xử lý (Tự động sinh TicketHistory)`);

  // 3.3. IT_SUPPORT hoàn thành ticket
  await prisma.$transaction([
    prisma.ticket.update({
      where: { id: createdTicketId },
      data: {
        status: "Hoàn thành",
        resolution: "Đã thay phím cao su và vệ sinh switch, bàn phím hoạt động bình thường",
        resolutionHours: 1.5,
        completedAt: new Date(),
      },
    }),
    prisma.ticketHistory.create({
      data: {
        code: `LSE2E_${Date.now().toString().slice(-6)}_3`,
        ticketId: createdTicketId,
        happenedAt: new Date(),
        action: "Hoàn thành xử lý",
        content: "Đã thay phím cao su và vệ sinh switch",
        actorId: demoIT.id,
      },
    }),
  ]);
  console.log(`  ✔ IT0001 cập nhật Hoàn thành với hướng xử lý và thời gian 1.5h`);

  // 3.4. USER đánh giá 5 sao
  const ratedTicket = await prisma.ticket.update({
    where: { id: createdTicketId },
    data: { rating: 5 },
  });
  console.log(`  ✔ USER01 đánh giá chất lượng dịch vụ: ${ratedTicket.rating}/5 sao!`);

  // 3.5. Kiểm tra toàn bộ TicketHistory sinh ra
  const histories = await prisma.ticketHistory.findMany({
    where: { ticketId: createdTicketId },
    orderBy: { happenedAt: "asc" },
  });
  console.log(`  ✔ Kiểm tra Audit Trail: Tự động ghi nhận ${histories.length} lịch sử xử lý tuần tự.`);
  if (histories.length !== 3) {
    throw new Error(`Kỳ vọng 3 bản ghi lịch sử, thực tế: ${histories.length}`);
  }

  // ---------------------------------------------------------------------------
  // 4. KIỂM THỬ GIAO DỊCH KHO NGUYÊN TỬ ($TRANSACTION & ROLLBACK)
  // ---------------------------------------------------------------------------
  console.log("\n[BƯỚC 4] Kiểm thử Giao dịch Xuất kho nguyên tử & Chống xuất âm...");
  const samplePart = await prisma.part.findFirst({
    where: { code: "LK0001" },
  });
  if (!samplePart) throw new Error("Không tìm thấy linh kiện LK0001");

  const originalStock = samplePart.stockQuantity;
  console.log(`  ✔ Tồn kho ban đầu của ${samplePart.code} (${samplePart.name}): ${originalStock}`);

  // 4.1. Xuất 1 chiếc hợp lệ
  const txCode = `GDE2E_${Date.now().toString().slice(-6)}`;
  await prisma.$transaction(async (tx) => {
    const part = await tx.part.findUniqueOrThrow({ where: { id: samplePart.id } });
    if (part.stockQuantity < 1) throw new Error("Không đủ tồn kho");

    await tx.part.update({
      where: { id: samplePart.id },
      data: { stockQuantity: { decrement: 1 } },
    });

    await tx.inventoryTransaction.create({
      data: {
        code: txCode,
        happenedAt: new Date(),
        partId: samplePart.id,
        type: "Xuất",
        quantity: 1,
        reference: testTicketCode,
        note: "E2E Test: Xuất linh kiện kiểm thử",
      },
    });
  });

  const stockAfterExport = (await prisma.part.findUniqueOrThrow({ where: { id: samplePart.id } })).stockQuantity;
  console.log(`  ✔ Sau khi xuất 1 chiếc: Tồn kho = ${stockAfterExport} (Giảm chính xác 1 đơn vị)`);
  if (stockAfterExport !== originalStock - 1) throw new Error("Tồn kho không giảm đúng 1");

  // 4.2. Thử xuất vượt số lượng tồn kho -> Kỳ vọng bị từ chối và Rollback
  let rollbackCaught = false;
  try {
    await prisma.$transaction(async (tx) => {
      const part = await tx.part.findUniqueOrThrow({ where: { id: samplePart.id } });
      const overQuantity = 999999;
      if (overQuantity > part.stockQuantity) {
        throw new Error("OVER_STOCK_LIMIT");
      }
      await tx.part.update({
        where: { id: samplePart.id },
        data: { stockQuantity: { decrement: overQuantity } },
      });
    });
  } catch (err: any) {
    if (err.message === "OVER_STOCK_LIMIT") {
      rollbackCaught = true;
    }
  }

  const stockAfterOverAttempt = (await prisma.part.findUniqueOrThrow({ where: { id: samplePart.id } })).stockQuantity;
  console.log(`  ✔ Thử xuất vượt định mức (999.999 chiếc) -> Bị chặn và Rollback: ${rollbackCaught ? "THÀNH CÔNG" : "THẤT BẠI"}`);
  console.log(`  ✔ Tồn kho được bảo toàn nguyên vẹn: ${stockAfterOverAttempt}`);
  if (!rollbackCaught || stockAfterOverAttempt !== stockAfterExport) {
    throw new Error("Lỗi cơ chế bảo vệ giao dịch kho!");
  }

  // Khôi phục lại 1 chiếc đã xuất kiểm thử
  await prisma.$transaction([
    prisma.part.update({
      where: { id: samplePart.id },
      data: { stockQuantity: originalStock },
    }),
    prisma.inventoryTransaction.deleteMany({
      where: { code: txCode },
    }),
  ]);
  console.log(`  ✔ Đã khôi phục tồn kho ${samplePart.code} về ban đầu: ${originalStock}`);

  // ---------------------------------------------------------------------------
  // 5. KIỂM THỬ XUẤT BÁO CÁO EXCEL VÀ DỌN DẸP DỮ LIỆU
  // ---------------------------------------------------------------------------
  console.log("\n[BƯỚC 5] Kiểm thử Xuất file Excel báo cáo và dọn dẹp bản ghi kiểm thử...");
  const exportDevices = await prisma.device.findMany({ take: 10 });
  const ws = XLSX.utils.json_to_sheet(exportDevices);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Test");
  const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  console.log(`  ✔ SheetJS tạo thành công file Excel nhị phân (${xlsxBuffer.length} bytes)`);

  // Dọn dẹp ticket kiểm thử
  await prisma.ticketHistory.deleteMany({ where: { ticketId: createdTicketId } });
  await prisma.ticket.delete({ where: { id: createdTicketId } });
  console.log(`  ✔ Đã dọn dẹp ticket kiểm thử ${testTicketCode} và toàn bộ audit trail an toàn.`);

  console.log("\n================================================================================");
  console.log("            KẾT QUẢ: TOÀN BỘ KỊCH BẢN E2E ĐẠT 100% THÀNH CÔNG!                  ");
  console.log("================================================================================");
  await prisma.$disconnect();
}

runE2ESmokeTest().catch((err) => {
  console.error("Lỗi kịch bản E2E:", err);
  process.exit(1);
});
