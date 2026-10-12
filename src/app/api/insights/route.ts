import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { ensureUser } from "@/lib/db/users";
import { requireAiConsent } from "@/lib/consent";
import { db } from "@/lib/db";
import { analyses, bandi, documents } from "@/lib/db/schema";
import { partitionDocuments } from "@/lib/documents/roles";
import { insightsWithLLM } from "@/lib/llm/client";
import { INSIGHTS_TITLE } from "@/lib/llm/insights-prompt";
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
  verbosity: z.enum(["concise", "balanced", "detailed"]).optional(),
});

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const requestId = randomUUID();
  try {
    const userId = await requireAuth();
    await ensureUser(userId);
    const consent = await requireAiConsent(userId);
    if (consent) return consent;

    const parsed = zBody.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload non valido." }, { status: 400 });
    }
    const { bandoId, verbosity: verbosityRaw } = parsed.data;
    const verbosity = parseVerbosity(verbosityRaw);

    const bandoRows = await db.select().from(bandi).where(eq(bandi.id, bandoId)).limit(1);
    if (bandoRows.length === 0 || bandoRows[0].userId !== userId) {
      return NextResponse.json({ error: "Bando non trovato." }, { status: 404 });
    }

    const planId = await getPlanForUser(userId);
    const quota = await canRunAnalysis(userId, planId);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: "Limite analisi mensili raggiunto.", used: quota.used, limit: quota.limit },
        { status: 403 }
      );
    }
    const rate = await checkRateLimit(userId, "analyze_minute", 5);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Troppe analisi in poco tempo. Attendi un minuto." }, { status: 429 });
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
    const bandoDocs = grouped.bando.filter((doc) => doc.content.trim());
    const contextDocs = grouped.context.filter((doc) => doc.content.trim());
    if (bandoDocs.length === 0 && contextDocs.length === 0) {
      return NextResponse.json(
        { error: "Carica almeno un documento del bando o del profilo prima dei grafici." },
        { status: 400 }
      );
    }

    await incrementRateLimit(userId, "analyze_minute");
    const result = await insightsWithLLM({
      bandoTitle: bandoRows[0].title,
      bandoDocs,
      contextDocs,
      verbosity,
    });
    const isFallback = result.provider === "fallback";
    if (!isFallback) await incrementAnalysisCount(userId);

    const [inserted] = await db
      .insert(analyses)
      .values({
        bandoId,
        title: INSIGHTS_TITLE,
        summary: result.summary,
        requirements: null,
        deadlines: null,
        criteria: null,
        insights: null,
        suggestions: null,
        rawContent: result.rawContent,
      })
      .returning();

    console.info("[insights] ok", { requestId, bandoId, provider: result.provider, fallback: isFallback });
    return NextResponse.json({
      id: inserted.id,
      summary: inserted.summary,
      rawContent: inserted.rawContent,
      provider: result.provider,
      warning: isFallback
        ? "I grafici non sono stati generati. Il conteggio analisi non è stato consumato. Riprova tra poco."
        : null,
    });
  } catch (err) {
    console.error("[insights] error", { requestId, err: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore suggerimenti" },
      { status: 500 }
    );
  }
}
