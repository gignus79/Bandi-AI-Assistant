import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { WelcomeMediaMatterLogo } from "@/components/layout/WelcomeMediaMatterLogo";
import { AiDisclaimer } from "@/components/legal/AiDisclaimer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Footer } from "@/components/layout/Footer";
import { BetaBadge } from "@/components/ui/BetaBadge";
import { PLANS } from "@/lib/stripe";

const TAGS = [
  "Upload multiplo",
  "Sintesi & requisiti",
  "Chat contestuale",
  "Export calendario",
];

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-transparent dark:text-slate-100">
      <div className="absolute right-3 top-3 z-20 sm:right-5 sm:top-5">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
        <WelcomeMediaMatterLogo />
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-100/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-800 shadow-sm backdrop-blur-md dark:border-violet-400/25 dark:bg-violet-950/40 dark:text-violet-200/90 dark:shadow-[0_0_24px_rgba(139,92,246,0.25)] sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_#22d3ee] dark:bg-cyan-400" aria-hidden />
            AI Assistant
          </span>
          <BetaBadge className="text-[10px] sm:text-xs" />
        </div>

        <div className="w-full max-w-xl p-[1px] sm:max-w-2xl">
          <div className="rounded-[28px] bg-gradient-to-br from-cyan-400/35 via-violet-500/30 to-fuchsia-500/35 p-[1px] shadow-[0_0_60px_-12px_rgba(139,92,246,0.45)] dark:from-cyan-400/35">
            <div className="rounded-[27px] border border-slate-200/90 bg-white/95 px-6 py-8 shadow-inner backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b0614]/75 sm:px-10 sm:py-10">
              <h1 className="text-center text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl md:text-4xl dark:text-white">
                Analisi completa di un bando.
                <span className="mt-1 block bg-gradient-to-r from-cyan-700 to-violet-800 bg-clip-text text-transparent dark:from-cyan-200 dark:to-violet-200">
                  In secondi, non in ore.
                </span>
              </h1>
              <p className="mt-4 text-center text-sm text-slate-600 sm:text-base dark:text-violet-100/75">
                Upload documenti · Analisi strutturata · Chat AI contestuale · Export calendario
              </p>

              <p className="mt-5 text-center text-sm leading-relaxed text-slate-700 dark:text-violet-100/85">
                <span className="font-semibold text-slate-900 dark:text-white">Piani e utilizzo</span>
                {" — "}
                <strong>Free</strong>: fino a {PLANS.free.analysesPerMonth} analisi al mese e{" "}
                {PLANS.free.messagesTotal} messaggi di chat totali. <strong>Pro</strong>:{" "}
                {PLANS.pro.analysesPerMonth} analisi/mese e {PLANS.pro.messagesPerMonth} messaggi/mese.{" "}
                <strong>Unlimited</strong>: analisi senza limite mensile e {PLANS.unlimited.messagesPerMonth}{" "}
                messaggi/mese.{" "}
                <SignedIn>
                  <Link
                    href="/dashboard/pricing"
                    className="font-medium text-violet-700 underline decoration-violet-400/80 underline-offset-2 hover:text-violet-900 dark:text-cyan-300 dark:hover:text-cyan-200"
                  >
                    Apri Abbonamento
                  </Link>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="font-medium text-violet-700 underline decoration-violet-400/80 underline-offset-2 hover:text-violet-900 dark:text-cyan-300 dark:hover:text-cyan-200"
                    >
                      Accedi per i piani
                    </button>
                  </SignInButton>
                </SignedOut>
              </p>

              <div className="mt-8 flex flex-col items-center gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="group relative w-full max-w-sm rounded-full bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(139,92,246,0.55),0_0_56px_rgba(34,211,238,0.25)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 sm:text-base"
                    >
                      <span className="relative z-10">Free: 3 analisi al mese</span>
                      <span
                        className="absolute inset-0 rounded-full bg-white/10 opacity-0 transition group-hover:opacity-100"
                        aria-hidden
                      />
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link
                    href="/dashboard"
                    className="group relative flex w-full max-w-sm items-center justify-center rounded-full bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(139,92,246,0.55),0_0_56px_rgba(34,211,238,0.25)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 sm:text-base"
                  >
                    Vai alla dashboard
                  </Link>
                </SignedIn>
              </div>

              <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-600 sm:text-xs dark:text-violet-300/80">
                Servizio in versione Beta: funzionalità e limiti possono cambiare; in caso di problemi contattaci dal
                link Feedback nell’app.
              </p>
              <ul className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3" aria-label="Funzionalità">
                {TAGS.map((label) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-violet-300/50 bg-slate-100/90 px-3 py-1.5 text-xs text-slate-800 backdrop-blur-md sm:text-sm dark:border-violet-400/20 dark:bg-black/35 dark:text-violet-100/85"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500 shadow-[0_0_8px_#22d3ee] dark:bg-cyan-400"
                      aria-hidden
                    />
                    {label}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <AiDisclaimer />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-slate-200/90 bg-white/85 text-slate-700 backdrop-blur-md dark:border-white/10 dark:bg-black/35 dark:text-violet-200/85 [&_a]:text-violet-700 dark:[&_a]:text-violet-200/90 [&_a]:hover:text-slate-900 dark:[&_a]:hover:text-white [&_span]:text-slate-600 dark:[&_span]:text-violet-300/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-800 sm:text-sm dark:text-violet-100/95">
            <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_12px_#22d3ee] dark:bg-cyan-400" aria-hidden />
            MEDIAMATTER
          </span>
          <span className="text-xs sm:text-sm">Bandi AI Assistant</span>
        </div>
        <Footer className="border-t-0 border-slate-200/80 bg-transparent dark:border-white/5" />
      </div>
    </div>
  );
}
