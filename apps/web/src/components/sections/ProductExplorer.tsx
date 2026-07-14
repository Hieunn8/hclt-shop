"use client";

import { Search } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "../ui/ProductCard";

export function ProductExplorer({ categories, products, initialCategory = "all", initialQuery = "" }: { categories: Category[]; products: Product[]; initialCategory?: string; initialQuery?: string }) {
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchCategory = category === "all" || product.categorySlug === category;
      const text = `${product.name} ${product.shortDescription}`.toLowerCase();
      return matchCategory && text.includes(query.toLowerCase().trim());
    });
  }, [category, products, query]);

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          <button onClick={() => setCategory("all")} style={chipStyle(category === "all")}>Tất cả</button>
          {categories.map((item) => <button key={item.slug} onClick={() => setCategory(item.slug)} style={chipStyle(category === item.slug)}>{item.name}</button>)}
        </div>
        <label className="glass-panel" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 999, padding: "10px 14px", minWidth: 260 }}>
          <Search size={18} />
          <span className="sr-only">Tìm sản phẩm</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm công cụ..." style={{ border: 0, outline: 0, background: "transparent", color: "var(--on-surface)", width: "100%" }} />
        </label>
      </div>
      {filtered.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 16, padding: 32, textAlign: "center" }}>
          Không tìm thấy sản phẩm phù hợp.
          <button onClick={() => { setCategory("all"); setQuery(""); }} style={{ marginLeft: 12, color: "var(--primary)", fontWeight: 700 }}>Đặt lại bộ lọc</button>
        </div>
      )}
    </div>
  );
}

function chipStyle(active: boolean): CSSProperties {
  return {
    minHeight: 44,
    borderRadius: 999,
    paddingInline: 18,
    border: active ? "1px solid var(--primary)" : "1px solid var(--outline-variant)",
    background: active ? "var(--primary-container)" : "var(--surface-container)",
    color: active ? "white" : "var(--on-surface-variant)",
    fontWeight: 700,
    whiteSpace: "nowrap"
  };
}
