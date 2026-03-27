"use client";

import { useState } from "react";
import Image from "next/image";

/** Logo ufficiale dal sito WordPress. Fallback SVG locale se il caricamento fallisce (hotlink, CDN). */
const WORDPRESS_LOGO =
  "https://www.giorgiolovecchio.com/wp-content/uploads/elementor/thumbs/Logo_MediaMatter_300x150-rfany5j6vb0rsiwht0gezcsi5tz8l3md77iqrr52k0.png";

type BrandLogoProps = {
  className?: string;
  /** Altezza CSS (px) */
  heightClass?: string;
  showWordmarkFallback?: boolean;
};

export function BrandLogo({
  className = "",
  heightClass = "h-9",
  showWordmarkFallback = true,
}: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <Image
          src="/mediamatter-mark.svg"
          alt=""
          width={36}
          height={36}
          className={`${heightClass} w-auto shrink-0 object-contain`}
        />
        {showWordmarkFallback && (
          <span className="font-semibold tracking-tight text-foreground">MediaMatter</span>
        )}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL esterno WordPress; onError per fallback
    <img
      src={WORDPRESS_LOGO}
      alt="MediaMatter"
      className={`${heightClass} w-auto max-w-[220px] object-contain object-left dark:brightness-0 dark:invert ${className}`}
      onError={() => setFailed(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
