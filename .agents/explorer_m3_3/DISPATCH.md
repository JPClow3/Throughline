# Dispatch for Explorer M3-3

- Archetype: teamwork_preview_explorer
- Working Directory: H:\Code\Pessoais\Throughline\.agents\explorer_m3_3
- Milestone: Milestone 3 (Core Planner Views & UX Affordances)

MANDATORY FIRST STEP: Read H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md before starting any work.

Context Files:
- H:\Code\Pessoais\Throughline\PROJECT.md
- H:\Code\Pessoais\Throughline\docs\ui-ux.md
- H:\Code\Pessoais\Throughline\apps\web\src\views\TodayView.tsx
- H:\Code\Pessoais\Throughline\apps\web\src\views\TimelineView.tsx
- H:\Code\Pessoais\Throughline\apps\web\src\views\InsightsView.tsx
- H:\Code\Pessoais\Throughline\apps\web\src\views\BoardView.tsx
- H:\Code\Pessoais\Throughline\apps\web\src\test\e2e-inkline.test.tsx

Scope:
1. Feature 14: Complete empty states with actionable CTAs across all views:
   - TodayView: empty agenda / no tasks due guidance and CTA ("Capture your first task" / "Open composer").
   - BoardView: empty board when total task count is 0 with actionable CTA.
   - TimelineView: empty state when no tasks are scheduled for the day with actionable CTA.
   - InsightsView: first-run / empty state guidance with actionable trigger before completions exist.
2. Examine `apps/web/src/test/e2e-inkline.test.tsx`:
   - Identify any compilation or TypeScript errors in test stubs (e.g. `GoalsView` props, mock types).
   - Verify what Tier 1, Tier 2, Tier 3 tests expect for all 8 planner views.
Provide exact code analysis and diff proposals in `H:\Code\Pessoais\Throughline\.agents\explorer_m3_3\handoff.md`.
