# Deployment & Release

This document covers deployment options, PWA offline capabilities, and release readiness for Throughline.

Throughline supports two primary production deployment architectures:
1. **Cloudflare Edge (Cloudflare Pages + Cloudflare Workers + D1)** — Serverless edge deployment with automatic GitHub integration, zero-maintenance global scaling, and built-in cron triggers.
2. **Docker / Dokploy on EC2** — Single-server containerized deployment with Traefik ingress and Let's Encrypt TLS.

---

## 1. Cloudflare Deployment (Pages + Workers + D1)

Throughline can be deployed entirely on the Cloudflare developer platform:
- **Frontend**: Cloudflare Pages hosts the Vite React PWA from `apps/web/dist`, with custom security headers and service worker caching rules defined in `_headers` and SPA routing via `_redirects`.
- **Backend API**: Cloudflare Workers (`apps/push-api`) handles push subscriptions, VAPID dispatch, user authentication, and E2EE encrypted sync.
- **Database**: Cloudflare D1 (serverless SQLite at the edge) stores user credentials, sessions, encrypted ciphertext sync records, push subscriptions, and redacted reminders.
- **Background Cron**: Cloudflare Scheduled Triggers (`*/5 * * * *`) automatically invoke the reminder dispatcher every 5 minutes without needing an external cron server.

### Architecture

```
                          ┌───────────────────────── Cloudflare Edge ──────────────────────────┐
    Browser (PWA) ───────▶│  Cloudflare Pages (apps/web)                                      │
                          │    ├─ Static Assets, Icons, Manifest                               │
                          │    ├─ sw.js (Service Worker caching & background sync)             │
                          │    └─ /api/* ─── Route / Proxy ───────────────────────┐            │
                          │                                                       │            │
                          │  Cloudflare Worker (apps/push-api)  ◀─────────────────┘            │
                          │    ├─ Auth & Sessions                                              │
                          │    ├─ E2EE Ciphertext Sync (pull / push)                           │
                          │    ├─ Push Subscriptions & Redacted Reminders                      │
                          │    ├─ D1 Database (SQLite at the edge)                             │
                          │    └─ Scheduled Cron (*/5 * * * *) ──▶ Dispatches Due Reminders    │
    Browser SW   ◀───────│        └─ Web Push (VAPID / Web Crypto) ─────────────┘            │
                          └────────────────────────────────────────────────────────────────────┘
```

### Steps to Deploy

#### Step 1: Create the Cloudflare D1 Database
```bash
npx wrangler d1 create throughline-db
```
Copy the returned `database_id` and update it in `apps/push-api/wrangler.jsonc`.

Apply the initial database schema:
```bash
# Local development database
npm run d1:migrate:local

# Production Cloudflare D1 database
npm run d1:migrate:remote
```

#### Step 2: Configure Secrets in Cloudflare Workers
Set production secrets on the worker:
```bash
npx wrangler secret put VAPID_PUBLIC_KEY --config apps/push-api/wrangler.jsonc
npx wrangler secret put VAPID_PRIVATE_KEY --config apps/push-api/wrangler.jsonc
npx wrangler secret put VAPID_SUBJECT --config apps/push-api/wrangler.jsonc
npx wrangler secret put SESSION_SECRET --config apps/push-api/wrangler.jsonc
npx wrangler secret put DISPATCH_TOKEN --config apps/push-api/wrangler.jsonc
# Optional Google OAuth
npx wrangler secret put GOOGLE_CLIENT_ID --config apps/push-api/wrangler.jsonc
```

#### Step 3: Deploy Worker
```bash
npm run deploy:worker
```

#### Step 4: Deploy Frontend to Cloudflare Pages

**Option A: Cloudflare Dashboard GitHub Integration (Automatic Git Builds)**
1. In Cloudflare Dashboard, navigate to **Compute (Workers) > Pages > Connect to Git**.
2. Select your GitHub repository.
3. Configure Build Settings:
   - **Framework preset**: `None` / `Vite`
   - **Build command**: `npm run build:pages`
   - **Build output directory**: `apps/web/dist`
   - **Root directory**: `/`
4. Add Environment Variables:
   - `NODE_VERSION`: `24`
   - `VITE_PUSH_API_URL`: `/api` (if using custom domain route or proxy) or `https://throughline-api.<your-account>.workers.dev`
   - `VITE_VAPID_PUBLIC_KEY`: your VAPID public key
   - `VITE_GOOGLE_CLIENT_ID`: (optional) your Google OAuth client ID
5. Click **Save and Deploy**. Cloudflare Pages will automatically deploy every push to `main` and generate preview deployments for Pull Requests.

**Option B: GitHub Actions Automated CI/CD Workflow**
The repository includes `.github/workflows/deploy-cloudflare.yml`.
1. In your GitHub repository settings, go to **Settings > Secrets and variables > Actions**.
2. Add the following repository secrets:
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API token with `Workers & Pages: Edit` permissions.
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`: Web Push VAPID keys.
   - `SESSION_SECRET`: Session cookie secret.
   - `GOOGLE_CLIENT_ID`: (optional) Google OAuth client ID.
   - `DISPATCH_TOKEN`: (optional) Bearer token for `/dispatch-due`.
3. Pushes to `main` will automatically build the PWA, apply D1 database migrations, deploy the Worker, and deploy Pages.

### Domain & Same-Origin Routing
To ensure seamless cookies and zero CORS configuration:
1. Assign a custom domain to your Pages project (e.g. `app.throughline.dev`).
2. Add a Worker route or custom domain for the API (e.g. `app.throughline.dev/api/*` routing to `throughline-api`).
3. The frontend and backend communicate via `/api/*` on the same origin with first-party `HttpOnly` session cookies.

---

## 2. Deployment (Docker First & Dokploy on EC2)

Throughline is also containerized for Dokploy (Traefik ingress + Let's Encrypt TLS) on an AWS EC2 instance.

### Architecture
```
                         ┌────────────────────────── EC2 host ──────────────────────────┐
   Browser  ──HTTPS──▶  Traefik (Dokploy)                                                │
   (PWA)               │   ├─ Host(APP_HOST) /        ─────────▶  web (nginx :80)        │
                       │   └─ Host(APP_HOST) /api/*   ──strip──▶  push-api (Fastify :8787)│
                       │                                              │  ▲                │
   Browser SW  ◀──Web Push (FCM/Mozilla/Apple)◀── web-push (VAPID) ───┘  │ POST /dispatch-due
                       │                                          push-store.json (volume) │
                       │   ofelia (cron) ──docker exec every 5m──────────┘                │
                       └───────────────────────────────────────────────────────────────┘
```

### Steps to Deploy
1. **Provision EC2**: Ubuntu LTS, t3.medium recommended. Allocate Elastic IP, open ports 22, 80, 443. Point domain to it.
2. **Install Dokploy**: `curl -sSL https://dokploy.com/install.sh | sh`
3. **Compose Application**: In Dokploy, create a Compose service pointing to this Git repo. The only required variable for the basic stack is `APP_HOST`.
4. **Deploy**: Dokploy builds the images and starts `web` + `push-api` + `ofelia`.

### Optional Environment Variables
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `VITE_VAPID_PUBLIC_KEY`: enable Web Push.
- `SESSION_SECRET`: recommended for production account/auth deployments.
- `DISPATCH_TOKEN`: recommended so `/dispatch-due` is not callable without a bearer token.
- `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID`: enable Google sign-in.
- `CORS_ORIGIN`: restrict CORS instead of allowing all origins.
- `RATE_LIMIT_MAX`: override the default API rate limit.
- `TRAEFIK_ENTRYPOINT`, `TRAEFIK_CERTRESOLVER`: override Dokploy/Traefik defaults only if your setup differs.

---

## 3. Offline PWA

The web app uses `vite-plugin-pwa` configured with `injectManifest`.

- **Service Worker**: A custom service worker (`sw.ts`) precaches the app shell via Workbox, handles `sync` and `periodicsync` background events, registers Web Push listeners, and falls back to `/index.html`.
- **Data**: Offline user data is stored in IndexedDB through Dexie. The service worker handles assets, while IndexedDB stores tasks, courses, and progress.
- **Generated Files**: `apps/web/dist` and `apps/web/dev-dist` are ignored by git.
- **Check**: App loads from preview server, survives reload offline, core views render without push API.

---

## 4. Release & Store Readiness

### PWA Checklist
- Manifest has valid properties (`Throughline`, stable `id`, standalone / display overrides, icons, shortcuts, widgets, share_target, protocols, file_handlers, iarc_rating_id, etc).
- Offline shell works down to 320px breakpoints.
- IndexedDB survives reload.
- Notification states clear when API missing.
- Error boundary active. JSON export works.

### Microsoft Store Path
1. Run all quality gates.
2. Validate installability in Edge; run Lighthouse checks.
3. Confirm privacy copy.
4. Generate Store Screenshots (1366x768 or 2560x1440).
5. Use [PWABuilder](https://www.pwabuilder.com/) with production URL.
6. Verify manifest has a stable app id, 192x192 and 512x512 icons, and the Windows Store related application entry.
7. Keep the launch flow focused on the existing client and package the Windows store bundle.

### Release Blockers
- Unredacted task data reaching push API.
- Offline app shell failure.
- Broken IndexedDB migration.
- Unreadable text over glass.
- Backup export/import that loses data.

### Release Notes Template
```md
## Version
### Added
### Changed
### Fixed
### Verification
- npm run lint
- npm run typecheck
- npm run test
- npm run build
- npm run test:e2e
```
