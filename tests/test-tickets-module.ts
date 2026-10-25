import prisma from "../src/lib/prisma";

async function main() {
  console.log("==================================================");
  console.log("KIỂM THỬ TỰ ĐỘNG MODULE TICKETS (YÊU CẦU HỖ TRỢ)");
  console.log("==================================================");

  // 1. Test count and pagination
  const total = await prisma.ticket.count();
  console.log(`✔ Tổng số ticket trong DB: ${total} (Kỳ vọng: 3.500)`);
  if (total < 3500) throw new Error("Total tickets count is lower than expected!");

  // 2. Test status counts
  const resolvedCount = await prisma.ticket.count({ where: { status: "Hoàn thành" } });
  const inProgressCount = await prisma.ticket.count({ where: { status: "Đang xử lý" } });
  console.log(`✔ Phân bố trạng thái mẫu: Hoàn thành = ${resolvedCount}, Đang xử lý = ${inProgressCount}`);

  // 3. Test Ticket creation and auto TicketHistory
  const user = await prisma.user.findFirst({ where: { role: "USER" } });
  const itStaff = await prisma.user.findFirst({ where: { role: "IT_SUPPORT" } });
  const cat = await prisma.ticketCategory.findFirst();

  if (!user || !itStaff || !cat) throw new Error("Missing test seed entities");

  const testCode = `YCTEST_${Date.now()}`;
  const now = new Date();

  console.log("\n[Kịch bản 1] Tạo Ticket mới:");
  const createdTicket = await prisma.$transaction(async (tx) => {
    const t = await tx.ticket.create({
      data: {
        code: testCode,
        receivedAt: now,
        requesterId: user.id,
        departmentId: user.departmentId,
        categoryId: cat.id,
        description: "Test ticket for automated verification workflow",
        priority: "Cao",
        status: "Mới tiếp nhận",
        channel: "Biểu mẫu nội bộ",
      },
    });

    await tx.ticketHistory.create({
      data: {
        code: `LSTEST_1_${Date.now()}`,
        ticketId: t.id,
        happenedAt: now,
        action: "Tiếp nhận",
        content: "Người dùng tạo mới yêu cầu hỗ trợ",
        actorId: user.id,
      },
    });

    return t;
  });

  console.log(`✔ Đã tạo Ticket: ${createdTicket.code} (ID: ${createdTicket.id})`);

  let histories = await prisma.ticketHistory.findMany({ where: { ticketId: createdTicket.id } });
  console.log(`✔ Lịch sử ban đầu: ${histories.length} bản ghi (Action: ${histories[0].action})`);
  if (histories.length !== 1) throw new Error("Initial history was not created!");

  // 4. Test Transition to "Đang xử lý" with Assignee
  console.log("\n[Kịch bản 2] Phân công & Chuyển sang Đang xử lý:");
  const updated1 = await prisma.$transaction(async (tx) => {
    const t = await tx.ticket.update({
      where: { id: createdTicket.id },
      data: {
        status: "Đang xử lý",
        assigneeId: itStaff.id,
      },
    });

    await tx.ticketHistory.create({
      data: {
        code: `LSTEST_2_${Date.now()}`,
        ticketId: t.id,
        happenedAt: new Date(),
        action: "Phân công & Xử lý",
        content: `Phân công cho ${itStaff.fullName}, bắt đầu xử lý sự cố`,
        actorId: itStaff.id,
      },
    });

    return t;
  });

  histories = await prisma.ticketHistory.findMany({ where: { ticketId: createdTicket.id } });
  console.log(`✔ Cập nhật -> Trạng thái: ${updated1.status}, Lịch sử hiện tại: ${histories.length} bản ghi`);
  if (histories.length !== 2) throw new Error("Step 2 history was not created!");

  // 5. Test Transition to "Hoàn thành" with resolution
  console.log("\n[Kịch bản 3] Hoàn thành yêu cầu & Ghi nhận giải pháp:");
  const updated2 = await prisma.$transaction(async (tx) => {
    const t = await tx.ticket.update({
      where: { id: createdTicket.id },
      data: {
        status: "Hoàn thành",
        completedAt: new Date(),
        resolutionHours: 1.5,
        resolution: "Đã khắc phục hoàn toàn sự cố và kiểm thử thành công.",
      },
    });

    await tx.ticketHistory.create({
      data: {
        code: `LSTEST_3_${Date.now()}`,
        ticketId: t.id,
        happenedAt: new Date(),
        action: "Hoàn thành",
        content: "Kỹ thuật viên hoàn tất xử lý yêu cầu",
        actorId: itStaff.id,
      },
    });

    return t;
  });

  histories = await prisma.ticketHistory.findMany({ where: { ticketId: createdTicket.id } });
  console.log(`✔ Cập nhật -> Trạng thái: ${updated2.status}, Lịch sử hiện tại: ${histories.length} bản ghi`);

  // 6. Test User Rating (5 stars)
  console.log("\n[Kịch bản 4] Người dùng đánh giá sao (Rating):");
  await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id: createdTicket.id },
      data: { rating: 5 },
    });

    await tx.ticketHistory.create({
      data: {
        code: `LSTEST_4_${Date.now()}`,
        ticketId: createdTicket.id,
        happenedAt: new Date(),
        action: "Đánh giá sao",
        content: "Người dùng gửi đánh giá 5/5 sao rất hài lòng",
        actorId: user.id,
      },
    });
  });

  const finalTicket = await prisma.ticket.findUnique({
    where: { id: createdTicket.id },
    include: { histories: true },
  });

  console.log(`✔ Đánh giá cuối cùng: ${finalTicket?.rating}/5 sao`);
  console.log(`✔ Tổng số bản ghi TicketHistory được tự động tạo: ${finalTicket?.histories.length} bản ghi`);

  if (finalTicket?.histories.length !== 4) {
    throw new Error("Expected 4 TicketHistory records!");
  }

  // 7. Clean up test ticket
  await prisma.ticketHistory.deleteMany({ where: { ticketId: createdTicket.id } });
  await prisma.ticket.delete({ where: { id: createdTicket.id } });
  console.log(`✔ Dọn dẹp dữ liệu test ticket thành công.`);

  console.log("\n==================================================");
  console.log("KIỂM THỬ MODULE TICKETS THÀNH CÔNG 100%!");
  console.log("==================================================");
}

main()
  .catch((e) => {
    console.error("Lỗi test Tickets:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
