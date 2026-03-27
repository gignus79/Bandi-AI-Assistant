/**
 * Fetch HTML/PDF from public URLs with browser-like headers.
 * Reduces failures against sites that filter non-browser user agents.
 */

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  "Upgrade-Insecure-Requests": "1",
};

const PDF_HEADERS: Record<string, string> = {
  ...BROWSER_HEADERS,
  Accept: "application/pdf,*/*;q=0.8",
};

export type FetchExternalResult = {
  ok: boolean;
  status: number;
  statusText: string;
  finalUrl: string;
  contentType: string;
  buffer: Buffer;
};

function timeoutMs(): number {
  const n = Number(process.env.URL_FETCH_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 120_000) : 45_000;
}

export async function fetchExternal(
  url: string,
  opts?: { kind?: "html" | "pdf"; referer?: string }
): Promise<FetchExternalResult> {
  const kind = opts?.kind ?? "html";
  const headers: Record<string, string> = {
    ...(kind === "pdf" ? PDF_HEADERS : BROWSER_HEADERS),
  };
  if (opts?.referer) {
    headers.Referer = opts.referer;
  } else {
    try {
      const u = new URL(url);
      headers.Referer = `${u.origin}/`;
    } catch {
      /* ignore */
    }
  }

  const signal = AbortSignal.timeout(timeoutMs());
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers,
      redirect: "follow",
      signal,
      cache: "no-store",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Impossibile scaricare l’URL (${msg}). Verifica che il link sia pubblico e riprova, oppure scarica il PDF manualmente.`
    );
  }

  const ab = await res.arrayBuffer();
  const buffer = Buffer.from(ab);
  const finalUrl = res.url || url;
  const contentType = res.headers.get("content-type") ?? "";

  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    finalUrl,
    contentType,
    buffer,
  };
}
