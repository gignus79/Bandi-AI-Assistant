import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bandi, documents, analyses, chatMessages } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";

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
    const docs = await db.select().from(documents).where(eq(documents.bandoId, id));
    const analysesList = await db
      .select()
      .from(analyses)
      .where(eq(analyses.bandoId, id))
      .orderBy(desc(analyses.createdAt));
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.bandoId, id))
      .orderBy(asc(chatMessages.createdAt));
    return NextResponse.json({
      bando,
      documents: docs,
      analyses: analysesList,
      chatMessages: messages,
    });
  } catch (err) {
    console.error("Bando get error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore" },
      { status: 500 }
    );
  }
}
