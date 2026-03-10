"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSent(true);
        setMessage("");
        setTimeout(() => {
          setOpen(false);
          setSent(false);
        }, 1500);
      } else {
        alert(data.error ?? "Errore invio feedback.");
      }
    } catch {
      alert("Errore di connessione.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Invia feedback"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Feedback</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-5 shadow-lg">
          <Dialog.Title className="text-lg font-semibold text-foreground">
            Invia feedback
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Suggerimenti, segnalazioni o commenti. Verranno memorizzati in modo sicuro.
          </Dialog.Description>
          {sent ? (
            <p className="mt-4 text-sm text-primary">Grazie, feedback inviato.</p>
          ) : (
            <>
              <textarea
                className="mt-4 min-h-[120px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Scrivi qui il tuo feedback..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={4}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {message.length}/2000 caratteri
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    Annulla
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={submit}
                  disabled={sending || !message.trim()}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {sending ? "Invio..." : "Invia"}
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
