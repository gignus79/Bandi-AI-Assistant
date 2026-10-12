"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function AiConsentGate() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/consent")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data.accepted === false) setOpen(true);
      })
      .catch(() => {});
    const onRequired = () => setOpen(true);
    window.addEventListener("bandi-consent-required", onRequired);
    return () => {
      cancelled = true;
      window.removeEventListener("bandi-consent-required", onRequired);
    };
  }, []);

  const accept = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/consent", { method: "POST" });
      if (response.ok) setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-consent-title"
        className="w-full max-w-lg rounded-2xl border border-violet-200 bg-white p-5 text-slate-900 shadow-xl dark:border-violet-500/30 dark:bg-[#120c1c] dark:text-slate-100"
      >
        <h2 id="ai-consent-title" className="text-lg font-semibold">
          Consenso all&apos;uso dell&apos;intelligenza artificiale
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <p>
            Le analisi, la chat, la verifica di aderenza, la compilazione moduli e i grafici sono prodotti da un
            sistema di intelligenza artificiale. Non sono decisioni di ammissibilità e vanno controllati sui testi
            ufficiali.
          </p>
          <p>
            I documenti che carichi possono contenere dati personali. Per generare l&apos;output vengono inviati ai
            fornitori dei modelli (Anthropic e, se attivo, OpenAI), anche fuori dallo Spazio economico europeo. Il
            trattamento avviene solo su tua richiesta e per erogare il servizio.
          </p>
          <p>
            Dettagli nella{" "}
            <Link href="/privacy" className="font-medium text-violet-700 underline dark:text-cyan-300">
              informativa privacy
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={() => void accept()}
          disabled={saving}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Accetto e continuo
        </button>
      </div>
    </div>
  );
}
