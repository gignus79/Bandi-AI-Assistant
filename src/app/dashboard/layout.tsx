import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UsageBadge } from "@/components/ui/UsageBadge";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Footer } from "@/components/layout/Footer";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { UserGreeting } from "@/components/onboarding/UserGreeting";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { BetaBadge } from "@/components/ui/BetaBadge";

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <OnboardingGate>
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Image
          src="/landing-hero-bg.png"
          alt=""
          fill
          className="object-cover opacity-[0.14] blur-md"
          sizes="100vw"
          priority={false}
        />
        <div className="absolute inset-0 bg-background/90 backdrop-blur-[1px] dark:bg-[#070212]/92" />
      </div>
      <header className="sticky top-0 z-10 border-b border-white/10 bg-background/75 px-3 py-2 shadow-[0_0_40px_-12px_rgba(139,92,246,0.15)] backdrop-blur-xl dark:border-violet-500/20 dark:bg-[#0a0612]/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <Link
            href="/dashboard"
            className="flex flex-wrap items-center gap-2 text-xl font-semibold text-foreground sm:gap-3"
          >
            <BrandLogo heightClass="h-9" />
            <span className="hidden sm:inline">Bandi AI Assistant</span>
            <BetaBadge />
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
