"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

const QUICK_QUESTIONS = [
  "Quali sono i requisiti di ammissibilità?",
  "Quando scade il bando?",
  "Quali documenti devo allegare?",
  "Come viene valutata la domanda?",
  "Qual è l’importo del contributo?",
  "Sintetizza i punti principali",
];

interface ChatPanelProps {
  bandoId: string;
  bandoTitle: string;
  initialMessages: Message[];
  onNewMessages: () => void;
  onLimitReached?: () => void;
}

export function ChatPanel({
  bandoId,
  initialMessages,
  onNewMessages,
  onLimitReached,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    const userMessage: Message = {
      id: "",
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bandoId, message: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => prev.slice(0, -1));
        setInput(text);
        if (res.status === 403) onLimitReached?.();
        const detail =
          data.used != null && data.limit != null
            ? ` (usati: ${data.used}/${data.limit})`
            : "";
        alert((data.error ?? "Errore invio messaggio") + detail);
        return;
      }
      onNewMessages();
      setMessages((prev) => [
        ...prev,
        {
          id: "",
          role: "assistant",
          content: data.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const copyChatToClipboard = async () => {
    const text = messages
      .map((m) => `${m.role === "user" ? "Tu" : "Assistant"}: ${m.content}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      alert("Chat copiata negli appunti.");
    } catch {
      alert("Impossibile copiare.");
    }
  };

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-medium text-foreground">Chat</span>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={copyChatToClipboard}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Copia chat"
          >
            <Copy className="h-3.5 w-3.5" /> Copia chat
          </button>
        )}
      </div>
      <div className="max-h-[60vh] min-h-[320px] overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Scrivi un messaggio o scegli una domanda veloce. La chat è
              persistente e usa i documenti e le analisi già caricati.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  disabled={sending}
                  className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground hover:bg-muted disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li
                key={m.id || m.createdAt + m.role}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.role === "user" ? (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  ) : (
                    <div className="chat-markdown prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:my-1 prose-p:text-foreground prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:text-foreground prose-em:text-foreground prose-a:text-primary prose-a:underline prose-table:text-xs prose-th:bg-muted/50 prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1 prose-th:border prose-td:border">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </li>
            ))}
            {sending && (
              <li className="flex justify-start">
                <div
                  className="flex max-w-[85%] items-center gap-3 rounded-lg bg-muted px-4 py-3 text-sm text-foreground"
                  role="status"
                  aria-live="polite"
                  aria-label="Risposta in elaborazione"
                >
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
                  <span className="animate-pulse">Risposta in elaborazione…</span>
                  <span className="flex gap-1" aria-hidden>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" />
                  </span>
                </div>
              </li>
            )}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-border p-3">
        {messages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                disabled={sending}
                className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                {q.length > 28 ? `${q.slice(0, 28)}…` : q}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            placeholder="Scrivi un messaggio..."
            className="min-h-[44px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={sending || !input.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {sending ? "..." : "Invia"}
          </button>
        </div>
      </div>
    </div>
  );
}
