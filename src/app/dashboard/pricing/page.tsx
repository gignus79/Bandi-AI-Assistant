"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { PLANS } from "@/lib/stripe";

interface UsageState {
  plan: string;
  planName: string;
  used: number;
  limit: number | null;
  canRunAnalysis: boolean;
  messagesUsed?: number;
  messagesLimit?: number | null;
}

export default function PricingPage() {
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => {
        if (d.plan != null) setUsage(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const startCheckout = async (priceId: string) => {
    if (!priceId) return;
    setCheckoutLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Errore");
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Piani e utilizzo</h1>
      {loading ? (
        <p className="text-muted-foreground">Caricamento...</p>
      ) : usage ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Piano attuale: <strong className="text-foreground">{usage.planName}</strong>
            {usage.limit != null && (
              <> · Analisi: {usage.used} / {usage.limit}</>
            )}
            {usage.limit === null && <> · Analisi illimitate</>}
            {usage.messagesLimit != null && (
              <> · Messaggi: {usage.messagesUsed ?? 0} / {usage.messagesLimit}</>
            )}
            {usage.messagesLimit === null && usage.messagesUsed != null && (
              <> · Messaggi: {usage.messagesUsed}</>
            )}
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Free</h2>
          <p className="mt-2 text-2xl font-bold text-foreground">0 €/mese</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              {PLANS.free.analysesPerMonth} analisi al mese
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              {PLANS.free.messagesTotal} messaggi AI totali
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-primary/50 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Pro</h2>
          <p className="mt-2 text-2xl font-bold text-foreground">~12 €/mese</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              {PLANS.pro.analysesPerMonth} analisi al mese
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              {PLANS.pro.messagesPerMonth} messaggi AI al mese
            </li>
          </ul>
          <button
            type="button"
            onClick={() => PLANS.pro.priceId && startCheckout(PLANS.pro.priceId)}
            disabled={!PLANS.pro.priceId || checkoutLoading !== null}
            className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {checkoutLoading === PLANS.pro.priceId ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Sottoscrivi"
            )}
          </button>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Unlimited</h2>
          <p className="mt-2 text-2xl font-bold text-foreground">~29 €/mese</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Analisi illimitate
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              {PLANS.unlimited.messagesPerMonth} messaggi AI al mese
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Rate limit 10 msg/min
            </li>
          </ul>
          <button
            type="button"
            onClick={() =>
              PLANS.unlimited.priceId && startCheckout(PLANS.unlimited.priceId)
            }
            disabled={!PLANS.unlimited.priceId || checkoutLoading !== null}
            className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {checkoutLoading === PLANS.unlimited.priceId ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Sottoscrivi"
            )}
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Configura STRIPE_PRO_PRICE_ID e STRIPE_UNLIMITED_PRICE_ID in Stripe Dashboard
        (Prodotti e prezzi) e nelle variabili d’ambiente per abilitare i pulsanti.
      </p>
    </div>
  );
}
