"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

/**
 * Logo ufficiale: aggiungi il file originale come `public/mediamatter-logo.png` (consigliato: PNG dal brand kit).
 * Opzionale: `NEXT_PUBLIC_MEDIAMATTER_LOGO_URL` per un URL pubblico (CDN).
 * Se il caricamento fallisce, si prova un URL sul sito WordPress, poi il wordmark testuale.
 */
const REMOTE_LOGO_FALLBACK =
  "https://www.giorgiolovecchio.com/wp-content/uploads/elementor/thumbs/Logo_MediaMatter_300x150-rfany5j6vb0rsiwht0gezcsi5tz8l3md77iqrr52k0.png";

const LOCAL_LOGO = "/mediamatter-logo.png";

type BrandLogoProps = {
  className?: string;
  heightClass?: string;
  showWordmarkFallback?: boolean;
};

function WordmarkFallback({ heightClass }: { heightClass: string }) {
  return (
    <span
      className={`inline-flex items-center ${heightClass} font-semibold tracking-tight text-slate-800 dark:text-white`}
    >
      <span className="bg-gradient-to-r from-cyan-600 to-violet-700 bg-clip-text text-transparent dark:from-cyan-300 dark:to-violet-200">
        MediaMatter
      </span>
    </span>
  );
}

export function BrandLogo({
  className = "",
  heightClass = "h-9",
  showWordmarkFallback = true,
}: BrandLogoProps) {
  const envUrl =
    typeof process.env.NEXT_PUBLIC_MEDIAMATTER_LOGO_URL === "string" &&
    process.env.NEXT_PUBLIC_MEDIAMATTER_LOGO_URL.trim().length > 0
      ? process.env.NEXT_PUBLIC_MEDIAMATTER_LOGO_URL.trim()
      : null;

  const candidates = useMemo(() => {
    const list: string[] = [];
    if (envUrl) list.push(envUrl);
    list.push(LOCAL_LOGO);
    list.push(REMOTE_LOGO_FALLBACK);
    return list;
  }, [envUrl]);

  const [index, setIndex] = useState(0);

  if (index >= candidates.length) {
    return showWordmarkFallback ? (
      <WordmarkFallback heightClass={heightClass} />
    ) : null;
  }

  const src = candidates[index];
  const isRemote = src.startsWith("http");

  return (
    <Image
      src={src}
      alt="MediaMatter"
      width={220}
      height={80}
      className={`${heightClass} w-auto max-w-[220px] object-contain object-left ${className}`}
      unoptimized={isRemote}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
