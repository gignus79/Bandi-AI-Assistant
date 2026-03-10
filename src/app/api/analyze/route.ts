import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { ensureUser } from "@/lib/db/users";
import { db } from "@/lib/db";
import { bandi, analyses } from "@/lib/db/schema";
import { analyzeDocumentWithLLM } from "@/lib/llm/client";
import { getPlanForUser } from "@/lib/subscription";
import {
  canRunAnalysis,
  incrementAnalysisCount,
  checkRateLimit,
  incrementRateLimit,
} from "@/lib/usage";
import { eq } from "drizzle-orm";

const zBody = z.object({
  bandoId: z.string().uuid(),
  documentId: z.string().uuid().optional(),
  title: z.string().optional(),
  content: z.string().min(1),
  fileName: z.string().optional(),
});

export const maxDuration = 120;

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
    const { bandoId, documentId, title, content, fileName } = parsed.data;

    const bandoRows = await db.select().from(bandi).where(eq(bandi.id, bandoId)).limit(1);
    if (bandoRows.length === 0 || bandoRows[0].userId !== userId) {
      return NextResponse.json({ error: "Bando non trovato." }, { status: 404 });
    }

    const planId = await getPlanForUser(userId);
    const { allowed, used, limit } = await canRunAnalysis(userId, planId);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "Limite analisi mensili raggiunto.",
          used,
          limit,
        },
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
    await incrementRateLimit(userId, "analyze_minute");

    const result = await analyzeDocumentWithLLM(content, fileName);
    await incrementAnalysisCount(userId);

    const [inserted] = await db
      .insert(analyses)
      .values({
        bandoId,
        documentId: documentId ?? null,
        title: title ?? null,
        summary: result.summary,
        requirements: result.requirements ?? null,
        deadlines: result.deadlines ?? null,
        criteria: result.criteria ?? null,
        insights: result.insights ?? null,
        suggestions: result.suggestions ?? null,
        rawContent: result.rawContent ?? null,
      })
      .returning();

    return NextResponse.json({
      id: inserted.id,
      summary: inserted.summary,
      requirements: inserted.requirements,
      deadlines: inserted.deadlines,
      criteria: inserted.criteria,
      insights: inserted.insights,
      suggestions: inserted.suggestions,
      rawContent: inserted.rawContent,
      createdAt: inserted.createdAt,
    });
  } catch (err) {
    console.error("Analyze error:", err);
    const message = err instanceof Error ? err.message : "Errore analisi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
