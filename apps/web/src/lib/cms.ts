import "server-only";
import { unstable_cache } from "next/cache";
import { fallbackData } from "./fallbackData";
import { redisGetJson, redisSetJson } from "./redisCache";
import type { BlogPost, CatalogData, Category, Faq, HeroSlide, MediaAsset, Policy, Product, ProductDetailData, Review, SiteMetric, SiteSettings, Testimonial } from "./types";

type FetchOptions = {
  tag: string;
  path: string;
};

type StrapiListResponse = {
  data?: unknown[];
};

type StrapiSingleResponse = {
  data?: unknown;
};

type CatalogEndpointResponse = {
  data?: {
    settings?: unknown;
    categories?: unknown[];
    products?: unknown[];
    heroSlides?: unknown[];
    siteMetrics?: unknown[];
    testimonials?: unknown[];
    faqs?: unknown[];
    blogPosts?: unknown[];
    policies?: unknown[];
    reviews?: unknown[];
  };
};

type ProductDetailEndpointResponse = {
  data?: {
    product?: unknown;
    reviews?: unknown[];
    related?: unknown[];
    settings?: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapRecord(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;
  const attributes = value.attributes;
  if (isRecord(attributes)) return { ...value, ...attributes };
  return value;
}

function stringField(record: Record<string, unknown>, key: string, fallback = ""): string {
  const value = record[key];
  return typeof value === "string" ? value : fallback;
}

function numberField(record: Record<string, unknown>, key: string, fallback = 0): number {
  const value = record[key];
  return typeof value === "number" ? value : fallback;
}

function optionalNumberField(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" ? value : undefined;
}

function stringArrayField(record: Record<string, unknown>, key: string, fallback: string[]): string[] {
  const value = record[key];
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value;
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) return parsed;
    } catch {
      // Fall through to newline parsing for hand-entered text.
    }
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  return lines.length ? lines : fallback;
}

function relationSlug(record: Record<string, unknown>, key: string, fallback = ""): string {
  const relation = record[key];
  if (isRecord(relation)) {
    const directSlug = stringField(relation, "slug");
    if (directSlug) return directSlug;
    const data = unwrapRecord(relation.data);
    if (data) return stringField(data, "slug", fallback);
  }
  return fallback;
}

function relationRecord(record: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const relation = record[key];
  if (isRecord(relation)) {
    const data = unwrapRecord(relation.data);
    return data ?? relation;
  }
  return undefined;
}

function mediaRecordToAsset(input: unknown): MediaAsset | undefined {
  const record = unwrapRecord(input);
  if (!record) return undefined;
  const url = stringField(record, "url");
  if (!url) return undefined;
  const publicBase = process.env.NEXT_PUBLIC_STRAPI_URL;
  const absoluteUrl = url.startsWith("http") ? url : publicBase ? new URL(url, publicBase).toString() : url;
  const mime = stringField(record, "mime");
  return {
    url: absoluteUrl,
    alt: stringField(record, "alternativeText", stringField(record, "name", "CMS media")),
    type: mime.startsWith("video/") ? "video" : "image",
    width: optionalNumberField(record, "width"),
    height: optionalNumberField(record, "height")
  };
}

function mediaListField(record: Record<string, unknown>, key: string, fallback: MediaAsset[]): MediaAsset[] {
  const value = record[key];
  const source = isRecord(value) && Array.isArray(value.data) ? value.data : value;
  const list = Array.isArray(source) ? source : source ? [source] : [];
  const mapped = list.map(mediaRecordToAsset).filter((item): item is MediaAsset => Boolean(item));
  return mapped.length ? mapped : fallback;
}

function optionalEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || /^<[^>]+>$/.test(trimmed)) return undefined;
  return trimmed;
}

function slugFromText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function productSlugFromReviewSlug(value: string): string {
  return value.replace(/-r\d+$/i, "");
}

type ProductReviewAggregate = {
  rating: number;
  reviewCount: number;
};

function roundRating(value: number): number {
  return Math.round(value * 10) / 10;
}

export function reviewAggregatesByProduct(reviews: Review[]): Map<string, ProductReviewAggregate> {
  const buckets = new Map<string, { total: number; count: number }>();

  for (const review of reviews) {
    if (review.status !== "approved" || review.rating < 1) continue;
    const current = buckets.get(review.productSlug) ?? { total: 0, count: 0 };
    current.total += review.rating;
    current.count += 1;
    buckets.set(review.productSlug, current);
  }

  return new Map(
    [...buckets.entries()].map(([productSlug, aggregate]) => [
      productSlug,
      {
        rating: roundRating(aggregate.total / aggregate.count),
        reviewCount: aggregate.count
      }
    ])
  );
}

function applyReviewAggregates(products: Product[], reviews: Review[]): Product[] {
  const aggregates = reviewAggregatesByProduct(reviews);
  return products.map((product) => {
    const aggregate = aggregates.get(product.slug);
    return {
      ...product,
      rating: aggregate?.rating ?? 0,
      reviewCount: aggregate?.reviewCount ?? 0
    };
  });
}

async function fetchStrapiJson<T>({ tag, path }: FetchOptions): Promise<T | null> {
  const token = optionalEnv(process.env.STRAPI_API_TOKEN);
  const base = optionalEnv(process.env.STRAPI_INTERNAL_URL) || optionalEnv(process.env.NEXT_PUBLIC_STRAPI_URL);
  if (!base) return null;

  const url = new URL(path, base);
  const isLocalBase = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
  const timeoutMs = isLocalBase ? 30000 : 8000;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        signal: controller.signal,
        next: { tags: [tag], revalidate: 60 }
      });
      clearTimeout(timeout);
      if (response.status === 404) return null;
      if (response.status >= 400 && response.status < 500) {
        const body = await response.text().catch(() => "");
        console.error(
          JSON.stringify({
            level: "warn",
            event: "cms_fetch_rejected",
            tag,
            status: response.status,
            body: body.slice(0, 300)
          })
        );
        return null;
      }
      if (!response.ok) throw new Error(`CMS ${response.status}`);
      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeout);
      if (attempt === 2) {
        console.error(JSON.stringify({ level: "warn", event: "cms_fetch_failed", tag, message: error instanceof Error ? error.message : "unknown" }));
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
    }
  }
  return null;
}

function mapSettings(input: unknown): SiteSettings {
  const record = unwrapRecord(input);
  if (!record) return fallbackData.settings;
  const promo = isRecord(record.promo) ? record.promo : fallbackData.settings.promo;
  return {
    siteName: stringField(record, "siteName", fallbackData.settings.siteName),
    description: stringField(record, "description", fallbackData.settings.description),
    phone: stringField(record, "phone", fallbackData.settings.phone),
    email: stringField(record, "email", fallbackData.settings.email),
    zaloUrl: stringField(record, "zaloUrl", fallbackData.settings.zaloUrl),
    facebookUrl: stringField(record, "facebookUrl", fallbackData.settings.facebookUrl),
    address: stringField(record, "address", fallbackData.settings.address),
    pricingTitle: stringField(record, "pricingTitle", fallbackData.settings.pricingTitle),
    pricingDescription: stringField(record, "pricingDescription", fallbackData.settings.pricingDescription),
    contactTitle: stringField(record, "contactTitle", fallbackData.settings.contactTitle),
    contactDescription: stringField(record, "contactDescription", fallbackData.settings.contactDescription),
    contactSubmitLabel: stringField(record, "contactSubmitLabel", fallbackData.settings.contactSubmitLabel),
    promo: {
      active: typeof promo.active === "boolean" ? promo.active : fallbackData.settings.promo.active,
      text: typeof promo.text === "string" ? promo.text : fallbackData.settings.promo.text,
      href: typeof promo.href === "string" ? promo.href : fallbackData.settings.promo.href
    }
  };
}

function mapCategory(input: unknown): Category | undefined {
  const record = unwrapRecord(input);
  if (!record) return undefined;
  const slug = stringField(record, "slug");
  const name = stringField(record, "name");
  if (!slug || !name) return undefined;
  return {
    id: String(record.documentId ?? record.id ?? slug),
    slug,
    name,
    description: stringField(record, "description")
  };
}

function mapSiteMetric(input: unknown): SiteMetric | undefined {
  const record = unwrapRecord(input);
  if (!record) return undefined;
  const value = stringField(record, "value");
  const label = stringField(record, "label");
  if (!value || !label) return undefined;
  return {
    id: String(record.documentId ?? record.id ?? label),
    value,
    label
  };
}

function mapProduct(input: unknown): Product | undefined {
  const record = unwrapRecord(input);
  if (!record) return undefined;
  const slug = stringField(record, "slug");
  const name = stringField(record, "name");
  if (!slug || !name) return undefined;
  const fallback = fallbackData.products.find((product) => product.slug === slug);
  return {
    id: String(record.documentId ?? record.id ?? slug),
    slug,
    name,
    shortDescription: stringField(record, "shortDescription", fallback?.shortDescription ?? ""),
    description: stringField(record, "description", fallback?.description ?? ""),
    categorySlug: relationSlug(record, "category", fallback?.categorySlug ?? ""),
    price: numberField(record, "price", fallback?.price ?? 0),
    compareAtPrice: numberField(record, "compareAtPrice", fallback?.compareAtPrice ?? 0) || undefined,
    badge: parseBadge(record.badge, fallback?.badge),
    rating: numberField(record, "rating", fallback?.rating ?? 0),
    reviewCount: numberField(record, "reviewCount", fallback?.reviewCount ?? 0),
    icon: mediaRecordToAsset(relationRecord(record, "icon") ?? record.icon),
    media: mediaListField(record, "media", fallback?.media ?? fallbackData.products[0].media),
    features: stringArrayField(record, "features", fallback?.features ?? []),
    usageSteps: stringArrayField(record, "usageSteps", fallback?.usageSteps ?? []),
    purchaseUrl: stringField(record, "purchaseUrl", fallback?.purchaseUrl),
    zaloUrl: stringField(record, "zaloUrl", fallback?.zaloUrl),
    publishedAt: stringField(record, "publishedAt", fallback?.publishedAt ?? new Date().toISOString())
  };
}

function mapHeroSlide(input: unknown): HeroSlide | undefined {
  const record = unwrapRecord(input);
  if (!record) return undefined;
  const title = stringField(record, "title");
  const description = stringField(record, "description");
  if (!title || !description) return undefined;
  const product = relationRecord(record, "product");
  const productSlug = product ? stringField(product, "slug") : stringField(record, "productSlug", slugFromText(title));
  const image = mediaRecordToAsset(relationRecord(record, "image") ?? record.image);
  if (!productSlug || !image) return undefined;
  return {
    id: String(record.documentId ?? record.id ?? title),
    title,
    description,
    productSlug,
    image
  };
}

function parseBadge(value: unknown, fallback: Product["badge"]): Product["badge"] {
  return value === "hot" || value === "bestseller" || value === "new" || value === "featured" ? value : fallback;
}

function blockText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value
    .map((block) => {
      if (!isRecord(block) || !Array.isArray(block.children)) return "";
      return block.children.map((child) => (isRecord(child) && typeof child.text === "string" ? child.text : "")).join("");
    })
    .filter(Boolean)
    .join("\n\n");
}

function mapBlogPost(input: unknown): BlogPost | undefined {
  const record = unwrapRecord(input);
  if (!record) return undefined;
  const slug = stringField(record, "slug");
  const title = stringField(record, "title");
  if (!slug || !title) return undefined;
  const fallback = fallbackData.blogPosts.find((post) => post.slug === slug);
  return {
    id: String(record.documentId ?? record.id ?? slug),
    slug,
    title,
    excerpt: stringField(record, "excerpt", fallback?.excerpt ?? ""),
    content: blockText(record.content) || fallback?.content || "",
    category: stringField(record, "category", fallback?.category ?? "Hướng dẫn"),
    author: stringField(record, "author", fallback?.author ?? "AIVisionary Team"),
    publishedAt: stringField(record, "publishedAt", fallback?.publishedAt ?? new Date().toISOString()),
    image: mediaRecordToAsset(relationRecord(record, "image") ?? record.image) ?? fallback?.image ?? fallbackData.blogPosts[0].image
  };
}

function mapTestimonial(input: unknown): Testimonial | undefined {
  const record = unwrapRecord(input);
  if (!record) return undefined;
  const name = stringField(record, "name");
  const quote = stringField(record, "quote");
  if (!name || !quote) return undefined;
  return {
    id: String(record.documentId ?? record.id ?? name),
    name,
    role: stringField(record, "role"),
    quote,
    rating: numberField(record, "rating", 5)
  };
}

function mapFaq(input: unknown): Faq | undefined {
  const record = unwrapRecord(input);
  if (!record) return undefined;
  const question = stringField(record, "question");
  const answer = stringField(record, "answer");
  if (!question || !answer) return undefined;
  return {
    id: String(record.documentId ?? record.id ?? question),
    slug: stringField(record, "slug") || undefined,
    question,
    answer
  };
}

function mapPolicy(input: unknown): Policy | undefined {
  const record = unwrapRecord(input);
  if (!record) return undefined;
  const slug = stringField(record, "slug");
  const title = stringField(record, "title");
  if (!slug || !title) return undefined;
  const fallback = fallbackData.policies.find((policy) => policy.slug === slug);
  return {
    id: String(record.documentId ?? record.id ?? slug),
    slug,
    title,
    content: blockText(record.content) || fallback?.content || ""
  };
}

function mapReview(input: unknown): Review | undefined {
  const record = unwrapRecord(input);
  if (!record) return undefined;
  const productSlug = relationSlug(record, "product", stringField(record, "productSlug", productSlugFromReviewSlug(stringField(record, "slug"))));
  const name = stringField(record, "name");
  const comment = stringField(record, "comment");
  if (!productSlug || !name || !comment) return undefined;
  const approved = typeof record.approved === "boolean" ? record.approved : record.moderationStatus === "approved" || record.status === "approved";
  const status = approved ? "approved" : "pending";
  return {
    id: String(record.documentId ?? record.id ?? `${productSlug}-${name}`),
    productSlug,
    name,
    rating: numberField(record, "rating", 0),
    comment,
    status,
    createdAt: stringField(record, "createdAt", new Date().toISOString())
  };
}

function mapList<T>(response: StrapiListResponse | null, mapper: (input: unknown) => T | undefined, fallback: T[]): T[] {
  if (!response) return fallback;
  return response.data?.map(mapper).filter((item): item is T => Boolean(item)) ?? [];
}

function cacheForNext<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyParts: string[],
  options: { tags: string[]; revalidate: number }
): (...args: TArgs) => Promise<TResult> {
  if (process.env.VITEST) return fn;
  return unstable_cache(fn, keyParts, options);
}

function mapUnknownList<T>(items: unknown[] | undefined, mapper: (input: unknown) => T | undefined, fallback: T[]): T[] {
  if (!items) return fallback;
  const mapped = items.map(mapper).filter((item): item is T => Boolean(item));
  return mapped.length ? mapped : [];
}

async function getCatalogUncached(): Promise<CatalogData> {
  const cached = await redisGetJson<CatalogData>("catalog:v2");
  if (cached) return cached;

  const response = await fetchStrapiJson<CatalogEndpointResponse>({ tag: "catalog", path: "/api/catalog" });
  const data = response?.data;
  if (!data) return fallbackData;

  const reviews = mapUnknownList(data.reviews, mapReview, fallbackData.reviews);
  const catalog = {
    settings: data.settings ? mapSettings(data.settings) : fallbackData.settings,
    categories: mapUnknownList(data.categories, mapCategory, fallbackData.categories),
    products: applyReviewAggregates(mapUnknownList(data.products, mapProduct, fallbackData.products), reviews),
    heroSlides: mapUnknownList(data.heroSlides, mapHeroSlide, fallbackData.heroSlides),
    testimonials: mapUnknownList(data.testimonials, mapTestimonial, fallbackData.testimonials),
    faqs: mapUnknownList(data.faqs, mapFaq, fallbackData.faqs),
    siteMetrics: mapUnknownList(data.siteMetrics, mapSiteMetric, fallbackData.siteMetrics),
    blogPosts: mapUnknownList(data.blogPosts, mapBlogPost, fallbackData.blogPosts),
    policies: mapUnknownList(data.policies, mapPolicy, fallbackData.policies),
    reviews
  };

  await redisSetJson("catalog:v2", catalog);
  return catalog;
}

export const getCatalog = cacheForNext(getCatalogUncached, ["catalog"], {
  tags: ["catalog", "products", "hero-slides", "site-settings", "reviews"],
  revalidate: 60
});

async function getProductDetailUncached(slug: string): Promise<ProductDetailData | undefined> {
  const cacheKey = `product-detail:v2:${slug}`;
  const cached = await redisGetJson<ProductDetailData>(cacheKey);
  if (cached) return cached;

  const response = await fetchStrapiJson<ProductDetailEndpointResponse>({ tag: "products", path: `/api/products-by-slug/${encodeURIComponent(slug)}` });
  const data = response?.data;
  const product = data?.product ? mapProduct(data.product) : undefined;
  if (!data || !product) {
    const fallbackProduct = fallbackData.products.find((item) => item.slug === slug);
    if (!fallbackProduct) return undefined;
    const detail = {
      product: fallbackProduct,
      reviews: fallbackData.reviews.filter((review) => review.productSlug === fallbackProduct.slug && review.status === "approved"),
      related: fallbackData.products.filter((item) => item.categorySlug === fallbackProduct.categorySlug && item.slug !== fallbackProduct.slug).slice(0, 3),
      settings: fallbackData.settings
    };
    await redisSetJson(cacheKey, detail, 60);
    return detail;
  }

  const reviews = mapUnknownList(data.reviews, mapReview, []).filter((review) => review.status === "approved");
  const detail = {
    product: applyReviewAggregates([product], reviews)[0],
    reviews,
    related: applyReviewAggregates(mapUnknownList(data.related, mapProduct, []), reviews),
    settings: data.settings ? mapSettings(data.settings) : fallbackData.settings
  };

  await redisSetJson(cacheKey, detail);
  return detail;
}

export function getProductDetail(slug: string): Promise<ProductDetailData | undefined> {
  return cacheForNext(() => getProductDetailUncached(slug), ["product-detail", slug], {
    tags: ["products", `product:${slug}`, "reviews"],
    revalidate: 60
  })();
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const detail = await getProductDetail(slug);
  return detail?.product;
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  const catalog = await getCatalog();
  return catalog.blogPosts.find((post) => post.slug === slug);
}
