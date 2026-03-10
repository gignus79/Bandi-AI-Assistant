/**
 * Whitelist utenti di test: nessun limite su analisi, messaggi e rate limit.
 * Aggiungi gli user ID Clerk (es. da Dashboard Clerk → Users).
 * Puoi anche impostare TEST_USERS_WHITELIST in .env.local (ID separati da virgola).
 */
export const TEST_USER_IDS: string[] = [
  // Esempio: "user_2abc123...",
];

function getWhitelist(): string[] {
  const fromEnv = process.env.TEST_USERS_WHITELIST?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnv?.length) return fromEnv;
  return TEST_USER_IDS;
}

let cached: string[] | null = null;

export function getTestUserIds(): string[] {
  if (cached === null) cached = getWhitelist();
  return cached;
}

export function isTestUser(userId: string): boolean {
  return getTestUserIds().includes(userId);
}
