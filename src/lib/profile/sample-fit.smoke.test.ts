import { config } from "dotenv";
import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extractProfileCard } from "@/lib/profile/extract-profile";
import { parseMatchVerdict } from "@/lib/llm/match-prompt";

config({ path: ".env.local" });

function redact(text: string): string {
  return text
    .replace(/\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/g, "[CF]")
    .replace(/\b\d{11}\b/g, "[ID]")
    .replace(/[\w.+-]+@[\w.-]+\.\w+/g, "[email]")
    .replace(/\+?\d[\d\s]{8,}\d/g, "[tel]");
}

describe("sample bando and visura", () => {
  const visuraPath = process.env.SMOKE_VISURA_PDF;
  const bandoPath = process.env.SMOKE_BANDO_PDF;
  const enabled = Boolean(visuraPath && bandoPath && existsSync(visuraPath) && existsSync(bandoPath));

  it.skipIf(!enabled)("extracts the company profile from the sample visura PDF", async () => {
    const { parsePdf } = await import("@/lib/parsers/pdf");
    const visura = await parsePdf(readFileSync(visuraPath!));
    const card = extractProfileCard("Ultima_visura.pdf", visura.text);
    expect(visura.text.length).toBeGreaterThan(500);
    expect(card.looksLikeVisura).toBe(true);
    expect(card.ateco).toBe("62.20.10");
    expect(card.formaGiuridica?.toLowerCase()).toContain("individuale");
    expect(card.statoAttivita).toBe("attiva");
    expect(card.denominazione?.length ?? 0).toBeGreaterThan(5);
    expect(card.codiceFiscaleMasked?.startsWith("••••")).toBe(true);
  });

  it.skipIf(!enabled)("reads the sample bando regulation", async () => {
    const { parsePdf } = await import("@/lib/parsers/pdf");
    const bando = await parsePdf(readFileSync(bandoPath!));
    expect(bando.text.length).toBeGreaterThan(2000);
    expect(bando.text.toLowerCase()).toMatch(/siae|per chi crea|bando/);
  });

  it.skipIf(!enabled || process.env.SMOKE_LLM !== "1")(
    "compares the sample visura with the sample bando",
    async () => {
      const { parsePdf } = await import("@/lib/parsers/pdf");
      const { matchProfileWithLLM } = await import("@/lib/llm/client");
      const visura = await parsePdf(readFileSync(visuraPath!));
      const bando = await parsePdf(readFileSync(bandoPath!));
      const result = await matchProfileWithLLM({
        bandoTitle: "Per Chi Crea 2026 — Regolamento Bando 1",
        bandoDocs: [{ fileName: "Regolamento_Bando_1.pdf", content: bando.text }],
        contextDocs: [{ fileName: "Ultima_visura.pdf", content: visura.text }],
        verbosity: "balanced",
      });

      expect(result.rawContent).toContain("## Esito");
      expect(result.profileBrief).toContain("62.20.10");
      const verdict = parseMatchVerdict(result.rawContent);
      expect(verdict).not.toBeNull();
      console.info(
        "[smoke-match]",
        JSON.stringify({
          provider: result.provider,
          verdict,
          summary: redact(result.summary).slice(0, 400),
        })
      );
      if (result.provider !== "fallback") {
        expect(result.rawContent.toLowerCase()).toMatch(
          /non verificabile|dati insufficienti|parzialmente|regolamento|art\.?\s*2/
        );
      }
    },
    120_000
  );
});
