# Project: Throughline UI/UX Finishing & Polish

## Architecture
Throughline is a local-first, offline-capable student and power-planner web application built with React, Vite, Tailwind CSS v4, Dexie (IndexedDB), and end-to-end encrypted sync capabilities.
- **Design System**: Inkline editorial neo-brutalism (`docs/ui-ux.md`). Solid warm paper surfaces (`#f1ede3` light / `#15171e` dark slate), 2px solid ink borders, hard offset block shadows (3px/5px/8px), zero gradients, zero blurs, zero translucency, tactile press physics (`translate(2px, 2px)` collapsing shadow), Geist typography hierarchy.
- **Layout & Shell**: Responsive layout supporting 375px mobile up to 1280px desktop. Mobile features a bottom navigation dock (`.shell-dock`) and FAB primary action with safe-area insets, and bottom-sheet overlays (`.sheet`). Desktop features top tabs (`.shell-tabs`) and centered modal dialogs (`.modal-panel`).
- **Core Planner Views**: Today dashboard, Kanban board, Timeline view, Goals view, Notes view, Courses/Projects view, Insights view, and Settings view.
- **Data Flow**: Dexie reactive hooks (`useLiveQuery`), repository services in `packages/domain`, UI components in `apps/web/src`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Inkline Color Tokens & Tailwind v4 Theme | Populate full Inkline palette in `@theme` block in `styles.css` (yellow, blue, green, red, violet, ink, paper) | M1 | Survey 1 |
| 2 | Level 4 Modal & Sheet Elevation | Ensure `.modal-panel` and `.onboarding-panel` carry 8px 8px hard shadow (`--shadow-3`) instead of card 3px shadow | M1 | Survey 1 |
| 3 | Tactile Press Physics on TaskCard | Add `.task-card:active` CSS rule and replace Framer Motion `scale: 0.985` tap with `translate(2px, 2px)` shadow collapse | M1 | Survey 1, 2 |
| 4 | Mobile Touch Target Sizing | Ensure `.icon-toggle` (36px) and `.btn-sm` (34px) have minimum 44x44px touch bounding area on mobile | M1 | Survey 3 |
| 5 | Viewport Meta Safe-Area Inset | Add `viewport-fit=cover` to `index.html` to enable iOS safe-area bottom dock calculations | M1 | Survey 3 |
| 6 | Storage Key Standardization | Standardize theme storage key from legacy `"lg-theme"` to `"throughline-theme"` (with backward compatibility) | M1 | Survey 1 |
| 7 | Global 'N' Shortcut in Goals View | Allow 'N' keyboard shortcut to open composer or create goal/task when active view is `goals` | M2 | Survey 2, 3 |
| 8 | Command Palette Insights Navigation | Add "Go to Insights" navigation item with `ChartLine` icon to Navigation group in `CommandPalette.tsx` | M2 | Survey 1, 2 |
| 9 | URL Query View Alias for Today | Support `view=today` query param alias to navigate to `dashboard` | M2 | Survey 3 |
| 10 | Focus Management & Escape Trapping | Ensure all dialogs, sheets, and command palette maintain strict focus trapping and escape restoration | M2 | Survey 3 |
| 11 | Timeline View Task Edit Affordance | Add `onEdit` handler to `TimelineView` and make task titles interactive buttons opening task editor | M3 | Survey 2 |
| 12 | Goals View Linked Notes Navigation | Add `onOpenNote` handler to `GoalsView` and make `.goal-note-card` clickable links jumping to the note | M3 | Survey 2 |
| 13 | Board View Celebration Trigger | Ensure clicking checkmark button on `TaskCard` always fires `onComplete` with XP and confetti bursts | M3 | Survey 2 |
| 14 | Complete Empty States with Actionable CTAs | Add clear empty states with CTA buttons to BoardView (0 tasks), TimelineView, and InsightsView (first-run) | M3 | Survey 2 |
| 15 | FilterBar Accessible Dialog & Mobile Preset | Refactor `window.prompt` filter preset creation and expose presets cleanly on mobile | M3 | Survey 2 |
| 16 | E2E Testing Suite Infrastructure | Design requirement-driven opaque-box test runner, fixtures, and assertion helpers in `TEST_INFRA.md` | M4 | System spec |
| 17 | E2E Test Suite (Tiers 1-4) | Implement Tier 1 (Feature), Tier 2 (Boundary), Tier 3 (Cross-feature), and Tier 4 (Real-world) test cases | M4 | System spec |
| 18 | E2E Test Passing & Validation | Verify 100% of E2E test cases pass against the completed application | M5 | System spec |
| 19 | Adversarial Coverage Hardening (Tier 5) | White-box adversarial testing with Challengers to uncover edge cases and harden test coverage | M5 | System spec |
| 20 | Automated Verification (Build, Lint, Test, Typecheck) | Ensure `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass with 0 errors | M5 | ORIGINAL_REQUEST |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Inkline Visual System & Tokens | Features 1, 2, 3, 4, 5, 6: Tokens in `@theme`, Level 4 modal shadows, TaskCard press physics, 44px touch targets, viewport-fit=cover, theme key cleanup | none | DONE |
| M2 | Shell, Navigation & Keyboard Workflows | Features 7, 8, 9, 10: Goals 'N' shortcut, Command Palette Insights, URL alias `view=today`, A11y focus traps & dialog escapes | M1 | DONE |
| M3 | Core Planner Views & UX Affordances | Features 11, 12, 13, 14, 15: Timeline edit affordance, Goals note navigation, Board completion confetti, complete empty states, filter preset UX | M1 | DONE |
| M4 | E2E Testing Track (Dual Track) | Features 16, 17: Requirement-driven test infrastructure, Tiers 1-4 test cases covering all 8 planner views and responsive/keyboard requirements; publish `TEST_READY.md` | none (Parallel) | DONE |
| M5 | Final Milestone: E2E Pass & Adversarial Hardening | Features 18, 19, 20: Pass 100% E2E tests, Tier 5 adversarial hardening, and full automated suite verification (`typecheck`, `lint`, `test`, `build`) | M1, M2, M3, M4 | IN_PROGRESS |

## Interface Contracts
### `TimelineView` ↔ `App`
```typescript
interface TimelineViewProps {
  onNewTask?: (date?: Date) => void;
  onStartFocus?: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onEdit?: (task: Task) => void; // Added: enables opening task composer/editor directly from timeline agenda
}
```

### `GoalsView` ↔ `App`
```typescript
interface GoalsViewProps {
  onNewGoal?: () => void;
  onEditGoal?: (goal: Goal) => void;
  onOpenNote?: (noteId: string) => void; // Added: enables jumping to linked note from goal detail card
}
```

### `TaskCard` ↔ `BoardView` / `TodayView`
```typescript
interface TaskCardProps {
  task: Task;
  onComplete?: (task: Task) => void; // Must always be called when completion checkbox is clicked
  onStatusChange?: (taskId: string, status: TaskStatus) => void; // For drag-and-drop or select moves
  onEdit?: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
}
```

## Code Layout
- `apps/web/src/styles.css`: Tailwind v4 `@theme`, CSS variables, elevation classes, press physics, responsive dock styles.
- `apps/web/src/shell/AppShell.tsx`: Global navigation header, tabs, mobile dock, primary action FAB.
- `apps/web/src/App.tsx`: Top-level application controller, routing, global shortcuts (`N`, `Ctrl+K`), modal controllers.
- `apps/web/src/ui/Overlay.tsx`: `Sheet` (bottom sheet <640px) and `Modal` (centered overlay >=640px), focus management.
- `apps/web/src/views/`:
  - `TodayView.tsx`: Daily overview, agenda, overdue, quick log.
  - `BoardView.tsx`: Kanban columns, mobile status tabs, drag-and-drop, keyboard column moves.
  - `TimelineView.tsx`: Date strip, daily agenda schedule, focus launcher.
  - `GoalsView.tsx`: Goal cards, progress metrics, linked tasks and linked notes.
  - `NotesView.tsx`: Note editor, split view, tag filters, linking.
  - `CoursesView.tsx`: Course cards, task groupings, schedule.
  - `InsightsView.tsx`: Analytics, completion charts, focus time stats.
  - `SettingsView.tsx`: Theme picker, backup/sync, notifications, keyboard shortcuts guide.
  - `CommandPalette.tsx`: Global search and command navigation.
  - `TaskCard.tsx`: Task card component with checkbox, priority badge, and press physics.
