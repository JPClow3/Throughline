# Explorer M3-F14 Context: Complete Empty States with Actionable CTAs (Feature 14)

Project Root: H:\Code\Pessoais\Throughline
Original Request: H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md
Full Project Architecture & Milestone Plan: H:\Code\Pessoais\Throughline\PROJECT.md
Working Directory: H:\Code\Pessoais\Throughline\.agents\explorer_m3_f14

Task:
Explore Feature 14: Complete Empty States with Actionable CTAs across all 8 views (Today, Kanban/Board, Timeline, Goals, Notes, Courses, Insights, Settings).
Investigate:
1. `apps/web/src/ui/EmptyState.tsx`
2. Empty state implementations in all 8 planner views:
   - `TodayView.tsx`
   - `BoardView.tsx` (e.g. 0 total tasks, empty columns)
   - `TimelineView.tsx` (e.g. no scheduled tasks for selected day / range)
   - `GoalsView.tsx` (e.g. no goals, no tasks linked, no notes linked)
   - `NotesView.tsx` (e.g. no notes created)
   - `CoursesView.tsx` (e.g. no courses / projects)
   - `InsightsView.tsx` (e.g. zero activity / first-run state)
   - `SettingsView.tsx`
Ensure each empty state carries an icon, clear Inkline typography, helpful guidance copy, and an actionable CTA button where appropriate (e.g. "Create task", "Add course", "New note").
Provide exact lines, code proposals, and test verification methods.
Write report to `H:\Code\Pessoais\Throughline\.agents\explorer_m3_f14\handoff.md`.
