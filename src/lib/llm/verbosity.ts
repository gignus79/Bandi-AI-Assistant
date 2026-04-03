/** Livello di estensione delle risposte AI (max_tokens lato provider). */
export type ResponseVerbosity = "concise" | "balanced" | "detailed";

export const STORAGE_KEY_VERBOSITY = "bandi_ai_response_verbosity";

export const ANALYSIS_MAX_TOKENS: Record<ResponseVerbosity, number> = {
  concise: 2048,
  balanced: 4096,
  detailed: 8192,
};

export const CHAT_MAX_TOKENS: Record<ResponseVerbosity, number> = {
  concise: 1024,
  balanced: 2048,
  detailed: 4096,
};

export function parseVerbosity(v: unknown): ResponseVerbosity {
  if (v === "concise" || v === "balanced" || v === "detailed") return v;
  return "balanced";
}

export function readVerbosityFromStorage(): ResponseVerbosity {
  if (typeof window === "undefined") return "balanced";
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VERBOSITY);
    return parseVerbosity(raw);
  } catch {
    return "balanced";
  }
}

export const VERBOSITY_LABELS: Record<ResponseVerbosity, { label: string; hint: string }> = {
  concise: { label: "Concisa", hint: "Risposte più brevi (meno token)" },
  balanced: { label: "Bilanciata", hint: "Predefinita" },
  detailed: { label: "Dettagliata", hint: "Risposte più lunghe e complete" },
};
