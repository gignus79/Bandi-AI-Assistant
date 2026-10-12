import { describe, expect, it } from "vitest";
import { extractProfileCard, formatProfileCard } from "@/lib/profile/extract-profile";

const VISURA = `
VISURA ORDINARIA DELL'IMPRESA
ESEMPIO LAB DI MARIO ROSSI DATI ANAGRAFICI
Indirizzo Sede MILANO (MI) VIA ROMA 1 CAP 20100
Domicilio digitale/PEC esempio@pec.it
Forma giuridica società in nome collettivo
Data iscrizione 01/02/2021
Partita IVA 01234567890
Codice fiscale e n.iscr. al Registro Imprese RSSMRA80A01F205X
Numero REA MI - 999999
Stato attività attiva
Data inizio attività 01/02/2021
Attività prevalente produzione di software gestionale
Codice ATECO 62.01.00
Codice NACE 2.1 62.01
Iscritta con la qualifica di PICCOLO IMPRENDITORE (sezione speciale)
Denominazione: ESEMPIO LAB DI MARIO ROSSI
`;

describe("extractProfileCard", () => {
  it("reads a visura-like extract and masks tax ids", () => {
    const card = extractProfileCard("visura-esempio.pdf", VISURA);
    expect(card.looksLikeVisura).toBe(true);
    expect(card.denominazione).toContain("ESEMPIO LAB");
    expect(card.formaGiuridica).toMatch(/nome collettivo/i);
    expect(card.ateco).toBe("62.01.00");
    expect(card.statoAttivita).toBe("attiva");
    expect(card.sede).toMatch(/MILANO/);
    expect(card.rea).toMatch(/MI/);
    expect(card.sezione).toMatch(/PICCOLO IMPRENDITORE/i);
    expect(card.codiceFiscaleMasked).toBe("••••205X");
    expect(card.partitaIvaMasked).toBe("••••7890");
    expect(card.codiceFiscaleMasked).not.toContain("RSSMRA");
    const brief = formatProfileCard(card);
    expect(brief).toContain("62.01.00");
    expect(brief).not.toContain("RSSMRA80A01F205X");
    expect(brief).not.toContain("01234567890");
  });

  it("reads camera di commercio text when labels are glued to values", () => {
    const card = extractProfileCard(
      "visura.pdf",
      "Forma giuridicaimpresa individualeData iscrizione01/02/2021Stato attivitàattivaCodice ATECO62.20.10Attività prevalenteconsulenza informaticaCodice NACE"
    );
    expect(card.formaGiuridica).toMatch(/individuale/i);
    expect(card.ateco).toBe("62.20.10");
    expect(card.statoAttivita).toBe("attiva");
    expect(card.dataIscrizione).toBe("01/02/2021");
    expect(card.attivita).toMatch(/consulenza informatica/i);
  });
  it("keeps a generic context document without forcing visura fields", () => {
    const card = extractProfileCard("cv.txt", "Curriculum di una persona. Esperienza in teatro dal 2018.");
    expect(card.looksLikeVisura).toBe(false);
    expect(card.ateco).toBeUndefined();
    expect(formatProfileCard(card)).toContain("Documento di contesto");
  });
});
