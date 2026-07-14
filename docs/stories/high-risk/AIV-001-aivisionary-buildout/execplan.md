# Exec Plan

## Goal

Implement a runnable phase-1 AIVisionary monorepo that follows the supplied spec and can be developed, tested, seeded, packaged, and deployed without production secrets.

## Scope

In scope:

- Monorepo scaffold using pnpm workspaces, strict TypeScript, lint/test/build scripts.
- `apps/web` Next.js frontend with CMS mappers, fallback seed data, route handlers, forms, SEO metadata, sitemap, RSS, robots, and UI converted from `home.html`/`detail.html`.
- `apps/cms` Strapi-oriented content model/source package, seed assets/placeholders, health route, and seed script.
- Shared types/utilities, tests, Playwright flows, Dockerfiles, Compose, Nginx config, deployment scripts, CI, and docs.

Out of scope:

- Real customer account, cart, order, payment, and key delivery flows.
- Real external provider activation without credentials.
- Running against production database in local or automated tests.

## Risk Classification

Risk flags:

- Data model.
- Audit/security.
- External systems.
- Public contracts.
- Existing behavior is absent but proof is initially weak.
- Multi-domain.

Hard gates:

- Audit/security for forms, secrets, deployment, and CMS public role assumptions.
- External provider behavior for email/media/analytics adapters.

## Work Phases

1. Discovery: inspect spec, HTML references, current repo, toolchain availability.
2. Design: create monorepo structure, CMS content model, frontend route/data contracts, deployment shape.
3. Validation planning: add unit/integration/E2E and root quality commands.
4. Implementation: build vertical slices through CMS data, frontend UI, forms, SEO, seed, scripts, and docs.
5. Verification: run available lint/typecheck/test/build/E2E and record limitations.
6. Harness update: update story proof status and implementation report.

## Stop Conditions

Pause for human confirmation if:

- A required destructive migration or production data operation appears.
- The implementation would need real production secrets.
- Validation requirements must be weakened rather than deferred with explicit evidence.
