import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ensureUser } from "@/lib/db/users";
import { grantAiConsent, hasAiConsent } from "@/lib/consent";

export async function GET() {
  try {
    const userId = await requireAuth();
    await ensureUser(userId);
    return NextResponse.json({ accepted: await hasAiConsent(userId) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST() {
  try {
    const userId = await requireAuth();
    await ensureUser(userId);
    await grantAiConsent(userId);
    return NextResponse.json({ accepted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
