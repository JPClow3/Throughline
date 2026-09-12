# Handoff Report: Challenger M2-R2-2 (Stacked Overlay Escape Dismissal)

**Agent**: Challenger M2-R2-2  
**Role**: critic, specialist  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\challenger_m2_r2_2`  
**Milestone**: Milestone 2, Iteration 2 (Stacked Overlay Escape Dismissal)  
**Date**: 2026-09-10T12:32:00Z  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

### 1.1 Direct Test Results for Requested Verifications

1. **Test Suite `apps/web/src/test/challenger-m2-dialog-stress.test.tsx`**:
   - Command: `npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx`
   - Output:
     ```
     RUN  v4.1.9 H:/Code/Pessoais/Throughline
     ✓ apps/web/src/test/challenger-m2-dialog-stress.test.tsx (20 tests) 777ms
     Test Files  1 passed (1)
          Tests  20 passed (20)
     ```
   - **Check 1: ConfirmDialog in Sheet closes only ConfirmDialog on Escape**:
     `STRESS TEST: Nested Modal inside Sheet (e.g. ConfirmDialog in TaskEditor)` (line 370) -> **PASSED** (ConfirmDialog dismissed, Sheet remained open).
   - **Check 2: CommandPalette over Sheet closes only CommandPalette on Escape**:
     `STRESS TEST: CommandPalette opened while Sheet is open, pressing Escape` (line 478) -> **PASSED** (CommandPalette dismissed, Sheet remained open).
   - **Check 3: Stacked Modals close in strict LIFO order on Escape**:
     `STRESS TEST: Stacked Modal on Modal, pressing Escape` (line 523) -> **PASSED** (Modal B dismissed, Modal A remained open).

2. **Consecutive Escape and Multi-Layer Stress Suite `apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx`**:
   Authored and executed 7 comprehensive adversarial tests verifying consecutive Escapes and deep stacking:
   - Command: `npx vitest run apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx`
   - Output:
     ```
     ✓ apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx (7 tests) 543ms
     Test Files  1 passed (1)
          Tests  7 passed (7)
     ```
   - Verified 2-level stacked modals sequential Escape dismissal (B then A).
   - Verified 3-level stacked modals 3 consecutive Escape dismissals in strict LIFO order (C then B then A).
   - Verified ConfirmDialog nested in Sheet consecutive Escapes (ConfirmDialog then Sheet).
   - Verified CommandPalette over Sheet consecutive Escapes (Palette then Sheet).
   - Verified triple mixed stack (CommandPalette over Modal over Sheet) 3 consecutive Escapes.
   - Verified programmatic unmount of intermediate overlay does not corrupt subsequent Escape handling.
   - Verified focus restoration chaining across stacked modals.

3. **Related Regression Suites**:
   - Command: `npx vitest run apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx`
   - Output: 15 passed across 3 test files (0 failures).

4. **Monorepo Build**:
   - Command: `npm run build`
   - Output: Exit code 0 across all workspaces (`@throughline/push-api`, `@throughline/domain`, `@throughline/web`).

### 1.2 Verbatim Empirical Failure Discovered in Peer Harness

When running the full test suite including peer challenger test suite `apps/web/src/test/challenger-m2-r2-overlay.test.tsx`:
- Command: `npx vitest run`
- Output:
  ```
  Test Files  1 failed | 44 passed (45)
       Tests  1 failed | 304 passed (305)
  ```
- Verbatim Failure:
  ```
  FAIL  apps/web/src/test/challenger-m2-r2-overlay.test.tsx > Challenger M2-R2-1: Empirical Stress Harness for Overlay Stack > 4. ADVERSARIAL STRESS TEST: Simultaneous Mount of Nested Overlays (Child Modal inside Sheet) > BUG REPRODUCTION: Simultaneous mount of Child Modal inside Sheet causes Escape deadlock
  AssertionError: expected false to be true // Object.is equality

  - Expected
  + Received

  - true
  + false

   ❯ apps/web/src/test/challenger-m2-r2-overlay.test.tsx:528:32
      526|       // This causes NEITHER to close!
      527|       const childModalClosed = screen.queryByRole("dialog", { name: "Nested Child Modal" }) === null;
      528|       expect(childModalClosed).toBe(true);
         |                                ^
      529|     });
      530|   });
  ```

---

## 2. Logic Chain

1. **The Core Mechanism of `dialogA11y.ts`**:
   In `apps/web/src/ui/dialogA11y.ts:27-70`:
   Each opened dialog registers into module-scoped `dialogStack: DialogStackEntry[]` inside a React `useEffect` hook.
   `isTopmostOverlay(dialogId, panelRef)` determines whether an overlay is topmost by checking:
   - Line 57-65: If `currentPanel.contains(entry.panelRef.current)`, return `false` (underlying container).
   - Line 68-69: `const topEntry = dialogStack[dialogStack.length - 1]; return topEntry?.id === dialogId;`
2. **The Mount Timing Race in Nested Overlays**:
   When a parent Sheet and a child Modal are mounted simultaneously (e.g. initial view load with dialog open, or batch state updates where both `sheetOpen` and `childOpen` are true):
   React executes child `useEffect` hooks *before* parent `useEffect` hooks (bottom-up execution).
   - Child Modal runs its `useEffect` first and calls `dialogStack.push(childEntry)`.
   - Parent Sheet runs its `useEffect` second and calls `dialogStack.push(sheetEntry)`.
   - As a result, `dialogStack` is populated as: `[ChildModal, ParentSheet]`.
3. **The Deadlock Condition on Escape**:
   When the user presses `Escape`:
   - `ParentSheet` checks `isTopmostOverlay`: Because `parentSheetPanel.contains(childModalPanel)` is `true`, line 61 returns `false`. `ParentSheet` ignores the `Escape` key.
   - `ChildModal` checks `isTopmostOverlay`: `childModalPanel` does not contain `parentSheetPanel`. However, line 68 inspects `dialogStack[dialogStack.length - 1]`, which is `ParentSheet`! Because `ParentSheet.id !== ChildModal.id`, line 69 returns `false`. `ChildModal` also ignores the `Escape` key!
4. **Blast Radius**:
   Neither dialog handles the `Escape` key. The user is locked into the dialog and pressing `Escape` produces zero effect.
5. **Conclusion**:
   Because `apps/web/src/test/challenger-m2-r2-overlay.test.tsx` fails Vitest with an active regression deadlock and causes `npx vitest run` to fail with exit code 1, the implementation cannot be approved until this deadlock is resolved.

---

## 3. Caveats

- In sequential user interactions where the user first opens a Sheet, and then clicks a button inside the Sheet to open a ConfirmDialog, React executes the ConfirmDialog's `useEffect` after the Sheet, placing ConfirmDialog at the top of `dialogStack`. In this specific sequential order, all 20 tests in `challenger-m2-dialog-stress.test.tsx` and all 7 tests in `challenger-m2-lifo-consecutive-stress.test.tsx` pass without issue.
- The defect is triggered specifically when nested overlays mount simultaneously (e.g., initial state or concurrent render), causing inverse stack registration.

---

## 4. Conclusion & Required Changes

**Verdict**: **REQUEST_CHANGES**

Worker M2-R2 did resolve the initial FIFO double-dismissal bug for sequentially opened overlays, and all 20 tests in `challenger-m2-dialog-stress.test.tsx` pass.
However, an Escape deadlock exists when nested overlays mount simultaneously because `dialogStack[dialogStack.length - 1]` does not filter out ancestor containers before checking the topmost entry.

### Required Fix for Worker M2-R2
In `apps/web/src/ui/dialogA11y.ts`, filter out any dialog entries that contain other active entries before checking the top candidate:

```typescript
export function isTopmostOverlay(dialogId: string, panelRef: RefObject<HTMLElement | null>): boolean {
  if (typeof document !== "undefined") {
    // If CommandPalette is open, it takes precedence (z-[120]) over standard sheets and modals
    const palette = document.querySelector(".palette-backdrop");
    if (palette && !panelRef.current?.closest(".palette-backdrop")) {
      return false;
    }
  }

  purgeDisconnectedEntries();

  if (dialogStack.length === 0) {
    return true;
  }

  // Filter out any entries that contain other active entries (they are underlying parent containers)
  const candidateEntries = dialogStack.filter((entry) => {
    const el = entry.panelRef.current;
    if (!el) return false;
    return !dialogStack.some(
      (other) => other !== entry && other.panelRef.current && el.contains(other.panelRef.current)
    );
  });

  if (candidateEntries.length === 0) {
    return false;
  }

  // Topmost overlay is the latest candidate in LIFO order
  const topEntry = candidateEntries[candidateEntries.length - 1];
  return topEntry?.id === dialogId;
}
```

This ensures that even if `ParentSheet` was pushed to `dialogStack` after `ChildModal`, `ParentSheet` is eliminated from `candidateEntries` because its DOM panel contains `ChildModal`. `ChildModal` becomes the topmost candidate, dismisses immediately on `Escape`, and `ParentSheet` dismisses cleanly on the subsequent `Escape`.

---

## 5. Verification Method

To independently verify:
```powershell
# 1. Run the previously failing test in challenger-m2-r2-overlay.test.tsx
npx vitest run apps/web/src/test/challenger-m2-r2-overlay.test.tsx -t "Simultaneous mount"

# 2. Run all dialog stress test suites together
npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx apps/web/src/test/challenger-m2-r2-overlay.test.tsx

# 3. Run the complete monorepo Vitest test suite (Target: 45 test files passed, 305 tests passed, 0 failures)
npx vitest run

# 4. Run build verification
npm run build
```

### Invalidation Conditions
The REQUEST_CHANGES verdict will be satisfied and can be flipped to APPROVE once:
- `apps/web/src/test/challenger-m2-r2-overlay.test.tsx` passes completely (10 out of 10 tests passed).
- All 37 tests across `challenger-m2-dialog-stress.test.tsx`, `challenger-m2-lifo-consecutive-stress.test.tsx`, and `challenger-m2-r2-overlay.test.tsx` pass.
- `npx vitest run` passes 100% across all 45 test files in the monorepo.
