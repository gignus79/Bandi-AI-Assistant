import Papa from "papaparse";
import type { ParsedDocument } from "@/types";

export function parseCsv(buffer: Buffer, fileName?: string): ParsedDocument {
  const text = buffer.toString("utf-8");
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const lines =
    result.data?.map((row) => (Array.isArray(row) ? row.join(", ") : String(row))) ?? [];
  return {
    text: lines.join("\n"),
    fileName,
    mimeType: "text/csv",
  };
}
