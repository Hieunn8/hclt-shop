import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::faq.faq", {
  config: {
    find: { auth: false },
    findOne: { auth: false }
  }
});
