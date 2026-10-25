import prisma from "../src/lib/prisma";
import * as XLSX from "xlsx";

async function testExportLogic() {
  console.log("==================================================");
  console.log("KIỂM THỬ TỰ ĐỘNG CHỨC NĂNG XUẤT BÁO CÁO EXCEL & CSV");
  console.log("==================================================");

  // 1. Kiểm tra xuất Thiết bị
  const devices = await prisma.device.findMany({
    orderBy: { code: "asc" },
    include: {
      category: { select: { name: true } },
      department: { select: { name: true } },
      assignedUser: { select: { fullName: true, employeeCode: true } },
    },
  });

  const deviceRows = devices.map((d) => ({
    "Mã thiết bị": d.code,
    "Loại thiết bị": d.category.name,
    "Phòng ban": d.department.name,
    "Người sử dụng": d.assignedUser ? d.assignedUser.fullName : "Chưa bàn giao",
    "Trạng thái": d.status,
  }));

  const wsDevices = XLSX.utils.json_to_sheet(deviceRows);
  const wbDevices = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbDevices, wsDevices, "Thiet_bi_CNTT");
  const devBuf = XLSX.write(wbDevices, { type: "buffer", bookType: "xlsx" });

  console.log(`✔ Xuất 900 thiết bị sang Excel (.xlsx): Kích thước buffer = ${devBuf.length} bytes`);
  if (deviceRows.length !== 900) {
    throw new Error(`Kỳ vọng 900 dòng thiết bị, thực tế: ${deviceRows.length}`);
  }

  // 2. Kiểm tra xuất Yêu cầu hỗ trợ (Tickets)
  const tickets = await prisma.ticket.findMany({
    take: 100, // sample 100 for fast verification
    include: {
      requester: { select: { fullName: true, employeeCode: true } },
      department: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  const ticketRows = tickets.map((t) => ({
    "Mã yêu cầu": t.code,
    "Người yêu cầu": t.requester.fullName,
    "Phòng ban": t.department.name,
    "Sự cố": t.category.name,
    "Trạng thái": t.status,
  }));

  const wsTickets = XLSX.utils.json_to_sheet(ticketRows);
  const wbTickets = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbTickets, wsTickets, "Yeu_cau_ho_tro");
  const ticketCsv = XLSX.utils.sheet_to_csv(wsTickets);

  console.log(`✔ Xuất Ticket sang CSV: Kích thước CSV = ${ticketCsv.length} bytes, dòng đầu: ${ticketCsv.split("\n")[0]}`);

  // 3. Kiểm tra xuất Kho linh kiện
  const parts = await prisma.part.findMany();
  const partRows = parts.map((p) => ({
    "Mã linh kiện": p.code,
    "Tên linh kiện": p.name,
    "Tồn kho": p.stockQuantity,
  }));

  const wsParts = XLSX.utils.json_to_sheet(partRows);
  const wbParts = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbParts, wsParts, "Kho_linh_kien");
  const partBuf = XLSX.write(wbParts, { type: "buffer", bookType: "xlsx" });

  console.log(`✔ Xuất 120 linh kiện sang Excel: Kích thước buffer = ${partBuf.length} bytes`);
  if (partRows.length !== 120) {
    throw new Error(`Kỳ vọng 120 dòng linh kiện, thực tế: ${partRows.length}`);
  }

  console.log("==================================================");
  console.log("KIỂM THỬ XUẤT BÁO CÁO EXCEL/CSV THÀNH CÔNG 100%!");
  console.log("==================================================");
  await prisma.$disconnect();
}

testExportLogic().catch((err) => {
  console.error("Lỗi test export:", err);
  process.exit(1);
});
