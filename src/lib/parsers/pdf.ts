import type { ParsedDocument } from "@/types";

export async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return {
    text: data.text,
    pageCount: data.numpages,
    mimeType: "application/pdf",
  };
}
