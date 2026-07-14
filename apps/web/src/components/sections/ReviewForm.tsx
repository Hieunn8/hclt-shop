"use client";

import { useState, type CSSProperties } from "react";
import { Button } from "../ui/Button";

export function ReviewForm({ productSlug }: { productSlug: string }) {
  const [status, setStatus] = useState<string>("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...data, productSlug })
    });
    const payload = (await response.json()) as { message?: string };
    setStatus(payload.message ?? (response.ok ? "Đã gửi đánh giá." : "Không gửi được đánh giá."));
    if (response.ok) form.reset();
  }

  return (
    <form onSubmit={submit} className="glass-panel" style={{ borderRadius: 16, padding: 20, display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>Gửi đánh giá</h3>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
      <label style={fieldStyle}>Họ tên<input required name="name" minLength={2} style={inputStyle} /></label>
      <label style={fieldStyle}>Email<input required name="email" type="email" style={inputStyle} /></label>
      <label style={fieldStyle}>Đánh giá<select required name="rating" defaultValue="5" style={inputStyle}><option value="5">5 sao</option><option value="4">4 sao</option><option value="3">3 sao</option><option value="2">2 sao</option><option value="1">1 sao</option></select></label>
      <label style={fieldStyle}>Bình luận<textarea required name="comment" minLength={10} rows={4} style={inputStyle} /></label>
      <Button type="submit">Gửi duyệt đánh giá</Button>
      {status ? <p role="status" style={{ margin: 0, color: "var(--primary)" }}>{status}</p> : null}
    </form>
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
