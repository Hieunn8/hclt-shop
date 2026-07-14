"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, type CSSProperties } from "react";
import type { HeroSlide } from "@/lib/types";
import { LinkButton } from "../ui/Button";

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5500, stopOnInteraction: true })]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section aria-roledescription="carousel" aria-label="Sản phẩm nổi bật" style={{ paddingTop: 48 }}>
      <div className="container">
        <div className="glass-panel" style={{ position: "relative", borderRadius: 24, overflow: "hidden" }}>
          <div ref={emblaRef} style={{ overflow: "hidden" }}>
            <div style={{ display: "flex" }}>
              {slides.map((slide, index) => (
                <article key={slide.id} style={{ minWidth: "100%", minHeight: 520, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 48%)", alignItems: "center", gap: 32, padding: "56px clamp(20px, 6vw, 72px)" }} className="hero-slide">
                  <div style={{ display: "grid", gap: 20 }}>
                    {index === 0 ? (
                      <h1 style={{ margin: 0, maxWidth: 680, fontSize: "clamp(36px, 5vw, 48px)", lineHeight: 1.1, letterSpacing: "-.02em" }}>{slide.title}</h1>
                    ) : (
                      <h2 style={{ margin: 0, maxWidth: 680, fontSize: "clamp(36px, 5vw, 48px)", lineHeight: 1.1, letterSpacing: "-.02em" }}>{slide.title}</h2>
                    )}
                    <p style={{ maxWidth: 560, color: "var(--on-surface-variant)", fontSize: 18 }}>{slide.description}</p>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <LinkButton href={`/san-pham/${slide.productSlug}`}>Xem chi tiết</LinkButton>
                      <LinkButton href="/lien-he" variant="outline">Liên hệ tư vấn</LinkButton>
                    </div>
                  </div>
                  <div style={{ aspectRatio: "4 / 3", position: "relative", borderRadius: 20, overflow: "hidden", background: "var(--surface-container-high)", boxShadow: "0 28px 80px rgba(0,0,0,.35)" }}>
                    <Image src={slide.image.url} alt={slide.image.alt} fill priority={slide.id === slides[0]?.id} sizes="(min-width: 1024px) 48vw, 100vw" style={{ objectFit: "cover" }} />
                  </div>
                </article>
              ))}
            </div>
          </div>
          <button aria-label="Slide trước" onClick={scrollPrev} style={navStyle("left")}><ChevronLeft /></button>
          <button aria-label="Slide tiếp theo" onClick={scrollNext} style={navStyle("right")}><ChevronRight /></button>
        </div>
      </div>
    </section>
  );
}

function navStyle(side: "left" | "right"): CSSProperties {
  return {
    position: "absolute",
    [side]: 16,
    top: "50%",
    transform: "translateY(-50%)",
    width: 48,
    height: 48,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(0,0,0,.42)",
    color: "white",
    display: "grid",
    placeItems: "center"
  };
}
