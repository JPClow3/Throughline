# Web PWA — build the static bundle with Vite, then serve it with nginx.
# Build context is the repo ROOT: `docker build -f apps/web/Dockerfile .`

# ---------- build stage ----------
FROM node:24-alpine AS build

WORKDIR /app

# Workspace manifests + lockfile first for layer caching.
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/push-api/package.json ./apps/push-api/package.json
COPY packages/domain/package.json ./packages/domain/package.json

# Full install (build needs dev deps: vite, tailwind, tsc).
RUN npm ci

# Sources needed to build the web app (it imports the domain package).
# tsconfig.base.json is extended by the workspace tsconfigs.
COPY tsconfig.base.json ./tsconfig.base.json
COPY packages/domain ./packages/domain
COPY apps/web ./apps/web

# Build-time env (Vite inlines these). Same-origin /api by default, so the
# image is domain-agnostic. VAPID public key is optional (also settable in UI).
ARG VITE_PUSH_API_URL=/api
ARG VITE_VAPID_PUBLIC_KEY=
ENV VITE_PUSH_API_URL=$VITE_PUSH_API_URL \
    VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

RUN npm run build -w apps/web

# ---------- runtime stage ----------
FROM nginx:alpine AS runtime

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
