import prisma from "../src/lib/prisma";
import { generateReportPdf } from "../src/lib/pdf-generator";
import * as XLSX from "xlsx";

async function runReportsPdfExcelTest() {
  console.log("================================================================================");
  console.log("       KIỂM THỬ XUẤT BÁO CÁO SONG HÀNH PDF & EXCEL (DUAL EXPORT VERIFICATION)   ");
  console.log("================================================================================");

  // 1. Kiểm thử truy vấn dữ liệu theo bộ lọc
  console.log("\n[BƯỚC 1] Truy vấn dữ liệu thực tế từ PostgreSQL cho báo cáo Thiết bị...");
  const sampleDevices = await prisma.device.findMany({
    where: { status: "Đang sử dụng" },
    take: 25,
    include: {
      category: { select: { name: true } },
      department: { select: { name: true } },
      assignedUser: { select: { fullName: true } },
    },
    orderBy: { code: "asc" },
  });

  console.log(`  ✔ Đã lấy ${sampleDevices.length} thiết bị có trạng thái 'Đang sử dụng'`);
  if (sampleDevices.length === 0) throw new Error("Không có thiết bị nào để kiểm thử");

  const headers = [
    "Mã thiết bị",
    "Loại thiết bị",
    "Thương hiệu & Model",
    "Số Serial",
    "Phòng ban sử dụng",
    "Người sử dụng",
    "Trạng thái",
  ];

  const rows = sampleDevices.map((d) => [
    d.code,
    d.category.name,
    `${d.brand} ${d.model}`,
    d.serial || "—",
    d.department.name,
    d.assignedUser?.fullName || "—",
    d.status,
  ]);

  // 2. Kiểm thử Xuất file Excel (.xlsx)
  console.log("\n[BƯỚC 2] Kiểm thử tạo file Excel với SheetJS (xlsx)...");
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "ThietBi");
  const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  console.log(`  ✔ Buffer Excel đã được tạo thành công: ${excelBuffer.length} bytes`);
  if (!excelBuffer || excelBuffer.length < 1000) {
    throw new Error("Buffer Excel quá nhỏ hoặc không hợp lệ");
  }

  // 3. Kiểm thử Xuất file PDF tiếng Việt UTF-8 (jspdf + jspdf-autotable)
  console.log("\n[BƯỚC 3] Kiểm thử tạo file PDF chuẩn Tiếng Việt với jsPDF...");
  const pdfBuffer = await generateReportPdf({
    reportTitle: "BÁO CÁO DANH SÁCH THIẾT BỊ CNTT ĐANG HOẠT ĐỘNG",
    filterDescription: "Trạng thái: Đang sử dụng | Xuất dữ liệu đối soát tự động",
    headers,
    rows,
  });

  console.log(`  ✔ Buffer PDF đã được tạo thành công: ${pdfBuffer.length} bytes`);
  if (!pdfBuffer || pdfBuffer.length < 1000) {
    throw new Error("Buffer PDF quá nhỏ hoặc không hợp lệ");
  }

  // Kiểm tra Header ma thuật của file PDF: %PDF-
  const pdfHeader = pdfBuffer.slice(0, 5).toString("utf-8");
  if (!pdfHeader.startsWith("%PDF")) {
    throw new Error(`PDF Header không hợp lệ: ${pdfHeader}`);
  }
  console.log(`  ✔ [PASS] PDF Header hợp lệ: '${pdfHeader.trim()}'`);

  // 4. Kiểm thử Báo cáo Yêu cầu hỗ trợ (Ticket)
  console.log("\n[BƯỚC 4] Kiểm thử tạo PDF cho Báo cáo Yêu cầu Hỗ trợ (Tickets)...");
  const sampleTickets = await prisma.ticket.findMany({
    take: 20,
    include: {
      requester: { select: { fullName: true } },
      department: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: { receivedAt: "desc" },
  });

  const ticketHeaders = [
    "Mã ticket",
    "Ngày nhận",
    "Người yêu cầu",
    "Phòng ban",
    "Nhóm sự cố",
    "Mức ưu tiên",
    "Trạng thái",
  ];

  const ticketRows = sampleTickets.map((t) => [
    t.code,
    new Date(t.receivedAt).toLocaleDateString("vi-VN"),
    t.requester.fullName,
    t.department.name,
    t.category.name,
    t.priority,
    t.status,
  ]);

  const ticketPdfBuffer = await generateReportPdf({
    reportTitle: "BÁO CÁO YÊU CẦU HỖ TRỢ KỸ THUẬT GẦN ĐÂY",
    filterDescription: "Lấy 20 yêu cầu mới nhất từ hệ thống",
    headers: ticketHeaders,
    rows: ticketRows,
  });

  console.log(`  ✔ Buffer Ticket PDF đã được tạo: ${ticketPdfBuffer.length} bytes`);

  console.log("\n================================================================================");
  console.log("✔ TOÀN BỘ KIỂM THỬ XUẤT BÁO CÁO EXCEL & PDF ĐẠT 100%!");
  console.log("================================================================================");

  await prisma.$disconnect();
}

runReportsPdfExcelTest().catch((err) => {
  console.error("Lỗi test-reports-pdf-excel:", err);
  process.exit(1);
});
