"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

interface Bando {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [bandi, setBandi] = useState<Bando[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    fetch("/api/bandi")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBandi(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
        setBandi((prev) => [...prev, { ...data, description: data.description ?? null }]);
        setNewTitle("");
        router.push(`/dashboard/bandi/${data.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-6 text-foreground">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <img
            src="https://giorgiolovecchio.com/wp-content/uploads/elementor/thumbs/Logo_MediaMatter_300x150-rfany5j6vb0rsiwht0gezcsi5tz8l3md77iqrr52k0.png"
            alt="MediaMatter"
            className="h-14 w-auto object-contain sm:h-16"
          />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Bandi AI Assistant</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Carica la documentazione dei bandi (PDF, Excel, URL o testo), avvia l’analisi e ottieni
              sintesi, requisiti, scadenze, criteri di valutazione e suggerimenti con intelligenza artificiale.
              Crea bandi, condividi le analisi ed esporta in PDF o calendario.
            </p>
          </div>
        </div>
      </section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">I tuoi bandi</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nome nuovo bando..."
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createBando()}
          />
          <button
            type="button"
            onClick={createBando}
            disabled={creating || !newTitle.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <PlusCircle className="h-4 w-4" />
            Nuovo bando
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Caricamento...</p>
      ) : bandi.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          <p className="mb-4">Non hai ancora creato bandi.</p>
          <p className="text-sm">
            Inserisci un nome sopra e clicca &quot;Nuovo bando&quot; per iniziare.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bandi.map((b) => (
            <li key={b.id}>
              <Link
                href={`/dashboard/bandi/${b.id}`}
                className="block rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-primary/50 hover:shadow"
              >
                <h2 className="font-semibold text-foreground">{b.title}</h2>
                {b.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {b.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(b.createdAt).toLocaleDateString("it-IT")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
