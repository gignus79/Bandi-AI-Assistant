import { describe, expect, it } from "vitest";
import { matchesWhitelist, parseWhitelist } from "@/config/test-users-whitelist";

describe("test user whitelist", () => {
  it("normalizes comma-separated emails", () => {
    expect(parseWhitelist("  Ada@Example.com, bob@example.com ,, ")).toEqual([
      "ada@example.com",
      "bob@example.com",
    ]);
  });

  it("matches email regardless of case and still accepts a Clerk id", () => {
    const previous = process.env.TEST_USERS_WHITELIST;
    process.env.TEST_USERS_WHITELIST = "Ada@Example.com, user_legacy";
    try {
      expect(matchesWhitelist("user_1", "ada@example.com")).toBe(true);
      expect(matchesWhitelist("user_legacy", null)).toBe(true);
      expect(matchesWhitelist("user_2", "other@example.com")).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.TEST_USERS_WHITELIST;
      else process.env.TEST_USERS_WHITELIST = previous;
    }
  });
});
