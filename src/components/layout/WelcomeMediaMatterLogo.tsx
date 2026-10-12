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
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/mediamatter-mark.svg" alt="MediaMatter" width={48} height={48} className={className} />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Drive URLs non sempre compatibili con next/image; un solo fallback
    <img
      src={candidates[index]}
      alt="MediaMatter"
      width={260}
      height={78}
      className={className}
      referrerPolicy="no-referrer"
      loading="eager"
      decoding="async"
      onError={() => setIndex(candidates.length)}
    />
  );
}

/** Logo brand: nero su sfondo chiaro, bianco su dark. Un solo fallback locale, senza catena di URL che sfarfalla. */
export function WelcomeMediaMatterLogo({ compact = false }: { compact?: boolean }) {
  const frame = compact ? "min-h-8" : "mb-8 min-h-[3.5rem] sm:min-h-16";
  const imageClass = compact
    ? "h-8 w-auto max-w-[140px] object-contain object-left sm:h-9"
    : "h-14 w-auto max-w-[min(280px,88vw)] object-contain object-center sm:h-16";
  return (
    <div className={`flex justify-center ${frame}`}>
      <div className="dark:hidden">
        <DriveLogoStack fileId={WELCOME_LOGO_BLACK_ID} className={imageClass} />
      </div>
      <div className="hidden dark:block">
        <DriveLogoStack fileId={WELCOME_LOGO_WHITE_ID} className={imageClass} />
      </div>
    </div>
  );
}
