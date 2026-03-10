import type { ParsedDocument } from "@/types";

/**
 * Strip RTF control words and extract plain text.
 * For full RTF parsing consider adding a dedicated library.
 */
export function parseRtf(buffer: Buffer, fileName?: string): ParsedDocument {
  let text = buffer.toString("utf-8");
  text = text
    .replace(/\\'[0-9a-fA-F]{2}/g, (m) => {
      return String.fromCharCode(parseInt(m.slice(2), 16));
    })
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\\[a-z]+\d*\s?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    text,
    fileName,
    mimeType: "application/rtf",
  };
}
