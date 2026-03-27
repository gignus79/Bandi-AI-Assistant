import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getPublicAppSlug } from "./app-identity";

describe("getPublicAppSlug", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_APP_SLUG;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    process.env = env;
  });

  it("uses NEXT_PUBLIC_APP_SLUG when set", () => {
    process.env.NEXT_PUBLIC_APP_SLUG = "  my-app  ";
    expect(getPublicAppSlug()).toBe("my-app");
  });

  it("derives from NEXT_PUBLIC_APP_URL hostname when slug unset", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://press.example.com/path";
    expect(getPublicAppSlug()).toBe("press-example-com");
  });

  it("falls back to unknown-app", () => {
    expect(getPublicAppSlug()).toBe("unknown-app");
  });
});
