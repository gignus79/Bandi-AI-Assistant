/**
 * Identifica l’istanza dell’app (suite multi-prodotto con Clerk/Stripe condivisi).
 * Imposta NEXT_PUBLIC_APP_SLUG per ogni deploy (es. bandi-ai, labeltools-press-review, qr-generator-pro).
 */
export function getPublicAppSlug(): string {
  const slug = process.env.NEXT_PUBLIC_APP_SLUG?.trim();
  if (slug) return slug;
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (url) {
    try {
      return new URL(url).hostname.replace(/\./g, "-");
    } catch {
      /* ignore */
    }
  }
  return "unknown-app";
}
