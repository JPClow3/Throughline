# Execution Plan — Orchestrator 3

## Goal
Achieve 100% completion of Throughline UI/UX Finishing & Polish project:
1. Complete Milestone 3: Core Planner Views & UX Affordances.
2. Complete Milestone 5: Final Verification, 100% E2E Pass, Full Automated Suite (typecheck, lint, test, build), and Adversarial Hardening.

---

## Milestone 3 Execution Steps

### Phase 1: Exploration of Remaining Features (13, 14, 15)
- Feature 11 (Timeline `onEdit`) & Feature 12 (Goals `onOpenNote`) are already fully explored and specified in `.agents/explorer_m3_1/handoff.md`.
- Features to explore:
  - Feature 13: Board completion celebration trigger (ensure clicking checkmark button on `TaskCard` always fires `onComplete` with XP and confetti bursts).
  - Feature 14: Complete empty states with clear CTAs across all 8 views (Today, Kanban, Timeline, Goals, Notes, Courses, Insights, Settings).
  - Feature 15: Filter preset UX / accessible dialog (refactor `window.prompt` filter preset creation and expose presets cleanly on mobile).
- Dispatch Explorers to survey the exact files, lines, and patterns for Features 13, 14, 15.

### Phase 2: Worker Implementation
- Dispatch Worker M3 with comprehensive specifications for all 5 features:
  - Feature 11: TimelineView `onEdit` handler & interactive title buttons.
  - Feature 12: GoalsView `onOpenNote` handler, interactive note cards, and optional `selectedId`.
  - Feature 13: Board completion celebration trigger with confetti & XP.
  - Feature 14: Complete empty states with actionable CTAs across all 8 views.
  - Feature 15: Accessible dialog / mobile preset UX for FilterBar.
- Worker executes build and unit/integration tests to verify.

### Phase 3: Gate Verification (M3)
- Dispatch 2 independent Reviewers (`teamwork_preview_reviewer`).
- Dispatch 2 independent Challengers (`teamwork_preview_challenger`).
- Dispatch Forensic Auditor (`teamwork_preview_auditor`).
- Gate check: strict AND of all criteria (all APPROVE / CLEAN).

---

## Milestone 5 Execution Steps

### Phase 1: 100% E2E Test Suite Execution
- Run `apps/web/src/test/e2e-inkline.test.tsx` (70+ test cases covering Tiers 1-4).
- Fix any remaining test failures or edge cases via Worker.

### Phase 2: Full Automated Suite Verification
- `npm run typecheck` (0 errors)
- `npm run lint` (0 errors)
- `npm run test` (100% pass)
- `npm run build` (0 errors)

### Phase 3: Adversarial Hardening (Tier 5)
- Dispatch Challengers to write white-box stress tests uncovering edge cases.
- Worker resolves any found issues.
- Reviewer & Auditor sign off.

### Phase 4: Final Reporting & Handoff
- Deliver final completion report to user and parent agent.
