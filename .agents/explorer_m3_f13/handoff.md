# Handoff Report: Feature 13 (Board View Celebration Trigger)

## 1. Observation

### 1.1 Complete Button Interception in `TaskCard.tsx`
In `apps/web/src/views/TaskCard.tsx`, lines 151–169:
```tsx
        <button
          className={`complete-button${done ? " is-done" : ""}`}
          type="button"
          aria-label={done ? `${task.title} completed` : `Complete ${task.title}`}
          title={done ? "Completed" : "Mark complete"}
          disabled={done}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => {
            if (onStatusChange) {
              onStatusChange(task.id, "done");
              return;
            }
            onComplete?.(task);
          }}
        >
          <motion.span initial={false} animate={done ? { rotate: [0, -12, 0] } : { rotate: 0 }} transition={{ duration: 0.3 }}>
            <Check size={15} weight="bold" />
          </motion.span>
        </button>
```
- Direct observation: When `onStatusChange` is provided to `TaskCard`, clicking `.complete-button` calls `onStatusChange(task.id, "done")` and **returns immediately** on line 161. Line 163 (`onComplete?.(task)`) is **never reached**.

### 1.2 `BoardView.tsx` Wiring Passes Both `onComplete` and `onStatusChange`
In `apps/web/src/views/BoardView.tsx`:
- Mobile card rendering (lines 164–180):
```tsx
                  <TaskCard
                    task={task}
                    course={courseById.get(task.courseId ?? "")}
                    compact
                    noteCount={noteCountByTask.get(task.id) ?? 0}
                    onComplete={(target) => {
                      onComplete(target);
                      setAnnouncement(`Moved ${task.title} to Done.`);
                    }}
                    onStatusChange={(taskId, status) => {
                      const target = tasks.find((item) => item.id === taskId) ?? task;
                      moveTo(target.id, status);
                    }}
                    onEdit={onEdit}
                    onOpenNotes={onOpenNotes}
                    onStartFocus={onStartFocus}
                  />
```
- Desktop card rendering in `SortableQuest` (lines 354–364):
```tsx
      <TaskCard
        task={task}
        course={course}
        compact
        noteCount={noteCount}
        onComplete={onComplete}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onOpenNotes={onOpenNotes}
        onStartFocus={onStartFocus}
      />
```
- Direct observation: Both mobile and desktop `BoardView` pass `onStatusChange` along with `onComplete`. Because `onStatusChange` is present, `TaskCard`'s click handler executes `moveTo(task.id, "done")` and **completely bypasses `onComplete`**.

### 1.3 `GoalsView.tsx` Wiring Also Passes Both Callbacks
In `apps/web/src/views/GoalsView.tsx` lines 337–345:
```tsx
                <TaskCard
                  task={task}
                  course={courseMap.get(task.courseId ?? "")}
                  onComplete={onCompleteTask}
                  onStatusChange={onStatusChange}
                  onEdit={onEditTask}
                  onUpdateTask={onUpdateTask}
                  onStartFocus={onStartFocus}
                />
```
- Direct observation: Clicking the checkmark on a task step in `GoalsView` also hits `if (onStatusChange)`, calling `onStatusChange` and bypassing `onCompleteTask`.

### 1.4 Celebration Burst Mechanism in `TaskCard.tsx` and `styles.css`
In `apps/web/src/views/TaskCard.tsx`:
- Lines 35–72:
```tsx
function CompletionBurst({ task }: { task: Task }) {
  const [particles] = useState(() =>
    Array.from({ length: 14 }, (_, index) => ({
      x: Math.cos((index / 14) * Math.PI * 2) * (36 + (index % 4) * 14),
      y: Math.sin((index / 14) * Math.PI * 2) * (30 + (index % 3) * 12),
      color: ["var(--yellow)", "var(--blue)", "var(--red)", "var(--green)"][index % 4]
    }))
  );

  return (
    <div className="completion-burst" aria-hidden="true">
      <motion.span
        className="xp-burst"
        initial={{ opacity: 0, y: 6, scale: 0.7 }}
        animate={{ opacity: [0, 1, 1, 0], y: [-4, -26, -34, -44], scale: 1 }}
        transition={{ duration: 1.5, times: [0, 0.15, 0.75, 1], ease: "easeOut" }}
      >
        +{task.xp} XP
      </motion.span>
      {particles.map((particle, index) => (
        <motion.span
          key={index}
          className="burst-particle"
          style={{ backgroundColor: particle.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            x: particle.x,
            y: [0, particle.y - 18, particle.y + 26],
            opacity: [1, 1, 0],
            scale: [0, 1, 0.7],
            rotate: index % 2 ? 180 : -180
          }}
          transition={{ duration: 0.8 + (index % 3) * 0.15, ease: "easeOut", times: [0, 0.45, 1] }}
        />
      ))}
    </div>
  );
}
```
- Lines 96–107:
```tsx
  const [justCompleted, setJustCompleted] = useState(false);
  const wasDoneRef = useRef(task.status === "done");
  const showSubtaskEditor = Boolean(onUpdateTask && (expanded || totalSubtasks === 0));

  useEffect(() => {
    if (task.status === "done" && !wasDoneRef.current) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 2000);
      return () => clearTimeout(timer);
    }
    wasDoneRef.current = task.status === "done";
  }, [task.status]);
```
- Line 139:
```tsx
<AnimatePresence>{justCompleted ? <CompletionBurst task={task} /> : null}</AnimatePresence>
```
- In `apps/web/src/styles.css` lines 1922–1959:
`.completion-burst`, `.burst-particle` (8x8px square with 2px solid ink border), and `.xp-burst` (yellow badge with `+{task.xp} XP`).
- Direct observation:
  1. `CompletionBurst` renders the Inkline neo-brutalist square confetti particles and the `+{task.xp} XP` badge.
  2. `justCompleted` is currently **only** set inside the `useEffect` when `task.status === "done" && !wasDoneRef.current`. It is **not** set synchronously in the button `onClick`.
  3. When a task changes column in `BoardView` (from e.g. "Doing" to "Done"), the card component in the source column is unmounted from the DOM. A new card component is mounted in the `Done` column where `wasDoneRef.current = useRef(task.status === "done")` is initialized to `true`. Thus, `task.status === "done" && !wasDoneRef.current` evaluates to `false` on the newly mounted card.
  4. In mobile `BoardView`, the card unmounts from the active status tab immediately when moved to Done, leaving no visible celebration.

### 1.5 Contract Defined in `PROJECT.md`
In `PROJECT.md`:
- Line 25:
`| 13 | Board View Celebration Trigger | Ensure clicking checkmark button on TaskCard always fires onComplete with XP and confetti bursts | M3 | Survey 2 |`
- Lines 63–72:
```typescript
### `TaskCard` ↔ `BoardView` / `TodayView`
interface TaskCardProps {
  task: Task;
  onComplete?: (task: Task) => void; // Must always be called when completion checkbox is clicked
  onStatusChange?: (taskId: string, status: TaskStatus) => void; // For drag-and-drop or select moves
  onEdit?: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
}
```
- Direct observation: The explicit interface contract in `PROJECT.md` states:
  - `onComplete`: "Must always be called when completion checkbox is clicked"
  - `onStatusChange`: "For drag-and-drop or select moves"

---

## 2. Logic Chain

1. **Contract Inversion (Observation 1.1 vs 1.5)**:
   - `PROJECT.md` dictates that `onComplete` is the designated handler for the checkmark completion button, while `onStatusChange` is reserved for drag-and-drop moves or the footer `<select>` status dropdown.
   - However, `TaskCard.tsx` line 159 checks `if (onStatusChange) { onStatusChange(task.id, "done"); return; }`.
   - Because `BoardView` and `GoalsView` supply `onStatusChange` to enable column moves and footer selects, every checkmark click in those views triggers a status-only move instead of an `onComplete` call.

2. **Celebration Suppression across Column Transitions (Observation 1.2 and 1.4)**:
   - When a task's status changes from `"ready"` / `"doing"` to `"done"` in `BoardView`, React's reconciler moves the task across separate `KanbanColumn` DOM trees.
   - The card in the source column unmounts immediately upon the optimistic update (`useOptimistic`).
   - The card in the destination "Done" column is mounted with `task.status === "done"`.
   - In `TaskCard.tsx`, `wasDoneRef.current` is initialized to `task.status === "done"`, which is `true`. The `useEffect` checking `task.status === "done" && !wasDoneRef.current` evaluates to `false`.
   - Result: The celebration burst is never triggered in the destination column, and the burst in the source column is aborted by unmounting.

3. **Parity Across Planner Views (Observation 1.1, 1.2, 1.3)**:
   - In `TodayView.tsx`, `onStatusChange` is not passed; `onComplete` is called directly.
   - In `CooldownModal.tsx`, `onStatusChange` is not passed; `onComplete` is called directly.
   - In `BoardView.tsx` and `GoalsView.tsx`, `onStatusChange` is passed, causing `onComplete` to be bypassed.
   - To achieve uniform behavior across all views, `TaskCard.tsx` must always call `onComplete?.(task)` when the complete button is clicked, falling back to `onStatusChange?.(task.id, "done")` only if `onComplete` was not provided.

4. **Preserving the Celebration Burst Across Board Transitions**:
   - `TaskCard` must set `localJustCompleted(true)` immediately when the complete button is clicked.
   - In addition, `BoardView` should maintain a `recentlyCompletedIds` state set (holding IDs for ~2000ms).
   - When `onComplete(target)` is called in `BoardView`, `target.id` is added to `recentlyCompletedIds`.
   - `BoardView` passes `justCompleted={recentlyCompletedIds.has(task.id)}` to `SortableQuest` and `TaskCard`.
   - When the task renders in the "Done" column (or when the user switches to "Done" tab on mobile), it receives `justCompleted={true}`, triggering the full `CompletionBurst` with `+{task.xp} XP` and the 14 neo-brutalist square confetti particles.
   - In desktop `BoardView`, wrapping `onComplete` in `handleCompleteTask` also sets the ARIA live announcement `Moved ${target.title} to Done.`, achieving parity with mobile.

---

## 3. Caveats

1. **Synchronous Call Expectation in Tests**:
   - In `apps/web/src/test/e2e-inkline.test.tsx` (e.g. line 1618) and other unit tests, assertions check `expect(onComplete).toHaveBeenCalledWith(...)` synchronously after `fireEvent.click(button)`.
   - `onComplete` must be called synchronously inside `onClick` (not wrapped in `setTimeout`).
2. **Disabled State on Already-Completed Tasks**:
   - When `task.status === "done"`, `.complete-button` is disabled (`disabled={done}`).
   - `handleComplete` must guard with `if (done) return;` so that already-completed tasks do not trigger duplicate bursts or callbacks.
3. **No External Libraries Required**:
   - The app does not use `canvas-confetti` or external animation libraries. The confetti burst is implemented via `motion/react` particles (`burst-particle`) and CSS neo-brutalist square particles in `styles.css`. This is fully compliant with the Inkline Constitution (`docs/ui-ux.md`).
4. **Mobile Single-Tab Viewport**:
   - On mobile screens (<= 1100px), only one status tab is rendered at a time. Completing a task in "Doing" moves it to "Done", removing it from the active tab. The screen reader announcement `Moved ${task.title} to Done.` informs the user, and if the user switches to the "Done" tab within 2 seconds, the celebration burst remains active.

---

## 4. Conclusion & Proposed Code Changes

### Conclusion
Clicking the checkmark button on `TaskCard` in `BoardView` currently bypasses `onComplete` because line 159 of `TaskCard.tsx` intercepts the click with `if (onStatusChange) { onStatusChange(task.id, "done"); return; }`. Furthermore, moving a task across Kanban columns unmounts the card from its source column and mounts a fresh card in the Done column where `wasDoneRef` initializes to `true`, suppressing the celebration burst.

Fixing this requires:
1. Updating `TaskCard.tsx` to prioritize `onComplete?.(task)` on checkmark click, trigger local burst state immediately, and accept an optional `justCompleted?: boolean` prop.
2. Updating `BoardView.tsx` to maintain `recentlyCompletedIds`, route completion through a shared handler that triggers ARIA live announcements and passes `justCompleted` down to `SortableQuest` and `TaskCard`.
3. Updating `App.tsx` to pass `showGameLayer={props.showGameLayer}` to `<BoardView />`.

### Proposed Code Changes

#### Change 1: `apps/web/src/views/TaskCard.tsx`

```diff
--- a/apps/web/src/views/TaskCard.tsx
+++ b/apps/web/src/views/TaskCard.tsx
@@ -23,6 +23,7 @@ type TaskCardProps = {
   goalLabel?: string;
   noteCount?: number;
+  justCompleted?: boolean;
   onComplete?: (task: Task) => void;
   onStatusChange?: (taskId: string, status: TaskStatus) => void;
   onEdit?: (task: Task) => void;
@@ -80,6 +81,7 @@ export function TaskCard({
   showGameLayer = false,
   goalLabel,
   noteCount = 0,
+  justCompleted = false,
   onComplete,
   onStatusChange,
   onEdit,
@@ -95,14 +97,25 @@ export function TaskCard({
   const [expanded, setExpanded] = useState(false);
   const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
-  const [justCompleted, setJustCompleted] = useState(false);
+  const [localJustCompleted, setLocalJustCompleted] = useState(false);
+  const isJustCompleted = justCompleted || localJustCompleted;
   const wasDoneRef = useRef(task.status === "done");
   const showSubtaskEditor = Boolean(onUpdateTask && (expanded || totalSubtasks === 0));
 
   useEffect(() => {
     if (task.status === "done" && !wasDoneRef.current) {
-      setJustCompleted(true);
-      const timer = setTimeout(() => setJustCompleted(false), 2000);
+      setLocalJustCompleted(true);
+      const timer = setTimeout(() => setLocalJustCompleted(false), 2000);
       return () => clearTimeout(timer);
     }
     wasDoneRef.current = task.status === "done";
   }, [task.status]);
+
+  function handleComplete() {
+    if (done) return;
+    setLocalJustCompleted(true);
+    setTimeout(() => setLocalJustCompleted(false), 2000);
+    if (onComplete) {
+      onComplete(task);
+    } else if (onStatusChange) {
+      onStatusChange(task.id, "done");
+    }
+  }
@@ -131,10 +144,10 @@ export function TaskCard({
       style={{ "--project-color": course?.color ?? "var(--ink-faint)" } as CSSProperties}
       layout
       initial={{ opacity: 0, y: 6 }}
-      animate={justCompleted ? { scale: [1, 1.03, 1] } : { opacity: 1, y: 0, scale: 1 }}
-      whileHover={justCompleted ? undefined : { translateX: -2, translateY: -2 }}
-      whileTap={justCompleted ? undefined : { translateX: 2, translateY: 2 }}
+      animate={isJustCompleted ? { scale: [1, 1.03, 1] } : { opacity: 1, y: 0, scale: 1 }}
+      whileHover={isJustCompleted ? undefined : { translateX: -2, translateY: -2 }}
+      whileTap={isJustCompleted ? undefined : { translateX: 2, translateY: 2 }}
       transition={{ type: "spring", stiffness: 380, damping: 28 }}
     >
-      <AnimatePresence>{justCompleted ? <CompletionBurst task={task} /> : null}</AnimatePresence>
+      <AnimatePresence>{isJustCompleted ? <CompletionBurst task={task} /> : null}</AnimatePresence>
 
       <div className="task-card-top">
@@ -156,12 +169,6 @@ export function TaskCard({
           title={done ? "Completed" : "Mark complete"}
           disabled={done}
           onPointerDown={(event) => event.stopPropagation()}
-          onClick={() => {
-            if (onStatusChange) {
-              onStatusChange(task.id, "done");
-              return;
-            }
-            onComplete?.(task);
-          }}
+          onClick={handleComplete}
         >
           <motion.span initial={false} animate={done ? { rotate: [0, -12, 0] } : { rotate: 0 }} transition={{ duration: 0.3 }}>
```

#### Change 2: `apps/web/src/views/BoardView.tsx`

```diff
--- a/apps/web/src/views/BoardView.tsx
+++ b/apps/web/src/views/BoardView.tsx
@@ -23,12 +23,14 @@ export function BoardView({
   onComplete,
   onStatusChange,
   onUpdateTasks,
   onEdit,
   onOpenNotes,
-  onStartFocus
+  onStartFocus,
+  showGameLayer = false
 }: {
   onComplete: (task: Task) => void;
   onStatusChange: (taskId: string, status: TaskStatus) => void;
   /** Persists board moves in one batch; when absent the board falls back to status-only moves. */
   onUpdateTasks?: (updates: Task[]) => void;
   onEdit: (task: Task) => void;
   onOpenNotes?: () => void;
   onStartFocus?: (task: Task) => void;
+  showGameLayer?: boolean;
 }) {
   const { tasks, courses, goals, courseById, noteCountByTask, tags } = usePlanner();
   const { filters, presets, setFilter, applyFilters, applyPreset, clearFilters, saveCurrentPreset } = useFilters();
   const [announcement, setAnnouncement] = useState("");
   const [mobileStatus, setMobileStatus] = useState<TaskStatus>("backlog");
+  const [recentlyCompletedIds, setRecentlyCompletedIds] = useState<Set<string>>(new Set());
   const isMobileBoard = useCompactFilters("(max-width: 1100px)");
   const filteredTasks = applyFilters(tasks, false, false).sort(compareBoardTasks);
 
+  const handleCompleteTask = (target: Task) => {
+    setRecentlyCompletedIds((prev) => new Set(prev).add(target.id));
+    setTimeout(() => {
+      setRecentlyCompletedIds((prev) => {
+        const next = new Set(prev);
+        next.delete(target.id);
+        return next;
+      });
+    }, 2000);
+    onComplete(target);
+    setAnnouncement(`Moved ${target.title} to Done.`);
+  };
+
@@ -165,10 +177,9 @@ export function BoardView({
                   <TaskCard
                     task={task}
                     course={courseById.get(task.courseId ?? "")}
                     compact
+                    showGameLayer={showGameLayer}
                     noteCount={noteCountByTask.get(task.id) ?? 0}
-                    onComplete={(target) => {
-                      onComplete(target);
-                      setAnnouncement(`Moved ${task.title} to Done.`);
-                    }}
+                    justCompleted={recentlyCompletedIds.has(task.id)}
+                    onComplete={handleCompleteTask}
                     onStatusChange={(taskId, status) => {
                       const target = tasks.find((item) => item.id === taskId) ?? task;
                       moveTo(target.id, status);
@@ -200,7 +211,9 @@ export function BoardView({
                         task={task}
                         course={courseById.get(task.courseId ?? "")}
                         noteCount={noteCountByTask.get(task.id) ?? 0}
-                        onComplete={onComplete}
+                        showGameLayer={showGameLayer}
+                        justCompleted={recentlyCompletedIds.has(task.id)}
+                        onComplete={handleCompleteTask}
                         onStatusChange={(taskId, nextStatus) => {
                           const target = tasks.find((item) => item.id === taskId) ?? task;
                           moveTo(target.id, nextStatus);
@@ -254,6 +267,8 @@ function SortableQuest({
   task,
   course,
   noteCount,
+  showGameLayer,
+  justCompleted,
   onComplete,
   onStatusChange,
   onEdit,
@@ -262,6 +277,8 @@ function SortableQuest({
 }: {
   task: Task;
   course?: Course;
   noteCount?: number;
+  showGameLayer?: boolean;
+  justCompleted?: boolean;
   onComplete: (task: Task) => void;
   onStatusChange: (taskId: string, status: TaskStatus) => void;
   onEdit: (task: Task) => void;
@@ -355,6 +372,8 @@ function SortableQuest({
         task={task}
         course={course}
         compact
+        showGameLayer={showGameLayer}
         noteCount={noteCount}
+        justCompleted={justCompleted}
         onComplete={onComplete}
         onStatusChange={onStatusChange}
         onEdit={onEdit}
```

#### Change 3: `apps/web/src/App.tsx`

```diff
--- a/apps/web/src/App.tsx
+++ b/apps/web/src/App.tsx
@@ -453,6 +453,7 @@ function Workspace(props: WorkspaceProps) {
               {props.view === "kanban" ? (
                 <BoardView
+                  showGameLayer={props.showGameLayer}
                   onComplete={(task) => completeTask(task)}
                   onStatusChange={(taskId, status) => void updateTaskStatus(taskId, status)}
                   onUpdateTasks={(updates) => void updateTasks(updates)}
```

---

## 5. Verification Method

### 5.1 Unit and E2E Tests to Add

Add the following assertions to `apps/web/src/test/BoardView.test.tsx`:
```tsx
  it("clicking complete button on TaskCard in BoardView fires onComplete and triggers celebration burst", () => {
    const onComplete = vi.fn();
    const onStatusChange = vi.fn();
    const task = TaskSchema.parse({
      id: "board-complete-1",
      title: "Board Celebration Target",
      status: "ready",
      xp: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    renderWithPlanner(
      <BoardView onComplete={onComplete} onStatusChange={onStatusChange} onEdit={vi.fn()} />,
      {
        planner: {
          tasks: [task],
          courses: []
        }
      }
    );

    const completeBtn = screen.getByRole("button", { name: "Complete Board Celebration Target" });
    fireEvent.click(completeBtn);

    // 1. onComplete must be called with the task
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ id: "board-complete-1" }));

    // 2. onStatusChange must NOT intercept the click
    expect(onStatusChange).not.toHaveBeenCalled();

    // 3. Live announcement must be posted
    expect(screen.getByText("Moved Board Celebration Target to Done.")).toBeInTheDocument();

    // 4. Celebration burst elements must be rendered
    expect(screen.getByText("+30 XP")).toBeInTheDocument();
  });
```

Add the following assertion to `apps/web/src/test/ui-components.test.tsx`:
```tsx
  it("clicking complete button fires onComplete and renders XP confetti burst even when onStatusChange is provided", () => {
    const onComplete = vi.fn();
    const onStatusChange = vi.fn();
    const task = createTask({ title: "Checkmark Burst Task", status: "ready", xp: 45 });

    render(<TaskCard task={task} onComplete={onComplete} onStatusChange={onStatusChange} />);

    const completeBtn = screen.getByRole("button", { name: "Complete Checkmark Burst Task" });
    fireEvent.click(completeBtn);

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ id: task.id }));
    expect(onStatusChange).not.toHaveBeenCalled();
    expect(screen.getByText("+45 XP")).toBeInTheDocument();
  });
```

### 5.2 Verification Commands
1. **Targeted Unit Tests**:
   ```pwsh
   npm run test:unit -- apps/web/src/test/BoardView.test.tsx apps/web/src/test/ui-components.test.tsx
   ```
   *Expected: All tests pass including the new celebration trigger tests.*

2. **Full Test Suite**:
   ```pwsh
   npm run test:unit
   ```
   *Expected: 46 test files, 100% passing.*

3. **Typecheck and Lint**:
   ```pwsh
   npm run typecheck
   npm run lint
   ```
   *Expected: 0 errors.*

4. **Production Build**:
   ```pwsh
   npm run build
   ```
   *Expected: Clean compilation with 0 build errors.*

### 5.3 Invalidation Conditions
The conclusion would be invalidated if:
- Product specifications required `onStatusChange` to be called instead of `onComplete` when checking the completion box in `BoardView` (contradicting `PROJECT.md` line 25 and lines 63–72).
- An external confetti library was required, which would contradict the project's dependency manifest and neo-brutalist CSS architecture.
