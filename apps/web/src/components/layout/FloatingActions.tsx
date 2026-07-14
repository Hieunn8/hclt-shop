"use client";

import { ArrowUp, MessageCircle, Phone } from "lucide-react";
import type { CSSProperties } from "react";
import type { SiteSettings } from "@/lib/types";

export function FloatingActions({ settings }: { settings: SiteSettings }) {
  return (
    <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 45, display: "grid", gap: 10 }}>
      <button aria-label="Lên đầu trang" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={actionStyle("var(--surface-container-high)", "var(--on-surface)")}>
        <ArrowUp size={20} />
      </button>
      <a aria-label="Zalo" href={settings.zaloUrl} style={actionStyle("var(--zalo)", "white")}><MessageCircle size={20} /></a>
      <a aria-label="Gọi điện" href={`tel:${settings.phone}`} style={actionStyle("var(--primary)", "var(--on-primary)")}><Phone size={20} /></a>
    </div>
  );
}

function actionStyle(background: string, color: string): CSSProperties {
  return {
    width: 48,
    height: 48,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.12)",
    background,
    color,
    display: "grid",
    placeItems: "center",
    boxShadow: "0 12px 30px rgba(0,0,0,.28)"
  };
}
