# Design

## Domain Model

Core content entities:

- Site settings, navigation, promo banner, hero slides, trust stats.
- Categories, products, product media, product features, pricing, usage steps.
- Reviews with pending/approved/rejected status.
- Blog authors, categories, tags, posts.
- Policies, FAQ, testimonials, contact submissions.

Business rules:

- Public pages read only published/safe content.
- Review/contact mutations go through Next.js route handlers with Zod validation, honeypot, and rate limiting.
- Purchase CTAs use contact/Zalo/external CMS URLs only in phase 1.
- Currency is VND using `vi-VN`.

## Application Flow

- Next.js server components fetch normalized CMS data via a server-only CMS client.
- When CMS is unavailable in development, deterministic local fallback data prevents blank pages.
- Route handlers validate and forward contact/review/revalidation requests.
- Seed script creates or updates deterministic content by slug.

## Interface Contract

Frontend routes:

- `/`, `/san-pham`, `/san-pham/[slug]`, `/bang-gia`, `/huong-dan`, `/huong-dan/[slug]`, `/lien-he`, `/chinh-sach/[slug]`.
- `/api/health`, `/api/contact`, `/api/reviews`, `/api/revalidate`.

Operational commands:

- `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, `pnpm seed`.
- `make dev`, `make test`, `make build`, `make deploy`, `make health`, `make backup`, `make rollback`.

## Data Model

Strapi content models are represented under `apps/cms/src/api/**/content-types/**/schema.json` and component schemas under `apps/cms/src/components/**`.

Indexes and uniqueness:

- Slug fields are unique for products, categories, blog posts, policies, and authors.
- Review query paths are organized around product/status/createdAt.

Retention:

- Contact and review submissions are operational/content records and must not log raw PII in application logs.

## UI / Platform Impact

- Public web UI targets desktop/tablet/mobile breakpoints in the spec.
- Dark theme is default with persisted light theme support.
- No Stitch CDN, Tailwind CDN, inline handlers, hotlinked mock images, or Material Symbols CDN.
- Docker Compose exposes only Nginx in production.

## Observability

- Health endpoints for frontend, CMS, and Nginx.
- JSON-style operational logging in route handlers without secrets or full PII.
- Deployment scripts print status without passwords.

## Alternatives Considered

1. Full live Strapi generation before frontend: rejected because it delays visible validation and requires heavier runtime setup.
2. Frontend-only mock site: rejected because the spec requires CMS source, seed, deploy, and operations package.
3. Direct production DB use for validation: rejected by spec and safety rules.
