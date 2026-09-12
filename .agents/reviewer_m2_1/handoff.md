# Review & Handoff Report: Reviewer M2-1 (Milestone 2: Shell, Navigation & Keyboard Workflows)

**Reviewer**: `reviewer_m2_1`  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Date**: 2026-09-10T12:13:00Z  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\reviewer_m2_1`  
**Review Scope**: Features 7, 8, 9, 10 (`apps/web/src/App.tsx`, `apps/web/src/views/CommandPalette.tsx`, `apps/web/src/ui/dialogA11y.ts`, `apps/web/src/ui/Overlay.tsx`)  

---

## Review Summary

**Verdict**: **APPROVE**  
**Integrity Status**: **PASS** (Zero integrity violations; no hardcoded test shortcuts, facades, or fabricated results detected).  
**Adversarial Risk Assessment**: **LOW** (All 32 edge-case stress scenarios passed).

---

## 1. Observation

Direct inspection of code changes, test suites, and build commands produced the following concrete evidence:

### 1.1 Integrity Audit
- Scanned all modified production files (`App.tsx`, `CommandPalette.tsx`, `dialogA11y.ts`, `Overlay.tsx`):
  - No dummy/facade implementations or stubbed returns.
  - No hardcoded test responses or bypasses.
  - All DOM event handling, URL normalization, and focus trapping mechanisms use genuine production logic.

### 1.2 Feature 7: Global 'N' Shortcut in Goals View (`apps/web/src/App.tsx:284-293`)
- `primaryActionLabel` updated to include `props.view === "goals"`:
  ```typescript
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
- In `handlePrimaryAction`, `onOpenComposer()` is invoked when `primaryActionLabel` is `"New task"`.
- Keyboard listener (`App.tsx:311-348`) checks:
  - Key is `'n'` or `'N'`.
  - Suppressed if modifier keys are pressed (`event.metaKey || event.ctrlKey || event.altKey`).
  - Suppressed if target is inside editable controls (`target?.isContentEditable || target?.closest("input, textarea, select, [contenteditable='true']")`).
  - Suppressed if dialog/modal is open (`commandPaletteOpen || composerOpen || goalOpen || editingGoal || editingTaskId || cooldownTasks.length > 0 || showOnboarding`).
- When on Goals view, the desktop masthead button ("New Task") and mobile primary action button (FAB) render and trigger quick capture instead of remaining hidden or dead affordances.

### 1.3 Feature 8: Command Palette Insights Navigation (`apps/web/src/views/CommandPalette.tsx:4, 48, 165`)
- Imported `ChartLine` from `@phosphor-icons/react`.
- Added `<NavItem icon={<ChartLine size={16} weight="bold" />} label="Go to Insights" onSelect={() => runCommand(() => onNavigate("insights"))} />` to `<Command.Group heading="Navigation">`.
- Added `value={label}` to `Command.Item` inside `NavItem` to enable cmdk text search and keyboard selection.
- Selecting the item executes `runCommand`, which calls `handleOpenChange(false)` (clearing query and closing dialog) and invokes `onNavigate("insights")`.

### 1.4 Feature 9: URL Query View Alias for Today (`apps/web/src/App.tsx:46-68, 669-676`)
- `VALID_VIEWS` array explicitly includes all 8 core views: `"dashboard"`, `"goals"`, `"kanban"`, `"timeline"`, `"notes"`, `"courses"`, `"insights"`, `"settings"`.
- `VIEW_ALIASES` defines `{ today: "dashboard" }`.
- `initialView()` reads `window.location.search`, converts to lowercase, resolves alias `today` -> `dashboard`, and verifies membership in `VALID_VIEWS`.
- `useStateWithUrl` executes mount effect normalizing `/app?view=today` to `/app?view=dashboard` via `window.history.replaceState({}, "", url)`.

### 1.5 Feature 10: Focus Management & Accessibility (`dialogA11y.ts`, `Overlay.tsx`, `CommandPalette.tsx`)
- `useDialogA11y` in `apps/web/src/ui/dialogA11y.ts`:
  - Active trigger tracking via `focusin` event listener while closed, plus `useLayoutEffect` synchronization on open.
  - Initial focus preserves active child elements and explicit `[autofocus]` elements without stealing focus.
  - Strict `FOCUSABLE_SELECTOR` filtering out disabled, hidden, and `tabindex="-1"` elements.
  - Tab trapping wraps cyclically: Shift+Tab on first element wraps to last; Tab on last wraps to first.
  - Escape keydown calls `event.preventDefault()` and `event.stopPropagation()` prior to calling `onClose()`.
  - Focus restoration returns focus to `triggerElementRef.current` on cleanup/unmount, guarded by `document.contains(toRestore)`.
- `Overlay.tsx`:
  - Added `tabIndex={-1}` to `Sheet` and `Modal` panels for fallback container focusing.
  - Backdrop click invokes `onClose()`; content containers stop propagation.
- `CommandPalette.tsx`:
  - Previous active element captured on open and restored on close via `requestAnimationFrame`.
  - Backdrop click dismissal implemented via `onClick={(event) => { if (event.target === event.currentTarget) handleOpenChange(false); }}`.

### 1.6 Verification Tool Outputs
- **Milestone 2 Unit Tests**:
  `npx vitest run apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx`
  -> **3 files passed, 15 tests passed** (0 failures).
- **Challenger Adversarial Stress Suite**:
  `npx vitest run apps/web/src/test/challenger-m2-stress.test.tsx`
  -> **1 file passed, 32 tests passed** (0 failures).
- **Related Inkline E2E Tests**:
  `npx vitest run apps/web/src/test/e2e-inkline.test.tsx -t "T1.41|T1.44|T1.46|T1.47|T1.48|T1.49|T1.50|T4.5"`
  -> **8 passed, 62 skipped** (0 failures).
- **ESLint**:
  `npx eslint apps/web/src/ui/dialogA11y.ts apps/web/src/App.tsx apps/web/src/views/CommandPalette.tsx apps/web/src/ui/Overlay.tsx apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx`
  -> **0 errors, 0 warnings**.
- **Production Build**:
  `npm run build`
  -> **Exit code 0**; `@throughline/push-api`, `@throughline/domain`, and `@throughline/web` (Vite PWA) compiled without errors.

---

## 2. Logic Chain

1. **Feature 7 (Goals 'N' Shortcut)**:
   - Observation 1.2 demonstrates that `primaryActionLabel` evaluates to `"New task"` on Goals view, causing `handlePrimaryAction` to call `onOpenComposer()`.
   - Input guard checks in `App.tsx:319-333` ensure user keystrokes during note-taking or title-editing do not accidentally open composers.
   - Conclusion: Feature 7 is correctly and safely implemented.

2. **Feature 8 (Command Palette Insights Navigation)**:
   - Observation 1.3 demonstrates `NavItem` rendering with `ChartLine` and `value="Go to Insights"`.
   - cmdk filter and arrow navigation can find and select it. Selection invokes `onNavigate("insights")`, matching `AppView` routing to `<InsightsView />`.
   - Conclusion: Feature 8 is correctly implemented without dead affordances.

3. **Feature 9 (URL Query Alias `view=today`)**:
   - Observation 1.4 confirms `VIEW_ALIASES["today"] === "dashboard"`.
   - Calling `replaceState` preserves query string cleanliness and deep-linking compatibility with PWA shortcuts without triggering infinite re-renders or navigation loops.
   - Conclusion: Feature 9 satisfies the spec.

4. **Feature 10 (Dialog A11y & Focus Management)**:
   - Observation 1.5 demonstrates robust focus loop wrapping, trigger element restoration, Escape propagation suppression, and backdrop dismissal.
   - Preserving child `autoFocus` prevents focus thrashing when modal inputs mount.
   - All 32 challenger stress tests and 7 Sheet/CommandPalette tests verify edge cases (e.g. Tab boundary leaks, rapid toggle, Escape unmounts).
   - Conclusion: Feature 10 fulfills WCAG and Inkline UI requirements.

---

## 3. Caveats

1. **Workspace TypeScript Test Stubs**:
   - Running full workspace `npm run typecheck` emits errors exclusively located in `apps/web/src/test/e2e-inkline.test.tsx` (an uncommitted test specification for Milestones 3/4 covering `selectedId`, `onOpenNote`).
   - None of the production code or Milestone 2 tests have any TypeScript errors (`npx tsc -p apps/web/tsconfig.build.json --noEmit` exits with code 0).
   - Production build compiles with exit code 0.

---

## 4. Conclusion

The implementation of Milestone 2 (Features 7, 8, 9, 10) by `worker_m2` has been thoroughly reviewed and stress-tested. The changes strictly conform to the Inkline design system and accessibility guidelines, adhere to the architectural conventions of the Throughline repository, and introduce no regressions or integrity shortcuts.

**Final Verdict**: **APPROVE**

---

## 5. Verification Method

To independently verify these findings, execute the following commands in powershell:

```powershell
# 1. Verify Milestone 2 unit tests (15 passing tests)
npx vitest run apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx

# 2. Verify Challenger M2 stress test suite (32 passing tests)
npx vitest run apps/web/src/test/challenger-m2-stress.test.tsx

# 3. Verify ESLint on all touched files
npx eslint apps/web/src/ui/dialogA11y.ts apps/web/src/App.tsx apps/web/src/views/CommandPalette.tsx apps/web/src/ui/Overlay.tsx apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx

# 4. Verify production build
npm run build
```

### Invalidation Conditions
- If pressing `N` on `/app?view=goals` fails to open the TaskComposer sheet.
- If selecting "Go to Insights" in the Command Palette fails to open the Insights view.
- If `/app?view=today` fails to navigate to the Today view or fails to normalize the URL to `view=dashboard`.
- If focus escapes outside an open dialog or sheet upon pressing Tab.
