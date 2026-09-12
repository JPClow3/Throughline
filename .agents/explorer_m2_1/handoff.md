# Handoff Report: Explorer M2-1 (Shortcuts & URL Aliases)

**Date**: 2026-09-10  
**Subagent**: `explorer_m2_1`  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee`  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\explorer_m2_1`  
**Scope**:
1. Feature 7: Global 'N' keyboard shortcut when active view is 'goals'.
2. Feature 9: URL query view alias 'view=today'.

---

## 1. Observation

Direct code examination and execution within the repository revealed the following verbatim facts:

### 1.1 Global Keyboard Event Capture (`apps/web/src/App.tsx:289-326`)
In `apps/web/src/App.tsx`, keyboard events for shortcut `'N'` are captured at the root application level via a `document` event listener:
```typescript
289:   // Quick capture: `N` opens the composer (or a new note on Notes) from any
290:   // planner view, unless the user is typing or a dialog already owns the screen.
291:   React.useEffect(() => {
292:     const onKeyDown = (event: KeyboardEvent) => {
293:       if (event.key !== "n" && event.key !== "N") {
294:         return;
295:       }
296:       if (event.metaKey || event.ctrlKey || event.altKey) {
297:         return;
298:       }
299:       const target = event.target as HTMLElement | null;
300:       if (target?.isContentEditable || target?.closest("input, textarea, select, [contenteditable='true']")) {
301:         return;
302:       }
303:       const dialogOpen =
304:         props.commandPaletteOpen ||
305:         props.composerOpen ||
306:         props.goalOpen ||
307:         Boolean(props.editingGoal) ||
308:         Boolean(props.editingTaskId) ||
309:         props.cooldownTasks.length > 0 ||
310:         props.showOnboarding;
311:       if (dialogOpen) {
312:         return;
313:       }
314:       event.preventDefault();
315:       void handlePrimaryAction();
316:     };
317:     document.addEventListener("keydown", onKeyDown);
318:     return () => document.removeEventListener("keydown", onKeyDown);
319:   }, [ ... ]);
```

### 1.2 Primary Action Handling & Root Cause of 'N' Inactivity in Goals (`apps/web/src/App.tsx:266-285`)
When `'N'` is pressed and not suppressed by an input or open dialog, line 315 calls `void handlePrimaryAction()`.
Tracing `handlePrimaryAction` and `primaryActionLabel`:
```typescript
266:   const primaryActionLabel =
267:     props.view === "notes"
268:       ? "New note"
269:       : props.view === "dashboard" || props.view === "kanban" || props.view === "timeline" || props.view === "courses"
270:         ? "New task"
271:         : undefined;
272: 
273:   const { view, setSelectedNoteId, setView, onOpenComposer } = props;
274: 
275:   const handlePrimaryAction = React.useCallback(async () => {
276:     if (view === "notes") {
277:       const note = await addNote({});
278:       setSelectedNoteId(note.id);
279:       setView("notes");
280:       return;
281:     }
282:     if (primaryActionLabel) {
283:       onOpenComposer();
284:     }
285:   }, [view, addNote, primaryActionLabel, setSelectedNoteId, setView, onOpenComposer]);
```
- In line 269, `props.view === "goals"` is **omitted**.
- When `props.view === "goals"`, `primaryActionLabel` evaluates to `undefined`.
- In `handlePrimaryAction`:
  - `view === "notes"` is `false`.
  - `primaryActionLabel` is `undefined`, so `if (primaryActionLabel)` is `false`.
  - The function returns immediately with zero side-effects.
  - However, line 314 already executed `event.preventDefault()`, intercepting the keypress while doing nothing.

### 1.3 Collateral Dead Affordances in Shell Chrome (`apps/web/src/shell/AppShell.tsx`)
Because `primaryActionLabel` is `undefined` on `"goals"`, two UI elements in `AppShell` are affected:
1. **Desktop Masthead New Task Button** (`AppShell.tsx:334-341`):
   ```typescript
   333: {onNewTask ? (
   334:   <button
   335:     type="button"
   336:     className="btn btn-accent btn-sm hidden lg:inline-flex"
   337:     onClick={onNewTask}
   338:   >
   339:     <Plus size={15} weight="bold" />
   340:     New Task
   341:   </button>
   342: ) : null}
   ```
   `onNewTask` is passed from `App.tsx:410` as `onNewTask={() => void handlePrimaryAction()}`. Because `handlePrimaryAction()` is a no-op on `"goals"`, this button is a **dead affordance** on desktop when viewing Goals.
2. **Mobile Floating Action Button** (`AppShell.tsx:373-382`):
   ```typescript
   373: {primaryActionLabel && onNewTask ? (
   374:   <button
   375:     type="button"
   376:     onClick={onNewTask}
   377:     className="shell-mobile-primary-action"
   378:     aria-label={primaryActionLabel}
   379:   >
   380:     <Plus size={24} weight="bold" />
   381:   </button>
   382: ) : null}
   ```
   Because `primaryActionLabel` is `undefined`, the primary mobile FAB is not rendered at all on Goals view.

### 1.4 GoalsView Affordances & GoalComposer (`apps/web/src/views/GoalsView.tsx` & `App.tsx`)
In `apps/web/src/views/GoalsView.tsx`:
- No `keydown` listeners exist for shortcut `'N'`.
- Dedicated "New goal" buttons exist:
  - Header button at lines 84-86: `<Button variant="accent" onClick={onNewGoal}><Plus size={16} weight="bold" /> New goal</Button>`.
  - Empty state button at lines 127-130: `<Button variant="primary" onClick={onNewGoal}><Plus size={15} weight="bold" /> New goal</Button>`.
- In `App.tsx:456`, `GoalsView` binds `onNewGoal={() => props.setGoalOpen(true)}`, which opens `<Sheet open={props.goalOpen} title="New goal" ...><GoalComposer ... /></Sheet>` (`App.tsx:541-551`).
- In `TaskComposer.tsx` (`apps/web/src/views/TaskComposer.tsx:15, 29, 69, 137-147`): `TaskComposer` accepts `goals={goals}` and includes a `<Select label="Goal">` field, allowing tasks to be directly assigned to existing goals during quick capture.

### 1.5 Expectations in `docs/ui-ux.md`, `PROJECT.md`, and `e2e-inkline.test.tsx`
1. `docs/ui-ux.md:66` (Section 8.1):
   > "1. **Quick Capture:** Fast, keyboard-accessible sheet with minimal required fields (Title; Project/Due up front; Details collapsed). Pressing `N` in any planner view opens it (new note on Notes)."
2. `PROJECT.md:19` (Feature 7):
   > "Allow 'N' keyboard shortcut to open composer or create goal/task when active view is `goals`"
3. `apps/web/src/test/e2e-inkline.test.tsx`:
   - `T1.41` (lines 908–920):
     ```typescript
     it("T1.41: presses 'N' to open task composer from planner views", async () => {
       await saveAppearanceSettings({ hasCompletedOnboarding: true });
       render(<AuthProvider><App /></AuthProvider>);
       await screen.findAllByRole("link", { name: "Today" });
       fireEvent.keyDown(document.body, { key: "n" });
       expect(await screen.findByText("New task")).toBeInTheDocument();
     });
     ```
   - `T1.42` (lines 922–938): Verifies `'N'` in `view=notes` creates a new note.
   - `T1.45` (lines 972–984): Verifies `primaryActionLabel` dynamically switches on `notes` ("New note").
   - `T1.20` (lines 499–525): Verifies clicking "New goal" button triggers `onNewGoal`.
   - Currently, `e2e-inkline.test.tsx` does not have a dedicated test triggering `fireEvent.keyDown(document.body, { key: "n" })` on `/app?view=goals`. However, `T1.41`'s premise specifies opening task composer ("New task") from planner views.

### 1.6 URL Search Parameter Parsing & 'view=today' Alias (`apps/web/src/App.tsx:46-51, 644-655` & `vite.config.ts:175`)
In `apps/web/src/App.tsx`:
```typescript
46: function initialView(): AppView {
47:   const params = new URLSearchParams(window.location.search);
48:   const view = params.get("view");
49:   const views: AppView[] = ["goals", "kanban", "timeline", "notes", "courses", "insights", "settings"];
50:   return views.includes(view as AppView) ? (view as AppView) : "dashboard";
51: }
```
In `apps/web/src/App.tsx:644-655`:
```typescript
644: function useStateWithUrl(initializer: () => AppView): [AppView, (view: AppView) => void] {
645:   const [view, setView] = React.useState<AppView>(initializer);
646: 
647:   const update = React.useCallback((next: AppView) => {
648:     setView(next);
649:     const url = new URL(window.location.href);
650:     url.searchParams.set("view", next);
651:     window.history.replaceState({}, "", url);
652:   }, []);
653: 
654:   return [view, update];
655: }
```
In `apps/web/vite.config.ts:170-177`:
```typescript
170:   shortcuts: [
171:     {
172:       name: "Today",
173:       short_name: "Today",
174:       description: "Open the daily dashboard.",
175:       url: "/app?view=today",
176:       icons: [{ src: "/pwa-icon.svg", sizes: "any", type: "image/svg+xml" }]
177:     },
```
Findings:
1. `views` at line 49 does not contain `"dashboard"` or `"today"`.
2. When the user navigates to `/app?view=today`:
   - `params.get("view")` returns `"today"`.
   - `views.includes("today" as AppView)` evaluates to `false`.
   - The fallback `: "dashboard"` is executed, returning `"dashboard"`.
3. When the user navigates to `/app?view=dashboard`:
   - `views.includes("dashboard" as AppView)` ALSO evaluates to `false`.
   - The fallback `: "dashboard"` is executed.
4. When the user enters an invalid query like `/app?view=foobar`:
   - It also evaluates to `false` and falls back to `"dashboard"`.
5. URL State:
   - `useStateWithUrl` only updates the URL when `update(next)` is invoked during user-driven view transitions.
   - On initial load with `/app?view=today`, the URL search parameter remains `?view=today` in the address bar. It is never normalized or canonicalized to `?view=dashboard`.

---

## 2. Logic Chain

1. **Premise 1 (Quick Capture Design Contract)**: `docs/ui-ux.md:66` dictates that pressing `N` in *any planner view* opens Quick Capture (the task composer sheet), with the solitary exception of `notes` (which creates a note).
2. **Premise 2 (Feature 7 Defect)**: In `App.tsx:269`, `"goals"` was omitted from the list of views for which `primaryActionLabel = "New task"`. Consequently:
   - `primaryActionLabel` is `undefined`.
   - `handlePrimaryAction()` evaluates `if (primaryActionLabel)` to `false` and aborts.
   - The global `keydown` listener intercepts `N`, calls `event.preventDefault()`, and executes the no-op `handlePrimaryAction()`.
   - In addition, the desktop masthead button "New Task" (`AppShell.tsx:334`) becomes dead, and the mobile FAB (`AppShell.tsx:373`) fails to render.
3. **Premise 3 (Composer Target Resolution)**:
   - *Should 'N' open TaskComposer or GoalComposer?*
     - If it opened `GoalComposer`: The desktop masthead button (labeled "New Task") would open "New goal", violating visual honesty (`docs/ui-ux.md:49`), and conflicting with `docs/ui-ux.md:66` (which limits specialized 'N' behavior strictly to Notes).
     - If it opens `TaskComposer`: It satisfies `docs/ui-ux.md:66`, aligns with the desktop masthead "New Task" label, allows users on the Goals view to quick-capture tasks and optionally assign them to a goal via `TaskComposer`'s goal dropdown, and enables the mobile FAB button with `aria-label="New task"`.
     - Therefore, `TaskComposer` ("New task") is the primary specification-compliant behavior.
4. **Premise 4 (Feature 9 Alias Defect)**:
   - The PWA manifest shortcut in `vite.config.ts:175` explicitly uses `/app?view=today`.
   - Currently, `/app?view=today` resolves to `"dashboard"` purely through the default fallback of an unrecognized string, not through an intentional alias mapping.
   - `"dashboard"` is not even present in the recognized `views` list (`App.tsx:49`).
   - The URL search query remains `view=today` without canonicalization to `view=dashboard`.
5. **Premise 5 (Resolution for Feature 9)**:
   - Defining an explicit alias dictionary (`const VIEW_ALIASES: Record<string, AppView> = { today: "dashboard" };`) and including `"dashboard"` in the valid views array provides semantic clarity, defensive robustness against future fallback alterations, and clean canonicalization.

---

## 3. Caveats

1. **Alternative GoalComposer Interpretation**: Although `docs/ui-ux.md:66` specifies that Quick Capture opens `TaskComposer` in all planner views except Notes, some team members might consider whether `N` could open `GoalComposer` when on Goals view (by analogy with Notes). If that behavior is desired by the orchestrator:
   - `primaryActionLabel` on `goals` would be `"New goal"`.
   - `handlePrimaryAction` would call `props.setGoalOpen(true)`.
   - Note: The desktop masthead button would need to dynamically display `primaryActionLabel ?? "New Task"` instead of hardcoding "New Task". Both options are provided with concrete code below.
2. **Read-Only Investigation**: As an Explorer, no production code in `apps/web/src` was modified during this turn.
3. **URL Normalization**: Normalizing `/app?view=today` to `/app?view=dashboard` via `window.history.replaceState` during initialization changes `window.location.search`. This is beneficial for URL consistency, but tests asserting that the initial URL string remains verbatim `?view=today` should be aware of this replacement.

---

## 4. Conclusion & Recommended Implementation

### 4.1 Feature 7: Enable 'N' Shortcut in Goals View (`apps/web/src/App.tsx`)

#### Recommended Solution (Conforms to `docs/ui-ux.md:66` & Desktop Shell):
In `apps/web/src/App.tsx`, add `props.view === "goals"` to `primaryActionLabel`:

```tsx
// apps/web/src/App.tsx:266-271
const primaryActionLabel =
  props.view === "notes"
    ? "New note"
    : props.view === "dashboard" ||
      props.view === "kanban" ||
      props.view === "timeline" ||
      props.view === "courses" ||
      props.view === "goals"
      ? "New task"
      : undefined;
```

**Effects**:
1. Pressing `N` on `/app?view=goals` immediately opens `TaskComposer` ("New task").
2. Clicking "New Task" in the desktop masthead while on Goals view opens `TaskComposer`.
3. Mobile FAB button renders on Goals view with `aria-label="New task"` and opens `TaskComposer`.

#### Alternative Solution (If Orchestrator prefers GoalComposer on Goals):
If the team prefers `N` on Goals to open `GoalComposer`:
```tsx
// In App.tsx:266-285
const primaryActionLabel =
  props.view === "notes"
    ? "New note"
    : props.view === "goals"
      ? "New goal"
      : props.view === "dashboard" || props.view === "kanban" || props.view === "timeline" || props.view === "courses"
        ? "New task"
        : undefined;

const handlePrimaryAction = React.useCallback(async () => {
  if (view === "notes") {
    const note = await addNote({});
    setSelectedNoteId(note.id);
    setView("notes");
    return;
  }
  if (view === "goals") {
    props.setGoalOpen(true);
    return;
  }
  if (primaryActionLabel) {
    onOpenComposer();
  }
}, [view, addNote, primaryActionLabel, setSelectedNoteId, setView, onOpenComposer, props.setGoalOpen]);
```
And in `AppShell.tsx:340`, change the desktop button label from hardcoded `New Task` to `{primaryActionLabel ?? "New Task"}`.

---

### 4.2 Feature 9: URL Query View Alias for Today (`apps/web/src/App.tsx`)

In `apps/web/src/App.tsx`, update view validation, alias mapping, and `initialView()`:

```tsx
// apps/web/src/App.tsx:46-55
const VALID_VIEWS: AppView[] = [
  "dashboard",
  "goals",
  "kanban",
  "timeline",
  "notes",
  "courses",
  "insights",
  "settings"
];

const VIEW_ALIASES: Record<string, AppView> = {
  today: "dashboard"
};

function initialView(): AppView {
  const params = new URLSearchParams(window.location.search);
  const rawView = params.get("view")?.toLowerCase();
  if (!rawView) {
    return "dashboard";
  }
  const resolved = VIEW_ALIASES[rawView] ?? (rawView as AppView);
  return VALID_VIEWS.includes(resolved) ? resolved : "dashboard";
}
```

Optional URL normalization inside `useStateWithUrl`:
```tsx
// apps/web/src/App.tsx:644-655
function useStateWithUrl(initializer: () => AppView): [AppView, (view: AppView) => void] {
  const [view, setView] = React.useState<AppView>(initializer);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    const currentParam = url.searchParams.get("view");
    if (currentParam && VIEW_ALIASES[currentParam.toLowerCase()]) {
      url.searchParams.set("view", VIEW_ALIASES[currentParam.toLowerCase()]);
      window.history.replaceState({}, "", url);
    }
  }, []);

  const update = React.useCallback((next: AppView) => {
    setView(next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", next);
    window.history.replaceState({}, "", url);
  }, []);

  return [view, update];
}
```

---

## 5. Verification Method

### 5.1 Verifying Feature 7 (Global 'N' in Goals View)
1. **Source Inspection**:
   - Check `apps/web/src/App.tsx` lines 266–271 to ensure `props.view === "goals"` maps to `"New task"`.
2. **Automated Vitest Test**:
   Add a test in `apps/web/src/test/e2e-inkline.test.tsx` (or `App.test.tsx`):
   ```typescript
   it("presses 'N' in goals view to open task composer", async () => {
     await saveAppearanceSettings({ hasCompletedOnboarding: true });
     window.history.replaceState({}, "", "/app?view=goals");
     render(
       <AuthProvider>
         <App />
       </AuthProvider>
     );
     await screen.findByRole("heading", { name: "Goals" });
     fireEvent.keyDown(document.body, { key: "n" });
     expect(await screen.findByRole("heading", { name: "New task" })).toBeInTheDocument();
   });
   ```
   Run:
   ```powershell
   npx vitest run apps/web/src/test/e2e-inkline.test.tsx -t "T1.41|goals"
   ```

### 5.2 Verifying Feature 9 (URL Query Alias `view=today`)
1. **Source Inspection**:
   - Inspect `apps/web/src/App.tsx` lines 46–55 to verify `VIEW_ALIASES` maps `"today"` to `"dashboard"`, and `VALID_VIEWS` includes `"dashboard"`.
2. **Automated Vitest Test**:
   Add a test in `apps/web/src/test/App.test.tsx`:
   ```typescript
   it("resolves view=today query alias to dashboard view", async () => {
     window.history.replaceState({}, "", "/app?view=today");
     render(
       <AuthProvider>
         <App />
       </AuthProvider>
     );
     const todayTab = await screen.findByRole("link", { name: "Today" });
     expect(todayTab).toHaveAttribute("aria-current", "page");
   });
   ```
   Run:
   ```powershell
   npx vitest run apps/web/src/test/App.test.tsx
   ```

### 5.3 Invalidation Conditions
- If pressing `N` in Goals view fails to open a sheet, or throws an unhandled error.
- If loading `/app?view=today` fails to activate the Today dashboard tab with `aria-current="page"`.
- If `npm run typecheck`, `npm run lint`, or `npm run test` fail.
