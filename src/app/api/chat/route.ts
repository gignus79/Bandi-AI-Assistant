import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ensureUser } from "@/lib/db/users";
import { requireAiConsent } from "@/lib/consent";
import { db } from "@/lib/db";
import { bandi, documents, analyses, chatMessages } from "@/lib/db/schema";
import { chatWithLLM } from "@/lib/llm/client";
import { partitionDocuments } from "@/lib/documents/roles";
import { CHAT_SYSTEM_PROMPT, buildChatContextPrompt } from "@/lib/llm/prompts";
import { getPlanForUser } from "@/lib/subscription";
import {
  canSendMessage,
  checkChatRateLimit,
  incrementMessageCount,
  incrementChatRateLimit,
} from "@/lib/usage";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { parseVerbosity } from "@/lib/llm/verbosity";

const zBody = z.object({
  bandoId: z.string().uuid(),
  message: z.string().min(1),
  verbosity: z.enum(["concise", "balanced", "detailed"]).optional(),
});

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    await ensureUser(userId);
    const consent = await requireAiConsent(userId);
    if (consent) return consent;

    const body = await req.json();
    const parsed = zBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload non valido.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { bandoId, message, verbosity: verbosityRaw } = parsed.data;
    const verbosity = parseVerbosity(verbosityRaw);

    const bandoRows = await db.select().from(bandi).where(eq(bandi.id, bandoId)).limit(1);
    if (bandoRows.length === 0 || bandoRows[0].userId !== userId) {
      return NextResponse.json({ error: "Bando non trovato." }, { status: 404 });
    }
    const bando = bandoRows[0];

    const planId = await getPlanForUser(userId);
    const msgCheck = await canSendMessage(userId, planId);
    if (!msgCheck.allowed) {
      return NextResponse.json(
        {
          error: "Limite messaggi raggiunto.",
          used: msgCheck.used,
          limit: msgCheck.limit,
        },
        { status: 403 }
      );
    }
    const rateCheck = await checkChatRateLimit(userId, 10);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Troppi messaggi in poco tempo. Attendi un minuto." },
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
    const analysesRows = await db
      .select({ summary: analyses.summary, rawContent: analyses.rawContent })
      .from(analyses)
      .where(eq(analyses.bandoId, bandoId))
      .orderBy(analyses.createdAt)
      .limit(3);
    const formatDocs = (rows: { fileName: string; content: string }[], label: string) =>
      rows.length === 0
        ? `(Nessun documento: ${label})`
        : rows
            .slice(0, 6)
            .map((doc) => `### ${doc.fileName}\n${doc.content.slice(0, 2500)}`)
            .join("\n\n---\n\n");
    const documentsSummary = [
      `Documenti del bando:\n${formatDocs(grouped.bando, "bando")}`,
      `Documenti di profilo (visura e contesto):\n${formatDocs(grouped.context, "profilo")}`,
    ].join("\n\n");
    const lastAnalysesSummary = analysesRows
      .map((a) => (a.rawContent || a.summary).slice(0, 2000))
      .join("\n\n---\n\n");
    const systemContext = buildChatContextPrompt(
      bando.title,
      documentsSummary || "(Nessun documento caricato)",
      lastAnalysesSummary || "(Nessuna analisi ancora)"
    );

    const historyRows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.bandoId, bandoId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(50);
    const history = historyRows.map((r) => ({
      role: r.role as "user" | "assistant",
      content: r.content,
    }));

    await incrementChatRateLimit(userId);

    await db.insert(chatMessages).values({
      bandoId,
      role: "user",
      content: message,
    });

    const { text: reply, degraded } = await chatWithLLM(
      `${CHAT_SYSTEM_PROMPT}\n\nContesto:\n${systemContext}`,
      message,
      history,
      { verbosity }
    );

    await db.insert(chatMessages).values({
      bandoId,
      role: "assistant",
      content: reply,
    });

    await incrementMessageCount(userId);

    return NextResponse.json({
      reply,
      degraded,
      warning: degraded
        ? "Risposta in modalità limitata: i servizi AI non erano raggiungibili. Puoi riprovare tra poco."
        : null,
    });
  } catch (err) {
    console.error("Chat error:", err);
    const msg = err instanceof Error ? err.message : "Errore chat";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
