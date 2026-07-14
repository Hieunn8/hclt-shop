import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/cms";

export const metadata: Metadata = { title: "Hướng dẫn", description: "Blog và hướng dẫn dùng AI cho content creator." };

export default async function BlogListPage() {
  const catalog = await getCatalog();
  return (
    <section className="container section">
      <h1>Hướng dẫn</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22 }}>
        {catalog.blogPosts.map((post) => (
          <article key={post.id} className="glass-panel" style={{ borderRadius: 16, overflow: "hidden" }}>
            <Link href={`/huong-dan/${post.slug}`} style={{ position: "relative", aspectRatio: "16 / 10", display: "block" }}><Image src={post.image.url} alt={post.image.alt} fill sizes="33vw" style={{ objectFit: "cover" }} /></Link>
            <div style={{ padding: 20 }}><h2><Link href={`/huong-dan/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}
