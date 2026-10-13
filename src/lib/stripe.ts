import Stripe from "stripe";

export const stripe =
  process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
    : null;

export const PLANS = {
  free: {
    name: "Free",
    analysesPerMonth: 3,
    messagesTotal: 10, // 10 messaggi AI totali (lifetime)
    messagesPerMonth: null as number | null,
    priceId: null as string | null,
  },
  pro: {
    name: "Pro",
    analysesPerMonth: 15,
    messagesPerMonth: 150,
    messagesTotal: null as number | null,
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ??
      process.env.STRIPE_PRO_PRICE_ID ??
      "",
  },
  unlimited: {
    name: "Unlimited",
    analysesPerMonth: -1,
    messagesPerMonth: 400,
    messagesTotal: null as number | null,
    priceId:
      process.env.NEXT_PUBLIC_STRIPE_UNLIMITED_PRICE_ID ??
      process.env.STRIPE_UNLIMITED_PRICE_ID ??
      "",
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function safeAppUrl(candidate: string | undefined, origin: string, fallbackPath: string): string {
  const fallback = new URL(fallbackPath, origin).toString();
  if (!candidate) return fallback;
  try {
    const target = new URL(candidate);
    const base = new URL(origin);
    if (target.origin !== base.origin) return fallback;
    if (target.protocol !== "https:" && target.protocol !== "http:") return fallback;
    return target.toString();
  } catch {
    return fallback;
  }
}

export function getPlanByPriceId(priceId: string): PlanId | null {
  if (priceId === PLANS.pro.priceId) return "pro";
  if (priceId === PLANS.unlimited.priceId) return "unlimited";
  return null;
}
