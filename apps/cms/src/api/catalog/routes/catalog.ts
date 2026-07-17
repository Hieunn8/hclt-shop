export default {
  routes: [
    {
      method: "GET",
      path: "/catalog",
      handler: "catalog.index",
      config: { auth: false }
    }
  ]
};
