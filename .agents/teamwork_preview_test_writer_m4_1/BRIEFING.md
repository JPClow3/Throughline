# BRIEFING — 2026-09-10T08:15:00Z

## Mission
Design and implement a comprehensive 4-tier E2E test suite in `apps/web/src/test/e2e-inkline.test.tsx`, document test infrastructure in `TEST_INFRA.md`, publish `TEST_READY.md`, verify zero regressions with `npm run test` and `npm run typecheck`, and deliver self-contained handoff.

## 🔒 My Identity
- Archetype: specialist, qa (Test Writer)
- Roles: specialist, qa
- Working directory: H:\Code\Pessoais\Throughline\.agents\teamwork_preview_test_writer_m4_1
- Original parent: 8dbbbd50-34b8-497e-a5ca-a277e75cae31
- Milestone: M4 (E2E Testing Track)

## 🔒 Key Constraints
- Write and modify test code only — never implementation code in `apps/web/src/views/`, `shell/`, etc.
- Escalate implementation bugs rather than fixing them in application code.
- Progressive testability: verifiable using current milestone features and completed dependencies.
- Independent, self-contained tests with explicit authoritative source for expected output.
- Deliverables: `apps/web/src/test/e2e-inkline.test.tsx`, `TEST_INFRA.md`, `TEST_READY.md`, `handoff.md`.

## Current Parent
- Conversation ID: 8dbbbd50-34b8-497e-a5ca-a277e75cae31
- Updated: not yet

## Task Summary
- **What to build**: 4-tier E2E test suite covering Tier 1 (Feature Coverage >=5 per feature across 8 views + shortcuts + dialogs), Tier 2 (Boundary & Corner Cases >=5 per feature), Tier 3 (Cross-Feature Combinations / Pairwise), and Tier 4 (Real-World Workload Scenarios >=5 realistic scenarios). Also `TEST_INFRA.md` and `TEST_READY.md`.
- **Success criteria**: 100% passing tests with `npm run test`, 0 errors on `npm run typecheck`.
- **Interface contracts**: H:\Code\Pessoais\Throughline\PROJECT.md § Interface Contracts
- **Code layout**: H:\Code\Pessoais\Throughline\PROJECT.md § Code Layout

## Key Decisions Made
- Use Vitest + React Testing Library + fake-indexeddb with `<AuthProvider>` and `<PlannerProvider>` or `renderWithPlanner` harnesses for high-fidelity in-memory E2E execution.
- Maintain test isolation by initializing fresh Dexie tables or fresh provider state per scenario.

## Artifact Index
- `apps/web/src/test/e2e-inkline.test.tsx` — 4-tier E2E test suite
- `TEST_INFRA.md` — Test infrastructure, harness architecture, test tiers documentation
- `TEST_READY.md` — Test readiness declaration, summary, invocation command
- `handoff.md` — 5-component handoff report

## Loaded Skills
- **Source**: H:\Code\Pessoais\Throughline\.agents\skills\throughline-dev\SKILL.md
- **Local copy**: H:\Code\Pessoais\Throughline\.agents\teamwork_preview_test_writer_m4_1\skills\throughline-dev\SKILL.md
- **Core methodology**: Monorepo structure, verification via `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`.

## Quality Status
- **Build/test result**: Running baseline test check
- **Lint status**: Pending
- **Tests added/modified**: Preparing `apps/web/src/test/e2e-inkline.test.tsx`
