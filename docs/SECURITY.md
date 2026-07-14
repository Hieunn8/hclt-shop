# Security Checklist

- Rotate any password that appeared in chat before go-live.
- Keep `.env`, private keys, tokens, dumps, and backups out of Git.
- Frontend reads Strapi with server-side token only.
- Public browser never receives `STRAPI_API_TOKEN`.
- Contact/review mutations go through Next.js API handlers with Zod validation, honeypot, and rate-limit.
- Revalidation uses `x-revalidate-secret` with constant-time comparison.
- Production DB is refused unless `ALLOW_PRODUCTION_DB=true`.
- Nginx sends `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- Configure HTTPS/HSTS after certificate validation.
- Restrict Strapi CORS to the production frontend and preview domains.
- Disable public create permissions in Strapi; frontend route handlers own mutations.
- To bootstrap read-only public permissions, set `CONFIGURE_PUBLIC_PERMISSIONS=true` for one controlled CMS start, verify the Public role, then set it back to `false`.
