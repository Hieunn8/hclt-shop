# Overview

## Current Behavior

The repository currently contains the Harness scaffold, the AIVisionary implementation specification, and two Stitch HTML reference files (`home.html` and `detail.html`). There is no runnable application yet.

## Target Behavior

Build the AIVisionary phase-1 website and operations package from the specification:

- Next.js App Router frontend with CMS-driven content, Vietnamese copy, dark/light theme, SEO, forms, and E2E-tested public flows.
- Strapi-compatible CMS schema/source package, seed data, health endpoint, and environment examples.
- Docker Compose, Nginx, Certbot placeholders, deploy/update/rollback/backup/restore/health scripts, CI, and operational documentation.

## Affected Users

- Public visitor browsing products, blog posts, pricing, policies, and contact content.
- Site admin/editor managing products, blog content, hero slides, FAQ, policies, reviews, and settings through CMS.
- Operator deploying and maintaining the stack on VPS.

## Affected Product Docs

- `AIVisionary_Agent_Ready_Design_Implementation_Spec.md`
- `home.html`
- `detail.html`
- `README.md`
- `docs/OPERATIONS.md`
- `docs/CONTENT_GUIDE.md`
- `docs/SECURITY.md`

## Non-Goals

- Customer login/registration.
- Real cart, order management, automated payment, key delivery, loyalty, coupon, or marketplace features.
- Committing production secrets or connecting automated tests to production database.
