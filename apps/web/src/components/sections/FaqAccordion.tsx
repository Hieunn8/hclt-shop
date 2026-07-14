"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Faq } from "@/lib/types";

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState(faqs[0]?.id);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {faqs.map((faq) => {
        const expanded = open === faq.id;
        return (
          <section key={faq.id} className="glass-panel" style={{ borderRadius: 16, overflow: "hidden" }}>
            <button aria-expanded={expanded} onClick={() => setOpen(expanded ? "" : faq.id)} style={{ width: "100%", minHeight: 56, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--on-surface)", background: "transparent", border: 0, textAlign: "left", fontWeight: 700 }}>
              {faq.question}
              <ChevronDown size={18} style={{ transform: expanded ? "rotate(180deg)" : undefined }} />
            </button>
            {expanded ? <p style={{ margin: 0, padding: "0 20px 20px", color: "var(--on-surface-variant)" }}>{faq.answer}</p> : null}
          </section>
        );
      })}
    </div>
  );
}
