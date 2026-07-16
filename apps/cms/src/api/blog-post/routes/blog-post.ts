import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::blog-post.blog-post", {
  config: {
    find: { auth: false },
    findOne: { auth: false }
  }
});
