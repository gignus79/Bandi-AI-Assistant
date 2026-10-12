import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ensureUser } from "@/lib/db/users";
import { db } from "@/lib/db";
import { analyses, bandi, documents } from "@/lib/db/schema";
import { isFormDocument, partitionDocuments } from "@/lib/documents/roles";
import { fillFormWithLLM } from "@/lib/llm/client";
import { FILL_ANALYSIS_TITLE } from "@/lib/llm/fill-prompt";
import { parseVerbosity } from "@/lib/llm/verbosity";
import { getPlanForUser } from "@/lib/subscription";
import {
  canRunAnalysis,
  checkRateLimit,
  incrementAnalysisCount,
  incrementRateLimit,
} from "@/lib/usage";

const zBody = z.object({
  bandoId: z.string().uuid(),
  documentId: z.string().uuid(),
  verbosity: z.enum(["concise", "balanced", "detailed"]).optional(),
});

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const requestId = randomUUID();
  const t0 = Date.now();
  try {
    const userId = await requireAuth();
    await ensureUser(userId);
    const parsed = zBody.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload non valido.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { bandoId, documentId, verbosity: verbosityRaw } = parsed.data;
    const verbosity = parseVerbosity(verbosityRaw);

    const bandoRows = await db.select().from(bandi).where(eq(bandi.id, bandoId)).limit(1);
    if (bandoRows.length === 0 || bandoRows[0].userId !== userId) {
      return NextResponse.json({ error: "Bando non trovato." }, { status: 404 });
    }

    const formRows = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.bandoId, bandoId)))
      .limit(1);
    if (formRows.length === 0 || !isFormDocument(formRows[0].sourceType)) {
      return NextResponse.json(
        { error: "Carica il modulo o il documento da compilare prima di avviare la compilazione." },
        { status: 400 }
      );
    }
    const form = formRows[0];
    if (!form.content.trim()) {
      return NextResponse.json({ error: "Il modulo caricato non contiene testo leggibile." }, { status: 400 });
    }

    const planId = await getPlanForUser(userId);
    const { allowed, used, limit } = await canRunAnalysis(userId, planId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Limite analisi mensili raggiunto.", used, limit },
        { status: 403 }
      );
    }
    const analyzeRate = await checkRateLimit(userId, "analyze_minute", 5);
    if (!analyzeRate.allowed) {
      return NextResponse.json(
        { error: "Troppe analisi in poco tempo. Attendi un minuto." },
        { status: 429 }
      );
    }

    const docs = await db
      .select({
        fileName: documents.fileName,
        content: documents.content,
        sourceType: documents.sourceType,
      })
      .from(documents)
      .where(eq(documents.bandoId, bandoId));
    const grouped = partitionDocuments(docs);
    const usableBando = grouped.bando.filter((doc) => doc.content.trim().length > 0);
    const usableContext = grouped.context.filter((doc) => doc.content.trim().length > 0);
    const gaps: string[] = [];
    if (usableContext.length === 0) {
      gaps.push("Non ci sono visura o altri documenti di profilo: molti campi resteranno vuoti.");
    }
    if (usableBando.length === 0) {
      gaps.push("Non ci sono documenti del bando: la compilazione userà solo il profilo.");
    }

    await incrementRateLimit(userId, "analyze_minute");
    const result = await fillFormWithLLM({
      bandoTitle: bandoRows[0].title,
      formName: form.fileName,
      formText: form.content,
      bandoDocs: usableBando,
      contextDocs: usableContext,
      verbosity,
      gaps,
    });
    const isFallback = result.provider === "fallback";
    if (!isFallback) await incrementAnalysisCount(userId);

    const [inserted] = await db
      .insert(analyses)
      .values({
        bandoId,
        documentId: form.id,
        title: `${FILL_ANALYSIS_TITLE}: ${form.fileName}`,
        summary: result.summary,
        requirements: null,
        deadlines: null,
        criteria: null,
        insights: null,
        suggestions: null,
        rawContent: result.rawContent,
      })
      .returning();

    console.info("[fill] ok", {
      requestId,
      bandoId,
      provider: result.provider,
      fallback: isFallback,
      durationMs: Date.now() - t0,
    });

    const warningParts = [
      gaps.length > 0
        ? `${gaps.join(" ")} La compilazione è stata eseguita con i dati disponibili.`
        : null,
      isFallback
        ? "La compilazione AI non è stata completata. Sono stati salvati i dati intercettati e il testo del modulo. Il conteggio analisi non è stato consumato."
        : null,
    ].filter((part): part is string => Boolean(part));

    return NextResponse.json({
      id: inserted.id,
      title: inserted.title,
      summary: inserted.summary,
      rawContent: inserted.rawContent,
      provider: result.provider,
      warning: warningParts.join(" ") || null,
    });
  } catch (err) {
    console.error("[fill] error", {
      requestId,
      durationMs: Date.now() - t0,
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore compilazione modulo", requestId },
      { status: 500 }
    );
  }
}
