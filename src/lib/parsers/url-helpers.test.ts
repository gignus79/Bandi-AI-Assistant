import { describe, expect, it } from "vitest";
import {
  extractAllPdfUrls,
  extractInternalUrls,
  extractPdfUrls,
  htmlToPlainText,
  isPdfUrl,
  resolveHref,
  sameOrigin,
  sameSite,
} from "./url-helpers";

describe("resolveHref", () => {
  it("resolves relative paths", () => {
    const base = new URL("https://example.com/bandi/page/");
    expect(resolveHref("../doc.pdf", base)).toBe("https://example.com/bandi/doc.pdf");
    expect(resolveHref("/files/a.pdf", base)).toBe("https://example.com/files/a.pdf");
  });

  it("returns null for mailto and hash", () => {
    const base = new URL("https://example.com/");
    expect(resolveHref("mailto:a@b.it", base)).toBeNull();
    expect(resolveHref("#sec", base)).toBeNull();
  });
});

describe("isPdfUrl", () => {
  it("detects pdf extension before query string", () => {
    expect(isPdfUrl("https://x.it/a/b.pdf?v=1")).toBe(true);
    expect(isPdfUrl("https://x.it/page")).toBe(false);
  });
});

describe("extractPdfUrls", () => {
  it("collects pdf links from anchors", () => {
    const base = new URL("https://www.example.com/avviso/");
    const html = `
      <html><body>
        <a href="/files/bando.pdf">Scarica</a>
        <a href="https://other.com/x.pdf">Ext</a>
        <a href="/page">No</a>
      </body></html>
    `;
    const urls = extractPdfUrls(html, base);
    expect(urls).toContain("https://www.example.com/files/bando.pdf");
    expect(urls).toContain("https://other.com/x.pdf");
    expect(urls.length).toBe(2);
  });
});

describe("extractInternalUrls", () => {
  it("keeps same-site links and excludes third-party", () => {
    const base = new URL("https://www.example.com/");
    const html = `
      <a href="/sub/page">A</a>
      <a href="https://www.example.com/other">B</a>
      <a href="https://evil.com/x">C</a>
    `;
    const urls = extractInternalUrls(html, base, 20);
    expect(urls.some((u) => u.includes("example.com/sub/page"))).toBe(true);
    expect(urls.some((u) => u.includes("evil.com"))).toBe(false);
  });

  it("follows links across www and non-www same site", () => {
    const base = new URL("https://www.example.com/");
    const html = `<a href="https://example.com/sub/page">A</a>`;
    const urls = extractInternalUrls(html, base, 20);
    expect(urls.some((u) => u.includes("example.com/sub/page"))).toBe(true);
  });
});

describe("sameOrigin", () => {
  it("compares origins", () => {
    expect(sameOrigin(new URL("https://a.com/x"), new URL("https://a.com/y"))).toBe(true);
    expect(sameOrigin(new URL("https://a.com/x"), new URL("https://b.com/y"))).toBe(false);
  });
});

describe("sameSite", () => {
  it("treats www and bare host as same site", () => {
    expect(sameSite(new URL("https://www.fondimpresa.it/a"), new URL("https://fondimpresa.it/b"))).toBe(
      true
    );
  });
});

describe("extractAllPdfUrls", () => {
  it("finds pdf in raw html outside anchor href", () => {
    const base = new URL("https://www.fondimpresa.it/path/");
    const html = `<p>Scarica /sites/default/files/doc/avviso.pdf per info</p>`;
    const urls = extractAllPdfUrls(html, base);
    expect(urls.some((u) => u.includes("avviso.pdf"))).toBe(true);
  });
});

describe("htmlToPlainText", () => {
  it("strips scripts and collapses whitespace", () => {
    const html = "<html><body><script>bad()</script><p>Hello  world</p></body></html>";
    expect(htmlToPlainText(html)).toBe("Hello world");
  });
});
