# AIVisionary Implementation Report

## Đã làm

- Tạo pnpm monorepo với `apps/web`, `apps/cms`, `deploy`, `scripts`, `tests/e2e`.
- Implement Next.js frontend: home, product list, product detail, pricing, blog list/detail, contact, policy, sitemap, robots, RSS, health API.
- Chuyển giao diện từ `home.html` và `detail.html` thành React component với dữ liệu từ CMS layer/fallback seed.
- Thêm dark/light theme, mobile drawer, carousel, product filter/search, gallery, review/contact forms.
- Thêm API route validation/rate-limit/honeypot/revalidation.
- Thêm Strapi-oriented schemas, seed adapter, Dockerfiles, Docker Compose, Nginx config, env examples, CI, operations/content/security docs.

## Lệnh cần chạy

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm seed
```

## URL local

- Frontend: `http://localhost:3000`
- Health: `http://localhost:3000/api/health`

## Kết quả kiểm thử

- `pnpm lint`: pass.
- `pnpm typecheck`: pass.
- `pnpm test`: pass, 3 files / 6 tests.
- `pnpm build`: pass, 25 app routes generated.
- `pnpm test:e2e`: pass, 4 tests trên desktop và mobile.
- `docker compose -f deploy/docker-compose.yml config --quiet`: pass.
- Playwright screenshot smoke: home/product H1 đúng, không có console error.

## Lighthouse

Chưa chạy Lighthouse trong phiên này. Production build đã pass; Lighthouse nên chạy trên server preview hoặc VPS sau khi có env/CMS thật.

## Migration/seed

`pnpm seed` pass ở chế độ dry-run vì chưa có Strapi credentials. Kết quả seed local: 5 categories, 4 products, 3 hero slides, 3 testimonials, 5 FAQs, 3 blog posts, 3 policies, 3 reviews. Schema CMS đã được tạo trong `apps/cms/src/api`.

## Biến môi trường cần cấu hình

- `STRAPI_API_TOKEN`
- `REVALIDATE_SECRET`
- `RATE_LIMIT_SALT`
- Email provider: `RESEND_API_KEY` hoặc SMTP env
- Production DB password trên server, không commit vào Git

## Ghi chú môi trường

- `next.config.ts` bật `output: "standalone"` trên non-Windows để Docker/Linux production dùng Next standalone. Trên Windows local, standalone bị tắt để tránh lỗi symlink `EPERM` khi build trong workspace này.
- Strapi 5 package hiện cảnh báo peer dependency React 18 trong admin package khi cài chung workspace với frontend React 19. Typecheck web/cms vẫn pass; cần xác nhận Strapi admin runtime khi bật CMS thật.
- Browser MCP trong phiên này không chạy được do lỗi `sandboxCwd must use the file URI scheme`; đã fallback bằng Playwright local screenshot.
