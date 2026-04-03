import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/layout/LegalPageLayout";

export const metadata: Metadata = {
  title: "Cancellazione dati | Bandi AI Assistant",
  description: "Diritto alla cancellazione dei dati personali — Bandi AI Assistant",
};

export default function DataDeletionPage() {
  return (
    <LegalPageLayout>
      <h1 className="text-2xl font-bold text-white">Cancellazione dei dati</h1>
      <p className="mt-2 text-sm text-violet-200/75">MediaMatter · Bandi AI Assistant</p>
      <div className="prose prose-invert prose-violet mt-6 max-w-none prose-headings:text-violet-100 prose-p:text-slate-200/90 prose-a:text-cyan-300">
        <h2 className="text-lg font-semibold">Diritto alla cancellazione (art. 17 GDPR)</h2>
        <p>
          Puoi richiedere la cancellazione dei dati personali trattati nell&apos;ambito del servizio, nei limiti
          previsti dalla legge (ad esempio quando i dati non sono più necessari rispetto alle finalità, revoca del
          consenso ove applicabile, o opposizione al trattamento fondato su legittimo interesse).
        </p>
        <h2 className="text-lg font-semibold mt-4">Come inviare una richiesta</h2>
        <p>
          Invia una richiesta dal tuo indirizzo email associato all&apos;account, specificando che desideri la
          cancellazione dei dati per Bandi AI Assistant. Il titolare del trattamento provvederà a verificare
          l&apos;identità e a rispondere nei tempi previsti dal GDPR.
        </p>
        <h2 className="text-lg font-semibold mt-4">Limitazioni</h2>
        <p>
          Alcuni dati possono essere conservati se la legge impone obblighi di conservazione (es. documentazione
          fiscale o contabile). I dati gestiti da fornitori terzi (es. autenticazione, pagamenti) sono regolati dalle
          rispettive informative e dai termini di servizio.
        </p>
      </div>
    </LegalPageLayout>
  );
}
