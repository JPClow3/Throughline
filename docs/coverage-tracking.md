# Coverage Tracking

Coverage is tracked with Vitest and the V8 provider.

## Command

```powershell
npm run test:coverage
```

## Reports

- `coverage/index.html`: open locally when investigating gaps.
- `coverage/lcov.info`: standard upload format for future Codecov/Sonar/CI integrations.
- `coverage/coverage-summary.json`: compact metrics for future release dashboards.
- terminal summary: the quick pass/fail signal used by CI.

## Scope

Coverage includes source files under `apps/` and `packages/`. It excludes generated files, tests, test helpers, Playwright specs, TypeScript declarations, and config files.

## Thresholds

The current scaffold baseline is:

| Metric | Threshold |
| --- | ---: |
| Branches | 50% |
| Functions | 50% |
| Lines | 58% |
| Statements | 58% |

These thresholds are deliberately modest because the frontend scaffold includes visual surfaces and lazy-loaded 3D components that are not fully unit-tested yet. Raise them as coverage improves; do not lower them without documenting why.

## Tracking Rules

- Every PR that changes data, notifications, ICS, gamification, or task state should run `npm run test:coverage`.
- Coverage gaps in `packages/domain`, `apps/push-api`, and `apps/web/src/data` are higher priority than visual-only gaps.
- Prefer adding meaningful assertions over chasing percentage increases.
- Add a direct regression test for every bug fixed.
- Use E2E/performance/stress tests to cover behavior that unit coverage cannot express well.
