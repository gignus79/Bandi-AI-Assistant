"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Sparkles } from "lucide-react";

interface UpgradePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Testo opzionale (es. "Hai raggiunto il limite di 3 analisi questo mese.") */
  message?: string;
}

export function UpgradePromptModal({
  open,
  onOpenChange,
  message = "Hai raggiunto il limite del tuo piano o ti stai avvicinando. Passa a un piano superiore per continuare senza interruzioni.",
}: UpgradePromptModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 animate-in fade-in data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg animate-in fade-in zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          aria-describedby="upgrade-modal-description"
          aria-labelledby="upgrade-modal-title"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <Dialog.Title
                  id="upgrade-modal-title"
                  className="text-lg font-semibold text-foreground"
                >
                  Passa a un piano superiore
                </Dialog.Title>
                <Dialog.Description
                  id="upgrade-modal-description"
                  className="mt-1 text-sm text-muted-foreground"
                >
                  {message}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Chiudi"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Più tardi
              </button>
            </Dialog.Close>
            <Link
              href="/dashboard/pricing"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              onClick={() => onOpenChange(false)}
            >
              Vedi piani e prezzi
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
