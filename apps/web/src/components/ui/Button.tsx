import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "zalo";

const variantClass: Record<Variant, string> = {
  primary: "primary-gradient text-white shadow-[0_10px_30px_rgba(103,80,164,.35)]",
  secondary: "bg-[var(--surface-container-high)] text-[var(--on-surface)] border border-[var(--outline-variant)]",
  ghost: "text-[var(--on-surface-variant)] hover:text-[var(--primary)]",
  outline: "border border-[var(--outline-variant)] text-[var(--on-surface)] hover:border-[var(--primary)]",
  zalo: "bg-[var(--zalo)] text-white"
};

const base = "app-button";

export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variantClass[variant]} ${className}`} {...props} />;
}

export function LinkButton({ variant = "primary", className = "", children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant; children: ReactNode }) {
  return (
    <Link className={`${base} ${variantClass[variant]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
