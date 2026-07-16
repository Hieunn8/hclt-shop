import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fallbackData } from "../apps/web/src/lib/fallbackData";
import type { BlogPost, Category, Faq, HeroSlide, MediaAsset, Policy, Product, Review, SiteMetric, Testimonial } from "../apps/web/src/lib/types";

type StrapiApp = {
  load: () => Promise<void>;
  destroy: () => Promise<void>;
  documents: (uid: string) => {
    findFirst: (params?: Record<string, unknown>) => Promise<StrapiRecord | null>;
    create: (params: Record<string, unknown>) => Promise<StrapiRecord>;
    update: (params: Record<string, unknown>) => Promise<StrapiRecord>;
  };
  db: {
    query: (uid: string) => {
      findOne: (params: Record<string, unknown>) => Promise<UploadFile | null>;
    };
  };
  plugin: (name: string) => {
    service: (name: string) => {
      upload: (params: Record<string, unknown>) => Promise<UploadFile[]>;
    };
  };
};

type StrapiRecord = {
  id?: number;
  documentId?: string;
  slug?: string;
};

type UploadFile = {
  id: number;
  name: string;
  url: string;
};

type DirectSeedContext = {
  strapi: StrapiApp;
  uploaded: Map<string, UploadFile>;
};

const repoRoot = path.resolve(__dirname, "..");
const cmsDir = path.join(repoRoot, "apps/cms");
const assetsDir = path.join(repoRoot, "apps/web/public/assets");

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function relationKey(record?: StrapiRecord): string | number | undefined {
  return record?.documentId ?? record?.id;
}

function publishParams(uid: string, data: Record<string, unknown>, documentId?: string): Record<string, unknown> {
  const params: Record<string, unknown> = { data };
  if (documentId) params.documentId = documentId;
  if (uid !== "api::review.review") params.status = "published";
  return params;
}

async function upsertBySlug(ctx: DirectSeedContext, uid: string, slug: string, data: Record<string, unknown>): Promise<StrapiRecord> {
  const document = ctx.strapi.documents(uid);
  const existing = await document.findFirst({ filters: { slug } });
  if (existing?.documentId) return document.update(publishParams(uid, data, existing.documentId));
  return document.create(publishParams(uid, data));
}

async function updateSingle(ctx: DirectSeedContext, uid: string, data: Record<string, unknown>): Promise<StrapiRecord> {
  const document = ctx.strapi.documents(uid);
  const existing = await document.findFirst();
  if (existing?.documentId) return document.update(publishParams(uid, data, existing.documentId));
  return document.create(publishParams(uid, data));
}

function assetFilename(asset?: MediaAsset): string | undefined {
  if (!asset?.url.startsWith("/assets/")) return undefined;
  return path.basename(asset.url);
}

async function uploadAsset(ctx: DirectSeedContext, asset?: MediaAsset): Promise<number | undefined> {
  const filename = assetFilename(asset);
  if (!filename) return undefined;
  const filepath = path.join(assetsDir, filename);
  if (!existsSync(filepath)) throw new Error(`Missing seed asset ${filepath}`);

  const cached = ctx.uploaded.get(filename);
  if (cached) return cached.id;

  const existing = await ctx.strapi.db.query("plugin::upload.file").findOne({ where: { name: filename } });
  if (existing) {
    ensureLocalUploadFile(existing, filepath);
    ctx.uploaded.set(filename, existing);
    return existing.id;
  }

  mkdirSync(path.join(cmsDir, "public/uploads"), { recursive: true });

  const fileStat = statSync(filepath);
  const uploaded = await ctx.strapi.plugin("upload").service("upload").upload({
    data: {
      fileInfo: {
        name: filename,
        alternativeText: asset?.alt ?? filename
      }
    },
    files: {
      filepath,
      originalFilename: filename,
      mimetype: "image/svg+xml",
      size: fileStat.size
    }
  });

  if (!uploaded[0]) throw new Error(`Upload did not return file for ${filename}`);
  ctx.uploaded.set(filename, uploaded[0]);
  return uploaded[0].id;
}

function ensureLocalUploadFile(existing: UploadFile, sourcePath: string) {
  if (!existing.url.startsWith("/uploads/")) return;
  const targetPath = path.join(cmsDir, "public", existing.url.replace(/^\//, ""));
  if (existsSync(targetPath)) return;
  mkdirSync(path.dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}

async function uploadAssets(ctx: DirectSeedContext, assets: MediaAsset[]): Promise<number[]> {
  const ids = await Promise.all(assets.map((asset) => uploadAsset(ctx, asset)));
  return ids.filter((id): id is number => typeof id === "number");
}

function categoryPayload(category: Category, icon?: number): Record<string, unknown> {
  return { name: category.name, slug: category.slug, description: category.description, icon };
}

function productPayload(product: Product, category?: StrapiRecord, media?: number[]): Record<string, unknown> {
  return {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    badge: product.badge,
    rating: product.rating,
    reviewCount: product.reviewCount,
    icon: media?.[0],
    media,
    features: product.features.join("\n"),
    usageSteps: product.usageSteps.join("\n"),
    purchaseUrl: product.purchaseUrl,
    zaloUrl: product.zaloUrl,
    category: relationKey(category)
  };
}

function heroSlidePayload(slide: HeroSlide, product?: StrapiRecord, image?: number, sortOrder = 0): Record<string, unknown> {
  return { title: slide.title, slug: slide.id, description: slide.description, sortOrder, active: true, image, product: relationKey(product) };
}

function testimonialPayload(testimonial: Testimonial, sortOrder = 0): Record<string, unknown> {
  return { name: testimonial.name, slug: testimonial.id, role: testimonial.role, quote: testimonial.quote, rating: testimonial.rating, sortOrder, active: true };
}

function faqPayload(faq: Faq, sortOrder = 0): Record<string, unknown> {
  return { question: faq.question, slug: faq.id, answer: faq.answer, sortOrder, active: true };
}

function siteMetricPayload(metric: SiteMetric, sortOrder = 0): Record<string, unknown> {
  return { value: metric.value, label: metric.label, slug: metric.id, sortOrder, active: true };
}

function blogPayload(post: BlogPost, image?: number): Record<string, unknown> {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    image,
    content: [{ type: "paragraph", children: [{ type: "text", text: post.content }] }],
    category: post.category,
    author: post.author,
    seoTitle: post.title,
    seoDescription: post.excerpt
  };
}

function policyPayload(policy: Policy): Record<string, unknown> {
  return {
    title: policy.title,
    slug: policy.slug,
    content: [{ type: "paragraph", children: [{ type: "text", text: policy.content }] }],
    seoDescription: policy.content.slice(0, 150)
  };
}

function reviewPayload(review: Review, product?: StrapiRecord): Record<string, unknown> {
  const emailHash = createHash("sha256").update(`${review.name}:${review.productSlug}`).digest("hex");
  return { slug: `${review.productSlug}-${review.id}`, name: review.name, emailHash, rating: review.rating, comment: review.comment, approved: review.status === "approved", product: relationKey(product) };
}

async function seed(ctx: DirectSeedContext) {
  await updateSingle(ctx, "api::site-setting.site-setting", { ...fallbackData.settings, promo: fallbackData.settings.promo });

  const firstProductByCategory = new Map<string, Product>();
  for (const product of fallbackData.products) {
    if (!firstProductByCategory.has(product.categorySlug)) firstProductByCategory.set(product.categorySlug, product);
  }

  const categories = new Map<string, StrapiRecord>();
  for (const category of fallbackData.categories) {
    const icon = await uploadAsset(ctx, firstProductByCategory.get(category.slug)?.media[0]);
    categories.set(category.slug, await upsertBySlug(ctx, "api::category.category", category.slug, categoryPayload(category, icon)));
  }

  const products = new Map<string, StrapiRecord>();
  for (const product of fallbackData.products) {
    const media = await uploadAssets(ctx, product.media);
    products.set(product.slug, await upsertBySlug(ctx, "api::product.product", product.slug, productPayload(product, categories.get(product.categorySlug), media)));
  }

  for (const [index, slide] of fallbackData.heroSlides.entries()) {
    const image = await uploadAsset(ctx, slide.image);
    await upsertBySlug(ctx, "api::hero-slide.hero-slide", slide.id, heroSlidePayload(slide, products.get(slide.productSlug), image, index));
  }

  for (const [index, testimonial] of fallbackData.testimonials.entries()) {
    await upsertBySlug(ctx, "api::testimonial.testimonial", testimonial.id, testimonialPayload(testimonial, index));
  }

  for (const [index, faq] of fallbackData.faqs.entries()) {
    await upsertBySlug(ctx, "api::faq.faq", faq.id, faqPayload(faq, index));
  }

  for (const [index, metric] of fallbackData.siteMetrics.entries()) {
    await upsertBySlug(ctx, "api::site-metric.site-metric", metric.id, siteMetricPayload(metric, index));
  }

  for (const post of fallbackData.blogPosts) {
    const image = await uploadAsset(ctx, post.image);
    await upsertBySlug(ctx, "api::blog-post.blog-post", post.slug, blogPayload(post, image));
  }

  for (const policy of fallbackData.policies) {
    await upsertBySlug(ctx, "api::policy.policy", policy.slug, policyPayload(policy));
  }

  for (const review of fallbackData.reviews) {
    await upsertBySlug(ctx, "api::review.review", `${review.productSlug}-${review.id}`, reviewPayload(review, products.get(review.productSlug)));
  }
}

async function main() {
  loadEnvFile(path.join(repoRoot, "deploy/env/cms.env"));
  process.env.NODE_ENV = process.env.NODE_ENV || "production";
  process.env.PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:1337";
  process.env.CONFIGURE_PUBLIC_PERMISSIONS = "false";
  process.env.FRONTEND_REVALIDATE_URL = "";
  process.env.REVALIDATE_SECRET = "";

  if (!existsSync(path.join(cmsDir, "dist"))) {
    throw new Error("apps/cms/dist not found. Run `pnpm --filter @aivisionary/cms build` before seed:direct.");
  }

  const requireFromCms = createRequire(path.join(cmsDir, "package.json"));
  const { createStrapi } = requireFromCms("@strapi/strapi") as { createStrapi: (options: Record<string, unknown>) => StrapiApp };

  process.chdir(cmsDir);
  const strapi = createStrapi({ distDir: path.join(cmsDir, "dist") });
  await strapi.load();

  try {
    await seed({ strapi, uploaded: new Map() });
    console.log(JSON.stringify({
      ok: true,
      mode: "strapi-direct-upsert",
      counts: {
        categories: fallbackData.categories.length,
        products: fallbackData.products.length,
        heroSlides: fallbackData.heroSlides.length,
        testimonials: fallbackData.testimonials.length,
        faqs: fallbackData.faqs.length,
        siteMetrics: fallbackData.siteMetrics.length,
        blogPosts: fallbackData.blogPosts.length,
        policies: fallbackData.policies.length,
        reviews: fallbackData.reviews.length
      }
    }));
  } finally {
    await Promise.race([
      strapi.destroy(),
      new Promise((resolve) => setTimeout(resolve, 10_000))
    ]);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
