import type { LucideIcon } from "lucide-react";

const tones = {
  violet:
    "border-violet-400/40 bg-violet-500/10 text-violet-700 dark:text-violet-200",
  cyan: "border-cyan-400/40 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200",
  amber: "border-amber-400/45 bg-amber-500/10 text-amber-800 dark:text-amber-100",
  emerald:
    "border-emerald-400/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100",
} as const;

export function SectionIcon({
  icon: Icon,
  tone = "violet",
}: {
  icon: LucideIcon;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${tones[tone]}`}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}
