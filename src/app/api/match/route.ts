import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { ensureUser } from "@/lib/db/users";
import { db } from "@/lib/db";
import { analyses, bandi, documents } from "@/lib/db/schema";
import { partitionDocuments } from "@/lib/documents/roles";
import { matchProfileWithLLM } from "@/lib/llm/client";
import { MATCH_ANALYSIS_TITLE, parseMatchVerdict } from "@/lib/llm/match-prompt";
import { parseVerbosity } from "@/lib/llm/verbosity";
import { getPlanForUser } from "@/lib/subscription";
import {
  canRunAnalysis,
  checkRateLimit,
  incrementAnalysisCount,
  incrementRateLimit,
} from "@/lib/usage";
import { eq } from "drizzle-orm";

const zBody = z.object({
  bandoId: z.string().uuid(),
  verbosity: z.enum(["concise", "balanced", "detailed"]).optional(),
});

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const requestId = randomUUID();
  const t0 = Date.now();
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
    const { bandoId, verbosity: verbosityRaw } = parsed.data;
    const verbosity = parseVerbosity(verbosityRaw);

    const bandoRows = await db.select().from(bandi).where(eq(bandi.id, bandoId)).limit(1);
    if (bandoRows.length === 0 || bandoRows[0].userId !== userId) {
      return NextResponse.json({ error: "Bando non trovato." }, { status: 404 });
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
    const { bando: bandoDocs, context: contextDocs } = partitionDocuments(docs);
    const usableBando = bandoDocs.filter((doc) => doc.content.trim().length > 0);
    const usableContext = contextDocs.filter((doc) => doc.content.trim().length > 0);

    if (usableBando.length === 0) {
      return NextResponse.json(
        { error: "Carica almeno un documento del bando prima della verifica di aderenza." },
        { status: 400 }
      );
    }
    if (usableContext.length === 0) {
      return NextResponse.json(
        {
          error:
            "Carica la visura o almeno un documento del soggetto (statuto, bilancio, CV) per confrontarlo con il bando.",
        },
        { status: 400 }
      );
    }

    await incrementRateLimit(userId, "analyze_minute");

    const result = await matchProfileWithLLM({
      bandoTitle: bandoRows[0].title,
      bandoDocs: usableBando,
      contextDocs: usableContext,
      verbosity,
    });
    const isFallback = result.provider === "fallback";
    if (!isFallback) {
      await incrementAnalysisCount(userId);
    }

    const [inserted] = await db
      .insert(analyses)
      .values({
        bandoId,
        title: MATCH_ANALYSIS_TITLE,
        summary: result.summary,
        requirements: null,
        deadlines: null,
        criteria: null,
        insights: null,
        suggestions: null,
        rawContent: result.rawContent,
      })
      .returning();

    console.info("[match] ok", {
      requestId,
      bandoId,
      provider: result.provider,
      fallback: isFallback,
      bandoDocs: usableBando.length,
      contextDocs: usableContext.length,
      durationMs: Date.now() - t0,
    });

    return NextResponse.json({
      id: inserted.id,
      summary: inserted.summary,
      rawContent: inserted.rawContent,
      createdAt: inserted.createdAt,
      provider: result.provider,
      verdict: parseMatchVerdict(result.rawContent),
      warning: isFallback
        ? "Il confronto AI non è stato completato. È stata salvata la scheda letta dai documenti di profilo e il conteggio analisi non è stato consumato. Riprova tra poco."
        : null,
    });
  } catch (err) {
    console.error("[match] error", {
      requestId,
      durationMs: Date.now() - t0,
      err: err instanceof Error ? err.message : String(err),
    });
    const message = err instanceof Error ? err.message : "Errore verifica aderenza";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}
