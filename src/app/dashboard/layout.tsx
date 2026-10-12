import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UsageBadge } from "@/components/ui/UsageBadge";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Footer } from "@/components/layout/Footer";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { UserGreeting } from "@/components/onboarding/UserGreeting";
import { AiConsentGate } from "@/components/legal/AiConsentGate";
import { WelcomeMediaMatterLogo } from "@/components/layout/WelcomeMediaMatterLogo";

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <OnboardingGate>
    <AiConsentGate />
    <div className="relative flex min-h-screen flex-col bg-transparent">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-xl dark:border-violet-500/20 dark:bg-[#0a0612]/80 dark:shadow-[0_0_40px_-12px_rgba(139,92,246,0.15)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
          >
            <WelcomeMediaMatterLogo compact />
            <span className="truncate bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 bg-clip-text text-base font-semibold tracking-tight text-transparent sm:text-lg">
              Bandi AI Assistant
            </span>
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
            <UserGreeting />
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
    </OnboardingGate>
  );
}
