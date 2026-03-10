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

export async function analyzeDocumentWithLLM(
  content: string,
  fileName?: string
): Promise<AnalysisResult> {
  const userPrompt = buildAnalysisUserPrompt(content, fileName);

  if (anthropic) {
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

  if (openai) {
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

  throw new Error(
    "Nessuna API LLM configurata. Imposta OPENAI_API_KEY o ANTHROPIC_API_KEY."
  );
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
  }

  if (openai) {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      max_tokens: 4096,
      messages: [
        { role: "system", content: systemContext },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });
    return completion.choices[0]?.message?.content?.trim() ?? "";
  }

  throw new Error(
    "Nessuna API LLM configurata. Imposta OPENAI_API_KEY o ANTHROPIC_API_KEY."
  );
}
