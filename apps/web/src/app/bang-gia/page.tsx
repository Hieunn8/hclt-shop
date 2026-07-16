import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { getCatalog } from "@/lib/cms";

export const metadata: Metadata = { title: "Bang gia", description: "Bang gia san pham AIVisionary hien thi bang VND." };

export default async function PricingPage() {
  const catalog = await getCatalog();
  return (
    <section className="container section">
      <h1>{catalog.settings.pricingTitle}</h1>
      <p style={{ color: "var(--on-surface-variant)", maxWidth: 760 }}>{catalog.settings.pricingDescription}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginTop: 24 }}>
        {catalog.products.map((product) => (
          <article key={product.id} className="glass-panel" style={{ borderRadius: 16, padding: 22 }}>
            <h2>{product.name}</h2>
            <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} />
            <p style={{ color: "var(--on-surface-variant)" }}>{product.shortDescription}</p>
            <LinkButton href={`/san-pham/${product.slug}`}>Xem goi</LinkButton>
          </article>
        ))}
      </div>
    </section>
  );
}
