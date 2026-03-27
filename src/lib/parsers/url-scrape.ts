import type { ParsedDocument } from "@/types";
import { fetchExternal } from "@/lib/http/fetch-external";
import { parsePdf } from "@/lib/parsers/pdf";
import {
  extractAllPdfUrls,
  extractInternalUrls,
  extractManualAttachmentHints,
  htmlToPlainText,
  isPdfUrl,
  sameSite,
} from "@/lib/parsers/url-helpers";

export type ScrapedUrlItem = ParsedDocument & {
  sourceType: "url";
  kind: "html" | "pdf";
};

export type UrlScrapeResult = {
  items: ScrapedUrlItem[];
  meta: {
    pagesFetched: number;
    pdfCount: number;
    warnings: string[];
    /** Messaggio principale per l’utente (toast / banner) */
    notice: string;
    /** Livello UI suggerito */
    noticeLevel: "success" | "warning" | "info";
    /** File ZIP/DOC/XLS sullo stesso sito (non importati automaticamente) */
    manualAttachmentHints: string[];
  };
};

const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_MAX_PAGES = 24;
const DEFAULT_MAX_PDFS = 24;
const MAX_LINKS_PER_PAGE = 80;

function fileNameFromUrl(urlStr: string, fallback: string): string {
  try {
    const u = new URL(urlStr);
    const last = u.pathname.split("/").filter(Boolean).pop();
    if (last && last.length > 1) return decodeURIComponent(last.slice(0, 120));
  } catch {
    /* ignore */
  }
  return fallback;
}

async function fetchHtmlPage(url: string, referer?: string): Promise<{ html: string; finalUrl: string }> {
  const r = await fetchExternal(url, { kind: "html", referer });
  if (!r.ok) {
    throw new Error(`HTTP ${r.status}: ${r.statusText}`);
  }
  const ct = r.contentType.toLowerCase();
  if (ct.includes("application/pdf")) {
    throw new Error("Risposta PDF inattesa durante crawl HTML.");
  }
  const html = r.buffer.toString("utf-8");
  return { html, finalUrl: r.finalUrl };
}

async function fetchAndParsePdf(url: string, referer: string, warnings: string[]): Promise<ScrapedUrlItem | null> {
  try {
    const r = await fetchExternal(url, { kind: "pdf", referer });
    if (!r.ok) {
      warnings.push(`PDF non scaricabile (${r.status}): ${url.slice(0, 80)}…`);
      return null;
    }
    const parsed = await parsePdf(r.buffer);
    const name = fileNameFromUrl(r.finalUrl, "documento.pdf");
    return {
      text: parsed.text,
      fileName: name,
      mimeType: "application/pdf",
      sourceUrl: r.finalUrl,
      sourceType: "url",
      kind: "pdf",
      pageCount: parsed.pageCount,
    };
  } catch (e) {
    warnings.push(
      e instanceof Error ? e.message : `Errore PDF: ${url.slice(0, 60)}…`
    );
    return null;
  }
}

function buildMeta(
  pagesFetched: number,
  pdfCount: number,
  warnings: string[],
  items: ScrapedUrlItem[],
  manualAttachmentHints: string[]
): UrlScrapeResult["meta"] {
  const hasHtml = items.some((i) => i.kind === "html");
  const hasPdf = pdfCount > 0;
  const blocked =
    warnings.some(
      (w) =>
        /impossibile scaricare|fetch|ECONNREFUSED|blocked|403|401|TLS|certificate/i.test(w)
    ) && items.length === 0;

  let noticeLevel: UrlScrapeResult["meta"]["noticeLevel"] = "success";
  let notice = "";

  if (blocked) {
    noticeLevel = "warning";
    notice =
      "Il sito potrebbe bloccare l’accesso automatico o la rete non è raggiungibile. Aggiungi i PDF o il testo manualmente dalla stessa pagina.";
  } else if (!hasPdf && !hasHtml) {
    noticeLevel = "warning";
    notice =
      "Non è stato possibile estrarre testo o PDF da questa pagina. Prova a scaricare i file dal sito del bando e caricali qui.";
  } else if (!hasPdf && hasHtml) {
    noticeLevel = "info";
    notice = `Testo della pagina aggiunto (${pagesFetched} pagina/e visitata/e). Nessun PDF trovato nei link: se il bando offre solo ZIP o DOCX, scaricali dal sito e caricali come file.`;
  } else {
    notice = `Importati ${pdfCount} PDF e il testo della pagina principale. Controlla l’elenco documenti prima dell’analisi.`;
  }

  if (manualAttachmentHints.length > 0) {
    notice += ` Trovati anche allegati (ZIP/DOC/Excel) sul sito: ${manualAttachmentHints.slice(0, 5).join(", ")}${manualAttachmentHints.length > 5 ? "…" : ""}. Scaricali dal portale e caricabili manualmente se ti servono.`;
  }

  if (warnings.length > 0 && noticeLevel === "success") {
    noticeLevel = "warning";
    notice += ` Alcuni file non sono stati scaricati: ${warnings.slice(0, 2).join(" ")}`;
  }

  return {
    pagesFetched,
    pdfCount,
    warnings,
    notice,
    noticeLevel,
    manualAttachmentHints,
  };
}

/**
 * Scarica la pagina iniziale, segue link interni (stesso sito) fino a profondità limitata,
 * raccoglie i PDF (anche se href non è un semplice .pdf) e aggiunge il testo HTML della pagina di ingresso.
 */
export async function scrapeUrlWithPdfs(entryUrl: string): Promise<UrlScrapeResult> {
  const warnings: string[] = [];
  let start: URL;
  try {
    start = new URL(entryUrl);
  } catch {
    throw new Error("URL non valido.");
  }

  const pdfUrls = new Set<string>();
  const manualHints = new Set<string>();
  const visitedHtml = new Set<string>();
  const queue: { url: string; depth: number }[] = [{ url: start.href, depth: 0 }];

  let pagesFetched = 0;
  const firstHtmlTexts: ScrapedUrlItem[] = [];

  const maxDepth =
    parseInt(process.env.URL_SCRAPE_MAX_DEPTH ?? "", 10) || DEFAULT_MAX_DEPTH;
  const maxPages =
    parseInt(process.env.URL_SCRAPE_MAX_PAGES ?? "", 10) || DEFAULT_MAX_PAGES;
  const maxPdfs =
    parseInt(process.env.URL_SCRAPE_MAX_PDFS ?? "", 10) || DEFAULT_MAX_PDFS;

  if (isPdfUrl(start.href)) {
    const pdfItem = await fetchAndParsePdf(start.href, start.origin, warnings);
    const items = pdfItem ? [pdfItem] : [];
    return {
      items,
      meta: buildMeta(0, pdfItem ? 1 : 0, warnings, items, []),
    };
  }

  while (queue.length > 0 && pagesFetched < maxPages) {
    const next = queue.shift();
    if (!next) break;
    const { url: pageUrl, depth } = next;
    if (visitedHtml.has(pageUrl)) continue;
    visitedHtml.add(pageUrl);

    let html: string;
    let finalUrl: string;
    try {
      const got = await fetchHtmlPage(pageUrl, start.origin);
      html = got.html;
      finalUrl = got.finalUrl;
    } catch (e) {
      if (pagesFetched === 0) {
        throw e instanceof Error
          ? e
          : new Error("Impossibile scaricare la pagina iniziale.");
      }
      warnings.push(
        e instanceof Error ? e.message : `Pagina saltata: ${pageUrl.slice(0, 80)}`
      );
      continue;
    }

    pagesFetched += 1;
    const base = new URL(finalUrl);

    for (const h of extractManualAttachmentHints(html, base)) {
      manualHints.add(h);
    }

    for (const p of extractAllPdfUrls(html, base)) {
      pdfUrls.add(p);
      if (pdfUrls.size >= maxPdfs) break;
    }

    if (pagesFetched === 1) {
      const text = htmlToPlainText(html).slice(0, 500_000);
      if (text.length > 0) {
        firstHtmlTexts.push({
          text,
          fileName: `Pagina web: ${base.hostname}`,
          mimeType: "text/html",
          sourceUrl: finalUrl,
          sourceType: "url",
          kind: "html",
        });
      }
    }

    if (depth + 1 <= maxDepth && pdfUrls.size < maxPdfs) {
      const internal = extractInternalUrls(html, base, MAX_LINKS_PER_PAGE);
      for (const u of internal) {
        if (visitedHtml.has(u)) continue;
        try {
          const nextUrl = new URL(u);
          if (!sameSite(nextUrl, start)) continue;
        } catch {
          continue;
        }
        queue.push({ url: u, depth: depth + 1 });
      }
    }
  }

  const items: ScrapedUrlItem[] = [...firstHtmlTexts];

  let pdfCount = 0;
  for (const pdfUrl of pdfUrls) {
    if (pdfCount >= maxPdfs) break;
    const doc = await fetchAndParsePdf(pdfUrl, start.href, warnings);
    if (doc) {
      items.push(doc);
      pdfCount += 1;
    }
  }

  return {
    items,
    meta: buildMeta(
      pagesFetched,
      pdfCount,
      warnings,
      items,
      [...manualHints]
    ),
  };
}
