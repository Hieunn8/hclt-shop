import { formatVnd } from "@/lib/format";

export function PriceDisplay({ price, compareAtPrice }: { price: number; compareAtPrice?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
      <strong style={{ color: "var(--tertiary)", fontSize: 24 }}>{formatVnd(price)}</strong>
      {compareAtPrice ? <span style={{ color: "var(--on-surface-variant)", textDecoration: "line-through" }}>{formatVnd(compareAtPrice)}</span> : null}
    </div>
  );
}
