import { partitionDocuments } from "@/lib/documents/roles";

/** Tetto complessivo del testo documenti inviato al modello in chat. */
export const CHAT_DOCUMENT_CHAR_BUDGET = 120_000;

export interface ChatSourceDocument {
  fileName: string;
  content: string;
  sourceType: string;
}

/**
 * Include ogni documento caricato. Se la somma supera il tetto, accorcia in modo
 * proporzionale senza escludere alcun file.
 */
export function packAllChatDocuments(
  docs: ChatSourceDocument[],
  budget = CHAT_DOCUMENT_CHAR_BUDGET
): string {
  const grouped = partitionDocuments(docs);
  const sections: { heading: string; items: { fileName: string; content: string }[] }[] = [
    { heading: "Documenti del bando", items: grouped.bando },
    { heading: "Documenti di profilo (visura e altri atti)", items: grouped.context },
    { heading: "Moduli e altri documenti caricati", items: grouped.forms },
  ];
  const tagged = sections.flatMap((section) =>
    section.items
      .map((item) => ({ ...item, heading: section.heading, content: item.content.trim() }))
      .filter((item) => item.content.length > 0)
  );
  if (tagged.length === 0) return "(Nessun documento caricato)";

  const allowances = allocateAllowances(
    tagged.map((item) => item.content.length),
    budget
  );
  const rendered = new Map<string, string[]>();
  tagged.forEach((item, index) => {
    const allowance = allowances[index] ?? item.content.length;
    const truncated = item.content.length > allowance;
    const body = truncated ? item.content.slice(0, allowance) : item.content;
    const note = truncated
      ? `\n\n[Documento troncato per lunghezza: inclusi ${allowance} caratteri su ${item.content.length}.]`
      : "";
    const block = `### ${item.fileName}\n\n${body}${note}`;
    const list = rendered.get(item.heading) ?? [];
    list.push(block);
    rendered.set(item.heading, list);
  });

  const inventory = tagged.map((item, index) => {
    const allowance = allowances[index] ?? item.content.length;
    const status = item.content.length > allowance ? "parziale" : "completo";
    return `- ${item.fileName} (${status})`;
  });

  const body = sections
    .filter((section) => (rendered.get(section.heading) ?? []).length > 0)
    .map((section) => `## ${section.heading}\n\n${(rendered.get(section.heading) ?? []).join("\n\n---\n\n")}`)
    .join("\n\n");

  return `Elenco di tutti i documenti caricati (${tagged.length}):\n${inventory.join("\n")}\n\n${body}`;
}

function allocateAllowances(lengths: number[], budget: number): number[] {
  const total = lengths.reduce((sum, length) => sum + length, 0);
  if (total <= budget) return lengths.slice();
  const floor = Math.min(2000, Math.floor(budget / lengths.length));
  const allowances = lengths.map((length) => Math.min(length, floor));
  let remaining = budget - allowances.reduce((sum, length) => sum + length, 0);
  const deficits = lengths.map((length, index) => Math.max(0, length - (allowances[index] ?? 0)));
  const deficitSum = deficits.reduce((sum, length) => sum + length, 0);
  if (deficitSum > 0 && remaining > 0) {
    deficits.forEach((deficit, index) => {
      if (deficit === 0) return;
      const extra = Math.min(deficit, Math.floor((remaining * deficit) / deficitSum));
      allowances[index] = (allowances[index] ?? 0) + extra;
    });
    remaining = budget - allowances.reduce((sum, length) => sum + length, 0);
    for (let index = 0; index < allowances.length && remaining > 0; index += 1) {
      const room = lengths[index]! - allowances[index]!;
      if (room <= 0) continue;
      const extra = Math.min(room, remaining);
      allowances[index] = allowances[index]! + extra;
      remaining -= extra;
    }
  }
  return allowances;
}
