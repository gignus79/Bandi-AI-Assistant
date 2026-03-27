import * as cheerio from "cheerio";

const SKIP_SCHEMES = /^(mailto:|tel:|javascript:|#)/i;

export function resolveHref(href: string, base: URL): string | null {
  const t = href.trim();
  if (!t || SKIP_SCHEMES.test(t)) return null;
  try {
    const u = new URL(t, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.hash = "";
    return u.href;
  } catch {
    return null;
  }
}

export function sameOrigin(a: URL, b: URL): boolean {
  return a.origin === b.origin;
}

/** Stesso sito logico (es. www.fondimpresa.it ≈ fondimpresa.it) per crawl e allegati. */
export function normalizeHost(hostname: string): string {
  const lower = hostname.toLowerCase();
  return lower.startsWith("www.") ? lower.slice(4) : lower;
}

export function sameSite(a: URL, b: URL): boolean {
  return normalizeHost(a.hostname) === normalizeHost(b.hostname);
}

export function isPdfUrl(urlStr: string): boolean {
  const pathOnly = urlStr.split(/[?#]/)[0] ?? "";
  return /\.pdf$/i.test(pathOnly);
}

export function extractPdfUrls(html: string, base: URL): string[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const out: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const abs = resolveHref(href, base);
    if (!abs || !isPdfUrl(abs)) return;
    if (seen.has(abs)) return;
    seen.add(abs);
    out.push(abs);
  });

  return out;
}

/** Cattura anche PDF citati in data-attribute, testo o URL senza <a> ben formato. */
export function extractPdfUrlsFromRawHtml(html: string, base: URL): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const re =
    /\b(https?:\/\/[^\s"'<>]+\.pdf[^\s"'<>]*|\/[^\s"'<>]+\.pdf[^\s"'<>]*)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    let raw = m[1] ?? m[0];
    raw = raw.replace(/[),.;]+$/, "");
    const abs = resolveHref(raw, base);
    if (!abs || !isPdfUrl(abs)) continue;
    if (seen.has(abs)) continue;
    seen.add(abs);
    out.push(abs);
  }
  return out;
}

export function extractAllPdfUrls(html: string, base: URL): string[] {
  const a = extractPdfUrls(html, base);
  const b = extractPdfUrlsFromRawHtml(html, base);
  const seen = new Set<string>([...a]);
  const out = [...a];
  for (const u of b) {
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

/** Allegati bando non importabili automaticamente (per messaggio utente). */
export function extractManualAttachmentHints(html: string, base: URL): string[] {
  const $ = cheerio.load(html);
  const hints: string[] = [];
  const seen = new Set<string>();
  const exts = /\.(zip|docx?|xlsx?|xls)(\?|$)/i;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const abs = resolveHref(href, base);
    if (!abs) return;
    try {
      const u = new URL(abs);
      if (!sameSite(u, base)) return;
      if (!exts.test(u.pathname)) return;
      const label = u.pathname.split("/").pop() ?? abs;
      if (seen.has(abs)) return;
      seen.add(abs);
      hints.push(decodeURIComponent(label));
    } catch {
      /* skip */
    }
  });
  return hints.slice(0, 12);
}

export function extractInternalUrls(html: string, base: URL, max: number): string[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const out: string[] = [];

  $("a[href]").each((_, el) => {
    if (out.length >= max) return false;
    const href = $(el).attr("href");
    if (!href) return;
    const abs = resolveHref(href, base);
    if (!abs || isPdfUrl(abs)) return;
    try {
      const u = new URL(abs);
      if (!sameSite(u, base)) return;
      if (seen.has(u.href)) return;
      seen.add(u.href);
      out.push(u.href);
    } catch {
      /* skip */
    }
    return undefined;
  });

  return out;
}

export function htmlToPlainText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, aside, noscript, iframe").remove();
  const text = $("body").length ? $("body").text() : $.root().text();
  return text.replace(/\s+/g, " ").trim();
}
