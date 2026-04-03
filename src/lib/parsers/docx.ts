import mammoth from "mammoth";
import type { ParsedDocument } from "@/types";

export async function parseDocx(buffer: Buffer, fileName?: string): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value?.trim() ?? "";
  if (!text) {
    throw new Error("Nessun testo estratto dal file Word (.docx).");
  }
  return {
    text,
    fileName,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
}
