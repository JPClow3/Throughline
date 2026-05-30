# Push API — runs the Fastify server with tsx (transpiles TS + the domain
# TS-source workspace dep at runtime; the repo intentionally has noEmit:true).
# Build context is the repo ROOT: `docker build -f apps/push-api/Dockerfile .`
FROM node:24-alpine

WORKDIR /app

# Workspace manifests + lockfile first for layer caching. All workspace
# package.json files are required so `npm ci` can resolve the workspace tree.
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/push-api/package.json ./apps/push-api/package.json
COPY packages/domain/package.json ./packages/domain/package.json

# Production deps only (tsx is a prod dep of push-api).
RUN npm ci --omit=dev

# Source: the API plus the domain package it imports as TS source.
COPY packages/domain ./packages/domain
COPY apps/push-api ./apps/push-api

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    PUSH_STORE_PATH=/data/push-store.json

# Persistent store location (mount a volume here in compose).
RUN mkdir -p /data

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8787/health || exit 1

CMD ["npm", "run", "start", "-w", "apps/push-api"]
