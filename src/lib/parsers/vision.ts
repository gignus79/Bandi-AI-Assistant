import OpenAI from "openai";
import type { ParsedDocument } from "@/types";

/** Usa la chiave API che imposti in .env (OPENAI_API_KEY): è la tua chiave messa a disposizione degli utenti per il visioning. */
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const VISION_SYSTEM =
  "Sei un assistente che estrae testo e informazioni da immagini di documenti (bandi, avvisi, tabelle, screenshot). " +
  "Rispondi SOLO con il testo estratto o la descrizione strutturata del contenuto, senza commenti aggiuntivi. " +
  "Per tabelle o elenchi, mantieni una struttura leggibile (es. markdown o testo con a capo).";

export async function parseImage(
  buffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<ParsedDocument> {
  const base64 = buffer.toString("base64");
  const mediaType = mimeType || "image/jpeg";

  if (openai) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 4096,
      messages: [
        { role: "system", content: VISION_SYSTEM },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mediaType};base64,${base64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    return {
      text: text || "(Nessun testo riconosciuto nell'immagine.)",
      fileName,
      mimeType: mediaType,
    };
  }

  throw new Error(
    "Vision non disponibile. Imposta OPENAI_API_KEY per analizzare immagini."
  );
}
