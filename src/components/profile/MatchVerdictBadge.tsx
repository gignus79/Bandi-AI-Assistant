import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { verdictLabel, type MatchVerdict } from "@/lib/llm/match-prompt";

const styles: Record<MatchVerdict, string> = {
  aderente:
    "border-emerald-400/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  parziale: "border-amber-400/40 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  non_aderente: "border-rose-400/40 bg-rose-500/10 text-rose-800 dark:text-rose-200",
  insufficiente: "border-slate-400/40 bg-slate-500/10 text-slate-700 dark:text-slate-200",
};

export function MatchVerdictBadge({ verdict }: { verdict: MatchVerdict }) {
  const Icon =
    verdict === "aderente"
      ? CheckCircle2
      : verdict === "parziale"
        ? AlertTriangle
        : verdict === "non_aderente"
          ? XCircle
          : HelpCircle;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${styles[verdict]}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {verdictLabel(verdict)}
    </span>
  );
}
