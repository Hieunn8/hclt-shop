# Validation

## Proof Strategy

Use local, non-production proof. The story is only complete when the app can install, lint, typecheck, test, build, and run smoke/E2E checks with deterministic seed/fallback data. Production credential-dependent paths must provide adapters and documented placeholders.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | VND formatting, CMS mappers, URL sanitizer, product price/rating helpers, validation schemas, webhook tag mapping. |
| Integration | CMS client success/fallback/error handling, contact/review route validation/rate-limit/honeypot, revalidate secret/tag mapping. |
| E2E | Home, navigation, category filter, product detail, gallery/share/review validation, blog list/detail, mobile drawer, theme persistence, 404. |
| Platform | Docker Compose config syntax, healthcheck script, env verification, backup/restore dry-run guard. |
| Performance | Next.js production build, image sizing/lazy loading, reduced client component usage. |
| Logs/Audit | Route handlers avoid logging secrets and full PII. |

## Fixtures

- Seed categories, products, hero slides, trust stats, testimonials, FAQs, blog posts, policies, reviews, and site settings.
- Placeholder media files under CMS seed assets and frontend public assets.
- Test environment variables from `.env.example` without production secrets.

## Commands

```text
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm seed
```

## Acceptance Evidence

To be filled after verification.
