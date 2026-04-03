"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { bandiAppInboundLinks, crossSellApps } from "@/content/site-marketing";
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

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const pollingDone = useRef(false);

  const refetchUsage = () => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => {
        if (d.plan != null) setUsage(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    refetchUsage();
  }, []);

  useEffect(() => {
    const onUsageUpdated = () => refetchUsage();
    window.addEventListener("usage-updated", onUsageUpdated);
    return () => window.removeEventListener("usage-updated", onUsageUpdated);
  }, []);

  useEffect(() => {
    if (pollingDone.current) return;
    if (searchParams.get("success") !== "1") return;

    const maxAttempts = 15;
    const intervalMs = 2000;
    let attempts = 0;

    const poll = () => {
      attempts += 1;
      fetch("/api/usage")
        .then((r) => r.json())
        .then((d) => {
          if (d.plan && d.plan !== "free") {
            pollingDone.current = true;
            setUsage(d);
            setLoading(false);
            window.dispatchEvent(new CustomEvent("usage-updated"));
            router.replace("/dashboard/pricing", { scroll: false });
          } else if (attempts < maxAttempts) {
            setTimeout(poll, intervalMs);
          }
        })
        .catch(() => {
          if (attempts < maxAttempts) setTimeout(poll, intervalMs);
        });
    };

    poll();
  }, [searchParams, router]);

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
    <div className="mx-auto max-w-4xl space-y-10">
      <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-white/10 dark:bg-[#0c0818]/70">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-foreground">
          Bandi AI Assistant — cos&apos;è
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-muted-foreground">
          Applicazione per{" "}
          <strong className="text-slate-900 dark:text-foreground">
            analizzare la documentazione dei bandi
          </strong>{" "}
          (PDF, Word, fogli di calcolo, testo, immagini): sintesi strutturate, requisiti, scadenze, criteri di
          valutazione e suggerimenti con intelligenza artificiale. Puoi{" "}
          <strong className="text-slate-900 dark:text-foreground">chattare in modo contestuale</strong> su ogni bando,
          esportare in Markdown o PDF e aggiungere le scadenze al calendario (.ics). Pensata per consulenti, PM e team
          che devono ridurre i tempi di lettura senza perdere dettaglio.
        </p>
        <p className="mt-3 text-sm text-slate-700 dark:text-muted-foreground">
          <strong className="text-slate-900 dark:text-foreground">MediaMatter</strong> — Giorgio Lovecchio.{" "}
          <Link
            href="/dashboard"
            className="font-medium text-violet-700 underline underline-offset-2 hover:text-violet-900 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            Dashboard bandi
          </Link>
          {" · "}
          <a
            href="https://www.giorgiolovecchio.com/progetti-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-violet-700 underline underline-offset-2 hover:text-violet-900 dark:text-cyan-300 dark:hover:text-cyan-200"
          >
            Scheda su giorgiolovecchio.com
            <ExternalLink className="ml-0.5 inline h-3 w-3 align-middle opacity-70" aria-hidden />
          </a>
        </p>
        <ul className="mt-4 space-y-2 border-t border-slate-200/80 pt-4 dark:border-white/10">
          {bandiAppInboundLinks.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex flex-wrap items-baseline gap-x-2 text-sm text-violet-700 hover:text-violet-900 dark:text-cyan-300 dark:hover:text-cyan-200"
              >
                <span className="font-medium underline decoration-violet-400/70 underline-offset-2 group-hover:decoration-violet-600 dark:decoration-cyan-500/50">
                  {item.label}
                </span>
                <span className="text-slate-600 dark:text-muted-foreground">— {item.description}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-foreground">Piani e utilizzo</h1>
        {loading ? (
        <p className="text-slate-600 dark:text-muted-foreground">Caricamento...</p>
      ) : usage ? (
        <div className="rounded-lg border border-slate-200 bg-white/90 p-4 dark:border-border dark:bg-card">
          <p className="text-sm text-slate-700 dark:text-muted-foreground">
            Piano attuale: <strong className="text-slate-900 dark:text-foreground">{usage.planName}</strong>
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
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-foreground">Free</h2>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-foreground">0 €/mese</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-muted-foreground">
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
        <div className="rounded-xl border border-primary/50 bg-white p-6 shadow-sm dark:bg-card">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-foreground">Pro</h2>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-foreground">~12 €/mese</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-muted-foreground">
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
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-foreground">Unlimited</h2>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-foreground">~29 €/mese</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-muted-foreground">
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

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-foreground">
            Altre applicazioni online
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-muted-foreground">
            Dallo stesso ecosistema MediaMatter — strumenti già in produzione sul sito.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {crossSellApps.map((app) => (
            <article
              key={app.title}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-400/50 hover:shadow-md dark:border-white/10 dark:bg-[#0c0818]/80 dark:hover:border-violet-500/30"
            >
              <a
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="text-[11px] font-medium uppercase tracking-wide text-violet-600 dark:text-violet-300/90">
                  {app.stack}
                </span>
                <h3 className="mt-2 text-base font-semibold text-slate-900 group-hover:text-violet-800 dark:text-foreground dark:group-hover:text-cyan-200">
                  {app.title}
                  <ExternalLink
                    className="ml-1 inline h-3.5 w-3.5 opacity-50 transition group-hover:opacity-100"
                    aria-hidden
                  />
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-muted-foreground">
                  {app.tagline}
                </p>
              </a>
              {app.secondaryHref && app.secondaryLabel ? (
                <a
                  href={app.secondaryHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-xs text-violet-700 underline underline-offset-2 hover:text-violet-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                >
                  {app.secondaryLabel}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Caricamento...</p>}>
      <PricingContent />
    </Suspense>
  );
}
