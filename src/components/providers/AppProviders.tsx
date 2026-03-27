"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { itIT } from "@clerk/localizations";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      localization={itIT}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <ThemeProvider>{children}</ThemeProvider>
    </ClerkProvider>
  );
}
