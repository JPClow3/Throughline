# Milestone 3 Explorer Handoff: Core Planner Views & UX Affordances (Features 11 & 12)

## 1. Observation

### Feature 11: TimelineView Task Edit Affordance (`onEdit`)

#### 1. `apps/web/src/views/TimelineView.tsx`
- **Lines 30–35**:
  ```typescript
  type AgendaRowProps = {
    task: Task;
    courseMap: Map<string, Course>;
    onStartFocus?: (task: Task) => void;
    isGhost?: boolean;
  };
  ```
  `AgendaRowProps` lacks an `onEdit?: (task: Task) => void;` callback.
- **Line 58**:
  ```typescript
  <h3 className="mt-0.5">{task.title}</h3>
  ```
  The task title in `AgendaRow` is rendered as plain text within an `<h3>` heading without any click handler, button wrapping, or hover affordance.
- **Lines 83–91**:
  ```typescript
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
  `TimelineViewProps` only accepts `onNewTask`, `onStartFocus`, and `onUpdateTask`. It does not accept `onEdit?: (task: Task) => void;`.
- **Lines 209–211**:
  ```typescript
  {dayTasks.map((task) => (
    <DraggableAgendaRow key={task.id} task={task} courseMap={courseById} onStartFocus={onStartFocus} />
  ))}
  ```
  `DraggableAgendaRow` does not receive or propagate `onEdit`.
- **Lines 251–276**:
  ```typescript
  function DraggableAgendaRow({
    task,
    courseMap,
    onStartFocus
  }: {
    task: Task;
    courseMap: Map<string, Course>;
    onStartFocus?: (task: Task) => void;
  }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: task.id,
      data: { type: "task", task }
    });

    return (
      <AgendaRow
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        task={task}
        courseMap={courseMap}
        onStartFocus={onStartFocus}
        className={`cursor-grab active:cursor-grabbing${isDragging ? " opacity-30" : ""}`}
      />
    );
  }
  ```
  Notice `{...listeners}` attaches pointer event listeners from `@dnd-kit/core` to the row container. Interactive child buttons (such as the existing Focus button on lines 62–74) use `event.stopPropagation()` to prevent drag conflicts.
- **Existing styling pattern in `apps/web/src/styles.css` (lines 1757–1771)**:
  ```css
  .task-card-edit {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    text-align: left;
  }
  .task-card-edit:hover {
    text-decoration: underline;
    text-decoration-color: var(--yellow);
    text-decoration-thickness: 3px;
    text-underline-offset: 3px;
  }
  ```
  `.task-card-edit` is already defined and utilized in `TaskCard.tsx` (line 144) for editable task titles with the Inkline yellow underline hover state.

#### 2. `apps/web/src/App.tsx`
- **Lines 240–245**:
  ```typescript
  /** Views hand us the task object; we track only its id. */
  const openTask = React.useCallback(
    (task: Task) => {
      props.setEditingTaskId(task.id);
    },
    [props]
  );
  ```
  `App.tsx` has `openTask` which sets `editingTaskId`, opening the `<TaskEditor>` sheet (lines 599–615).
- **Lines 451 & 458**:
  `TodayView` and `BoardView` both receive `onEdit={openTask}`.
- **Lines 463–469**:
  ```typescript
  {props.view === "timeline" ? (
    <TimelineView
      onNewTask={props.onOpenComposer}
      onStartFocus={props.setFocusTask}
      onUpdateTask={(task) => void updateTask(task)}
    />
  ) : null}
  ```
  `TimelineView` is currently NOT passed `onEdit`.

---

### Feature 12: GoalsView Linked Notes Navigation (`onOpenNote`)

#### 1. `apps/web/src/views/GoalsView.tsx`
- **Lines 10–48**:
  ```typescript
  export function GoalsView({
    goals,
    tasks,
    courses,
    notes,
    selectedId,
    onSelectGoal,
    onNewGoal,
    onSetGoalStatus,
    onDeleteGoal,
    onEditGoal,
    onAddTask,
    onAddNote,
    onCompleteTask,
    onStatusChange,
    onEditTask,
    onUpdateTask,
    onStartFocus,
    onReorderTask
  }: {
    goals: Goal[];
    tasks: Task[];
    courses: Course[];
    notes: Note[];
    selectedId: string | null;
    ...
  ```
  1. `GoalsViewProps` does not declare `onOpenNote?: (noteId: string) => void;`.
  2. `selectedId: string | null;` is required rather than optional (`selectedId?: string | null;`). This triggers TypeScript compilation errors in `e2e-inkline.test.tsx` (lines 385, 502, 1069, 1243, 1270) when callers mount `<GoalsView ... />` without specifying `selectedId`.
- **Lines 53–74 (`GoalDetail` invocation)**:
  `onOpenNote` is not forwarded from `GoalsView` to `GoalDetail`.
- **Lines 155–172 (`GoalDetail` props)**:
  `GoalDetail` does not accept `onOpenNote?: (noteId: string) => void;`.
- **Lines 368–376**:
  ```typescript
  <div className="goal-note-list">
    {linkedNotes.length ? (
      linkedNotes.map((note) => (
        <Card key={note.id} flat className="goal-note-card">
          <strong>{noteDisplayTitle(note)}</strong>
          <p>{noteExcerpt(note.body, 100) || "Empty note — open Notes to write it."}</p>
        </Card>
      ))
    ) : (
  ```
  `.goal-note-card` is rendered as a static `<Card flat className="goal-note-card">`. It has no click handler, no button role/semantics, and no navigation affordance.

#### 2. `apps/web/src/styles.css`
- **Lines 2477–2489**:
  ```css
  .goal-note-card {
    padding: 0.9rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .goal-note-card strong {
    font-size: var(--text-sm);
  }
  .goal-note-card p {
    font-size: var(--text-sm);
    color: var(--ink-soft);
  }
  ```
  `.goal-note-card` lacks cursor styling, button resets (`text-align: left; font: inherit; color: inherit; width: 100%;`), and Inkline neo-brutalist press physics (`:hover` lift with `var(--shadow-1)` and `:active` press sink).

#### 3. `apps/web/src/App.tsx`
- **Lines 271–275 (`openSearchResult`)**:
  ```typescript
  if (result.type === "note") {
    props.setSelectedNoteId(result.id);
    props.setView("notes");
    return;
  }
  ```
  `App.tsx` already uses `props.setSelectedNoteId(id); props.setView("notes");` to navigate directly to a specific note.
- **Lines 470–491**:
  ```typescript
  {props.view === "goals" ? (
    <GoalsView
      goals={goals}
      tasks={tasks}
      courses={courses}
      notes={notes}
      selectedId={props.selectedGoalId}
      onSelectGoal={props.setSelectedGoalId}
      onNewGoal={() => props.setGoalOpen(true)}
      onSetGoalStatus={(goalId, status) => setGoalStatus(goalId, status)}
      onDeleteGoal={removeGoal}
      onEditGoal={props.setEditingGoal}
      onAddTask={addTask}
      onAddNote={addNote}
      onCompleteTask={(task) => completeTask(task)}
      onStatusChange={(taskId, status) => void updateTaskStatus(taskId, status)}
      onEditTask={openTask}
      onUpdateTask={(task) => void updateTask(task)}
      onStartFocus={props.setFocusTask}
      onReorderTask={updateTask}
    />
  ) : null}
  ```
  `GoalsView` is currently NOT passed `onOpenNote`.

#### 4. Typecheck Verification (`npm run typecheck`)
- Running `npm run typecheck` produced:
  ```
  src/test/e2e-inkline.test.tsx(385,12): error TS2741: Property 'selectedId' is missing in type...
  src/test/e2e-inkline.test.tsx(490,13): error TS2322: Property 'onOpenNote' does not exist on type 'IntrinsicAttributes & ...'
  src/test/e2e-inkline.test.tsx(502,12): error TS2741: Property 'selectedId' is missing in type...
  src/test/e2e-inkline.test.tsx(1069,10): error TS2741: Property 'selectedId' is missing in type...
  src/test/e2e-inkline.test.tsx(1243,10): error TS2741: Property 'selectedId' is missing in type...
  src/test/e2e-inkline.test.tsx(1270,10): error TS2741: Property 'selectedId' is missing in type...
  ```
  Test `T1.19` in `e2e-inkline.test.tsx` (lines 468–497) was already written expecting `onOpenNote` to exist on `GoalsViewProps`:
  ```typescript
  it("T1.19: renders linked notes and enables jumping to linked note", () => {
    const onOpenNote = vi.fn();
    ...
    render(
      <GoalsView
        ...
        onOpenNote={onOpenNote}
      />
    );
  ```

---

## 2. Logic Chain

1. **Inkline Interaction Consistency & Zero Dead Affordances**:
   - `docs/ui-ux.md` (§6, §8) dictates that every user affordance must be functional. In `TodayView` and `BoardView`, task titles are interactive triggers that launch the task editor.
   - In `TimelineView`, agenda tasks display time, course, and status, but clicking the task title does nothing. Adding `onEdit?: (task: Task) => void;` to `TimelineViewProps` and rendering task titles with `.task-card-edit` enables opening the `TaskEditor` sheet identically to other views.
2. **Drag Sensor Conflict Avoidance**:
   - In `TimelineView.tsx`, rows are draggable using `@dnd-kit/core`'s `useDraggable`.
   - The title button must stop event propagation on `click` and `pointerDown` (`event.stopPropagation()`) so that clicking the title reliably invokes `onEdit(task)` without triggering accidental 5px pointer drag activations.
3. **App Level Routing**:
   - `App.tsx` has `openTask = (task: Task) => props.setEditingTaskId(task.id)`. Passing `onEdit={openTask}` (or `onEdit={(task) => props.setEditingTaskId(task.id)}`) to `<TimelineView />` completes the link between the timeline and the `<TaskEditor>` sheet.
4. **Cross-Linked Context Navigation (Goal → Note)**:
   - `docs/ui-ux.md` (§8) specifies "Cross-Linked Context: Link markdown notes to tasks and goals."
   - In `GoalsView.tsx` under `GoalDetail`, linked notes are rendered in a grid (`.goal-note-list`). Users seeing linked notes expect to click them to read or edit the note content.
   - Replacing the static `<Card flat className="goal-note-card">` with an accessible button element (`<button type="button" className="ik-card-flat goal-note-card" onClick={() => onOpenNote?.(note.id)}>`) provides full keyboard and pointer accessibility.
   - When clicked, `onOpenNote(note.id)` is invoked.
5. **App Level View & Selection Synchronization**:
   - In `App.tsx`, receiving `onOpenNote={(noteId) => { props.setSelectedNoteId(noteId); props.setView("notes"); }}` switches the active view to `"notes"` and sets `selectedNoteId`.
   - In `NotesView.tsx`, `selectedId: controlledSelectedId` immediately binds the requested note in both desktop split-view and mobile list-detail views.
6. **Type Safety & Test Harness Compatibility**:
   - Making `selectedId?: string | null;` optional (with default `= null`) in `GoalsViewProps` satisfies existing call sites across tests and components that render the top-level goal list without a pre-selected goal.
   - Adding `onOpenNote?: (noteId: string) => void;` to `GoalsViewProps` eliminates TS2322 in `e2e-inkline.test.tsx`.

---

## 3. Caveats

1. **Ghost Row during Drag**:
   - When a task is being dragged in `TimelineView`, `AgendaRow` is rendered inside `DragOverlay` with `isGhost={true}`. The edit button must NOT be interactive when `isGhost` is true (rendered as plain text `task.title`, matching existing guard `!isGhost` on the Focus button).
2. **Empty / Missing Notes**:
   - If a linked note has an empty body, `noteExcerpt(note.body, 100)` falls back to `"Empty note — open Notes to write it."`. The card must still be clickable so the user can navigate to `NotesView` to populate the note.
3. **Optional Callback Safety**:
   - In environments where `onOpenNote` or `onEdit` is omitted (e.g. standalone test harnesses), optional chaining (`onOpenNote?.(note.id)`, `onEdit?.(task)`) or conditional rendering ensures zero runtime crashes.
4. **Scope Boundaries**:
   - Milestone 3 is strictly limited to core planner views and UX affordances. No changes to domain models, Dexie schema, or cryptographic keys are needed.

---

## 4. Conclusion & Proposed Code Changes

### Proposed Edits for Feature 11: `TimelineView` Task Edit Affordance

#### File 1: `apps/web/src/views/TimelineView.tsx`

```tsx
// 1. In AgendaRowProps (lines 30-35):
type AgendaRowProps = {
  task: Task;
  courseMap: Map<string, Course>;
  onStartFocus?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  isGhost?: boolean;
};

// 2. In AgendaRow (lines 37-80):
const AgendaRow = React.forwardRef<HTMLDivElement, AgendaRowProps & React.HTMLAttributes<HTMLDivElement>>(
  ({ task, courseMap, onStartFocus, onEdit, isGhost, className = "", ...rest }, ref) => {
    const course = courseMap.get(task.courseId ?? "");
    const start = new Date(task.dueAt as string);
    const end = new Date(start.getTime() + (task.estimatedMinutes ?? 0) * 60_000);

    return (
      <div ref={ref} className={`agenda-row ${isGhost ? "opacity-90" : ""} ${className}`} {...rest}>
        <time className="agenda-time">{formatTime(start)}</time>
        <Card
          flat
          className="agenda-card"
          style={{ "--project-color": course?.color ?? "var(--ink)" } as CSSProperties}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="agenda-range">
                {formatTime(start)}
                {task.estimatedMinutes ? ` – ${formatTime(end)}` : ""}
                {course ? ` · ${course.name}` : ""}
              </span>
              <h3 className="mt-0.5">
                {onEdit && !isGhost ? (
                  <button
                    type="button"
                    className="task-card-edit"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(task);
                    }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    {task.title}
                  </button>
                ) : (
                  task.title
                )}
              </h3>
              <span className="agenda-status">{kanbanColumns[task.status]}</span>
            </div>
            {onStartFocus && task.status !== "done" && !isGhost ? (
              <button
                type="button"
                className="meta-chip"
                onClick={(event) => {
                  event.stopPropagation();
                  onStartFocus(task);
                }}
                aria-label={`Start focus mode for ${task.title}`}
              >
                <Play size={12} weight="bold" />
                Focus
              </button>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }
);

// 3. In TimelineView definition (lines 83-91):
export function TimelineView({
  onNewTask,
  onStartFocus,
  onUpdateTask,
  onEdit
}: {
  onNewTask?: (date?: Date) => void;
  onStartFocus?: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onEdit?: (task: Task) => void;
}) {
  ...
  // 4. In dayTasks.map (lines 209-211):
  {dayTasks.map((task) => (
    <DraggableAgendaRow
      key={task.id}
      task={task}
      courseMap={courseById}
      onStartFocus={onStartFocus}
      onEdit={onEdit}
    />
  ))}

// 5. In DraggableAgendaRow (lines 251-276):
function DraggableAgendaRow({
  task,
  courseMap,
  onStartFocus,
  onEdit
}: {
  task: Task;
  courseMap: Map<string, Course>;
  onStartFocus?: (task: Task) => void;
  onEdit?: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { type: "task", task }
  });

  return (
    <AgendaRow
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      task={task}
      courseMap={courseMap}
      onStartFocus={onStartFocus}
      onEdit={onEdit}
      className={`cursor-grab active:cursor-grabbing${isDragging ? " opacity-30" : ""}`}
    />
  );
}
```

#### File 2: `apps/web/src/App.tsx`

```tsx
// In Workspace component (lines 463-469):
{props.view === "timeline" ? (
  <TimelineView
    onNewTask={props.onOpenComposer}
    onStartFocus={props.setFocusTask}
    onUpdateTask={(task) => void updateTask(task)}
    onEdit={openTask}
  />
) : null}
```

---

### Proposed Edits for Feature 12: `GoalsView` Linked Notes Navigation

#### File 1: `apps/web/src/views/GoalsView.tsx`

```tsx
// 1. In GoalsViewProps (lines 10-48):
export function GoalsView({
  goals,
  tasks,
  courses,
  notes,
  selectedId = null,
  onSelectGoal,
  onNewGoal,
  onSetGoalStatus,
  onDeleteGoal,
  onEditGoal,
  onAddTask,
  onAddNote,
  onCompleteTask,
  onStatusChange,
  onEditTask,
  onUpdateTask,
  onStartFocus,
  onOpenNote,
  onReorderTask
}: {
  goals: Goal[];
  tasks: Task[];
  courses: Course[];
  notes: Note[];
  selectedId?: string | null;
  onSelectGoal: (goalId: string | null) => void;
  onNewGoal: () => void;
  onSetGoalStatus: (goalId: string, status: GoalStatus) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onEditGoal: (goal: Goal) => void;
  onAddTask: (input: TaskInput) => Promise<void>;
  onAddNote: (input?: NoteInput) => Promise<Note>;
  onCompleteTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
  onOpenNote?: (noteId: string) => void;
  onReorderTask: (task: Task) => Promise<void>;
})

// 2. In GoalDetail invocation (lines 53-74):
<GoalDetail
  goal={selected}
  tasks={tasks}
  courses={courses}
  notes={notes}
  onBack={() => onSelectGoal(null)}
  onAddTask={onAddTask}
  onAddNote={onAddNote}
  onCompleteTask={onCompleteTask}
  onStatusChange={onStatusChange}
  onEditTask={onEditTask}
  onUpdateTask={onUpdateTask}
  onStartFocus={onStartFocus}
  onEditGoal={onEditGoal}
  onOpenNote={onOpenNote}
  onReorderTask={onReorderTask}
  onSetGoalStatus={onSetGoalStatus}
  onDeleteGoal={async (id) => {
    await onDeleteGoal(id);
    onSelectGoal(null);
  }}
/>

// 3. In GoalDetail props type (lines 138-172):
function GoalDetail({
  goal,
  tasks,
  courses,
  notes,
  onBack,
  onAddTask,
  onAddNote,
  onCompleteTask,
  onStatusChange,
  onEditTask,
  onUpdateTask,
  onStartFocus,
  onEditGoal,
  onOpenNote,
  onReorderTask,
  onSetGoalStatus,
  onDeleteGoal
}: {
  goal: Goal;
  tasks: Task[];
  courses: Course[];
  notes: Note[];
  onBack: () => void;
  onAddTask: (input: TaskInput) => Promise<void>;
  onAddNote: (input?: NoteInput) => Promise<Note>;
  onCompleteTask: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onUpdateTask?: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
  onEditGoal: (goal: Goal) => void;
  onOpenNote?: (noteId: string) => void;
  onReorderTask: (task: Task) => Promise<void>;
  onSetGoalStatus: (goalId: string, status: GoalStatus) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
})

// 4. In linked notes list (lines 368-376):
<div className="goal-note-list">
  {linkedNotes.length ? (
    linkedNotes.map((note) => (
      <button
        key={note.id}
        type="button"
        className="ik-card-flat goal-note-card"
        onClick={() => onOpenNote?.(note.id)}
      >
        <strong>{noteDisplayTitle(note)}</strong>
        <p>{noteExcerpt(note.body, 100) || "Empty note — open Notes to write it."}</p>
      </button>
    ))
  ) : (
    <EmptyState
      variant="inline"
      icon={<FileText size={22} weight="bold" />}
      title="No notes linked yet"
      body="Add one to capture context for this goal."
    />
  )}
</div>
```

#### File 2: `apps/web/src/App.tsx`

```tsx
// In Workspace component (lines 470-491):
{props.view === "goals" ? (
  <GoalsView
    goals={goals}
    tasks={tasks}
    courses={courses}
    notes={notes}
    selectedId={props.selectedGoalId}
    onSelectGoal={props.setSelectedGoalId}
    onNewGoal={() => props.setGoalOpen(true)}
    onSetGoalStatus={(goalId, status) => setGoalStatus(goalId, status)}
    onDeleteGoal={removeGoal}
    onEditGoal={props.setEditingGoal}
    onAddTask={addTask}
    onAddNote={addNote}
    onCompleteTask={(task) => completeTask(task)}
    onStatusChange={(taskId, status) => void updateTaskStatus(taskId, status)}
    onEditTask={openTask}
    onUpdateTask={(task) => void updateTask(task)}
    onStartFocus={props.setFocusTask}
    onOpenNote={(noteId) => {
      props.setSelectedNoteId(noteId);
      props.setView("notes");
    }}
    onReorderTask={updateTask}
  />
) : null}
```

#### File 3: `apps/web/src/styles.css`

```css
/* Update lines 2477-2489 to include button reset and Inkline hover/active press physics: */
.goal-note-card {
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  text-align: left;
  width: 100%;
  color: inherit;
  font: inherit;
  cursor: pointer;
  background: var(--card);
  transition: transform var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
}
.goal-note-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-1);
}
.goal-note-card:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}
.goal-note-card strong {
  font-size: var(--text-sm);
}
.goal-note-card p {
  font-size: var(--text-sm);
  color: var(--ink-soft);
}
```

---

### Test Updates

#### File 1: `apps/web/src/test/CalendarTimeline.test.tsx`
Add unit test verifying that clicking the task title invokes `onEdit`:
```tsx
it("triggers onEdit callback when task title is clicked", () => {
  const onEdit = vi.fn();
  const timestamp = new Date().toISOString();
  const dueAt = new Date();
  dueAt.setHours(14, 0, 0, 0);
  const mockTask = TaskSchema.parse({
    id: "task-edit-1",
    title: "Interactive Timeline Task",
    status: "ready",
    courseId: "course-1",
    tags: [],
    subtasks: [],
    dueAt: dueAt.toISOString(),
    createdAt: timestamp,
    updatedAt: timestamp
  });

  renderWithPlanner(
    <TimelineView onNewTask={vi.fn()} onStartFocus={vi.fn()} onUpdateTask={vi.fn()} onEdit={onEdit} />,
    {
      planner: {
        tasks: [mockTask],
        courses: [],
        courseById: new Map()
      }
    }
  );

  const editBtn = screen.getByRole("button", { name: "Interactive Timeline Task" });
  fireEvent.click(editBtn);
  expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "task-edit-1" }));
});
```

#### File 2: `apps/web/src/test/e2e-inkline.test.tsx`
1. Update `T1.19` (lines 468–497) to assert click navigation:
```tsx
it("T1.19: renders linked notes and enables jumping to linked note", () => {
  const onOpenNote = vi.fn();
  const goal = createGoal({ id: "g_notes", title: "Research Project" });
  const note = createNote({ id: "n_research", title: "Literature Review Summary", goalIds: [goal.id] });

  render(
    <GoalsView
      goals={[goal]}
      tasks={[]}
      courses={[]}
      notes={[note]}
      selectedId={goal.id}
      onSelectGoal={vi.fn()}
      onNewGoal={vi.fn()}
      onSetGoalStatus={vi.fn()}
      onDeleteGoal={vi.fn()}
      onEditGoal={vi.fn()}
      onAddTask={vi.fn()}
      onAddNote={vi.fn()}
      onCompleteTask={vi.fn()}
      onStatusChange={vi.fn()}
      onEditTask={vi.fn()}
      onOpenNote={onOpenNote}
      onReorderTask={vi.fn()}
    />
  );

  expect(screen.getByText("Linked notes")).toBeInTheDocument();
  expect(screen.getByText("Literature Review Summary")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Literature Review Summary/i }));
  expect(onOpenNote).toHaveBeenCalledWith("n_research");
});
```
2. Add a new test under `describe("Timeline View", ...)` in `e2e-inkline.test.tsx`:
```tsx
it("triggers onEdit when task title is clicked in timeline", () => {
  const onEdit = vi.fn();
  const today = new Date();
  today.setHours(11, 0, 0, 0);
  const task = createTask({
    id: "time_edit_1",
    title: "Organic Chemistry Problem Set",
    status: "ready",
    dueAt: today.toISOString()
  });

  renderWithPlanner(
    <TimelineView onNewTask={vi.fn()} onStartFocus={vi.fn()} onUpdateTask={vi.fn()} onEdit={onEdit} />,
    {
      planner: { tasks: [task], courses: [], courseById: new Map() }
    }
  );

  const editBtn = screen.getByRole("button", { name: "Organic Chemistry Problem Set" });
  fireEvent.click(editBtn);
  expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "time_edit_1" }));
});
```

---

## 5. Verification Method

To independently verify these proposed changes:

1. **Static Typecheck**:
   ```powershell
   npm run typecheck
   ```
   *Expected result*: Confirms that `TimelineViewProps.onEdit`, `GoalsViewProps.onOpenNote`, and optional `GoalsViewProps.selectedId` resolve all 6 TypeScript errors in `e2e-inkline.test.tsx` (TS2322 and TS2741).

2. **Unit & Integration Test Suite**:
   ```powershell
   npx vitest run apps/web/src/test/CalendarTimeline.test.tsx
   npx vitest run apps/web/src/test/views.test.tsx
   npx vitest run apps/web/src/test/e2e-inkline.test.tsx
   ```
   *Expected result*: All tests pass 100%, verifying that:
   - Timeline agenda tasks render interactive buttons and invoke `onEdit`.
   - Goals linked notes render interactive buttons and invoke `onOpenNote`.
   - Existing component contracts and harnesses in `views.test.tsx` and `e2e-inkline.test.tsx` remain compatible.

3. **DOM & CSS Inspection**:
   - Verify `.task-card-edit` renders on timeline task headings and displays yellow underline on hover (`text-decoration-color: var(--yellow)`).
   - Verify `.goal-note-card` renders as `<button type="button">` with `text-align: left`, lifts on hover (`translate(-2px, -2px)` with `var(--shadow-1)`), and depresses on active press (`translate(2px, 2px)`).
