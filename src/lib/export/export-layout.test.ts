import { describe, expect, it } from "vitest";
import { markdownToDocxBuffer } from "@/lib/docx/markdown-to-docx";
import { buildIcsCalendar, foldIcsLine } from "@/lib/export/ics";
import { normalizeExportMarkdown, pdfSafeText } from "@/lib/export/normalize-markdown";
import { renderAnalysisPdf } from "@/lib/pdf/markdown-to-pdf";
import { withInsufficientFollowup } from "@/lib/llm/match-prompt";

const SAMPLE = `## Esito
Dati insufficienti
Manca il bando integrale.

## Requisiti confrontati
| Requisito | Evidenza nel profilo | Esito | Nota |
| --- | --- | --- | --- |
| Sede | Roma | Non verificabile | Serve il disciplinare |
| Forma giuridica | impresa individuale | Compilato | Da visura |

## Lacune e rischi
- Caricare la visura aggiornata
- Verificare l'ammissibilità della società
`;

describe("export markdown", () => {
  it("keeps empty table cells in place and separates headings", () => {
    const normalized = normalizeExportMarkdown("Testo\n## Titolo\n| A | | C |\n| --- | --- | --- |\n| 1 |  | 3 |");
    expect(normalized).toContain("| A |  | C |");
    expect(normalized).toContain("| 1 |  | 3 |");
    expect(normalized).toMatch(/\n\n## Titolo/);
  });

  it("keeps Italian letters and replaces dashes the PDF font mishandles", () => {
    expect(pdfSafeText("Ammissibilità — società")).toBe("Ammissibilità - società");
  });
});

describe("pdf and docx layout", () => {
  it("renders a readable PDF with wrapped title, accents and a four-column table", () => {
    const buffer = renderAnalysisPdf({
      title: "Verifica di ammissibilità del soggetto per il bando culturale con un titolo molto lungo",
      bandoTitle: "Per Chi Crea",
      markdown: SAMPLE.repeat(4),
    });
    const latin = buffer.toString("latin1");
    expect(latin).toContain("ammissibilit");
    expect(latin).toContain("Requisito");
    expect(latin).toContain("Evidenza nel profilo");
    expect((latin.match(/\/Type \/Page\b/g) ?? []).length).toBeGreaterThan(1);
  });

  it("renders a styled docx with fixed column widths", async () => {
    const { execFileSync } = await import("node:child_process");
    const { writeFileSync } = await import("node:fs");
    const buffer = await markdownToDocxBuffer("Verifica aderenza", SAMPLE, { bandoTitle: "Per Chi Crea" });
    expect(buffer.subarray(0, 2).toString("utf8")).toBe("PK");
    const path = "/tmp/bandi-export-sample.docx";
    writeFileSync(path, buffer);
    const xml = execFileSync("unzip", ["-p", path, "word/document.xml"], { encoding: "utf8" });
    expect(xml).toContain('w:type="dxa"');
    expect(xml).not.toContain('w:type="pct"');
    expect(xml).toContain('w:w="9906"');
  });
});

describe("calendar export", () => {
  it("uses all-day dates and folds long lines", () => {
    const longTitle = "Scadenza presentazione domande del bando culturale con requisiti di residenza e bilancio";
    const ics = buildIcsCalendar({
      calendarName: "Bando",
      events: [
        {
          date: "2026-10-29",
          title: longTitle,
          description: "Controllare il disciplinare, la visura e gli allegati obbligatori prima della trasmissione.",
        },
      ],
    });
    expect(ics).toContain("DTSTART;VALUE=DATE:20261029");
    expect(ics).toContain("DTEND;VALUE=DATE:20261030");
    expect(ics).not.toContain("DTSTART:20261029T");
    expect(ics.split("\r\n").every((line) => Buffer.byteLength(line, "utf8") <= 75)).toBe(true);
    expect(foldIcsLine(`SUMMARY:${longTitle}`).includes("\r\n")).toBe(true);
  });
});

describe("insufficient eligibility follow-up", () => {
  it("asks to upload more documents and rerun the check once", () => {
    const once = withInsufficientFollowup("## Esito\nDati insufficienti\nManca la visura.");
    expect(once).toContain("rilancia la verifica di aderenza");
    expect(withInsufficientFollowup(once)).toBe(once);
    expect(withInsufficientFollowup("## Esito\nAderente\nI requisiti letti sono soddisfatti.")).not.toContain(
      "Prossimo passo"
    );
  });
});
