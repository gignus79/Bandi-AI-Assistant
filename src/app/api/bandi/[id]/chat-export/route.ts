import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bandi, chatMessages } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const format = req.nextUrl.searchParams.get("format") ?? "pdf";
    if (format !== "pdf" && format !== "docx") {
      return NextResponse.json({ error: "Formato non supportato. Usa pdf o docx." }, { status: 400 });
    }
    const bandoRows = await db.select().from(bandi).where(eq(bandi.id, id)).limit(1);
    if (bandoRows.length === 0 || bandoRows[0].userId !== userId) {
      return NextResponse.json({ error: "Bando non trovato." }, { status: 404 });
    }
    const bando = bandoRows[0];
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.bandoId, id))
      .orderBy(asc(chatMessages.createdAt));
    if (messages.length === 0) {
      return NextResponse.json({ error: "Non ci sono messaggi da esportare." }, { status: 400 });
    }
    const markdown = messages
      .map((message) => {
        const who = message.role === "user" ? "Tu" : "Assistente";
        return `## ${who}\n\n${message.content.trim()}`;
      })
      .join("\n\n");
    const title = `Chat — ${bando.title}`;
    const safeTitle = title.replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);

    if (format === "docx") {
      const { markdownToDocxBuffer } = await import("@/lib/docx/markdown-to-docx");
      const buffer = await markdownToDocxBuffer(title, markdown, { bandoTitle: bando.title });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${safeTitle}.docx"`,
        },
      });
    }

    const { renderAnalysisPdf } = await import("@/lib/pdf/markdown-to-pdf");
    const buffer = renderAnalysisPdf({ title, bandoTitle: bando.title, markdown });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Chat export error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore export chat" },
      { status: 500 }
    );
  }
}
