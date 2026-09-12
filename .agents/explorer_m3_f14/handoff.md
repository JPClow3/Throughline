# Feature 14 Investigation Report: Complete Empty States with Actionable CTAs Across All 8 Planner Views

## 1. Observation

A systematic audit was conducted on `EmptyState` component implementation, global styling tokens in `styles.css`, top-level orchestration in `App.tsx`, and all 8 planner views in `apps/web/src/views/`.

### 1.1 EmptyState Component (`apps/web/src/ui/feedback.tsx:41-64`)
- Currently declared inside `apps/web/src/ui/feedback.tsx` and re-exported in `apps/web/src/ui/index.ts`. No dedicated `apps/web/src/ui/EmptyState.tsx` file exists.
- The component definition:
```tsx
export function EmptyState({
  icon,
  title,
  body,
  action,
  variant = "card"
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  variant?: "card" | "inline";
}) {
  return (
    <div className={`empty-state-${variant}`}>
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      {body ? <p className="text-sm" style={{ maxWidth: "38ch" }}>{body}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
```
- **Deficiencies**:
  1. Does not accept an optional `className` prop (`className?: string`), making custom classes (like `today-empty`) impossible without wrapper elements.
  2. Lacks `role="status"` for accessible announcements when mounted dynamically.

### 1.2 View-by-View Audit

#### View 1: `TodayView.tsx` (`apps/web/src/views/TodayView.tsx:81-88`)
- When `briefing.priorityTasks.length === 0`:
```tsx
<div className="empty-state-card today-empty">
  <p>No urgent work is asking for you right now.</p>
  <Button variant="primary" onClick={() => onNewTask()}>
    <Plus size={15} weight="bold" />
    Capture a task
  </Button>
</div>
```
- **Observation**:
  - Does NOT use the `<EmptyState>` component; renders a raw `<div>`.
  - Lacks the Inkline yellow icon tile (`.empty-state-icon`).
  - Lacks an `<h3>` heading (only has a `<p>`).
  - Button uses `variant="primary"` rather than `variant="accent"` (highlighter yellow for view primary action).

#### View 2: `BoardView.tsx` (`apps/web/src/views/BoardView.tsx:136-222`)
- **Observation**:
  - **Zero total tasks (`tasks.length === 0`)**: No overall empty state exists. On desktop, 5 empty columns are rendered with `<p className="kanban-empty-state">Nothing here.</p>`. On mobile, status tabs render with `<p className="kanban-empty-state">No tasks in backlog.</p>`.
  - **Filtered empty state (`tasks.length > 0 && filteredTasks.length === 0`)**: All columns display "Nothing here." without an affordance to clear active filters.
  - **Prop contract**: `BoardView` accepts `onComplete`, `onStatusChange`, `onUpdateTasks`, `onEdit`, `onOpenNotes`, `onStartFocus`, but does **NOT** accept `onNewTask`.
  - In `App.tsx:454`, `<BoardView>` is not passed `onNewTask={props.onOpenComposer}`.
  - Desktop empty column copy is `"Nothing here."`, less helpful than mobile's `"No tasks in [column]."`.

#### View 3: `TimelineView.tsx` (`apps/web/src/views/TimelineView.tsx:213-219`)
- When `dayTasks.length === 0`:
```tsx
<EmptyState
  icon={<CalendarBlank size={24} weight="bold" />}
  title="Nothing scheduled"
  body="No tasks due on this day. Pick another day, or give a task a due time."
/>
```
- **Observation**:
  - Missing the `action` prop! `onNewTask?: (date?: Date) => void` is already passed in `TimelineViewProps`, but no CTA button is provided to the user.
  - When the entire planner has zero tasks (`tasks.length === 0`), the copy "No tasks due on this day. Pick another day, or give a task a due time." assumes tasks exist elsewhere, confusing first-run users.

#### View 4: `GoalsView.tsx` (`apps/web/src/views/GoalsView.tsx:122-131, 349-354, 377-382`)
- Top-level zero goals (lines 122-131):
  - Properly renders `<EmptyState icon={<Target size={24} weight="bold" />} title="No goals yet" body="Set an end goal and break it into small steps." action={<Button variant="primary" onClick={onNewGoal}><Plus size={15} weight="bold" /> New goal</Button>} />`.
- Goal detail sub-steps (lines 349-354):
  - Renders `<EmptyState variant="inline" icon={<CheckCircle size={22} weight="bold" />} title="No steps yet" body="Break this goal into a few small tasks." />` without an `action` button.
- Goal detail linked notes (lines 377-382):
  - Renders `<EmptyState variant="inline" icon={<FileText size={22} weight="bold" />} title="No notes linked yet" body="Add one to capture context for this goal." />` without an `action` button.

#### View 5: `NotesView.tsx` (`apps/web/src/views/NotesView.tsx:159-164, 191-200`)
- Notes sidebar list (lines 159-164):
```tsx
<EmptyState
  icon={<FileText size={22} weight="bold" />}
  title={query ? "No matches" : "No notes yet"}
  body={query ? "Try a different search." : "Capture a thought and link it to a task or goal."}
/>
```
- **Observation**:
  - Missing `action` prop! When 0 notes exist, there is no inline CTA button to create a note. When search yields 0 matches, there is no "Clear search" CTA.
  - Detail pane (lines 191-200) when no note is selected correctly includes an action: `<Button variant="primary" onClick={() => void createNote()}><Plus size={15} weight="bold" /> New note</Button>`.

#### View 6: `CoursesView.tsx` (`apps/web/src/views/CoursesView.tsx:187-193`)
- When `courses.length === 0`:
```tsx
<EmptyState
  variant="inline"
  icon={<FolderOpen size={22} weight="bold" />}
  title="No projects yet"
  body="Add one below to group related tasks, goals, and notes."
/>
```
- **Observation**:
  - Uses `variant="inline"` instead of a prominent card and lacks an `action` CTA button.
  - The form is located at the bottom of the card; first-run users lack an immediate CTA trigger to jump focus to the name input.

#### View 7: `InsightsView.tsx` (`apps/web/src/views/InsightsView.tsx:148-309`)
- **Observation**:
  - **Completely missing a first-run / zero-data state.**
  - When `tasks.length === 0 && focusSessions.length === 0`, the view renders an empty coaching card ("Your workload looks balanced."), zeroed stat tiles, empty chart bars, and an empty heatmap.
  - `InsightsView` does not accept `onNewTask` prop; in `App.tsx:516`, `<InsightsView />` is invoked without composer callbacks.

#### View 8: `SettingsView.tsx` (`apps/web/src/views/SettingsView.tsx:438-453`)
- Settings is a system preferences dashboard with structured cards.
- In `Calendar export` card (lines 443-446):
  `{tasks.filter((task) => task.dueAt).length} due tasks available.`
- When 0 tasks have due dates, "Export ICS" outputs an empty calendar without explanation.

---

## 2. Logic Chain

### 2.1 The Inkline Philosophy for Empty States
According to `docs/ui-ux.md`:
1. **First Screen Efficiency**: The initial screen must be fully usable immediately. An empty screen must never be a dead end.
2. **Printed-Paper Honesty & Tactile Affordances**: Every empty state must have:
   - 2px dashed ink border (`var(--line-soft)`) with solid card background (`var(--card-tinted)`).
   - Solid signal icon tile: 52x52px, 2px solid border, `var(--yellow)` fill, 3px hard offset shadow (`var(--shadow-1)`).
   - High-contrast typography: Geist heading ~800 (`color: var(--ink)`), descriptive subtitle (`max-width: 38ch`).
   - Clear, single-intent actionable CTA button (`variant="accent"` with highlighter yellow fill) that opens the relevant creation workflow (task composer, course input, note editor, or goal composer).
3. **Zero Dead Affordances**: The shell and views must not present disconnected buttons or empty states that leave the user wondering what to do next.

### 2.2 Preserving Existing Automated Test Assertions
Existing test suites (`TodayView.test.tsx`, `e2e-inkline.test.tsx`) contain assertions that expect specific text:
- Today empty state: `screen.getByText("No urgent work is asking for you right now.")`
- Timeline empty state: `screen.getByText("Nothing scheduled")`
- Goals empty state: `screen.getByText("No goals yet")`
- Notes empty state: `screen.getByText("No notes yet")`
- Courses empty state: `screen.getByText("No projects yet")`

By preserving these exact strings as title or body copy, empty state polish can be completed across all 8 views with zero regressions.

---

## 3. Caveats

1. **Filtering vs. Zero-Data**:
   - In views with filtering (`BoardView`, `NotesView`, `TimelineView`), a distinction must be maintained between **Zero Data** (the user has created nothing) and **Filtered Zero** (items exist, but filters/queries hide them).
   - For Zero Data: the CTA creates a new item (e.g. "Create task", "New note").
   - For Filtered Zero: the CTA resets the query (e.g. "Clear filters", "Clear search").
2. **Mobile Layout & Keyboard Navigation**:
   - On small screens (<640px), `.empty-state-card` padding scales gracefully (`padding: var(--space-8) var(--space-6)`).
   - CTA buttons must satisfy the 44px touch target requirement and support standard keyboard interaction (`Enter` / `Space`).
3. **Modular Placement of EmptyState**:
   - `apps/web/src/ui/EmptyState.tsx` should be created as a dedicated module and re-exported through `apps/web/src/ui/feedback.tsx` and `apps/web/src/ui/index.ts` to maintain 100% backward compatibility with existing imports.

---

## 4. Conclusion & Proposed Code Changes

All 8 planner views can be brought to complete fidelity by introducing a standardized `apps/web/src/ui/EmptyState.tsx`, wiring `onNewTask` through `App.tsx` to `BoardView` and `InsightsView`, and updating each view to render actionable empty states.

### 4.1 Create `apps/web/src/ui/EmptyState.tsx`
```tsx
import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  variant?: "card" | "inline";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  variant = "card",
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`empty-state-${variant}${className ? ` ${className}` : ""}`} role="status">
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      {body ? <p className="text-sm" style={{ maxWidth: "38ch" }}>{body}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
```

### 4.2 Re-export in `apps/web/src/ui/feedback.tsx` and `apps/web/src/ui/index.ts`
In `apps/web/src/ui/feedback.tsx`:
```tsx
export { EmptyState, type EmptyStateProps } from "./EmptyState";
```
In `apps/web/src/ui/index.ts`:
```tsx
export { EmptyState, type EmptyStateProps } from "./EmptyState";
```

### 4.3 Proposed Changes in `apps/web/src/views/TodayView.tsx`
Replace lines 81-88:
```tsx
<<<<
            <div className="empty-state-card today-empty">
              <p>No urgent work is asking for you right now.</p>
              <Button variant="primary" onClick={() => onNewTask()}>
                <Plus size={15} weight="bold" />
                Capture a task
              </Button>
            </div>
====
            <EmptyState
              className="today-empty"
              icon={<CheckCircle size={24} weight="bold" />}
              title="All clear for today"
              body="No urgent work is asking for you right now."
              action={
                <Button variant="accent" onClick={() => onNewTask()}>
                  <Plus size={15} weight="bold" />
                  Capture a task
                </Button>
              }
            />
>>>>
```
Add `EmptyState` to import from `"../ui"`.

### 4.4 Proposed Changes in `apps/web/src/views/BoardView.tsx`
1. Add `onNewTask?: () => void;` to `BoardView` props.
2. Add imports:
   ```tsx
   import { FunnelSimple, Kanban, Plus } from "@phosphor-icons/react";
   import { Button, EmptyState } from "../ui";
   ```
3. Update main render:
```tsx
      {tasks.length === 0 ? (
        <EmptyState
          icon={<Kanban size={24} weight="bold" />}
          title="No tasks on the board"
          body="Your board is empty. Create your first task to start tracking work through your workflow."
          action={
            onNewTask ? (
              <Button variant="accent" onClick={onNewTask}>
                <Plus size={16} weight="bold" />
                Create task
              </Button>
            ) : null
          }
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<FunnelSimple size={24} weight="bold" />}
          title="No matching tasks"
          body="No tasks match the active filters or search terms."
          action={
            <Button variant="primary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : isMobileBoard ? (
```
4. Improve desktop column empty state (line 215):
```tsx
<<<<
                  {columnTasks.length === 0 ? (
                    <p className="kanban-empty-state">Nothing here.</p>
                  ) : null}
====
                  {columnTasks.length === 0 ? (
                    <p className="kanban-empty-state">No tasks in {kanbanColumns[status].toLowerCase()}.</p>
                  ) : null}
>>>>
```

### 4.5 Proposed Changes in `apps/web/src/views/TimelineView.tsx`
Update lines 214-219:
```tsx
<<<<
          <EmptyState
            icon={<CalendarBlank size={24} weight="bold" />}
            title="Nothing scheduled"
            body="No tasks due on this day. Pick another day, or give a task a due time."
          />
====
          <EmptyState
            icon={<CalendarBlank size={24} weight="bold" />}
            title="Nothing scheduled"
            body={
              tasks.length === 0
                ? "Create a task with a due date to see it on your daily timeline."
                : "No tasks due on this day. Pick another day, or give a task a due time."
            }
            action={
              onNewTask ? (
                <Button variant="accent" onClick={() => onNewTask(selectedDate)}>
                  <Plus size={15} weight="bold" />
                  {tasks.length === 0 ? "Create a task" : "Schedule a task"}
                </Button>
              ) : undefined
            }
          />
>>>>
```

### 4.6 Proposed Changes in `apps/web/src/views/GoalsView.tsx`
1. GoalDetail steps (line 349):
```tsx
<<<<
            <EmptyState
              variant="inline"
              icon={<CheckCircle size={22} weight="bold" />}
              title="No steps yet"
              body="Break this goal into a few small tasks."
            />
====
            <EmptyState
              variant="inline"
              icon={<CheckCircle size={22} weight="bold" />}
              title="No steps yet"
              body="Break this goal into a few small tasks."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>('input[aria-label="New step"]');
                    input?.focus();
                  }}
                >
                  <Plus size={14} weight="bold" /> Add step
                </Button>
              }
            />
>>>>
```
2. GoalDetail linked notes (line 377):
```tsx
<<<<
            <EmptyState
              variant="inline"
              icon={<FileText size={22} weight="bold" />}
              title="No notes linked yet"
              body="Add one to capture context for this goal."
            />
====
            <EmptyState
              variant="inline"
              icon={<FileText size={22} weight="bold" />}
              title="No notes linked yet"
              body="Add one to capture context for this goal."
              action={
                <Button
                  size="sm"
                  onClick={() => void onAddNote({ goalIds: [goal.id], projectId: goal.projectId })}
                >
                  <Plus size={14} weight="bold" /> Add linked note
                </Button>
              }
            />
>>>>
```

### 4.7 Proposed Changes in `apps/web/src/views/NotesView.tsx`
Sidebar empty state (lines 159-164):
```tsx
<<<<
                <EmptyState
                  icon={<FileText size={22} weight="bold" />}
                  title={query ? "No matches" : "No notes yet"}
                  body={query ? "Try a different search." : "Capture a thought and link it to a task or goal."}
                />
====
                <EmptyState
                  icon={<FileText size={22} weight="bold" />}
                  title={query ? "No matches" : "No notes yet"}
                  body={query ? "Try a different search." : "Capture a thought and link it to a task or goal."}
                  action={
                    query ? (
                      <Button size="sm" onClick={() => setQuery("")}>
                        Clear search
                      </Button>
                    ) : (
                      <Button variant="accent" size="sm" onClick={() => void createNote()}>
                        <Plus size={14} weight="bold" /> New note
                      </Button>
                    )
                  }
                />
>>>>
```

### 4.8 Proposed Changes in `apps/web/src/views/CoursesView.tsx`
Courses empty state (lines 187-193):
```tsx
<<<<
            <EmptyState
              variant="inline"
              icon={<FolderOpen size={22} weight="bold" />}
              title="No projects yet"
              body="Add one below to group related tasks, goals, and notes."
            />
====
            <EmptyState
              icon={<FolderOpen size={24} weight="bold" />}
              title="No projects yet"
              body="Add your first project or course below to group related tasks, goals, and notes."
              action={
                <Button
                  variant="accent"
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>('input[aria-label="New project name"]');
                    input?.focus();
                  }}
                >
                  <Plus size={15} weight="bold" /> Add project
                </Button>
              }
            />
>>>>
```

### 4.9 Proposed Changes in `apps/web/src/views/InsightsView.tsx`
1. Accept `onNewTask?: () => void` in `InsightsView`:
```tsx
export function InsightsView({ onNewTask }: { onNewTask?: () => void } = {})
```
2. Import `Plus` from `@phosphor-icons/react` and `Button, EmptyState` from `"../ui"`.
3. Add first-run guard after `if (!stats)`:
```tsx
  if (tasks.length === 0 && focusSessions.length === 0) {
    return (
      <div className="view-layout">
        <header className="view-head">
          <div>
            <span className="eyebrow">Coaching</span>
            <h1 className="view-title">Insights</h1>
            <p className="view-head-sub">Signals from your tasks, courses, and focus sessions.</p>
          </div>
        </header>
        <EmptyState
          icon={<ChartLineUp size={24} weight="bold" />}
          title="No insights yet"
          body="Insights, coaching, and focus trends will appear here once you capture tasks and complete study sessions."
          action={
            onNewTask ? (
              <Button variant="accent" onClick={onNewTask}>
                <Plus size={15} weight="bold" />
                Create a task
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }
```

### 4.10 Proposed Changes in `apps/web/src/views/SettingsView.tsx`
Lines 443-447:
```tsx
          <p>
            {tasks.filter((task) => task.dueAt).length} due{" "}
            {tasks.filter((task) => task.dueAt).length === 1 ? "task" : "tasks"} available.
          </p>
          {tasks.filter((task) => task.dueAt).length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
              No tasks have due dates yet. Assign due dates in Today or Timeline to export them to your calendar.
            </p>
          ) : null}
```

### 4.11 Proposed Wiring in `apps/web/src/App.tsx`
Lines 454 & 516:
```tsx
              {props.view === "kanban" ? (
                <BoardView
                  onComplete={(task) => completeTask(task)}
                  onStatusChange={(taskId, status) => void updateTaskStatus(taskId, status)}
                  onUpdateTasks={(updates) => void updateTasks(updates)}
                  onEdit={openTask}
                  onOpenNotes={() => props.setView("notes")}
                  onStartFocus={props.setFocusTask}
                  onNewTask={props.onOpenComposer}
                />
              ) : null}
```
```tsx
              {props.view === "insights" ? <InsightsView onNewTask={props.onOpenComposer} /> : null}
```

---

## 5. Verification Method

### 5.1 Automated Test Suites
Run the following commands to verify that the empty state implementations meet all type, lint, unit, and integration standards:

1. **Typecheck verification**:
   ```bash
   npm run typecheck
   ```
   *Expected outcome*: 0 TypeScript diagnostic errors across `apps/web` and `packages/domain`.

2. **Unit & Integration tests for views**:
   ```bash
   npx vitest run apps/web/src/test/TodayView.test.tsx apps/web/src/test/BoardView.test.tsx apps/web/src/test/CoursesView.test.tsx apps/web/src/test/InsightsView.test.tsx
   ```
   *Expected outcome*: 100% passing tests.

3. **E2E Empty State Test Suite (`apps/web/src/test/e2e-inkline.test.tsx` `T2.1`)**:
   Add test coverage for the new empty states:
   ```tsx
   // BoardView empty state
   const { unmount: uBoard } = renderWithPlanner(
     <BoardView onComplete={vi.fn()} onStatusChange={vi.fn()} onEdit={vi.fn()} onNewTask={vi.fn()} />,
     { planner: { tasks: [], courses: [], courseById: new Map() } }
   );
   expect(screen.getByText("No tasks on the board")).toBeInTheDocument();
   expect(screen.getByRole("button", { name: "Create task" })).toBeInTheDocument();
   uBoard();

   // InsightsView first-run empty state
   const { unmount: uInsights } = render(<InsightsView onNewTask={vi.fn()} />);
   expect(screen.getByText("No insights yet")).toBeInTheDocument();
   expect(screen.getByRole("button", { name: "Create a task" })).toBeInTheDocument();
   uInsights();
   ```
   Execute with:
   ```bash
   npx vitest run apps/web/src/test/e2e-inkline.test.tsx
   ```

4. **Full build check**:
   ```bash
   npm run build
   ```
   *Expected outcome*: Successful Vite bundle without asset or chunk errors.
