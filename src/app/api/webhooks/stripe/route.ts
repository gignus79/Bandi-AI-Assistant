import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe non configurato." },
      { status: 503 }
    );
  }
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown";
    return NextResponse.json({ error: `Webhook signature failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId =
        session.client_reference_id ??
        (session.subscription
          ? (
              await stripe.subscriptions.retrieve(
                session.subscription as string
              )
            ).metadata?.userId
          : null);
      if (!userId) break;
      const subId = session.subscription as string;
      if (!subId) break;
      const sub = await stripe.subscriptions.retrieve(subId);
      const priceId = sub.items.data[0]?.price?.id ?? null;
      const status = sub.status as
        | "active"
        | "canceled"
        | "past_due"
        | "trialing";
      const existing = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, sub.id))
        .limit(1);
      const payload = {
        userId,
        stripeCustomerId: session.customer as string | null,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        status,
        currentPeriodStart: new Date((sub.current_period_start ?? 0) * 1000),
        currentPeriodEnd: new Date((sub.current_period_end ?? 0) * 1000),
        updatedAt: new Date(),
      };
      if (existing.length > 0) {
        await db
          .update(subscriptions)
          .set(payload)
          .where(eq(subscriptions.id, existing[0].id));
      } else {
        await db.insert(subscriptions).values({
          ...payload,
          createdAt: new Date(),
        });
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (!userId) break;
      const priceId = sub.items.data[0]?.price?.id ?? null;
      const existing = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, sub.id))
        .limit(1);
      if (existing.length > 0) {
        await db
          .update(subscriptions)
          .set({
            status: sub.status as "active" | "canceled" | "past_due" | "trialing",
            stripePriceId: priceId,
            currentPeriodStart: new Date((sub.current_period_start ?? 0) * 1000),
            currentPeriodEnd: new Date((sub.current_period_end ?? 0) * 1000),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, existing[0].id));
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await db
        .update(subscriptions)
        .set({
          status: "canceled",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
