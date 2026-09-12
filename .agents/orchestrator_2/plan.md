# Execution Plan — Orchestrator 2

## Milestone Status Overview
- **M1: Inkline Visual System & Tokens**: DONE (implemented in `styles.css`, `index.html`, `useTheme.ts`, `TaskCard.tsx`).
- **M4: E2E Test Suite Infrastructure & Tests**: DONE (70 test cases authored in `apps/web/src/test/e2e-inkline.test.tsx`, documented in `TEST_INFRA.md`).
- **M2: Shell, Navigation & Keyboard Workflows**: IN PROGRESS.
- **M3: Core Planner Views & UX Affordances**: PLANNED (follows M2).
- **M5: Final Verification & Adversarial Hardening**: PLANNED (follows M3).

## Milestone 2: Shell, Navigation & Keyboard Workflows
- **Target Files**:
  - `apps/web/src/App.tsx`
  - `apps/web/src/views/CommandPalette.tsx`
  - `apps/web/src/ui/Overlay.tsx`
  - `apps/web/src/shell/AppShell.tsx`
  - `apps/web/src/views/GoalsView.tsx`
- **Features**:
  1. Global 'N' shortcut in Goals view (Feature 7).
  2. Command Palette Insights navigation item with `ChartLine` icon (Feature 8).
  3. URL query view alias `view=today` mapping to `dashboard` (Feature 9).
  4. Focus management, focus trapping, and Escape key restoration in dialogs/sheets/palette (Feature 10).
- **Iteration Flow**:
  - Step 1: Dispatch Explorer to inspect current code in target files and formulate exact diff / implementation strategy.
  - Step 2: Dispatch Worker to implement M2 changes and verify build/test.
  - Step 3: Dispatch Reviewers (2) to verify against requirements and Inkline contracts.
  - Step 4: Dispatch Challengers (2) to verify keyboard shortcuts, palette navigation, and focus trapping.
  - Step 5: Dispatch Forensic Auditor to check integrity.
  - Step 6: Gate check.

## Milestone 3: Core Planner Views & UX Affordances
- **Target Files**:
  - `apps/web/src/views/TimelineView.tsx`
  - `apps/web/src/views/GoalsView.tsx`
  - `apps/web/src/views/BoardView.tsx`
  - `apps/web/src/views/TodayView.tsx`
  - `apps/web/src/views/NotesView.tsx`
  - `apps/web/src/views/CoursesView.tsx`
  - `apps/web/src/views/InsightsView.tsx`
  - `apps/web/src/views/SettingsView.tsx`
  - `apps/web/src/views/FilterBar.tsx`
- **Features**:
  1. TimelineView task edit affordance (`onEdit`) with interactive buttons (Feature 11).
  2. GoalsView linked notes navigation (`onOpenNote`) with clickable note cards (Feature 12).
  3. BoardView celebration trigger on task completion (Feature 13).
  4. Complete empty states with actionable CTAs for all views (Feature 14).
  5. FilterBar accessible dialog / mobile preset UX (Feature 15).
- **Iteration Flow**:
  - Explorer -> Worker -> Reviewers -> Challengers -> Auditor -> Gate.

## Milestone 5: E2E Verification & Adversarial Hardening
- Run `apps/web/src/test/e2e-inkline.test.tsx` (all 70 tests).
- Phase 1: Fix any failing E2E tests across Tiers 1-4.
- Phase 2: Tier 5 adversarial testing & hardening.
- Automated checks: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
- Final audit & completion report to user and parent.
