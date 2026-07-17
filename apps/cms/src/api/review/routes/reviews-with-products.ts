export default {
  routes: [
    {
      method: "GET",
      path: "/reviews-with-products",
      handler: "review.findWithProducts",
      config: { auth: false }
    }
  ]
};
