# syntax=docker/dockerfile:1

# openssl est requis par les moteurs Prisma, libc6-compat par les binaires
# précompilés (Next SWC) sur Alpine.
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# --- Dépendances ---------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
# --ignore-scripts : le postinstall lance `prisma generate`, or le schéma
# n'est pas encore copié à ce stade. La génération a lieu au stade builder.
RUN npm ci --ignore-scripts

# --- Build ---------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Les variables NEXT_PUBLIC_* sont figées dans le bundle client au build :
# elles doivent être fournies ici, pas seulement au runtime.
ARG NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# --- Runtime -------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Le CLI Prisma, son schéma et le client généré : nécessaires au service
# `migrate` du docker-compose, et le moteur de requête l'est au runtime.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# node_modules/.bin/prisma est un lien symbolique, et COPY suit les liens : le
# copier déposerait le vrai build/index.js dans .bin/, où il ne retrouverait
# plus les .wasm qu'il charge depuis son propre dossier. On recrée le lien.
RUN mkdir -p node_modules/.bin \
  && ln -sf ../prisma/build/index.js node_modules/.bin/prisma

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
