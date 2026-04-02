"use client";

import { useUser } from "@clerk/nextjs";

function displayLabel(user: {
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
}): string | null {
  const full = user.fullName?.trim();
  if (full) return full;
  const fromParts = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (fromParts) return fromParts;
  const email = user.primaryEmailAddress?.emailAddress?.trim();
  if (email) return email;
  const un = user.username?.trim();
  return un || null;
}

export function UserGreeting() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <span className="hidden max-w-[14rem] truncate text-sm text-muted-foreground sm:inline" aria-hidden>
        ···
      </span>
    );
  }

  if (!user) return null;

  const label = displayLabel(user);
  if (!label) return null;

  return (
    <span className="hidden max-w-[16rem] truncate text-sm text-muted-foreground sm:inline" title={label}>
      Ciao, <span className="font-medium text-foreground">{label}</span>
    </span>
  );
}
