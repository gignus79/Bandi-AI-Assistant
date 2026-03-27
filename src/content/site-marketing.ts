/** Link in entrata verso giorgiolovecchio.com e hub progetti (SEO / discoverability). */
export const SITE_ORIGIN = "https://www.giorgiolovecchio.com" as const;

export const bandiAppInboundLinks = [
  {
    label: "Panoramica progetti AI",
    href: `${SITE_ORIGIN}/progetti-ai`,
    description: "Hub con tutte le applicazioni e i case study.",
  },
  {
    label: "Home e profilo",
    href: SITE_ORIGIN,
    description: "Portfolio, blog e contatti.",
  },
  {
    label: "Newsletter",
    href: `${SITE_ORIGIN}/newsletter`,
    description: "Aggiornamenti su prodotti e AI.",
  },
  {
    label: "Repository GitHub",
    href: "https://github.com/gignus79/Bandi-AI-Assistant",
    description: "Codice e documentazione del progetto.",
  },
] as const;

export type CrossSellApp = {
  title: string;
  tagline: string;
  href: string;
  stack: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

/** Altre app online sul sito (cross-selling). */
export const crossSellApps: CrossSellApp[] = [
  {
    title: "Press Review Tool",
    tagline: "Rassegna stampa e menzioni per team PR e comunicazione.",
    href: "https://press-review-tool.labeltools.toskyrecords.com/",
    secondaryHref: `${SITE_ORIGIN}/progetti-ai/press-review-tool`,
    secondaryLabel: "Case study",
    stack: "Next.js · Automazione · Media",
  },
  {
    title: "QR Generator Pro",
    tagline: "Generatore QR con tipologie multiple e condivisione per campagne.",
    href: "https://qr-generator-pro-beta.vercel.app/",
    secondaryHref:
      "https://github.com/gignus79/QR-Generator-Pro/blob/main/README.md",
    secondaryLabel: "README",
    stack: "Next.js 14 · TypeScript",
  },
  {
    title: "StudioRoyalties Calculator",
    tagline: "Automazione royalties per label: da Excel a report e PDF guidati.",
    href: `${SITE_ORIGIN}/progetti-ai/royalties-calculator`,
    stack: "Case study · Workflow",
  },
];
