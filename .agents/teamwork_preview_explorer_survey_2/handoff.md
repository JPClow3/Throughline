# Handoff Report: Core Planner Views & UX Affordances Audit

**Date**: 2026-09-10  
**Agent**: Teamwork Explorer (`teamwork_preview_explorer_survey_2`)  
**Parent Agent**: Orchestrator (`8dbbbd50-34b8-497e-a5ca-a277e75cae31`)  
**Status**: Complete (Hard Handoff)

---

## 1. Observation

Direct code examination of `apps/web/src` revealed the following specific findings:

### 1.1 Timeline View Cannot Edit Tasks
- In `apps/web/src/views/TimelineView.tsx` lines 58–60:
  ```tsx
  <h3 className="mt-0.5">{task.title}</h3>
  <span className="agenda-status">{kanbanColumns[task.status]}</span>
  ```
- In `apps/web/src/views/TimelineView.tsx` lines 83–91:
  ```tsx
  export function TimelineView({
    onNewTask,
    onStartFocus,
    onUpdateTask
  }: {
    onNewTask?: (date?: Date) => void;
    onStartFocus?: (task: Task) => void;
    onUpdateTask?: (task: Task) => void;
  })
  ```
- In `apps/web/src/App.tsx` lines 441–447:
  ```tsx
  {props.view === "timeline" ? (
    <TimelineView
      onNewTask={props.onOpenComposer}
      onStartFocus={props.setFocusTask}
      onUpdateTask={(task) => void updateTask(task)}
    />
  ) : null}
  ```
  `TimelineView` does not accept `onEdit`, and task titles are non-interactive strings.

### 1.2 Goals View Linked Notes Are Inert
- In `apps/web/src/views/GoalsView.tsx` lines 371–374:
  ```tsx
  linkedNotes.map((note) => (
    <Card key={note.id} flat className="goal-note-card">
      <strong>{noteDisplayTitle(note)}</strong>
      <p>{noteExcerpt(note.body, 100) || "Empty note — open Notes to write it."}</p>
    </Card>
  ))
  ```
  The `<Card>` has no `onClick` handler, and `GoalsView` has no `onOpenNote` prop.

### 1.3 Board View Checkmark Bypasses Completion Celebration
- In `apps/web/src/views/TaskCard.tsx` lines 158–164:
  ```tsx
  onClick={() => {
    if (onStatusChange) {
      onStatusChange(task.id, "done");
      return;
    }
    onComplete?.(task);
  }}
  ```
  In `apps/web/src/views/BoardView.tsx` lines 173–176:
  ```tsx
  onStatusChange={(taskId, status) => {
    const target = tasks.find((item) => item.id === taskId) ?? task;
    moveTo(target.id, status);
  }}
  ```
  Clicking the checkmark on a board card invokes `onStatusChange` instead of `onComplete`, bypassing XP and confetti bursts.

### 1.4 Command Palette Missing Insights Navigation
- In `apps/web/src/views/CommandPalette.tsx` lines 128–136:
  ```tsx
  <Command.Group heading="Navigation" className="palette-group">
    <NavItem icon={<House size={16} weight="bold" />} label="Go to Today" onSelect={() => runCommand(() => onNavigate("dashboard"))} />
    <NavItem icon={<Target size={16} weight="bold" />} label="Go to Goals" onSelect={() => runCommand(() => onNavigate("goals"))} />
    <NavItem icon={<Kanban size={16} weight="bold" />} label="Go to Board" onSelect={() => runCommand(() => onNavigate("kanban"))} />
    <NavItem icon={<CalendarDots size={16} weight="bold" />} label="Go to Timeline" onSelect={() => runCommand(() => onNavigate("timeline"))} />
    <NavItem icon={<FileText size={16} weight="bold" />} label="Go to Notes" onSelect={() => runCommand(() => onNavigate("notes"))} />
    <NavItem icon={<FolderSimple size={16} weight="bold" />} label="Go to Projects" onSelect={() => runCommand(() => onNavigate("courses"))} />
    <NavItem icon={<GearSix size={16} weight="bold" />} label="Settings" onSelect={() => runCommand(() => onNavigate("settings"))} />
  </Command.Group>
  ```
  "Go to Insights" is missing.

### 1.5 Global Shortcut `N` Inactive in Goals
- In `apps/web/src/App.tsx` lines 266–271:
  ```tsx
  const primaryActionLabel =
    props.view === "notes"
      ? "New note"
      : props.view === "dashboard" || props.view === "kanban" || props.view === "timeline" || props.view === "courses"
        ? "New task"
        : undefined;
  ```
  In lines 282–284:
  ```tsx
  if (primaryActionLabel) {
    onOpenComposer();
  }
  ```
  When `view === "goals"`, `primaryActionLabel` is undefined, so `handlePrimaryAction()` is a no-op.

### 1.6 Inconsistent Press Physics on TaskCard
- In `apps/web/src/views/TaskCard.tsx` lines 136–137:
  ```tsx
  whileHover={justCompleted ? undefined : { translateX: -2, translateY: -2 }}
  whileTap={{ scale: 0.985 }}
  ```
  `docs/ui-ux.md` specifies: "Level 3 (Pressed): The element sinks — translate(2px, 2px), shadow collapses to nothing."

---

## 2. Logic Chain

1. **Premise 1**: Product requirements (`docs/ui-ux.md` and `docs/product.md`) mandate that:
   - Clicking a task title opens the task in the Task Editor across all views.
   - Cross-linking between notes, tasks, and goals allows instantaneous jump navigation.
   - Completing a task provides celebratory feedback (confetti and XP).
   - Pressing `N` triggers quick capture across all planner views.
   - Every control and surface must be functional (zero dead affordances).
2. **Step 1 (Timeline Defect)**: From Observation 1.1, `AgendaRow` does not bind an `onClick` or edit handler to `task.title`, and `TimelineView` does not receive `onEdit`. Therefore, users viewing their day on the timeline cannot modify task details, titles, due dates, subtasks, or priorities without switching to another view.
3. **Step 2 (Goals Defect)**: From Observation 1.2, `GoalDetail` displays linked notes with the prompt "Empty note — open Notes to write it", but does not attach an event handler or link to the card. Therefore, the prompt is a dead affordance and users cannot navigate to the linked note.
4. **Step 3 (Celebration Defect)**: From Observation 1.3, `TaskCard` prioritizes `onStatusChange` over `onComplete`. In `BoardView`, `onStatusChange` is provided, which causes board checkmark clicks to execute a status change without firing `completeTask`. Therefore, board task completions do not trigger the intended celebration animations.
5. **Step 4 (Keyboard & Command Palette Gaps)**: From Observations 1.4 & 1.5, `CommandPalette` omits Insights navigation, and `App.tsx` omits `goals` from `primaryActionLabel`. Therefore, global navigation and keyboard capture workflows are incomplete in these contexts.
6. **Step 5 (Design System Deviation)**: From Observation 1.6, `TaskCard` uses Framer Motion spring scaling (`scale: 0.985`) instead of Inkline tactile press displacement (`translate(2px, 2px)` collapsing shadow).

---

## 3. Caveats

- **Network / API Testing**: Push API background delivery and VAPID registration were evaluated from the client code paths; live push network delivery against a deployed push server was not tested in this read-only audit.
- **Local-first Auth Flow**: While `RequireAuth.tsx` currently blocks anonymous `/app/*` access, modifying the auth routing boundary requires orchestrator alignment on guest mode session mechanics (e.g. anonymous local Dexie session vs. prompt to register).
- No production source code was modified during this investigation.

---

## 4. Conclusion

Throughline possesses a high-quality neo-brutalist foundation and well-structured Dexie repository architecture. However, several high-impact UX workflow gaps, dead affordances, and missing empty states must be resolved to fulfill Acceptance Criteria R1–R4:

1. **P0 Fixes**:
   - Enable task editing in `TimelineView` (`onEdit` prop + interactive title button).
   - Enable note navigation in `GoalsView` (`onOpenNote` on `.goal-note-card` + auto-navigate on note creation).
   - Ensure `onComplete` is always called when clicking the checkmark button in `TaskCard`.
2. **P1 Fixes**:
   - Activate `N` shortcut in Goals view.
   - Add "Go to Insights" to `CommandPalette`.
   - Add actionable `EmptyState` cards with CTA buttons to `BoardView` (when 0 tasks exist), `TimelineView` (CTA inside empty state card), and `InsightsView` (when 0 tasks/sessions logged).
3. **P2 Fixes**:
   - Replace `TaskCard`'s `scale: 0.985` tap animation with `translate(2px, 2px)` shadow collapse.
   - Replace `window.prompt` in `FilterBar` with an accessible dialog, and expose saved presets in mobile viewports.
   - Add task drill-down links to project rows in `CoursesView`.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Timeline Task Edit Affordance**:
   - Inspect `apps/web/src/views/TimelineView.tsx` at line 58. Note that `task.title` is wrapped only in `<h3>` without an `onClick` handler or button.
   - Inspect `apps/web/src/App.tsx` at lines 441–447. Note that `TimelineView` is rendered without `onEdit`.
2. **Verify Goals Linked Notes Affordance**:
   - Inspect `apps/web/src/views/GoalsView.tsx` at lines 371–374. Note that `<Card className="goal-note-card">` is a non-interactive element.
3. **Verify Board Completion Burst Bypass**:
   - Inspect `apps/web/src/views/TaskCard.tsx` at lines 158–164. Note that `if (onStatusChange)` exits early before reaching `onComplete?.(task)`.
4. **Verify Command Palette Insights Omission**:
   - Inspect `apps/web/src/views/CommandPalette.tsx` at lines 128–136. Note that only 7 views are listed.
5. **Verify Full Survey Report**:
   - Read `H:\Code\Pessoais\Throughline\.agents\teamwork_preview_explorer_survey_2\survey_report.md`.
