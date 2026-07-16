"use client";

import { useSearchParams } from "next/navigation";
import { useState, type CSSProperties, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { SiteSettings } from "@/lib/types";

type ContactFormProps = {
  settings: Pick<SiteSettings, "contactTitle" | "contactDescription" | "contactSubmitLabel">;
};

export function ContactForm({ settings }: ContactFormProps) {
  const params = useSearchParams();
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    const payload = (await response.json()) as { message?: string };
    setStatus(payload.message ?? (response.ok ? "Da gui lien he." : "Khong gui duoc lien he."));
    if (response.ok) form.reset();
  }

  return (
    <section className="container section" style={{ maxWidth: 900 }}>
      <h1>{settings.contactTitle}</h1>
      <p style={{ color: "var(--on-surface-variant)" }}>{settings.contactDescription}</p>
      <form aria-label="Form lien he" onSubmit={submit} className="glass-panel" style={{ borderRadius: 20, padding: 24, display: "grid", gap: 14 }}>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
        <label style={fieldStyle}>Ho ten<input required name="name" minLength={2} style={inputStyle} /></label>
        <label style={fieldStyle}>Email<input required name="email" type="email" style={inputStyle} /></label>
        <label style={fieldStyle}>So dien thoai<input name="phone" style={inputStyle} /></label>
        <label style={fieldStyle}>Chu de<input name="topic" defaultValue={params.get("product") ?? ""} style={inputStyle} /></label>
        <label style={fieldStyle}>Noi dung<textarea required name="message" minLength={10} rows={6} style={inputStyle} /></label>
        <Button type="submit">{settings.contactSubmitLabel}</Button>
        {status ? <p role="status" style={{ color: "var(--primary)" }}>{status}</p> : null}
      </form>
    </section>
  );
}

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  borderRadius: 10,
  border: "1px solid var(--outline-variant)",
  background: "var(--surface-container-low)",
  color: "var(--on-surface)",
  padding: "12px 14px"
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  fontWeight: 700
};
