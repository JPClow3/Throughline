# Throughline E2E Testing Infrastructure (TEST_INFRA.md)

This document defines the architecture, design principles, harness configurations, and four-tier test taxonomy for Throughline's automated end-to-end (E2E) and integration test suites, specifically implemented in `apps/web/src/test/e2e-inkline.test.tsx`.

---

## 1. Architectural Principles & Testing Philosophy

Throughline is a local-first, offline-capable student and power-planner web application adhering to the **Inkline** editorial neo-brutalist design language. The testing infrastructure is designed with the following core principles:

1. **Opaque-Box Requirement Verification**:
   Tests are derived directly from the authoritative specifications in `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `docs/ui-ux.md`. They verify observable user behaviors, DOM structures, ARIA accessibility attributes, and state persistence rather than internal implementation details.

2. **Full Local-First Stack Fidelity**:
   Tests run in Vitest using `jsdom` with `fake-indexeddb/auto`. Data storage, Dexie live queries, optimistic updates, and repository operations execute against real in-memory IndexedDB stores without external network mocks or synthetic stubs wherever possible.

3. **Deterministic & Isolated Execution**:
   Each test suite or scenario manages its own data lifecycle. IndexedDB tables and localStorage keys are cleanly reset before and after test suites to ensure zero order-dependent side effects.

4. **Inkline Visual & Interaction Contracts**:
   Tests explicitly verify the Inkline neo-brutalist interaction rules:
   - Elevation models and shadow hierarchy (2px ink borders, hard offset block shadows, zero gradients/blurs).
   - Tactile press physics (`translate(2px, 2px)` collapsing shadow).
   - Dialog overlay behaviors (bottom sheets on mobile `<640px` / centered modal panels on desktop `≥640px`).
   - Accessible keyboard-first workflows (`N` quick capture, `Ctrl/Cmd+K` command palette, focus traps, `Escape` key restoration).

---

## 2. Test Runner & Environment Configuration

- **Test Runner**: Vitest v3 with `@testing-library/react` and `@testing-library/user-event`.
- **DOM Environment**: `jsdom` configured via `vitest.config.ts`.
- **Database Engine**: `fake-indexeddb/auto` imported in `vitest.setup.ts`.
- **React Testing Mode**: `process.env.NODE_ENV = "test"` ensuring standard React `act()` boundaries.
- **Timers**: `vi.useFakeTimers()` and `vi.setSystemTime()` used for deterministic overdue, date strip, and rhythm calculations.

---

## 3. Harness Architecture

The test suite provides two complementary harness configurations:

### 3.1 Full App E2E Harness (`<AuthProvider><App /></AuthProvider>`)
Renders the complete root component including routing, URL search parameter synchronizer (`?view=...`), global keyboard listeners (`N`, `Ctrl+K`), `PlannerProvider`, `AppShell`, views, sheets, modals, and command palette.
- **Used for**: Cross-feature flows (Tier 3), Real-world workloads (Tier 4), Global shortcut & Command Palette verification.

### 3.2 View-Level Integration Harness (`renderWithPlanner`)
Renders individual views (`TodayView`, `BoardView`, `TimelineView`, `GoalsView`, `NotesView`, `CoursesView`, `InsightsView`, `SettingsView`) wrapped in a customizable `PlannerContext.Provider`.
- **Used for**: Isolated feature coverage (Tier 1) and boundary/edge cases (Tier 2) to exercise granular UI behaviors, props, and callbacks with precise state injection.

### 3.3 Responsive Viewport Stubs (`stubMatchMedia`)
Mocks `window.matchMedia` to simulate:
- Desktop viewport: `(min-width: 1101px)` (top tabs `.shell-tabs`, Kanban grid columns, centered `.modal-panel`).
- Mobile viewport: `(max-width: 720px)` / `(max-width: 1100px)` (bottom dock `.shell-dock`, Kanban status tabs, bottom sheet `.sheet`).

---

## 4. Four-Tier Test Taxonomy

The test suite in `apps/web/src/test/e2e-inkline.test.tsx` is structured into four distinct verification tiers:

### Tier 1: Feature Coverage (Isolation & Component Contracts)
Covers all primary planner views and global shell components in isolation with at least 5 targeted test cases per domain:
1. **Today Dashboard**:
   - Daily agenda rendering and task schedule display.
   - Overdue tasks banner and warning tone.
   - Truthful completion metrics ("X of Y tasks done").
   - Quick task capture trigger.
   - Focus session launcher integration.
2. **Kanban Board**:
   - Multi-column rendering (Inbox/Backlog, Ready, Doing/In Progress, Done).
   - Task status transitions (drag-and-drop / selector / keyboard).
   - Live accessibility announcements upon status movement.
   - Mobile status tab switcher and responsive column hiding.
   - Direct task editing and focus mode triggers.
3. **Timeline View**:
   - Date strip navigation and selected day agenda.
   - Task scheduling display with start/due timestamps.
   - Empty state rendering for unscheduled days.
   - Interactive task edit affordance (`onEdit`).
   - Focus timer integration from timeline items.
4. **Goals View**:
   - Goal card rendering with roll-up completion progress ring.
   - Step decomposition (ordered subtasks toward goal).
   - Goal status updates (active, paused, completed).
   - Linked notes preview and direct navigation.
   - Goal creation and editing workflows.
5. **Notes View**:
   - Note list rendering with pinned note prioritization.
   - Active note markdown editor and preview toggle.
   - Tagging and tag filtering.
   - Cross-linked task and goal chips.
   - Mobile list-first navigation with back-to-list button.
6. **Projects/Courses View**:
   - Course card rendering and color dot accents.
   - Grouped tasks per course.
   - Course creation and color picker.
   - Course editing and deletion cascades.
   - Empty state when no courses exist.
7. **Insights View**:
   - Truthful summary statistics (completed count, overdue count, focus time).
   - 28-day activity heatmap rendering.
   - Weekly completions bar chart data.
   - Algorithmic coaching prompts based on workload balance.
   - Course load completion distribution.
8. **Settings View**:
   - Theme switching (light warm paper vs dark matte slate).
   - Storage key persistence (`throughline-theme`).
   - End-to-end encryption key regeneration confirmation dialog.
   - Manual sync trigger pill.
   - Keyboard shortcuts reference guide display.
9. **Global Keyboard Shortcuts & Shell**:
   - Global `N` key shortcut opening task composer from planner views.
   - Global `Ctrl+K` / `Cmd+K` shortcut opening command palette.
   - Primary action FAB adapting between views ("New task" vs "New note").
   - Masthead brand mark and sync status pill.
10. **Dialog & Sheet Overlays**:
    - Sheet component rendering as bottom drawer on mobile and centered modal on desktop.
    - Escape key press closing active dialogs and restoring focus.
    - Backdrop click dismissing sheets.
    - Inkline Level 4 elevation: 8px hard offset shadow (`--shadow-3`).

---

### Tier 2: Boundary & Corner Cases
Covers stress conditions, boundary limits, and unexpected inputs across the platform:
1. **Zero-State & Empty States**:
   - Empty Today view (no tasks due).
   - Empty Kanban board (0 tasks across all columns).
   - Empty Timeline view (no scheduled events).
   - Empty Goals view (no goals defined).
   - Empty Notes view (no notes created).
   - Empty Courses view (no courses enrolled).
   - Empty Insights view (first-run guidance before completions).
2. **Extreme String Lengths**:
   - Maximum length task title (500+ characters) verifying no layout blowouts or horizontal overflow.
   - Extended multi-paragraph markdown note bodies.
   - Empty/whitespace-only input rejection in task composer and course creator.
3. **Extreme Date Boundaries**:
   - Tasks overdue by 1+ years properly grouped in overdue sections.
   - Tasks scheduled far in the future (e.g., year 2050).
   - Tasks without any due dates (backlog items).
   - Same-day tasks spanning midnight boundaries.
4. **Theme Toggle Stress & Rapid Cycling**:
   - Rapid sequential toggling between light, dark, and system modes.
   - Persistence across page reloads in IndexedDB / standard storage keys.
5. **Rapid Keyboard & Non-Alphanumeric Inputs**:
   - Special characters, format-specific punctuation, and HTML/XSS payloads (`<script>alert(1)</script>`, `&quot;`, `🔥`).
   - Verification that inputs are escaped safely and rendered literally.

---

### Tier 3: Cross-Feature Combinations (Pairwise Coverage)
Covers the integration boundaries where multiple features intersect:
1. **Course + Task + Goal Trinity**:
   - Create a course, assign a task to the course and attach it to a goal.
   - Verify task appears in Course list, Goal step list, and Today/Kanban views.
   - Verify Goal progress ring accurately reflects completion of this cross-linked task.
2. **Note + Goal + Task Context Linking**:
   - Create a note, link it to both a goal and a specific task.
   - Verify note shows goal and task chips in editor.
   - Verify goal view displays note in "Linked notes" section.
   - Verify clicking linked note in Goal view jumps to the Note editor.
3. **Task Completion Cascading to Insights & Today**:
   - Complete a task from Kanban Board or Today agenda.
   - Verify task moves to Done column with celebration trigger.
   - Verify Insights view immediately increments completed task count, updates 28-day heatmap, and recalculates coaching signals.
4. **Command Palette Global Indexing & Search Navigation**:
   - Index across tasks, notes, goals, and courses.
   - Search by keyword and verify filtered results across distinct entity types.
   - Select a search result and verify the app navigates to the target view and opens the item editor.
5. **Focus Timer to Cooldown Task Suggestions**:
   - Start a focus session linked to a task.
   - Complete focus session and verify cooldown modal appears with low-energy task recommendations from the backlog.

---

### Tier 4: Real-World Workload Scenarios
Comprehensive end-to-end scenarios simulating realistic student and power-planner usage patterns:
1. **Scenario 1: Student Semester Setup**:
   - Enroll in multiple courses (Biology, Calculus, History).
   - Add syllabus assignments with staggered due dates and difficulty ratings.
   - Break major assignments into structured subtasks.
   - Verify accurate course grouping and timeline schedule.
2. **Scenario 2: Daily Morning Planning**:
   - Open Today dashboard at the start of the day.
   - Triage overdue tasks from yesterday.
   - Move priority items from Backlog to Ready and In Progress on the Kanban board.
   - Launch focus timer on the highest-priority item.
3. **Scenario 3: Midterm Study Sprint**:
   - Create a dedicated "Midterm Exam Prep" goal with target exam date.
   - Write comprehensive lecture notes with markdown outlines.
   - Link study notes directly to the goal and review tasks.
   - Log completed study blocks and verify goal progress advancement.
4. **Scenario 4: End-of-Day Review & Gamification**:
   - Check off remaining daily tasks.
   - Observe completion celebrations (confetti trigger and XP feedback).
   - Navigate to Insights to review daily completion velocity and weekly rhythm.
5. **Scenario 5: Full Keyboard Navigation Flow**:
   - Execute an entire planning session without mouse interaction:
   - Jump between views using `Ctrl+K` command palette.
   - Create new items via `N` quick capture.
   - Close modal overlays via `Escape`.
   - Reorder tasks on Kanban via `Ctrl+Arrow` keys.

---

## 5. Verification Commands

Run the comprehensive E2E test suite:
```powershell
npm run test -- apps/web/src/test/e2e-inkline.test.tsx
```

Run all test suites across the monorepo:
```powershell
npm run test
```

Run strict TypeScript typecheck across all workspaces:
```powershell
npm run typecheck
```

Run ESLint verification:
```powershell
npm run lint
```
