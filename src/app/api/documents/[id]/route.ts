import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documents, bandi } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
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
    return NextResponse.json({
      id: doc.id,
      fileName: doc.fileName,
      content: doc.content,
      mimeType: doc.mimeType,
      sourceType: doc.sourceType,
    });
  } catch (err) {
    console.error("Document get error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore" },
      { status: 500 }
    );
  }
}
