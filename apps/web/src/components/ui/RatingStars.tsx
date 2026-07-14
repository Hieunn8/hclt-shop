import { Star } from "lucide-react";

export function RatingStars({ value, label }: { value: number; label?: string }) {
  return (
    <span aria-label={label ?? `${value} trên 5 sao`} style={{ display: "inline-flex", gap: 2, color: "var(--rating)" }}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={16} fill={index + 1 <= Math.round(value) ? "currentColor" : "none"} aria-hidden="true" />
      ))}
    </span>
  );
}
