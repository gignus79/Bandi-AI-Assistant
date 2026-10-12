"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Download, Loader2, Calendar, Copy, Check, Scale, MessagesSquare, IdCard, ScrollText } from "lucide-react";
import { FileDropzone } from "@/components/upload/FileDropzone";
import { SavedDocumentsList } from "@/components/documents/SavedDocumentsList";
import { AnalysisResult } from "@/components/analysis/AnalysisResult";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { UpgradePromptModal } from "@/components/ui/UpgradePromptModal";
import { AiDisclaimer } from "@/components/legal/AiDisclaimer";
import { ResponseVerbositySelect } from "@/components/settings/ResponseVerbositySelect";
import { SectionIcon } from "@/components/ui/SectionIcon";
import { MatchVerdictBadge } from "@/components/profile/MatchVerdictBadge";
import { readVerbosityFromStorage, type ResponseVerbosity } from "@/lib/llm/verbosity";
import { isContextDocument } from "@/lib/documents/roles";
import { MATCH_ANALYSIS_TITLE, parseMatchVerdict } from "@/lib/llm/match-prompt";

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
  const [contextText, setContextText] = useState("");
  const [matching, setMatching] = useState(false);
  const [copiedAnalysisId, setCopiedAnalysisId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | undefined>();
  const [responseVerbosity, setResponseVerbosity] = useState<ResponseVerbosity>("balanced");
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
    setResponseVerbosity(readVerbosityFromStorage());
  }, []);

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

  const handleParsed = async (
    text: string,
    fileName?: string,
    sourceType?: "file" | "url" | "paste" | "context",
    sourceUrl?: string | null
  ) => {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bandoId: id,
        fileName: fileName ?? "Testo incollato",
        content: text,
        sourceType: sourceType ?? "paste",
        ...(sourceUrl ? { sourceUrl } : {}),
      }),
    });
    const saved = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(saved.error ?? "Impossibile salvare il documento. Riprova.");
      return;
    }
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
          verbosity: responseVerbosity,
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
        if (result.warning) {
          alert(result.warning);
        }
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
      alert("Carica almeno un documento del bando prima di avviare l’analisi.");
      return;
    }
    const bandoDocs = data.documents.filter((doc) => !isContextDocument(doc.sourceType));
    if (bandoDocs.length === 0) {
      alert("Carica almeno un documento del bando. La visura si usa nella verifica di aderenza.");
      return;
    }
    setAnalyzing(true);
    try {
      const parts: string[] = [];
      for (const doc of bandoDocs) {
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

  const handleFileParsed = (text: string, fileName?: string) => {
    void handleParsed(text, fileName ?? "Documento", "file");
  };

  const handleContextParsed = (text: string, fileName?: string) => {
    void handleParsed(text, fileName ?? "Documento di profilo", "context");
  };

  const runMatch = async () => {
    setMatching(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bandoId: id, verbosity: responseVerbosity }),
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
      if (!res.ok) {
        alert(result.error ?? "Errore nella verifica di aderenza");
        return;
      }
      if (result.warning) alert(result.warning);
      if (result.id) {
        setSelectedAnalysisId(result.id);
        setActiveTab("analyses");
        fetchBando();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore di rete durante la verifica.");
    } finally {
      setMatching(false);
    }
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
  const bandoDocs = data.documents.filter((doc) => !isContextDocument(doc.sourceType));
  const contextDocs = data.documents.filter((doc) => isContextDocument(doc.sourceType));
  const busy = analyzing || matching;

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
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "upload" && (
              <>
                <ScrollText className="h-4 w-4" aria-hidden />
                Documenti
              </>
            )}
            {tab === "analyses" && (
              <>
                <Scale className="h-4 w-4" aria-hidden />
                Analisi ({data.analyses.length})
              </>
            )}
            {tab === "chat" && (
              <>
                <MessagesSquare className="h-4 w-4" aria-hidden />
                Chat
              </>
            )}
          </button>
        ))}
      </div>

      <AiDisclaimer compact className="max-w-3xl" />

      {busy && (
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
              <p className="font-medium text-foreground">
                {matching ? "Verifica di aderenza in corso" : "Analisi in corso"}
              </p>
              <p className="mt-1 animate-pulse text-sm text-muted-foreground">
                {matching
                  ? "Confronto la visura e gli altri documenti di profilo con il bando…"
                  : "L’AI sta leggendo i documenti e generando l’analisi…"}
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
            <h2 className="mb-1 flex items-center gap-2 font-semibold">
              <SectionIcon icon={ScrollText} tone="violet" />
              Documenti del bando
            </h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Disciplinare, allegati e testi ufficiali. Puoi caricarne più di uno.
            </p>
            <FileDropzone onParsed={handleFileParsed} onError={(err) => alert(err)} />
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
                    void handleParsed(pastedText.trim(), "Testo incollato", "paste");
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
          {bandoDocs.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <SavedDocumentsList
                bandoId={id}
                documents={bandoDocs}
                hasAnalyses={data.analyses.length > 0}
                onDocumentsChange={fetchBando}
                title="Documenti del bando salvati"
                bulkRole="bando"
              />
              <div className="mb-4 mt-2 max-w-md">
                <ResponseVerbositySelect
                  value={responseVerbosity}
                  onChange={setResponseVerbosity}
                  id="analysis-verbosity"
                />
              </div>
              <button
                type="button"
                onClick={handleStartAnalysisForAll}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    <span className="animate-pulse">Analisi in corso...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" aria-hidden />
                    Avvia analisi sui documenti del bando
                  </>
                )}
              </button>
            </div>
          )}

          <div className="rounded-lg border border-cyan-500/25 bg-card p-4">
            <h2 className="mb-1 flex items-center gap-2 font-semibold">
              <SectionIcon icon={IdCard} tone="cyan" />
              Profilo del soggetto
            </h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Allega la visura camerale e, se serve, altri documenti di contesto: statuto, bilancio, CV,
              dichiarazioni. Servono per la verifica di aderenza ai requisiti del bando.
            </p>
            <FileDropzone
              onParsed={handleContextParsed}
              onError={(err) => alert(err)}
              hint="Trascina visura, statuto, bilancio o CV (PDF, DOCX, immagini) oppure clicca. Puoi allegarne più di uno."
            />
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Oppure incolla un estratto (visura, statuto, note)
              </label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Incolla qui i dati del soggetto..."
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  if (contextText.trim()) {
                    void handleParsed(contextText.trim(), "Profilo incollato", "context");
                    setContextText("");
                  }
                }}
                disabled={!contextText.trim()}
                className="mt-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
              >
                Salva nel profilo
              </button>
            </div>
            {contextDocs.length > 0 && (
              <div className="mt-4">
                <SavedDocumentsList
                  bandoId={id}
                  documents={contextDocs}
                  hasAnalyses={false}
                  onDocumentsChange={fetchBando}
                  title="Documenti di profilo salvati"
                  description="Visura e altri atti del soggetto. Passa il puntatore per l’anteprima. L’eliminazione non tocca i documenti del bando."
                  bulkRole="context"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => void runMatch()}
              disabled={busy || bandoDocs.length === 0 || contextDocs.length === 0}
              className="mt-2 inline-flex items-center gap-2 rounded-md bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800 disabled:opacity-50 dark:bg-cyan-600 dark:hover:bg-cyan-500"
            >
              {matching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Verifica in corso...
                </>
              ) : (
                <>
                  <Scale className="h-4 w-4" aria-hidden />
                  Verifica aderenza al bando
                </>
              )}
            </button>
            {(bandoDocs.length === 0 || contextDocs.length === 0) && (
              <p className="mt-2 text-xs text-muted-foreground">
                Servono almeno un documento del bando e un documento di profilo.
              </p>
            )}
          </div>
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
                {data.analyses.map((a) => {
                  const verdict =
                    a.title === MATCH_ANALYSIS_TITLE && a.rawContent
                      ? parseMatchVerdict(a.rawContent)
                      : null;
                  return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAnalysisId(a.id)}
                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                      selectedAnalysisId === a.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {a.title === MATCH_ANALYSIS_TITLE ? (
                      <Scale className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <FileText className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {a.title ?? new Date(a.createdAt).toLocaleDateString("it-IT")}
                    {verdict && <MatchVerdictBadge verdict={verdict} />}
                  </button>
                  );
                })}
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
          responseVerbosity={responseVerbosity}
          onResponseVerbosityChange={setResponseVerbosity}
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
