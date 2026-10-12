import { z } from "zod";

export const INSIGHTS_TITLE = "Suggerimenti e grafici";

export interface ChartPoint {
  label: string;
  value: number;
}

export interface InsightChart {
  title: string;
  unit?: string;
  points: ChartPoint[];
}

const zChart = z.object({
  title: z.string().min(1).max(140),
  unit: z.string().max(32).optional(),
  points: z
    .array(
      z.object({
        label: z.string().min(1).max(80),
        value: z.number().finite(),
      })
    )
    .min(1)
    .max(8),
});

export const INSIGHTS_SYSTEM_PROMPT = `Sei un analista di bandi. A partire solo dai documenti forniti produci suggerimenti operativi e, se i numeri ci sono, grafici.

Regole:
- Non inventare importi, percentuali, date o punteggi. Un grafico può usare solo numeri scritti nei documenti.
- Se un numero non c'è, non stimarlo e non metterlo nel grafico. Spiega nel testo quale dato manca.
- Massimo 3 grafici. Ogni grafico ha da 2 a 8 punti.
- I suggerimenti devono essere azioni concrete, in ordine di urgenza.

Restituisci Markdown in italiano:

## Lettura dei dati
Cosa si può misurare e cosa no.

## Suggerimenti
Elenco numerato.

## Grafici
Subito dopo questo titolo, un solo blocco \`\`\`json con questa forma e nient'altro nel blocco:
{"charts":[{"title":"Importi","unit":"EUR","points":[{"label":"Contributo massimo","value":50000}]}]}
Se non ci sono numeri utilizzabili, il blocco è {"charts":[]}.`;

export function buildInsightsUserPrompt(input: {
  bandoTitle: string;
  bandoDocs: { fileName: string; content: string }[];
  contextDocs: { fileName: string; content: string }[];
}): string {
  const pack = (docs: { fileName: string; content: string }[], budget: number) => {
    if (docs.length === 0) return "(nessun documento)";
    const perDoc = Math.max(2000, Math.floor(budget / docs.length));
    return docs
      .map((doc) => `### ${doc.fileName}\n\n${doc.content.trim().slice(0, perDoc)}`)
      .join("\n\n");
  };
  return `Bando: ${input.bandoTitle}

## Documenti del bando
${pack(input.bandoDocs, 60_000)}

## Profilo del soggetto
${pack(input.contextDocs, 30_000)}

Produci suggerimenti e grafici solo con questi dati.`;
}

export function parseInsightCharts(markdown: string): { prose: string; charts: InsightChart[] } {
  const match = markdown.match(/```json\s*([\s\S]*?)```/i);
  if (!match?.[1]) return { prose: markdown, charts: [] };
  let charts: InsightChart[] = [];
  try {
    const parsed = JSON.parse(match[1]) as { charts?: unknown };
    const list = Array.isArray(parsed.charts) ? parsed.charts : [];
    charts = list
      .flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const raw = item as { title?: unknown; unit?: unknown; points?: unknown };
        const points = Array.isArray(raw.points)
          ? raw.points.filter(
              (point) =>
                point &&
                typeof point === "object" &&
                typeof (point as { value?: unknown }).value === "number" &&
                Number.isFinite((point as { value: number }).value)
            )
          : [];
        const result = zChart.safeParse({ ...raw, points });
        return result.success ? [result.data] : [];
      })
      .slice(0, 3);
  } catch {
    charts = [];
  }
  const prose = markdown.replace(match[0], "").replace(/\n{3,}/g, "\n\n").trim();
  return { prose, charts };
}

export function buildInsightsFallback(excerpt: string): { summary: string; rawContent: string } {
  return {
    summary: "Suggerimenti automatici non disponibili. I servizi AI non hanno risposto.",
    rawContent:
      `## Lettura dei dati\nI servizi di intelligenza artificiale non hanno risposto. Puoi riprovare: i documenti restano salvati.\n\n` +
      `## Suggerimenti\n1. Rilancia la richiesta tra qualche minuto.\n\n` +
      `## Grafici\n\`\`\`json\n{"charts":[]}\n\`\`\`\n\n### Estratto\n\n${excerpt.slice(0, 2000)}`,
  };
}
