/**
 * Rende il testo dell’LLM più “respirabile” in Markdown: il modello spesso manda
 * paragrafi separati solo da \n; senza righe vuote o hard break il renderer unisce tutto.
 */

/** Due spazi + a-capo = hard break in CommonMark (nuova riga visibile nello stesso blocco). */
export function addMarkdownHardLineBreaks(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  return lines
    .map((line, i) => {
      const next = lines[i + 1];
      if (next === undefined) return line;
      if (line.trim() === "" || next.trim() === "") return line;
      const nt = next.trim();
      if (/^#{1,6}\s/.test(nt)) return line;
      if (/^\d+\.\s/.test(nt)) return line;
      if (/^\*\*\d+\./.test(nt)) return line;
      if (/^[-*+]\s/.test(nt)) return line;
      if (/^>\s/.test(nt)) return line;
      return line.replace(/\s+$/, "") + "  ";
    })
    .join("\n");
}

/** Dopo punto/interpunzione, nuovo blocco "**N. ..." (spesso tutto su una riga dall’LLM). */
export function splitBoldNumberedSectionsAfterPunctuation(text: string): string {
  let t = text.replace(/\r\n/g, "\n");
  t = t.replace(/([.!?])\s+(\*\*\d+\.\s+)/g, "$1\n\n$2");
  return t;
}

/** Inserisce una riga vuota extra prima di titoli e numerazioni, così nascono paragrafi distinti. */
export function addParagraphSpacingBeforeBlocks(text: string): string {
  let t = text.replace(/\r\n/g, "\n");
  t = t.replace(/([^\n])\n(?=#{1,6}\s)/g, "$1\n\n");
  t = t.replace(/([^\n])\n(?=\d+\.\s)/g, "$1\n\n");
  t = t.replace(/([^\n])\n(?=[-*+]\s)/g, "$1\n\n");
  // Esempi: "**1. Titolo**" o "1. ..." in grassetto
  t = t.replace(/([^\n])\n(?=\*\*\d+\.)/g, "$1\n\n");
  return t;
}

/** Pipeline per messaggi assistente e analisi (chat + tab analisi). */
export function prepareAssistantMarkdownForDisplay(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n").trimEnd();
  if (!t) return t;
  t = splitBoldNumberedSectionsAfterPunctuation(t);
  t = addParagraphSpacingBeforeBlocks(t);
  t = addMarkdownHardLineBreaks(t);
  t = t.replace(/\n{4,}/g, "\n\n\n");
  return t;
}
