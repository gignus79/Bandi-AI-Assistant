import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  ANALYSIS_MAX_TOKENS,
  CHAT_MAX_TOKENS,
  type ResponseVerbosity,
} from "@/lib/llm/verbosity";

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
  const failures: string[] = [];

  const system = `Sei un esperto di bandi pubblici e contributi in Italia. Analizza il documento e produci:
1) Un riassunto esecutivo (max 200 parole) con scadenze, importi, destinatari, requisiti principali.
2) Un'analisi strutturata in markdown con sezioni: Scadenze, Requisiti, Documentazione, Criticità, Suggerimenti operativi.
Usa italiano chiaro e professionale.`;

  const user = `Titolo: ${title ?? "Documento"}\n\n---\n\n${excerpt}`;

  if (anthropic) {
    try {
      const msg = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      });
      const text = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (text) {
        const lines = text.split("\n");
        const firstPara = lines.find((l) => l.trim().length > 0) ?? text.slice(0, 200);
        return {
          summary: firstPara.slice(0, 500),
          rawContent: text,
          provider: "anthropic",
        };
      }
      failures.push("Anthropic: risposta vuota");
    } catch (err) {
      failures.push(`Anthropic: ${formatErr(err)}`);
    }
  }

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4o",
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      });
      const text = completion.choices[0]?.message?.content?.trim() ?? "";
      if (text) {
        const lines = text.split("\n");
        const firstPara = lines.find((l) => l.trim().length > 0) ?? text.slice(0, 200);
        return {
          summary: firstPara.slice(0, 500),
          rawContent: text,
          provider: "openai",
        };
      }
      failures.push("OpenAI: risposta vuota");
    } catch (err) {
      failures.push(`OpenAI: ${formatErr(err)}`);
    }
  }

  const fb = buildFallbackAnalysis(excerpt);
  return {
    ...fb,
    rawContent:
      fb.rawContent +
      (failures.length ? `\n\n---\n*Dettagli: ${failures.join("; ")}*` : ""),
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
  const failures: string[] = [];

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContext },
    ...history.map((m) =>
      m.role === "user"
        ? ({ role: "user", content: m.content } as const)
        : ({ role: "assistant", content: m.content } as const)
    ),
    { role: "user", content: userMessage },
  ];

  if (anthropic) {
    try {
      const anthropicMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content:
            typeof m.content === "string"
              ? m.content
              : JSON.stringify(m.content),
        }));

      const sys = messages.find((m) => m.role === "system");
      const systemText =
        typeof sys?.content === "string" ? sys.content : "";

      const msg = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemText,
        messages: anthropicMessages,
      });
      const text = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      if (text) return { text, degraded: false };
      failures.push("Anthropic: risposta vuota");
    } catch (err) {
      failures.push(`Anthropic: ${formatErr(err)}`);
    }
  }

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4o",
        max_tokens: maxTokens,
        messages,
      });
      const text = completion.choices[0]?.message?.content?.trim() ?? "";
      if (text) return { text, degraded: false };
      failures.push("OpenAI: risposta vuota");
    } catch (err) {
      failures.push(`OpenAI: ${formatErr(err)}`);
    }
  }

  if (!anthropic && !openai) {
    failures.push("Nessuna chiave API LLM configurata (ANTHROPIC_API_KEY / OPENAI_API_KEY)");
  }

  return { text: buildChatFallback(userMessage, failures), degraded: true };
}
