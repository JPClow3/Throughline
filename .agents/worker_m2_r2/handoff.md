# Handoff Report: Worker M2-R2 (Stacked Overlay Escape Dismissal)

**Agent**: Worker M2-R2  
**Role**: implementer, qa, specialist  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\worker_m2_r2`  
**Milestone**: Milestone 2, Iteration 2 (Stacked Overlay Escape Dismissal)  
**Date**: 2026-09-10T12:25:00Z  

---

## 1. Observation

### 1.1 Initial Test Execution & Verbatim Failures
Prior to modifying `apps/web/src/ui/dialogA11y.ts`, running `npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx` resulted in **3 failed tests** out of 20:

```
FAIL  apps/web/src/test/challenger-m2-dialog-stress.test.tsx > Challenger M2-2: Dialog & Overlay Empirical Stress Tests > 4. Nested & Stacked Overlays Edge Cases > STRESS TEST: Nested Modal inside Sheet (e.g. ConfirmDialog in TaskEditor)
AssertionError: expected false to be true // Object.is equality
- Expected: true
+ Received: false
 ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:425:30

FAIL  apps/web/src/test/challenger-m2-dialog-stress.test.tsx > Challenger M2-2: Dialog & Overlay Empirical Stress Tests > 4. Nested & Stacked Overlays Edge Cases > STRESS TEST: CommandPalette opened while Sheet is open, pressing Escape
AssertionError: expected false to be true // Object.is equality
- Expected: true
+ Received: false
 ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:520:25

FAIL  apps/web/src/test/challenger-m2-dialog-stress.test.tsx > Challenger M2-2: Dialog & Overlay Empirical Stress Tests > 4. Nested & Stacked Overlays Edge Cases > STRESS TEST: Stacked Modal on Modal, pressing Escape
AssertionError: expected false to be true // Object.is equality
- Expected: true
+ Received: false
 ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:560:26

Test Files  1 failed (1)
     Tests  3 failed | 17 passed (20)
```

### 1.2 Root Cause in Code
In `apps/web/src/ui/dialogA11y.ts:108-157`:
- Multiple dialog instances each registered an independent `keydown` listener on `document`.
- When `Escape` was pressed, FIFO listener execution on `document` fired the earliest listener first (the parent overlay), calling `onCloseRef.current()` on the parent dialog before or concurrently with the child dialog.
- `event.stopPropagation()` only stops traversal across DOM parent nodes, but does not stop sibling listeners registered on the same `document` target.
- `Tab` trapping in background overlays did not check if the overlay was topmost, risking focus stealing back to underlying sheets when pressing Tab within child modals.

### 1.3 Post-Implementation Test Execution Results
After modifying `apps/web/src/ui/dialogA11y.ts`:
1. `npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx`:
   ```
   RUN  v4.1.9 H:/Code/Pessoais/Throughline
   ✓ apps/web/src/test/challenger-m2-dialog-stress.test.tsx (20 tests) 638ms
   Test Files  1 passed (1)
        Tests  20 passed (20)
   ```
2. `npx vitest run apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx`:
   ```
   ✓ apps/web/src/test/CommandPalette.test.tsx (5 tests) 567ms
   ✓ apps/web/src/test/Sheet.test.tsx (7 tests) 283ms
   ✓ apps/web/src/test/App.test.tsx (3 tests) 1116ms
   Test Files  3 passed (3)
        Tests  15 passed (15)
   ```
3. `npm run build`:
   ```
   > throughline@0.1.0-beta.1 build
   > npm run build --workspaces --if-present
   ✓ built in 981ms
   PWA v1.3.0
   precache  61 entries (1573.48 KiB)
   Exit code 0.
   ```
4. Full monorepo test suite (`npx vitest run`):
   ```
   Test Files  43 passed (43)
        Tests  288 passed (288)
   Duration  41.78s
   ```

---

## 2. Logic Chain

1. **LIFO Stack Representation**:
   A module-level `dialogStack: DialogStackEntry[]` maintains active dialog registrations `{ id: string, panelRef: RefObject<HTMLElement | null> }`.
2. **Lifecycle Management**:
   When a dialog opens (`open === true`), it registers `{ id: dialogId, panelRef }` in `dialogStack`. When it closes or unmounts, the entry is spliced out.
3. **Pruning Disconnected Entries**:
   `purgeDisconnectedEntries()` sweeps backwards and removes any dialog stack entries whose `panelRef.current` is no longer attached to `document`, preventing leaks across unmounts or tests.
4. **Topmost Overlay Determination (`isTopmostOverlay`)**:
   An overlay is topmost if:
   - **CommandPalette Precedence**: If `.palette-backdrop` exists in the DOM and the current dialog is not inside it, `CommandPalette` (`z-[120]`) has precedence; return `false`.
   - **DOM Containment**: If another active dialog's panel is a descendant of this dialog's panel (`currentPanel.contains(entry.panelRef.current)`), this dialog is an underlying container (e.g. Sheet hosting ConfirmDialog); return `false`.
   - **LIFO Stack Order**: The dialog's `dialogId` must match the top entry `dialogStack[dialogStack.length - 1]?.id`.
5. **Keydown Handling Guard**:
   At the start of the `onKey` listener in `useDialogA11y`:
   ```typescript
   if (!isTopmostOverlay(dialogId, panelRef)) {
     return;
   }
   ```
   This ensures background overlays do not react to `Escape` (preventing double-close) and do not trap `Tab` (preventing focus stealing).
6. **Immediate Event Termination**:
   On `Escape`, calling `event.stopImmediatePropagation()` alongside `event.stopPropagation()` immediately stops any other listeners registered on `document` from firing in the same event tick.

---

## 3. Caveats

- **No modifications to `CommandPalette.tsx`**: `CommandPalette` uses `cmdk`'s `Command.Dialog` which handles its own Escape dismissal. By having `dialogA11y.ts` yield when `.palette-backdrop` is present, `CommandPalette` dismisses cleanly without touching `CommandPalette.tsx`.
- **Pre-existing test lint warnings**: Pre-existing unused variables exist in `e2e-inkline.test.tsx` and `challenger-m2-dialog-stress.test.tsx`, unrelated to this change. `apps/web/src/ui/dialogA11y.ts` has 0 lint warnings or errors.

---

## 4. Conclusion

The stacked overlay Escape dismissal and focus trapping issues have been completely resolved. All 20 adversarial stress tests in `challenger-m2-dialog-stress.test.tsx` pass with 100% success rate, all regression suites pass, and all 288 tests across 43 test files in the monorepo pass cleanly.

---

## 5. Verification Method

To independently verify:
```powershell
# 1. Run all 20 dialog stress tests (Target: 20 passed)
npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx

# 2. Run related dialog and shell tests (Target: 15 passed)
npx vitest run apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx

# 3. Build project
npm run build

# 4. Run entire monorepo test suite (Target: 43 test files passed, 288 tests passed)
npx vitest run
```

### Invalidation Conditions
The fix would be invalidated if:
- Pressing Escape when a nested ConfirmDialog is open inside a Sheet closes both dialogs.
- Pressing Escape when CommandPalette is open over a Sheet closes the Sheet.
- Pressing Escape on stacked sibling Modals closes both Modals.
- Any test in `challenger-m2-dialog-stress.test.tsx` fails.
