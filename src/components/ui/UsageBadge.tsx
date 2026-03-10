"use client";

import { useEffect, useState } from "react";

interface UsageState {
  used: number;
  limit: number | null;
  planName: string;
  canRunAnalysis: boolean;
  messagesUsed?: number;
  messagesLimit?: number | null;
  canSendMessage?: boolean;
}

export function UsageBadge() {
  const [usage, setUsage] = useState<UsageState | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => {
        if (d.used != null) setUsage(d);
      })
      .catch(() => {});
  }, []);

  if (!usage) return null;

  const analysisLabel =
    usage.limit != null
      ? `Analisi: ${usage.used}/${usage.limit}`
      : `Analisi: ${usage.used}`;
  const messagesLabel =
    usage.messagesLimit != null
      ? ` · Msg: ${usage.messagesUsed ?? 0}/${usage.messagesLimit}`
      : usage.messagesUsed != null
        ? ` · Msg: ${usage.messagesUsed}`
        : "";

  return (
    <span
      className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
      title={`Piano ${usage.planName}`}
    >
      {analysisLabel}
      {messagesLabel}
    </span>
  );
}
