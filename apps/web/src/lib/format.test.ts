import { describe, expect, it } from "vitest";
import { formatVnd, sanitizeExternalUrl } from "./format";

describe("format helpers", () => {
  it("formats VND with vi-VN locale", () => {
    expect(formatVnd(1290000)).toContain("1.290.000");
    expect(formatVnd(1290000)).toContain("₫");
  });

  it("sanitizes external urls", () => {
    expect(sanitizeExternalUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(sanitizeExternalUrl("javascript:alert(1)")).toBeUndefined();
  });
});
