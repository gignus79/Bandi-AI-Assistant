import type { jsPDF } from "jspdf";

const MARGIN = 20;
const PAGE_WIDTH = 210;
const MAX_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const LINE_HEIGHT = 6;
const LINE_HEIGHT_HEADING = 8;

type JsPDFDoc = InstanceType<typeof jsPDF>;

function getHeadingLevel(line: string): number {
  const m = line.match(/^(#{1,6})\s+/);
  return m ? m[1].length : 0;
}

function stripHeading(line: string): string {
  return line.replace(/^#{1,6}\s+/, "").trim();
}

function isListLine(line: string): boolean {
  return /^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line);
}

function stripListMarker(line: string): string {
  return line.replace(/^\s*[-*]\s+/, "").replace(/^\s*\d+\.\s+/, "").trim();
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

/** Draw line: strip markdown inline (**, *, `) and wrap text. */
function drawFormattedLineSimple(
  doc: JsPDFDoc,
  line: string,
  x: number,
  y: number,
  fontSize: number,
  maxWidth: number
): number {
  const clean = line
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");
  const wrapped = doc.splitTextToSize(clean, maxWidth);
  let currentY = y;
  for (const w of wrapped) {
    if (currentY > 280) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(w, x, currentY);
    currentY += LINE_HEIGHT;
  }
  return wrapped.length * LINE_HEIGHT;
}

export function drawMarkdownToPdf(doc: JsPDFDoc, markdown: string, startX: number, startY: number): number {
  let y = startY;
  const blocks = markdown.split(/\n\n+/);
  const tableRows: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length === 0) continue;

    const first = lines[0];
    const headingLevel = getHeadingLevel(first);
    if (headingLevel > 0) {
      if (tableRows.length > 0) {
        y = drawTable(doc, tableRows, startX, y, MAX_WIDTH);
        tableRows.length = 0;
      }
      const fontSize = headingLevel === 1 ? 16 : headingLevel === 2 ? 14 : 12;
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", "bold");
      const title = stripHeading(first);
      const wrapped = doc.splitTextToSize(title, MAX_WIDTH);
      for (const w of wrapped) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(w, startX, y);
        y += LINE_HEIGHT_HEADING;
      }
      y += 2;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        y += drawFormattedLineSimple(doc, line, startX, y, 10, MAX_WIDTH) + 1;
      }
      continue;
    }

    if (isTableRow(first)) {
      tableRows.push(...lines);
      continue;
    }

    if (tableRows.length > 0) {
      y = drawTable(doc, tableRows, startX, y, MAX_WIDTH);
      tableRows.length = 0;
    }

    for (const line of lines) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      if (isListLine(line)) {
        const text = stripListMarker(line);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("• ", startX, y);
        const wrapped = doc.splitTextToSize(text, MAX_WIDTH - 6);
        for (const w of wrapped) {
          doc.text(w, startX + 6, y);
          y += LINE_HEIGHT;
        }
        y += 1;
      } else {
        y += drawFormattedLineSimple(doc, line, startX, y, 10, MAX_WIDTH) + 2;
      }
    }
    y += 2;
  }

  if (tableRows.length > 0) {
    y = drawTable(doc, tableRows, startX, y, MAX_WIDTH);
  }

  return y;
}

function drawTable(doc: JsPDFDoc, rows: string[], x: number, y: number, maxWidth: number): number {
  const isSeparator = (line: string) => /^\|?\s*[-:|\s]+\|?$/.test(line.trim());
  const dataRows = rows.filter((r) => !isSeparator(r));
  if (dataRows.length === 0) return y;

  const cells = dataRows.map((row) =>
    row
      .split("|")
      .map((c) => c.trim().replace(/\*\*/g, ""))
      .filter(Boolean)
  );
  const colCount = Math.max(...cells.map((c) => c.length), 1);
  const colWidth = Math.min(maxWidth / colCount, 50);
  const fontSize = 9;
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");

  for (const row of cells) {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    let xOffset = x;
    let rowHeight = 6;
    for (let i = 0; i < colCount; i++) {
      const cell = row[i] ?? "";
      const wrapped = doc.splitTextToSize(cell, colWidth - 2);
      const cellHeight = wrapped.length * (LINE_HEIGHT - 1) + 2;
      rowHeight = Math.max(rowHeight, cellHeight);
    }
    for (let i = 0; i < colCount; i++) {
      const cell = row[i] ?? "";
      const wrapped = doc.splitTextToSize(cell, colWidth - 2);
      doc.rect(xOffset, y - fontSize * 0.35, colWidth, rowHeight);
      doc.text(wrapped, xOffset + 2, y + 2);
      xOffset += colWidth;
    }
    y += rowHeight + 1;
  }
  return y + 4;
}
