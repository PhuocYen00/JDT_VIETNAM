import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";

async function testPdf() {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const fontPath = "C:\\Windows\\Fonts\\arial.ttf";
  if (fs.existsSync(fontPath)) {
    const fontBytes = fs.readFileSync(fontPath);
    const fontBase64 = fontBytes.toString("base64");
    doc.addFileToVFS("Arial-Vietnamese.ttf", fontBase64);
    doc.addFont("Arial-Vietnamese.ttf", "Arial-VN", "normal");
    doc.setFont("Arial-VN");
    console.log("✔ Đã tải font Arial-VN hỗ trợ tiếng Việt có dấu thành công!");
  } else {
    console.log("Arial not found, using default");
  }

  doc.setFontSize(16);
  doc.text("CÔNG TY TNHH JDT VIỆT NAM — BÁO CÁO THIẾT BỊ CNTT", 14, 15);
  doc.setFontSize(10);
  doc.text("Thời gian xuất: 18/09/2026 | Bộ lọc: Phòng ban: Tất cả | Trạng thái: Đang sử dụng", 14, 22);

  autoTable(doc, {
    startY: 28,
    styles: { font: "Arial-VN", fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235], font: "Arial-VN", fontStyle: "normal" },
    head: [["Mã thiết bị", "Loại thiết bị", "Hãng / Model", "Phòng ban", "Người sử dụng", "Trạng thái"]],
    body: [
      ["TB00001", "Điện thoại IP", "Yealink CP-7821", "Hành chính - Nhân sự", "Võ Ngọc Hà", "Đang sử dụng"],
      ["TB00002", "Máy tính để bàn", "Dell OptiPlex 7090", "Kế toán - Tài chính", "Nguyễn Thị Mai", "Đang sử dụng"],
      ["TB00003", "Máy in mã vạch", "Zebra ZD220", "Kho vận - Xuất nhập khẩu", "Trần Văn Hùng", "Đang sửa chữa"],
    ],
  });

  const pdfOutput = doc.output("arraybuffer");
  console.log("✔ PDF được tạo thành công! Kích thước:", pdfOutput.byteLength, "bytes");
}

testPdf().catch(console.error);
