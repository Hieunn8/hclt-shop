# AIVisionary — Agent-Ready Design & Implementation Specification

**Phiên bản:** 1.0  
**Mục tiêu:** Đặc tả đủ chi tiết để AI coding agent tự triển khai từ đầu đến cuối website AIVisionary gồm Frontend Next.js, Headless CMS, PostgreSQL, Docker, Nginx, SSL, seed data, kiểm thử, tài liệu vận hành và script triển khai; agent không được hỏi lại người dùng khi gặp chi tiết chưa được chỉ định mà phải tuân theo các quy tắc mặc định trong tài liệu này.

---

## 0. Chỉ thị bắt buộc dành cho AI Agent

1. Đọc toàn bộ tài liệu trước khi tạo hoặc sửa mã nguồn.
2. Hai file thiết kế HTML được coi là **nguồn sự thật về giao diện**:
   - `home.html`: trang chủ.
   - `detail.html`: trang chi tiết sản phẩm.
3. Không sao chép nguyên HTML Stitch vào production. Phải chuyển thành component React/Next.js có dữ liệu động từ CMS.
4. Không dùng Tailwind CDN, script inline, `onclick`, URL ảnh tạm của Stitch hoặc Material Symbols CDN trong production.
5. Dùng `lucide-react` cho icon; nếu icon không có tương đương chính xác thì chọn icon gần nhất theo bảng mapping trong tài liệu.
6. Không hard-code nội dung nghiệp vụ, giá, ảnh, liên hệ, banner, FAQ, review, bài blog hay menu footer trong component. Nội dung phải lấy từ CMS, trừ nhãn UI cố định.
7. Không hỏi lại về các lựa chọn nhỏ. Khi tài liệu chưa chỉ định, dùng thứ tự ưu tiên:
   - An toàn và khả năng rollback.
   - Tính đúng với thiết kế.
   - SEO và accessibility.
   - Hiệu năng.
   - Giải pháp đơn giản, ít phụ thuộc.
8. Không dùng DB production cho local test hoặc automated test. Production DB chỉ được kết nối khi chạy profile production và có biến `ALLOW_PRODUCTION_DB=true`.
9. Không commit secret, mật khẩu, token, file `.env`, private key hay database dump vào Git.
10. Mỗi phase phải tự chạy kiểm tra. Agent chỉ được đánh dấu hoàn thành khi toàn bộ Definition of Done đạt.
11. Nếu một tính năng phụ thuộc dịch vụ ngoài chưa có API key, phải triển khai adapter, UI fallback và `.env.example`; không được chặn toàn bộ dự án.
12. Giai đoạn 1 không triển khai tài khoản khách hàng, giỏ hàng hoặc thanh toán tự động thật. Icon giỏ hàng/tài khoản trong bản Stitch phải được ẩn. CTA mua hàng dùng luồng liên hệ/Zalo hoặc URL mua hàng do CMS khai báo.
13. Ngôn ngữ mặc định là tiếng Việt. Các nhãn tiếng Anh trong bản thiết kế phải được Việt hóa theo bảng copy trong tài liệu.
14. Tiền tệ mặc định là VND. Dữ liệu giá mẫu có thể quy đổi từ mockup nhưng giao diện production phải hiển thị bằng `vi-VN`, `VND`.
15. Agent phải tạo báo cáo cuối cùng `IMPLEMENTATION_REPORT.md`, gồm: phần đã làm, lệnh chạy, URL, test result, Lighthouse result, migration/seed result, các biến môi trường còn cần cấu hình.

---

## 1. Phạm vi sản phẩm

### 1.1. Phạm vi bắt buộc

- Trang chủ theo thiết kế Stitch.
- Trang danh sách sản phẩm.
- Trang chi tiết sản phẩm theo thiết kế Stitch.
- Trang bảng giá.
- Trang danh sách blog/hướng dẫn.
- Trang chi tiết bài blog.
- Trang liên hệ.
- Trang chính sách động.
- Headless CMS cho toàn bộ nội dung.
- Quản lý và xuất bản bài blog trong CMS.
- Gửi đánh giá sản phẩm, admin duyệt trước khi hiển thị.
- Form liên hệ có chống spam và email adapter.
- SEO, sitemap, robots, structured data.
- Docker Compose production.
- Nginx reverse proxy và HTTPS.
- Script install, deploy, update, rollback, health check, backup, restore.
- Seed data để hệ thống không hiển thị trang trắng sau lần chạy đầu.
- Unit test, integration test và Playwright E2E cho luồng chính.

### 1.2. Ngoài phạm vi giai đoạn 1

- Đăng ký/đăng nhập khách hàng.
- Giỏ hàng nhiều sản phẩm.
- Order management và thanh toán tự động.
- Giao key tự động.
- Loyalty, coupon phức tạp.
- Marketplace nhiều vendor.

Các thành phần này phải được thiết kế có thể mở rộng nhưng không triển khai UI giả gây hiểu nhầm.

---

## 2. Kiến trúc kỹ thuật bắt buộc

### 2.1. Stack

| Layer | Công nghệ bắt buộc |
|---|---|
| Frontend | Next.js 15.x App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS 4 hoặc bản stable tương thích Next.js 15 |
| UI primitive | Radix UI hoặc shadcn/ui pattern, không phụ thuộc theme có sẵn |
| Icon | `lucide-react` |
| Carousel | `embla-carousel-react` + autoplay plugin |
| Theme | `next-themes` |
| Validation | Zod |
| CMS | Strapi 5.x self-hosted |
| Database | PostgreSQL 15+ |
| Rich text | Strapi Blocks + `@strapi/blocks-react-renderer` |
| Email | Adapter Resend; SMTP fallback qua Nodemailer |
| Test frontend | Vitest + Testing Library + Playwright |
| Deployment | Docker Compose v2, Nginx, Certbot |
| Package manager | pnpm, lockfile bắt buộc |
| Node | 22 LTS |

### 2.2. Sơ đồ runtime

```text
Internet
  |
  v
Nginx :80/:443
  |-- hieuchanlaptrinh.top --------> frontend:3000 (Next.js standalone)
  |-- cms.hieuchanlaptrinh.top ----> cms:1337 (Strapi)
                                      |
                                      v
                              PostgreSQL remote

Optional media provider:
Strapi -> Cloudinary/S3-compatible
Fallback: persistent local volume mounted at /opt/aivisionary/data/uploads
```

### 2.3. Nguyên tắc dữ liệu

- Next.js chỉ đọc Strapi bằng API token server-side.
- Browser không bao giờ nhận `STRAPI_API_TOKEN`.
- Review và contact đi qua Next.js Route Handler.
- Strapi public role chỉ được đọc nội dung đã publish; không cho phép public create trực tiếp.
- Tất cả mutation từ frontend phải có Zod validation, rate limit và honeypot.
- Cache dùng Next.js `fetch` tags + on-demand revalidation.

---

## 3. Điều kiện hạ tầng và cấu hình theo VPS

### 3.1. Tài nguyên hiện tại

- CPU hiện gần như nhàn rỗi.
- RAM: khoảng 7.5 GiB tổng, trên 5.6 GiB khả dụng.
- Swap: chưa có.

### 3.2. Kết luận triển khai

VPS đủ chạy đồng thời Next.js, Strapi, Nginx và dịch vụ phụ nhẹ. PostgreSQL đang ở host riêng nên không chạy container PostgreSQL trên VPS production.

### 3.3. Giới hạn tài nguyên Docker

```yaml
frontend:
  mem_limit: 768m
  mem_reservation: 256m
  cpus: 1.0

cms:
  mem_limit: 1536m
  mem_reservation: 512m
  cpus: 1.5

nginx:
  mem_limit: 256m
  mem_reservation: 64m
  cpus: 0.5
```

- Build production không chạy đồng thời frontend và CMS nếu RAM thực tế thấp hơn 4 GiB available.
- Docker image phải build multi-stage.
- Next.js dùng `output: 'standalone'`.
- Strapi build admin trong image build stage, không build lại khi container start.
- Khuyến nghị tạo swap file 2 GiB để tránh OOM trong lúc build; script `install-server.sh` chỉ tạo nếu máy chưa có swap và biến `CREATE_SWAP=true`.

### 3.4. Database production

Biến môi trường production:

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=13.140.130.137
DATABASE_PORT=5432
DATABASE_NAME=onlineshopdb
DATABASE_USERNAME=onlineshop
DATABASE_PASSWORD=<SET_ON_SERVER_ONLY>
DATABASE_SSL=false
ALLOW_PRODUCTION_DB=true
```

**Bắt buộc:** mật khẩu đã xuất hiện trong hội thoại phải được thay đổi trước go-live. Spec và repository không lưu lại mật khẩu thật.

---

## 4. Cấu trúc repository

```text
aivisionary/
├─ apps/
│  ├─ web/                         # Next.js
│  └─ cms/                         # Strapi
├─ packages/
│  ├─ config-eslint/
│  ├─ config-typescript/
│  └─ shared-types/                # types và constants dùng chung khi phù hợp
├─ deploy/
│  ├─ docker-compose.yml
│  ├─ docker-compose.dev.yml
│  ├─ nginx/
│  │  ├─ nginx.conf
│  │  └─ conf.d/
│  │     ├─ frontend.conf
│  │     └─ cms.conf
│  ├─ certbot/
│  └─ env/
│     ├─ frontend.env.example
│     └─ cms.env.example
├─ scripts/
│  ├─ bootstrap.sh
│  ├─ install-server.sh
│  ├─ deploy.sh
│  ├─ update.sh
│  ├─ rollback.sh
│  ├─ healthcheck.sh
│  ├─ backup-db.sh
│  ├─ restore-db.sh
│  ├─ seed-cms.ts
│  ├─ verify-env.sh
│  └─ smoke-test.sh
├─ tests/
│  └─ e2e/
├─ docs/
│  ├─ OPERATIONS.md
│  ├─ CONTENT_GUIDE.md
│  ├─ SECURITY.md
│  └─ ARCHITECTURE.md
├─ .github/workflows/ci.yml
├─ .editorconfig
├─ .gitignore
├─ .env.example
├─ Makefile
├─ pnpm-workspace.yaml
├─ package.json
├─ README.md
└─ IMPLEMENTATION_REPORT.md
```

---

## 5. Design source và nguyên tắc chuyển đổi

### 5.1. Màn hình nguồn

- **Trang chủ**: marquee, fixed header, hero carousel, trust stats, category tabs, product cards, testimonials, FAQ, blog cards, footer và floating actions.
- **Chi tiết sản phẩm**: breadcrumb, gallery/video, thông tin mua hàng, social share, feature summary, rich description, usage steps, related products, reviews và review form.

### 5.2. Quy tắc fidelity

- Desktop pixel fidelity mục tiêu: sai lệch bố cục trung bình không quá 8 px tại viewport 1440 px.
- Font, màu, radius, spacing, shadow và glass effect phải xuất phát từ token, không gắn số ngẫu nhiên từng component.
- HTML Stitch chỉ là reference. Phải sửa các lỗi semantic, responsive, accessibility và copy.
- Tất cả liên kết `href="#"` phải được thay bằng route/action thật.
- Ảnh mockup Google tạm phải được tải về seed media hoặc thay bằng asset có quyền sử dụng. Không hotlink URL Stitch production.

---

## 6. Design tokens

### 6.1. Color tokens — dark theme mặc định

```css
--background: #141218;
--surface: #141218;
--surface-dim: #141218;
--surface-container-lowest: #0f0d13;
--surface-container-low: #1d1b20;
--surface-container: #211f24;
--surface-container-high: #2b292f;
--surface-container-highest: #36343a;
--surface-bright: #3b383e;
--surface-variant: #36343a;

--on-background: #e6e0e9;
--on-surface: #e6e0e9;
--on-surface-variant: #cbc4d2;
--outline: #948e9c;
--outline-variant: #494551;

--primary: #cfbcff;
--on-primary: #381e72;
--primary-container: #6750a4;
--on-primary-container: #e0d2ff;
--primary-fixed: #e9ddff;
--primary-fixed-dim: #cfbcff;

--secondary: #cdc0e9;
--secondary-container: #4d4465;
--on-secondary-container: #bfb2da;

--tertiary: #e7c365;
--tertiary-container: #c9a74d;
--on-tertiary-container: #503d00;

--error: #ffb4ab;
--error-container: #93000a;
--on-error-container: #ffdad6;

--zalo: #0068ff;
--facebook: #1877f2;
--cyan-accent: #22d3ee;
--rating: #facc15;
```

### 6.2. Light theme

Light theme phải được triển khai, nhưng dark là default. Dùng các màu có contrast WCAG AA:

```css
--background: #f8f7fb;
--surface: #ffffff;
--surface-container-low: #f2f0f5;
--surface-container: #ece9f0;
--surface-container-high: #e4e1e8;
--on-background: #1d1b20;
--on-surface: #1d1b20;
--on-surface-variant: #49454f;
--outline: #79747e;
--outline-variant: #cac4d0;
--primary: #6750a4;
--on-primary: #ffffff;
--primary-container: #eaddff;
--on-primary-container: #21005d;
--secondary-container: #e8def8;
--tertiary: #7d5700;
```

### 6.3. Typography

Font: `Inter` cho toàn site; dùng `next/font/google`. Hỗ trợ tiếng Việt.

| Token | Desktop | Mobile | Weight | Line-height |
|---|---:|---:|---:|---:|
| display / H1 hero | 48 px | 36 px | 700 | 1.1 |
| H1 detail | 48 px | 34 px | 700 | 1.1 |
| H2 section | 32 px | 28 px | 700 | 1.2 |
| H3 | 24 px | 22 px | 600 | 1.3 |
| Body large | 18 px | 17 px | 400 | 1.6 |
| Body | 16 px | 16 px | 400 | 1.6 |
| Label | 14 px | 14 px | 500 | 1.2 |
| Caption | 12 px | 12 px | 600 | 1.2 |

- Letter spacing H1: `-0.02em`.
- Label uppercase: `0.05em`.
- Mỗi trang chỉ có một H1.

### 6.4. Spacing

Base unit: 8 px.

```text
2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96
```

- Container max: 1280 px.
- Desktop page gutter: 40 px ở >= 1280 px.
- Tablet gutter: 24 px.
- Mobile gutter: 16 px.
- Section gap desktop: 64 px; mobile: 48 px.
- Card padding desktop: 24 px hoặc 32 px tùy loại; mobile: 20 px.

### 6.5. Radius

| Token | Giá trị |
|---|---:|
| radius-sm | 8 px |
| radius-md | 12 px |
| radius-lg | 16 px |
| radius-xl | 24 px |
| radius-pill | 9999 px |

### 6.6. Glass effect

```css
.glass-panel {
  background: color-mix(in srgb, var(--surface-container) 72%, transparent);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: 0 12px 40px rgba(0,0,0,.24);
  backdrop-filter: blur(18px);
}
```

Fallback khi browser không hỗ trợ `backdrop-filter`: nền `surface-container` opacity 96%.

### 6.7. Gradient và ambient background

```css
--primary-gradient: linear-gradient(135deg, #6750a4 0%, #4d4465 55%, #2563eb 100%);
```

Ambient background dùng tối đa ba radial gradient opacity thấp, fixed pseudo-element, `pointer-events:none`, không gây horizontal scroll.

### 6.8. Motion

- Hover transition: 180–250 ms, ease-out.
- Card lift: `translateY(-4px)`.
- Image zoom: tối đa `scale(1.04)` trong 500–700 ms.
- Carousel: 500 ms.
- Floating badge: translateY 0–6 px, 3.5 s alternate.
- Tôn trọng `prefers-reduced-motion`: tắt autoplay, parallax, floating và smooth scroll.

---

## 7. Breakpoints và responsive contract

| Name | Width |
|---|---:|
| mobile | 320–639 px |
| sm | 640–767 px |
| md/tablet | 768–1023 px |
| lg | 1024–1279 px |
| xl | 1280–1535 px |
| 2xl | >=1536 px |

### 7.1. Grid chung

- Product grid: 1 / 2 / 4 cột tại mobile / sm / lg.
- Blog: 1 / 2 / 3 cột tại mobile / md / lg.
- Testimonial: 1 / 2 / 3 cột.
- Footer: 1 / 2 / 4 cột.
- Usage steps: 1 / 2 / 4 cột.

### 7.2. Header mobile

- Logo trái, theme toggle và menu button phải.
- Drawer rộng min(320 px, 88vw), mở từ phải.
- Có overlay, focus trap, Escape để đóng, body scroll lock.
- Menu item tối thiểu 48 px chiều cao.
- Search hiển thị trong drawer.
- CTA liên hệ full-width trong drawer.

### 7.3. Trang chi tiết mobile

- Gallery trước, thông tin sản phẩm sau.
- Thumbnail có horizontal scroll, mỗi item 72x54 px.
- CTA chính sticky bottom trên mobile, không che floating actions; gồm `Mua ngay` và `Zalo`.
- Feature summary một cột tại dưới 420 px, hai cột từ 420 px.
- Review form nằm trước danh sách review trên mobile.

---

## 8. Component inventory và contract

### 8.1. Layout

- `PromoMarquee`
- `SiteHeader`
- `DesktopNavigation`
- `MobileNavigationDrawer`
- `SiteSearch`
- `ThemeToggle`
- `SiteFooter`
- `FloatingActions`
- `PageContainer`
- `SectionHeading`
- `Breadcrumbs`

### 8.2. Shared UI

- `Button`: primary, secondary, ghost, outline, destructive, zalo.
- `IconButton`
- `Badge`: hot, bestseller, new, featured, neutral.
- `GlassCard`
- `Input`, `Textarea`, `Select`
- `FormField`, `FormMessage`
- `RatingStars`
- `PriceDisplay`
- `Pagination`
- `EmptyState`
- `ErrorState`
- `Skeleton`
- `Toast`
- `Modal/Dialog`
- `SafeExternalLink`

### 8.3. Home

- `HeroCarousel`
- `HeroSlide`
- `TrustStats`
- `CategoryTabs`
- `ProductGrid`
- `ProductCard`
- `TestimonialGrid`
- `FaqAccordion`
- `BlogPreviewGrid`
- `BlogCard`

### 8.4. Product detail

- `ProductBreadcrumb`
- `ProductMediaGallery`
- `ProductVideoEmbed`
- `ProductSummary`
- `ShareActions`
- `ProductFeatureSummary`
- `RichDescription`
- `UsageSteps`
- `RelatedProducts`
- `ReviewSummary`
- `ReviewList`
- `ReviewCard`
- `ReviewForm`

### 8.5. Button contract

- Min-height desktop 44 px; mobile 48 px.
- Focus ring: 2 px primary + 2 px offset background.
- Disabled: opacity .45, pointer-events none.
- Loading: spinner 16 px, giữ nguyên width để tránh layout shift.
- Primary dùng gradient, text white, shadow nhẹ; không dùng text `on-primary` tối như mockup nếu contrast kém.

---

## 9. Đặc tả trang chủ `/`

### 9.1. Promo marquee

- Hiển thị khi `active=true`.
- Chiều cao mục tiêu 32 px.
- Nội dung lặp liên tục, tốc độ 35–45 px/s.
- Pause on hover/focus.
- Trên reduced-motion: không chạy, căn giữa và truncate 1 dòng.
- Link optional; nếu có link toàn bar click được.

### 9.2. Header

- Desktop sticky/fixed dưới marquee.
- Khi scroll > 50 px: giảm padding từ 16 xuống 8 px, background opacity tăng, top về 0 nếu marquee đã scroll khỏi viewport.
- Menu: Trang chủ, Sản phẩm, Bảng giá, Hướng dẫn, Liên hệ.
- Active item: màu primary + border-bottom 2 px.
- Search placeholder: `Tìm công cụ...`.
- CTA: `Liên hệ ngay`.
- Không hiển thị cart/account ở phase 1.

### 9.3. Hero carousel

- Desktop min-height 560 px, mobile min-height 540 px.
- Bố cục desktop 50/50; mobile text overlay trên media.
- Tối đa 5 slide active; mặc định seed 3.
- Autoplay 5 s, pause hover, focus, tab hidden, user interaction.
- Nút prev/next chỉ hiện desktop khi hover/focus-within; luôn có aria-label.
- Dot indicators click được; active width 32 px, inactive 8 px.
- Slide đầu có H1; slide khác dùng H2 nhưng đảm bảo screen reader không đọc tất cả cùng lúc bằng `aria-hidden` cho slide inactive.
- CTA đi tới product/blog/internal link hợp lệ.

### 9.4. Trust stats

- 4 item từ CMS.
- 2x2 mobile, 4 cột desktop.
- Icon 32 px, value 24 px, label 14 px.

### 9.5. Product categories

- Heading: `Các công cụ AI hỗ trợ Content Creator`.
- Tabs có item `Tất cả` đứng đầu, sau đó category theo `order`.
- Tab là link với query param `?category=slug`; không fetch-only client làm mất URL.
- Trang chủ hiển thị 4 sản phẩm featured hoặc mới nhất.
- Khi category được chọn mà không có sản phẩm, hiện EmptyState và nút xem tất cả.

### 9.6. Product card

- Card đồng chiều cao trong hàng.
- Badge góc trên phải.
- Icon hoặc thumbnail 48x48 px; nếu có thumbnail hình chữ nhật, dùng aspect 16:9 ở variant image card.
- Name tối đa 2 dòng.
- Description tối đa 2 dòng.
- Rating chỉ hiện khi count > 0; nếu 0, hiện `Chưa có đánh giá`.
- Giá hiện tại nổi bật; originalPrice chỉ hiện khi lớn hơn price.
- `priceUnit` map: tháng, năm, trọn đời, một lần.
- Click toàn card đi detail; CTA là link/button riêng và không tạo nested interactive invalid HTML.

### 9.7. Testimonials

- 3 item trên desktop, không autoplay.
- Avatar ảnh hoặc initials fallback.
- Content tối đa 5 dòng ở home; full text có title tooltip hoặc không clamp nếu ngắn.

### 9.8. FAQ

- Max-width 768 px.
- Chỉ một item mở cùng lúc.
- Keyboard accessible.
- FAQ JSON-LD chỉ chứa các FAQ đang publish và hiển thị.

### 9.9. Blog preview

- 3 bài mới nhất/featured.
- Image aspect 16:9, height khoảng 192 px desktop.
- Ngày dạng `15 tháng 7, 2026`.
- Title và excerpt tối đa 2 dòng ở card.
- Có link `Xem tất cả bài viết`.

### 9.10. Footer và floating actions

- Footer 4 cột: Chính sách, Thanh toán, Liên hệ, bản đồ.
- Map iframe lazy-load, title bắt buộc, không dùng HTML tùy ý chưa sanitize.
- Floating actions: Back to top, Zalo, Messenger optional, Phone.
- Hiện cách cạnh 24 px desktop, 16 px mobile.
- Trên mobile có sticky CTA product detail thì floating actions dịch lên để không chồng.

---

## 10. Đặc tả trang chi tiết sản phẩm `/san-pham/[slug]`

### 10.1. Breadcrumb

`Trang chủ / Sản phẩm / {Danh mục} / {Tên sản phẩm}`.

- Mobile cho phép horizontal scroll hoặc collapse item giữa.
- JSON-LD BreadcrumbList đồng bộ với UI.

### 10.2. Hero grid

- Desktop 12 columns: gallery 7, summary 5, gap 48 px.
- Tablet/mobile 1 cột.
- Main media aspect ratio 16:9, radius 16 px.
- Không upscale ảnh quá kích thước gốc.

### 10.3. Gallery

- `thumbnail` là media đầu tiên.
- Gallery tối đa 8 ảnh.
- Video thumbnail là item cuối nếu `demoVideoUrl` tồn tại.
- Active thumbnail border 2 px primary; inactive opacity .72.
- Click ảnh đổi main media; click video nhúng YouTube privacy-enhanced (`youtube-nocookie.com`) hoặc provider whitelist.
- Có lightbox khi click main image desktop; mobile hỗ trợ swipe.
- Alt text bắt buộc; fallback tên sản phẩm + index.

### 10.4. Product summary

Thứ tự:

1. badge + share icon.
2. H1.
3. rating summary.
4. share actions.
5. price.
6. CTA.
7. feature summary.

- Share: Facebook, Zalo (nếu URL share chuẩn khả dụng), copy link.
- Copy link có toast success/failure.
- Price dùng VND; không hiển thị `$` production.
- Discount percent chỉ hiện nếu originalPrice > price.
- CTA behavior:
  - `contact`: mở Zalo theo `purchaseUrl` hoặc site setting.
  - `external`: mở `purchaseUrl` tab mới, thêm `noopener noreferrer`.
  - `download`: CTA chính vẫn là mua/liên hệ; nút tải chỉ hiện khi `downloadUrl` hợp lệ.
- Không triển khai checkout giả.

### 10.5. Feature summary

- Tối đa 6 item ngắn.
- 2 cột desktop, 1–2 cột mobile.
- Icon lấy từ whitelist, không render arbitrary component name.

### 10.6. Rich description

- Render Strapi Blocks với component mapping cho paragraph, heading, list, quote, image, link, code.
- Sanitize URL.
- Max text width 860 px cho nội dung dài.
- Không cho admin chèn raw script/iframe tùy ý.

### 10.7. Usage steps

- 1–6 bước.
- Desktop 4 cột nếu đúng 4; nếu số khác dùng responsive auto-fit.
- Step number circle 48 px, nằm overlap phía trên card.

### 10.8. Related products

- Ưu tiên relation thủ công.
- Nếu không có: cùng category, exclude current, publish=true, limit 4.
- Nếu vẫn không có: ẩn toàn section.

### 10.9. Reviews

- Summary rating dùng dữ liệu tổng hợp server-side từ approved reviews.
- Hiển thị 5 review/page, mới nhất trước.
- Không tin `ratingAverage` nhập tay; hook/service Strapi cập nhật hoặc query aggregate.
- Avatar initials, tên đã escape, ngày theo `vi-VN`.
- Review form:
  - name 2–80 chars.
  - rating integer 1–5.
  - comment 10–1000 chars.
  - email optional, không public.
  - honeypot field.
  - rate limit: 3 request/10 phút/IP.
  - moderation status mặc định `pending`.
  - success message không tiết lộ nội bộ.

---

## 11. Các trang bổ sung

### 11.1. `/san-pham`

- Search `q`, filter `category`, sort `newest|price-asc|price-desc|rating`.
- URL là source of truth.
- Page size 12.
- Search debounce chỉ để update URL; server render kết quả.
- Canonical bỏ query page/filter không cần index; cấu hình robots metadata phù hợp cho search page.

### 11.2. `/bang-gia`

- Card/table responsive.
- Nhóm theo category.
- Cột: sản phẩm, mô tả ngắn, giá, đơn vị, CTA.
- Mobile chuyển mỗi row thành card.

### 11.3. `/huong-dan`

- Featured post đầu trang optional.
- Search bài viết, filter category/tag.
- Page size 9.
- Có RSS `/rss.xml`.

### 11.4. `/huong-dan/[slug]`

- Article header, cover, author, published date, reading time, TOC tự sinh từ H2/H3, rich content, related posts.
- Article JSON-LD.
- Share actions.

### 11.5. `/lien-he`

- Form: họ tên, email hoặc điện thoại, chủ đề, nội dung, consent.
- Rate limit 5/30 phút/IP.
- Honeypot + minimum form-fill time 2 giây.
- Gửi qua email adapter; khi chưa cấu hình email, ghi structured log và trả thông báo hợp lệ trong non-production, production phải báo service unavailable có hướng dẫn Zalo/phone.

### 11.6. `/chinh-sach/[slug]`

- Content từ Policy collection.
- 404 nếu không publish.

---

## 12. CMS data model — Strapi 5

### 12.1. Product

| Field | Type | Rules |
|---|---|---|
| name | string | required, 2–120 |
| slug | uid(name) | required, unique |
| shortDescription | string | required, max 180 |
| fullDescription | blocks | required |
| category | many-to-one Category | required |
| price | decimal | required, >=0 |
| originalPrice | decimal | optional, >= price |
| currency | enum | default VND |
| priceUnit | enum | month, year, lifetime, one_time |
| badge | enum | hot, bestseller, new, featured, none |
| cardIcon | string | lucide whitelist |
| thumbnail | media single | required |
| gallery | media multiple | max 8 |
| demoVideoUrl | string | provider whitelist |
| featureSummary | repeatable ProductFeature | max 6 |
| detailedFeatures | repeatable ProductFeature | optional |
| usageSteps | repeatable UsageStep | 1–6 |
| downloadUrl | string | optional |
| purchaseMode | enum | contact, external, download |
| purchaseUrl | string | optional/conditional |
| relatedProducts | many-to-many Product | optional |
| isFeatured | boolean | default false |
| displayOrder | integer | default 0 |
| seo | component SEO | optional |
| publishedAt | draft/publish | built-in |

### 12.2. Category

`name`, `slug`, `description`, `icon`, `order`, `seo`.

### 12.3. Review

`product`, `customerName`, `customerEmail` private, `rating`, `comment`, `status(pending|approved|rejected)`, `ipHash` private, timestamps.

Public response không trả email, ipHash hoặc status rejected.

### 12.4. BlogPost

- title, slug, excerpt, content blocks, coverImage.
- author relation.
- category relation.
- tags many-to-many.
- isFeatured.
- publishedAt built-in.
- seo component.
- canonicalUrl optional.

### 12.5. BlogAuthor

`name`, `slug`, `avatar`, `bio`, `socialLinks`.

### 12.6. BlogCategory và Tag

`name`, `slug`, `description`.

### 12.7. HeroSlide

`eyebrow`, `title`, `description`, `image`, `ctaText`, `ctaLink`, `badgeVariant`, `floatingTags`, `order`, `isActive`, `startsAt`, `endsAt`.

### 12.8. Testimonial

`customerName`, `avatar`, `rating`, `content`, `roleOrCompany`, `order`, `isActive`.

### 12.9. FAQ

`question`, `answer` blocks, `order`, `isActive`, `category` optional.

### 12.10. Policy

`title`, `slug`, `content`, `seo`.

### 12.11. SiteSettings single type

- siteName, tagline, logo, favicon, defaultOgImage.
- hotline, email, address.
- zaloLink, messengerLink, facebookLink.
- mapEmbedUrl.
- promoMarquee.
- trustStats.
- paymentMethods.
- defaultSeo.
- socialLinks.
- footerLegalLinks.
- contactRecipientEmail.

### 12.12. Component schemas

- `shared.seo`: metaTitle, metaDescription, shareImage, noIndex, canonicalUrl.
- `shared.link`: label, url, newTab.
- `shared.icon-text`: icon, title, description.
- `product.feature`: icon, title, description.
- `product.usage-step`: icon, title, description.
- `home.trust-stat`: icon, value, label.
- `home.floating-tag`: text, variant, position enum.
- `site.payment-method`: name, icon, description.
- `site.promo-marquee`: text, active, link.

### 12.13. Database indexes

Strapi schema hoặc migration phải bảo đảm index cho:

- Product.slug unique.
- Product.publishedAt.
- Product.category + publishedAt.
- Product.isFeatured + displayOrder.
- Category.slug unique.
- BlogPost.slug unique.
- BlogPost.publishedAt.
- Review.product + status + createdAt.

---

## 13. CMS roles và permission matrix

| Capability | Super Admin | Editor | Reviewer | Public/API |
|---|---:|---:|---:|---:|
| Product CRUD/publish | yes | yes | no | read published |
| Category CRUD | yes | yes | no | read |
| Blog CRUD/publish | yes | yes | no | read published |
| Hero/FAQ/Testimonial | yes | yes | no | read active/published |
| Review read/moderate | yes | no | yes | no direct create |
| SiteSettings edit | yes | no | no | read safe fields |
| User/role/token | yes | no | no | no |
| Media upload | yes | yes | no | read |

- API token Next.js: custom read-only token.
- Editor không được quản lý user/token/plugin/security settings.
- Reviewer chỉ thấy Review và không được sửa product relation/rating sau approve ngoài status/comment moderation.

---

## 14. API và data fetching contract

### 14.1. CMS client

- Server-only module có `import 'server-only'`.
- Timeout 8 giây bằng AbortController.
- Retry GET tối đa 2 lần với exponential backoff cho 502/503/504.
- Không retry 4xx.
- Structured error không log token/URL query chứa secret.

### 14.2. Response normalization

Tạo mapper tách Strapi shape khỏi UI. Component không truy cập trực tiếp cấu trúc `data.attributes` nếu API Strapi trả shape đó.

### 14.3. Cache tags

- `site-settings`
- `hero-slides`
- `categories`
- `products`
- `product:{slug}`
- `blog-posts`
- `blog:{slug}`
- `faqs`
- `testimonials`

### 14.4. Revalidation webhook

`POST /api/revalidate`

- Header `x-revalidate-secret`.
- Validate constant-time.
- Map model/event sang tags, không nhận tag tùy ý từ internet.
- Log event id, model, action, tags, status.
- Rate limit 30/minute/IP.

---

## 15. State specification

Mỗi data-driven section phải có đủ:

### 15.1. Loading

- Route-level `loading.tsx` cho home, product list, product detail, blog.
- Skeleton giữ gần đúng chiều cao để tránh CLS.
- Không dùng spinner full-page cho content page.

### 15.2. Empty

- Product search: `Không tìm thấy sản phẩm phù hợp` + reset filter.
- Review: `Sản phẩm chưa có đánh giá. Hãy là người đầu tiên đánh giá.`
- Blog: `Chưa có bài viết trong danh mục này.`
- Related product: ẩn section.

### 15.3. Error

- Section không trọng yếu như testimonial/FAQ: log lỗi và ẩn section hoặc fallback nhẹ.
- Trang product/blog không tải được: `error.tsx` với retry.
- CMS trả 404: Next.js `notFound()`.
- CMS unavailable: status 503 ở dynamic route khi có thể, không hiển thị stack trace.

### 15.4. Offline/client failure

Form submit failure giữ dữ liệu input và hiển thị thông báo có thể thử lại.

---

## 16. SEO

- `generateMetadata()` cho product, blog, policy.
- Default title template: `%s | AIVisionary`.
- Canonical tuyệt đối.
- Sitemap chứa static routes, products, blog posts, policies.
- Robots disallow `/api/`, preview/draft URL và CMS admin không nằm frontend.
- JSON-LD: Organization, WebSite + SearchAction, Product + Offer + AggregateRating khi có, Article, FAQPage, BreadcrumbList.
- Không xuất AggregateRating nếu reviewCount = 0.
- Product availability dùng `https://schema.org/InStock` nếu product publish và CTA khả dụng.
- Open Graph images tối thiểu 1200x630 khi có.
- RSS cho blog.

---

## 17. Accessibility

- WCAG 2.2 AA mục tiêu.
- Contrast text thường >= 4.5:1.
- Focus visible mọi interactive element.
- Skip link `Bỏ qua đến nội dung chính`.
- Header/nav semantic đúng.
- Carousel có pause, aria-roledescription và không tự động đổi với reduced-motion.
- Dialog/drawer focus trap.
- Form label thật, error dùng `aria-describedby`.
- Star rating dùng radio group keyboard accessible.
- Icon-only button có aria-label.
- Tap target >= 44x44 px.
- Không dùng màu làm tín hiệu duy nhất.

---

## 18. Security

### 18.1. HTTP

- HTTPS redirect.
- HSTS sau khi xác nhận SSL ổn định.
- CSP phù hợp Next.js/Strapi; whitelist media/email/analytics cần thiết.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` tắt camera/microphone/geolocation trừ khi thực sự cần.
- Frame ancestors none cho CMS admin trừ yêu cầu cụ thể.

### 18.2. CMS

- Strapi admin không public index bởi search engine.
- Admin password mạnh, thay default secret.
- Upload limit mặc định 10 MB/image, MIME whitelist.
- Không cho SVG upload nếu chưa sanitize.
- CORS chỉ frontend production, preview domains được cấu hình explicit.

### 18.3. Secrets

- `.env` chmod 600.
- Docker secrets hoặc env file ngoài repository.
- Script verify từ chối secret placeholder production.
- Backup mã hóa hoặc lưu tại nơi private.

### 18.4. Forms

- Zod validation server-side.
- Rate limit Redis optional; fallback in-memory cho single instance.
- Honeypot.
- Escape/sanitize.
- Không log toàn bộ form chứa PII.

---

## 19. Performance budget

| Metric | Mobile target |
|---|---:|
| LCP | <= 2.5 s |
| CLS | <= 0.1 |
| INP | <= 200 ms |
| JS initial route | <= 180 KB gzip, không tính framework unavoidable |
| Hero image | <= 350 KB WebP/AVIF |
| Product thumbnail | <= 120 KB |

- Dùng Server Components mặc định.
- Client component chỉ cho carousel, drawer, theme, gallery, forms, floating action.
- Dynamic import cho video/lightbox.
- `next/image`, remotePatterns explicit.
- Preload chỉ ảnh hero active đầu tiên.
- Không load YouTube iframe trước khi user click video thumbnail; dùng facade.
- Không load map iframe trước gần viewport.

---

## 20. Analytics events

Tạo adapter no-op nếu chưa có GA ID.

- `view_home`
- `view_product_list`
- `view_product`
- `select_category`
- `search_product`
- `click_purchase`
- `click_zalo`
- `click_phone`
- `download_product`
- `submit_review`
- `submit_contact`
- `view_blog_post`
- `share_product`

Không gửi PII vào analytics.

---

## 21. Testing specification

### 21.1. Unit/component

Tối thiểu test:

- format VND.
- CMS mapper.
- URL sanitizer.
- ProductCard states.
- PriceDisplay discount.
- RatingStars including zero and decimal.
- form validation.
- webhook tag mapping.

### 21.2. Integration

- CMS client success/404/500/timeout.
- review route validation/rate-limit/forward.
- contact route adapter behavior.
- revalidate secret invalid/valid.

### 21.3. Playwright E2E

Desktop 1440x900, tablet 768x1024, mobile 390x844:

1. Home load và không console error.
2. Header menu/link hoạt động.
3. Hero next/prev/dot.
4. Category filter cập nhật URL và product grid.
5. Product detail mở từ card.
6. Gallery đổi ảnh và video facade.
7. Copy link toast.
8. Review invalid và valid submit.
9. Blog list -> detail.
10. Mobile drawer keyboard accessible.
11. Theme toggle persistence.
12. 404 page.

### 21.4. Visual regression

Chụp screenshot home và product detail ở 1440, 768, 390. Baseline lấy từ implementation đã đối chiếu Stitch. Threshold <= 0.5% pixel diff cho vùng ổn định; mask dynamic dates/carousel.

### 21.5. Quality gates

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Tất cả phải pass trước deploy.

---

## 22. Seed data

Script idempotent `pnpm seed` phải tạo hoặc update theo slug:

- 5 categories.
- 8 products.
- 3 hero slides.
- 4 trust stats.
- 3 testimonials.
- 5 FAQs.
- 5 blog posts, 2 authors, categories/tags.
- 3 policies.
- SiteSettings.
- 6 approved reviews và 1 pending review.

Seed dùng media local trong `apps/cms/seed-assets`, không phụ thuộc URL Stitch.

---

## 23. Environment variables

### 23.1. Frontend

```env
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://hieuchanlaptrinh.top
NEXT_PUBLIC_STRAPI_URL=https://cms.hieuchanlaptrinh.top
STRAPI_INTERNAL_URL=http://cms:1337
STRAPI_API_TOKEN=<required>
REVALIDATE_SECRET=<required>
NEXT_PUBLIC_GA_ID=
RESEND_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
CONTACT_FROM_EMAIL=
CONTACT_TO_EMAIL=
RATE_LIMIT_SALT=<required>
```

### 23.2. CMS

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
APP_KEYS=<four comma-separated random keys>
API_TOKEN_SALT=<random>
ADMIN_JWT_SECRET=<random>
TRANSFER_TOKEN_SALT=<random>
JWT_SECRET=<random>
ENCRYPTION_KEY=<random>
DATABASE_CLIENT=postgres
DATABASE_HOST=13.140.130.137
DATABASE_PORT=5432
DATABASE_NAME=onlineshopdb
DATABASE_USERNAME=onlineshop
DATABASE_PASSWORD=<required-on-server>
DATABASE_SSL=false
PUBLIC_URL=https://cms.hieuchanlaptrinh.top
FRONTEND_URL=https://hieuchanlaptrinh.top
UPLOAD_PROVIDER=local
CLOUDINARY_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=
```

---

## 24. Docker Compose requirements

- Services: `frontend`, `cms`, `nginx`, `certbot` profile optional.
- Network private `aivisionary_internal`.
- Chỉ Nginx expose 80/443.
- CMS và frontend `expose`, không `ports` production.
- Volumes:
  - CMS uploads.
  - Nginx certs/challenge.
  - deployment metadata/releases.
- Health checks:
  - frontend `/api/health`.
  - cms `/_health` hoặc custom `/api/health`.
  - nginx `/healthz`.
- Restart `unless-stopped`.
- Log rotation `max-size: 10m`, `max-file: 5`.
- Read-only filesystem khi khả thi; mount tmp cho Next/Strapi cần ghi.

---

## 25. Deployment scripts contract

### 25.1. `install-server.sh`

- Check Ubuntu/Debian/Rocky compatible path.
- Install Docker Engine/Compose plugin, Nginx chỉ nếu không containerized, jq, curl, openssl.
- Tạo user deploy không root nếu chưa có.
- Tạo `/opt/aivisionary/{releases,shared,backups}`.
- Optional swap 2 GiB.
- Không ghi đè dữ liệu hiện có.

### 25.2. `deploy.sh`

1. Verify env.
2. Check DB TCP reachability, không in password.
3. Backup DB trước schema-changing release.
4. Build images tagged git SHA/timestamp.
5. Run CMS migration/schema startup in controlled step.
6. Start new containers.
7. Health check tối đa 120 giây.
8. Switch Nginx/reload nếu health OK.
9. Ghi release metadata.
10. Giữ 5 image/release gần nhất.
11. Tự rollback nếu health fail.

### 25.3. `update.sh`

- Pull branch/tag chỉ định.
- Gọi quality checks hoặc dùng prebuilt image theo mode.
- Gọi deploy.

### 25.4. `rollback.sh`

- Chọn release trước hoặc SHA.
- Không tự rollback DB destructive migration; cảnh báo và dùng backup/restore theo runbook.
- Restart container cũ và health check.

### 25.5. Backup/restore

- `pg_dump -Fc`.
- Filename timestamp UTC.
- Retention: 7 daily, 4 weekly, 6 monthly nếu cron nâng cao; tối thiểu giữ 14 ngày.
- Backup media volume riêng tar.gz.
- Restore yêu cầu xác nhận bằng `--confirm` hoặc `RESTORE_CONFIRM=yes`.

---

## 26. CI/CD

GitHub Actions:

- Trigger PR/push main.
- Cache pnpm.
- lint, typecheck, unit test, build.
- Playwright trên PR hoặc main tùy thời gian.
- Không deploy production khi test fail.
- Vercel preview cho `apps/web` dùng staging CMS.
- Production VPS deploy qua SSH secret hoặc image registry; script không phụ thuộc GitHub nếu người dùng muốn deploy thủ công.
- Workflow không chứa credentials plaintext.

---

## 27. Agent execution plan bắt buộc

### Phase 0 — Preflight

- Kiểm tra hai HTML source.
- Kiểm tra existing repository.
- Tạo task checklist nội bộ.
- Kiểm tra port, Node, pnpm, Docker nếu chạy được.

### Phase 1 — Monorepo scaffold

- Tạo workspace, configs, lint, TS strict, scripts chung.

### Phase 2 — Strapi CMS

- Tạo schemas/components/permissions/lifecycles/services.
- Tạo seed script.
- Tạo health endpoint.
- Test SQLite/dev DB trước.

### Phase 3 — Design system

- Tokens, globals, components, Storybook optional không bắt buộc.
- Tạo component states và accessibility.

### Phase 4 — Home page

- Chuyển Stitch thành component động.
- Kiểm tra 1440/768/390.

### Phase 5 — Product pages

- List/filter/search/sort/pagination.
- Detail/gallery/video/reviews/related.

### Phase 6 — Blog, pricing, contact, policies

- CMS-connected pages và forms.

### Phase 7 — SEO/analytics/performance

- Metadata, structured data, sitemap, RSS, lazy media.

### Phase 8 — Testing

- Unit/integration/E2E/visual snapshots.
- Fix tất cả lỗi.

### Phase 9 — Deployment package

- Dockerfiles, compose, Nginx, Certbot, scripts, env examples.

### Phase 10 — Verification

- Seed sạch.
- Production build.
- Docker local smoke test.
- Health checks.
- Lighthouse.
- Generate docs và implementation report.

Agent không được dừng giữa phase để hỏi người dùng. Nếu external credential thiếu, dùng placeholder + adapter/fallback và tiếp tục.

---

## 28. Coding conventions

- File component: `PascalCase.tsx`.
- Utility/module: `camelCase.ts`.
- Route folder: kebab-case hoặc tiếng Việt không dấu theo routing đã định.
- Named export mặc định; default export chỉ page/layout Next.js khi framework yêu cầu/convention.
- Không dùng `any`; dùng `unknown` + narrowing.
- Không disable ESLint toàn file nếu không có lý do ghi rõ.
- Import alias `@/*` -> `src/*`.
- Mỗi component nên dưới 250 dòng; tách logic khi vượt.
- Server action/route handler không trộn UI.
- Logging JSON với level, event, requestId; không log secret/PII.
- Comments giải thích “why”, không mô tả code hiển nhiên.

---

## 29. Copy chuẩn hóa

| Stitch | Production VI |
|---|---|
| Home | Trang chủ |
| Products | Sản phẩm |
| Pricing | Bảng giá |
| Tutorials | Hướng dẫn |
| Contact | Liên hệ |
| Contact Now | Liên hệ ngay |
| Search tools... | Tìm công cụ... |
| Featured Model | Nổi bật |
| Best Seller | Bán chạy |
| New Release | Mới ra mắt |
| Read more | Đọc thêm |
| Payment | Thanh toán |
| Legal | Chính sách |

Tên sản phẩm có thể giữ tiếng Anh. Nội dung marketing từ CMS.

---

## 30. Definition of Done

### UI

- [ ] Home và product detail đúng thiết kế ở 1440 px.
- [ ] Không vỡ layout ở 320, 375, 390, 768, 1024, 1440, 1920 px.
- [ ] Dark/light theme hoạt động và lưu preference.
- [ ] Không còn Tailwind CDN, inline onclick, mock href hoặc hotlink Stitch.

### CMS

- [ ] Admin thêm/sửa/publish sản phẩm không cần code.
- [ ] Admin viết và publish blog đầy đủ.
- [ ] Admin quản lý hero, FAQ, testimonial, policy, site settings.
- [ ] Review moderation hoạt động.
- [ ] Seed idempotent.

### Functional

- [ ] Search/filter/sort/pagination hoạt động.
- [ ] Gallery/video/share/CTA hoạt động.
- [ ] Contact/review form validate, rate-limit và báo trạng thái đúng.
- [ ] Revalidation webhook cập nhật trong <= 10 giây sau publish khi webhook thành công.

### Quality

- [ ] lint/typecheck/unit/integration/E2E pass.
- [ ] Không console error ở luồng chính.
- [ ] Lighthouse mobile: Performance >= 85, Accessibility >= 90, Best Practices >= 90, SEO >= 95.
- [ ] Không có critical/high vulnerability từ production dependencies hoặc phải có documented mitigation.

### Deployment

- [ ] `docker compose up -d` chạy thành công với env hợp lệ.
- [ ] Health checks xanh.
- [ ] SSL, redirect HTTPS và domains đúng.
- [ ] Backup/restore script đã dry-run hoặc test trên non-production.
- [ ] Rollback được kiểm thử ít nhất bằng container release trước.
- [ ] README và Operations guide đủ cho người khác vận hành.

---

## 31. Output bắt buộc của AI Agent

Agent phải bàn giao:

1. Toàn bộ source code.
2. Migration/schema CMS.
3. Seed data và assets.
4. Dockerfiles và Compose.
5. Nginx/Certbot config.
6. Scripts install/deploy/update/rollback/backup/restore/healthcheck.
7. `.env.example`, tuyệt đối không có secret thật.
8. CI workflow.
9. Test suite.
10. `README.md` hướng dẫn local/dev/Vercel/VPS.
11. `OPERATIONS.md` hướng dẫn backup, restore, update, rollback, log và sự cố.
12. `CONTENT_GUIDE.md` hướng dẫn admin tạo product/blog và tối ưu ảnh/SEO.
13. `SECURITY.md` checklist trước go-live.
14. `IMPLEMENTATION_REPORT.md` bằng tiếng Việt.
15. Gói release `.tar.gz` hoặc `.zip` không chứa `.env`, `node_modules`, build cache hay secret.

---

## 32. Quy tắc xử lý mâu thuẫn

Khi có mâu thuẫn:

1. Security và dữ liệu production ưu tiên cao nhất.
2. Quy tắc trong tài liệu này ưu tiên hơn HTML Stitch ở hành vi kỹ thuật.
3. HTML Stitch ưu tiên hơn mô tả chung về bố cục/màu sắc.
4. Accessibility ưu tiên hơn pixel fidelity nếu hai yêu cầu không thể đồng thời đạt.
5. Nội dung CMS production ưu tiên hơn seed/mock content.

---

## 33. Lệnh vận hành tiêu chuẩn cần được tạo

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm seed

make dev
make test
make build
make deploy
make health
make backup
make rollback
```

Mỗi lệnh phải được ghi rõ trong README và hoạt động từ root repository.

---

**Kết luận:** Với tài liệu này, hai file HTML thiết kế và các biến môi trường hợp lệ, AI Agent phải có đủ quyết định mặc định để tự triển khai toàn bộ hệ thống mà không cần hỏi thêm. Bất kỳ hạng mục chưa thể kích hoạt vì thiếu credential ngoài hệ thống phải được hoàn thiện ở mức code/config/fallback, ghi rõ trong implementation report và không được làm dừng các phase còn lại.
