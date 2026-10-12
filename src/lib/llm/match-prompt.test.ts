import { describe, expect, it } from "vitest";
import { partitionDocuments } from "@/lib/documents/roles";
import {
  buildMatchFallback,
  buildMatchUserPrompt,
  parseMatchVerdict,
  verdictLabel,
} from "@/lib/llm/match-prompt";
import type { MatchVerdict } from "@/lib/llm/match-prompt";

describe("document roles", () => {
  it("separates bando files from profile context", () => {
    const grouped = partitionDocuments([
      { id: "1", sourceType: "file" },
      { id: "2", sourceType: "context" },
      { id: "3", sourceType: "paste" },
      { id: "4", sourceType: "context" },
    ]);
    expect(grouped.bando.map((doc) => doc.id)).toEqual(["1", "3"]);
    expect(grouped.context.map((doc) => doc.id)).toEqual(["2", "4"]);
  });
});

describe("match prompt", () => {
  it("includes both corpora and the extracted profile card", () => {
    const prompt = buildMatchUserPrompt({
      bandoTitle: "Bando esempio",
      bandoDocs: [{ fileName: "regolamento.pdf", content: "Articolo 2 non allegato." }],
      contextDocs: [{ fileName: "visura.pdf", content: "Forma giuridica impresa individuale" }],
      cards: [
        {
          sourceFile: "visura.pdf",
          looksLikeVisura: true,
          formaGiuridica: "impresa individuale",
          ateco: "62.20.10",
        },
      ],
    });
    expect(prompt).toContain("Bando esempio");
    expect(prompt).toContain("regolamento.pdf");
    expect(prompt).toContain("visura.pdf");
    expect(prompt).toContain("62.20.10");
    expect(prompt).toContain("non contengono i criteri");
  });

  it("keeps a readable fallback when providers fail", () => {
    const fallback = buildMatchFallback("- **ATECO:** 62.20.10", ["Anthropic: timeout"]);
    expect(fallback.rawContent).toContain("## Esito");
    expect(fallback.rawContent).toContain("Dati insufficienti");
    expect(fallback.rawContent).toContain("62.20.10");
    expect(parseMatchVerdict(fallback.rawContent)).toBe("insufficiente");
  });

  it("parses verdicts without treating a partial match as full adherence", () => {
    expect(parseMatchVerdict("## Esito\nParzialmente aderente\nManca l'età.")).toBe("parziale");
    expect(parseMatchVerdict("## Esito\nNon aderente")).toBe("non_aderente");
    expect(parseMatchVerdict("## Esito\nAderente\nI requisiti letti sono soddisfatti.")).toBe("aderente");
    const verdicts: MatchVerdict[] = ["aderente", "parziale", "non_aderente", "insufficiente"];
    expect(verdicts.map(verdictLabel)).toEqual([
      "Aderente",
      "Parzialmente aderente",
      "Non aderente",
      "Dati insufficienti",
    ]);
  });
});
