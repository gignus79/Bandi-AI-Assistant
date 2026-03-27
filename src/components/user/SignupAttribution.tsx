"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

/**
 * Invia una sola volta per sessione l’attribuzione “prima app” al server (Clerk + DB).
 */
export function SignupAttribution() {
  const { isSignedIn, isLoaded } = useUser();
  const done = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || done.current) return;
    done.current = true;
    void fetch("/api/user/attribution", { method: "POST" }).catch(() => {
      done.current = false;
    });
  }, [isLoaded, isSignedIn]);

  return null;
}
