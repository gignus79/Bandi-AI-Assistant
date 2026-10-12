import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bandi, analyses } from "@/lib/db/schema";
import { buildIcsCalendar } from "@/lib/export/ics";
import { extractDeadlinesWithLLM } from "@/lib/llm/calendar";
import { eq, desc } from "drizzle-orm";

export const maxDuration = 60;

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
    const found =
      analysesList.length === 0
        ? []
        : await extractDeadlinesWithLLM(
            [analysesList[0].summary, analysesList[0].rawContent].filter(Boolean).join("\n")
          );
    const ics = buildIcsCalendar({
      calendarName: bando.title,
      events: found.map((event) => ({
        date: event.date,
        title: event.title ? `${event.title} – ${bando.title}` : `Scadenza – ${bando.title}`,
        description: event.description || `Scadenza letta dall'analisi di ${bando.title}`,
      })),
      emptyNote:
        "Nel testo analizzato non compare una data certa. Carica il bando completo e rilancia l'analisi o la verifica di aderenza.",
    });
    const safeName = bando.title.replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "").replace(/\s+/g, "-").slice(0, 40);
    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="scadenze-${safeName || id.slice(0, 8)}.ics"`,
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
