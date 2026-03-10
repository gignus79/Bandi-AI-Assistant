"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Download, Loader2, Calendar, Copy, Check } from "lucide-react";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { UrlInput } from "@/components/upload/UrlInput";
import { AnalysisResult } from "@/components/analysis/AnalysisResult";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { FileTypeIcon } from "@/components/ui/FileTypeIcon";
import { UpgradePromptModal } from "@/components/ui/UpgradePromptModal";

interface BandoDetail {
  bando: { id: string; title: string; description: string | null };
  documents: { id: string; fileName: string; sourceType: string; createdAt: string }[];
  analyses: {
    id: string;
    title: string | null;
    summary: string;
    rawContent: string | null;
    createdAt: string;
  }[];
  chatMessages: { id: string; role: string; content: string; createdAt: string }[];
}

export default function BandoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<BandoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [copiedAnalysisId, setCopiedAnalysisId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | undefined>();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"upload" | "analyses" | "chat">(
    tabParam === "analyses" || tabParam === "chat" || tabParam === "upload" ? tabParam : "upload"
  );

  const fetchBando = () => {
    fetch(`/api/bandi/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.bando) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchBando();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "analyses" || t === "chat" || t === "upload") setActiveTab(t);
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return;
        const limit = d.limit as number | null;
        const used = d.used as number;
        const msgLimit = d.messagesLimit as number | null;
        const msgUsed = (d.messagesUsed as number) ?? 0;
        const atAnalysisLimit = limit != null && !d.canRunAnalysis;
        const nearAnalysisLimit = limit != null && limit > 0 && used >= limit - 1;
        const atMessageLimit = msgLimit != null && !d.canSendMessage;
        const nearMessageLimit = msgLimit != null && msgLimit > 0 && msgUsed >= msgLimit - 1;
        if (atAnalysisLimit || atMessageLimit || nearAnalysisLimit || nearMessageLimit) {
          setShowUpgradeModal(true);
          if (atAnalysisLimit && limit != null)
            setUpgradeMessage(`Hai raggiunto il limite di ${limit} analisi questo mese. Passa a un piano superiore per continuare.`);
          else if (atMessageLimit && msgLimit != null)
            setUpgradeMessage(`Hai raggiunto il limite di ${msgLimit} messaggi. Passa a un piano superiore per continuare a chattare.`);
          else if (nearAnalysisLimit && limit != null)
            setUpgradeMessage(`Ti resta 1 analisi questo mese (${used}/${limit}). Passa a un piano superiore per non restare senza.`);
          else if (nearMessageLimit && msgLimit != null)
            setUpgradeMessage(`Ti restano pochi messaggi (${msgUsed}/${msgLimit}). Passa a un piano superiore per continuare senza interruzioni.`);
        }
      })
      .catch(() => {});
  }, []);

  const handleParsed = async (text: string, fileName?: string, sourceType?: "file" | "url" | "paste") => {
    await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bandoId: id,
        fileName: fileName ?? "Testo incollato",
        content: text,
        sourceType: sourceType ?? "paste",
      }),
    });
    fetchBando();
  };

  const runAnalysis = async (content: string, docTitle?: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bandoId: id,
          content,
          title: docTitle,
        }),
      });
      const result = await res.json();
      if (result.error && res.status === 403) {
        setShowUpgradeModal(true);
        setUpgradeMessage(
          result.limit != null
            ? `Hai raggiunto il limite di ${result.limit} analisi questo mese. Passa a un piano superiore per continuare.`
            : undefined
        );
        alert(result.error + (result.used != null ? ` (usate: ${result.used}/${result.limit})` : ""));
        return;
      }
      if (result.id) {
        setSelectedAnalysisId(result.id);
        setActiveTab("analyses");
        fetchBando();
      } else {
        alert(result.error ?? "Errore analisi");
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartAnalysisForAll = async () => {
    if (!data || data.documents.length === 0) {
      alert("Carica almeno un documento prima di avviare l’analisi.");
      return;
    }
    setAnalyzing(true);
    try {
      const parts: string[] = [];
      for (const doc of data.documents) {
        const res = await fetch(`/api/documents/${doc.id}`);
        if (!res.ok) continue;
        const d = await res.json();
        parts.push(`--- Documento: ${d.fileName} ---\n\n${d.content}`);
      }
      const combined = parts.join("\n\n");
      if (!combined.trim()) {
        alert("Impossibile leggere i documenti.");
        return;
      }
      await runAnalysis(combined, "Analisi complessiva");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Errore durante il caricamento dei documenti.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileOrUrlContent = (text: string, fileName?: string, isUrl?: boolean) => {
    handleParsed(text, fileName ?? (isUrl ? "URL" : "Documento"), isUrl ? "url" : "file");
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="animate-pulse text-sm text-muted-foreground">Caricamento...</p>
      </div>
    );
  }

  const selectedAnalysis = data.analyses.find((a) => a.id === selectedAnalysisId) ?? data.analyses[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{data.bando.title}</h1>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(["upload", "analyses", "chat"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "upload" && "Carica documenti"}
            {tab === "analyses" && `Analisi (${data.analyses.length})`}
            {tab === "chat" && "Chat"}
          </button>
        ))}
      </div>

      {analyzing && (
        <div
          className="rounded-xl border border-primary/30 bg-primary/5 p-6 shadow-sm animate-in fade-in duration-200"
          role="status"
          aria-live="polite"
          aria-label="Analisi in corso"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 opacity-60" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">Analisi in corso</p>
              <p className="mt-1 animate-pulse text-sm text-muted-foreground">
                L’AI sta leggendo i documenti e generando l’analisi…
              </p>
            </div>
            <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div className="h-full min-w-[30%] animate-pulse rounded-full bg-primary" style={{ width: "40%" }} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "upload" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <FileText className="h-4 w-4" /> Carica file o incolla testo
            </h2>
            <FileDropzone
              onParsed={(text, fileName) => handleFileOrUrlContent(text, fileName, false)}
              onError={(err) => alert(err)}
            />
            <div>
              {/* Hint URL in UrlInput */}
              <p className="sr-only">
                Inserisci un URL: la pagina verrà scrapata e il contenuto aggiunto ai documenti per l’analisi.
              </p>
              <UrlInput
                onParsed={(text, fileName) => handleFileOrUrlContent(text, fileName ?? "URL", true)}
                onError={(err) => alert(err)}
              />
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Oppure incolla il testo del bando
              </label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px]"
                placeholder="Incolla qui il contenuto..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  if (pastedText.trim()) {
                    handleParsed(pastedText.trim(), "Testo incollato", "paste");
                    setPastedText("");
                  }
                }}
                disabled={!pastedText.trim()}
                className="mt-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
              >
                Salva documento
              </button>
            </div>
          </div>
          {data.documents.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 font-semibold text-foreground">Documenti salvati</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                L’analisi viene eseguita una volta su tutti i documenti. Aggiungi file e/o URL, poi clicca &quot;Avvia analisi&quot;.
              </p>
              <ul className="mb-4 space-y-2">
                {data.documents.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileTypeIcon fileName={d.fileName} sourceType={d.sourceType} />
                      <span className="truncate text-sm text-foreground">{d.fileName}</span>
                    </div>
                    {data.analyses.length > 0 && (
                      <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                        Analizzato
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleStartAnalysisForAll}
                disabled={analyzing}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    <span className="animate-pulse">Analisi in corso...</span>
                  </>
                ) : (
                  "Avvia analisi su tutti i documenti"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "analyses" && (
        <div className="space-y-4">
          {data.analyses.length === 0 ? (
            <p className="text-muted-foreground">
              Nessuna analisi ancora. Carica un documento e avvia l’analisi dalla scheda &quot;Carica documenti&quot;.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {data.analyses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAnalysisId(a.id)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      selectedAnalysisId === a.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {a.title ?? new Date(a.createdAt).toLocaleDateString("it-IT")}
                  </button>
                ))}
              </div>
              {selectedAnalysis && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <h3 className="font-semibold text-foreground">
                      {selectedAnalysis.title ?? "Analisi"} –{" "}
                      {new Date(selectedAnalysis.createdAt).toLocaleDateString("it-IT")}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={async () => {
                          const text = selectedAnalysis.rawContent ?? selectedAnalysis.summary;
                          try {
                            await navigator.clipboard?.writeText(text);
                            setCopiedAnalysisId(selectedAnalysis.id);
                            setTimeout(() => setCopiedAnalysisId(null), 2000);
                          } catch {
                            alert("Impossibile copiare.");
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                        title={copiedAnalysisId === selectedAnalysis.id ? "Copiato!" : "Copia analisi"}
                        aria-live="polite"
                        aria-label={copiedAnalysisId === selectedAnalysis.id ? "Copiato negli appunti" : "Copia analisi negli appunti"}
                      >
                        {copiedAnalysisId === selectedAnalysis.id ? (
                          <>
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden />
                            <span>Copiato!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" aria-hidden />
                            <span>Copia analisi</span>
                          </>
                        )}
                      </button>
                      <a
                        href={`/api/export?id=${selectedAnalysis.id}&format=md`}
                        download
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80"
                      >
                        <Download className="h-4 w-4" /> Esporta (MD)
                      </a>
                      <a
                        href={`/api/export?id=${selectedAnalysis.id}&format=pdf`}
                        download
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80"
                      >
                        <Download className="h-4 w-4" /> PDF
                      </a>
                      <a
                        href={`/api/bandi/${id}/calendar`}
                        download
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80"
                        title="Scarica file .ics e aprilo per aggiungere le scadenze al tuo calendario"
                      >
                        <Calendar className="h-4 w-4" /> Aggiungi al Calendario
                      </a>
                    </div>
                  </div>
                  <AnalysisResult content={selectedAnalysis.rawContent ?? selectedAnalysis.summary} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "chat" && (
        <ChatPanel
          bandoId={id}
          bandoTitle={data.bando.title}
          initialMessages={data.chatMessages}
          onNewMessages={() => fetchBando()}
          onLimitReached={() => {
            setShowUpgradeModal(true);
            setUpgradeMessage("Hai raggiunto il limite di messaggi del tuo piano. Passa a Pro o Unlimited per continuare a chattare.");
          }}
        />
      )}

      <UpgradePromptModal
        open={showUpgradeModal}
        onOpenChange={(open) => {
          setShowUpgradeModal(open);
          if (!open) setUpgradeMessage(undefined);
        }}
        message={upgradeMessage}
      />
    </div>
  );
}
