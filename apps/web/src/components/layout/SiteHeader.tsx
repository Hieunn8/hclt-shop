"use client";

import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { LinkButton } from "../ui/Button";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/bang-gia", label: "Bảng giá" },
  { href: "/huong-dan", label: "Hướng dẫn" },
  { href: "/lien-he", label: "Liên hệ" }
];

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/san-pham${params.size ? `?${params.toString()}` : ""}`);
    setOpen(false);
  }

  return (
    <>
      {settings.promo.active ? (
        <a href={settings.promo.href ?? "/bang-gia"} style={{ display: "block", background: "var(--primary-gradient)", color: "white", height: 32, overflow: "hidden", textAlign: "center", fontSize: 12, fontWeight: 700, letterSpacing: ".05em", lineHeight: "32px", textTransform: "uppercase" }}>
          {settings.promo.text}
        </a>
      ) : null}
      <header className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: "flex", minHeight: 76, alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, fontWeight: 800, color: "var(--primary)" }} aria-label="AIVisionary trang chủ">
            <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 12, background: "var(--primary-gradient)", boxShadow: "0 10px 28px rgba(103,80,164,.35)" }} />
            <span>AIVisionary</span>
          </Link>
          <nav aria-label="Chính" style={{ display: "flex", gap: 28 }} className="hidden md:flex">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} style={{ color: active ? "var(--primary)" : "var(--on-surface-variant)", borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent", paddingBlock: 8, fontWeight: active ? 700 : 600 }}>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <form onSubmit={submitSearch} className="hidden lg:flex glass-panel" style={{ alignItems: "center", gap: 8, borderRadius: 999, paddingInline: 14, height: 44 }}>
              <Search size={18} color="var(--on-surface-variant)" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm công cụ..." aria-label="Tìm công cụ" style={{ width: 180, border: 0, outline: 0, background: "transparent", color: "var(--on-surface)" }} />
            </form>
            <ThemeToggle />
            <LinkButton href="/lien-he" className="hidden sm:inline-flex">Liên hệ ngay</LinkButton>
            <button aria-label="Mở menu" className="md:hidden" onClick={() => setOpen(true)} style={{ minWidth: 44, minHeight: 44, borderRadius: 999, border: "1px solid var(--outline-variant)", background: "var(--surface-container)", color: "var(--on-surface)" }}>
              <Menu size={20} style={{ margin: "auto" }} />
            </button>
          </div>
        </div>
      </header>
      {open ? (
        <div role="dialog" aria-modal="true" aria-label="Menu điều hướng" style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,.48)" }} onKeyDown={(event) => event.key === "Escape" && setOpen(false)}>
          <aside className="glass-panel" style={{ width: "min(320px, 88vw)", marginLeft: "auto", minHeight: "100%", padding: 20, display: "grid", alignContent: "start", gap: 20 }}>
            <button autoFocus aria-label="Đóng menu" onClick={() => setOpen(false)} style={{ justifySelf: "end", minWidth: 44, minHeight: 44, borderRadius: 999, border: "1px solid var(--outline-variant)", background: "var(--surface-container)", color: "var(--on-surface)" }}>
              <X size={20} style={{ margin: "auto" }} />
            </button>
            <form onSubmit={submitSearch} className="glass-panel" style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 12, padding: 12 }}>
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm công cụ..." aria-label="Tìm công cụ" style={{ width: "100%", border: 0, outline: 0, background: "transparent", color: "var(--on-surface)" }} />
            </form>
            <nav style={{ display: "grid", gap: 4 }}>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={{ minHeight: 48, display: "flex", alignItems: "center", color: pathname === item.href ? "var(--primary)" : "var(--on-surface)", fontWeight: 700 }}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <LinkButton href="/lien-he" onClick={() => setOpen(false)} className="w-full">Liên hệ ngay</LinkButton>
          </aside>
        </div>
      ) : null}
    </>
  );
}
