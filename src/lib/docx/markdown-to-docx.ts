import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { normalizeExportMarkdown } from "@/lib/export/normalize-markdown";

const INK = "1E1B2E";
const VIOLET = "5B21B6";
const MUTED = "64607A";
const HEADER_FILL = "5B21B6";
const ALT_FILL = "F5F3FF";
const GRID = "DDD6FE";

const thinBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: GRID,
};

function runsFromInline(text: string, color = INK): TextRun[] {
  const clean = text.replace(/`([^`]+)`/g, "$1");
  const parts = clean.split(/(\*\*[^*]+\*\*)/g).filter((part) => part.length > 0);
  if (parts.length === 0) return [new TextRun({ text: "", font: "Calibri", size: 22, color })];
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return new TextRun({ text: part.slice(2, -2), bold: true, font: "Calibri", size: 22, color });
    }
    return new TextRun({ text: part.replace(/\*(.+?)\*/g, "$1"), font: "Calibri", size: 22, color });
  });
}

function bodyParagraph(
  text: string,
  options?: { heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]; bullet?: boolean }
): Paragraph {
  const heading = options?.heading;
  const before =
    heading === HeadingLevel.HEADING_1 ? 280 : heading === HeadingLevel.HEADING_2 ? 320 : heading ? 220 : 40;
  return new Paragraph({
    heading,
    spacing: { before, after: heading ? 120 : 140, line: 276 },
    bullet: options?.bullet ? { level: 0 } : undefined,
    children: runsFromInline(text, heading ? VIOLET : INK),
  });
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith("|") && line.trim().includes("|", 1);
}

function isSeparatorRow(line: string): boolean {
  const core = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return core.split("|").every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function cellsOf(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function tableFromRows(rows: string[][]): Table {
  const width = Math.max(...rows.map((row) => row.length), 1);
  const padded = rows.map((row) => {
    const next = row.slice(0, width);
    while (next.length < width) next.push("");
    return next;
  });
  const share = Math.floor(100 / width);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: padded.map(
      (row, rowIndex) =>
        new TableRow({
          tableHeader: rowIndex === 0,
          cantSplit: true,
          children: row.map(
            (cell) =>
              new TableCell({
                width: { size: share, type: WidthType.PERCENTAGE },
                shading: {
                  type: ShadingType.CLEAR,
                  fill: rowIndex === 0 ? HEADER_FILL : rowIndex % 2 === 0 ? ALT_FILL : "FFFFFF",
                },
                margins: { top: 60, bottom: 60, left: 80, right: 80 },
                borders: {
                  top: thinBorder,
                  bottom: thinBorder,
                  left: thinBorder,
                  right: thinBorder,
                },
                children: [
                  new Paragraph({
                    spacing: { after: 40 },
                    children: runsFromInline(cell, rowIndex === 0 ? "FFFFFF" : INK),
                  }),
                ],
              })
          ),
        })
    ),
  });
}

export function markdownToDocxBlocks(markdown: string): (Paragraph | Table)[] {
  const lines = normalizeExportMarkdown(markdown).split("\n");
  const blocks: (Paragraph | Table)[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (isTableRow(line)) {
      const tableLines: string[] = [];
      while (index < lines.length && isTableRow(lines[index] ?? "")) {
        if (!isSeparatorRow(lines[index] ?? "")) tableLines.push(lines[index] ?? "");
        index += 1;
      }
      const parsed = tableLines.map(cellsOf).filter((row) => row.some((cell) => cell.length > 0));
      if (parsed.length > 0) blocks.push(tableFromRows(parsed));
      blocks.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun("")] }));
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(bodyParagraph(line.slice(4), { heading: HeadingLevel.HEADING_3 }));
    } else if (line.startsWith("## ")) {
      blocks.push(bodyParagraph(line.slice(3), { heading: HeadingLevel.HEADING_2 }));
    } else if (line.startsWith("# ")) {
      blocks.push(bodyParagraph(line.slice(2), { heading: HeadingLevel.HEADING_1 }));
    } else if (/^\s*(?:[-*]|\d+\.)\s+/.test(line)) {
      blocks.push(bodyParagraph(`• ${line.replace(/^\s*(?:[-*]|\d+\.)\s+/, "")}`));
    } else {
      blocks.push(bodyParagraph(line));
    }
    index += 1;
  }
  return blocks;
}

export async function markdownToDocxBuffer(
  title: string,
  markdown: string,
  meta?: { bandoTitle?: string }
): Promise<Buffer> {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22, color: INK },
          paragraph: { spacing: { after: 140, line: 276 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, bottom: 900, left: 1000, right: 1000 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: VIOLET, space: 6 } },
                spacing: { after: 120 },
                children: [
                  new TextRun({ text: "Bandi AI Assistant", bold: true, font: "Calibri", size: 18, color: VIOLET }),
                  new TextRun({
                    text: meta?.bandoTitle ? `   ·   ${meta.bandoTitle}` : "",
                    font: "Calibri",
                    size: 18,
                    color: MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { top: { style: BorderStyle.SINGLE, size: 6, color: GRID, space: 8 } },
                children: [
                  new TextRun({ text: "Pagina ", font: "Calibri", size: 16, color: MUTED }),
                  new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16, color: MUTED }),
                  new TextRun({ text: " di ", font: "Calibri", size: 16, color: MUTED }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Calibri", size: 16, color: MUTED }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            spacing: { after: 80 },
            children: [new TextRun({ text: title, bold: true, font: "Calibri", size: 36, color: INK })],
          }),
          ...(meta?.bandoTitle
            ? [
                new Paragraph({
                  spacing: { after: 200 },
                  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: VIOLET, space: 1 } },
                  children: [
                    new TextRun({ text: "Bando: ", bold: true, font: "Calibri", size: 22, color: VIOLET }),
                    new TextRun({ text: meta.bandoTitle, font: "Calibri", size: 22, color: INK }),
                  ],
                }),
              ]
            : []),
          ...markdownToDocxBlocks(markdown),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}
