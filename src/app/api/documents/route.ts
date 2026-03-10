import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ensureUser } from "@/lib/db/users";
import { db } from "@/lib/db";
import { bandi, documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const zBody = z.object({
  bandoId: z.string().uuid(),
  fileName: z.string().min(1),
  content: z.string().min(1),
  mimeType: z.string().optional(),
  sourceType: z.enum(["file", "url", "paste"]),
  sourceUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    await ensureUser(userId);
    const body = await req.json();
    const parsed = zBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload non valido.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { bandoId, fileName, content, mimeType, sourceType, sourceUrl } =
      parsed.data;
    const bandoRows = await db.select().from(bandi).where(eq(bandi.id, bandoId)).limit(1);
    if (bandoRows.length === 0 || bandoRows[0].userId !== userId) {
      return NextResponse.json({ error: "Bando non trovato." }, { status: 404 });
    }
    const [doc] = await db
      .insert(documents)
      .values({
        bandoId,
        fileName,
        content: content.slice(0, 1_000_000),
        mimeType: mimeType ?? null,
        sourceType,
        sourceUrl: sourceUrl ?? null,
      })
      .returning();
    return NextResponse.json(doc);
  } catch (err) {
    console.error("Document create error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore" },
      { status: 500 }
    );
  }
}
