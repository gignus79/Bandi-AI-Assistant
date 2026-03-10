import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ensureUser } from "@/lib/db/users";
import { stripe } from "@/lib/stripe";
import { PLANS } from "@/lib/stripe";
import { z } from "zod";

const zBody = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    await ensureUser(userId);

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe non configurato." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = zBody.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload non valido.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { priceId, successUrl, cancelUrl } = parsed.data;

    if (priceId.startsWith("prod_")) {
      return NextResponse.json(
        {
          error:
            "Configurazione errata: hai usato l'ID prodotto (prod_...). In Stripe Dashboard, apri ogni prodotto → sezione Tariffe → clicca sul prezzo e copia l'ID prezzo (price_...). Imposta NEXT_PUBLIC_STRIPE_PRO_PRICE_ID e NEXT_PUBLIC_STRIPE_UNLIMITED_PRICE_ID con questi ID su Vercel.",
        },
        { status: 400 }
      );
    }

    const validPriceIds = [PLANS.pro.priceId, PLANS.unlimited.priceId].filter(
      Boolean
    );
    if (!validPriceIds.includes(priceId)) {
      return NextResponse.json(
        { error: "Piano non valido." },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? `${origin}/dashboard?success=1`,
      cancel_url: cancelUrl ?? `${origin}/pricing`,
      client_reference_id: userId,
      subscription_data: {
        metadata: { userId },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore checkout" },
      { status: 500 }
    );
  }
}
