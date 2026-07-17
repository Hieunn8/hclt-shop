import { factories } from "@strapi/strapi";

type ReviewWithProductRow = {
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
  productSlug: string | null;
  productName: string | null;
};

type RawResult = {
  rows?: ReviewWithProductRow[];
};

export default factories.createCoreController("api::review.review", ({ strapi }) => ({
  async findWithProducts() {
    const result = (await strapi.db.connection.raw(`
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
    `)) as RawResult;

    const rows = result.rows ?? [];

    return {
      data: rows.map((row) => ({
        id: row.id,
        documentId: row.documentId,
        name: row.name,
        slug: row.slug,
        rating: row.rating,
        comment: row.comment,
        approved: row.approved,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        publishedAt: row.publishedAt,
        productSlug: row.productSlug,
        productName: row.productName
      })),
      meta: { pagination: { page: 1, pageSize: rows.length, pageCount: 1, total: rows.length } }
    };
  }
}));
