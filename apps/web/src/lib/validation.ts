import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  topic: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(0).optional()
});

export const reviewSchema = z.object({
  productSlug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1200),
  website: z.string().max(0).optional()
});

export const revalidateSchema = z.object({
  model: z.string().trim().min(1).max(80),
  action: z.string().trim().min(1).max(80),
  slug: z.string().trim().max(160).optional()
});

export function tagsForRevalidate(model: string, slug?: string): string[] {
  const normalized = model.toLowerCase();
  if (normalized.includes("product")) return slug ? ["catalog", "products", `product:${slug}`] : ["catalog", "products"];
  if (normalized.includes("review")) return ["catalog", "reviews", "products"];
  if (normalized.includes("blog")) return slug ? ["catalog", "blog-posts", `blog:${slug}`] : ["catalog", "blog-posts"];
  if (normalized.includes("category")) return ["catalog", "categories", "products"];
  if (normalized.includes("policy")) return ["catalog", "site-settings"];
  if (normalized.includes("faq")) return ["catalog", "faqs"];
  if (normalized.includes("testimonial")) return ["catalog", "testimonials"];
  if (normalized.includes("hero")) return ["catalog", "hero-slides"];
  if (normalized.includes("metric")) return ["catalog", "site-metrics"];
  if (normalized.includes("site")) return ["catalog", "site-settings"];
  return ["catalog", "site-settings"];
}
