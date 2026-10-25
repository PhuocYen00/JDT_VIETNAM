import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

interface GeneratePdfOptions {
  reportTitle: string;
  filterDescription: string;
  summaryText?: string;
  headers: string[];
  rows: (string | number)[][];
  orientation?: "portrait" | "landscape";
}

export function generateReportPdf(options: GeneratePdfOptions): Buffer {
  const orientation = options.orientation || "landscape";
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  // Tải font Arial tiếng Việt Unicode từ assets
  try {
    const fontPath = path.join(process.cwd(), "src", "assets", "fonts", "Arial.ttf");
    if (fs.existsSync(fontPath)) {
      const fontBytes = fs.readFileSync(fontPath);
      const fontBase64 = fontBytes.toString("base64");
      doc.addFileToVFS("Arial-VN.ttf", fontBase64);
      doc.addFont("Arial-VN.ttf", "Arial-VN", "normal");
      doc.setFont("Arial-VN");
    }
  } catch (err) {
    console.warn("Không thể tải custom font cho PDF:", err);
  }

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header công ty
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    "CÔNG TY TNHH JDT VIỆT NAM — HỆ THỐNG QUẢN LÝ THIẾT BỊ CNTT & HỖ TRỢ KỸ THUẬT",
    14,
    12
  );

  // 2. Tiêu đề báo cáo
  doc.setFontSize(15);
  doc.setTextColor(30, 64, 175); // blue-800
  doc.text(options.reportTitle.toUpperCase(), 14, 20);

  // 3. Thông tin bộ lọc & Thời gian
  const nowStr = new Date().toLocaleString("vi-VN");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`Thời gian xuất báo cáo: ${nowStr} | Điều kiện lọc: ${options.filterDescription}`, 14, 26);

  // 4. Khối tổng quan (nếu có)
  let startY = 32;
  if (options.summaryText) {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(14, 29, pageWidth - 28, 9, 1.5, 1.5, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(`TỔNG QUAN: ${options.summaryText}`, 17, 35);
    startY = 42;
  }

  // 5. Bảng dữ liệu tự động phân trang (AutoTable)
  autoTable(doc, {
    startY,
    head: [options.headers],
    body: options.rows,
    styles: {
      font: "Arial-VN",
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [30, 64, 175], // blue-800
      textColor: [255, 255, 255],
      font: "Arial-VN",
      fontStyle: "normal",
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { left: 14, right: 14, bottom: 16 },
    didDrawPage: (data) => {
      // Footer: Số trang
      const pageNumber = (doc as any).internal.getCurrentPageInfo().pageNumber;
      const totalPages = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Trang ${pageNumber} / ${totalPages} — Xuất tự động từ Hệ thống Quản lý CNTT JDT Việt Nam`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
    },
  });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
