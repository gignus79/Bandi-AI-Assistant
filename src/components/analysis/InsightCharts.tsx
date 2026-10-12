"use client";

import type { InsightChart } from "@/lib/llm/insights-prompt";

function formatValue(value: number, unit?: string): string {
  const formatted = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function InsightCharts({ charts }: { charts: InsightChart[] }) {
  if (charts.length === 0) return null;
  return (
    <div className="mb-6 space-y-4">
      {charts.map((chart) => {
        const max = Math.max(...chart.points.map((point) => Math.abs(point.value)), 1);
        return (
          <figure
            key={chart.title}
            className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-500/30 dark:bg-violet-950/30"
          >
            <figcaption className="mb-3 text-sm font-semibold text-violet-950 dark:text-violet-100">
              {chart.title}
            </figcaption>
            <ul className="space-y-2">
              {chart.points.map((point) => (
                <li key={`${chart.title}-${point.label}`}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-xs text-slate-700 dark:text-slate-200">
                    <span className="min-w-0 truncate">{point.label}</span>
                    <span className="shrink-0 font-medium">{formatValue(point.value, chart.unit)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600"
                      style={{ width: `${Math.max(2, (Math.abs(point.value) / max) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </figure>
        );
      })}
    </div>
  );
}
