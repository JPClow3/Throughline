# Challenger M2-R2-1 Handoff Report: Overlay Stack Empirical Stress Test

**Agent**: Challenger M2-R2-1  
**Role**: critic, specialist  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\challenger_m2_r2_1`  
**Milestone**: Milestone 2, Iteration 2 (LIFO Overlay Stack & `isTopmostOverlay` Verification)  
**Date**: 2026-09-10T12:30:30Z  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

### 1.1 Empirical Verification Test Suites
We created an empirical stress test suite in `apps/web/src/test/challenger-m2-r2-overlay.test.tsx` containing 10 stress tests across 4 dimensions:
1. Deeply nested dialogs (4 layers: Sheet -> Modal 1 -> Modal 2 -> CommandPalette).
2. Rapid Escape presses (bursts, single-event stopImmediatePropagation, rapid keydowns without unmount).
3. DOM detachment and unmounting while stacked (intermediate unmounting, abrupt `.remove()` DOM detachment, stack clearance).
4. Adversarial simultaneous mount of nested dialogs.

### 1.2 Verbatim Test Output
Running `npx vitest run apps/web/src/test/challenger-m2-r2-overlay.test.tsx`:

```
 RUN  v4.1.9 H:/Code/Pessoais/Throughline

 ❯ apps/web/src/test/challenger-m2-r2-overlay.test.tsx (10 tests | 1 failed) 400ms
       ✓ orderly LIFO unstacking across 4 distinct layers on sequential Escape presses 247ms
       ✓ focus trapping within topmost layer when layers are opened sequentially 42ms
       ✓ a single Escape event NEVER closes more than one dialog 9ms
       ✓ burst of rapid Escape keydowns with React state settling in between 22ms
       ✓ rapid keydowns without waiting for React re-renders do not invoke background onClose callbacks 8ms
       ✓ unmounting intermediate overlay (Modal 1) keeps Modal 2 topmost and cleans stack 33ms
       ✓ abrupt DOM detachment: removing topmost modal DOM node invokes purgeDisconnectedEntries 8ms
       ✓ abrupt DOM detachment: removing intermediate modal DOM node preserves topmost overlay 10ms
       ✓ dialogStack is cleanly empty after closing all overlays 6ms
       × BUG REPRODUCTION: Simultaneous mount of Child Modal inside Sheet causes Escape deadlock 13ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

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

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯

 Test Files  1 failed (1)
      Tests  1 failed | 9 passed (10)
```

### 1.3 Baseline Suite Compatibility
Running `npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx`:
```
 ✓ apps/web/src/test/challenger-m2-dialog-stress.test.tsx (20 tests) 1116ms
 Test Files  1 passed (1)
      Tests  20 passed (20)
```

### 1.4 Code Inspection (`apps/web/src/ui/dialogA11y.ts:56-70`)
```typescript
  // If another active dialog's panel is nested inside this dialog's panel,
  // this dialog is an underlying parent container and cannot be topmost.
  const currentPanel = panelRef.current;
  if (currentPanel) {
    for (const entry of dialogStack) {
      if (entry.id !== dialogId && entry.panelRef.current) {
        if (currentPanel.contains(entry.panelRef.current)) {
          return false;
        }
      }
    }
  }

  // Topmost overlay is the latest item in the active LIFO stack
  const topEntry = dialogStack[dialogStack.length - 1];
  return topEntry?.id === dialogId;
```

---

## 2. Logic Chain

1. **Sequential Stacking Verification (Passed)**:
   - When dialogs are opened sequentially across user interaction ticks (Observation 1.2, tests 1–9):
     - `Sheet` opens in tick 0: `dialogStack = [Sheet]`.
     - `Modal 1` opens in tick 1: `dialogStack = [Sheet, Modal 1]`.
     - `Modal 2` opens in tick 2: `dialogStack = [Sheet, Modal 1, Modal 2]`.
     - `CommandPalette` opens in tick 3: handles its own Escape and dismisses first (`.palette-backdrop` check).
     - Under this sequential interaction pattern, `dialogStack[dialogStack.length - 1]` correctly points to the latest opened overlay, unstacking in LIFO order (Escape 1: Palette, Escape 2: Modal 2, Escape 3: Modal 1, Escape 4: Sheet).
     - Rapid Escape bursts and DOM detachment via `.remove()` correctly purge disconnected nodes and invoke callbacks strictly on the topmost overlay.

2. **Simultaneous Mounting Reverse-Order Flaw (Failed - Critical Bug)**:
   - In React, when a parent component (e.g. `Sheet`) and a descendant child overlay (e.g. `Modal` or `ConfirmDialog`) mount in the **same** render commit (Observation 1.2, test 10):
     ```tsx
     <Sheet open={true} title="Parent Sheet">
       <Modal title="Nested Child Modal" onClose={...}>...</Modal>
     </Sheet>
     ```
   - React commits side effects in **bottom-up order** (children before parents).
   - Therefore, `useDialogA11y` inside `Modal` runs its `useEffect` **first**, pushing `Modal` to `dialogStack`:
     `dialogStack = [Modal]`
   - `useDialogA11y` inside `Sheet` runs its `useEffect` **second**, pushing `Sheet` to `dialogStack`:
     `dialogStack = [Modal, Sheet]`
   - Consequently, `dialogStack[dialogStack.length - 1]` is `Sheet`, NOT `Modal`.

3. **Total Deadlock on Escape and Tab Trapping**:
   - When the user presses `Escape`:
     - **For `Sheet`**: `isTopmostOverlay(sheetId, sheetRef)` checks line 60: `currentPanel.contains(entry.panelRef.current)`. Because `sheetPanel` contains `modalPanel`, `Sheet` returns `false` (it knows it is an underlying container).
     - **For `Modal`**: `modalPanel` does not contain `sheetPanel`. But line 68 checks `topEntry = dialogStack[dialogStack.length - 1]`. `topEntry` is `Sheet`! Because `sheetId !== modalId`, `Modal` also returns `false`!
   - **Result**: BOTH dialogs return `false` from `isTopmostOverlay()`.
   - Neither dialog receives the `Escape` event (`onKey` exits early on line 169).
   - Neither dialog's `onClose` callback is called.
   - The user cannot dismiss either overlay with `Escape`. The entire overlay system is frozen/deadlocked. Focus trapping on `Tab` is also ignored for the child modal.

---

## 3. Caveats

- In standard runtime flows where a user explicitly opens a sheet first and clicks a button to open a confirmation dialog later in a subsequent tick, the bug is masked because the user events occur in distinct render commits.
- However, any scenario where a view initializes with a sheet and a nested modal/dialog open together (e.g., deep linking, multi-step wizards mounted inside sheets, or automated tests initializing mounted states) triggers the deadlock immediately.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES.**

The LIFO overlay stack is defective under simultaneous/nested initial mounts. The underlying assumption that `dialogStack[dialogStack.length - 1]` is always the topmost overlay is violated whenever a parent container registers after its children during a single commit.

### Required Mitigation for Worker:
In `apps/web/src/ui/dialogA11y.ts`, the topmost overlay must not naively be `dialogStack[dialogStack.length - 1]`. Rather, the topmost overlay should be the **latest entry in `dialogStack` that is NOT an ancestor/container of any other active entry in `dialogStack`**.

For example:
```typescript
export function isTopmostOverlay(dialogId: string, panelRef: RefObject<HTMLElement | null>): boolean {
  if (typeof document !== "undefined") {
    const palette = document.querySelector(".palette-backdrop");
    if (palette && !panelRef.current?.closest(".palette-backdrop")) {
      return false;
    }
  }

  purgeDisconnectedEntries();

  if (dialogStack.length === 0) {
    return true;
  }

  // Find all active entries that are NOT an ancestor of another active dialog
  const leafEntries = dialogStack.filter((candidate) => {
    const el = candidate.panelRef.current;
    if (!el) return false;
    return !dialogStack.some(
      (other) => other.id !== candidate.id && other.panelRef.current && el.contains(other.panelRef.current)
    );
  });

  if (leafEntries.length === 0) {
    return false;
  }

  // Topmost is the latest leaf entry in the stack
  const topLeaf = leafEntries[leafEntries.length - 1];
  return topLeaf?.id === dialogId;
}
```
This guarantees that:
1. Ancestors (`Sheet` enclosing `Modal`) are never considered candidates regardless of whether child or parent registered first in `dialogStack`.
2. Among leaf overlays, standard LIFO ordering is preserved.
3. Sibling overlays and deeply nested overlays (3+ layers) resolve seamlessly in both sequential and simultaneous mounting conditions.

---

## 5. Verification Method

### Test Commands
```powershell
# 1. Run Challenger M2-R2-1 Empirical Stress Test Suite (Shows the 1 failure)
npx vitest run apps/web/src/test/challenger-m2-r2-overlay.test.tsx

# 2. Run previous Challenger M2-2 Stress Test Suite (20 passed)
npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx

# 3. Verify lint on test files (0 errors)
npx eslint apps/web/src/test/challenger-m2-r2-overlay.test.tsx
```

### Invalidation Conditions
This critique will be satisfied (and can be marked APPROVED) when:
- `apps/web/src/test/challenger-m2-r2-overlay.test.tsx` passes 10/10 tests (including the simultaneous mount test).
- `apps/web/src/test/challenger-m2-dialog-stress.test.tsx` passes 20/20 tests.
- All 43 test suites in the monorepo pass without regressions.
