import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { LinkButton } from "./Button";
import { PriceDisplay } from "./PriceDisplay";
import { RatingStars } from "./RatingStars";

export function ProductCard({ product }: { product: Product }) {
  const image = product.media[0];
  return (
    <article className="glass-panel" style={{ borderRadius: 16, overflow: "hidden", display: "grid", minHeight: "100%" }}>
      <a href={`/san-pham/${product.slug}`} style={{ aspectRatio: "4 / 3", position: "relative", overflow: "hidden", background: "var(--surface-container-high)" }}>
        <Image src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" style={{ objectFit: "cover" }} />
      </a>
      <div style={{ padding: 20, display: "grid", gap: 12 }}>
        {product.badge ? <span style={{ color: "var(--primary)", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>{product.badge}</span> : null}
        <h3 style={{ margin: 0, fontSize: 20, lineHeight: 1.25 }}>
          <a href={`/san-pham/${product.slug}`}>{product.name}</a>
        </h3>
        <p style={{ margin: 0, color: "var(--on-surface-variant)" }}>{product.shortDescription}</p>
        <RatingStars value={product.rating} label={`${product.rating} sao từ ${product.reviewCount} đánh giá`} />
        <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} />
        <LinkButton href={`/san-pham/${product.slug}`} className="w-full">
          <ShoppingBag size={18} /> Mua ngay
        </LinkButton>
      </div>
    </article>
  );
}
