import { describe, expect, it } from "vitest";
import { contactSchema, reviewSchema, tagsForRevalidate } from "./validation";

describe("validation", () => {
  it("accepts valid contact payload", () => {
    expect(contactSchema.safeParse({ name: "Nguyen Van A", email: "a@example.com", message: "Tôi cần tư vấn sản phẩm Auto Reup." }).success).toBe(true);
  });

  it("rejects invalid review rating", () => {
    expect(reviewSchema.safeParse({ productSlug: "auto-reup-master", name: "A", email: "bad", rating: 7, comment: "short" }).success).toBe(false);
  });

  it("maps webhook models to allowed cache tags", () => {
    expect(tagsForRevalidate("product", "auto-reup-master")).toEqual(["products", "product:auto-reup-master"]);
    expect(tagsForRevalidate("blog-post", "toi-uu")).toEqual(["blog-posts", "blog:toi-uu"]);
    expect(tagsForRevalidate("policy", "bao-mat")).toEqual(["site-settings"]);
  });
});
