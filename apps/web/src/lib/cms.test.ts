import { describe, expect, it } from "vitest";
import { getCatalog, reviewAggregatesByProduct } from "./cms";
import type { Review } from "./types";

describe("cms catalog fallback", () => {
  it("returns fallback catalog without Strapi credentials", async () => {
    const catalog = await getCatalog();
    expect(catalog.products.length).toBeGreaterThan(0);
    expect(catalog.categories.length).toBeGreaterThan(0);
    expect(catalog.settings.siteName).toBe("AIVisionary");
  });

  it("computes product rating aggregates from approved reviews", () => {
    const reviews: Review[] = [
      { id: "r1", productSlug: "voice", name: "A", rating: 5, comment: "Great product", status: "approved", createdAt: "2026-07-01T00:00:00.000Z" },
      { id: "r2", productSlug: "voice", name: "B", rating: 4, comment: "Good product", status: "approved", createdAt: "2026-07-02T00:00:00.000Z" },
      { id: "r3", productSlug: "voice", name: "C", rating: 1, comment: "Pending review", status: "pending", createdAt: "2026-07-03T00:00:00.000Z" },
      { id: "r4", productSlug: "reup", name: "D", rating: 3, comment: "Average product", status: "approved", createdAt: "2026-07-04T00:00:00.000Z" }
    ];

    const aggregates = reviewAggregatesByProduct(reviews);

    expect(aggregates.get("voice")).toEqual({ rating: 4.5, reviewCount: 2 });
    expect(aggregates.get("reup")).toEqual({ rating: 3, reviewCount: 1 });
  });
});
