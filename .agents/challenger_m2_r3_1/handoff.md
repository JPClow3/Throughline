# Challenger M2-R3-1 Handoff Report: Empirical Verification of Overlay Stacking & Simultaneous Mount

**Agent**: Challenger M2-R3-1  
**Archetype**: Challenger (Empirical Challenger)  
**Roles**: critic, specialist  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\challenger_m2_r3_1`  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Milestone**: Milestone 2, Iteration 3  
**Verdict**: **APPROVE**  

---

## 1. Observation

### 1.1 Implementation Under Review
File: `apps/web/src/ui/dialogA11y.ts` (lines 53–69)
```typescript
  // Filter out entries that contain other active dialogs (parents cannot be topmost)
  const candidateStack = dialogStack.filter((entry) => {
    const panel = entry.panelRef.current;
    if (!panel) return false;
    return !dialogStack.some(
      (other) => other.id !== entry.id && other.panelRef.current && panel.contains(other.panelRef.current)
    );
  });

  if (candidateStack.length === 0) {
    return true;
  }

  const topEntry = candidateStack[candidateStack.length - 1];
  return topEntry?.id === dialogId;
```

### 1.2 Empirical Execution of Challenger M2-R2 Overlay & M2 Dialog Stress Suites
Command:
```powershell
npx vitest run apps/web/src/test/challenger-m2-r2-overlay.test.tsx apps/web/src/test/challenger-m2-dialog-stress.test.tsx
```
Output:
```
 RUN  v4.1.9 H:/Code/Pessoais/Throughline

 ✓ apps/web/src/test/challenger-m2-r2-overlay.test.tsx (10 tests) 607ms
       ✓ orderly LIFO unstacking across 4 distinct layers on sequential Escape presses  398ms
 ✓ apps/web/src/test/challenger-m2-dialog-stress.test.tsx (20 tests) 829ms

 Test Files  2 passed (2)
      Tests  30 passed (30)
   Start at  09:40:39
   Duration  8.01s (transform 328ms, setup 421ms, import 11.75s, tests 1.44s, environment 1.83s)
```
Exit code: `0`. 10 of 10 tests in `challenger-m2-r2-overlay.test.tsx` passed. 20 of 20 tests in `challenger-m2-dialog-stress.test.tsx` passed.

### 1.3 Empirical Verification of Simultaneous Mount & Consecutive Escape Behavior
In `apps/web/src/test/challenger-m2-r2-overlay.test.tsx` (Test 4: "BUG REPRODUCTION: Simultaneous mount of Child Modal inside Sheet causes Escape deadlock"):
```typescript
      // 1st Escape: Closes Child Modal ONLY, Parent Sheet remains open
      fireEvent.keyDown(document, { key: "Escape" });

      expect(screen.queryByRole("dialog", { name: "Nested Child Modal" })).not.toBeInTheDocument();
      expect(screen.getByText("Parent Sheet")).toBeInTheDocument();

      // 2nd Escape: Closes Parent Sheet
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByText("Parent Sheet")).not.toBeInTheDocument();
```
Both assertions passed without failure.

### 1.4 Empirical Verification of LIFO Consecutive Stress Suite
Command:
```powershell
npx vitest run apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx
```
Output:
```
 ✓ apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx (7 tests) 420ms
 Test Files  1 passed (1)
      Tests  7 passed (7)
```
Exit code: `0`. All 7 consecutive LIFO stress scenarios passed.

### 1.5 Core Overlay and Integration Tests
Command:
```powershell
npx vitest run apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx
```
Output:
```
 ✓ apps/web/src/test/CommandPalette.test.tsx (5 tests) 538ms
 ✓ apps/web/src/test/Sheet.test.tsx (7 tests) 533ms
 ✓ apps/web/src/test/App.test.tsx (3 tests) 797ms
 Test Files  3 passed (3)
      Tests  15 passed (15)
```
Exit code: `0`.

### 1.6 Full Monorepo Vitest Execution
Command:
```powershell
npx vitest run --exclude "**/e2e-inkline.test.tsx"
```
Output:
```
 Test Files  45 passed (45)
      Tests  305 passed (305)
   Duration  44.13s
```
Exit code: `0`. 45 of 45 test files passed, 305 of 305 tests passed.

### 1.7 Monorepo Production Build
Command:
```powershell
npm run build
```
Output:
```
> throughline@0.1.0-beta.1 build
> npm run build --workspaces --if-present

> @throughline/push-api@0.1.0 build
> tsc -p tsconfig.build.json

> @throughline/web@0.1.0 build
> tsc -p tsconfig.build.json && vite build

vite v8.1.0 building client environment for production...
✓ 1334 modules transformed.
✓ built in 830ms
PWA v1.3.0
Building src/sw.ts service worker ("es" format)...
vite v8.1.0 building client environment for production...
✓ built in 95ms
PWA v1.3.0
mode      injectManifest
format:   es
precache  61 entries (1573.52 KiB)
files generated
  dist/sw.js

> @throughline/domain@0.1.0 build
> tsc -p tsconfig.json
```
Exit code: `0`. Production build succeeds without error across all workspaces.

### 1.8 ESLint on Modified File
Command:
```powershell
npx eslint apps/web/src/ui/dialogA11y.ts
```
Output:
Exit code `0` (0 errors, 0 warnings).

---

## 2. Logic Chain

1. **Simultaneous Mount Mechanism (Observation 1.1)**:
   In React, child components mount and execute effects bottom-up before parent components. When `<Modal>` is rendered inside `<Sheet>` on initial mount, `Modal` pushes itself onto `dialogStack` first, followed by `Sheet`. Consequently, `dialogStack` order is `[Modal, Sheet]`.
2. **Deadlock Elimination via Candidate Filtering (Observation 1.1 & 1.3)**:
   The previous logic inspected `dialogStack[dialogStack.length - 1]`, which was `Sheet`. `Sheet` disqualified itself because its DOM panel contained `Modal` (`panel.contains(other)`), and `Modal` disqualified itself because `Sheet.id !== Modal.id`.
   With `candidateStack = dialogStack.filter(...)`, any entry whose DOM panel contains another active overlay (`panel.contains(other.panelRef.current)`) is pruned from candidacy.
   - `Sheet` contains `Modal` -> Pruned.
   - `Modal` does not contain any active overlay -> Retained in `candidateStack`.
   - `candidateStack[candidateStack.length - 1]` evaluates directly to `Modal`.
   - `Modal` returns `true` from `isTopmostOverlay`.
3. **Consecutive Escape Leaf Resolution (Observation 1.3)**:
   - On the 1st Escape keydown, `Modal` intercepts the event, calls `event.stopImmediatePropagation()`, and executes `onClose()`. `Parent Sheet` remains open.
   - When `Modal` unmounts, its cleanup hook splices it from `dialogStack`.
   - On the 2nd Escape keydown, `dialogStack` contains only `Sheet`. `candidateStack` contains `Sheet`. `Sheet` receives the Escape event and closes cleanly.
   - Observed directly in test 4 of `challenger-m2-r2-overlay.test.tsx` (Observation 1.3).
4. **No Regressions (Observations 1.2, 1.4, 1.5, 1.6, 1.7, 1.8)**:
   - All 10 tests in `challenger-m2-r2-overlay.test.tsx` pass.
   - All 20 tests in `challenger-m2-dialog-stress.test.tsx` pass.
   - All 7 tests in `challenger-m2-lifo-consecutive-stress.test.tsx` pass.
   - All 15 tests across core overlay suites pass.
   - Monorepo production build succeeds with exit code 0.
   - ESLint on `dialogA11y.ts` passes with 0 errors.

---

## 3. Caveats

- `e2e-inkline.test.tsx` is an untracked exploratory test file from prior milestones containing mock-type mismatches against current view props; it is excluded from standard Vitest test runs and does not affect the overlay stack or production build (`npm run build` succeeds).

---

## 4. Conclusion

**Verdict: APPROVE**

The simultaneous mount Escape deadlock is completely resolved by Worker M2-R3. The candidate-stack filtering correctly handles both sequential and simultaneous multi-overlay mount configurations. Consecutive Escape dismissals follow strict LIFO order, closing the nested Child Modal first and the parent Sheet second, with clean stack de-registration and zero regressions across all 45 test files (305 tests).

---

## 5. Verification Method

To independently reproduce and verify:

```powershell
# 1. Verify Challenger M2-R2 overlay stress tests (10/10 pass) & M2 dialog stress tests (20/20 pass)
npx vitest run apps/web/src/test/challenger-m2-r2-overlay.test.tsx apps/web/src/test/challenger-m2-dialog-stress.test.tsx

# 2. Verify LIFO consecutive stress suite (7/7 pass)
npx vitest run apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx

# 3. Verify core overlay integration suites (15/15 pass)
npx vitest run apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx

# 4. Verify full test suite
npx vitest run --exclude "**/e2e-inkline.test.tsx"

# 5. Verify production build
npm run build

# 6. Verify ESLint on modified file
npx eslint apps/web/src/ui/dialogA11y.ts
```

Invalidation conditions:
- Any test in `apps/web/src/test/challenger-m2-r2-overlay.test.tsx` or `apps/web/src/test/challenger-m2-dialog-stress.test.tsx` fails.
- Pressing Escape when a child modal is nested in a sheet fails to dismiss the modal, or dismisses both sheet and modal simultaneously.
- `npm run build` fails.
