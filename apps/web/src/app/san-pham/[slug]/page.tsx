import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, MessageCircle, ShoppingBag } from "lucide-react";
import { ProductGallery } from "@/components/sections/ProductGallery";
import { ReviewForm } from "@/components/sections/ReviewForm";
import { LinkButton } from "@/components/ui/Button";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { ProductCard } from "@/components/ui/ProductCard";
import { RatingStars } from "@/components/ui/RatingStars";
import { getCatalog, getProduct, getProductDetail } from "@/lib/cms";
import { absoluteUrl } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: absoluteUrl(`/san-pham/${product.slug}`) },
    openGraph: { title: product.name, description: product.shortDescription, url: absoluteUrl(`/san-pham/${product.slug}`), images: [product.media[0]?.url ?? "/assets/og.svg"] }
  };
}

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.products.map((product) => ({ slug: product.slug }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getProductDetail(slug);
  if (!detail) notFound();
  const { product, reviews, related, settings } = detail;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.media.map((item) => absoluteUrl(item.url)),
    offers: { "@type": "Offer", price: product.price, priceCurrency: "VND", availability: "https://schema.org/InStock" },
    ...(product.reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount } } : {})
  };
  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <section className="container section">
        <nav aria-label="Breadcrumb" style={{ color: "var(--on-surface-variant)", marginBottom: 24 }}>
          <Link href="/">Trang chủ</Link> / <Link href="/san-pham">Sản phẩm</Link> / <span>{product.name}</span>
        </nav>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.08fr) minmax(320px, .92fr)", gap: 40, alignItems: "start" }} className="product-detail-grid">
          <ProductGallery media={product.media} />
          <aside className="glass-panel" style={{ borderRadius: 20, padding: 24, display: "grid", gap: 16 }}>
            <RatingStars value={product.rating} label={`${product.rating} sao`} />
            <h1 style={{ margin: 0, fontSize: "clamp(34px, 5vw, 48px)", lineHeight: 1.1 }}>{product.name}</h1>
            <p style={{ color: "var(--on-surface-variant)", fontSize: 18 }}>{product.shortDescription}</p>
            <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} />
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <LinkButton href={product.purchaseUrl ?? "/lien-he"}><ShoppingBag size={18} /> Mua ngay</LinkButton>
              <LinkButton href={product.zaloUrl ?? settings.zaloUrl} variant="zalo"><MessageCircle size={18} /> Zalo</LinkButton>
              <button style={{ minHeight: 44, borderRadius: 12, border: "1px solid var(--outline-variant)", background: "var(--surface-container)", color: "var(--on-surface)", paddingInline: 14 }}><Copy size={16} /> Copy link</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
              {product.features.map((feature) => <div key={feature} style={{ borderRadius: 12, background: "var(--surface-container-high)", padding: 12 }}>{feature}</div>)}
            </div>
          </aside>
        </div>
      </section>
      <section className="container section">
        <h2>Giới thiệu {product.name}</h2>
        <p style={{ color: "var(--on-surface-variant)", maxWidth: 880 }}>{product.description}</p>
      </section>
      <section className="container section">
        <h2 style={{ textAlign: "center" }}>Hướng dẫn sử dụng chỉ trong 4 bước</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          {product.usageSteps.map((step, index) => <div key={step} className="glass-panel" style={{ borderRadius: 16, padding: 20 }}><strong style={{ color: "var(--tertiary)" }}>0{index + 1}</strong><p>{step}</p></div>)}
        </div>
      </section>
      {related.length ? <section className="container section"><h2>Sản phẩm liên quan</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section> : null}
      <section className="container section">
        <h2>Đánh giá từ khách hàng ({reviews.length} đánh giá)</h2>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, .8fr) minmax(0, 1.2fr)", gap: 24 }} className="review-grid">
          <ReviewForm productSlug={product.slug} />
          <div style={{ display: "grid", gap: 14 }}>
            {reviews.length ? reviews.map((review) => <article key={review.id} className="glass-panel" style={{ borderRadius: 16, padding: 18 }}><RatingStars value={review.rating} /><p>{review.comment}</p><strong>{review.name}</strong></article>) : <p>Sản phẩm chưa có đánh giá. Hãy là người đầu tiên đánh giá.</p>}
          </div>
        </div>
      </section>
      <div className="mobile-sticky-cta"><LinkButton href={product.purchaseUrl ?? "/lien-he"}>Mua ngay</LinkButton><LinkButton href={product.zaloUrl ?? settings.zaloUrl} variant="zalo">Zalo</LinkButton></div>
    </>
  );
}
