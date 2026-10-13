import { describe, expect, it } from "vitest";
import { packAllChatDocuments } from "@/lib/llm/chat-context";

describe("chat document context", () => {
  it("includes every uploaded file, including forms", () => {
    const packed = packAllChatDocuments([
      { fileName: "bando.pdf", content: "requisiti del bando", sourceType: "file" },
      { fileName: "visura.pdf", content: "impresa individuale", sourceType: "context" },
      { fileName: "modulo.docx", content: "campo denominazione", sourceType: "form" },
    ]);
    expect(packed).toContain("bando.pdf");
    expect(packed).toContain("visura.pdf");
    expect(packed).toContain("modulo.docx");
    expect(packed).toContain("requisiti del bando");
    expect(packed).toContain("campo denominazione");
    expect(packed).toContain("(completo)");
  });

  it("keeps all files when the total text exceeds the budget", () => {
    const packed = packAllChatDocuments(
      [
        { fileName: "uno.pdf", content: "A".repeat(8000), sourceType: "file" },
        { fileName: "due.pdf", content: "B".repeat(8000), sourceType: "file" },
        { fileName: "tre.pdf", content: "C".repeat(8000), sourceType: "context" },
      ],
      6000
    );
    expect(packed).toContain("uno.pdf");
    expect(packed).toContain("due.pdf");
    expect(packed).toContain("tre.pdf");
    expect(packed).toContain("(parziale)");
    expect(packed).not.toContain("A".repeat(8000));
  });
});
