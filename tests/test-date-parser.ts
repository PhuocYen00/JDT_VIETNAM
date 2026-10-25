import { parseExcelDate } from "../src/lib/excel-parser";

function testDateParser() {
  console.log("--- BẮT ĐẦU KIỂM THỬ PARSER DATE EXCEL ---");

  // Test integer serial: 45571 (purchase date: 06/10/2024)
  const d1 = parseExcelDate(45571);
  if (!d1) throw new Error("d1 failed");
  console.log(`45571 -> ${d1.toISOString()} (UTC day: ${d1.getUTCDate()}/${d1.getUTCMonth() + 1}/${d1.getUTCFullYear()})`);
  if (d1.getUTCFullYear() !== 2024 || d1.getUTCMonth() !== 9 || d1.getUTCDate() !== 6) {
    throw new Error("Date 45571 did not match 06/10/2024");
  }

  // Test fractional serial: 46122.66001157407 (receivedAt: 10/04/2026 15:50:25)
  const d2 = parseExcelDate(46122.66001157407);
  if (!d2) throw new Error("d2 failed");
  console.log(`46122.66 -> ${d2.toISOString()}`);
  if (d2.getUTCFullYear() !== 2026 || d2.getUTCMonth() !== 3 || d2.getUTCDate() !== 10) {
    throw new Error("Date 46122.66 did not match 10/04/2026");
  }

  // Test null / empty
  if (parseExcelDate(null) !== null) throw new Error("null should return null");
  if (parseExcelDate("") !== null) throw new Error("empty should return null");
  if (parseExcelDate("   ") !== null) throw new Error("spaces should return null");

  console.log("✔ Kiểm tra chuyển đổi Excel serial date: ĐẠT 100%");
}

testDateParser();
