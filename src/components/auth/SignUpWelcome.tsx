import { BrandLogo } from "@/components/ui/BrandLogo";

/** Pannello introduttivo accanto al form Clerk (signup). */
export function SignUpWelcome() {
  return (
    <div className="mx-auto w-full max-w-lg rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-white to-slate-50/95 p-6 shadow-[0_0_40px_-12px_rgba(139,92,246,0.25)] dark:border-violet-500/20 dark:from-violet-950/50 dark:via-[#0c0818] dark:to-slate-950/80 dark:shadow-[0_0_48px_-12px_rgba(139,92,246,0.35)] sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <BrandLogo heightClass="h-10" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300/90">
            Benvenuto
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bandi AI Assistant
          </h1>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-violet-100/85">
        Crea il tuo account per analizzare bandi e documentazione: sintesi strutturate, chat sul testo e
        export per il lavoro quotidiano.
      </p>
      <ul className="mt-5 space-y-2.5 text-sm text-slate-700 dark:text-violet-50/90">
        <li className="flex gap-2">
          <span className="mt-0.5 text-violet-600 dark:text-violet-400" aria-hidden>
            ●
          </span>
          <span>Caricamento documenti (PDF, Word, fogli di calcolo) e analisi AI</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 text-violet-600 dark:text-violet-400" aria-hidden>
            ●
          </span>
          <span>Assistente conversazionale contestuale sul bando</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-0.5 text-violet-600 dark:text-violet-400" aria-hidden>
            ●
          </span>
          <span>Piani Free e Pro per adattare i limiti al tuo utilizzo</span>
        </li>
      </ul>
      <p className="mt-6 text-xs text-slate-500 dark:text-violet-300/60">
        MediaMatter — strumenti professionali per bandi e finanziamenti.
      </p>
    </div>
  );
}
