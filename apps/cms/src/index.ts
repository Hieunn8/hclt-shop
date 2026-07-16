type StrapiLike = {
  query(uid: string): {
    findOne(args: unknown): Promise<Record<string, unknown> | null>;
  };
  plugin(name: string): {
    service(name: string): {
      getPermissions(roleId: number): Promise<PermissionRecord[]>;
      updatePermissions(roleId: number, permissions: PermissionRecord[]): Promise<unknown>;
    };
  };
  log: {
    info(message: string): void;
    warn(message: string): void;
  };
};

type PermissionRecord = {
  action: string;
  enabled: boolean;
};

const PUBLIC_READ_ACTIONS = new Set([
  "api::category.category.find",
  "api::category.category.findOne",
  "api::product.product.find",
  "api::product.product.findOne",
  "api::hero-slide.hero-slide.find",
  "api::hero-slide.hero-slide.findOne",
  "api::faq.faq.find",
  "api::faq.faq.findOne",
  "api::testimonial.testimonial.find",
  "api::testimonial.testimonial.findOne",
  "api::site-metric.site-metric.find",
  "api::site-metric.site-metric.findOne",
  "api::blog-post.blog-post.find",
  "api::blog-post.blog-post.findOne",
  "api::policy.policy.find",
  "api::policy.policy.findOne",
  "api::site-setting.site-setting.find",
  "api::health.health.index"
]);

const PUBLIC_MUTATION_PREFIXES = [
  "api::review.review.create",
  "api::review.review.update",
  "api::review.review.delete",
  "api::product.product.create",
  "api::product.product.update",
  "api::product.product.delete",
  "api::hero-slide.hero-slide.create",
  "api::hero-slide.hero-slide.update",
  "api::hero-slide.hero-slide.delete",
  "api::faq.faq.create",
  "api::faq.faq.update",
  "api::faq.faq.delete",
  "api::testimonial.testimonial.create",
  "api::testimonial.testimonial.update",
  "api::testimonial.testimonial.delete",
  "api::site-metric.site-metric.create",
  "api::site-metric.site-metric.update",
  "api::site-metric.site-metric.delete",
  "api::blog-post.blog-post.create",
  "api::blog-post.blog-post.update",
  "api::blog-post.blog-post.delete"
];

export default {
  async bootstrap({ strapi }: { strapi: StrapiLike }) {
    if (process.env.CONFIGURE_PUBLIC_PERMISSIONS !== "true") {
      strapi.log.info("Public permission bootstrap skipped. Set CONFIGURE_PUBLIC_PERMISSIONS=true to apply.");
      return;
    }

    const publicRole = await strapi.query("plugin::users-permissions.role").findOne({
      where: { type: "public" }
    });
    const roleId = typeof publicRole?.id === "number" ? publicRole.id : undefined;
    if (!roleId) {
      strapi.log.warn("Public role not found; permission bootstrap skipped.");
      return;
    }

    const service = strapi.plugin("users-permissions").service("role");
    const permissions = await service.getPermissions(roleId);
    const nextPermissions = permissions.map((permission) => ({
      ...permission,
      enabled: shouldEnablePublicPermission(permission.action)
    }));

    await service.updatePermissions(roleId, nextPermissions);
    strapi.log.info("Public role permissions configured for read-only published content.");
  }
};

function shouldEnablePublicPermission(action: string): boolean {
  if (PUBLIC_READ_ACTIONS.has(action)) return true;
  if (PUBLIC_MUTATION_PREFIXES.some((prefix) => action.startsWith(prefix))) return false;
  return false;
}
