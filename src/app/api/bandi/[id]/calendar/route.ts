import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bandi, analyses } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { extractDeadlinesWithLLM } from "@/lib/llm/calendar";

export const maxDuration = 60;

function formatICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").slice(0, 15);
}

/** Escape per campi ICS: sostituire \ e ; e newline. */
function escapeIcsField(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .slice(0, 500);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const bandoRows = await db.select().from(bandi).where(eq(bandi.id, id)).limit(1);
    if (bandoRows.length === 0 || bandoRows[0].userId !== userId) {
      return NextResponse.json({ error: "Bando non trovato." }, { status: 404 });
    }
    const bando = bandoRows[0];
    const analysesList = await db
      .select()
      .from(analyses)
      .where(eq(analyses.bandoId, id))
      .orderBy(desc(analyses.createdAt))
      .limit(1);
    const titleSafe = escapeIcsField(bando.title);
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Bandi AI Assistant//IT",
      "CALSCALE:GREGORIAN",
    ];
    let events = 0;
    if (analysesList.length > 0) {
      const a = analysesList[0];
      const text = [
        a.summary,
        a.requirements,
        a.deadlines,
        a.criteria,
        a.insights,
        a.rawContent,
      ]
        .filter(Boolean)
        .join("\n");
      const richEvents = await extractDeadlinesWithLLM(text);
      for (const ev of richEvents) {
        const [y, m, d] = ev.date.split("-").map(Number);
        const date = new Date(y, (m ?? 1) - 1, d ?? 1);
        if (isNaN(date.getTime())) continue;
        const start = formatICSDate(date);
        const end = formatICSDate(new Date(date.getTime() + 24 * 60 * 60 * 1000));
        const summary = escapeIcsField(ev.title ? `${ev.title} – ${bando.title}` : `Scadenza – ${bando.title}`);
        const description = escapeIcsField(ev.description || `Scadenza bando: ${bando.title}`);
        lines.push(
          "BEGIN:VEVENT",
          `DTSTART:${start}`,
          `DTEND:${end}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${description}`,
          "END:VEVENT"
        );
        events++;
      }
    }
    if (events === 0) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 30);
      lines.push(
        "BEGIN:VEVENT",
        `DTSTART:${formatICSDate(fallback)}`,
        `DTEND:${formatICSDate(new Date(fallback.getTime() + 24 * 60 * 60 * 1000))}`,
        `SUMMARY:Scadenza bando – ${titleSafe}`,
        `DESCRIPTION:Data da verificare nell'analisi`,
        "END:VEVENT"
      );
    }
    lines.push("END:VCALENDAR");
    const ics = lines.join("\r\n");
    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="scadenze-${id.slice(0, 8)}.ics"`,
      },
    });
  } catch (err) {
    console.error("Calendar export error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore" },
      { status: 500 }
    );
  }
}
