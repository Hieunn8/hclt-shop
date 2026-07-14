import { Facebook, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer style={{ borderTop: "1px solid var(--outline-variant)", background: "var(--surface-container-low)" }}>
      <div className="container" style={{ paddingBlock: 48, display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div>
          <strong style={{ color: "var(--primary)", fontSize: 24 }}>AIVisionary</strong>
          <p style={{ color: "var(--on-surface-variant)" }}>{settings.description}</p>
        </div>
        <div>
          <h2 style={{ fontSize: 16 }}>Chính sách</h2>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10, color: "var(--on-surface-variant)" }}>
            <li><Link href="/chinh-sach/bao-mat">Chính sách bảo mật</Link></li>
            <li><Link href="/chinh-sach/dieu-khoan">Điều khoản dịch vụ</Link></li>
            <li><Link href="/chinh-sach/hoan-tien">Chính sách hoàn tiền</Link></li>
          </ul>
        </div>
        <div>
          <h2 style={{ fontSize: 16 }}>Thanh toán</h2>
          <p style={{ color: "var(--on-surface-variant)" }}>Momo, chuyển khoản ngân hàng và liên hệ thủ công theo cấu hình CMS.</p>
        </div>
        <div>
          <h2 style={{ fontSize: 16 }}>Liên hệ</h2>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10, color: "var(--on-surface-variant)" }}>
            <li><a href={`tel:${settings.phone}`}><Phone size={15} /> {settings.phone}</a></li>
            <li><a href={settings.zaloUrl}><MessageCircle size={15} /> Zalo hỗ trợ</a></li>
            <li><a href={settings.facebookUrl}><Facebook size={15} /> Facebook Fanpage</a></li>
            <li><a href={`mailto:${settings.email}`}><Mail size={15} /> {settings.email}</a></li>
            <li><span><MapPin size={15} /> {settings.address}</span></li>
          </ul>
        </div>
      </div>
      <div className="container" style={{ paddingBlock: 18, color: "var(--on-surface-variant)", borderTop: "1px solid var(--outline-variant)" }}>
        © 2026 AIVisionary. All rights reserved.
      </div>
    </footer>
  );
}
