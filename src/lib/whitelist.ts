import { eq } from "drizzle-orm";
import { matchesWhitelist } from "@/config/test-users-whitelist";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function isTestUser(userId: string): Promise<boolean> {
  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return matchesWhitelist(userId, rows[0]?.email ?? null);
}
