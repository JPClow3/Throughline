# Handoff & Review Report: Reviewer M2-2 (Milestone 2: Shell, Navigation & Keyboard Workflows)

**Reviewer Agent**: `reviewer_m2_2`  
**Roles**: Reviewer, Adversarial Critic  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Date**: 2026-09-10T12:13:00Z  
**Target Milestone**: Milestone 2 (Shell, Navigation & Keyboard Workflows)  
**Verdict**: **REQUEST_CHANGES**  

---

## Review Summary

While Features 7, 8, and 9 are implemented cleanly and pass all checks with zero integrity violations, adversarial stress testing on Feature 10 (Dialog Accessibility & Focus Management) identified a **Critical Defect**: **Nested and Stacked Overlays Fail to Handle Escape Key Correctly**.

When a child overlay (e.g. `ConfirmDialog` or `Modal`) opens on top of a parent overlay (e.g. `Sheet` or `TaskEditor`), or when `CommandPalette` opens while a `Sheet` is open, pressing `Escape` dismisses **BOTH** the child and the parent overlays simultaneously, or closes the parent overlay instead of the child.

This failure is empirically verified by 3 failing tests in `apps/web/src/test/challenger-m2-dialog-stress.test.tsx`.

---

## Findings

### [Critical] Finding 1: Simultaneous Dismissal of Stacked Overlays on Escape Press

- **What**: When multiple overlays are active in a stack (such as a confirmation modal inside a task editor sheet, or a command palette opened while a sheet is visible), pressing the `Escape` key closes both the top-level overlay AND the underlying overlay.
- **Where**: `apps/web/src/ui/dialogA11y.ts:108-158` (and `apps/web/src/views/CommandPalette.tsx`)
- **Why**:
  In `useDialogA11y`, every open dialog registers its own keydown listener directly on `document`:
  ```typescript
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCloseRef.current();
      return;
    }
  ```
  1. In DOM Level 2/3 Event specifications, `event.stopPropagation()` only stops propagation through ancestors and descendants in the DOM tree. When multiple listeners are attached directly to the **same** node (`document`), `event.stopPropagation()` **does NOT prevent other listeners on `document` from executing**.
  2. Because event listeners fire in chronological order of `addEventListener`, the parent sheet's listener (registered first when the sheet opened) fires first, closing the sheet. The child dialog's listener also fires, closing the child dialog.
  3. Consequently, in real-world workflows (such as clicking "Delete task" in `TaskEditor` to prompt "Are you sure?"), pressing `Escape` closes the entire editor sheet and aborts the user's editing session rather than simply dismissing the confirmation prompt.
- **Evidence**:
  Running `npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx`:
  - `FAIL ... STRESS TEST: Nested Modal inside Sheet (e.g. ConfirmDialog in TaskEditor)` (expected `sheetStillOpen: true`, received `false`)
  - `FAIL ... STRESS TEST: CommandPalette opened while Sheet is open, pressing Escape` (expected `sheetOpen: true`, received `false`)
  - `FAIL ... STRESS TEST: Stacked Modal on Modal, pressing Escape` (expected `modalAOpen: true`, received `false`)
- **Suggested Fix**:
  Implement a lightweight LIFO overlay stack in `apps/web/src/ui/dialogA11y.ts` (or a shared overlay context/registry):
  ```typescript
  // Maintain a module-level or context stack of open dialogs
  const overlayStack: { id: symbol; onClose: () => void }[] = [];

  // When open is true:
  useEffect(() => {
    if (!open) return;
    const dialogId = Symbol("dialog");
    overlayStack.push({ id: dialogId, onClose: () => onCloseRef.current() });

    return () => {
      const idx = overlayStack.findIndex(item => item.id === dialogId);
      if (idx !== -1) overlayStack.splice(idx, 1);
    };
  }, [open]);

  // Global document listener (or single listener):
  // When Escape is pressed, only invoke the topmost overlay in overlayStack!
  // E.g.:
  // const top = overlayStack[overlayStack.length - 1];
  // if (top && top.id === dialogId) {
  //   event.preventDefault();
  //   event.stopImmediatePropagation();
  //   onCloseRef.current();
  // }
  ```
  This ensures that only the topmost overlay consumes the `Escape` key.

---

## Verified Claims

- **Integrity Check**: **PASS**. No hardcoded expected values, facade stubs, or bypasses exist in the source code.
- **Feature 7 ('N' Shortcut in Goals)**: **PASS**. Pressing 'N' on `/app?view=goals` correctly opens the TaskComposer sheet (`apps/web/src/App.tsx:284-293`).
- **Feature 8 (Command Palette Insights Navigation)**: **PASS**. "Go to Insights" item renders with Phosphor's `ChartLine` icon (`size={16} weight="bold"`), maps `value={label}`, and properly switches view to `insights` (`apps/web/src/views/CommandPalette.tsx:165`).
- **Feature 9 (URL Query View Alias)**: **PASS**. `/app?view=today` resolves to `"dashboard"` and canonicalizes the URL via `replaceState` (`apps/web/src/App.tsx:46-68, 666-686`).
- **Feature 10 (Single Dialog Trapping & Inkline Styling)**: **PASS**. Single dialogs properly trap Tab, restore focus to the trigger element, preserve child `autoFocus`, and carry Inkline Level 4 elevation (`var(--shadow-3)` / `8px 8px`).

---

## 1. Observation

1. `apps/web/src/ui/dialogA11y.ts:114-119`:
   ```typescript
   if (event.key === "Escape") {
     event.preventDefault();
     event.stopPropagation();
     onCloseRef.current();
     return;
   }
   ```
2. Running `npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx` outputs:
   ```
   FAIL  apps/web/src/test/challenger-m2-dialog-stress.test.tsx > Challenger M2-2: Dialog & Overlay Empirical Stress Tests > 4. Nested & Stacked Overlays Edge Cases > STRESS TEST: Nested Modal inside Sheet (e.g. ConfirmDialog in TaskEditor)
   AssertionError: expected false to be true // Object.is equality
   - Expected
   + Received
   - true
   + false
    ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:425:30

   FAIL  apps/web/src/test/challenger-m2-dialog-stress.test.tsx > Challenger M2-2: Dialog & Overlay Empirical Stress Tests > 4. Nested & Stacked Overlays Edge Cases > STRESS TEST: CommandPalette opened while Sheet is open, pressing Escape
   AssertionError: expected false to be true
    ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:520:25

   FAIL  apps/web/src/test/challenger-m2-dialog-stress.test.tsx > Challenger M2-2: Dialog & Overlay Empirical Stress Tests > 4. Nested & Stacked Overlays Edge Cases > STRESS TEST: Stacked Modal on Modal, pressing Escape
   AssertionError: expected false to be true
    ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:560:26

   Test Files  1 failed (1)
        Tests  3 failed | 17 passed (20)
   ```

---

## 2. Logic Chain

1. In Milestone 2 Feature 10, the objective is "Ensure all dialogs, sheets, and command palette maintain strict focus trapping and escape restoration".
2. In React applications with multi-tier workflows (e.g., TaskComposer / TaskEditor / ConfirmDialog / CommandPalette), overlays can be open concurrently.
3. Because each overlay attaches a separate `keydown` listener directly to `document`, and because `event.stopPropagation()` on a `document` listener cannot prevent sibling listeners on `document` from running, an `Escape` key event is broadcast to all open dialogs.
4. As confirmed by test observations, pressing `Escape` dismisses the parent overlay when only the topmost overlay should be dismissed.
5. Therefore, Feature 10 cannot be considered complete or production-ready until LIFO overlay stacking is handled.

---

## 3. Caveats

- For isolated, single-overlay scenarios, the implementation in `dialogA11y.ts` functions cleanly and passes all unit tests in `Sheet.test.tsx` and `CommandPalette.test.tsx`.
- The failure occurs specifically under nested/stacked overlays, which are common across the planner (e.g. confirming deletion or opening palette while a sheet is open).
- In accordance with the Reviewer identity constraint ("Review-only — do NOT modify implementation code"), Reviewer M2-2 has NOT modified the code, leaving the fix for the worker agent.

---

## 4. Conclusion

Milestone 2 cannot be approved in its current state due to the critical stacked-overlay Escape dismissal bug.

**Final Verdict: REQUEST_CHANGES**

---

## 5. Verification Method

To independently verify the failure and subsequent fix:

```powershell
# Run the overlay stress test suite:
npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx

# Invalidation Condition:
# All 20 tests in challenger-m2-dialog-stress.test.tsx must pass, specifically:
# - STRESS TEST: Nested Modal inside Sheet (e.g. ConfirmDialog in TaskEditor)
# - STRESS TEST: CommandPalette opened while Sheet is open, pressing Escape
# - STRESS TEST: Stacked Modal on Modal, pressing Escape
```
