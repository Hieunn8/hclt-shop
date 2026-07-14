"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { MediaAsset } from "@/lib/types";

export function ProductGallery({ media }: { media: MediaAsset[] }) {
  const [active, setActive] = useState(media[0]);
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ position: "relative", aspectRatio: "4 / 3", borderRadius: 20, overflow: "hidden", background: "var(--surface-container-high)" }}>
        {active.type === "video" ? (
          <button style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", border: 0, background: "var(--primary-gradient)", color: "white", fontSize: 18, fontWeight: 800 }}>
            <Play size={40} /> Phát video demo
          </button>
        ) : (
          <Image src={active.url} alt={active.alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" style={{ objectFit: "cover" }} />
        )}
      </div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
        {media.map((item) => (
          <button key={`${item.url}-${item.alt}`} onClick={() => setActive(item)} aria-label={`Xem ${item.alt}`} style={{ flex: "0 0 88px", height: 66, borderRadius: 10, border: active.url === item.url ? "2px solid var(--primary)" : "1px solid var(--outline-variant)", overflow: "hidden", position: "relative", background: "var(--surface-container)" }}>
            <Image src={item.url} alt="" fill sizes="88px" style={{ objectFit: "cover" }} />
            {item.type === "video" ? <Play size={18} style={{ position: "absolute", inset: 0, margin: "auto", color: "white" }} /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
