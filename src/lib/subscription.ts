import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { subscriptions } from "./db/schema";
import { getPlanByPriceId, type PlanId } from "./stripe";

export async function getPlanForUser(userId: string): Promise<PlanId> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.currentPeriodEnd))
    .limit(1);

  const sub = rows[0];
  const activeStatuses = ["active", "trialing"];
  if (!sub || !activeStatuses.includes(sub.status)) return "free";
  const plan = sub.stripePriceId ? getPlanByPriceId(sub.stripePriceId) : null;
  return plan ?? "free";
}
