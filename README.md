# AIVisionary

AIVisionary là monorepo phase-1 cho website bán công cụ AI dành cho content creator. Frontend dùng Next.js App Router, dữ liệu đi qua CMS contract/fallback seed, form đi qua route handler có validation/rate-limit, và deployment dùng Docker Compose + Nginx.

## Yêu cầu

- Node 22 LTS
- pnpm 10
- Docker 28+ nếu chạy deployment package

## Chạy local

```bash
pnpm install
pnpm dev
```

Frontend chạy tại `http://localhost:3000`. Khi chưa có Strapi token, web dùng fallback seed data trong `apps/web/src/lib/fallbackData.ts`.

## Lệnh chuẩn

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

## Cấu trúc

```text
apps/web      Next.js frontend
apps/cms      Strapi-oriented CMS schema/source package
packages      Shared package boundary
deploy        Docker Compose, Nginx, env examples
scripts       Bootstrap, deploy, backup, restore, health scripts
tests/e2e     Playwright tests
docs          Operations, content, security, Harness story packet
```

## Environment

Copy `.env.example` for local development. Production env examples live at:

- `deploy/env/frontend.env.example`
- `deploy/env/cms.env.example`

Do not commit real `.env`, token, password, private key, or database dump.

## VPS deployment

1. Fill env files outside Git: `deploy/env/frontend.env` and `deploy/env/cms.env`.
2. Ensure production DB password has been rotated before go-live.
3. Run:

```bash
bash scripts/deploy.sh
```

Only Nginx exposes ports `80` and `443`; frontend and CMS are internal services.
