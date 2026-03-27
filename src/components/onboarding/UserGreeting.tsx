"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "bandi_onboarding_v1";

export function UserGreeting() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const j = JSON.parse(raw) as { displayName?: string; completed?: boolean };
        if (j.displayName) setName(j.displayName);
      } catch {
        /* ignore */
      }
    };
    read();
    window.addEventListener("bandi-onboarding-updated", read);
    return () => window.removeEventListener("bandi-onboarding-updated", read);
  }, []);

  if (!name) return null;
  return (
    <span className="hidden text-sm text-muted-foreground sm:inline">
      Ciao, <span className="font-medium text-foreground">{name}</span>
    </span>
  );
}
