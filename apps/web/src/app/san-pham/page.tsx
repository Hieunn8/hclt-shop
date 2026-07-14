import type { Metadata } from "next";
import { ProductExplorer } from "@/components/sections/ProductExplorer";
import { getCatalog } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Sản phẩm",
  description: "Danh sách công cụ AI cho content creator, video workflow và voice automation."
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const [catalog, params] = await Promise.all([getCatalog(), searchParams]);
  return (
    <section className="container section">
      <h1 style={{ fontSize: "clamp(34px, 5vw, 48px)", lineHeight: 1.1 }}>Sản phẩm</h1>
      <p style={{ color: "var(--on-surface-variant)", maxWidth: 760 }}>Tìm, lọc và chọn công cụ AI phù hợp. CTA mua hàng dùng luồng liên hệ hoặc URL mua hàng do CMS khai báo.</p>
      <ProductExplorer categories={catalog.categories} products={catalog.products} initialCategory={params.category ?? "all"} initialQuery={params.q ?? ""} />
    </section>
  );
}
