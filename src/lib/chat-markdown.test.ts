import { describe, expect, it } from "vitest";
import {
  addMarkdownHardLineBreaks,
  addParagraphSpacingBeforeBlocks,
  prepareAssistantMarkdownForDisplay,
  splitBoldNumberedSectionsAfterPunctuation,
} from "./chat-markdown";

describe("splitBoldNumberedSectionsAfterPunctuation", () => {
  it("inserts paragraph break after sentence end before **N.", () => {
    const input = "Testo introduttivo. **2. Seconda sezione**";
    expect(splitBoldNumberedSectionsAfterPunctuation(input)).toBe(
      "Testo introduttivo.\n\n**2. Seconda sezione**",
    );
  });
});

describe("addParagraphSpacingBeforeBlocks", () => {
  it("inserts blank line before numbered items", () => {
    const input = "intro\n1. primo\n2. secondo";
    expect(addParagraphSpacingBeforeBlocks(input)).toBe("intro\n\n1. primo\n\n2. secondo");
  });

  it("inserts blank line before headings", () => {
    const input = "testo\n## Titolo";
    expect(addParagraphSpacingBeforeBlocks(input)).toBe("testo\n\n## Titolo");
  });

  it("inserts blank line before **N. at line start", () => {
    const input = "riga\n**2. Titolo**";
    expect(addParagraphSpacingBeforeBlocks(input)).toBe("riga\n\n**2. Titolo**");
  });
});

describe("addMarkdownHardLineBreaks", () => {
  it("appends two spaces before single newline between content lines", () => {
    const input = "riga uno\nriga due";
    expect(addMarkdownHardLineBreaks(input)).toBe("riga uno  \nriga due");
  });

  it("does not add hard break before empty line", () => {
    const input = "a\n\nb";
    expect(addMarkdownHardLineBreaks(input)).toBe("a\n\nb");
  });
});

describe("prepareAssistantMarkdownForDisplay", () => {
  it("combines spacing and hard breaks", () => {
    const s = prepareAssistantMarkdownForDisplay("a\nb\n1. x");
    expect(s).toContain("  ");
    expect(s).toContain("\n\n1.");
  });
});
