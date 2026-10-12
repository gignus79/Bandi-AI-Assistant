/** Prepara il markdown per Markdown, PDF e DOCX: tabelle allineate e titoli separati. */
export function normalizeExportMarkdown(input: string): string {
  const text = input
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const lines = text.split("\n");
  const out: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (isTableLine(line)) {
      const tableLines: string[] = [];
      while (index < lines.length && isTableLine(lines[index] ?? "")) {
        tableLines.push(lines[index] ?? "");
        index += 1;
      }
      const table = formatTable(tableLines);
      if (table) {
        if (out.length > 0 && out[out.length - 1] !== "") out.push("");
        out.push(table, "");
      }
      continue;
    }
    if (/^#{1,6}\s+/.test(line) && out.length > 0 && out[out.length - 1] !== "") {
      out.push("");
    }
    out.push(line);
    index += 1;
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function isTableLine(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.includes("|", 1);
}

function isSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line.trim());
}

function cellsOf(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim().replace(/\s+/g, " "));
}

function formatTable(lines: string[]): string | null {
  const rows = lines.filter((line) => !isSeparator(line)).map(cellsOf);
  if (rows.length === 0) return null;
  const width = Math.max(...rows.map((row) => row.length), 1);
  const padded = rows.map((row) => {
    const next = row.slice(0, width);
    while (next.length < width) next.push("");
    return next;
  });
  const header = padded[0] ?? [];
  const separator = header.map(() => "---");
  const body = padded.slice(1);
  return [header, separator, ...body].map((row) => `| ${row.join(" | ")} |`).join("\n");
}

/** Caratteri che il font standard del PDF non disegna in modo affidabile. */
export function pdfSafeText(input: string): string {
  const replaced = input
    .replace(/\u00a0/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[•●▪◦]/g, "-")
    .replace(/€/g, "EUR");
  const broken = replaced.replace(/\S{40,}/g, (token) => token.replace(/(.{28})/g, "$1 "));
  return broken.replace(/[^\n\r\t\x20-\xff]/g, "");
}
