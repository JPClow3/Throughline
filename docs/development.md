# Development & Testing Workflow

This document outlines the local development setup, testing strategies, coverage tracking, and AI-assisted workflows for Throughline.

## 1. Local Setup

```powershell
npm install
npm run dev:web
```
Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

Run the push API separately when testing push registration:
```powershell
npm run dev:push
```
Open [http://127.0.0.1:8787/health](http://127.0.0.1:8787/health) to verify the API.

## 2. Useful Commands

```powershell
npm run lint          # source style and React rules
npm run typecheck     # TypeScript checks for all workspaces
npm run test          # Vitest unit/component tests
npm run test:coverage # Vitest coverage with V8 reports
npm run build         # TypeScript plus Vite PWA production build
npm run test:e2e      # Playwright desktop/mobile smoke tests
npm run test:perf     # Playwright performance smoke budgets
npm run test:stress   # Playwright repeated-interaction smoke tests
npm run test:all      # Full local confidence gate
```

Run a workspace command directly:
```powershell
npm run dev -w apps/web
npm run dev -w apps/push-api
npm run test -w packages/domain
```

## 3. Testing Strategy & Coverage

| Layer | Command | Files | Purpose |
| --- | --- | --- | --- |
| Unit/domain | `npm run test:unit` | `packages/**/*.test.ts` | Schemas, gamification, ICS export, redacted reminder generation, pure business logic. |
| API/data unit | `npm run test:unit` | `apps/push-api/src/**/*.test.ts`, `apps/web/src/**/*.test.ts(x)` | Push API routes/store behavior, Dexie repositories, reminder sync, local-first guarantees. |
| Coverage | `npm run test:coverage` | Same as Vitest unit/component tests | Generates text, HTML, LCOV, and JSON summary reports. |
| Functional E2E | `npm run test:e2e` | `apps/web/tests/**/*.e2e.spec.ts` | Browser flows on desktop and mobile: Today, task capture, Kanban moves, and the PWA shell. |
| Performance smoke | `npm run test:perf` | `apps/web/tests/**/*.perf.spec.ts` | Fast local browser budgets for initial dashboard readiness, route switches, and key rendering metrics. |
| Stress smoke | `npm run test:stress` | `apps/web/tests/**/*.stress.spec.ts` | Repeated interactions that catch IndexedDB, rendering, and Kanban degradation. |

### Coverage Tracking
Vitest coverage uses the V8 provider. Reports are generated in `coverage/` (ignored by Git).
Current global thresholds:
- Branches: 50%
- Functions: 50%
- Lines: 58%
- Statements: 58%

*Ratchet policy:* Do not lower thresholds unless a large generated surface is added. Raise them as coverage improves. For critical privacy/data logic, prefer direct tests over relying on global coverage numbers.

### Quality Gates
**Default completion gate:**
```powershell
npm run lint
npm run typecheck
npm run test:coverage
npm run build
npm run test:e2e
```
Run `npm run test:perf` before UI, animation, routing, or data-loading changes. Run `npm run test:stress` before changes to Dexie repositories, task capture, or high-frequency state updates.

### Test Data & Naming
Seed data lives in `packages/domain/src/sample-data.ts`.
- Unit and component tests: `*.test.ts` or `*.test.tsx`.
- Playwright tests: `*.e2e.spec.ts`, `*.perf.spec.ts`, `*.stress.spec.ts`.

## 4. AI Workflows

### Default Work Loop
1. Inspect existing code before editing.
2. Identify whether the change belongs in `apps/web`, `apps/push-api`, or `packages/domain`.
3. Keep shared contracts in `packages/domain`.
4. Make the smallest coherent change.
5. Add or update tests when behavior changes.
6. Run the relevant quality gate.
7. Update docs when behavior, architecture, or setup changes.

### Specific Focus Areas
- **UI Work:** Follow UI/UX constitution. Start from visible workflow, not isolated decoration. Keep depth from layering on a solid background; there is no 3D layer.
- **Notification Work:** Follow notifications doc. Never add task title, description, course name, tags, or subtasks to push payloads. Keep unsupported states non-blocking.
- **Documentation Work:** Keep docs factual and tied to current code. Put durable decisions in `decision-log.md`.

## 5. Generated Files & Troubleshooting
Do not commit: `node_modules/`, `apps/web/dist/`, `apps/web/dev-dist/`, `test-results/`, `playwright-report/`, `*.tsbuildinfo`, `apps/push-api/data/`, `coverage/`.

If dependency install is interrupted, delete generated dependency artifacts (`node_modules`, `package-lock.json`) and reinstall. Never delete source folders to fix package-manager state.
If browser notifications do not appear, check browser permission, HTTPS/PWA context, service worker support, and platform-specific PWA notification support.
