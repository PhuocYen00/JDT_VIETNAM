import * as XLSX from "xlsx";

/**
 * Accurately converts Excel serial date numbers to JavaScript Date object.
 * Handles both whole dates (e.g. 45571) and date-times with fractions (e.g. 46122.66001157407).
 */
export function parseExcelDate(serial: unknown): Date | null {
  if (serial === null || serial === undefined || serial === "") {
    return null;
  }

  if (serial instanceof Date) {
    return isNaN(serial.getTime()) ? null : serial;
  }

  const num = typeof serial === "number" ? serial : parseFloat(String(serial).trim());
  if (isNaN(num)) {
    // If it's a date string like "2024-10-06" or "06/10/2024"
    const parsed = new Date(String(serial).trim());
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Excel serial date formula: (serial - 25569) * 86400 * 1000
  // 25569 is the difference in days between 1899-12-30 and 1970-01-01 (Unix Epoch)
  const ms = Math.round((num - 25569) * 86400 * 1000);
  const d = new Date(ms);
  return isNaN(d.getTime()) ? null : d;
}

export function parseNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, "").trim());
  return isNaN(num) ? fallback : num;
}

export function parseString(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

export function readExcelWorkbook(filePath: string): XLSX.WorkBook {
  return XLSX.readFile(filePath, {
    cellDates: false, // We keep raw serial numbers for deterministic parsing
    raw: true,
  });
}

export function getSheetRows<T = Record<string, unknown>>(
  wb: XLSX.WorkBook,
  sheetName: string
): T[] {
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    throw new Error(`Không tìm thấy sheet: ${sheetName}`);
  }
  return XLSX.utils.sheet_to_json<T>(ws, { defval: "" });
}
