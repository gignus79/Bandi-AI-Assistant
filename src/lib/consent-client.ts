export function notifyIfConsentRequired(data: { code?: string }): boolean {
  if (data.code !== "CONSENT_REQUIRED") return false;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bandi-consent-required"));
  }
  return true;
}
