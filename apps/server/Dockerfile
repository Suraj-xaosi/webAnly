FROM node:20-alpine AS base

# ---- Prune the monorepo down to just what `server` needs ----
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@^2.8.17
COPY . .
RUN turbo prune server --docker

# ---- Install deps + build ----
FROM base AS installer
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY --from=pruner /app/out/json/ .
RUN npm ci

COPY --from=pruner /app/out/full/ .
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma
RUN npx turbo run build --filter=server...
# Strip devDependencies (typescript, tsx, eslint, etc.) now that build is done
RUN npm prune --omit=dev

# ---- Minimal runtime image ----
FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 expressjs

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages ./packages
COPY --from=installer /app/apps/server ./apps/server
COPY --from=installer --chown=expressjs:nodejs /app/apps/server/GeoLite2-City.mmdb /app/apps/server/GeoLite2-City.mmdb
RUN chown -R expressjs:nodejs /app/apps/server

USER expressjs
WORKDIR /app/apps/server
EXPOSE 4000

CMD ["node", "dist/index.js"]