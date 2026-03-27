import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/layout/LegalPageLayout";

export const metadata: Metadata = {
  title: "Privacy policy | Bandi AI Assistant",
  description: "Informativa sulla privacy e trattamento dati - Bandi AI Assistant",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout>
      <h1 className="text-2xl font-bold text-white">Informativa sulla privacy</h1>
      <p className="mt-2 text-sm text-violet-200/75">Ultimo aggiornamento: marzo 2025</p>
      <div className="prose prose-invert prose-violet mt-6 max-w-none prose-headings:text-violet-100 prose-p:text-slate-200/90 prose-a:text-cyan-300">
        <h2 className="text-lg font-semibold">Titolare del trattamento</h2>
        <p>
          MediaMatter – Giorgio Lovecchio. I dati sono trattati in conformità al GDPR (Reg. UE 2016/679).
        </p>
        <h2 className="text-lg font-semibold mt-4">Dati raccolti</h2>
        <p>
          Raccogliamo: identificativo utente (Clerk), email (se fornita), contenuti che carichi (documenti, analisi, messaggi di chat e feedback) per erogare il servizio. I dati di pagamento sono gestiti da Stripe e non sono conservati sui nostri server.
        </p>
        <h2 className="text-lg font-semibold mt-4">Finalità e base giuridica</h2>
        <p>
          Trattiamo i dati per erogare Bandi AI Assistant (analisi documenti, chat, abbonamenti). Base giuridica: esecuzione del contratto e, ove applicabile, consenso e legittimo interesse.
        </p>
        <h2 className="text-lg font-semibold mt-4">Conservazione</h2>
        <p>
          I dati sono conservati per la durata del rapporto e, ove richiesto dalla legge, oltre. Puoi chiedere cancellazione del tuo account e dei dati associati.
        </p>
        <h2 className="text-lg font-semibold mt-4">Diritti (GDPR)</h2>
        <p>
          Hai diritto ad accesso, rettifica, cancellazione, limitazione, portabilità e opposizione. Per esercitarli o per reclami scrivi al titolare o alla tua autorità di controllo (Garante Privacy).
        </p>
        <h2 className="text-lg font-semibold mt-4">Sicurezza</h2>
        <p>
          Adottiamo misure tecniche e organizzative adeguate per proteggere i dati (accesso autenticato, trasmissione sicura, hosting in ambito UE o con garanzie equivalenti).
        </p>
      </div>
    </LegalPageLayout>
  );
}
