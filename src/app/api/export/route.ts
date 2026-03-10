import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { analyses, bandi } from "@/lib/db/schema";
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

    const content = analysis.rawContent ?? analysis.summary;
    const title = analysis.title ?? `Analisi - ${bandoTitle}`;
    const safeTitle = title.replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);

    if (format === "md" || format === "markdown") {
      const body = `# ${title}\n\nBando: ${bandoTitle}\n\n${content}`;
      return new NextResponse(body, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${safeTitle}.md"`,
        },
      });
    }

    if (format === "pdf") {
      const { jsPDF } = await import("jspdf");
      const { drawMarkdownToPdf } = await import("@/lib/pdf/markdown-to-pdf");
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(title, 20, 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Bando: ${bandoTitle}`, 20, 28);
      drawMarkdownToPdf(doc, content, 20, 36);
      const buffer = Buffer.from(doc.output("arraybuffer"));
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Formato non supportato. Usa format=md o format=pdf." },
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
