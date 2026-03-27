type AiDisclaimerProps = {
  className?: string;
  /** Più compatto per footer o box stretti */
  compact?: boolean;
};

export function AiDisclaimer({ className = "", compact = false }: AiDisclaimerProps) {
  if (compact) {
    return (
      <p
        className={`text-[11px] leading-snug text-slate-500 dark:text-violet-300/65 ${className}`}
      >
        L&apos;output è generato da modelli AI e può contenere imprecisioni o omissioni: verifica sempre sui documenti
        ufficiali e sulle fonti istituzionali prima di presentare domande o prendere decisioni.
      </p>
    );
  }
  return (
    <div
      className={`rounded-xl border border-amber-500/35 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/25 dark:bg-amber-950/30 dark:text-amber-100/95 ${className}`}
      role="note"
    >
      <p className="font-medium text-amber-900 dark:text-amber-100">Disclaimer — uso dell&apos;intelligenza artificiale</p>
      <p className="mt-2 leading-relaxed text-amber-900/95 dark:text-amber-50/90">
        Le analisi e le risposte in chat sono assistenza e non sostituiscono consulenza legale, fiscale o amministrativa.
        I contenuti possono essere incompleti o errati: controlla sempre bandi, allegati e comunicazioni degli enti
        erogatori. MediaMatter non è responsabile per decisioni basate esclusivamente sull&apos;output automatico.
      </p>
    </div>
  );
}
