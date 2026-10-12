import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bandoFolders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const zPatch = z.object({
  name: z.string().min(1).max(120),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const parsed = zPatch.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload non valido." }, { status: 400 });
    }
    const existing = await db.select().from(bandoFolders).where(eq(bandoFolders.id, id)).limit(1);
    if (existing.length === 0 || existing[0].userId !== userId) {
      return NextResponse.json({ error: "Cartella non trovata." }, { status: 404 });
    }
    const [updated] = await db
      .update(bandoFolders)
      .set({ name: parsed.data.name.trim(), updatedAt: new Date() })
      .where(eq(bandoFolders.id, id))
      .returning();
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Folder patch error:", err);
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
    const existing = await db.select().from(bandoFolders).where(eq(bandoFolders.id, id)).limit(1);
    if (existing.length === 0 || existing[0].userId !== userId) {
      return NextResponse.json({ error: "Cartella non trovata." }, { status: 404 });
    }
    await db.delete(bandoFolders).where(eq(bandoFolders.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Folder delete error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore" },
      { status: 500 }
    );
  }
}
