import { getCatalog } from "@/lib/cms";
import { absoluteUrl } from "@/lib/format";

export async function GET() {
  const catalog = await getCatalog();
  const items = catalog.blogPosts.map((post) => `<item><title>${post.title}</title><link>${absoluteUrl(`/huong-dan/${post.slug}`)}</link><description>${post.excerpt}</description><pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate></item>`).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>AIVisionary</title><link>${absoluteUrl("/")}</link><description>Hướng dẫn AI cho content creator</description>${items}</channel></rss>`, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" }
  });
}
