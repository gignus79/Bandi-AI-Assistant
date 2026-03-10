"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";

interface UrlInputProps {
  onParsed: (text: string, fileName?: string) => void;
  onError: (message: string) => void;
}

export function UrlInput({ onParsed, onError }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const u = url.trim();
    if (!u) return;
    setLoading(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? "Errore recupero URL");
        return;
      }
      if (data.text) {
        onParsed(data.text, data.fileName ?? `URL: ${u.slice(0, 40)}…`);
        setUrl("");
      } else {
        onError("Nessun testo estratto dalla pagina.");
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : "Errore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Incolla uno o più URL della documentazione del bando..."
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
          title="Aggiungi questo URL ai documenti"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {loading ? "..." : "Aggiungi URL"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Puoi aggiungere più URL: inserisci un indirizzo e clicca &quot;Aggiungi URL&quot; per ognuno.
      </p>
    </div>
  );
}
