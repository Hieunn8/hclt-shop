import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="container section" style={{ minHeight: "55vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div>
        <h1>Không tìm thấy trang</h1>
        <p style={{ color: "var(--on-surface-variant)" }}>Nội dung bạn cần có thể đã được đổi đường dẫn hoặc chưa xuất bản.</p>
        <LinkButton href="/">Về trang chủ</LinkButton>
      </div>
    </section>
  );
}
