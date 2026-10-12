import { jsPDF } from "jspdf";
import { normalizeExportMarkdown, pdfSafeText } from "@/lib/export/normalize-markdown";

const PAGE_WIDTH = 210;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PAGE_BOTTOM = 282;
const BODY = 10.5;
const BODY_LEADING = 5.2;

const VIOLET: [number, number, number] = [91, 33, 182];
const INK: [number, number, number] = [30, 27, 46];
const MUTED: [number, number, number] = [100, 96, 120];
const HEADER_FILL: [number, number, number] = [91, 33, 182];
const ALT_FILL: [number, number, number] = [245, 243, 255];
const GRID: [number, number, number] = [221, 214, 254];

type Doc = InstanceType<typeof jsPDF>;

function paintFooter(doc: Doc): void {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...GRID);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, 286, PAGE_WIDTH - MARGIN, 286);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Bandi AI Assistant", MARGIN, 291);
    doc.text(`${page} / ${pages}`, PAGE_WIDTH - MARGIN, 291, { align: "right" });
  }
}

function newPage(doc: Doc): number {
  doc.addPage();
  return 22;
}

function room(doc: Doc, y: number, needed: number): number {
  if (y + needed <= PAGE_BOTTOM) return y;
  return newPage(doc);
}

function headingSize(level: number): number {
  if (level <= 1) return 16;
  if (level === 2) return 13;
  return 11.5;
}

function drawWrapped(
  doc: Doc,
  text: string,
  x: number,
  y: number,
  width: number,
  size: number,
  style: "normal" | "bold",
  leading: number,
  color: [number, number, number]
): number {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(pdfSafeText(text), Math.max(8, width)) as string[];
  let cursor = y;
  for (const line of lines) {
    cursor = room(doc, cursor, leading);
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(line, x, cursor);
    cursor += leading;
  }
  return cursor;
}

function isSeparatorLine(line: string): boolean {
  const core = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return core.split("|").every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function tableMatrix(block: string): string[][] {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));
  const data = lines.filter((line) => !isSeparatorLine(line));
  const matrix = data.map((line) =>
    line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => pdfSafeText(cell.trim()))
  );
  const width = Math.max(1, ...matrix.map((row) => row.length));
  return matrix.map((row) => {
    const next = row.slice(0, width);
    while (next.length < width) next.push("");
    return next;
  });
}

function columnWidths(matrix: string[][], total: number): number[] {
  const cols = matrix[0]?.length ?? 1;
  const weights = Array.from({ length: cols }, (_, index) => {
    const longest = Math.max(8, ...matrix.map((row) => Math.min((row[index] ?? "").length, 48)));
    return longest;
  });
  const sum = weights.reduce((totalWeight, weight) => totalWeight + weight, 0) || 1;
  let widths = weights.map((weight) => (weight / sum) * total);
  const min = cols >= 5 ? 16 : 22;
  if (cols * min <= total) {
    widths = widths.map((width) => Math.max(width, min));
    const used = widths.reduce((acc, width) => acc + width, 0);
    const extra = total - used;
    const flex = widths.map((width) => Math.max(0, width - min));
    const flexSum = flex.reduce((acc, width) => acc + width, 0) || 1;
    widths = widths.map((width, index) => width + (extra * (flex[index] ?? 0)) / flexSum);
  } else {
    widths = Array.from({ length: cols }, () => total / cols);
  }
  const drift = total - widths.reduce((acc, width) => acc + width, 0);
  const last = widths.length - 1;
  widths[last] = (widths[last] ?? 0) + drift;
  return widths;
}

function drawTable(doc: Doc, matrix: string[][], y: number): number {
  if (matrix.length === 0) return y;
  const widths = columnWidths(matrix, CONTENT_WIDTH);
  const fontSize = matrix[0]!.length >= 5 ? 7.5 : 8.5;
  const leading = 3.5;
  let cursor = y;

  const rowHeight = (row: string[]): number => {
    doc.setFontSize(fontSize);
    let height = 6;
    row.forEach((cell, index) => {
      const lines = doc.splitTextToSize(cell || " ", Math.max(8, (widths[index] ?? 20) - 3.2)) as string[];
      height = Math.max(height, lines.length * leading + 2.2);
    });
    return height;
  };

  const paintRow = (row: string[], top: number, header: boolean, alt: boolean): number => {
    const height = rowHeight(row);
    let x = MARGIN;
    row.forEach((cell, index) => {
      const width = widths[index] ?? 20;
      if (header) doc.setFillColor(...HEADER_FILL);
      else if (alt) doc.setFillColor(...ALT_FILL);
      else doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...GRID);
      doc.setLineWidth(0.15);
      doc.rect(x, top, width, height, "FD");
      doc.setFont("helvetica", header ? "bold" : "normal");
      doc.setFontSize(fontSize);
      const color: [number, number, number] = header ? [255, 255, 255] : INK;
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(cell || " ", Math.max(8, width - 3.2)) as string[];
      let textY = top + 3.6;
      for (const line of lines) {
        doc.text(line, x + 1.6, textY);
        textY += leading;
      }
      x += width;
    });
    return top + height;
  };

  const header = matrix[0] ?? [];
  cursor = room(doc, cursor, rowHeight(header) + 2);
  cursor = paintRow(header, cursor, true, false);
  for (let index = 1; index < matrix.length; index += 1) {
    const row = matrix[index] ?? [];
    const height = rowHeight(row);
    if (cursor + height > PAGE_BOTTOM) {
      cursor = newPage(doc);
      cursor = paintRow(header, cursor, true, false);
    }
    cursor = paintRow(row, cursor, false, index % 2 === 0);
  }
  return cursor + 5;
}

function drawBodyLine(doc: Doc, line: string, y: number): number {
  const list = line.match(/^(\s*)(?:[-*]|\d+\.)\s+(.*)$/);
  if (list) {
    const text = list[2] ?? "";
    y = room(doc, y, BODY_LEADING);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(BODY);
    doc.setTextColor(...VIOLET);
    doc.text("-", MARGIN + 1, y);
    return drawWrapped(doc, text, MARGIN + 6, y, CONTENT_WIDTH - 6, BODY, "normal", BODY_LEADING, INK);
  }
  return drawWrapped(doc, line, MARGIN, y, CONTENT_WIDTH, BODY, "normal", BODY_LEADING, INK) + 0.4;
}

function drawBlocks(doc: Doc, markdown: string, startY: number): void {
  let y = startY;
  const blocks = normalizeExportMarkdown(markdown).split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) continue;
    const first = lines[0] ?? "";
    if (first.trim().startsWith("|")) {
      y = drawTable(doc, tableMatrix(block), y);
      continue;
    }
    const heading = first.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1]?.length ?? 2;
      y = room(doc, y, headingSize(level) + 4);
      y += level === 2 ? 2.5 : 1;
      y = drawWrapped(
        doc,
        heading[2] ?? "",
        MARGIN,
        y,
        CONTENT_WIDTH,
        headingSize(level),
        "bold",
        level === 1 ? 7 : 5.8,
        VIOLET
      );
      doc.setDrawColor(...GRID);
      doc.setLineWidth(level <= 2 ? 0.45 : 0.2);
      doc.line(MARGIN, y - 1.2, MARGIN + (level === 1 ? 46 : 24), y - 1.2);
      y += 2.2;
      for (const line of lines.slice(1)) y = drawBodyLine(doc, line, y);
      y += 1.2;
      continue;
    }
    for (const line of lines) y = drawBodyLine(doc, line, y);
    y += 1.4;
  }
}

export function renderAnalysisPdf(input: {
  title: string;
  bandoTitle: string;
  markdown: string;
}): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFillColor(...VIOLET);
  doc.rect(0, 0, PAGE_WIDTH, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("Bandi AI Assistant", MARGIN, 6.5);

  let y = 20;
  y = drawWrapped(doc, input.title, MARGIN, y, CONTENT_WIDTH, 18, "bold", 7.4, INK);
  y += 1;
  y = drawWrapped(doc, `Bando: ${input.bandoTitle}`, MARGIN, y, CONTENT_WIDTH, 10, "normal", 4.8, MUTED);
  y += 1.5;
  doc.setDrawColor(...VIOLET);
  doc.setLineWidth(0.7);
  doc.line(MARGIN, y, MARGIN + 34, y);
  y += 7;
  drawBlocks(doc, input.markdown, y);
  paintFooter(doc);
  return Buffer.from(doc.output("arraybuffer"));
}
