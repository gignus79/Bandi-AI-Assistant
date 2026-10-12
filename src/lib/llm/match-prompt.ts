import { formatProfileCards, type ProfileCard } from "@/lib/profile/extract-profile";

export const MATCH_ANALYSIS_TITLE = "Verifica aderenza";

export const MATCH_SYSTEM_PROMPT = `Sei un analista di bandi pubblici italiani. Confronta il profilo del soggetto (visura camerale e altri documenti di contesto) con la documentazione del bando.

Regole:
- Non inventare requisiti, date, importi, codici o dati anagrafici che non compaiono nei testi.
- Se un requisito non è dimostrabile con i documenti di profilo, l'esito di riga è "Non verificabile".
- Se i materiali non bastano per un giudizio di ammissibilità, l'esito generale è "Dati insufficienti": scrivi subito l'avviso e poi continua comunque l'analisi con tutti i dati presenti (scheda, confronti possibili, lacune). Non fermarti all'avviso.
- Se il bando rimanda ad altri atti non allegati, non inventare quei requisiti.
- Leggi insieme tutti i documenti di contesto.
- Questa verifica non è un parere legale e non garantisce l'ammissione.

Restituisci Markdown con questi titoli esatti:

## Esito
Una sola riga tra: Aderente | Parzialmente aderente | Non aderente | Dati insufficienti
Poi una frase che spiega il perché.

## Scheda soggetto
Solo fatti presenti nei documenti di profilo. Maschera codici fiscali e partite IVA (ultime 4 cifre).

## Requisiti confrontati
Tabella Markdown: Requisito | Evidenza nel profilo | Esito | Nota
Valori di Esito: Soddisfatto | Non soddisfatto | Non verificabile | Non applicabile

## Punti a favore

## Lacune e rischi

## Documenti ancora utili

## Nota
Ricorda che decide l'ente erogatore e che vanno riletti i testi ufficiali.`;

export type MatchVerdict = "aderente" | "parziale" | "non_aderente" | "insufficiente";

export function parseMatchVerdict(markdown: string): MatchVerdict | null {
  const section = markdown.match(/##\s*Esito\s*([\s\S]{0,500})/i)?.[1] ?? markdown.slice(0, 500);
  const line = section.toLowerCase();
  if (line.includes("dati insufficienti")) return "insufficiente";
  if (line.includes("non aderente")) return "non_aderente";
  if (line.includes("parzialmente")) return "parziale";
  if (/\baderente\b/.test(line)) return "aderente";
  return null;
}

export function verdictLabel(verdict: MatchVerdict): string {
  switch (verdict) {
    case "aderente":
      return "Aderente";
    case "parziale":
      return "Parzialmente aderente";
    case "non_aderente":
      return "Non aderente";
    case "insufficiente":
      return "Dati insufficienti";
    default: {
      const exhaustive: never = verdict;
      return exhaustive;
    }
  }
}

function packDocuments(
  docs: { fileName: string; content: string }[],
  totalBudget: number
): string {
  if (docs.length === 0) return "(nessun documento)";
  const perDoc = Math.max(2500, Math.floor(totalBudget / docs.length));
  return docs
    .map((doc) => {
      const trimmed = doc.content.trim();
      const body = trimmed.slice(0, perDoc);
      const cut = trimmed.length > perDoc ? "\n\n[…testo troncato…]" : "";
      return `### ${doc.fileName}\n\n${body}${cut}`;
    })
    .join("\n\n");
}

export function buildMatchUserPrompt(input: {
  bandoTitle: string;
  bandoDocs: { fileName: string; content: string }[];
  contextDocs: { fileName: string; content: string }[];
  cards: ProfileCard[];
  gaps?: string[];
}): string {
  const brief = formatProfileCards(input.cards);
  const gapNotice =
    input.gaps && input.gaps.length > 0
      ? `AVVISO: ${input.gaps.join(" ")} Prosegui comunque il confronto usando solo i dati disponibili.\n\n`
      : "";
  return `${gapNotice}Bando: ${input.bandoTitle}

## Schede estratte dai documenti di profilo
${brief}

## Documenti del bando
${packDocuments(input.bandoDocs, 70_000)}

## Documenti di profilo e contesto
${packDocuments(input.contextDocs, 50_000)}

Confronta il profilo con i requisiti effettivamente scritti nei documenti del bando. Se quei testi non contengono i criteri di ammissibilità, dichiaralo e prosegui il confronto con i dati presenti.`;
}

export function buildMatchFallback(profileBrief: string, failures: string[]): {
  summary: string;
  rawContent: string;
} {
  const technical = failures.length > 0 ? `\n\n---\n*Dettagli: ${failures.join("; ")}*` : "";
  return {
    summary:
      "Verifica automatica non completata: i servizi AI non hanno risposto. La scheda letta dai documenti di profilo è comunque disponibile.",
    rawContent:
      `## Esito\nDati insufficienti\n\n` +
      `Il confronto con il bando non è stato generato perché i servizi di intelligenza artificiale non hanno risposto. I documenti restano salvati: puoi riprovare tra poco.\n\n` +
      `## Scheda soggetto\n${profileBrief}\n\n` +
      `## Nota\nQuesta scheda è un estratto automatico, non una valutazione di ammissibilità.${technical}`,
  };
}
