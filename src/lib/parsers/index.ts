import type { ParsedDocument } from "@/types";
import { parsePdf } from "./pdf";
import { parseXlsx } from "./xlsx";
import { parseCsv } from "./csv";
import { parseRtf } from "./rtf";
import { parseUrl } from "./url";
import { parseImage } from "./vision";

const MIME_TO_PARSER: Record<
  string,
  (buffer: Buffer, mimeType?: string, fileName?: string) => Promise<ParsedDocument> | ParsedDocument
> = {
  "application/pdf": (b) => parsePdf(b),
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": (
    b,
    _m,
    name
  ) => parseXlsx(b, name),
  "text/csv": (b, _m, name) => parseCsv(b, name),
  "application/rtf": (b, _m, name) => parseRtf(b, name),
  "text/plain": (b, _m, name) => ({
    text: b.toString("utf-8"),
    fileName: name,
    mimeType: "text/plain",
  }),
  "image/jpeg": (b, m, name) => parseImage(b, m ?? "image/jpeg", name),
  "image/png": (b, m, name) => parseImage(b, m ?? "image/png", name),
  "image/webp": (b, m, name) => parseImage(b, m ?? "image/webp", name),
};

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  csv: "text/csv",
  rtf: "application/rtf",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function parseFile(
  buffer: Buffer,
  mimeType?: string,
  fileName?: string
): Promise<ParsedDocument> {
  const mime =
    mimeType ||
    (fileName && EXT_TO_MIME[fileName.split(".").pop()?.toLowerCase() ?? ""]);
  if (!mime || !MIME_TO_PARSER[mime]) {
    if (fileName?.toLowerCase().endsWith(".txt")) {
      return {
        text: buffer.toString("utf-8"),
        fileName,
        mimeType: "text/plain",
      };
    }
    throw new Error(`Formato non supportato: ${mime || fileName || "sconosciuto"}`);
  }
  const result = MIME_TO_PARSER[mime](buffer, mime, fileName);
  return Promise.resolve(result);
}

export { parseUrl };
export type { ParsedDocument };
