import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";

export function LegalPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col text-slate-100">
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Link
          href="/"
          className="text-sm text-violet-200/80 transition hover:text-white"
        >
          ← Home
        </Link>
        <div className="mt-6 rounded-[24px] border border-white/10 bg-[#0b0614]/80 p-6 shadow-[0_0_50px_-15px_rgba(139,92,246,0.35)] backdrop-blur-2xl sm:p-10">
          {children}
        </div>
      </div>
      <Footer className="border-white/10 bg-black/40 text-violet-100/90 backdrop-blur-md [&_a]:text-violet-200/85 [&_a:hover]:text-white [&_span.text-muted-foreground]:text-violet-300/70" />
    </div>
  );
}
