import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { getPublicAppSlug } from "@/lib/app-identity";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Prima visita autenticata per app: salva su Clerk `publicMetadata.signup_app` e su DB `signup_app_slug`
 * solo se non già impostati (attribuzione “first touch” per marketing tra più prodotti).
 */
export async function POST() {
  try {
    const userId = await requireAuth();
    const appSlug = getPublicAppSlug();

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const meta = clerkUser.publicMetadata as Record<string, unknown>;
    const existing = typeof meta.signup_app === "string" ? meta.signup_app : null;

    if (!existing) {
      await client.users.updateUser(userId, {
        publicMetadata: {
          ...meta,
          signup_app: appSlug,
        },
      });
    }

    const signupFromClerk = existing ?? appSlug;
    const row = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (row.length > 0 && !row[0].signupAppSlug) {
      await db
        .update(users)
        .set({ signupAppSlug: signupFromClerk, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } else if (row.length === 0) {
      await db.insert(users).values({
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
        signupAppSlug: signupFromClerk,
      });
    }

    return NextResponse.json({
      ok: true,
      appSlug,
      signupAppUnchanged: Boolean(existing),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
