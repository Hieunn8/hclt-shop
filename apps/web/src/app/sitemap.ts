import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/cms";
import { absoluteUrl } from "@/lib/format";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog();
  const staticRoutes = ["", "/san-pham", "/bang-gia", "/huong-dan", "/lien-he"].map((path) => ({ url: absoluteUrl(path || "/") }));
  const products = catalog.products.map((product) => ({ url: absoluteUrl(`/san-pham/${product.slug}`), lastModified: product.publishedAt }));
  const posts = catalog.blogPosts.map((post) => ({ url: absoluteUrl(`/huong-dan/${post.slug}`), lastModified: post.publishedAt }));
  const policies = catalog.policies.map((policy) => ({ url: absoluteUrl(`/chinh-sach/${policy.slug}`) }));
  return [...staticRoutes, ...products, ...posts, ...policies];
}
