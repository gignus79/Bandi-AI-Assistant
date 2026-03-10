import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPlanForUser } from "@/lib/subscription";
import { getOrCreateUsage, canSendMessage } from "@/lib/usage";
import { PLANS } from "@/lib/stripe";

export async function GET() {
  try {
    const userId = await requireAuth();
    const planId = await getPlanForUser(userId);
    const plan = PLANS[planId];
    const month = new Date().toISOString().slice(0, 7);
    const { analysisCount } = await getOrCreateUsage(userId, month);
    const analysisLimit = plan.analysesPerMonth < 0 ? null : plan.analysesPerMonth;
    const msgCheck = await canSendMessage(userId, planId);
    return NextResponse.json({
      plan: planId,
      planName: plan.name,
      used: analysisCount,
      limit: analysisLimit,
      canRunAnalysis: analysisLimit === null || analysisCount < analysisLimit,
      messagesUsed: msgCheck.used,
      messagesLimit: msgCheck.limit,
      canSendMessage: msgCheck.allowed,
    });
  } catch (err) {
    console.error("Usage get error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore" },
      { status: 500 }
    );
  }
}
