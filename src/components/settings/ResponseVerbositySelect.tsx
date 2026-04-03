"use client";

import type { ResponseVerbosity } from "@/lib/llm/verbosity";
import { STORAGE_KEY_VERBOSITY, VERBOSITY_LABELS } from "@/lib/llm/verbosity";

interface ResponseVerbositySelectProps {
  value: ResponseVerbosity;
  onChange: (v: ResponseVerbosity) => void;
  id?: string;
  className?: string;
}

export function ResponseVerbositySelect({
  value,
  onChange,
  id = "response-verbosity",
  className = "",
}: ResponseVerbositySelectProps) {
  const persist = (v: ResponseVerbosity) => {
    try {
      localStorage.setItem(STORAGE_KEY_VERBOSITY, v);
    } catch {
      /* ignore */
    }
    onChange(v);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        Estensione risposte AI
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => persist(e.target.value as ResponseVerbosity)}
        className="max-w-xs rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
        title="Controlla approssimativamente la lunghezza massima delle risposte (max token)"
      >
        {(Object.keys(VERBOSITY_LABELS) as ResponseVerbosity[]).map((k) => (
          <option key={k} value={k}>
            {VERBOSITY_LABELS[k].label} — {VERBOSITY_LABELS[k].hint}
          </option>
        ))}
      </select>
    </div>
  );
}
