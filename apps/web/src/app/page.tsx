import Image from "next/image";
import Link from "next/link";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { HeroCarousel } from "@/components/sections/HeroCarousel";
import { ProductExplorer } from "@/components/sections/ProductExplorer";
import { LinkButton } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";
import { getCatalog } from "@/lib/cms";

export default async function HomePage() {
  const catalog = await getCatalog();
  return (
    <>
      {catalog.heroSlides.length ? <HeroCarousel slides={catalog.heroSlides} /> : null}
      <section className="container section">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          {[
            ["8+", "Sản phẩm seed"],
            ["4.8/5", "Điểm hài lòng"],
            ["24h", "Phản hồi hỗ trợ"],
            ["100%", "CMS-driven"]
          ].map(([value, label]) => (
            <div key={label} className="glass-panel" style={{ borderRadius: 16, padding: 22, textAlign: "center" }}>
              <strong style={{ display: "block", fontSize: 30, color: "var(--tertiary)" }}>{value}</strong>
              <span style={{ color: "var(--on-surface-variant)" }}>{label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="container section">
        <header style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "end", marginBottom: 28 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 32px)" }}>Các công cụ AI hỗ trợ Content Creator</h2>
            <p style={{ color: "var(--on-surface-variant)", maxWidth: 720 }}>Danh mục sản phẩm được lấy từ CMS, có fallback seed để tránh trang trắng khi chạy lần đầu.</p>
          </div>
          <LinkButton href="/san-pham" variant="outline" className="hidden sm:inline-flex">Xem tất cả sản phẩm</LinkButton>
        </header>
        {catalog.products.length ? <ProductExplorer categories={catalog.categories} products={catalog.products.slice(0, 4)} /> : <p>Chưa có sản phẩm được xuất bản trong CMS.</p>}
      </section>
      <section className="container section">
        <h2 style={{ textAlign: "center", fontSize: "clamp(28px, 4vw, 32px)" }}>Khách hàng nói gì về chúng tôi</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {catalog.testimonials.map((item) => (
            <article key={item.id} className="glass-panel" style={{ borderRadius: 16, padding: 24 }}>
              <RatingStars value={item.rating} />
              <p style={{ color: "var(--on-surface-variant)" }}>“{item.quote}”</p>
              <strong>{item.name}</strong>
              <div style={{ color: "var(--on-surface-variant)", fontSize: 14 }}>{item.role}</div>
            </article>
          ))}
        </div>
      </section>
      <section className="container section">
        <h2 style={{ textAlign: "center", fontSize: "clamp(28px, 4vw, 32px)" }}>Câu hỏi thường gặp</h2>
        <FaqAccordion faqs={catalog.faqs} />
      </section>
      <section className="container section">
        <header style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "end", marginBottom: 28 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 32px)" }}>Kiến thức & Thủ thuật AI cho Content Creator</h2>
          </div>
          <LinkButton href="/huong-dan" variant="outline">Đọc thêm</LinkButton>
        </header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 22 }}>
          {catalog.blogPosts.map((post) => (
            <article key={post.id} className="glass-panel" style={{ borderRadius: 16, overflow: "hidden" }}>
              <Link href={`/huong-dan/${post.slug}`} style={{ position: "relative", aspectRatio: "16 / 10", display: "block" }}>
                <Image src={post.image.url} alt={post.image.alt} fill sizes="(min-width: 1024px) 33vw, 100vw" style={{ objectFit: "cover" }} />
              </Link>
              <div style={{ padding: 20 }}>
                <h3><Link href={`/huong-dan/${post.slug}`}>{post.title}</Link></h3>
                <p style={{ color: "var(--on-surface-variant)" }}>{post.excerpt}</p>
                <Link href={`/huong-dan/${post.slug}`} style={{ color: "var(--primary)", fontWeight: 700 }}>Đọc thêm</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
