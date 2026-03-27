import Image from "next/image";

/**
 * Full-viewport ambient layer: reference artwork is heavily blurred + overlaid
 * so marketing text in the asset does not read through as UI chrome.
 */
export function AppAmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Image
        src="/ambient-bg.png"
        alt=""
        fill
        className="scale-[1.15] object-cover opacity-[0.16] blur-3xl saturate-125"
        sizes="100vw"
        priority
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#1a0a2e]/92 via-[#0d0618]/96 to-[#050208]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.38),transparent)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(34,211,238,0.08),transparent)]"
        aria-hidden
      />
    </div>
  );
}
