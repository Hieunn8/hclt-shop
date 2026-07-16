import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::policy.policy", {
  config: {
    find: { auth: false },
    findOne: { auth: false }
  }
});
