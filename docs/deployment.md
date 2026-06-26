# Deployment & Release

This document covers deployment, PWA offline capabilities, and release readiness for Throughline.

## 1. Deployment (Docker First & Dokploy on EC2)

Throughline is a **Docker-first deployment app** designed for Dokploy (Traefik ingress + Let's Encrypt TLS) on an AWS EC2 instance.

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
3. **Compose Application**: In Dokploy, create a Compose service pointing to this Git repo. Set variables (`APP_HOST`, `VAPID_*`, `SESSION_SECRET`, `DISPATCH_TOKEN`).
4. **Deploy**: Dokploy builds the images and starts `web` + `push-api` + `ofelia`.

### Scaling Notes
- The push store currently uses a single JSON file on a volume. Run only one `push-api` replica. A migration to SQLite/Redis is required to scale out.

## 2. Offline PWA

The web app uses `vite-plugin-pwa`.

- **Service Worker**: Precaches the app shell via Workbox and falls back to `/index.html`.
- **Data**: Offline user data is stored in IndexedDB through Dexie. The service worker handles assets, while IndexedDB stores tasks, courses, and progress.
- **Generated Files**: `apps/web/dist` and `apps/web/dev-dist` are ignored by git.
- **Check**: App loads from preview server, survives reload offline, core views render without push API.

## 3. Release & Store Readiness

### PWA Checklist
- Manifest has valid properties (`Throughline`, stable `id`, standalone / display overrides, icons, shortcuts, etc).
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
