import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function hasAiConsent(userId: string): Promise<boolean> {
  const rows = await db
    .select({ aiConsentAt: users.aiConsentAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return Boolean(rows[0]?.aiConsentAt);
}

export async function grantAiConsent(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ aiConsentAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/** Null se il consenso c'è. Altrimenti la risposta da restituire subito. */
export async function requireAiConsent(userId: string): Promise<NextResponse | null> {
  if (await hasAiConsent(userId)) return null;
  return NextResponse.json(
    {
      error:
        "Per usare l'intelligenza artificiale serve il consenso al trattamento dei documenti e alla trasparenza sull'uso dell'AI.",
      code: "CONSENT_REQUIRED",
    },
    { status: 403 }
  );
}
