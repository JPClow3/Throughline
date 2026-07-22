# Agent Instructions

Use this file first, then `docs/README.md`. The docs in `docs/` are the source of truth for product intent, architecture, and workflows.

## Required Reading By Task

- Any task: `docs/README.md`, `docs/product.md`, `docs/development.md`.
- UI task: `docs/ui-ux.md`, `docs/product.md`.
- Data/storage task: `docs/architecture.md`.
- Notification task: `docs/notifications.md`.
- Release task: `docs/deployment.md`, `docs/development.md`.

## Product Rules

- Keep the default behavior local-first and offline-capable. Optional accounts may sync planner records only as end-to-end-encrypted ciphertext; the server must not be able to read task titles, descriptions, notes, tags, subtasks, goals, or course details.
- Preserve the LiquidGlass visual system.
- Preserve the student-life UX priority: fast capture, course grouping, due dates, Kanban, timeline pressure, calendar export.
- Do not add a 3D layer unless the product direction explicitly changes; current LiquidGlass depth comes from layered surfaces on a solid base.
- Keep push payloads redacted. The push API may store subscriptions, due times, generic copy, urgency, reminder IDs, and opaque task IDs only.
- Treat recovery keys as a first-class trust step. Signup and Settings must explain that password loss requires the recovery key and that encrypted data cannot be recovered if both are lost.
- Windows support means installable/store-ready PWA unless the user explicitly changes the target.

## Engineering Rules

- Prefer shared logic in `packages/domain` when both web and push API need it.
- Store client data through Dexie repositories/hooks, not ad hoc `localStorage`.
- Update tests for schema, scoring, export, notification, storage, or UI behavior changes.
- Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and relevant Playwright checks before considering broad changes complete.
- Update docs when setup, architecture, data model, privacy rules, or feature behavior changes.

## Current Caveats

- Legacy `lowPower3d` settings may exist for back-compat, but the current app has no 3D UI layer.
- Generated folders and caches must stay untracked: `dist`, `dev-dist`, `test-results`, `playwright-report`, `*.tsbuildinfo`, `apps/push-api/data`.

## Cursor Cloud specific instructions

Dependencies are installed by the startup update script (`npm install` at the repo root hoists all workspaces). Assume `node_modules` is present.

- Node engine is declared `>=24`, but the Cursor Cloud pod's `node` is pinned to v22 by the exec runtime. Install, tests, and build all work on Node 22 (the `EBADENGINE`/experimental-SQLite messages are warnings only). Because native modules build and run under the same Node 22 ABI here, do not switch the running `node` to a different major.
- Run the web app: `npm run dev:web` (Vite, port 5173). Nested npm swallows `--port`, so to change the port run Vite directly: `cd apps/web && npx vite --host 0.0.0.0 --port <p>`. The dev server proxies `/api` → `http://127.0.0.1:8787`.
- The planner (`/app/*`) is behind `RequireAuth`; only the landing renders anonymously. To exercise the full app, also run the API: `npm run dev:push` (Fastify + local SQLite, port 8787). Set `COOKIE_SECURE=false` for signup/login over plain HTTP localhost (cookies default to `secure: true`). No secrets are required for local auth/sync; VAPID keys only enable Web Push.
- `npm run lint` fails on **pre-existing** `no-undef` errors in `scripts/throughline-layout-audit.mjs` (a browser-globals script linted as Node) — unrelated to environment setup. `npm run typecheck`, `npm run test` (vitest, ~136 tests), and `npm run build` pass. Playwright e2e needs `npx playwright install --with-deps chromium` first.
