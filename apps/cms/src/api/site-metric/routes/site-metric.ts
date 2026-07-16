import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::site-metric.site-metric", {
  config: {
    find: { auth: false },
    findOne: { auth: false }
  }
});
