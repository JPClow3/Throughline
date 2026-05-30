# Testing, Coverage, And Reliability Strategy

This document is the testing source of truth. Keep it updated whenever a new test layer, report, budget, or quality gate is added.

## Test Layers

| Layer | Command | Files | Purpose |
| --- | --- | --- | --- |
| Unit/domain | `npm run test:unit` | `packages/**/*.test.ts` | Schemas, gamification, ICS export, redacted reminder generation, pure business logic. |
| API/data unit | `npm run test:unit` | `apps/push-api/src/**/*.test.ts`, `apps/web/src/**/*.test.ts(x)` | Push API routes/store behavior, Dexie repositories, reminder sync, local-first guarantees. |
| Coverage | `npm run test:coverage` | Same as Vitest unit/component tests | Generates text, HTML, LCOV, and JSON summary reports with baseline thresholds. |
| Functional E2E | `npm run test:e2e` | `apps/web/tests/**/*.e2e.spec.ts` | Browser flows on desktop and mobile: Today, task capture, Kanban moves, and the PWA shell. |
| Performance smoke | `npm run test:perf` | `apps/web/tests/**/*.perf.spec.ts` | Fast local browser budgets for initial dashboard readiness, route switches, and key rendering metrics. |
| Stress smoke | `npm run test:stress` | `apps/web/tests/**/*.stress.spec.ts` | Repeated interactions that catch IndexedDB, rendering, and Kanban degradation before formal load tooling exists. |

## Coverage Tracking

Vitest coverage uses the V8 provider. Reports are generated in `coverage/`, which is intentionally ignored by Git.

```powershell
npm run test:coverage
```

Generated artifacts:

- `coverage/index.html`: human-readable report for local review.
- `coverage/lcov.info`: CI/code-quality integration format.
- `coverage/coverage-summary.json`: machine-readable summary for future dashboards.
- terminal text summary: quick feedback in local and CI runs.

Current global thresholds:

- Branches: 50%
- Functions: 50%
- Lines: 58%
- Statements: 58%

Ratchet policy:

- Do not lower thresholds unless a large generated or intentionally untestable surface is added and documented here.
- When a feature lands with focused tests and coverage rises, increase the nearest threshold by 2-5 points.
- For critical privacy/data logic, prefer direct tests over relying on global coverage numbers.
- Coverage must include all app/package source by default; exclude generated files, test helpers, config files, and Playwright specs only.

## Current Coverage Areas

Domain tests cover:

- Gamification scoring, level progression, and derived progress.
- ICS calendar export.
- Redacted reminder privacy, `notifyAt` precedence, and completed-task filtering.

Push API tests cover:

- Health endpoint.
- Subscription create/delete.
- Bulk reminder replacement by endpoint hash.
- Dispatch unavailable without VAPID.
- Dispatch sends due reminders once and marks them sent.
- JSON store replacement, due filtering, dispatched marking, and concurrent writes.

Web tests cover:

- App shell renders seeded study quests.
- Navigation exposes Kanban.
- Local repository task completion updates progress.
- Reminder sync state persists.
- Failed reminder sync does not roll back local task writes.
- Empty reminder replacement is sent so stale server reminders are cleared.

E2E tests cover:

- Desktop and mobile Today/Board smoke flow.
- Capturing a task, moving it across the board, and completing it.

Performance smoke currently checks:

- Dashboard readiness under 4.5 seconds on local preview.
- Kanban view switch under 1.5 seconds.
- DOM content loaded under 3.5 seconds.

Stress smoke currently checks:

- 20 repeated quest captures.
- Kanban rendering after the repeated writes.
- Expected card count across seeded and newly created quests.

## Quality Gates

Default completion gate:

```powershell
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run test:e2e
```

Full local confidence gate:

```powershell
npm run test:all
```

Run `npm run test:perf` before UI, animation, 3D, routing, or data-loading changes. Run `npm run test:stress` before changes to Dexie repositories, task capture, Kanban, or high-frequency state updates.
Run performance and stress checks sequentially, not in parallel with other Playwright suites, because they intentionally measure local browser responsiveness.

CI currently runs lint, typecheck, coverage, build, and desktop E2E. Mobile, performance, and stress remain local/manual until the project has a dedicated scheduled workflow or stable CI performance runners.

## File Naming

- Unit and component tests: `*.test.ts` or `*.test.tsx`.
- Functional Playwright tests: `*.e2e.spec.ts`.
- Performance Playwright tests: `*.perf.spec.ts`.
- Stress Playwright tests: `*.stress.spec.ts`.
- Shared test helpers: `test-helpers.ts`, excluded from coverage.

## Test Data

Seed data lives in `packages/domain/src/sample-data.ts`. Keep test data student-oriented and realistic: courses, assignments, review tasks, due dates, completed work, energy, difficulty, and RPG attributes.

When stress tests create large local data sets, prefer UI-level creation until the user flow becomes too slow to be useful. If direct IndexedDB seeding is introduced later, document the seeding API and keep it test-only.

## Add-Test Checklist

- New schema or domain rule: unit test in `packages/domain`.
- New push route or store behavior: API/store test in `apps/push-api/src`.
- New Dexie repository or offline behavior: web data test in `apps/web/src/data`.
- New visible workflow: Playwright E2E test on desktop and mobile.
- New animation, 3D, or large rendering surface: performance smoke or 3D fallback test.
- New repeated-write or repeated-interaction path: stress smoke test.
- New privacy-sensitive behavior: explicit negative assertion that private task content is not sent or stored.
