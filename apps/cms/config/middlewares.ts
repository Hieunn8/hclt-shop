export default [
  "strapi::logger",
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": ["'self'", "data:", "blob:", "https:"],
          "media-src": ["'self'", "data:", "blob:", "https:"],
          upgradeInsecureRequests: null
        }
      }
    }
  },
  {
    name: "strapi::cors",
    config: {
      enabled: true,
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        process.env.FRONTEND_URL || "https://hieuchanlaptrinh.top"
      ],
      headers: ["Content-Type", "Authorization", "Origin", "Accept", "x-revalidate-secret"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    }
  },
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public"
];
