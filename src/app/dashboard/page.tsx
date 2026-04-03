"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { BetaBadge } from "@/components/ui/BetaBadge";

interface Bando {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
}

const USAGE_UPDATED_EVENT = "usage-updated";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bandi, setBandi] = useState<Bando[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const pollingDone = useRef(false);

  useEffect(() => {
    if (pollingDone.current) return;
    const success = searchParams.get("success") === "1";
    if (!success) return;

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
            window.dispatchEvent(new CustomEvent(USAGE_UPDATED_EVENT));
            router.replace("/dashboard", { scroll: false });
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

  useEffect(() => {
    fetch("/api/bandi")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBandi(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const createBando = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/bandi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const data = await res.json();
      if (data.id) {
        setBandi((prev) => [...prev, { ...data, description: data.description ?? null }]);
        setNewTitle("");
        router.push(`/dashboard/bandi/${data.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-[24px] border border-slate-200 bg-white/95 p-6 text-foreground shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0c0818]/70 dark:shadow-[0_0_48px_-16px_rgba(139,92,246,0.25)]">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <BrandLogo heightClass="h-14 sm:h-16" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 gap-y-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-foreground">
                Bandi AI Assistant
              </h2>
              <BetaBadge />
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-muted-foreground">
              Carica la documentazione dei bandi (PDF, Word, Excel, immagini o testo incollato), avvia l’analisi e ottieni
              sintesi, requisiti, scadenze, criteri di valutazione e suggerimenti con intelligenza artificiale.
              Crea bandi, condividi le analisi ed esporta in PDF o calendario. Per limiti e piani vedi{" "}
              <Link href="/dashboard/pricing" className="font-medium text-violet-700 underline underline-offset-2 hover:text-violet-900 dark:text-cyan-300 dark:hover:text-cyan-200">
                Abbonamento
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">I tuoi bandi</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nome nuovo bando..."
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm backdrop-blur-sm placeholder:text-slate-500 dark:border-white/10 dark:bg-[#0c0818]/80 dark:text-foreground dark:placeholder:text-muted-foreground"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createBando()}
          />
          <button
            type="button"
            onClick={createBando}
            disabled={creating || !newTitle.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.45)] transition hover:brightness-110 disabled:opacity-50"
          >
            <PlusCircle className="h-4 w-4" />
            Nuovo bando
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Caricamento...</p>
      ) : bandi.length === 0 ? (
        <div className="rounded-[20px] border border-slate-200 bg-white/95 p-8 text-center text-slate-700 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#0c0818]/60 dark:text-muted-foreground">
          <p className="mb-4">Non hai ancora creato bandi.</p>
          <p className="text-sm">
            Inserisci un nome sopra e clicca &quot;Nuovo bando&quot; per iniziare.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bandi.map((b) => (
            <li key={b.id}>
              <Link
                href={`/dashboard/bandi/${b.id}`}
                className="block rounded-[20px] border border-slate-200 bg-white p-4 text-slate-900 shadow-sm backdrop-blur-sm transition hover:border-violet-400/50 hover:shadow-md dark:border-white/10 dark:bg-[#0c0818]/65 dark:text-foreground dark:hover:border-violet-400/40 dark:hover:shadow-[0_0_28px_-8px_rgba(139,92,246,0.35)]"
              >
                <h2 className="font-semibold text-slate-900 dark:text-foreground">{b.title}</h2>
                {b.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-muted-foreground">
                    {b.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500 dark:text-muted-foreground">
                  {new Date(b.createdAt).toLocaleDateString("it-IT")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="space-y-8 p-4 text-muted-foreground">Caricamento...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
