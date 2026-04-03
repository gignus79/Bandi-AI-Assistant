import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents, bandi } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const PREVIEW_MAX = 4500;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const preview = req.nextUrl.searchParams.get("preview") === "1";
    const docRows = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (docRows.length === 0) {
      return NextResponse.json({ error: "Documento non trovato." }, { status: 404 });
    }
    const doc = docRows[0];
    const bandoRows = await db.select().from(bandi).where(eq(bandi.id, doc.bandoId)).limit(1);
    if (bandoRows.length === 0 || bandoRows[0].userId !== userId) {
      return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
    }
    const full = doc.content;
    const content = preview && full.length > PREVIEW_MAX ? full.slice(0, PREVIEW_MAX) : full;
    return NextResponse.json({
      id: doc.id,
      fileName: doc.fileName,
      content,
      mimeType: doc.mimeType,
      sourceType: doc.sourceType,
      sourceUrl: doc.sourceUrl,
      truncated: preview && full.length > PREVIEW_MAX,
    });
  } catch (err) {
    console.error("Document get error:", err);
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
    const docRows = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    if (docRows.length === 0) {
      return NextResponse.json({ error: "Documento non trovato." }, { status: 404 });
    }
    const doc = docRows[0];
    const bandoRows = await db.select().from(bandi).where(eq(bandi.id, doc.bandoId)).limit(1);
    if (bandoRows.length === 0 || bandoRows[0].userId !== userId) {
      return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
    }
    await db.delete(documents).where(eq(documents.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Document delete error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore" },
      { status: 500 }
    );
  }
}
