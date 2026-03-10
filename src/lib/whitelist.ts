import { isTestUser as checkTestUser } from "@/config/test-users-whitelist";

export function isTestUser(userId: string): boolean {
  return checkTestUser(userId);
}
