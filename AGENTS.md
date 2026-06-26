# Agent Instructions

Use this file first, then `docs/README.md`. The docs in `docs/` are the source of truth for product intent, architecture, and workflows.

## Required Reading By Task

- Any task: `docs/README.md`, `docs/product.md`, `docs/development.md`.
- UI task: `docs/ui-ux.md`, `docs/product.md`.
- 3D task: `docs/3d-visual-constitution.md`.
- Data/storage task: `docs/architecture.md`.
- Notification task: `docs/notifications.md`.
- Release task: `docs/deployment.md`, `docs/development.md`.

## Product Rules

- Keep v1 local-first. Task titles, descriptions, tags, subtasks, and course details stay in IndexedDB unless a future sync plan is explicitly approved.
- Preserve the LiquidGlass visual system.
- Preserve the student-life UX priority: fast capture, course grouping, due dates, Kanban, timeline pressure, calendar export.
- Use 3D only where it supports progress, state, ambience, or delight without reducing task readability.
- Keep push payloads redacted. The push API may store subscriptions, due times, generic copy, urgency, reminder IDs, and opaque task IDs only.
- Windows support means installable/store-ready PWA unless the user explicitly changes the target.

## Engineering Rules

- Prefer shared logic in `packages/domain` when both web and push API need it.
- Store client data through Dexie repositories/hooks, not ad hoc `localStorage`.
- Update tests for schema, scoring, export, notification, storage, or UI behavior changes.
- Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and relevant Playwright checks before considering broad changes complete.
- Update docs when setup, architecture, data model, privacy rules, or feature behavior changes.

## Current Caveats

- `@react-three/drei` is installed for future helpers, but the current 3D scene uses direct React Three Fiber primitives.
- Generated folders and caches must stay untracked: `dist`, `dev-dist`, `test-results`, `playwright-report`, `*.tsbuildinfo`, `apps/push-api/data`.
