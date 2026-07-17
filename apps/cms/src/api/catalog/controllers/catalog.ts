type StrapiLike = {
  db: {
    query(uid: string): {
      findOne(args?: unknown): Promise<Record<string, unknown> | null>;
      findMany(args?: unknown): Promise<Record<string, unknown>[]>;
    };
    connection: {
      raw(sql: string): Promise<{ rows?: Record<string, unknown>[] }>;
    };
  };
};

declare const strapi: StrapiLike;

async function publishedMany(strapi: StrapiLike, uid: string, args: Record<string, unknown> = {}) {
  return strapi.db.query(uid).findMany({
    ...args,
    where: {
      ...((args.where as Record<string, unknown> | undefined) ?? {}),
      publishedAt: { $notNull: true }
    }
  });
}

async function approvedReviewsWithProducts(strapi: StrapiLike) {
  const result = await strapi.db.connection.raw(`
    select distinct on (r.id)
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
      p.slug as "productSlug",
      p.name as "productName"
    from reviews r
    left join reviews_product_lnk l on l.review_id = r.id
    left join products p on p.id = l.product_id and p.published_at is not null
    where r.approved = true
    order by r.id, p.published_at desc nulls last, l.id desc
  `);

  return result.rows ?? [];
}

export default {
  async index() {
    const [
      settings,
      categories,
      products,
      heroSlides,
      siteMetrics,
      testimonials,
      faqs,
      blogPosts,
      policies,
      reviews
    ] = await Promise.all([
      strapi.db.query("api::site-setting.site-setting").findOne({ where: { publishedAt: { $notNull: true } } }),
      publishedMany(strapi, "api::category.category", { orderBy: { name: "asc" } }),
      publishedMany(strapi, "api::product.product", {
        orderBy: { publishedAt: "desc" },
        populate: { icon: true, media: true, category: true }
      }),
      publishedMany(strapi, "api::hero-slide.hero-slide", {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        populate: { image: true, product: true }
      }),
      publishedMany(strapi, "api::site-metric.site-metric", {
        where: { active: true },
        orderBy: { sortOrder: "asc" }
      }),
      publishedMany(strapi, "api::testimonial.testimonial", {
        where: { active: true },
        orderBy: { sortOrder: "asc" }
      }),
      publishedMany(strapi, "api::faq.faq", {
        where: { active: true },
        orderBy: { sortOrder: "asc" }
      }),
      publishedMany(strapi, "api::blog-post.blog-post", {
        orderBy: { publishedAt: "desc" },
        populate: { image: true }
      }),
      publishedMany(strapi, "api::policy.policy", {
        orderBy: { title: "asc" }
      }),
      approvedReviewsWithProducts(strapi)
    ]);

    return {
      data: {
        settings,
        categories,
        products,
        heroSlides,
        siteMetrics,
        testimonials,
        faqs,
        blogPosts,
        policies,
        reviews
      }
    };
  }
};
