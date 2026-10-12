import type { ProfileCard } from "@/lib/profile/extract-profile";
import { formatProfileCards } from "@/lib/profile/extract-profile";

export const FILL_ANALYSIS_TITLE = "Modulo compilato";

export interface InterceptedField {
  label: string;
  value: string;
}

export const FILL_SYSTEM_PROMPT = `Sei un compilatore di moduli per bandi e pratiche italiane. Ricevi un modulo o documento sorgente e i dati già in possesso (visura, profilo, bando).

Regole:
- Compila solo con fatti presenti nei documenti di profilo o del bando. Non inventare codici, date, importi, indirizzi o nomi.
- Se un campo del modulo non ha un dato corrispondente, scrivi [non disponibile nei documenti].
- Mantieni l'ordine e i titoli del documento sorgente. Inserisci i valori al posto di spazi vuoti, trattini bassi, "___", celle vuote o formule "da compilare".
- Se i dati non bastano, avvisa in cima e compila comunque ogni campo per cui esiste un dato.

Restituisci Markdown con questi titoli esatti:

## Avviso
Una o due frasi: dati sufficienti, oppure quali blocchi mancano. Poi prosegui.

## Campi intercettati
Tabella: Campo | Valore | Fonte | Stato
Stato: Compilato oppure Non disponibile

## Documento compilato
Il testo del modulo sorgente con i valori inseriti. Usa **grassetto** per ogni valore inserito.`;

export function fieldsFromProfileCards(cards: ProfileCard[]): InterceptedField[] {
  const labels: { key: keyof ProfileCard; label: string }[] = [
    { key: "denominazione", label: "Denominazione" },
    { key: "formaGiuridica", label: "Forma giuridica" },
    { key: "sede", label: "Sede" },
    { key: "statoAttivita", label: "Stato attività" },
    { key: "attivita", label: "Attività" },
    { key: "ateco", label: "Codice ATECO" },
    { key: "dataInizio", label: "Data inizio attività" },
    { key: "dataIscrizione", label: "Data iscrizione" },
    { key: "addetti", label: "Addetti" },
    { key: "rea", label: "Numero REA" },
    { key: "sezione", label: "Qualifica" },
    { key: "pec", label: "PEC" },
  ];
  const fields: InterceptedField[] = [];
  for (const card of cards) {
    for (const item of labels) {
      const raw = card[item.key];
      if (typeof raw === "string" && raw.trim()) {
        fields.push({ label: item.label, value: raw.trim() });
      }
    }
  }
  return fields;
}

function pack(docs: { fileName: string; content: string }[], budget: number): string {
  if (docs.length === 0) return "(nessun documento)";
  const perDoc = Math.max(2000, Math.floor(budget / docs.length));
  return docs
    .map((doc) => {
      const trimmed = doc.content.trim();
      const body = trimmed.slice(0, perDoc);
      const cut = trimmed.length > perDoc ? "\n\n[…testo troncato…]" : "";
      return `### ${doc.fileName}\n\n${body}${cut}`;
    })
    .join("\n\n");
}

export function buildFillUserPrompt(input: {
  bandoTitle: string;
  formName: string;
  formText: string;
  cards: ProfileCard[];
  contextDocs: { fileName: string; content: string }[];
  bandoDocs: { fileName: string; content: string }[];
  gaps: string[];
}): string {
  const gapNotice =
    input.gaps.length > 0
      ? `AVVISO: ${input.gaps.join(" ")} Compila comunque i campi per cui hai un dato.\n\n`
      : "";
  const known = fieldsFromProfileCards(input.cards);
  const knownBlock =
    known.length === 0
      ? "(Nessun campo strutturato intercettato in automatico: leggi i documenti di profilo.)"
      : known.map((field) => `- ${field.label}: ${field.value}`).join("\n");
  return `${gapNotice}Bando: ${input.bandoTitle}
Modulo sorgente: ${input.formName}

## Dati intercettati dal profilo
${knownBlock}

## Schede profilo
${formatProfileCards(input.cards)}

## Testi di profilo
${pack(input.contextDocs, 40_000)}

## Estratti del bando
${pack(input.bandoDocs, 30_000)}

## Testo del modulo o documento da compilare
${input.formText.trim().slice(0, 60_000) || "(modulo vuoto)"}

Compila il modulo sorgente con questi dati. Non aggiungere requisiti che non compaiono nel modulo.`;
}

export function buildFillFallback(input: {
  formName: string;
  formText: string;
  fields: InterceptedField[];
  failures: string[];
}): { summary: string; rawContent: string } {
  const rows =
    input.fields.length === 0
      ? "| — | nessun dato strutturato | — | Non disponibile |"
      : input.fields
          .map((field) => `| ${field.label} | ${field.value} | profilo | Compilato |`)
          .join("\n");
  const technical = input.failures.length > 0 ? `\n\n---\n*Dettagli: ${input.failures.join("; ")}*` : "";
  return {
    summary:
      "Compilazione automatica non completata. I dati intercettati dal profilo sono elencati e il modulo sorgente è stato conservato.",
    rawContent:
      `## Avviso\nI servizi AI non hanno risposto. Sotto trovi i dati intercettati e il testo del modulo, così puoi completarlo a mano.\n\n` +
      `## Campi intercettati\n| Campo | Valore | Fonte | Stato |\n| --- | --- | --- | --- |\n${rows}\n\n` +
      `## Documento compilato\nModulo sorgente: **${input.formName}**\n\n${input.formText.trim().slice(0, 20_000) || "(nessun testo nel modulo)"}` +
      technical,
  };
}
