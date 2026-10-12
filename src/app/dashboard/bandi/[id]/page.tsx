"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Download, Loader2, Calendar, Copy, Check, Scale, MessagesSquare, IdCard, ScrollText, Pencil, PenLine, BarChart3 } from "lucide-react";
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
import { isBandoDocument, isContextDocument, isFormDocument } from "@/lib/documents/roles";
import { MATCH_ANALYSIS_TITLE, parseMatchVerdict } from "@/lib/llm/match-prompt";
import { FILL_ANALYSIS_TITLE } from "@/lib/llm/fill-prompt";
import { INSIGHTS_TITLE, parseInsightCharts } from "@/lib/llm/insights-prompt";
import { InsightCharts } from "@/components/analysis/InsightCharts";
import { notifyIfConsentRequired } from "@/lib/consent-client";

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
  const [formText, setFormText] = useState("");
  const [filling, setFilling] = useState(false);
  const [charting, setCharting] = useState(false);
  const [matching, setMatching] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
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
    sourceType?: "file" | "url" | "paste" | "context" | "form",
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
      if (notifyIfConsentRequired(result)) return;
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
    const bandoDocs = data.documents.filter((doc) => isBandoDocument(doc.sourceType));
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

  const handleFormParsed = (text: string, fileName?: string) => {
    void handleParsed(text, fileName ?? "Modulo", "form");
  };

  const runFill = async (documentId: string) => {
    setFilling(true);
    try {
      const res = await fetch("/api/fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bandoId: id, documentId, verbosity: responseVerbosity }),
      });
      const result = await res.json();
      if (notifyIfConsentRequired(result)) return;
      if (result.error && res.status === 403) {
        setShowUpgradeModal(true);
        setUpgradeMessage(
          result.limit != null
            ? `Hai raggiunto il limite di ${result.limit} analisi questo mese. Passa a un piano superiore per continuare.`
            : undefined
        );
        alert(result.error);
        return;
      }
      if (!res.ok) {
        alert(result.error ?? "Errore nella compilazione del modulo");
        return;
      }
      if (result.warning) alert(result.warning);
      if (result.id) {
        setSelectedAnalysisId(result.id);
        setActiveTab("analyses");
        fetchBando();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore di rete durante la compilazione.");
    } finally {
      setFilling(false);
    }
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
      if (notifyIfConsentRequired(result)) return;
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

  const runInsights = async () => {
    setCharting(true);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bandoId: id, verbosity: responseVerbosity }),
      });
      const result = await res.json();
      if (notifyIfConsentRequired(result)) return;
      if (result.error && res.status === 403) {
        setShowUpgradeModal(true);
        setUpgradeMessage(
          result.limit != null
            ? `Hai raggiunto il limite di ${result.limit} analisi questo mese. Passa a un piano superiore per continuare.`
            : undefined
        );
        alert(result.error);
        return;
      }
      if (!res.ok) {
        alert(result.error ?? "Errore nella generazione dei grafici");
        return;
      }
      if (result.warning) alert(result.warning);
      if (result.id) {
        setSelectedAnalysisId(result.id);
        setActiveTab("analyses");
        fetchBando();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Errore di rete durante i grafici.");
    } finally {
      setCharting(false);
    }
  };

  const saveTitle = async () => {
    const next = titleDraft.trim();
    if (!next) return;
    setSavingTitle(true);
    try {
      const res = await fetch(`/api/bandi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(payload.error ?? "Impossibile rinominare il bando.");
        return;
      }
      setEditingTitle(false);
      fetchBando();
    } finally {
      setSavingTitle(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Caricamento del bando…</p>
      </div>
    );
  }

  const selectedAnalysis = data.analyses.find((a) => a.id === selectedAnalysisId) ?? data.analyses[0];
  const bandoDocs = data.documents.filter((doc) => isBandoDocument(doc.sourceType));
  const contextDocs = data.documents.filter((doc) => isContextDocument(doc.sourceType));
  const formDocs = data.documents.filter((doc) => isFormDocument(doc.sourceType));
  const busy = analyzing || matching || filling || charting;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {editingTitle ? (
          <form
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void saveTitle();
            }}
          >
            <input
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-lg font-semibold"
              aria-label="Nome del bando"
              autoFocus
            />
            <button
              type="submit"
              disabled={savingTitle || !titleDraft.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {savingTitle ? "Salvo…" : "Salva"}
            </button>
            <button
              type="button"
              onClick={() => setEditingTitle(false)}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              Annulla
            </button>
          </form>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="truncate text-2xl font-bold text-foreground">{data.bando.title}</h1>
            <button
              type="button"
              onClick={() => {
                setTitleDraft(data.bando.title);
                setEditingTitle(true);
              }}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Rinomina bando"
              title="Rinomina bando"
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}
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
              <span className="absolute inset-0 rounded-full bg-primary/15" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {filling
                  ? "Compilazione del modulo in corso"
                  : charting
                    ? "Suggerimenti e grafici in corso"
                    : matching
                      ? "Verifica di aderenza in corso"
                      : "Analisi in corso"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {filling
                  ? "Intercetto i dati di profilo e li inserisco nel modulo caricato…"
                  : charting
                    ? "Cerco numeri e scadenze nei documenti per disegnare i grafici…"
                    : matching
                      ? "Confronto la visura e gli altri documenti di profilo con il bando…"
                      : "L’AI sta leggendo i documenti e generando l’analisi…"}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "upload" && (
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border-2 border-violet-300 bg-violet-50 p-4 text-violet-950 shadow-sm dark:border-violet-400/50 dark:bg-violet-950/50 dark:text-violet-50">
            <h2 className="flex items-center gap-2 font-semibold">
              <SectionIcon icon={ScrollText} tone="violet" />
              Documenti del bando
            </h2>
            <p className="text-sm text-violet-900/80 dark:text-violet-100/80">
              Disciplinare, allegati e testi ufficiali. Puoi caricarne più di uno.
            </p>
            <FileDropzone onParsed={handleFileParsed} onError={(err) => alert(err)} />
            <div>
              <label className="mb-2 block text-sm font-medium">
                Oppure incolla il testo del bando
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-md border border-violet-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-violet-400/40 dark:bg-[#120c22] dark:text-foreground"
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
                className="mt-2 rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-50"
              >
                Salva documento
              </button>
            </div>
            {bandoDocs.length > 0 && (
              <div className="rounded-xl border border-violet-200 bg-white p-4 text-slate-900 dark:border-violet-400/30 dark:bg-[#100a1c] dark:text-foreground">
                <SavedDocumentsList
                  bandoId={id}
                  documents={bandoDocs}
                  hasAnalyses={data.analyses.length > 0}
                  onDocumentsChange={fetchBando}
                  title="Documenti del bando salvati"
                  bulkRole="bando"
                />
                <div className="mt-2 flex flex-col gap-3 border-t border-violet-200 pt-4 dark:border-violet-400/30 sm:flex-row sm:items-end sm:justify-between">
                  <ResponseVerbositySelect
                    value={responseVerbosity}
                    onChange={setResponseVerbosity}
                    id="analysis-verbosity"
                    className="max-w-md"
                  />
                  <button
                    type="button"
                    onClick={handleStartAnalysisForAll}
                    disabled={busy}
                    className="inline-flex shrink-0 items-center gap-2 rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        <span>Analisi in corso...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" aria-hidden />
                        Avvia analisi sui documenti del bando
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void runInsights()}
                    disabled={busy}
                    className="inline-flex shrink-0 items-center gap-2 rounded-md border border-violet-700 bg-white px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-50 disabled:opacity-50 dark:bg-transparent dark:text-violet-100"
                  >
                    {charting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Grafici in elaborazione...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-4 w-4" aria-hidden />
                        Suggerimenti e grafici
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-amber-950 shadow-sm dark:border-amber-300/60 dark:bg-amber-950/40 dark:text-amber-50">
            <h2 className="flex items-center gap-2 font-semibold">
              <SectionIcon icon={IdCard} tone="amber" />
              Profilo del soggetto
            </h2>
            <p className="text-sm text-amber-900/80 dark:text-amber-100/80">
              Allega la visura camerale e, se serve, altri documenti di contesto: statuto, bilancio, CV,
              dichiarazioni. Servono per la verifica di aderenza ai requisiti del bando.
            </p>
            <FileDropzone
              onParsed={handleContextParsed}
              onError={(err) => alert(err)}
              hint="Trascina visura, statuto, bilancio o CV (PDF, DOCX, immagini) oppure clicca. Puoi allegarne più di uno."
            />
            <div>
              <label className="mb-2 block text-sm font-medium">
                Oppure incolla un estratto (visura, statuto, note)
              </label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-amber-300/40 dark:bg-[#1a1408] dark:text-foreground"
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
                className="mt-2 rounded-md bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-50"
              >
                Salva nel profilo
              </button>
            </div>
            {contextDocs.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-white p-4 text-slate-900 dark:border-amber-300/30 dark:bg-[#1a1408] dark:text-foreground">
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
            {(bandoDocs.length === 0 || contextDocs.length === 0) && (
              <p className="rounded-lg border border-amber-500/50 bg-amber-100 px-3 py-2 text-sm text-amber-950 dark:bg-amber-900/40 dark:text-amber-50">
                {bandoDocs.length === 0 && contextDocs.length === 0
                  ? "Carica almeno un documento per avviare la verifica."
                  : "I dati sono incompleti. Puoi avviare comunque la verifica: useremo solo quello che hai caricato e segnaleremo le lacune."}
              </p>
            )}
            <button
              type="button"
              onClick={() => void runMatch()}
              disabled={busy || (bandoDocs.length === 0 && contextDocs.length === 0)}
              className="inline-flex items-center gap-2 rounded-md bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-50"
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
          </section>

          <section className="space-y-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 text-emerald-950 shadow-sm dark:border-emerald-300/50 dark:bg-emerald-950/40 dark:text-emerald-50">
            <h2 className="flex items-center gap-2 font-semibold">
              <SectionIcon icon={PenLine} tone="emerald" />
              Modulo da compilare
            </h2>
            <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80">
              Carica il modulo o il documento vuoto. Il sistema legge i campi e li compila con i dati già presenti
              nella visura, nel profilo e nel bando.
            </p>
            <FileDropzone
              onParsed={handleFormParsed}
              onError={(err) => alert(err)}
              hint="Trascina il modulo o il documento da compilare (PDF, DOCX, TXT) oppure clicca."
            />
            <div>
              <label className="mb-2 block text-sm font-medium">Oppure incolla il testo del modulo</label>
              <textarea
                className="min-h-[100px] w-full rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-emerald-300/40 dark:bg-[#07140f] dark:text-foreground"
                placeholder="Incolla qui il modulo con i campi vuoti..."
                value={formText}
                onChange={(event) => setFormText(event.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  if (formText.trim()) {
                    void handleParsed(formText.trim(), "Modulo incollato", "form");
                    setFormText("");
                  }
                }}
                disabled={!formText.trim()}
                className="mt-2 rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
              >
                Salva modulo
              </button>
            </div>
            {formDocs.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-white p-4 text-slate-900 dark:border-emerald-300/30 dark:bg-[#07140f] dark:text-foreground">
                <SavedDocumentsList
                  bandoId={id}
                  documents={formDocs}
                  hasAnalyses={false}
                  onDocumentsChange={fetchBando}
                  title="Moduli caricati"
                  description="Il documento sorgente da compilare. Passa il puntatore per l’anteprima."
                  bulkRole="form"
                />
                <div className="flex flex-col gap-2 border-t border-emerald-200 pt-3 dark:border-emerald-300/30">
                  {formDocs.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => void runFill(doc.id)}
                      disabled={busy}
                      className="inline-flex max-w-full items-center justify-center gap-2 rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
                    >
                      {filling ? (
                        <>
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                          Compilazione in corso...
                        </>
                      ) : (
                        <>
                          <PenLine className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="truncate">Compila «{doc.fileName}»</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {contextDocs.length === 0 && (
              <p className="rounded-lg border border-emerald-600/40 bg-emerald-100 px-3 py-2 text-sm text-emerald-950 dark:bg-emerald-900/40 dark:text-emerald-50">
                Senza visura o altri documenti di profilo molti campi resteranno vuoti. Puoi compilare comunque: vengono usati solo i dati già caricati.
              </p>
            )}
          </section>
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
                    ) : a.title?.startsWith(FILL_ANALYSIS_TITLE) ? (
                      <PenLine className="h-3.5 w-3.5" aria-hidden />
                    ) : a.title === INSIGHTS_TITLE ? (
                      <BarChart3 className="h-3.5 w-3.5" aria-hidden />
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
                        href={`/api/export?id=${selectedAnalysis.id}&format=docx`}
                        download
                        className="inline-flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80"
                      >
                        <Download className="h-4 w-4" /> DOCX
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
                  {parseMatchVerdict(selectedAnalysis.rawContent ?? "") === "insufficiente" && (
                      <div className="mb-4 rounded-xl border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-300/50 dark:bg-amber-950/40 dark:text-amber-50">
                        <p className="font-semibold">I dati non bastano per un giudizio completo di ammissibilità.</p>
                        <p className="mt-1 leading-relaxed">
                          Carica gli atti che mancano (bando integrale, visura camerale, statuto o bilancio) e rilancia la verifica di aderenza: il nuovo risultato aggiorna questo quadro.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab("upload")}
                            className="rounded-md bg-amber-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-900"
                          >
                            Carica altri documenti
                          </button>
                          <button
                            type="button"
                            onClick={() => void runMatch()}
                            disabled={busy}
                            className="rounded-md border border-amber-700 bg-white px-3 py-1.5 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50 dark:bg-transparent dark:text-amber-50"
                          >
                            Rilancia verifica di aderenza
                          </button>
                        </div>
                      </div>
                    )}
                  {selectedAnalysis.title === INSIGHTS_TITLE && (
                    <InsightCharts charts={parseInsightCharts(selectedAnalysis.rawContent ?? "").charts} />
                  )}
                  <AnalysisResult
                    content={
                      selectedAnalysis.title === INSIGHTS_TITLE
                        ? parseInsightCharts(selectedAnalysis.rawContent ?? "").prose
                        : (selectedAnalysis.rawContent ?? selectedAnalysis.summary)
                    }
                  />
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
