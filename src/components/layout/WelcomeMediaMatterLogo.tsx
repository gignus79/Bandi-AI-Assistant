"use client";

import { useState } from "react";
import {
  WELCOME_LOGO_BLACK_ID,
  WELCOME_LOGO_WHITE_ID,
  welcomeLogoCandidateUrls,
} from "@/content/welcome-logo";

function DriveLogoStack({
  fileId,
  className,
}: {
  fileId: string;
  className: string;
}) {
  const [candidates] = useState(() => welcomeLogoCandidateUrls(fileId));
  const [index, setIndex] = useState(0);

  if (index >= candidates.length) {
    return (
      <span
        className={`inline-flex items-center bg-gradient-to-r from-cyan-600 to-violet-700 bg-clip-text text-xl font-semibold tracking-tight text-transparent dark:from-cyan-300 dark:to-violet-200 ${className}`}
      >
        MediaMatter
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Drive URLs non sempre compatibili con next/image; fallback a catena
    <img
      src={candidates[index]}
      alt="MediaMatter"
      width={260}
      height={78}
      className={`h-14 w-auto max-w-[min(280px,88vw)] object-contain object-center sm:h-16 ${className}`}
      referrerPolicy="no-referrer"
      loading="eager"
      decoding="async"
      onError={() => setIndex((i) => i + 1)}
    />
  );
}

/** Logo brand sulla landing: nero su sfondo chiaro, bianco su dark. Thumbnail Drive + fallback. */
export function WelcomeMediaMatterLogo() {
  return (
    <div className="mb-8 flex min-h-[3.5rem] justify-center sm:min-h-16">
      <div className="dark:hidden">
        <DriveLogoStack fileId={WELCOME_LOGO_BLACK_ID} className="" />
      </div>
      <div className="hidden dark:block">
        <DriveLogoStack fileId={WELCOME_LOGO_WHITE_ID} className="" />
      </div>
    </div>
  );
}
