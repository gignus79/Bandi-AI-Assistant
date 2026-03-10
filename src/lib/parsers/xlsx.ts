import * as XLSX from "xlsx";
import type { ParsedDocument } from "@/types";

export function parseXlsx(buffer: Buffer, fileName?: string): ParsedDocument {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const lines: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) {
      lines.push(`--- Foglio: ${sheetName} ---`);
      lines.push(csv);
    }
  }
  return {
    text: lines.join("\n\n"),
    fileName,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}
