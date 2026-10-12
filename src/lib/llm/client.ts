import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { extractProfileCard, formatProfileCards } from "@/lib/profile/extract-profile";
import {
  ANALYSIS_MAX_TOKENS,
  CHAT_MAX_TOKENS,
  type ResponseVerbosity,
} from "@/lib/llm/verbosity";
import {
  FILL_SYSTEM_PROMPT,
  buildFillFallback,
  buildFillUserPrompt,
  fieldsFromProfileCards,
} from "@/lib/llm/fill-prompt";
import {
  MATCH_SYSTEM_PROMPT,
  buildMatchFallback,
  buildMatchUserPrompt,
} from "@/lib/llm/match-prompt";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function formatErr(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

type ProviderName = "anthropic" | "openai";

async function generateText(options: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens: number;
}): Promise<
  | { ok: true; text: string; provider: ProviderName }
  | { ok: false; failures: string[] }
> {
  const failures: string[] = [];

  if (anthropic) {
    try {
      const msg = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5",
        max_tokens: options.maxTokens,
        system: options.system,
        messages: options.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });
      const text = msg.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();
      if (text) return { ok: true, text, provider: "anthropic" };
      failures.push("Anthropic: risposta vuota");
    } catch (err) {
      failures.push(`Anthropic: ${formatErr(err)}`);
    }
  }

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4o",
        max_tokens: options.maxTokens,
        messages: [{ role: "system", content: options.system }, ...options.messages],
      });
      const text = completion.choices[0]?.message?.content?.trim() ?? "";
      if (text) return { ok: true, text, provider: "openai" };
      failures.push("OpenAI: risposta vuota");
    } catch (err) {
      failures.push(`OpenAI: ${formatErr(err)}`);
    }
  }

  if (!anthropic && !openai) {
    failures.push("Nessuna chiave API LLM configurata (ANTHROPIC_API_KEY / OPENAI_API_KEY)");
  }

  return { ok: false, failures };
}

function firstParagraph(text: string): string {
  const line = text.split("\n").find((item) => item.trim().length > 0) ?? text.slice(0, 200);
  return line.slice(0, 500);
}

function buildChatFallback(userMessage: string, failures: string[]): string {
  const hint =
    failures.length > 0
      ? `\n\n(Dettagli tecnici: ${failures.join("; ")})`
      : "";
  return (
    `Al momento non riesco a contattare i servizi di intelligenza artificiale. ` +
    `Puoi riprovare tra qualche minuto. La tua domanda è stata registrata.\n\n` +
    `**Anteprima locale:** per domande sul bando, verifica scadenze, requisiti di ammissibilità e allegati obbligatori nei documenti caricati.${hint}`
  );
}

function buildFallbackAnalysis(excerpt: string): { summary: string; rawContent: string } {
  const safe = excerpt.slice(0, 4000);
  return {
    summary:
      "Analisi automatica non disponibile (servizi AI non raggiungibili). Di seguito un estratto del testo da consultare manualmente.",
    rawContent:
      `## Analisi non generata automaticamente\n\n` +
      `I servizi di intelligenza artificiale non hanno risposto. Controlla i punti chiave nel testo sotto o riprova più tardi.\n\n` +
      `### Estratto documento\n\n${safe || "(nessun testo disponibile)"}`,
  };
}

export interface AnalyzeOptions {
  verbosity?: ResponseVerbosity;
}

export async function analyzeDocumentWithLLM(
  content: string,
  title?: string,
  options?: AnalyzeOptions
): Promise<{ summary: string; rawContent: string; provider: "anthropic" | "openai" | "fallback" }> {
  const verbosity = options?.verbosity ?? "balanced";
  const maxTokens = ANALYSIS_MAX_TOKENS[verbosity];
  const excerpt = content.slice(0, 120_000);

  const system = `Sei un esperto di bandi pubblici e contributi in Italia. Analizza il documento e produci:
1) Un riassunto esecutivo (max 200 parole) con scadenze, importi, destinatari, requisiti principali.
2) Un'analisi strutturata in markdown con sezioni: Scadenze, Requisiti, Documentazione, Criticità, Suggerimenti operativi.
Usa italiano chiaro e professionale.`;

  const user = `Titolo: ${title ?? "Documento"}\n\n---\n\n${excerpt}`;
  const generated = await generateText({
    system,
    messages: [{ role: "user", content: user }],
    maxTokens,
  });

  if (generated.ok) {
    return {
      summary: firstParagraph(generated.text),
      rawContent: generated.text,
      provider: generated.provider,
    };
  }

  const fb = buildFallbackAnalysis(excerpt);
  return {
    ...fb,
    rawContent:
      fb.rawContent +
      (generated.failures.length ? `\n\n---\n*Dettagli: ${generated.failures.join("; ")}*` : ""),
    provider: "fallback",
  };
}

export interface ChatOptions {
  maxTokens?: number;
  verbosity?: ResponseVerbosity;
}

export async function chatWithLLM(
  systemContext: string,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[],
  options?: ChatOptions
): Promise<{ text: string; degraded: boolean }> {
  const verbosity = options?.verbosity ?? "balanced";
  const maxTokens = options?.maxTokens ?? CHAT_MAX_TOKENS[verbosity];
  const generated = await generateText({
    system: systemContext,
    messages: [
      ...history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: "user" as const, content: userMessage },
    ],
    maxTokens,
  });

  if (generated.ok) return { text: generated.text, degraded: false };
  return { text: buildChatFallback(userMessage, generated.failures), degraded: true };
}

export async function matchProfileWithLLM(input: {
  bandoTitle: string;
  bandoDocs: { fileName: string; content: string }[];
  contextDocs: { fileName: string; content: string }[];
  verbosity?: ResponseVerbosity;
  gaps?: string[];
}): Promise<{
  summary: string;
  rawContent: string;
  provider: "anthropic" | "openai" | "fallback";
  profileBrief: string;
}> {
  const cards = input.contextDocs.map((doc) => extractProfileCard(doc.fileName, doc.content));
  const profileBrief = formatProfileCards(cards);
  const maxTokens = ANALYSIS_MAX_TOKENS[input.verbosity ?? "balanced"];
  const generated = await generateText({
    system: MATCH_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildMatchUserPrompt({ ...input, cards }),
      },
    ],
    maxTokens,
  });

  if (generated.ok) {
    return {
      summary: firstParagraph(generated.text),
      rawContent: generated.text,
      provider: generated.provider,
      profileBrief,
    };
  }

  const fallback = buildMatchFallback(profileBrief, generated.failures);
  return { ...fallback, provider: "fallback", profileBrief };
}

export async function fillFormWithLLM(input: {
  bandoTitle: string;
  formName: string;
  formText: string;
  bandoDocs: { fileName: string; content: string }[];
  contextDocs: { fileName: string; content: string }[];
  verbosity?: ResponseVerbosity;
  gaps?: string[];
}): Promise<{
  summary: string;
  rawContent: string;
  provider: "anthropic" | "openai" | "fallback";
}> {
  const cards = input.contextDocs.map((doc) => extractProfileCard(doc.fileName, doc.content));
  const gaps = input.gaps ?? [];
  const maxTokens = ANALYSIS_MAX_TOKENS[input.verbosity ?? "balanced"];
  const generated = await generateText({
    system: FILL_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildFillUserPrompt({ ...input, cards, gaps }),
      },
    ],
    maxTokens,
  });
  if (generated.ok) {
    return {
      summary: firstParagraph(generated.text),
      rawContent: generated.text,
      provider: generated.provider,
    };
  }
  return {
    ...buildFillFallback({
      formName: input.formName,
      formText: input.formText,
      fields: fieldsFromProfileCards(cards),
      failures: generated.failures,
    }),
    provider: "fallback",
  };
}
