"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Folder, FolderPlus, Loader2, Pencil, PlusCircle, ScrollText, Trash2, X } from "lucide-react";

interface Bando {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  folderId: string | null;
}

interface BandoFolder {
  id: string;
  name: string;
}

const USAGE_UPDATED_EVENT = "usage-updated";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bandi, setBandi] = useState<Bando[]>([]);
  const [folders, setFolders] = useState<BandoFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [folderName, setFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const pollingDone = useRef(false);

  const reload = useCallback(() => {
    Promise.all([
      fetch("/api/bandi").then((r) => r.json()),
      fetch("/api/folders").then((r) => r.json()),
    ])
      .then(([bandoData, folderData]) => {
        if (Array.isArray(bandoData)) {
          setBandi(
            bandoData.map((bando: Bando) => ({
              ...bando,
              folderId: bando.folderId ?? null,
              description: bando.description ?? null,
            }))
          );
        }
        if (Array.isArray(folderData)) setFolders(folderData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (pollingDone.current) return;
    const success = searchParams.get("success") === "1";
    if (!success) return;

    const maxAttempts = 15;
    const intervalMs = 2000;
    let attempts = 0;

    const poll = () => {
      attempts += 1;
      fetch("/api/usage")
        .then((r) => r.json())
        .then((d) => {
          if (d.plan && d.plan !== "free") {
            pollingDone.current = true;
            window.dispatchEvent(new CustomEvent(USAGE_UPDATED_EVENT));
            router.replace("/dashboard", { scroll: false });
          } else if (attempts < maxAttempts) {
            setTimeout(poll, intervalMs);
          }
        })
        .catch(() => {
          if (attempts < maxAttempts) setTimeout(poll, intervalMs);
        });
    };

    poll();
  }, [searchParams, router]);

  useEffect(() => {
    reload();
  }, [reload]);

  const createBando = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/bandi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const data = await res.json();
      if (data.id) {
        setNewTitle("");
        router.push(`/dashboard/bandi/${data.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const createFolder = async () => {
    if (!folderName.trim()) return;
    setCreatingFolder(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folderName.trim() }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        alert(payload.error ?? "Impossibile creare la cartella.");
        return;
      }
      setFolderName("");
      reload();
    } finally {
      setCreatingFolder(false);
    }
  };

  const renameBando = async (bandoId: string) => {
    const title = draftTitle.trim();
    if (!title) return;
    const res = await fetch(`/api/bandi/${bandoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      alert(payload.error ?? "Impossibile rinominare il bando.");
      return;
    }
    setEditingId(null);
    reload();
  };

  const moveBando = async (bandoId: string, folderId: string | null) => {
    const res = await fetch(`/api/bandi/${bandoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      alert(payload.error ?? "Impossibile spostare il bando.");
      return;
    }
    reload();
  };

  const deleteBando = async (bandoId: string, title: string) => {
    if (!confirm(`Eliminare il bando “${title}” e i suoi documenti?`)) return;
    const res = await fetch(`/api/bandi/${bandoId}`, { method: "DELETE" });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      alert(payload.error ?? "Impossibile eliminare il bando.");
      return;
    }
    reload();
  };

  const onBandoDragStart = (event: React.DragEvent, bandoId: string) => {
    event.dataTransfer.setData("text/plain", bandoId);
    event.dataTransfer.effectAllowed = "move";
  };

  const onFolderDragOver = (event: React.DragEvent, target: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTarget(target);
  };

  const onFolderDrop = (event: React.DragEvent, folderId: string | null) => {
    event.preventDefault();
    const bandoId = event.dataTransfer.getData("text/plain");
    setDropTarget(null);
    if (bandoId) void moveBando(bandoId, folderId);
  };

  const deleteFolder = async (folderId: string) => {
    if (!confirm("Eliminare la cartella? I bandi restano nell’elenco, senza cartella.")) return;
    const res = await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      alert(payload.error ?? "Impossibile eliminare la cartella.");
      return;
    }
    reload();
  };

  const knownFolderIds = new Set(folders.map((folder) => folder.id));
  const ungrouped = bandi.filter((bando) => !bando.folderId || !knownFolderIds.has(bando.folderId));

  const renderCards = (items: Bando[]) => (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((bando) => (
        <li
          key={bando.id}
          draggable={editingId !== bando.id}
          onDragStart={(event) => onBandoDragStart(event, bando.id)}
          className="cursor-grab active:cursor-grabbing"
        >
          <div className="rounded-[20px] border border-slate-200 bg-white p-4 text-slate-900 shadow-sm dark:border-white/10 dark:bg-[#0c0818]/65 dark:text-foreground">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-300/50 bg-violet-500/10 text-violet-700 dark:border-violet-400/30 dark:text-violet-200">
                <ScrollText className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                {editingId === bando.id ? (
                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void renameBando(bando.id);
                    }}
                  >
                    <input
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                      aria-label="Nuovo nome del bando"
                      autoFocus
                    />
                    <button type="submit" className="text-sm font-medium text-primary">
                      Salva
                    </button>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/dashboard/bandi/${bando.id}`} className="font-semibold hover:underline">
                      {bando.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(bando.id);
                        setDraftTitle(bando.title);
                      }}
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Rinomina ${bando.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteBando(bando.id, bando.title)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Elimina ${bando.title}`}
                      title="Elimina bando"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                )}
                <label className="mt-2 block text-[11px] text-muted-foreground">
                  Cartella
                  <select
                    value={bando.folderId ?? ""}
                    onChange={(event) => void moveBando(bando.id, event.target.value || null)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground"
                  >
                    <option value="">Senza cartella</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-2 text-xs text-slate-500 dark:text-muted-foreground">
                  {new Date(bando.createdAt).toLocaleDateString("it-IT")}
                </p>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[24px] border border-slate-200 bg-white/95 p-6 text-foreground shadow-sm dark:border-white/10 dark:bg-[#0c0818]/70">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-foreground">Bandi AI Assistant</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-700 dark:text-muted-foreground">
          Carica la documentazione dei bandi e, se vuoi, la visura del soggetto per una verifica di aderenza.
          Poi avvia l’analisi: sintesi, requisiti, scadenze, criteri e suggerimenti.
          Crea bandi, raggruppali in cartelle ed esporta in PDF o calendario. Per limiti e piani vedi{" "}
          <Link href="/dashboard/pricing" className="font-medium text-violet-700 underline underline-offset-2 hover:text-violet-900 dark:text-cyan-300 dark:hover:text-cyan-200">
            Abbonamento
          </Link>
          .
        </p>
      </section>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-foreground">I tuoi bandi</h1>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome nuovo bando..."
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 dark:border-white/10 dark:bg-[#0c0818]/80 dark:text-foreground dark:placeholder:text-muted-foreground"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createBando()}
            />
            <button
              type="button"
              onClick={createBando}
              disabled={creating || !newTitle.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.45)] transition hover:brightness-110 disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PlusCircle className="h-4 w-4" />}
              Nuovo bando
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Nome nuova cartella..."
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-500 dark:border-white/10 dark:bg-[#0c0818]/80 dark:text-foreground"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void createFolder()}
          />
          <button
            type="button"
            onClick={() => void createFolder()}
            disabled={creatingFolder || !folderName.trim()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-foreground"
          >
            {creatingFolder ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FolderPlus className="h-4 w-4" aria-hidden />}
            Nuova cartella
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-violet-600" aria-hidden />
          Caricamento dei bandi…
        </div>
      ) : bandi.length === 0 && folders.length === 0 ? (
        <div className="rounded-[20px] border border-slate-200 bg-white/95 p-8 text-center text-slate-700 shadow-sm dark:border-white/10 dark:bg-[#0c0818]/60 dark:text-muted-foreground">
          <p className="mb-4">Non hai ancora creato bandi.</p>
          <p className="text-sm">
            Inserisci un nome sopra e clicca &quot;Nuovo bando&quot; per iniziare.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {folders.map((folder) => {
            const items = bandi.filter((bando) => bando.folderId === folder.id);
            return (
              <section
                key={folder.id}
                className={`space-y-3 rounded-2xl p-3 transition ${
                  dropTarget === folder.id ? "bg-amber-100/80 ring-2 ring-amber-400 dark:bg-amber-950/40" : ""
                }`}
                onDragOver={(event) => onFolderDragOver(event, folder.id)}
                onDragLeave={() => setDropTarget((current) => (current === folder.id ? null : current))}
                onDrop={(event) => onFolderDrop(event, folder.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
                    <Folder className="h-5 w-5 text-amber-700 dark:text-amber-200" aria-hidden />
                    {folder.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => void deleteFolder(folder.id)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Elimina cartella
                  </button>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Trascina qui un bando.</p>
                ) : (
                  renderCards(items)
                )}
              </section>
            );
          })}
          {folders.length > 0 && (
            <section
              className={`space-y-3 rounded-2xl p-3 transition ${
                dropTarget === "none" ? "bg-violet-100/70 ring-2 ring-violet-400 dark:bg-violet-950/40" : ""
              }`}
              onDragOver={(event) => onFolderDragOver(event, "none")}
              onDragLeave={() => setDropTarget((current) => (current === "none" ? null : current))}
              onDrop={(event) => onFolderDrop(event, null)}
            >
              <h2 className="text-lg font-semibold">Senza cartella</h2>
              {(folders.length === 0 ? bandi : ungrouped).length === 0 ? (
                <p className="text-sm text-muted-foreground">Trascina qui un bando per toglierlo dalla cartella.</p>
              ) : (
                renderCards(ungrouped)
              )}
            </section>
          )}
          {folders.length === 0 && bandi.length > 0 && (
            <section className="space-y-3">{renderCards(bandi)}</section>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center gap-3 p-4 text-muted-foreground"><span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" aria-hidden />Caricamento…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
