import { readFileSync } from "node:fs";
import https from "node:https";
import { config } from "dotenv";
import { parsePdf } from "../src/lib/parsers/pdf";
import { extractProfileCard } from "../src/lib/profile/extract-profile";
import {
  MATCH_SYSTEM_PROMPT,
  buildMatchUserPrompt,
  parseMatchVerdict,
} from "../src/lib/llm/match-prompt";

config({ path: ".env.local" });

function redact(text: string): string {
  return text
    .replace(/\b[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]\b/g, "[CF]")
    .replace(/\b\d{11}\b/g, "[ID]")
    .replace(/[\w.+-]+@[\w.-]+\.\w+/g, "[email]")
    .replace(/\+?\d[\d\s]{8,}\d/g, "[tel]");
}

function postJson(body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.openai.com",
        path: "/v1/chat/completions",
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk as Buffer));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

const visuraPath = process.env.SMOKE_VISURA_PDF;
const bandoPath = process.env.SMOKE_BANDO_PDF;
if (!visuraPath || !bandoPath || !process.env.OPENAI_API_KEY) {
  throw new Error("Missing SMOKE_VISURA_PDF, SMOKE_BANDO_PDF or OPENAI_API_KEY");
}

const visura = await parsePdf(readFileSync(visuraPath));
const bando = await parsePdf(readFileSync(bandoPath));
const card = extractProfileCard("Ultima_visura.pdf", visura.text);
if (card.ateco !== "62.20.10" || !card.formaGiuridica?.toLowerCase().includes("individuale")) {
  throw new Error("Profile card missing expected visura fields");
}

const user = buildMatchUserPrompt({
  bandoTitle: "Per Chi Crea 2026 — Regolamento Bando 1",
  bandoDocs: [{ fileName: "Regolamento_Bando_1.pdf", content: bando.text }],
  contextDocs: [{ fileName: "Ultima_visura.pdf", content: visura.text }],
  cards: [card],
});

const raw = await postJson(
  JSON.stringify({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    max_tokens: 2500,
    messages: [
      { role: "system", content: MATCH_SYSTEM_PROMPT },
      { role: "user", content: user },
    ],
  })
);
const parsed = JSON.parse(raw) as {
  error?: { message?: string };
  choices?: { message?: { content?: string } }[];
};
if (parsed.error) {
  throw new Error(parsed.error.message || "OpenAI error");
}
const text = parsed.choices?.[0]?.message?.content ?? "";
const verdict = parseMatchVerdict(text);
const esito = text.match(/##\s*Esito[\s\S]{0,700}/)?.[0] ?? text.slice(0, 700);
console.log(
  JSON.stringify(
    {
      verdict,
      chars: text.length,
      hasTable: text.includes("Requisiti confrontati"),
      esito: redact(esito),
    },
    null,
    2
  )
);
if (!verdict || !text.includes("## Scheda soggetto")) {
  process.exit(1);
}
