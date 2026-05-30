# Roadmap

## Shipped (beta)

### Product
- Calm, light-first planner with a softer dark mode, built on semantic CSS tokens (`:root[data-theme]`) and a pre-paint theme script.
- Apple-inspired Liquid Glass visual system: frosted floating chrome over solid surfaces, strong type hierarchy, generous whitespace.
- **Goals hold tasks** — a `Goal` entity contains ordered child tasks with derived roll-up progress (Goals grid + detail + ring); steps are reorderable; goals are editable.
- First-class **Notes** entity, cross-linked many-to-many to tasks and goals; markdown Write/Preview; linked chips navigate to their task/goal.
- **Projects** (generalised Courses), created/edited/deleted from the Projects view; used as an optional colour-coded organiser and as a filter.
- **Today** dashboard (progress hero + per-project rings + due-soon), **Board** (Kanban with project filter + search), **Timeline** (day agenda with project filter).
- Quick-add, task editing/deletion, and goal create/edit via floating glass sheets; tasks can be filed under a goal from the composer/editor.
- Local JSON **backup export/import** and **reset to sample data** in Settings; neutral on-brand sample content.
- Optional game layer (XP, streaks) behind a Settings toggle, off by default.
- ICS export; local notification permission/test flow; top-level error boundary.

### Platform
- npm workspace monorepo (`apps/web`, `apps/push-api`, `packages/domain`).
- React 19 / Vite / Tailwind 4 PWA; Dexie local-first storage with versioned migrations (v4).
- Redacted Fastify push API with bulk reminder sync and serialised JSON store writes; optional `DISPATCH_TOKEN` + `CORS_ORIGIN` hardening.
- Docker images (web→nginx, api→tsx) + Compose stack with an ofelia cron that drives `/dispatch-due`, designed for Dokploy + Traefik on EC2.
- Unit/component tests (Vitest), desktop/mobile/perf/stress Playwright suites, CI workflow.

## Next product milestones

1. Inline subtask editing inside the task editor.
2. Richer Board/Timeline filters (by goal, status, date range) in addition to project.
3. Optional richer game layer (attribute goals, weekly/season challenges) behind the toggle.
4. Keyboard-only Kanban alternative and a broader accessibility pass over glass contrast.
5. PWA install polish and Microsoft Store packaging pass (PWABuilder).
6. Rate limiting + lightweight observability on the push API.

## Future architecture milestones

1. Explicit sync design document before any cloud accounts.
2. Authenticated sync API with local-first reconciliation.
3. Encrypted or privacy-preserving cloud storage if full task sync is ever approved.
4. Move the push store off a single-instance JSON file (SQLite/Redis) before scaling out.

## Notes

- Node may emit a `module.register()` deprecation warning through the current tooling; it does not fail checks.
- The npm workspace scope is `@throughline/*`, matching the product name.
