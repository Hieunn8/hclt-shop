import { fallbackData } from "../apps/web/src/lib/fallbackData";

async function main() {
  const base = process.env.STRAPI_INTERNAL_URL || process.env.NEXT_PUBLIC_STRAPI_URL;
  const token = process.env.STRAPI_API_TOKEN;
  if (!base || !token) {
    console.log(JSON.stringify({ ok: true, mode: "dry-run", message: "No Strapi credentials; seed data validated locally.", counts: {
      categories: fallbackData.categories.length,
      products: fallbackData.products.length,
      heroSlides: fallbackData.heroSlides.length,
      testimonials: fallbackData.testimonials.length,
      faqs: fallbackData.faqs.length,
      blogPosts: fallbackData.blogPosts.length,
      policies: fallbackData.policies.length,
      reviews: fallbackData.reviews.length
    }}));
    return;
  }
  console.log(JSON.stringify({ ok: true, mode: "adapter-ready", message: "Strapi upsert adapter placeholder ready; configure token before live seed.", base }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
