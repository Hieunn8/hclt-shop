import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/cms";

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.policies.map((policy) => ({ slug: policy.slug }));
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const policy = catalog.policies.find((item) => item.slug === slug);
  if (!policy) notFound();
  return <article className="container section" style={{ maxWidth: 860 }}><h1>{policy.title}</h1><div className="glass-panel" style={{ borderRadius: 16, padding: 24 }}><p>{policy.content}</p></div></article>;
}
