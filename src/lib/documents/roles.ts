/** Documenti del bando (testo del bando, allegati, disciplinari). */
export const BANDO_SOURCE_TYPES = ["file", "url", "paste"] as const;

/** Visura, statuto, bilancio, CV e altri atti del soggetto. */
export const CONTEXT_SOURCE_TYPE = "context" as const;

export type DocumentSourceType = (typeof BANDO_SOURCE_TYPES)[number] | typeof CONTEXT_SOURCE_TYPE;

export function isContextDocument(sourceType: string): boolean {
  return sourceType === CONTEXT_SOURCE_TYPE;
}

export function partitionDocuments<T extends { sourceType: string }>(docs: T[]): {
  bando: T[];
  context: T[];
} {
  const bando: T[] = [];
  const context: T[] = [];
  for (const doc of docs) {
    if (isContextDocument(doc.sourceType)) context.push(doc);
    else bando.push(doc);
  }
  return { bando, context };
}
