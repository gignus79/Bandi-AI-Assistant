"use client";

import { OnboardingWizard } from "./OnboardingWizard";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OnboardingWizard />
    </>
  );
}
