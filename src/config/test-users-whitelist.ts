/**
 * Account senza limiti di analisi, messaggi e rate limit.
 * In TEST_USERS_WHITELIST metti le email, separate da virgola.
 * Un valore senza @ viene ancora accettato come ID Clerk.
 */
export const TEST_USER_EMAILS: string[] = [];

export function parseWhitelist(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function whitelistEntries(): string[] {
  const fromEnv = parseWhitelist(process.env.TEST_USERS_WHITELIST);
  if (fromEnv.length > 0) return fromEnv;
  return TEST_USER_EMAILS.map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export function matchesWhitelist(userId: string, email: string | null | undefined): boolean {
  const list = whitelistEntries();
  if (list.length === 0) return false;
  if (list.includes(userId.trim().toLowerCase())) return true;
  const normalized = email?.trim().toLowerCase();
  return Boolean(normalized && list.includes(normalized));
}
