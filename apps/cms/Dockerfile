FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/cms/package.json apps/cms/package.json
RUN pnpm install --filter @aivisionary/cms... --frozen-lockfile=false

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/cms/node_modules ./apps/cms/node_modules
COPY apps/cms ./apps/cms
WORKDIR /app/apps/cms
RUN pnpm build

FROM node:22-alpine
WORKDIR /app/apps/cms
ENV NODE_ENV=production
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/cms ./
COPY --from=builder /app/apps/cms/node_modules ./node_modules
EXPOSE 1337
CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]
