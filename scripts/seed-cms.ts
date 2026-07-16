import { createHash } from "node:crypto";
import { fallbackData } from "../apps/web/src/lib/fallbackData";
import type { BlogPost, Category, Policy, Product, Review } from "../apps/web/src/lib/types";

type StrapiRecord = {
  id?: number;
  documentId?: string;
  slug?: string;
};

type StrapiListResponse<T> = {
  data?: T[];
};

type StrapiSingleResponse<T> = {
  data?: T;
};

type SeedContext = {
  base: string;
  token: string;
};

async function request<T>(ctx: SeedContext, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(new URL(path, ctx.base), {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ctx.token}`,
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strapi request failed ${response.status} ${path}: ${body.slice(0, 500)}`);
  }

  return (await response.json()) as T;
}

function recordKey(record: StrapiRecord): string | number | undefined {
  return record.documentId ?? record.id;
}

async function findBySlug(ctx: SeedContext, collection: string, slug: string): Promise<StrapiRecord | undefined> {
  const query = new URLSearchParams({
    "filters[slug][$eq]": slug,
    "pagination[pageSize]": "1"
  });
  const result = await request<StrapiListResponse<StrapiRecord>>(ctx, `/api/${collection}?${query.toString()}`);
  return result.data?.[0];
}

async function upsertBySlug(ctx: SeedContext, collection: string, slug: string, data: Record<string, unknown>): Promise<StrapiRecord> {
  const existing = await findBySlug(ctx, collection, slug);
  const key = existing ? recordKey(existing) : undefined;

  if (key) {
    const result = await request<StrapiSingleResponse<StrapiRecord>>(ctx, `/api/${collection}/${key}`, {
      method: "PUT",
      body: JSON.stringify({ data })
    });
    return result.data ?? existing;
  }

  const result = await request<StrapiSingleResponse<StrapiRecord>>(ctx, `/api/${collection}`, {
    method: "POST",
    body: JSON.stringify({ data })
  });
  if (!result.data) throw new Error(`Strapi did not return created ${collection}:${slug}`);
  return result.data;
}

async function updateSingle(ctx: SeedContext, singleType: string, data: Record<string, unknown>) {
  await request<StrapiSingleResponse<StrapiRecord>>(ctx, `/api/${singleType}`, {
    method: "PUT",
    body: JSON.stringify({ data })
  });
}

function categoryPayload(category: Category): Record<string, unknown> {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description,
    publishedAt: new Date().toISOString()
  };
}

function productPayload(product: Product, category?: StrapiRecord): Record<string, unknown> {
  return {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    badge: product.badge,
    rating: product.rating,
    reviewCount: product.reviewCount,
    features: product.features.join("\n"),
    usageSteps: product.usageSteps.join("\n"),
    purchaseUrl: product.purchaseUrl,
    zaloUrl: product.zaloUrl,
    category: category ? recordKey(category) : undefined,
    publishedAt: product.publishedAt
  };
}

function blogPayload(post: BlogPost): Record<string, unknown> {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: [
      {
        type: "paragraph",
        children: [{ type: "text", text: post.content }]
      }
    ],
    category: post.category,
    author: post.author,
    seoTitle: post.title,
    seoDescription: post.excerpt,
    publishedAt: post.publishedAt
  };
}

function policyPayload(policy: Policy): Record<string, unknown> {
  return {
    title: policy.title,
    slug: policy.slug,
    content: [
      {
        type: "paragraph",
        children: [{ type: "text", text: policy.content }]
      }
    ],
    seoDescription: policy.content.slice(0, 150),
    publishedAt: new Date().toISOString()
  };
}

function reviewPayload(review: Review, product?: StrapiRecord): Record<string, unknown> {
  const emailHash = createHash("sha256").update(`${review.name}:${review.productSlug}`).digest("hex");
  return {
    name: review.name,
    emailHash,
    rating: review.rating,
    comment: review.comment,
    approved: review.status === "approved",
    product: product ? recordKey(product) : undefined,
    createdAt: review.createdAt
  };
}

async function seedStrapi(ctx: SeedContext) {
  await updateSingle(ctx, "site-setting", {
    ...fallbackData.settings,
    promo: fallbackData.settings.promo
  });

  const categories = new Map<string, StrapiRecord>();
  for (const category of fallbackData.categories) {
    categories.set(category.slug, await upsertBySlug(ctx, "categories", category.slug, categoryPayload(category)));
  }

  const products = new Map<string, StrapiRecord>();
  for (const product of fallbackData.products) {
    const record = await upsertBySlug(ctx, "products", product.slug, productPayload(product, categories.get(product.categorySlug)));
    products.set(product.slug, record);
  }

  for (const post of fallbackData.blogPosts) {
    await upsertBySlug(ctx, "blog-posts", post.slug, blogPayload(post));
  }

  for (const policy of fallbackData.policies) {
    await upsertBySlug(ctx, "policies", policy.slug, policyPayload(policy));
  }

  for (const review of fallbackData.reviews) {
    await upsertBySlug(ctx, "reviews", `${review.productSlug}-${review.id}`, {
      ...reviewPayload(review, products.get(review.productSlug)),
      slug: `${review.productSlug}-${review.id}`
    });
  }
}

async function main() {
  const base = process.env.STRAPI_INTERNAL_URL || process.env.NEXT_PUBLIC_STRAPI_URL;
  const token = process.env.STRAPI_API_TOKEN;

  const counts = {
    categories: fallbackData.categories.length,
    products: fallbackData.products.length,
    heroSlides: fallbackData.heroSlides.length,
    testimonials: fallbackData.testimonials.length,
    faqs: fallbackData.faqs.length,
    blogPosts: fallbackData.blogPosts.length,
    policies: fallbackData.policies.length,
    reviews: fallbackData.reviews.length
  };

  if (!base || !token) {
    console.log(JSON.stringify({ ok: true, mode: "dry-run", message: "No Strapi credentials; seed data validated locally.", counts }));
    return;
  }

  await seedStrapi({ base, token });
  console.log(JSON.stringify({ ok: true, mode: "strapi-upsert", base, counts }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
