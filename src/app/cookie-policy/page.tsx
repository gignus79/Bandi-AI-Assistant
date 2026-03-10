import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Cookie policy | Bandi AI Assistant",
  description: "Utilizzo dei cookie - Bandi AI Assistant",
};

export default function CookiePolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Home
        </Link>
      <h1 className="text-2xl font-bold text-foreground">Cookie policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ultimo aggiornamento: marzo 2025
      </p>
      <div className="prose prose-slate mt-6 dark:prose-invert max-w-none">
        <p>
          Bandi AI Assistant (MediaMatter – Giorgio Lovecchio) utilizza cookie e tecnologie simili per il funzionamento del sito e dell’autenticazione (Clerk).
        </p>
        <h2 className="text-lg font-semibold mt-4">Cookie tecnici</h2>
        <p>
          Necessari per l’accesso, la sessione e la sicurezza. Non richiedono consenso ai sensi della normativa applicabile.
        </p>
        <h2 className="text-lg font-semibold mt-4">Cookie di terze parti</h2>
        <p>
          Clerk (autenticazione) e Stripe (pagamenti) possono impostare cookie. Per dettagli si rimanda alle rispettive privacy policy. Puoi gestire le preferenze dal browser.
        </p>
        <h2 className="text-lg font-semibold mt-4">Come disabilitare i cookie</h2>
        <p>
          Dal browser puoi bloccare o cancellare i cookie; alcune funzionalità del sito potrebbero non essere disponibili.
        </p>
      </div>
      </div>
      <Footer />
    </div>
  );
}
