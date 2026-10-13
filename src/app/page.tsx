import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { WelcomeMediaMatterLogo } from "@/components/layout/WelcomeMediaMatterLogo";
import { AiDisclaimer } from "@/components/legal/AiDisclaimer";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Footer } from "@/components/layout/Footer";
import { PLANS } from "@/lib/stripe";

const TAGS = [
  "Upload multiplo",
  "Verifica visura",
  "Sintesi & requisiti",
  "Chat contestuale",
  "Export calendario",
];

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-slate-900 dark:text-slate-100">
      <Image
        src="/landing-emotion.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="!fixed inset-0 h-dvh w-screen object-cover object-center"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 via-white/10 to-slate-950/20 dark:from-[#070212]/45 dark:via-[#070212]/30 dark:to-[#070212]/65"
        aria-hidden
      />
      <div className="absolute right-3 top-3 z-20 sm:right-5 sm:top-5">
        <div className="rounded-full bg-white/80 shadow-sm backdrop-blur-md dark:bg-black/45">
          <ThemeToggle />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
        <WelcomeMediaMatterLogo />

        <div className="w-full max-w-xl p-[1px] sm:max-w-2xl">
          <div className="rounded-[28px] bg-gradient-to-br from-cyan-400/35 via-violet-500/30 to-fuchsia-500/35 p-[1px] shadow-[0_0_60px_-12px_rgba(139,92,246,0.45)] dark:from-cyan-400/35">
            <div className="rounded-[27px] border border-slate-200/80 bg-white/88 px-6 py-8 shadow-inner backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0614]/78 sm:px-10 sm:py-10">
              <p className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-cyan-700 to-violet-800 bg-clip-text text-transparent dark:from-cyan-200 dark:to-violet-200">
                  Bandi AI Assistant
                </span>
              </p>
              <h1 className="mt-3 text-center text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Analisi completa di un bando.
                <span className="mt-1 block bg-gradient-to-r from-cyan-700 to-violet-800 bg-clip-text text-transparent dark:from-cyan-200 dark:to-violet-200">
                  In secondi, non in ore.
                </span>
              </h1>
              <p className="mt-4 text-center text-sm leading-relaxed text-slate-600 sm:text-base dark:text-violet-100/80">
                Smetti di scorrere decine di pagine. Carica il fascicolo e la visura: in un attimo hai una lettura nitida, da controllare e da portare avanti.
              </p>

              <p className="mt-5 text-center text-sm leading-relaxed text-slate-700 dark:text-violet-100/85">
                <strong>Free</strong>: fino a {PLANS.free.analysesPerMonth} analisi al mese e{" "}
                {PLANS.free.messagesTotal} messaggi di chat totali.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3">
                <SignedOut>
                  <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
                    <SignInButton mode="modal">
                      <button
                        type="button"
                        className="flex-1 rounded-full border border-violet-300 bg-white px-6 py-3 text-sm font-semibold text-violet-800 shadow-sm transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-violet-400/40 dark:bg-white/5 dark:text-violet-100 dark:hover:bg-white/10"
                      >
                        Accedi
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        type="button"
                        className="flex-1 rounded-full border border-cyan-400/70 bg-cyan-50 px-6 py-3 text-sm font-semibold text-cyan-900 shadow-sm transition hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 dark:border-cyan-300/40 dark:bg-cyan-400/10 dark:text-cyan-100 dark:hover:bg-cyan-400/20"
                      >
                        Registrati
                      </button>
                    </SignUpButton>
                  </div>
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="group relative w-full max-w-sm rounded-full bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(139,92,246,0.55),0_0_56px_rgba(34,211,238,0.25)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 sm:text-base"
                    >
                      <span className="relative z-10">Free: 3 analisi al mese</span>
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

      <div className="relative z-10 border-t border-white/40 bg-white/75 text-slate-700 backdrop-blur-md dark:border-white/10 dark:bg-black/40 dark:text-violet-200/85 [&_a]:text-violet-700 dark:[&_a]:text-violet-200/90 [&_a]:hover:text-slate-900 dark:[&_a]:hover:text-white [&_span]:text-slate-600 dark:[&_span]:text-violet-300/80">
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
