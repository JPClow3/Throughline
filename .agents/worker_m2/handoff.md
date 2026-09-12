# Handoff Report: Worker M2 (Milestone 2: Shell, Navigation & Keyboard Workflows)

**Worker**: `worker_m2`  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Date**: 2026-09-10T12:05:30Z  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\worker_m2`  
**Scope**: Features 7, 8, 9, 10

---

## 1. Observation

Direct code examination and execution within the repository revealed the following baseline facts and post-implementation results:

### 1.1 Feature 7: 'N' Shortcut in Goals View (`apps/web/src/App.tsx:284-292`)
- **Baseline Observation**:
  ```typescript
  const primaryActionLabel =
    props.view === "notes"
      ? "New note"
      : props.view === "dashboard" || props.view === "kanban" || props.view === "timeline" || props.view === "courses"
        ? "New task"
        : undefined;
  ```
  `props.view === "goals"` was missing from the check. When on Goals view, `primaryActionLabel` evaluated to `undefined`.
  In `handlePrimaryAction`:
  ```typescript
  if (primaryActionLabel) {
    onOpenComposer();
  }
  ```
  Because `primaryActionLabel` was `undefined`, `onOpenComposer()` was never called. Pressing `N` ran `event.preventDefault()` but did nothing. The desktop masthead button was a dead affordance and mobile FAB was not rendered.
- **Applied Change**:
  Included `props.view === "goals"` alongside `"dashboard"`, `"kanban"`, `"timeline"`, and `"courses"` to evaluate to `"New task"`.

### 1.2 Feature 8: Command Palette Insights Navigation (`apps/web/src/views/CommandPalette.tsx:165`)
- **Baseline Observation**:
  `CommandPalette.tsx` lines 128–136 rendered 7 navigation items ("Go to Today", "Go to Goals", "Go to Board", "Go to Timeline", "Go to Notes", "Go to Projects", "Settings"), but completely omitted "Go to Insights".
  `ChartLine` from `@phosphor-icons/react` was not imported.
- **Applied Change**:
  - Imported `ChartLine` from `@phosphor-icons/react`.
  - Added `<NavItem icon={<ChartLine size={16} weight="bold" />} label="Go to Insights" onSelect={() => runCommand(() => onNavigate("insights"))} />` to `<Command.Group heading="Navigation">`.
  - Added `value={label}` to `Command.Item` in `NavItem`.
  - Added test coverage in `apps/web/src/test/CommandPalette.test.tsx` asserting selection of "Go to Insights" triggers `onNavigate("insights")` and closes the palette.

### 1.3 Feature 9: URL Query View Alias for Today (`apps/web/src/App.tsx:46-68`)
- **Baseline Observation**:
  `initialView()` defined `const views: AppView[] = ["goals", "kanban", "timeline", "notes", "courses", "insights", "settings"];`. `"dashboard"` and `"today"` were missing from the array, relying on an implicit fallback.
  Navigating to `/app?view=today` left `view=today` un-normalized in the browser address bar.
- **Applied Change**:
  - Defined `VALID_VIEWS: AppView[] = ["dashboard", "goals", "kanban", "timeline", "notes", "courses", "insights", "settings"]`.
  - Defined `VIEW_ALIASES: Record<string, AppView> = { today: "dashboard" }`.
  - Updated `initialView()` to resolve lowercase aliases and validate against `VALID_VIEWS`.
  - Updated `useStateWithUrl` with a mount `useEffect` to canonicalize `/app?view=today` to `/app?view=dashboard` via `window.history.replaceState`.
  - Added tests in `apps/web/src/test/App.test.tsx` verifying alias resolution, tab activation, and URL canonicalization.

### 1.4 Feature 10: Dialog Accessibility & Focus Management (`dialogA11y.ts`, `Overlay.tsx`, `CommandPalette.tsx`)
- **Baseline Observation**:
  - In `dialogA11y.ts`, `previouslyFocused` was captured during `useEffect`, by which time inner autofocus inputs had already mounted and received focus, resulting in `previouslyFocused` referencing the unmounting inner input rather than the opening trigger.
  - Initial focus timeout in `dialogA11y.ts` always focused `focusables[0]` (the Close button), stealing focus from inputs with `autoFocus` (like `TaskComposer`).
  - Escape key handling in `dialogA11y.ts` called `onClose()` without `event.preventDefault()` or `event.stopPropagation()`, bubbling to parent listeners.
  - Focus trapping matched `[tabindex="-1"]` and `aria-hidden="true"` elements.
  - In `CommandPalette.tsx`, clicks on the backdrop did not dismiss the palette because `Command.Dialog` rendered inside Radix dialog content without a backdrop click handler, and focus was not restored to the trigger element on close.
- **Applied Change**:
  - Rewrote `useDialogA11y` in `apps/web/src/ui/dialogA11y.ts`:
    - Strict `FOCUSABLE_SELECTOR` excluding `[tabindex="-1"]`, `[aria-hidden="true"]`, and `[disabled]`.
    - Tracks active trigger elements via `focusin` listener and `useLayoutEffect` while dialog is closed or opening.
    - Initial focus preserves active child elements and explicit `[autofocus]` elements without stealing focus.
    - Focus restoration safely returns focus to `triggerElementRef.current` upon close/unmount.
    - Escape keydown calls `event.preventDefault()` and `event.stopPropagation()` before invoking `onClose()`.
    - Tab and Shift+Tab wrap focus strictly between first and last focusable elements.
  - In `apps/web/src/ui/Overlay.tsx`, added `tabIndex={-1}` to `Sheet` and `Modal` panels for accessible fallback container focusing.
  - In `apps/web/src/views/CommandPalette.tsx`, added `previousActiveElementRef` to track and restore trigger focus on close, added backdrop click dismissal (`onClick` checking `event.target === event.currentTarget`), and query reset on close.
  - Enhanced `apps/web/src/test/Sheet.test.tsx` and `apps/web/src/test/CommandPalette.test.tsx` with dedicated tests for Tab wrapping, Escape restoration, autofocus preservation, and backdrop dismissal.

---

## 2. Logic Chain

1. **Feature 7 (Goals 'N' Quick Capture)**:
   - `docs/ui-ux.md:66` specifies that 'N' opens Quick Capture from any planner view (notes creates a note).
   - In `App.tsx`, `handlePrimaryAction` checks `primaryActionLabel`.
   - By adding `props.view === "goals"` to `primaryActionLabel`, pressing 'N' on `/app?view=goals` executes `onOpenComposer()`.
   - Collaterally, the desktop masthead button ("New Task") and mobile primary action button now correctly render and trigger quick capture on the Goals view.

2. **Feature 8 (Command Palette Insights Navigation)**:
   - `AppView` includes `"insights"`, and `App.tsx` routes `"insights"` to `<InsightsView />`.
   - In `CommandPalette.tsx`, `onNavigate("insights")` was missing from the Navigation group.
   - Adding `NavItem` with `ChartLine` and `weight="bold"` matches the Phosphor icon system used in `AppShell.tsx`.
   - Adding `value={label}` allows `cmdk` item filtering and arrow navigation to select it cleanly.

3. **Feature 9 (URL Query Alias `view=today`)**:
   - PWA shortcuts in `vite.config.ts` configure `/app?view=today`.
   - Resolving `rawView` against `VIEW_ALIASES` before checking `VALID_VIEWS` ensures predictable routing to `dashboard`.
   - Canonicalizing `view=today` to `view=dashboard` via `replaceState` in `useStateWithUrl` guarantees URL consistency across navigation states.

4. **Feature 10 (Dialog Accessibility & Focus)**:
   - Trapping focus inside dialog panels requires intercepting Tab keydown at boundaries and preventing default browser tabbing.
   - To restore focus to the trigger button without losing it to body or unmounted dialog children, the trigger must be captured before or during mount, and restored on cleanup/close.
   - Preserving `autoFocus` prevents annoying focus jumps to the Close button when a user opens a quick-capture composer.
   - Calling `event.stopPropagation()` on Escape prevents stacked or underlying listeners from erroneously reacting to modal dismissals.

---

## 3. Caveats

1. **Pre-existing Typecheck Errors in Test Stubs**:
   - Running `npm run typecheck` across the entire workspace reports errors exclusively located in `apps/web/src/test/e2e-inkline.test.tsx` due to incomplete test mocks/types for Milestone 3/4 tasks (`GoalsView` `selectedId`, `onOpenNote`).
   - None of the production files (`App.tsx`, `CommandPalette.tsx`, `dialogA11y.ts`, `Overlay.tsx`) or Milestone 2 test files (`CommandPalette.test.tsx`, `Sheet.test.tsx`, `App.test.tsx`) have any TypeScript errors.
   - `npm run build` succeeds completely (0 errors) using `tsconfig.build.json`.
2. **React 19 Ref Access Rule**:
   - Ref updates must happen within effects or event handlers, not directly in the render body. `onCloseRef.current` assignment was placed inside `useEffect` in `dialogA11y.ts` to strictly satisfy `react-hooks/refs`.

---

## 4. Conclusion

All Milestone 2 requirements are completely implemented and verified:
- **Feature 7**: 'N' shortcut triggers "New task" composer on Goals view.
- **Feature 8**: "Go to Insights" with `ChartLine` icon added to Command Palette with test verification.
- **Feature 9**: `VALID_VIEWS` and `VIEW_ALIASES = { today: "dashboard" }` implemented with clean URL canonicalization.
- **Feature 10**: Robust dialog accessibility (focus trapping, focus restoration, autofocus preservation, Escape stopPropagation, and backdrop dismissal) implemented across `dialogA11y.ts`, `Overlay.tsx`, and `CommandPalette.tsx`.
- All tests pass (15/15 tests in `CommandPalette.test.tsx`, `Sheet.test.tsx`, `App.test.tsx`).
- Production build succeeds without errors.
- ESLint passes with 0 errors on all modified files.

---

## 5. Verification Method

### 5.1 Automated Test Suites
Run the following Vitest commands:

```powershell
# Run all Milestone 2 test suites (15 tests, all pass)
npx vitest run apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx

# Run related E2E Inkline test cases (8 tests, all pass)
npx vitest run apps/web/src/test/e2e-inkline.test.tsx -t "T1.41|T1.44|T1.46|T1.47|T1.48|T1.49|T1.50|T4.5"
```

### 5.2 Linting & Build Verification
```powershell
# ESLint on all modified files (0 errors)
npx eslint apps/web/src/ui/dialogA11y.ts apps/web/src/App.tsx apps/web/src/views/CommandPalette.tsx apps/web/src/ui/Overlay.tsx apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx

# Production Build (succeeds with exit code 0)
npm run build
```

### 5.3 Invalidation Conditions
- If pressing `N` on the Goals view fails to open the TaskComposer sheet.
- If opening Command Palette and selecting "Go to Insights" does not navigate to `/app?view=insights`.
- If loading `/app?view=today` fails to navigate to the Today dashboard or fails to normalize the query param.
- If pressing Tab inside an open `Sheet` leaks focus to background page elements.
- If closing a `Sheet` or `CommandPalette` fails to return focus to the element that triggered it.
