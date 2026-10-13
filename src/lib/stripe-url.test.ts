import { describe, expect, it } from "vitest";
import { safeAppUrl } from "@/lib/stripe";

describe("checkout return urls", () => {
  it("keeps same-origin urls and rejects external redirects", () => {
    const origin = "https://webapp.bandiassistant.giorgiolovecchio.com";
    expect(safeAppUrl(undefined, origin, "/dashboard/pricing")).toBe(
      "https://webapp.bandiassistant.giorgiolovecchio.com/dashboard/pricing"
    );
    expect(safeAppUrl("https://evil.example/phish", origin, "/dashboard?success=1")).toBe(
      "https://webapp.bandiassistant.giorgiolovecchio.com/dashboard?success=1"
    );
    expect(safeAppUrl(`${origin}/dashboard?success=1`, origin, "/dashboard")).toBe(
      "https://webapp.bandiassistant.giorgiolovecchio.com/dashboard?success=1"
    );
  });
});
