import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { analyses, bandi } from "@/lib/db/schema";
import { normalizeExportMarkdown } from "@/lib/export/normalize-markdown";
import { withInsufficientFollowup } from "@/lib/llm/match-prompt";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get("id");
    const format = searchParams.get("format") ?? "md";

    if (!analysisId) {
      return NextResponse.json(
        { error: "Parametro id mancante." },
        { status: 400 }
      );
    }

    const analysisRows = await db
      .select()
      .from(analyses)
      .where(eq(analyses.id, analysisId))
      .limit(1);
    if (analysisRows.length === 0) {
      return NextResponse.json({ error: "Analisi non trovata." }, { status: 404 });
    }
    const analysis = analysisRows[0];
    const bandoRows = await db
      .select()
      .from(bandi)
      .where(eq(bandi.id, analysis.bandoId))
      .limit(1);
    if (bandoRows.length === 0 || bandoRows[0].userId !== userId) {
      return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
    }
    const bandoTitle = bandoRows[0].title;

    const content = withInsufficientFollowup(
      normalizeExportMarkdown(analysis.rawContent ?? analysis.summary)
    );
    const title = analysis.title ?? `Analisi - ${bandoTitle}`;
    const safeTitle = title.replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);

    if (format === "md" || format === "markdown") {
      const body = `# ${title}\n\n**Bando:** ${bandoTitle}\n\n---\n\n${content}\n`;
      return new NextResponse(body, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${safeTitle}.md"`,
        },
      });
    }

    if (format === "docx") {
      const { markdownToDocxBuffer } = await import("@/lib/docx/markdown-to-docx");
      const buffer = await markdownToDocxBuffer(title, content, { bandoTitle });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${safeTitle}.docx"`,
        },
      });
    }

    if (format === "pdf") {
      const { renderAnalysisPdf } = await import("@/lib/pdf/markdown-to-pdf");
      const buffer = renderAnalysisPdf({ title, bandoTitle, markdown: content });
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Formato non supportato. Usa format=md, format=pdf o format=docx." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore export" },
      { status: 500 }
    );
  }
}
