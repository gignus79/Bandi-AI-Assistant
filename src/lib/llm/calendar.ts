import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export type CalendarEvent = {
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
};

const SYSTEM_PROMPT = `Sei un assistente che estrae le scadenze e le date importanti da un testo di analisi di un bando.
Restituisci SOLO un JSON array di oggetti, senza altro testo. Ogni oggetto deve avere:
- "title": stringa breve per l'evento (es. "Scadenza presentazione domande", "Apertura sportelli")
- "description": stringa con dettagli (opzionale, può essere vuota)
- "date": data in formato YYYY-MM-DD

Estrai TUTTE le date rilevanti (scadenze, aperture, chiusure, presentazione domande, pubblicazione esiti, ecc.).
Se una data è solo con giorno/mese, usa l'anno corrente.
Esempio di output: [{"title":"Scadenza domande","description":"Termine presentazione","date":"2025-06-15"}, ...]`;

function parseEventsFromText(text: string): CalendarEvent[] {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const arr = JSON.parse(jsonMatch[0]) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (e): e is { title?: string; description?: string; date?: string } =>
          e != null && typeof e === "object"
      )
      .map((e) => ({
        title: typeof e.title === "string" ? e.title : "Scadenza bando",
        description: typeof e.description === "string" ? e.description : "",
        date: typeof e.date === "string" ? e.date : "",
      }))
      .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date));
  } catch {
    return [];
  }
}

export async function extractDeadlinesWithLLM(analysisText: string): Promise<CalendarEvent[]> {
  const userPrompt = `Estrai le scadenze e date importanti da questo testo di analisi di un bando. Restituisci solo il JSON array.\n\n${analysisText.slice(0, 12000)}`;

  if (anthropic) {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = message.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("\n");
    return parseEventsFromText(text);
  }

  if (openai) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
    const text = completion.choices[0]?.message?.content ?? "";
    return parseEventsFromText(text);
  }

  return [];
}
