export default {
  routes: [
    {
      method: "GET",
      path: "/products-by-slug/:slug",
      handler: "product.findBySlug",
      config: { auth: false }
    }
  ]
};
