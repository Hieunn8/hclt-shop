import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPost, getCatalog } from "@/lib/cms";
import { absoluteUrl } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  return post ? { title: post.title, description: post.excerpt, alternates: { canonical: absoluteUrl(`/huong-dan/${post.slug}`) } } : {};
}

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();
  return (
    <article className="container section" style={{ maxWidth: 860 }}>
      <p style={{ color: "var(--primary)", fontWeight: 700 }}>{post.category}</p>
      <h1>{post.title}</h1>
      <p style={{ color: "var(--on-surface-variant)" }}>{post.excerpt}</p>
      <div className="glass-panel" style={{ borderRadius: 16, padding: 24, marginTop: 24 }}>
        <p>{post.content}</p>
      </div>
    </article>
  );
}
