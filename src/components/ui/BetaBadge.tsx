export function BetaBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-amber-400/45 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.2)] ${className}`}
      title="Versione in evoluzione: se noti anomalie, usa Feedback."
    >
      Beta
    </span>
  );
}
