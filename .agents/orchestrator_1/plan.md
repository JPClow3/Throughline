# Orchestration Plan: UI/UX Finishing & Polish for Throughline

## Objective
Execute complete UI and UX finishing of Throughline ensuring 100% adherence to Inkline editorial neo-brutalism, complete screen states across all core planner views, responsive mobile & desktop polish, full keyboard navigation and accessibility, and 0-error automated verification.

## Phases
1. **Phase 0: Survey & Scope Mapping**
   - Dispatch 3 Explorers / Spec-Miners in parallel:
     - Explorer 1 (Views & UX Affordances): Audit Today, Kanban, Timeline, Goals, Notes, Courses/Projects, Insights, Settings.
     - Explorer 2 (Design System & Visual Tokens): Audit Tailwind/CSS variables, ink borders (2px), shadows (3px/5px/8px), press physics, no gradients/blurs, theme switching.
     - Explorer 3 (Responsive, PWA, Keyboard & A11y): Audit 375px-1280px responsiveness, bottom dock vs header tabs, shortcuts ('N', 'Ctrl+K'), focus traps, ARIA roles/announcements.
   - Synthesize reports into `PROJECT.md` (Architecture, Feature Inventory, Milestones, Interface Contracts, Code Layout).

2. **Phase 1: Dual Track Execution**
   - **Track A (Implementation Track)**:
     - Sub-orchestrators for decomposed milestones (e.g. M1: Design System & Shared Components; M2: Shell, Navigation, Responsive & A11y; M3: Core Planner Views & Affordances; M4: Settings, Insights & Export).
     - Each milestone adheres to the rigorous cycle: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Auditor (Binary Veto).
   - **Track B (E2E Testing Track)**:
     - E2E Testing Orchestrator builds comprehensive 4-tier test suite (Feature coverage, Boundary & Corner, Cross-feature, Real-world scenarios).
     - Generates `TEST_INFRA.md` and signals completion via `TEST_READY.md`.

3. **Phase 2: Final Verification & Coverage Hardening**
   - Run 100% of E2E tests against the implementation.
   - Adversarial coverage hardening (Tier 5) with Challengers and Workers.
   - Full automated test suite verification (`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`).

4. **Phase 3: Completion & Reporting**
   - Synthesize results into final handoff and comprehensive report for the user.
