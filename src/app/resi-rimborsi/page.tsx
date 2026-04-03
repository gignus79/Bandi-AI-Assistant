import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/layout/LegalPageLayout";

export const metadata: Metadata = {
  title: "Resi e rimborsi | Bandi AI Assistant",
  description: "Politica su resi, recesso e rimborsi abbonamenti — Bandi AI Assistant",
};

export default function RefundsPage() {
  return (
    <LegalPageLayout>
      <h1 className="text-2xl font-bold text-white">Resi e rimborsi</h1>
      <p className="mt-2 text-sm text-violet-200/75">Abbonamenti digitali · Stripe Checkout</p>
      <div className="prose prose-invert prose-violet mt-6 max-w-none prose-headings:text-violet-100 prose-p:text-slate-200/90 prose-a:text-cyan-300">
        <h2 className="text-lg font-semibold">Natura del servizio</h2>
        <p>
          Bandi AI Assistant eroga contenuti e funzionalità digitali (analisi, chat, esportazioni) subito dopo
          l&apos;attivazione dell&apos;abbonamento o del periodo di prova, ove previsto.
        </p>
        <h2 className="text-lg font-semibold mt-4">Diritto di recesso (consumatori UE)</h2>
        <p>
          Se applicabile il diritto di recesso di 14 giorni per contratti a distanza, esso può decadere una volta
          fornita la prestazione digitale prevista dal contratto e previa tua espressa richiesta e accettazione che
          l&apos;esecuzione abbia inizio prima della scadenza del periodo di recesso, con riconoscimento della
          perdita del diritto una volta completata la prestazione conformemente alla normativa applicabile.
        </p>
        <h2 className="text-lg font-semibold mt-4">Rimborsi</h2>
        <p>
          Eventuali richieste di rimborso saranno valutate caso per caso secondo i termini mostrati al momento
          dell&apos;acquisto, la legge applicabile e le policy del processore di pagamento (Stripe). Per assistenza
          sull&apos;abbonamento o sulla fatturazione, utilizza i canali indicati nella conferma d&apos;ordine o
          nell&apos;area account.
        </p>
      </div>
    </LegalPageLayout>
  );
}
