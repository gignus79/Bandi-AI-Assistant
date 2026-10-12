import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

function runsFromInline(text: string): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part.length > 0);
  if (parts.length === 0) return [new TextRun("")];
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return new TextRun({ text: part.slice(2, -2), bold: true });
    }
    return new TextRun(part);
  });
}

function paragraph(text: string, heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({
    heading,
    children: runsFromInline(text),
  });
}

function isTableRow(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isSeparatorRow(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
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
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (row, index) =>
        new TableRow({
          tableHeader: index === 0,
          children: row.map(
            (cell) =>
              new TableCell({
                width: { size: Math.floor(100 / Math.max(row.length, 1)), type: WidthType.PERCENTAGE },
                children: [paragraph(cell)],
              })
          ),
        })
    ),
  });
}

export function markdownToDocxBlocks(markdown: string): (Paragraph | Table)[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
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
      const rows = tableLines.map(cellsOf).filter((row) => row.some((cell) => cell.length > 0));
      if (rows.length > 0) blocks.push(tableFromRows(rows));
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(paragraph(line.slice(4), HeadingLevel.HEADING_3));
    } else if (line.startsWith("## ")) {
      blocks.push(paragraph(line.slice(3), HeadingLevel.HEADING_2));
    } else if (line.startsWith("# ")) {
      blocks.push(paragraph(line.slice(2), HeadingLevel.HEADING_1));
    } else {
      blocks.push(paragraph(line.replace(/^[-*]\s+/, "• ")));
    }
    index += 1;
  }
  return blocks;
}

export async function markdownToDocxBuffer(title: string, markdown: string): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [paragraph(title, HeadingLevel.TITLE), ...markdownToDocxBlocks(markdown)],
      },
    ],
  });
  return Packer.toBuffer(doc);
}
