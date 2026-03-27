"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronRight, FileText, LineChart, MessageCircle, Sparkles, X } from "lucide-react";

const STORAGE_KEY = "bandi_onboarding_v1";

type StoredOnboarding = {
  version: 1;
  completed: boolean;
  displayName: string;
  completedAt?: string;
};

function loadStored(): StoredOnboarding | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredOnboarding;
  } catch {
    return null;
  }
}

function saveStored(data: StoredOnboarding) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("bandi-onboarding-updated"));
}

export function OnboardingWizard() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const s = loadStored();
    if (!s || !s.completed) {
      setOpen(true);
      if (s?.displayName) setName(s.displayName);
    }
  }, [mounted]);

  const canProceedStep0 = name.trim().length >= 2;

  const finish = () => {
    saveStored({
      version: 1,
      completed: true,
      displayName: name.trim(),
      completedAt: new Date().toISOString(),
    });
    setOpen(false);
  };

  const glassPanel =
    "rounded-[28px] border border-cyan-400/25 bg-white/[0.06] p-6 shadow-[0_0_48px_-12px_rgba(34,211,238,0.35)] backdrop-blur-xl";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 z-[101] w-[min(100vw-1.5rem,480px)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto ${glassPanel} text-foreground animate-in fade-in zoom-in-95`}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.25)]">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold tracking-tight text-white">
                  {step === 0 && "Benvenuto"}
                  {step === 1 && "Carica i documenti"}
                  {step === 2 && "Analisi e scadenze"}
                  {step === 3 && "Chat sul bando"}
                  {step === 4 && "Pronto!"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-slate-300">
                  {step === 0 && "Personalizza l’esperienza e segui la guida passo passo."}
                  {step === 1 && "File, testo o URL: l’app importerà anche i PDF collegati sul sito."}
                  {step === 2 && "Ottieni requisiti, scadenze e criteri in un’unica analisi strutturata."}
                  {step === 3 && "Chiedi chiarimenti in chat usando i documenti caricati."}
                  {step === 4 &&
                    `Tutto pronto${name.trim() ? `, ${name.trim()}` : ""}. Crea un bando dalla dashboard e aggiungi la documentazione.`}
                </Dialog.Description>
              </div>
            </div>
            {step < 4 && (
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                  aria-label="Chiudi"
                  onClick={() => {
                    saveStored({
                      version: 1,
                      completed: true,
                      displayName: name.trim() || "Utente",
                      completedAt: new Date().toISOString(),
                    });
                  }}
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {step === 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-200" htmlFor="onboarding-name">
                  Come vuoi essere chiamato?
                </label>
                <input
                  id="onboarding-name"
                  autoFocus
                  className="w-full rounded-2xl border border-cyan-500/20 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  placeholder="Il tuo nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canProceedStep0 && setStep(1)}
                />
                <p className="text-xs text-slate-400">
                  Useremo il nome solo in questa app sul tuo browser (nessun campo obbligatorio lato server).
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <div>
                    <p className="text-sm font-medium text-white">Carica documenti</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Trascina PDF, Excel o immagini. Incolla testo oppure incolla l’URL della pagina del bando: visiteremo
                      la pagina e le sottopagine dello stesso sito e importeremo i PDF trovati nei link.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex gap-3">
                  <LineChart className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <div>
                    <p className="text-sm font-medium text-white">Avvia l’analisi</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Dopo aver aggiunto i documenti, apri la scheda &quot;Analisi&quot; e lancia l’analisi complessiva: sintesi,
                      requisiti, scadenze, export in Markdown o PDF e calendario (.ics).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex gap-3">
                  <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                  <div>
                    <p className="text-sm font-medium text-white">Chatta sul bando</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Nella scheda Chat puoi fare domande puntuali. L’assistente usa i documenti che hai caricato per
                      questo bando.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 w-6 rounded-full ${step >= i ? "bg-cyan-400/80" : "bg-white/15"}`}
                  aria-hidden
                />
              ))}
            </div>
            <div className="flex gap-2">
              {step > 0 && step < 4 && (
                <button
                  type="button"
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Indietro
                </button>
              )}
              {step === 0 && (
                <button
                  type="button"
                  disabled={!canProceedStep0}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/90 to-sky-600/90 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)] disabled:opacity-40"
                  onClick={() => setStep(1)}
                >
                  Avanti <ChevronRight className="h-4 w-4" />
                </button>
              )}
              {step >= 1 && step < 3 && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/90 to-sky-600/90 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)]"
                  onClick={() => setStep((s) => s + 1)}
                >
                  Avanti <ChevronRight className="h-4 w-4" />
                </button>
              )}
              {step === 3 && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/90 to-sky-600/90 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)]"
                  onClick={() => setStep(4)}
                >
                  Avanti <ChevronRight className="h-4 w-4" />
                </button>
              )}
              {step === 4 && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/90 to-sky-600/90 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)]"
                  onClick={finish}
                >
                  Inizia ad usare l’app
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
