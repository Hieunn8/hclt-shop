import { describe, expect, it } from "vitest";
import { getCatalog } from "./cms";

describe("cms catalog fallback", () => {
  it("returns fallback catalog without Strapi credentials", async () => {
    const catalog = await getCatalog();
    expect(catalog.products.length).toBeGreaterThan(0);
    expect(catalog.categories.length).toBeGreaterThan(0);
    expect(catalog.settings.siteName).toBe("AIVisionary");
  });
});
