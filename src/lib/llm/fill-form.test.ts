import { describe, expect, it } from "vitest";
import { markdownToDocxBuffer } from "@/lib/docx/markdown-to-docx";
import { buildFillFallback, buildFillUserPrompt, fieldsFromProfileCards } from "@/lib/llm/fill-prompt";

describe("form fill data", () => {
  it("intercepts profile fields for the form", () => {
    const fields = fieldsFromProfileCards([
      {
        sourceFile: "visura.pdf",
        looksLikeVisura: true,
        denominazione: "Esempio Lab",
        ateco: "62.01.00",
        formaGiuridica: "impresa individuale",
      },
    ]);
    expect(fields.map((field) => field.label)).toEqual([
      "Denominazione",
      "Forma giuridica",
      "Codice ATECO",
    ]);
  });

  it("asks the model to fill the uploaded source form and to continue with partial data", () => {
    const prompt = buildFillUserPrompt({
      bandoTitle: "Bando esempio",
      formName: "domanda.docx",
      formText: "Denominazione: ____",
      cards: [],
      contextDocs: [],
      bandoDocs: [],
      gaps: ["Manca la visura."],
    });
    expect(prompt).toContain("domanda.docx");
    expect(prompt).toContain("Denominazione: ____");
    expect(prompt).toContain("Manca la visura.");
    expect(prompt).toContain("Compila comunque");
  });

  it("keeps intercepted fields when the model is unavailable", () => {
    const fallback = buildFillFallback({
      formName: "domanda.docx",
      formText: "Sede legale: ____",
      fields: [{ label: "Sede", value: "Roma" }],
      failures: ["Anthropic: timeout"],
    });
    expect(fallback.rawContent).toContain("## Documento compilato");
    expect(fallback.rawContent).toContain("Sede legale: ____");
    expect(fallback.rawContent).toContain("Roma");
  });
});

describe("filled form docx", () => {
  it("builds a docx file from the compiled markdown", async () => {
    const buffer = await markdownToDocxBuffer(
      "Modulo compilato",
      "## Campi intercettati\n| Campo | Valore |\n| --- | --- |\n| ATECO | **62.01.00** |\n\n## Documento compilato\nDenominazione: **Esempio Lab**"
    );
    expect(buffer.subarray(0, 2).toString("utf8")).toBe("PK");
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
