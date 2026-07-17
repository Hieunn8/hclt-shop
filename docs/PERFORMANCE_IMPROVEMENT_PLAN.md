# CMS and Web Performance Improvement Plan

## Objective

Reduce public web and CMS-backed data loading time by:

- Reducing CMS requests made by the web app.
- Caching public content safely.
- Preserving fast updates after CMS edits.
- Avoiding Redis in the first implementation pass unless measurements still require it.

## Scope

Implement inside the current monorepo:

- `apps/cms`: add public aggregate endpoints.
- `apps/web`: refactor CMS fetch layer, add cache, remove repeated full-catalog fetches.
- Keep Strapi admin/auth behavior unchanged.
- Do not migrate the database in this pass.
- Do not change the UI design or CMS content model.

## Current Problems

- `apps/web/src/lib/cms.ts:getCatalog()` calls about 10 CMS endpoints per page render.
- `layout.tsx`, page components, and `generateMetadata()` can each call `getCatalog()`, multiplying CMS traffic.
- Local prod-db flow uses `cache: "no-store"` for localhost, so every page load hits CMS and the remote production DB.
- Several Strapi requests use `populate=*`, which is convenient but expensive.
- The production DB host is remote from the local machine. Measured DB connection latency is about 1.1s, with `select 1` adding about 280ms.
- CMS logs show public API endpoints often taking 5-8s under concurrent web page loads.

## Target Design

1. CMS exposes `GET /api/catalog`.
   This endpoint returns the public data needed by homepage, product list, header, footer, and general catalog surfaces in one response.

2. CMS exposes `GET /api/products-by-slug/:slug`.
   This endpoint returns one product, its media/category/reviews, and related products.

3. Web fetches aggregated endpoints instead of many Strapi endpoints.

4. Web uses Next tag cache with short TTL fallback.

5. CMS lifecycle revalidation remains the freshness mechanism after edits.

6. Redis is deferred until after aggregate endpoints and Next cache are measured.

## Step 1: Add CMS Catalog Endpoint

Create:

```text
apps/cms/src/api/catalog/routes/catalog.ts
apps/cms/src/api/catalog/controllers/catalog.ts
```

Route:

```ts
export default {
  routes: [
    {
      method: "GET",
      path: "/catalog",
      handler: "catalog.index",
      config: { auth: false }
    }
  ]
};
```

Controller requirements:

- Return one object with:
  - `settings`
  - `categories`
  - `products`
  - `heroSlides`
  - `siteMetrics`
  - `testimonials`
  - `faqs`
  - `blogPosts`
  - `policies`
  - `reviews`
- Query only public/published/active records.
- Sort:
  - products: `publishedAt desc`
  - hero slides, metrics, testimonials, FAQs: `sortOrder asc`
- Reviews must include real `productSlug` from `reviews_product_lnk`.
- Do not infer review product from review slug.
- Avoid broad `populate=*` where field-specific queries are practical.

Acceptance:

- `GET http://localhost:1337/api/catalog` returns `200`.
- Response includes `data.products`, `data.reviews`, and `data.heroSlides`.
- A review reassigned in CMS returns the new `productSlug`.

## Step 2: Add CMS Product Detail Endpoint

Create:

```text
apps/cms/src/api/product/routes/product-by-slug.ts
```

Route:

```ts
export default {
  routes: [
    {
      method: "GET",
      path: "/products-by-slug/:slug",
      handler: "product.findBySlug",
      config: { auth: false }
    }
  ]
};
```

Update or create:

```text
apps/cms/src/api/product/controllers/product.ts
```

Controller requirements:

- Read `ctx.params.slug`.
- Return `404` when no published product exists.
- Return:
  - product core fields
  - icon/media
  - category slug/name
  - approved reviews from `reviews_product_lnk`
  - related products from the same category
  - site settings needed by the product page CTAs/footer
- Use relation tables as source of truth for reviews.

Acceptance:

- `/api/products-by-slug/auto-reup-master` returns product and only its reviews.
- `/api/products-by-slug/product` returns the review reassigned to HCLT-TTS.

## Step 3: Refactor Web CMS Fetch Layer

Update:

```text
apps/web/src/lib/cms.ts
apps/web/src/lib/types.ts
```

Add type:

```ts
export type ProductDetailData = {
  product: Product;
  reviews: Review[];
  related: Product[];
  settings: SiteSettings;
};
```

Refactor:

- `getCatalog()` should call only `/api/catalog`.
- Add `getProductDetail(slug)` to call `/api/products-by-slug/:slug`.
- Keep fallback behavior if CMS is unavailable.
- Keep placeholder env handling so values like `<required>` are ignored.

Acceptance:

- One homepage render no longer causes 10 direct CMS collection requests.
- Product detail pages no longer fetch full catalog just to render one product.

## Step 4: Add Next Cache

Update `apps/web/src/lib/cms.ts`.

Use:

```ts
import { unstable_cache } from "next/cache";
```

Implement internal uncached functions:

- `getCatalogUncached()`
- `getProductDetailUncached(slug)`

Export cached functions:

```ts
export const getCatalog = unstable_cache(
  getCatalogUncached,
  ["catalog"],
  { tags: ["catalog", "products", "hero-slides", "site-settings"], revalidate: 60 }
);
```

For product detail:

```ts
export function getProductDetail(slug: string) {
  return unstable_cache(
    () => getProductDetailUncached(slug),
    ["product-detail", slug],
    { tags: ["products", `product:${slug}`, "reviews"], revalidate: 60 }
  )();
}
```

Rules:

- Do not use `no-store` by default for local prod-db.
- Use revalidation tags for freshness.
- TTL `60s` is a fallback when lifecycle revalidation fails.

Acceptance:

- Second load of `/` and `/san-pham/product` is materially faster.
- CMS edits can still become visible via revalidation.

## Step 5: Update Revalidation Tags

Update:

```text
apps/web/src/lib/validation.ts
```

Ensure tag mapping:

- product: `["catalog", "products", "product:<slug>"]`
- review: `["catalog", "reviews", "products"]`
- hero-slide: `["catalog", "hero-slides"]`
- category: `["catalog", "categories", "products"]`
- site-setting: `["catalog", "site-settings"]`
- policy: `["catalog", "site-settings"]`
- faq: `["catalog", "faqs"]`
- testimonial: `["catalog", "testimonials"]`
- site-metric: `["catalog", "site-metrics"]`
- blog-post: `["catalog", "blog-posts", "blog:<slug>"]`

Acceptance:

- Calling `/api/revalidate` for review clears catalog/product surfaces.
- Calling `/api/revalidate` for product clears catalog and the matching product detail tag.

## Step 6: Update Web Pages

Update these files as needed:

```text
apps/web/src/app/layout.tsx
apps/web/src/app/page.tsx
apps/web/src/app/san-pham/page.tsx
apps/web/src/app/san-pham/[slug]/page.tsx
apps/web/src/app/bang-gia/page.tsx
apps/web/src/app/huong-dan/page.tsx
apps/web/src/app/huong-dan/[slug]/page.tsx
apps/web/src/app/chinh-sach/[slug]/page.tsx
apps/web/src/app/feed.xml/route.ts
apps/web/src/app/sitemap.ts
```

Rules:

- Homepage uses `getCatalog()`.
- Product list can use `getCatalog()` for now.
- Product detail uses `getProductDetail(slug)`.
- Product `generateMetadata()` must not fetch full catalog.
- Avoid calling `getCatalog()` separately in both layout and page when a narrower settings function is enough.

Optional improvement:

- Add `getSiteShell()` for settings/footer/header only.

Acceptance:

- CMS log for a single product detail load should not show all collection endpoints.
- Product detail still renders product, reviews, related products, and CTAs.

## Step 7: Fix CMS Favicon Noise

Add:

```text
apps/cms/favicon.png
```

Use an existing small PNG asset if available. Otherwise create a simple valid 32x32 PNG.

Acceptance:

- `GET /favicon.ico` no longer logs `ENOENT` or returns `500`.

## Step 8: Measurement

Run before and after implementation:

```powershell
$urls = @(
  'http://localhost:1337/api/catalog',
  'http://localhost:1337/api/products-by-slug/product',
  'http://localhost:3000/',
  'http://localhost:3000/san-pham/product'
)

foreach ($url in $urls) {
  $sw=[System.Diagnostics.Stopwatch]::StartNew()
  $response=Invoke-WebRequest -UseBasicParsing $url -TimeoutSec 90
  $sw.Stop()
  "$url`t$($response.StatusCode)`t$($sw.ElapsedMilliseconds)ms"
}
```

Run the measurement twice.

Expected local prod-db targets:

- `/api/catalog`: warm target under `1500ms`; acceptable up to `3000ms` if DB remote is slow.
- `/api/products-by-slug/product`: warm target under `1000-2000ms`.
- `/`: warm target under `1500-2500ms`.
- `/san-pham/product`: warm target under `1500-2500ms`.

The key success criterion is eliminating repeated `6-25s` web page renders.

## Step 9: Verification Commands

Run:

```powershell
pnpm --filter @aivisionary/cms typecheck
pnpm --filter @aivisionary/web typecheck
pnpm --filter @aivisionary/web test
pnpm --filter @aivisionary/cms build
```

Restart local services after CMS build:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-local-prod-db.ps1 -Restart -SkipCmsBuild
```

Manual checks:

- `http://localhost:1337/api/catalog`
- `http://localhost:1337/api/products-by-slug/product`
- `http://localhost:3000/`
- `http://localhost:3000/san-pham/product`
- `http://localhost:3000/san-pham/auto-reup-master`

Review reassignment check:

- Review moved to HCLT-TTS appears on `/san-pham/product`.
- Same review no longer appears on `/san-pham/auto-reup-master`.

## Redis Decision

Do not add Redis in the first pass.

Add Redis only if, after the above changes:

- Production still has slow public page loads.
- Multiple app instances need shared cache.
- CMS aggregate endpoint remains expensive under real traffic.

If Redis is needed:

- Cache keys:
  - `catalog:v1`
  - `product-detail:v1:<slug>`
- TTL:
  - catalog: `60-300s`
  - product detail: `60-300s`
- Invalidate from CMS lifecycle hooks.
- Never cache admin/private/draft content.

## Implementation Order

1. Add CMS `/api/catalog`.
2. Add CMS `/api/products-by-slug/:slug`.
3. Refactor web `cms.ts` to use aggregate endpoints.
4. Add Next tag cache.
5. Update revalidation tags.
6. Update pages to avoid full catalog fetches where unnecessary.
7. Fix CMS favicon.
8. Run verification commands.
9. Measure before/after numbers and record them in the final response.

## Completion Criteria

The implementation is done when:

- Public web data still matches CMS edits.
- Review product reassignment still works.
- Homepage and product detail load materially faster on warm requests.
- CMS logs show fewer collection endpoint calls per web page load.
- Verification commands pass.
- Measurement numbers are reported.
