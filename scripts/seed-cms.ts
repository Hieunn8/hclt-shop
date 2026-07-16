import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fallbackData } from "../apps/web/src/lib/fallbackData";
import type { BlogPost, Category, Faq, HeroSlide, MediaAsset, Policy, Product, Review, SiteMetric, Testimonial } from "../apps/web/src/lib/types";

type StrapiRecord = {
  id?: number;
  documentId?: string;
  slug?: string;
  name?: string;
};

type StrapiListResponse<T> = {
  data?: T[];
};

type StrapiSingleResponse<T> = {
  data?: T;
};

type UploadFile = {
  id: number;
  name: string;
  url: string;
};

type SeedContext = {
  base: string;
  token: string;
  uploaded: Map<string, UploadFile>;
};

const assetsDir = path.resolve(process.cwd(), "apps/web/public/assets");

async function requestJson<T>(ctx: SeedContext, requestPath: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(new URL(requestPath, ctx.base), {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ctx.token}`,
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Strapi request failed ${response.status} ${requestPath}: ${body.slice(0, 500)}`);
  }

  return (await response.json()) as T;
}

async function requestForm<T>(ctx: SeedContext, requestPath: string, body: FormData): Promise<T> {
  const response = await fetch(new URL(requestPath, ctx.base), {
    method: "POST",
    headers: { authorization: `Bearer ${ctx.token}` },
    body
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`Strapi upload failed ${response.status} ${requestPath}: ${responseBody.slice(0, 500)}`);
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
  const result = await requestJson<StrapiListResponse<StrapiRecord>>(ctx, `/api/${collection}?${query.toString()}`);
  return result.data?.[0];
}

async function upsertBySlug(ctx: SeedContext, collection: string, slug: string, data: Record<string, unknown>): Promise<StrapiRecord> {
  const existing = await findBySlug(ctx, collection, slug);
  const key = existing ? recordKey(existing) : undefined;

  if (key) {
    const result = await requestJson<StrapiSingleResponse<StrapiRecord>>(ctx, `/api/${collection}/${key}`, {
      method: "PUT",
      body: JSON.stringify({ data })
    });
    return result.data ?? existing;
  }

  const result = await requestJson<StrapiSingleResponse<StrapiRecord>>(ctx, `/api/${collection}`, {
    method: "POST",
    body: JSON.stringify({ data })
  });
  if (!result.data) throw new Error(`Strapi did not return created ${collection}:${slug}`);
  return result.data;
}

async function updateSingle(ctx: SeedContext, singleType: string, data: Record<string, unknown>) {
  await requestJson<StrapiSingleResponse<StrapiRecord>>(ctx, `/api/${singleType}`, {
    method: "PUT",
    body: JSON.stringify({ data })
  });
}

function assetFilename(asset?: MediaAsset): string | undefined {
  if (!asset?.url.startsWith("/assets/")) return undefined;
  return path.basename(asset.url);
}

async function findUploadedFile(ctx: SeedContext, filename: string): Promise<UploadFile | undefined> {
  const cached = ctx.uploaded.get(filename);
  if (cached) return cached;

  const query = new URLSearchParams({
    "filters[name][$eq]": filename,
    "pagination[pageSize]": "1"
  });
  const result = await requestJson<UploadFile[] | StrapiListResponse<UploadFile>>(ctx, `/api/upload/files?${query.toString()}`);
  const file = Array.isArray(result) ? result[0] : result.data?.[0];
  if (file) ctx.uploaded.set(filename, file);
  return file;
}

async function remoteFileExists(ctx: SeedContext, file: UploadFile): Promise<boolean> {
  const fileUrl = file.url.startsWith("http") ? file.url : new URL(file.url, ctx.base).toString();
  try {
    const response = await fetch(fileUrl, { method: "HEAD" });
    if (response.status === 405) {
      const getResponse = await fetch(fileUrl, { method: "GET" });
      return getResponse.ok;
    }
    return response.ok;
  } catch {
    return false;
  }
}

async function uploadAsset(ctx: SeedContext, asset?: MediaAsset): Promise<number | undefined> {
  const filename = assetFilename(asset);
  if (!filename) return undefined;

  const existing = await findUploadedFile(ctx, filename);
  if (existing && (await remoteFileExists(ctx, existing))) return existing.id;

  const filePath = path.join(assetsDir, filename);
  if (!existsSync(filePath)) throw new Error(`Missing seed asset ${filePath}`);

  const bytes = await readFile(filePath);
  const form = new FormData();
  form.append("files", new Blob([bytes], { type: "image/svg+xml" }), filename);
  const uploaded = await requestForm<UploadFile[]>(ctx, "/api/upload", form);
  if (!uploaded[0]) throw new Error(`Upload did not return file for ${filename}`);
  ctx.uploaded.set(filename, uploaded[0]);
  return uploaded[0].id;
}

async function uploadAssets(ctx: SeedContext, assets: MediaAsset[]): Promise<number[]> {
  const ids = await Promise.all(assets.map((asset) => uploadAsset(ctx, asset)));
  return ids.filter((id): id is number => typeof id === "number");
}

function categoryPayload(category: Category, icon?: number): Record<string, unknown> {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon,
    publishedAt: new Date().toISOString()
  };
}

function productPayload(product: Product, category?: StrapiRecord, media?: number[]): Record<string, unknown> {
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
    icon: media?.[0],
    media,
    features: product.features.join("\n"),
    usageSteps: product.usageSteps.join("\n"),
    purchaseUrl: product.purchaseUrl,
    zaloUrl: product.zaloUrl,
    category: category ? recordKey(category) : undefined,
    publishedAt: product.publishedAt
  };
}

function heroSlidePayload(slide: HeroSlide, product?: StrapiRecord, image?: number, sortOrder = 0): Record<string, unknown> {
  return {
    title: slide.title,
    slug: slide.id,
    description: slide.description,
    sortOrder,
    active: true,
    image,
    product: product ? recordKey(product) : undefined,
    publishedAt: new Date().toISOString()
  };
}

function testimonialPayload(testimonial: Testimonial, sortOrder = 0): Record<string, unknown> {
  return {
    name: testimonial.name,
    slug: testimonial.id,
    role: testimonial.role,
    quote: testimonial.quote,
    rating: testimonial.rating,
    sortOrder,
    active: true,
    publishedAt: new Date().toISOString()
  };
}

function faqPayload(faq: Faq, sortOrder = 0): Record<string, unknown> {
  return {
    question: faq.question,
    slug: faq.id,
    answer: faq.answer,
    sortOrder,
    active: true,
    publishedAt: new Date().toISOString()
  };
}

function siteMetricPayload(metric: SiteMetric, sortOrder = 0): Record<string, unknown> {
  return {
    value: metric.value,
    label: metric.label,
    slug: metric.id,
    sortOrder,
    active: true,
    publishedAt: new Date().toISOString()
  };
}

function blogPayload(post: BlogPost, image?: number): Record<string, unknown> {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    image,
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
    slug: `${review.productSlug}-${review.id}`,
    name: review.name,
    emailHash,
    rating: review.rating,
    comment: review.comment,
    approved: review.status === "approved",
    product: product ? recordKey(product) : undefined
  };
}

async function seedStrapi(ctx: SeedContext) {
  await updateSingle(ctx, "site-setting", {
    ...fallbackData.settings,
    promo: fallbackData.settings.promo
  });

  const firstProductByCategory = new Map<string, Product>();
  for (const product of fallbackData.products) {
    if (!firstProductByCategory.has(product.categorySlug)) firstProductByCategory.set(product.categorySlug, product);
  }

  const categories = new Map<string, StrapiRecord>();
  for (const category of fallbackData.categories) {
    const icon = await uploadAsset(ctx, firstProductByCategory.get(category.slug)?.media[0]);
    categories.set(category.slug, await upsertBySlug(ctx, "categories", category.slug, categoryPayload(category, icon)));
  }

  const products = new Map<string, StrapiRecord>();
  for (const product of fallbackData.products) {
    const media = await uploadAssets(ctx, product.media);
    const record = await upsertBySlug(ctx, "products", product.slug, productPayload(product, categories.get(product.categorySlug), media));
    products.set(product.slug, record);
  }

  for (const [index, slide] of fallbackData.heroSlides.entries()) {
    const image = await uploadAsset(ctx, slide.image);
    await upsertBySlug(ctx, "hero-slides", slide.id, heroSlidePayload(slide, products.get(slide.productSlug), image, index));
  }

  for (const [index, testimonial] of fallbackData.testimonials.entries()) {
    await upsertBySlug(ctx, "testimonials", testimonial.id, testimonialPayload(testimonial, index));
  }

  for (const [index, faq] of fallbackData.faqs.entries()) {
    await upsertBySlug(ctx, "faqs", faq.id, faqPayload(faq, index));
  }

  for (const [index, metric] of fallbackData.siteMetrics.entries()) {
    await upsertBySlug(ctx, "site-metrics", metric.id, siteMetricPayload(metric, index));
  }

  for (const post of fallbackData.blogPosts) {
    const image = await uploadAsset(ctx, post.image);
    await upsertBySlug(ctx, "blog-posts", post.slug, blogPayload(post, image));
  }

  for (const policy of fallbackData.policies) {
    await upsertBySlug(ctx, "policies", policy.slug, policyPayload(policy));
  }

  for (const review of fallbackData.reviews) {
    await upsertBySlug(ctx, "reviews", `${review.productSlug}-${review.id}`, reviewPayload(review, products.get(review.productSlug)));
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
    siteMetrics: fallbackData.siteMetrics.length,
    blogPosts: fallbackData.blogPosts.length,
    policies: fallbackData.policies.length,
    reviews: fallbackData.reviews.length
  };

  if (!base || !token) {
    console.log(JSON.stringify({ ok: true, mode: "dry-run", message: "No Strapi credentials; seed data validated locally.", counts }));
    return;
  }

  await seedStrapi({ base, token, uploaded: new Map() });
  console.log(JSON.stringify({ ok: true, mode: "strapi-upsert", base, counts }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
