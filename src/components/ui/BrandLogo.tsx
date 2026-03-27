"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { googleDriveDirectViewUrl } from "@/lib/media-url";

/**
 * Logo: varianti tema
 * - NEXT_PUBLIC_MEDIAMATTER_LOGO_URL_BLACK → sfondi chiari
 * - NEXT_PUBLIC_MEDIAMATTER_LOGO_URL_WHITE → sfondi scuri
 * Legacy: NEXT_PUBLIC_MEDIAMATTER_LOGO_URL, poi public/mediamatter-logo.png, poi URL WordPress, poi wordmark.
 */
const REMOTE_LOGO_FALLBACK =
  "https://www.giorgiolovecchio.com/wp-content/uploads/elementor/thumbs/Logo_MediaMatter_300x150-rfany5j6vb0rsiwht0gezcsi5tz8l3md77iqrr52k0.png";

const LOCAL_LOGO = "/mediamatter-logo.png";

function envTrim(key: string): string | null {
  const v = process.env[key];
  return typeof v === "string" && v.trim().length > 0 ? googleDriveDirectViewUrl(v.trim()) : null;
}

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
  const logoBlack = envTrim("NEXT_PUBLIC_MEDIAMATTER_LOGO_URL_BLACK");
  const logoWhite = envTrim("NEXT_PUBLIC_MEDIAMATTER_LOGO_URL_WHITE");
  const legacyUrl = envTrim("NEXT_PUBLIC_MEDIAMATTER_LOGO_URL");

  const dualMode = Boolean(logoBlack && logoWhite);

  const singleFromTheme = logoBlack ?? logoWhite;

  const candidates = useMemo(() => {
    const list: string[] = [];
    if (legacyUrl) list.push(legacyUrl);
    list.push(LOCAL_LOGO);
    list.push(REMOTE_LOGO_FALLBACK);
    return list;
  }, [legacyUrl]);

  const [index, setIndex] = useState(0);

  if (dualMode) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <Image
          src={logoBlack!}
          alt="MediaMatter"
          width={220}
          height={80}
          className={`${heightClass} w-auto max-w-[220px] object-contain object-left dark:hidden`}
          unoptimized
        />
        <Image
          src={logoWhite!}
          alt="MediaMatter"
          width={220}
          height={80}
          className={`${heightClass} hidden w-auto max-w-[220px] object-contain object-left dark:block`}
          unoptimized
        />
      </span>
    );
  }

  if (!dualMode && (logoBlack || logoWhite)) {
    return (
      <Image
        src={singleFromTheme!}
        alt="MediaMatter"
        width={220}
        height={80}
        className={`${heightClass} w-auto max-w-[220px] object-contain object-left ${className}`}
        unoptimized
      />
    );
  }

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
