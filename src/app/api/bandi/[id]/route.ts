import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ensureUser } from "@/lib/db/users";
import { db } from "@/lib/db";
import { bandi, documents, analyses, chatMessages, bandoFolders } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { z } from "zod";

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

const zPatch = z.object({
  title: z.string().min(1).max(500).optional(),
  folderId: z.string().uuid().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    await ensureUser(userId);
    const { id } = await params;
    const parsed = zPatch.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload non valido.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const existing = await db.select().from(bandi).where(eq(bandi.id, id)).limit(1);
    if (existing.length === 0 || existing[0].userId !== userId) {
      return NextResponse.json({ error: "Bando non trovato." }, { status: 404 });
    }
    if (parsed.data.folderId) {
      const folder = await db
        .select()
        .from(bandoFolders)
        .where(eq(bandoFolders.id, parsed.data.folderId))
        .limit(1);
      if (folder.length === 0 || folder[0].userId !== userId) {
        return NextResponse.json({ error: "Cartella non trovata." }, { status: 404 });
      }
    }
    const patch: { title?: string; folderId?: string | null; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (parsed.data.title !== undefined) patch.title = parsed.data.title.trim();
    if (parsed.data.folderId !== undefined) patch.folderId = parsed.data.folderId;
    const [updated] = await db.update(bandi).set(patch).where(eq(bandi.id, id)).returning();
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Bando patch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const existing = await db.select().from(bandi).where(eq(bandi.id, id)).limit(1);
    if (existing.length === 0 || existing[0].userId !== userId) {
      return NextResponse.json({ error: "Bando non trovato." }, { status: 404 });
    }
    await db.delete(bandi).where(eq(bandi.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Bando delete error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore" },
      { status: 500 }
    );
  }
}
