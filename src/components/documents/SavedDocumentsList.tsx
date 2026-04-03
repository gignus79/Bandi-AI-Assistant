"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { FileTypeIcon } from "@/components/ui/FileTypeIcon";

export type SavedDocRow = { id: string; fileName: string; sourceType: string; createdAt: string };

interface SavedDocumentsListProps {
  bandoId: string;
  documents: SavedDocRow[];
  hasAnalyses: boolean;
  onDocumentsChange: () => void;
}

export function SavedDocumentsList({
  bandoId,
  documents,
  hasAnalyses,
  onDocumentsChange,
}: SavedDocumentsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [preview, setPreview] = useState<{
    docId: string;
    fileName: string;
    text: string;
    truncated?: boolean;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchIdRef = useRef(0);

  const clearLeaveTimer = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  };

  const loadPreview = useCallback(async (docId: string, fileName: string) => {
    const reqId = ++fetchIdRef.current;
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}?preview=1`);
      const data = await res.json();
      if (reqId !== fetchIdRef.current) return;
      if (!res.ok) return;
      setPreview({
        docId,
        fileName,
        text: data.content ?? "",
        truncated: data.truncated,
      });
    } finally {
      if (reqId === fetchIdRef.current) setPreviewLoading(false);
    }
  }, []);

  const onHoverEnter = (docId: string, fileName: string) => {
    clearLeaveTimer();
    if (preview?.docId !== docId) void loadPreview(docId, fileName);
  };

  const onHoverLeave = () => {
    clearLeaveTimer();
    leaveTimer.current = setTimeout(() => setPreview(null), 180);
  };

  const deleteOne = async (docId: string) => {
    if (!confirm("Eliminare questo documento?")) return;
    setDeletingId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "Errore eliminazione");
        return;
      }
      onDocumentsChange();
      setPreview(null);
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAll = async () => {
    if (!confirm(`Eliminare tutti i ${documents.length} documenti salvati?`)) return;
    setBulkDeleting(true);
    try {
      const res = await fetch(`/api/documents?bandoId=${encodeURIComponent(bandoId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "Errore eliminazione");
        return;
      }
      onDocumentsChange();
      setPreview(null);
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground">Documenti salvati</h3>
        {documents.length > 0 && (
          <button
            type="button"
            onClick={() => void deleteAll()}
            disabled={bulkDeleting}
            className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
          >
            {bulkDeleting ? "Eliminazione…" : "Elimina tutti"}
          </button>
        )}
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        L&apos;analisi viene eseguita una volta su tutti i documenti. Aggiungi file o testo incollato, poi avvia
        l&apos;analisi. Passa il puntatore su un documento per un&apos;anteprima del testo estratto.
      </p>
      <ul className="mb-4 space-y-2">
        {documents.map((d) => (
          <li key={d.id} className="list-none">
            <div
              className="relative"
              onMouseEnter={() => onHoverEnter(d.id, d.fileName)}
              onMouseLeave={onHoverLeave}
            >
              <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <FileTypeIcon fileName={d.fileName} sourceType={d.sourceType} />
                  <span className="truncate text-sm text-foreground" title={d.fileName}>
                    {d.fileName}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {hasAnalyses && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                      Analizzato
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteOne(d.id);
                    }}
                    disabled={deletingId === d.id}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    title="Elimina documento"
                    aria-label={`Elimina ${d.fileName}`}
                  >
                    {deletingId === d.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>
              {preview?.docId === d.id && (
                <div
                  className="absolute left-0 top-full z-20 mt-1 max-h-56 w-[min(100%,26rem)] overflow-y-auto rounded-lg border border-violet-200/60 bg-popover p-3 text-left text-xs leading-relaxed text-popover-foreground shadow-xl dark:border-violet-500/30 dark:bg-[#12101a]"
                  onMouseEnter={clearLeaveTimer}
                >
                  {previewLoading ? (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Anteprima…
                    </span>
                  ) : (
                    <>
                      <p className="mb-1 font-medium text-violet-700 dark:text-violet-200/90">{preview.fileName}</p>
                      <p className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-200/90">
                        {preview.text || "—"}
                      </p>
                      {preview.truncated && (
                        <p className="mt-2 text-[10px] text-muted-foreground">Anteprima troncata.</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
