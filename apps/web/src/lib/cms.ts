import "server-only";
import { fallbackData } from "./fallbackData";
import type { BlogPost, CatalogData, Product } from "./types";

type FetchOptions = {
  tag: string;
  path: string;
};

async function fetchStrapiJson<T>({ tag, path }: FetchOptions): Promise<T | null> {
  const token = process.env.STRAPI_API_TOKEN;
  const base = process.env.STRAPI_INTERNAL_URL || process.env.NEXT_PUBLIC_STRAPI_URL;
  if (!token || !base) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const url = new URL(path, base);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
        next: { tags: [tag], revalidate: 300 }
      });
      if (response.status === 404) return null;
      if (response.status >= 400 && response.status < 500) return null;
      if (!response.ok) throw new Error(`CMS ${response.status}`);
      return (await response.json()) as T;
    } catch (error) {
      if (attempt === 2) {
        console.error(JSON.stringify({ level: "warn", event: "cms_fetch_failed", tag, message: error instanceof Error ? error.message : "unknown" }));
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
    }
  }
  clearTimeout(timeout);
  return null;
}

export async function getCatalog(): Promise<CatalogData> {
  await fetchStrapiJson<unknown>({ tag: "site-settings", path: "/api/site-setting" });
  return fallbackData;
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const catalog = await getCatalog();
  return catalog.products.find((product) => product.slug === slug);
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  const catalog = await getCatalog();
  return catalog.blogPosts.find((post) => post.slug === slug);
}
