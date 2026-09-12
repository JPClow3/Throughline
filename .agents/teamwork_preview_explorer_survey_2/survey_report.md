# Comprehensive Survey & UX Affordances Audit Report

**Date**: 2026-09-10  
**Target Repository**: `Throughline` (`apps/web/src`)  
**Investigator**: Teamwork Explorer (`teamwork_preview_explorer_survey_2`)  
**Scope**: All 8 core planner views, shell navigation, global overlays, dialogs, responsive adaptations, keyboard accessibility, and Inkline neo-brutalist design fidelity.

---

## Executive Summary

Throughline's frontend architecture is built with React 19, TypeScript, Vite, Tailwind CSS 4, Dexie (IndexedDB local-first storage), Framer Motion (`motion/react`), `@dnd-kit`, and `@phosphor-icons/react`. It implements the **Inkline** editorial neo-brutalist visual language (warm paper fills, 2px ink borders, hard offset shadows, zero blur/gradients, and signal accents).

While the core functionality is robust, the audit uncovered **5 critical workflow blockers**, **6 missing empty state CTA flows**, **several dead affordances**, and **discrepancies in press physics and keyboard shortcuts**. Most notably:
1. **Timeline View Task Click Dead Affordance**: Tasks in the Timeline view cannot be opened or edited because `TimelineView` lacks an `onEdit` handler and renders task titles as inert `<h3>` elements.
2. **Goals View Linked Notes Dead Affordance**: Linked note cards in `GoalDetail` are unclickable static cards that explicitly instruct users to "open Notes to write it", yet offer no link or navigation to the note. Furthermore, "Add linked note" adds a note without navigating to it.
3. **Board View Checkmark Bypass Bug**: Clicking the checkmark on a task in the Kanban board routes to `onStatusChange(task.id, "done")` rather than `onComplete(task)`, bypassing confetti and XP celebration bursts.
4. **Command Palette Missing Insights**: The Command Palette navigation group lists 7 views but completely omits "Go to Insights".
5. **Keyboard Shortcut `N` Inactive in Goals View**: Pressing `N` in Goals view does nothing because `primaryActionLabel` is undefined for the `"goals"` view.
6. **Filter Preset UX Jarring (`window.prompt`) & Mobile Preset Omission**: Saving presets uses native browser `window.prompt`, and saved presets are completely hidden on mobile viewports.
7. **TaskCard Tap Spring vs. Press Physics**: `TaskCard` uses Framer Motion `whileTap={{ scale: 0.985 }}` instead of Inkline tactile press physics (`translate(2px, 2px)` collapsing shadow).
8. **Auth Wall vs. Offline/Local-First Spec**: `RequireAuth.tsx` forcefully redirects unauthenticated users to `/login`, and `SettingsView` hides account configuration when logged out, lacking a guest/local continuation flow.

---

## Detailed Audit: The 8 Core Planner Views

### 1. Today Dashboard (`TodayView.tsx`)

| Evaluation Dimension | Assessment | Details & Code References |
| :--- | :--- | :--- |
| **First-load Empty State** | ⚠️ Partial | When `briefing.priorityTasks.length === 0`, lines 81–88 render `<div className="empty-state-card today-empty"><p>No urgent work is asking for you right now.</p><Button variant="primary" onClick={() => onNewTask()}><Plus /> Capture a task</Button></div>`. However, for a completely new user with 0 tasks planner-wide, the copy remains "No urgent work is asking for you right now" and guidance reads "Nothing is pressing. This is a good day to protect focus." There is no welcoming onboarding CTA ("Welcome! Create your first task or course"). |
| **Populated Content State** | ✅ Complete | Dynamic date eyebrow (`dateLabel`), hero progress sentence (`briefing.progressSentence`), "New task" accent button. Priority tasks rendered via `TaskCard` with project dots/chips and due dates. "Also on the radar" secondary section (lines 90–113) renders up to 4 non-urgent upcoming/overdue tasks with relative due badges (`formatRadarDue`). Right rail: "Guidance" cards and "Schedule shape" pressure metrics. |
| **Transitions & Loading** | ✅ Crisp | `motion.div` transition (`duration: 0.18s`, `y: 8 → 0`). Renders `ViewSkeleton` during Dexie query hydration. |
| **Dead Affordances** | ⚠️ Minor | `PressureRow` items (lines 176–205) and `today-guidance-item` rows (lines 127–131) look interactive but are purely static informational displays. Clicking "Overdue: X" does not filter or navigate. |
| **Quick Capture & Editing** | ✅ Functional | "New task" button and `N` key open `TaskComposer`. Clicking a priority card title or a radar row triggers `onEdit(task)`, opening `TaskEditor`. Next study block triggers `onEdit`. |

---

### 2. Kanban Board (`BoardView.tsx`)

| Evaluation Dimension | Assessment | Details & Code References |
| :--- | :--- | :--- |
| **First-load Empty State** | ❌ Deficient | Desktop: When empty, each column renders `<p className="kanban-empty-state">Nothing here.</p>` (line 215). Mobile: Renders `<p className="kanban-empty-state">No tasks in backlog.</p>` (line 184). When the entire board is empty (0 tasks total or 0 matches for active filters), there is **no global empty state card and no CTA button** to add a task or clear filters. |
| **Populated Content State** | ✅ Complete | Desktop: 5 standard columns (Backlog, Ready, Doing, Blocked, Done) with status accent dots and task count badges. Mobile (< 1100px): Segmented tablist (`kanban-mobile-tabs`) for columns with count badges, showing the active status list. Drag & drop implemented via `@dnd-kit/core` with `SortableContext` and `closestCorners`. Column order and status changes persist via `planBoardMove`. |
| **Transitions & Loading** | ✅ Crisp | Dragging styles via `CSS.Transform.toString(transform)`. Quick 120ms transitions. |
| **Dead Affordances & Bugs** | 🔴 Bug | **Completion Burst Bypass**: In `TaskCard.tsx` (lines 158–164):<br>`if (onStatusChange) { onStatusChange(task.id, "done"); return; } onComplete?.(task);`<br>Because `BoardView` passes both `onStatusChange` and `onComplete`, clicking the checkmark button calls `moveTo(target.id, "done")` instead of `onComplete`. This bypasses `completeTask` celebration confetti and XP particle bursts! (Spacebar keyboard shortcut in `SortableQuest` directly calls `onComplete`, creating an inconsistent experience). |
| **Filter Bar Issues** | ⚠️ UX Issue | In `FilterBar.tsx` (line 62), `handleSavePreset` uses `window.prompt("Name this filter preset")`. On mobile screens, saved presets are completely omitted (`!isCompact && presets.length` at line 70), hiding custom presets from mobile users. |
| **Keyboard Accessibility** | ✅ First-Class | `SortableQuest` (lines 284–342): `Enter` edits, `Space` completes, `Ctrl+ArrowLeft/Right` moves across columns with focus retention, `ArrowUp/Down` navigates siblings, `ArrowLeft/Right` jumps across columns. Live announcements in `aria-live="polite"` (line 134). |

---

### 3. Timeline View (`TimelineView.tsx`)

| Evaluation Dimension | Assessment | Details & Code References |
| :--- | :--- | :--- |
| **First-load Empty State** | ⚠️ Incomplete | Lines 214–219: `<EmptyState icon={<CalendarBlank />} title="Nothing scheduled" body="No tasks due on this day. Pick another day, or give a task a due time." />`. The `EmptyState` component supports an `action` prop, but `TimelineView` passes `undefined`. There is no direct CTA button in the empty card. |
| **Populated Content State** | ✅ Complete | 10-day horizontal day strip (`day-strip`) with weekday and date. Time-of-day agenda cards (`AgendaRow`) showing scheduled start/end time, duration, project name, status, and Focus button. Drag-and-drop: dragging vertically snaps due time in 30-min increments; dragging onto day chips moves tasks to that day. |
| **Transitions & Loading** | ✅ Crisp | `DragOverlay` drop animation with bezier easing. Fast tab switching between days. |
| **Dead Affordances & Bugs** | 🔴 Critical Bug | **Tasks Cannot Be Opened or Edited**: In `AgendaRow` (line 58): `<h3 className="mt-0.5">{task.title}</h3>`. Unlike TodayView and BoardView, the task title is plain unclickable text. `TimelineView` does not accept an `onEdit` prop, and `App.tsx` (lines 441–447) does not provide one. Users are completely unable to open the task editor from the Timeline view! |
| **Quick Capture & Editing** | ⚠️ Partial | "New Task for [Day]" button in the section header opens `TaskComposer` with `initialDate` pre-filled. However, tasks on the timeline cannot be marked complete directly (only "Focus" button is exposed). |

---

### 4. Goals View (`GoalsView.tsx` & `GoalComposer.tsx`)

| Evaluation Dimension | Assessment | Details & Code References |
| :--- | :--- | :--- |
| **First-load Empty State** | ✅ Excellent | Lines 122–132: Full `EmptyState` with `Target` icon, title "No goals yet", body "Set an end goal and break it into small steps", and CTA button `<Button variant="primary" onClick={onNewGoal}><Plus /> New goal</Button>`. |
| **Populated Content State** | ✅ Complete | Grid of `goal-card` buttons with project dot, roll-up SVG progress ring (`Ring`), title, summary, step count, and target date. Detail view (`GoalDetail`) shows large 88px progress ring, "Mark goal complete" button with confetti celebration, "Reopen", "Edit", "Delete" (with `ConfirmDialog`), inline step creator, reorderable step tasks (`CaretUp`/`CaretDown`), and linked notes section. |
| **Transitions & Loading** | ✅ Crisp | Fast detail toggle, inline confetti celebration burst on goal completion. |
| **Dead Affordances & Bugs** | 🔴 Critical Bug | **Unclickable Linked Notes**: In `GoalDetail` (lines 371–374):<br>`<Card key={note.id} flat className="goal-note-card"><strong>{noteDisplayTitle(note)}</strong><p>{noteExcerpt(note.body, 100) || "Empty note — open Notes to write it."}</p></Card>`<br>The card has NO `onClick` handler and no button. The user is told "Empty note — open Notes to write it", but clicking it does nothing! `GoalsView` does not receive an `onOpenNote` callback from `App.tsx`.<br>Furthermore, clicking "Add linked note" creates an empty note in the database, but does NOT navigate to it or open an editor. |
| **Global Shortcut Gap** | ⚠️ Gap | In `App.tsx` (lines 266–271), `primaryActionLabel` is `undefined` when `view === "goals"`. Pressing `N` in Goals view does nothing. It should open `GoalComposer` (or `TaskComposer`). |

---

### 5. Notes View (`NotesView.tsx`)

| Evaluation Dimension | Assessment | Details & Code References |
| :--- | :--- | :--- |
| **First-load Empty State** | ✅ Complete | Master list: `EmptyState` with `FileText` icon, "No notes yet" / "No matches". Detail pane: `EmptyState` with `FileText` icon, "No note selected", and CTA `<Button variant="primary" onClick={createNote}><Plus /> New note</Button>`. |
| **Populated Content State** | ✅ Complete | Left rail: Search input with instant substring highlighting (`HighlightedText`), pinned note indicator (`PushPin`), title, excerpt, and linked entity count badges. Right pane (`NoteEditor`): Title input, Pin/unpin button, Delete button (with `ConfirmDialog`), "Write" / "Preview" segmented tabs, Markdown rendering via `ReactMarkdown`, linked goal/task chips with Unlink buttons, and dropdown `<select>` to add links. |
| **Mobile Responsiveness** | ✅ Fluid | On mobile (`useCompactFilters`), selecting a note hides the list and shows `notes-view-detailing` with a "← Notes" back button to return to the list. |
| **Dead Affordances & Workflows** | ⚠️ Minor Risk | Note content saves on blur (`onBlur={() => commit({})}`). If a user types and immediately navigates away using the mobile dock or masthead without blurring the textarea, unsaved keystrokes in React state can be lost. There is no `Ctrl+S` keyboard shortcut listener. |

---

### 6. Courses / Projects View (`CoursesView.tsx`)

| Evaluation Dimension | Assessment | Details & Code References |
| :--- | :--- | :--- |
| **First-load Empty State** | ⚠️ Basic | Shows an inline `EmptyState` ("No projects yet. Add one below...") sitting above the add-project form. Lacks an independent graphic or card empty state. |
| **Populated Content State** | ✅ Complete | List of project rows in a settings-like card. Each row displays a color swatch dot, project name, task count badge, edit button, and delete button (with `ConfirmDialog` warning about orphaned tasks). Inline editing row supports renaming, setting default RPG attribute, 6-color swatch picker, save checkmark, and cancel `X`. New project form at the bottom. Highlighting matching project (`highlightedProjectId`) when jumped from Command Palette. |
| **Transitions & Loading** | ✅ Crisp | Fast inline edit swap and reactive Dexie updates. |
| **Dead Affordances & Workflows** | ⚠️ Major UX Gap | **Project Rows Are Not Clickable**: Clicking a project row does nothing. There is no drill-down to view all tasks belonging to that project, and no button to "Filter Board by this Project" or "Open in Timeline". A user with 5 tasks in "Biology" cannot inspect them from this view. |

---

### 7. Insights View (`InsightsView.tsx`)

| Evaluation Dimension | Assessment | Details & Code References |
| :--- | :--- | :--- |
| **First-load Empty State** | ❌ Missing | When the planner has 0 tasks and 0 focus sessions, there is **no view-level empty state**. The entire dashboard renders with 0 values: "Completed: 0", "Last 7 days: 0", "Overdue: 0", "Focus time: 0h 0m", empty charts with 0 values, a 28-day grid of empty gray squares, and a quiet text note: "Complete a few tasks to see course balance." |
| **Populated Content State** | ✅ Complete | Coaching card ("What to adjust this week") with rule-based advice (`deriveCoachingInsights`). 5 stat tiles (Completed, Last 7 days, Overdue, Focus time, Active courses). 3 Recharts bar charts (Daily focus hours, 4-week focus trend, 7-day completion rhythm). 28-day completion heatmap with SVG color intensity and accessible screen-reader labels. Top courses breakdown. |
| **Dead Affordances & Bugs** | 🔴 Missing Nav | **Omitted from Command Palette**: In `CommandPalette.tsx` (lines 128–136), "Go to Insights" is missing from the Navigation command list! (Only Today, Goals, Board, Timeline, Notes, Projects, and Settings are listed).<br>**Architectural Inconsistency**: `InsightsView` calls `useTasks()` and `useFocusSessions()` directly, duplicating Dexie hook subscriptions rather than consuming `PlannerProvider`. |

---

### 8. Settings View (`SettingsView.tsx`)

| Evaluation Dimension | Assessment | Details & Code References |
| :--- | :--- | :--- |
| **Unauthenticated / Guest State** | 🔴 Critical Gap | In `SettingsView` (lines 232–295), `{account ? <Card>Account...</Card> : null}`. When not logged in, the Account and Recovery Key cards are omitted entirely. There is **no sign-in banner, no "Create account or sign in to sync" card, and no way for a guest user to initiate auth from Settings**! |
| **Populated Content State** | ✅ Complete | Account status with relative sync time, "Sync now" button, "Sign out" button. Zero-knowledge recovery key regeneration, display, confirmation checkbox, and 4-character verification check. Appearance card: Light / Dark / System segmented toggle, game layer toggle, "Restart onboarding". App readiness card: connection, PWA shell, storage engine, install status, "Install App" button. Local notifications permission and test trigger. Redacted push API and VAPID setup. ICS calendar download. JSON backup export and import with preview modal. Reset to sample data with `ConfirmDialog`. |
| **Transitions & Loading** | ✅ Crisp | Instant theme switching via CSS root data-theme attribute. Smooth modal confirmations. |
| **Dead Affordances & Bugs** | ⚠️ Minor | If VAPID or Push API is unreachable, errors are displayed only as a text status pill. When app is already installed, the Install App button is cleanly hidden. |

---

## Global Chrome, Overlays & Affordance Audit

### AppShell (`AppShell.tsx`)
- **Masthead**: Brand logo + link to `/app?view=dashboard`, search trigger button with `Ctrl K` badge, desktop "New Task" accent button, `SyncPill` with live status dot (`is-busy`, `is-warn`, `is-error`), and `AccountMenu`.
- **Account Menu**: Avatar initial, popover menu with email, "End-to-end encrypted" shield badge, relative sync timestamp, "Sync now", "Settings", and "Sign out". Fully dismissible on outside click and Escape.
- **Desktop Navigation**: Tab strip (`shell-tabs`) with 8 items. Active tab marked with `aria-current="page"` and highlighted with signal yellow.
- **Mobile Navigation**: Dock (`shell-dock`) with 4 primary items (Today, Board, Timeline, Notes) and a "More" drawer toggle (`DotsThree`). The "More" sheet (`dock-more-sheet`) slides up with Goals, Projects, Insights, and Settings.
- **Mobile FAB**: Floating action button (`shell-mobile-primary-action`) appears above dock when `primaryActionLabel` is defined.
- **Dead Affordance Rule Compliance**: Per `docs/ui-ux.md`, no notification center exists, so no dead notification bell is rendered in the shell.

### TaskComposer (`TaskComposer.tsx`) & TaskEditor (`TaskEditor.tsx`)
- **TaskComposer**: Sheet modal with up-front essentials (Title, Project, Due). Expandable "Details" drawer contains Description, Priority, Reminder, Recurrence, Tags, Subtasks editor, and Game Layer sliders (Energy, Difficulty, Attribute). Input auto-focuses; empty title displays accessible inline error (`aria-describedby`).
- **TaskEditor**: Complete editor with drag-and-drop sortable subtasks (`@dnd-kit/sortable`), completion timestamps, status selector, and delete confirmation dialog (`ConfirmDialog`).

### FocusTimer (`FocusTimer.tsx`) & CooldownModal (`CooldownModal.tsx`)
- **FocusTimer**: Supports untitled focus and task-attached focus. Features a floating neo-brutal panel (`ik-card focus-timer-panel`) with progress ring, pause/resume, and manual log button. Safeguard: closing mid-session logs elapsed time (>= 60s) so user study work is never lost.
- **Deviation**: The timer toggle button uses `borderRadius: "50%"`, which diverges from Inkline's 10px / 14px control radius tokens.
- **CooldownModal**: Triggers after focus completion, offering up to 3 low-energy backlog suggestions with complete, edit, or focus actions.

### Command Palette (`CommandPalette.tsx`)
- Triggered globally via `Ctrl/Cmd+K` and masthead button.
- Fuzzy searches tasks, notes, goals, and projects via `useGlobalSearch`.
- Selecting results jumps directly to the target view and opens the item editor.
- **Bug**: Missing "Go to Insights" in the navigation group.

### First-Run Onboarding (`OnboardingOverlay.tsx`)
- 4-step wizard:
  1. Workspace type (School, Work, Personal).
  2. 1–3 Courses/Projects.
  3. First actionable task title, project, and due date.
  4. Notification permission & sync settings handoff.
- Traps focus via `useDialogA11y`, prevents accidental Escape dismissal, and initializes clean planner data.

---

## Design System & Neo-Brutalist Fidelity Audit

| System Requirement | Implementation Status | Findings & Deviations |
| :--- | :--- | :--- |
| **Paper & Ink Palette** | ✅ High Fidelity | Light mode: `#f1ede3` warm paper, `#faf8f1` card fills, `#191712` ink borders and text. Dark mode: `#15171e` slate paper, `#1e212b` cards, `#ece7da` ink. Signal accents: `#ffd43b` yellow, `#3d5afe` blue, `#1fae67` green, `#ff5d47` red, `#8f6bf5` violet. |
| **Zero Blur & Gradients** | ✅ High Fidelity | Elevation communicated exclusively via hard offset shadows (`var(--shadow-0)` to `--shadow-3`). No backdrop blurs, no drop shadow blurs, no surface gradients. |
| **Tactile Press Physics** | ⚠️ Inconsistent | `.btn` and `.goal-card` correctly lift `translate(-2px, -2px)` on hover and sink `translate(2px, 2px)` collapsing shadow on active press.<br>🔴 **Deviation on `TaskCard`**: `TaskCard.tsx` (line 136) uses `whileTap={{ scale: 0.985 }}` rather than `translate(2px, 2px)` collapsing shadow.<br>⚠️ **Deviation on `.chip`**: `.chip` uses `translate(-1px, -1px)` and `translate(1px, 1px)`. |
| **Typography Hierarchy** | ✅ High Fidelity | Self-hosted `Geist Variable`. Heavy headings (`font-weight: 800`), uppercase tracked section labels (`--tracking-eyebrow: 0.09em`), tabular numerals on countdowns and timestamps. |
| **Touch Targets** | ✅ Compliant | Controls, dock links, and buttons maintain minimum 44x44px or 38px touch footprints with generous padding. |

---

## Architectural & Lifecycle Issues

1. **Authentication Wall vs. Offline/Local-First Spec**:
   - `docs/product.md` specifies that Throughline is local-first, where accounts and sync are strictly optional.
   - However, `main.tsx` wraps `/app/*` inside `<RequireAuth>`, which immediately navigates any user without a token to `/login`. Neither `Landing.tsx` nor `Login.tsx` exposes a "Continue as guest / use offline" button.
2. **Dexie Provider Duplication**:
   - `InsightsView.tsx` directly calls `useTasks()` and `useFocusSessions()`, setting up separate Dexie `useLiveQuery` hooks instead of reading from `PlannerProvider` context.
3. **Preset Creation UX**:
   - `FilterBar.tsx` invokes `window.prompt()`, which blocks thread execution and cannot be styled.

---

## Prioritized Remediation Roadmap

| Priority | Issue / Defect | Location | Proposed Fix |
| :--- | :--- | :--- | :--- |
| **P0** | Timeline tasks cannot be clicked or edited | `views/TimelineView.tsx`, `App.tsx` | Pass `onEdit` prop to `TimelineView`; wrap `AgendaRow` task titles with an interactive edit button calling `onEdit(task)`. |
| **P0** | Goals view linked notes cannot be clicked or opened | `views/GoalsView.tsx`, `App.tsx` | Pass `onOpenNote` to `GoalsView`; make `.goal-note-card` clickable buttons; after `onAddNote`, navigate to Notes with the new note selected. |
| **P0** | Board checkmark bypasses celebration confetti & XP burst | `views/TaskCard.tsx`, `views/BoardView.tsx` | In `TaskCard`, ensure checkmark click always calls `onComplete(task)` even when `onStatusChange` is defined. |
| **P1** | Global `N` shortcut inactive in Goals view | `App.tsx` | Add `goals` to `primaryActionLabel` or handle `N` in Goals to open `GoalComposer`. |
| **P1** | Command Palette missing "Go to Insights" | `views/CommandPalette.tsx` | Add `<NavItem icon={<ChartLine />} label="Go to Insights" onSelect={() => runCommand(() => onNavigate("insights"))} />`. |
| **P1** | Missing global empty states on Board, Timeline, & Insights | `BoardView.tsx`, `TimelineView.tsx`, `InsightsView.tsx` | Add full neo-brutalist `EmptyState` cards with clear iconography, motivating copy, and actionable CTA buttons when task counts are 0. |
| **P2** | TaskCard press physics uses spring scale instead of Inkline sink | `views/TaskCard.tsx`, `styles.css` | Replace `whileTap={{ scale: 0.985 }}` with CSS/motion `translate(2px, 2px)` and shadow collapse to match constitution. |
| **P2** | Filter preset creation uses `window.prompt` & hidden on mobile | `views/FilterBar.tsx` | Replace `window.prompt` with an accessible inline modal or popover; display saved presets on compact/mobile screens within the Filters drawer. |
| **P2** | Project rows in CoursesView are not clickable | `views/CoursesView.tsx` | Add link or button on project rows to jump to Board or Timeline pre-filtered by that project. |
| **P3** | FocusTimer round button radius | `views/FocusTimer.tsx` | Change `borderRadius: "50%"` to standard Inkline `var(--radius-control)` (10px/14px). |
