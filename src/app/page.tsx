import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="relative flex flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-6">
        <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
          <ThemeToggle />
        </div>
        <img
          src="https://giorgiolovecchio.com/wp-content/uploads/elementor/thumbs/Logo_MediaMatter_300x150-rfany5j6vb0rsiwht0gezcsi5tz8l3md77iqrr52k0.png"
          alt="MediaMatter"
          className="h-12 w-auto object-contain invert dark:invert-0 sm:h-14"
        />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 sm:text-4xl">
          Bandi AI Assistant
        </h1>
        <p className="max-w-md text-center text-sm text-slate-600 dark:text-slate-400 sm:text-base">
          Carica la documentazione dei bandi (PDF, Excel, URL o testo) e ottieni
          analisi dettagliate, requisiti, scadenze e suggerimenti con intelligenza
          artificiale.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow hover:opacity-90 sm:px-6 sm:py-3 sm:text-base">
              Accedi per iniziare
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow hover:opacity-90 sm:px-6 sm:py-3 sm:text-base"
          >
            Vai alla Dashboard
          </Link>
        </SignedIn>
      </div>
      <Footer />
    </div>
  );
}
