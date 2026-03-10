import * as cheerio from "cheerio";
import type { ParsedDocument } from "@/types";

export async function parseUrl(url: string): Promise<ParsedDocument> {
  const res = await fetch(url, {
    headers: { "User-Agent": "BandiAIAssistant/1.0" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, nav, footer, aside").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return {
    text: text.slice(0, 500000),
    sourceUrl: url,
    mimeType: "text/html",
  };
}
