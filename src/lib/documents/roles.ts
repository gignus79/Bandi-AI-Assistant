/** Documenti del bando (testo del bando, allegati, disciplinari). */
export const BANDO_SOURCE_TYPES = ["file", "url", "paste"] as const;

/** Visura, statuto, bilancio, CV e altri atti del soggetto. */
export const CONTEXT_SOURCE_TYPE = "context" as const;

/** Modulo o documento da compilare con i dati già caricati. */
export const FORM_SOURCE_TYPE = "form" as const;

export type DocumentSourceType =
  | (typeof BANDO_SOURCE_TYPES)[number]
  | typeof CONTEXT_SOURCE_TYPE
  | typeof FORM_SOURCE_TYPE;

export function isContextDocument(sourceType: string): boolean {
  return sourceType === CONTEXT_SOURCE_TYPE;
}

export function isFormDocument(sourceType: string): boolean {
  return sourceType === FORM_SOURCE_TYPE;
}

export function isBandoDocument(sourceType: string): boolean {
  return !isContextDocument(sourceType) && !isFormDocument(sourceType);
}

export function partitionDocuments<T extends { sourceType: string }>(docs: T[]): {
  bando: T[];
  context: T[];
  forms: T[];
} {
  const bando: T[] = [];
  const context: T[] = [];
  const forms: T[] = [];
  for (const doc of docs) {
    if (isContextDocument(doc.sourceType)) context.push(doc);
    else if (isFormDocument(doc.sourceType)) forms.push(doc);
    else bando.push(doc);
  }
  return { bando, context, forms };
}
