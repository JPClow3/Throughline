# Throughline

> A calm place to plan.

Throughline is a calm, local-first planner where **goals hold the work**. Set an end
goal, break it into real tasks, and watch progress roll up — alongside a cross-linked
**notes** notebook, a **board**, and a **timeline**. It's an installable PWA (browser,
phone, and Windows) with an Apple-inspired, light-by-default Liquid Glass interface and a
softer dark mode. Your data stays on your device.

## Start here

- Product and build overview: [docs/README.md](docs/README.md)
- Requirements and scope: [docs/requirements.md](docs/requirements.md)
- Architecture: [docs/architecture.md](docs/architecture.md)
- Project map: [docs/project-map.md](docs/project-map.md)
- Development workflow: [docs/development-workflow.md](docs/development-workflow.md)
- Deployment (Docker + Dokploy on EC2): [docs/deployment.md](docs/deployment.md)
- Current status and roadmap: [docs/roadmap.md](docs/roadmap.md)

## Stack

- `React 19`, `Vite`, `TypeScript`, `Tailwind CSS 4`, `motion`
- `Dexie` + IndexedDB for offline, local-first persistence
- `@phosphor-icons/react`, Geist Variable typography
- `Fastify` push API with redacted reminder payloads
- `Vitest`, Testing Library, Playwright

## Core ideas

- **Goals hold tasks.** A goal contains ordered child steps; progress is derived from them.
- **Notes, cross-linked.** One notebook; notes link many-to-many to tasks and goals.
- **Projects** group related tasks, goals, and notes with a colour.
- **Board & Timeline** views, each filterable by project.
- **Calm first.** An optional game layer (XP, streaks) can be switched on in Settings.

## Quick start

```powershell
npm install
npm run dev:web
```

The web app runs at [http://127.0.0.1:5173](http://127.0.0.1:5173). For the push API:

```powershell
npm run dev:push
```

It runs at [http://127.0.0.1:8787](http://127.0.0.1:8787).

## Quality gates

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Notifications

Push needs VAPID keys:

```powershell
npm run vapid -w apps/push-api
```

Set for `apps/push-api`: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
(`PUSH_STORE_PATH` optional). Set for `apps/web`: `VITE_PUSH_API_URL`,
`VITE_VAPID_PUBLIC_KEY`. See [docs/notifications.md](docs/notifications.md) for the
privacy contract and API details.

## Deploy

Throughline ships as a Docker Compose stack (static web + push API + an ofelia cron that
triggers reminder dispatch), designed for Dokploy on an EC2 host with Traefik TLS. Copy
`.env.example` to `.env`, fill in `APP_HOST` and the VAPID keys, and follow
[docs/deployment.md](docs/deployment.md).

## Key decisions

- Windows support means an installable/store-ready PWA, not a native wrapper.
- Full task data stays local in IndexedDB; export/import a JSON backup from Settings.
- Push payloads are redacted — never task titles, descriptions, project names, or tags.
- Calm planner first; the game layer is optional and off by default.
