"use client";

import { useState } from "react";
import { Plus, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";

export type ParsedUrlItem = {
  text: string;
  fileName?: string;
  mimeType?: string;
  sourceUrl?: string;
};

type NoticeLevel = "success" | "warning" | "info";

interface UrlInputProps {
  onDocuments: (items: ParsedUrlItem[]) => void | Promise<void>;
  /** Errori di rete o HTTP (es. 500) */
  onError: (message: string) => void;
}

export function UrlInput({ onDocuments, onError }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{
    level: NoticeLevel;
    text: string;
  } | null>(null);

  const submit = async () => {
    const u = url.trim();
    if (!u) return;
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? "Errore recupero URL");
        setNotice({
          level: "warning",
          text:
            typeof data.error === "string"
              ? `${data.error} Puoi scaricare i PDF dal sito del bando e caricarli manualmente qui.`
              : "Impossibile elaborare l’URL. Prova a caricare i file manualmente.",
        });
        return;
      }

      const meta = data.meta as
        | {
            pagesFetched?: number;
            pdfCount?: number;
            warnings?: string[];
            notice?: string;
            noticeLevel?: NoticeLevel;
            manualAttachmentHints?: string[];
          }
        | undefined;

      const items: ParsedUrlItem[] = Array.isArray(data.items)
        ? data.items.map(
            (it: {
              text: string;
              fileName?: string;
              mimeType?: string;
              sourceUrl?: string;
            }) => ({
              text: it.text,
              fileName: it.fileName,
              mimeType: it.mimeType,
              sourceUrl: it.sourceUrl,
            })
          )
        : data.text
          ? [
              {
                text: data.text as string,
                fileName: data.fileName as string | undefined,
                mimeType: data.mimeType as string | undefined,
                sourceUrl: data.sourceUrl as string | undefined,
              },
            ]
          : [];

      const level = meta?.noticeLevel ?? (items.length > 0 ? "success" : "warning");
      const summary =
        meta?.notice ??
        (items.length > 0
          ? `Aggiunti ${items.length} documento/i al bando.`
          : "Nessun documento importato. Aggiungi PDF o testo manualmente.");

      setNotice({ level, text: summary });

      if (items.length === 0) {
        return;
      }

      await onDocuments(items);
      setUrl("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Errore";
      onError(msg);
      setNotice({
        level: "warning",
        text: `${msg}. Se il problema persiste, scarica i file dal portale del bando e caricali manualmente.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const noticeStyles: Record<NoticeLevel, string> = {
    success:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 dark:bg-emerald-950/30",
    warning:
      "border-amber-500/50 bg-amber-500/10 text-amber-950 dark:text-amber-100 dark:bg-amber-950/25",
    info: "border-sky-500/40 bg-sky-500/10 text-sky-950 dark:text-sky-100 dark:bg-sky-950/25",
  };

  const NoticeIcon = ({ level }: { level: NoticeLevel }) => {
    if (level === "success") return <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />;
    if (level === "warning") return <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />;
    return <Info className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />;
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Incolla l’URL della pagina del bando (verranno cercati anche i PDF collegati)…"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !url.trim()}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          title="Analizza URL e importa testo + PDF trovati sul sito"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {loading ? "..." : "Aggiungi URL"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        L’app visita la pagina e le sottopagine dello stesso sito (anche con e senza www) e importa i PDF trovati.
        ZIP e Word non vengono letti automaticamente: scaricali dal portale e caricali come file.
      </p>
      {notice && (
        <div
          role="status"
          className={`flex gap-2 rounded-lg border px-3 py-2.5 text-sm leading-snug ${noticeStyles[notice.level]}`}
        >
          <NoticeIcon level={notice.level} />
          <span>{notice.text}</span>
        </div>
      )}
    </div>
  );
}
