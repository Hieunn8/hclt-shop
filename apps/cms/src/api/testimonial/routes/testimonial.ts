import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::testimonial.testimonial", {
  config: {
    find: { auth: false },
    findOne: { auth: false }
  }
});
