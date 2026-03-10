import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UsageBadge } from "@/components/ui/UsageBadge";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Footer } from "@/components/layout/Footer";

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background px-3 py-2 sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <Link href="/dashboard" className="flex items-center gap-3 text-xl font-semibold text-foreground">
            <img
              src="https://giorgiolovecchio.com/wp-content/uploads/elementor/thumbs/Logo_MediaMatter_300x150-rfany5j6vb0rsiwht0gezcsi5tz8l3md77iqrr52k0.png"
              alt="MediaMatter"
              className="h-9 w-auto object-contain invert dark:invert-0"
            />
            <span className="hidden sm:inline">Bandi AI Assistant</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
            <Link
              href="/dashboard"
              className="rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Bandi
            </Link>
            <Link
              href="/dashboard/pricing"
              className="rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Abbonamento
            </Link>
            <UsageBadge />
            <FeedbackButton />
            <ThemeToggle />
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4">{children}</main>
      <Footer />
    </div>
  );
}
