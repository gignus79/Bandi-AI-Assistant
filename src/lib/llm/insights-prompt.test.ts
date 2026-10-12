import { describe, expect, it } from "vitest";
import { parseInsightCharts } from "@/lib/llm/insights-prompt";

describe("insight charts", () => {
  it("keeps only numeric charts present in the json block", () => {
    const markdown = `## Suggerimenti\n1. Preparare il bilancio.\n\n## Grafici\n\`\`\`json
{"charts":[{"title":"Importi","unit":"EUR","points":[{"label":"Massimo","value":50000},{"label":"stimato","value":"no"}]},{"title":"Vuoto","points":[]}]}
\`\`\``;
    const parsed = parseInsightCharts(markdown);
    expect(parsed.charts).toEqual([
      { title: "Importi", unit: "EUR", points: [{ label: "Massimo", value: 50000 }] },
    ]);
    expect(parsed.prose).toContain("Preparare il bilancio");
    expect(parsed.prose).not.toContain("```json");
  });
});
