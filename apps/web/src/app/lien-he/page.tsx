"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  return (
    <Suspense fallback={<section className="container section">Đang tải form...</section>}>
      <ContactForm />
    </Suspense>
  );
}

function ContactForm() {
  const params = useSearchParams();
  const [status, setStatus] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form)))
    });
    const payload = (await response.json()) as { message?: string };
    setStatus(payload.message ?? (response.ok ? "Đã gửi liên hệ." : "Không gửi được liên hệ."));
    if (response.ok) form.reset();
  }

  return (
    <section className="container section" style={{ maxWidth: 900 }}>
      <h1>Liên hệ</h1>
      <p style={{ color: "var(--on-surface-variant)" }}>Gửi nhu cầu của bạn. Nếu thiếu API email, hệ thống vẫn ghi nhận fallback ở server log mà không chặn dự án.</p>
      <form aria-label="Form liên hệ" onSubmit={submit} className="glass-panel" style={{ borderRadius: 20, padding: 24, display: "grid", gap: 14 }}>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
        <label style={fieldStyle}>Họ tên<input required name="name" minLength={2} style={inputStyle} /></label>
        <label style={fieldStyle}>Email<input required name="email" type="email" style={inputStyle} /></label>
        <label style={fieldStyle}>Số điện thoại<input name="phone" style={inputStyle} /></label>
        <label style={fieldStyle}>Chủ đề<input name="topic" defaultValue={params.get("product") ?? ""} style={inputStyle} /></label>
        <label style={fieldStyle}>Nội dung<textarea required name="message" minLength={10} rows={6} style={inputStyle} /></label>
        <Button type="submit">Gửi liên hệ</Button>
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
