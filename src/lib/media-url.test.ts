import { describe, expect, it } from "vitest";
import { googleDriveDirectViewUrl } from "./media-url";

describe("googleDriveDirectViewUrl", () => {
  it("converts /file/d/ sharing link", () => {
    expect(
      googleDriveDirectViewUrl(
        "https://drive.google.com/file/d/abc123XYZ/view?usp=sharing"
      )
    ).toBe("https://drive.google.com/uc?export=view&id=abc123XYZ");
  });

  it("converts open?id= link", () => {
    expect(
      googleDriveDirectViewUrl("https://drive.google.com/open?id=abc123XYZ")
    ).toBe("https://drive.google.com/uc?export=view&id=abc123XYZ");
  });

  it("returns other URLs unchanged", () => {
    expect(googleDriveDirectViewUrl("https://example.com/logo.png")).toBe(
      "https://example.com/logo.png"
    );
  });
});
