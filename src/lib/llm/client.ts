import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisUserPrompt } from "./prompts";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export type AnalysisResult = {
  summary: string;
  requirements?: string;
  deadlines?: string;
  criteria?: string;
  insights?: string;
  suggestions?: string;
  rawContent: string;
};

export type AnalysisLLMOutcome = AnalysisResult & {
  provider: "anthropic" | "openai" | "fallback";
  /** Presente se è stato usato il fallback testuale */
  fallbackReason?: string;
};

function formatErr(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function runAnthropicAnalysis(
  userPrompt: string
): Promise<AnalysisResult> {
  if (!anthropic) throw new Error("Anthropic non configurato");
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  const text =
    message.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("\n") || "";
  return { rawContent: text, summary: text };
}

async function runOpenAIAnalysis(userPrompt: string): Promise<AnalysisResult> {
  if (!openai) throw new Error("OpenAI non configurato");
  const completion = await openai.chat.completions.create({
    model: "gpt-5-mini-2025-08-07",
    max_tokens: 8192,
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });
  const text = completion.choices[0]?.message?.content ?? "";
  return { rawContent: text, summary: text };
}

function buildFallbackAnalysis(
  content: string,
  fileName: string | undefined,
  reasons: string[]
): AnalysisLLMOutcome {
  const excerpt = content.slice(0, 12000);
  const src = fileName ? `*Fonte: ${fileName}*\n\n` : "";
  const header =
    "## Analisi automatica non disponibile\n\n" +
    (reasons.length > 0
      ? `Non è stato possibile completare l’analisi con i modelli AI (${reasons.join("; ")}). ` +
        "Puoi **riprovare** tra qualche minuto. Di seguito trovi un **estratto** del testo caricato per consultazione manuale.\n\n---\n\n"
      : "Estratto del testo:\n\n---\n\n");
  const body = `${src}${header}${excerpt}`;
  return {
    summary: body,
    rawContent: body,
    provider: "fallback",
    fallbackReason: reasons.join("; ") || "fallback",
  };
}

/**
 * Esegue l’analisi: prova Anthropic, in errore OpenAI; se entrambi falliscono o mancano le API, fallback testuale.
 */
export async function analyzeDocumentWithLLM(
  content: string,
  fileName?: string
): Promise<AnalysisLLMOutcome> {
  const userPrompt = buildAnalysisUserPrompt(content, fileName);
  const failures: string[] = [];

  if (anthropic) {
    try {
      const r = await runAnthropicAnalysis(userPrompt);
      return { ...r, provider: "anthropic" };
    } catch (err) {
      const msg = formatErr(err);
      console.error("[analyzeDocumentWithLLM] Anthropic failed", {
        fileName,
        error: msg,
        contentLength: content.length,
      });
      failures.push(`Anthropic: ${msg}`);
    }
  }

  if (openai) {
    try {
      const r = await runOpenAIAnalysis(userPrompt);
      return { ...r, provider: "openai" };
    } catch (err) {
      const msg = formatErr(err);
      console.error("[analyzeDocumentWithLLM] OpenAI failed", {
        fileName,
        error: msg,
        contentLength: content.length,
      });
      failures.push(`OpenAI: ${msg}`);
    }
  }

  if (!anthropic && !openai) {
    console.error("[analyzeDocumentWithLLM] No LLM API keys configured");
    return buildFallbackAnalysis(content, fileName, [
      "Nessuna API LLM configurata (imposta OPENAI_API_KEY o ANTHROPIC_API_KEY).",
    ]);
  }

  console.error("[analyzeDocumentWithLLM] All providers failed, using excerpt fallback", {
    fileName,
    failures,
  });
  return buildFallbackAnalysis(content, fileName, failures);
}

export async function chatWithLLM(
  systemContext: string,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...history,
    { role: "user", content: userMessage },
  ];

  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: systemContext,
        messages: messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      });
      return response.content
        .filter((c): c is Anthropic.TextBlock => c.type === "text")
        .map((c) => c.text)
        .join("\n")
        .trim();
    } catch (err) {
      console.error("[chatWithLLM] Anthropic failed", formatErr(err));
    }
  }

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini-2025-08-07",
        max_tokens: 4096,
        messages: [
          { role: "system", content: systemContext },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      });
      return completion.choices[0]?.message?.content?.trim() ?? "";
    } catch (err) {
      console.error("[chatWithLLM] OpenAI failed", formatErr(err));
      throw err;
    }
  }

  throw new Error(
    "Nessuna API LLM configurata. Imposta OPENAI_API_KEY o ANTHROPIC_API_KEY."
  );
}
