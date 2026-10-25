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

# --- Migrations ----------------------------------------------------------
# Image à part, pour le service `migrate` du docker-compose. Le CLI Prisma
# traîne son propre arbre de dépendances (@prisma/config → effect, c12…) :
# recopier les seuls dossiers prisma/ et @prisma/ dans l'image applicative
# laissait ces transitives derrière, d'où un MODULE_NOT_FOUND. On garde donc
# node_modules en entier ici — l'image ne sert qu'à jouer les migrations et
# n'est jamais déployée.
FROM base AS migrator
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

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

# Le client généré et son moteur de requête. Le tracing de Next les embarque
# déjà dans .next/standalone ; ces deux lignes sont une ceinture de sécurité,
# un oubli du tracing ne se verrait qu'à l'exécution. Le CLI Prisma, lui,
# n'a rien à faire ici : les migrations tournent depuis l'étape `migrator`.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
