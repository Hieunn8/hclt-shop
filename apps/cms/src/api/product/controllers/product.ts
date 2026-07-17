import { factories } from "@strapi/strapi";

type ReviewRow = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt: Date | string | null;
  productSlug: string;
};

type RawResult = {
  rows?: ReviewRow[];
};

export default factories.createCoreController("api::product.product", ({ strapi }) => ({
  async findBySlug(ctx) {
    const slug = String(ctx.params.slug ?? "");
    const product = await strapi.db.query("api::product.product").findOne({
      where: { slug, publishedAt: { $notNull: true } },
      populate: { icon: true, media: true, category: true }
    });

    if (!product) return ctx.notFound("Product not found");

    const categorySlug = typeof product.category === "object" && product.category && "slug" in product.category ? String(product.category.slug) : "";

    const [reviewsResult, related, settings] = await Promise.all([
      strapi.db.connection.raw(
        `
          select
            r.id,
            r.document_id as "documentId",
            r.name,
            r.slug,
            r.rating,
            r.comment,
            r.approved,
            r.created_at as "createdAt",
            r.updated_at as "updatedAt",
            r.published_at as "publishedAt",
            p.slug as "productSlug"
          from reviews r
          inner join reviews_product_lnk l on l.review_id = r.id
          inner join products p on p.id = l.product_id and p.published_at is not null
          where r.approved = true and p.slug = ?
          order by r.created_at desc, r.id desc
        `,
        [slug]
      ) as Promise<RawResult>,
      categorySlug
        ? strapi.db.query("api::product.product").findMany({
            where: { slug: { $ne: slug }, publishedAt: { $notNull: true }, category: { slug: categorySlug } },
            limit: 3,
            orderBy: { publishedAt: "desc" },
            populate: { icon: true, media: true, category: true }
          })
        : Promise.resolve([]),
      strapi.db.query("api::site-setting.site-setting").findOne({ where: { publishedAt: { $notNull: true } } })
    ]);

    return {
      data: {
        product,
        reviews: reviewsResult.rows ?? [],
        related,
        settings
      }
    };
  }
}));
