import "server-only";
import { fallbackData } from "./fallbackData";
import type { BlogPost, CatalogData, Category, HeroSlide, MediaAsset, Policy, Product, Review, SiteSettings } from "./types";

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

async function fetchStrapiJson<T>({ tag, path }: FetchOptions): Promise<T | null> {
  const token = process.env.STRAPI_API_TOKEN;
  const base = process.env.STRAPI_INTERNAL_URL || process.env.NEXT_PUBLIC_STRAPI_URL;
  if (!token || !base) return null;

  const url = new URL(path, base);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
        next: { tags: [tag], revalidate: 300 }
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
  const productSlug = product ? stringField(product, "slug") : stringField(record, "productSlug");
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
    image: fallback?.image ?? fallbackData.blogPosts[0].image
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
  const productSlug = relationSlug(record, "product", stringField(record, "productSlug"));
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

export async function getCatalog(): Promise<CatalogData> {
  const [settingsResponse, categoriesResponse, productsResponse, heroSlidesResponse, postsResponse, policiesResponse, reviewsResponse] = await Promise.all([
    fetchStrapiJson<StrapiSingleResponse>({ tag: "site-settings", path: "/api/site-setting" }),
    fetchStrapiJson<StrapiListResponse>({ tag: "categories", path: "/api/categories?populate=*" }),
    fetchStrapiJson<StrapiListResponse>({ tag: "products", path: "/api/products?populate=*" }),
    fetchStrapiJson<StrapiListResponse>({ tag: "hero-slides", path: "/api/hero-slides?filters[active][$eq]=true&sort=sortOrder:asc&populate=*" }),
    fetchStrapiJson<StrapiListResponse>({ tag: "blog-posts", path: "/api/blog-posts?populate=*" }),
    fetchStrapiJson<StrapiListResponse>({ tag: "site-settings", path: "/api/policies?populate=*" }),
    fetchStrapiJson<StrapiListResponse>({ tag: "products", path: "/api/reviews?populate=*" })
  ]);

  return {
    settings: settingsResponse?.data ? mapSettings(settingsResponse.data) : fallbackData.settings,
    categories: mapList(categoriesResponse, mapCategory, fallbackData.categories),
    products: mapList(productsResponse, mapProduct, fallbackData.products),
    heroSlides: mapList(heroSlidesResponse, mapHeroSlide, fallbackData.heroSlides),
    testimonials: fallbackData.testimonials,
    faqs: fallbackData.faqs,
    blogPosts: mapList(postsResponse, mapBlogPost, fallbackData.blogPosts),
    policies: mapList(policiesResponse, mapPolicy, fallbackData.policies),
    reviews: mapList(reviewsResponse, mapReview, fallbackData.reviews)
  };
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const catalog = await getCatalog();
  return catalog.products.find((product) => product.slug === slug);
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  const catalog = await getCatalog();
  return catalog.blogPosts.find((post) => post.slug === slug);
}
