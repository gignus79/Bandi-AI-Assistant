import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { usage, rateLimits } from "./db/schema";
import { PLANS, type PlanId } from "./stripe";
import { isTestUser } from "./whitelist";

const MONTH_FORMAT = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export async function getOrCreateUsage(
  userId: string,
  month: string
): Promise<{ analysisCount: number; messageCount: number }> {
  const existing = await db
    .select()
    .from(usage)
    .where(and(eq(usage.userId, userId), eq(usage.month, month)))
    .limit(1);

  if (existing.length > 0) {
    return {
      analysisCount: existing[0].analysisCount,
      messageCount: existing[0].messageCount,
    };
  }
  await db.insert(usage).values({
    userId,
    month,
    analysisCount: 0,
    messageCount: 0,
  });
  return { analysisCount: 0, messageCount: 0 };
}

export async function incrementAnalysisCount(userId: string): Promise<void> {
  const month = MONTH_FORMAT(new Date());
  const row = await db
    .select()
    .from(usage)
    .where(and(eq(usage.userId, userId), eq(usage.month, month)))
    .limit(1);

  if (row.length > 0) {
    await db
      .update(usage)
      .set({
        analysisCount: row[0].analysisCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(usage.id, row[0].id));
  } else {
    await db.insert(usage).values({
      userId,
      month,
      analysisCount: 1,
      messageCount: 0,
    });
  }
}

export async function getTotalMessageCount(userId: string): Promise<number> {
  const rows = await db
    .select({ messageCount: usage.messageCount })
    .from(usage)
    .where(eq(usage.userId, userId));
  return rows.reduce((sum, r) => sum + r.messageCount, 0);
}

export async function incrementMessageCount(userId: string): Promise<void> {
  const month = MONTH_FORMAT(new Date());
  const row = await db
    .select()
    .from(usage)
    .where(and(eq(usage.userId, userId), eq(usage.month, month)))
    .limit(1);

  if (row.length > 0) {
    await db
      .update(usage)
      .set({
        messageCount: row[0].messageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(usage.id, row[0].id));
  } else {
    await db.insert(usage).values({
      userId,
      month,
      analysisCount: 0,
      messageCount: 1,
    });
  }
}

export async function canSendMessage(
  userId: string,
  planId: PlanId
): Promise<{ allowed: boolean; used: number; limit: number | null }> {
  if (isTestUser(userId))
    return { allowed: true, used: 0, limit: null };
  const plan = PLANS[planId];
  if (plan.messagesTotal != null) {
    const total = await getTotalMessageCount(userId);
    return {
      allowed: total < plan.messagesTotal,
      used: total,
      limit: plan.messagesTotal,
    };
  }
  if (plan.messagesPerMonth != null) {
    const month = MONTH_FORMAT(new Date());
    const { messageCount } = await getOrCreateUsage(userId, month);
    return {
      allowed: messageCount < plan.messagesPerMonth,
      used: messageCount,
      limit: plan.messagesPerMonth,
    };
  }
  return { allowed: true, used: 0, limit: null };
}

function getMinuteWindowKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${now.getHours()}-${now.getMinutes()}`;
}

/** Rate limit: max N requests per minute for a given slug. */
export async function checkRateLimit(
  userId: string,
  slug: string,
  maxPerMinute: number
): Promise<{ allowed: boolean }> {
  if (isTestUser(userId)) return { allowed: true };
  const windowKey = getMinuteWindowKey();
  const existing = await db
    .select()
    .from(rateLimits)
    .where(
      and(
        eq(rateLimits.userId, userId),
        eq(rateLimits.slug, slug),
        eq(rateLimits.windowKey, windowKey)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { allowed: existing[0].count < maxPerMinute };
  }
  return { allowed: true };
}

export async function incrementRateLimit(userId: string, slug: string): Promise<void> {
  const windowKey = getMinuteWindowKey();
  const existing = await db
    .select()
    .from(rateLimits)
    .where(
      and(
        eq(rateLimits.userId, userId),
        eq(rateLimits.slug, slug),
        eq(rateLimits.windowKey, windowKey)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(rateLimits)
      .set({
        count: existing[0].count + 1,
        updatedAt: new Date(),
      })
      .where(eq(rateLimits.id, existing[0].id));
  } else {
    await db.insert(rateLimits).values({
      userId,
      slug,
      windowKey,
      count: 1,
    });
  }
}

/** Rate limit: max 10 chat messages per minute (for Unlimited and others). */
export async function checkChatRateLimit(
  userId: string,
  maxPerMinute: number = 10
): Promise<{ allowed: boolean }> {
  return checkRateLimit(userId, "chat_minute", maxPerMinute);
}

export async function incrementChatRateLimit(userId: string): Promise<void> {
  await incrementRateLimit(userId, "chat_minute");
}

export async function canRunAnalysis(
  userId: string,
  planId: PlanId
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (isTestUser(userId))
    return { allowed: true, used: 0, limit: -1 };
  const plan = PLANS[planId];
  const limit = plan.analysesPerMonth;
  if (limit < 0) {
    return { allowed: true, used: 0, limit: -1 };
  }
  const month = MONTH_FORMAT(new Date());
  const { analysisCount } = await getOrCreateUsage(userId, month);
  return {
    allowed: analysisCount < limit,
    used: analysisCount,
    limit,
  };
}
