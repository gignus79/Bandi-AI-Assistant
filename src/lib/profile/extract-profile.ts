export interface ProfileCard {
  sourceFile: string;
  looksLikeVisura: boolean;
  denominazione?: string;
  formaGiuridica?: string;
  sede?: string;
  codiceFiscaleMasked?: string;
  partitaIvaMasked?: string;
  ateco?: string;
  attivita?: string;
  statoAttivita?: string;
  dataInizio?: string;
  dataIscrizione?: string;
  addetti?: string;
  rea?: string;
  pec?: string;
  sezione?: string;
}

function collapse(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function capture(text: string, re: RegExp): string | undefined {
  const value = text.match(re)?.[1]?.replace(/\s+/g, " ").trim();
  return value || undefined;
}

function maskTail(value: string | undefined, visible = 4): string | undefined {
  if (!value) return undefined;
  const clean = value.replace(/\s+/g, "");
  if (clean.length <= visible) return "••••";
  return `••••${clean.slice(-visible)}`;
}

export function extractProfileCard(fileName: string, text: string): ProfileCard {
  const oneLine = collapse(text);
  const looksLikeVisura = /visura ordinaria|registro imprese|codice ateco|partita iva/i.test(oneLine);

  const codiceFiscale = capture(
    oneLine,
    /Codice fiscale(?:\s*e\s*n\.?\s*iscr\.?\s*al(?:\s*Registro Imprese)?)?\s*([A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]|\d{11})/i
  );
  const partitaIva = capture(oneLine, /Partita IVA\s*(\d{11})/i);

  const denominazione =
    capture(oneLine, /Denominazione:\s*(.+?)(?=\s*Data della comunicazione|\s*Data di iscrizione|\s*Codice fiscale|$)/i) ??
    capture(oneLine, /VISURA ORDINARIA DELL['’]IMPRESA\s+(.+?)\s+DATI ANAGRAFICI/i);

  const sede = capture(
    oneLine,
    /Indirizzo Sede\s*(.+?)(?=\s*Domicilio digitale|\s*Telefono|\s*CAP\s*\d{5}\s*Domicilio)/i
  );

  return {
    sourceFile: fileName,
    looksLikeVisura,
    denominazione,
    formaGiuridica: capture(
      oneLine,
      /Forma giuridica\s*(.+?)(?=\s*Data iscrizione|\s*Data ultimo|\s*Titolare|\s*Codice fiscale|$)/i
    ),
    sede,
    codiceFiscaleMasked: maskTail(codiceFiscale),
    partitaIvaMasked: maskTail(partitaIva),
    ateco: capture(oneLine, /Codice ATECO(?:\s*\d{4})?\s*(\d{2}\.\d{2}(?:\.\d{2})?)/i),
    attivita: capture(
      oneLine,
      /Attivit[aà] prevalente\s*(.{8,240}?)(?=\s*Codice ATECO|\s*Codice NACE|\s*Attivit[aà] import|\s*Contratto di rete)/i
    ),
    statoAttivita: capture(oneLine, /Stato attivit[aà]\s*(attiva|inattiva|cessata|sospesa)/i),
    dataInizio: capture(oneLine, /Data inizio attivit[aà]\s*(\d{2}\/\d{2}\/\d{4})/i),
    dataIscrizione: capture(oneLine, /Data iscrizione\s*(\d{2}\/\d{2}\/\d{4})/i),
    addetti: capture(oneLine, /Addetti(?:\s*al\s*\d{2}\/\d{2}\/\d{4})?\s*(\d+)/i),
    rea: capture(oneLine, /Numero REA\s*([A-Z]{2}\s*-\s*\d+)/i),
    pec: capture(oneLine, /(?:Domicilio digitale\/PEC|PEC)\s+(\S+@\S+)/i),
    sezione: capture(oneLine, /qualifica di\s+([A-Za-zÀ-ÿ\s]{3,60}?)(?=\s+\(|\s+il\s+\d|\s+sezione)/i),
  };
}

function line(label: string, value: string | undefined): string | null {
  if (!value) return null;
  return `- **${label}:** ${value}`;
}

export function formatProfileCard(card: ProfileCard): string {
  const rows = [
    line("File", card.sourceFile),
    line("Tipo", card.looksLikeVisura ? "Visura / estratto Registro Imprese" : "Documento di contesto"),
    line("Denominazione", card.denominazione),
    line("Forma giuridica", card.formaGiuridica),
    line("Sede", card.sede),
    line("Stato attività", card.statoAttivita),
    line("Attività", card.attivita),
    line("ATECO", card.ateco),
    line("Data inizio attività", card.dataInizio),
    line("Data iscrizione", card.dataIscrizione),
    line("Addetti", card.addetti),
    line("REA", card.rea),
    line("Sezione / qualifica", card.sezione),
    line("Codice fiscale (mascherato)", card.codiceFiscaleMasked),
    line("Partita IVA (mascherata)", card.partitaIvaMasked),
    line("PEC", card.pec ? "presente" : undefined),
  ].filter((row): row is string => row != null);

  return rows.join("\n");
}

export function formatProfileCards(cards: ProfileCard[]): string {
  if (cards.length === 0) return "(Nessun documento di profilo)";
  return cards.map((card, index) => `### Profilo ${index + 1}\n${formatProfileCard(card)}`).join("\n\n");
}
