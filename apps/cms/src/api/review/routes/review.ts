import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::review.review", {
  config: {
    find: { auth: false },
    findOne: { auth: false }
  }
});
