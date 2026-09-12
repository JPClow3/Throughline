# Challenger Report: M2-2 (Milestone 2 Shell, Navigation & Keyboard Workflows)

**Agent**: `challenger_m2_2`  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\challenger_m2_2`  
**Verdict**: **REQUEST_CHANGES**  
**Risk Assessment**: **HIGH**  

---

## 1. Observation

Direct code examination and automated test suite execution within `apps/web` revealed the following exact facts and reproduction data:

### 1.1 Verified Passing Behaviors
In `apps/web/src/ui/dialogA11y.ts`, `apps/web/src/ui/Overlay.tsx`, and `apps/web/src/views/CommandPalette.tsx`:
- **Single-Layer Focus Trapping & Tab Wrapping**:
  - In `Sheet`: Tab on the last interactive child wraps forward to the Close button (`apps/web/src/ui/dialogA11y.ts:149-152`). Shift+Tab on the Close button wraps backward to the last interactive element (`apps/web/src/ui/dialogA11y.ts:146-148`).
  - In `Modal`: Tab on the last interactive button wraps forward to the first button. Shift+Tab on the first button wraps backward to the last button.
  - In `CommandPalette`: Focus does not escape to outside background elements when tabbing from `Command.Input`.
- **Single Focusable Element**:
  - In `Sheet` with only the Close button, pressing Tab or Shift+Tab keeps focus on the Close button without error or escaping.
- **Empty Dialogs (0 Focusable Elements)**:
  - In `Modal` with no buttons or inputs (`apps/web/src/ui/dialogA11y.ts:87-92`), initial focus falls back to `panelRef.current` with `tabIndex="-1"`. Pressing Tab or Shift+Tab keeps focus trapped on the panel (`apps/web/src/ui/dialogA11y.ts:129-133`).
- **AutoFocus Preservation**:
  - In both `Sheet` and `Modal`, inputs with `autoFocus` retain focus and are not stolen by the 10ms initial focus timer (`apps/web/src/ui/dialogA11y.ts:69-72`).
- **Focus Restoration (Single Layer)**:
  - When a single `Sheet`, `Modal`, or `CommandPalette` is dismissed via Escape, focus is restored to the triggering button (`apps/web/src/ui/dialogA11y.ts:97-103`, `apps/web/src/views/CommandPalette.tsx:80-88`).
- **Backdrop vs Content Click**:
  - Clicking `.sheet-backdrop` or `.modal-backdrop` invokes `onClose`. Clicking inside `.sheet` or `.modal-panel` stops propagation (`apps/web/src/ui/Overlay.tsx:36, 77`) and does not invoke `onClose`.
  - In `CommandPalette`, clicking `.palette-backdrop` dismisses, while clicking `.palette-panel` does not dismiss (`apps/web/src/views/CommandPalette.tsx:110-114`).

### 1.2 Observed Failures in Stacked / Nested Overlays
An empirical stress test suite was authored in `apps/web/src/test/challenger-m2-dialog-stress.test.tsx` (20 tests). Running `npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx` produced 3 test failures with 100% reproducibility:

#### Failure 1: Nested Modal inside Sheet (e.g. `ConfirmDialog` in `TaskEditor`)
- **Code under test**: `apps/web/src/test/challenger-m2-dialog-stress.test.tsx:382-426`
- **Verbatim Error**:
  ```
  FAIL apps/web/src/test/challenger-m2-dialog-stress.test.tsx > Challenger M2-2: Dialog & Overlay Empirical Stress Tests > 4. Nested & Stacked Overlays Edge Cases > STRESS TEST: Nested Modal inside Sheet (e.g. ConfirmDialog in TaskEditor)
  AssertionError: expected false to be true // Object.is equality

  - Expected
  + Received

  - true
  + false

   ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:425:30
      423|
      424| expect(confirmDismissed).toBe(true);
      425| expect(sheetStillOpen).toBe(true);
         | ^
  ```
- **Observed Behavior**: When `ConfirmDialog` is open over an open `Sheet`, pressing `Escape` closes **BOTH** the `ConfirmDialog` AND the parent `Sheet` simultaneously.

#### Failure 2: CommandPalette opened while Sheet is open
- **Code under test**: `apps/web/src/test/challenger-m2-dialog-stress.test.tsx:478-522`
- **Verbatim Error**:
  ```
  FAIL apps/web/src/test/challenger-m2-dialog-stress.test.tsx > Challenger M2-2: Dialog & Overlay Empirical Stress Tests > 4. Nested & Stacked Overlays Edge Cases > STRESS TEST: CommandPalette opened while Sheet is open, pressing Escape
  AssertionError: expected false to be true // Object.is equality

  - Expected
  + Received

  - true
  + false

   ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:520:25
      518|
      519| expect(paletteClosed).toBe(true);
      520| expect(sheetOpen).toBe(true);
         | ^
  ```
- **Observed Behavior**: When a user opens `CommandPalette` while a `Sheet` is open, pressing `Escape` closes **BOTH** `CommandPalette` AND the underlying `Sheet`.

#### Failure 3: Stacked Modal on Modal
- **Code under test**: `apps/web/src/test/challenger-m2-dialog-stress.test.tsx:524-563`
- **Verbatim Error**:
  ```
  FAIL apps/web/src/test/challenger-m2-dialog-stress.test.tsx > Challenger M2-2: Dialog & Overlay Empirical Stress Tests > 4. Nested & Stacked Overlays Edge Cases > STRESS TEST: Stacked Modal on Modal, pressing Escape
  AssertionError: expected false to be true // Object.is equality

  - Expected
  + Received

  - true
  + false

   ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:560:26
      558|
      559| expect(modalBClosed).toBe(true);
      560| expect(modalAOpen).toBe(true);
         | ^
  ```
- **Observed Behavior**: When Modal B is opened on top of Modal A, pressing `Escape` closes **BOTH** Modal A and Modal B simultaneously.

---

## 2. Logic Chain

1. **Overlay Keydown Event Registration (`apps/web/src/ui/dialogA11y.ts:108-157`)**:
   ```typescript
   useEffect(() => {
     if (!open) {
       return;
     }

     const onKey = (event: KeyboardEvent) => {
       if (event.key === "Escape") {
         event.preventDefault();
         event.stopPropagation();
         onCloseRef.current();
         return;
       }
       ...
     };

     document.addEventListener("keydown", onKey);
     return () => document.removeEventListener("keydown", onKey);
   }, [open, panelRef]);
   ```
2. In `Sheet.tsx` and `Modal.tsx`, each instance invokes `useDialogA11y`. When open, each dialog registers an independent `keydown` listener directly on `document`.
3. In DOM event dispatch, when an event is dispatched to `document`, all listeners registered on `document` execute in FIFO (first registered, first executed) order.
4. Calling `event.stopPropagation()` stops bubbling up ancestor nodes in the DOM tree. Because `document` is the top-level event target for all these listeners and has no parent nodes, `event.stopPropagation()` does **NOT** prevent subsequent listeners registered on `document` from executing.
5. In a stacked overlay scenario (e.g. `Sheet` opens `ConfirmDialog`), `Sheet` was opened first, so `Sheet`'s `document.addEventListener("keydown", onKey)` listener was registered first.
6. When the user presses `Escape` intending to cancel the `ConfirmDialog`:
   - `Sheet`'s listener executes first: it calls `onCloseRef.current()`, which closes the underlying `Sheet`.
   - `ConfirmDialog`'s listener executes next: it calls its `onCloseRef.current()`, which closes the modal.
   - The user experiences a catastrophic double-close: canceling the confirmation dialog inadvertently unmounts the entire `TaskEditor` / `Sheet`, losing all in-progress edits.
7. Similarly, when `CommandPalette` is opened on top of a `Sheet`, `Sheet`'s listener intercepts the `Escape` keydown on `document` and unmounts the `Sheet`.
8. There is currently no overlay stack management or guard to verify whether a dialog is the topmost active overlay before handling `Escape`.

---

## 3. Caveats

- **Scope limitation**: Browser keyboard trapping was tested in Vitest/JSDOM. Screen reader virtual cursor traversal (e.g. NVDA / VoiceOver reading non-focusable static nodes outside `aria-modal="true"`) relies on browser-level accessibility tree construction and cannot be fully measured in JSDOM, though `aria-modal="true"` and `role="dialog"` are correctly placed on the DOM nodes.
- **Single-overlay robustness**: For any single dialog, sheet, or command palette, keyboard accessibility, Tab wrapping, autofocus preservation, and trigger focus restoration are working properly.

---

## 4. Conclusion & Recommended Fix

### Verdict: **REQUEST_CHANGES**

Milestone 2 cannot be approved in its current state because stacked overlays are a core UX workflow in Throughline (`TaskEditor` with `ConfirmDialog` for task deletion; `Sheet` composers with `Ctrl+K` `CommandPalette`; `SettingsView` with confirmation dialogs), and pressing `Escape` triggers an unhandled double-close cascade that closes underlying views.

### Concrete Remediation Plan for Worker M2

To resolve this issue, `useDialogA11y` must maintain an active overlay stack (or a topmost active overlay check):

1. **Maintain an Overlay Stack in `apps/web/src/ui/dialogA11y.ts`**:
   ```typescript
   // Top of apps/web/src/ui/dialogA11y.ts
   const activeOverlayStack: string[] = [];
   ```
2. **Push/Pop on Open**:
   Generate a unique ID per hook instance (e.g. `useId()` or incremental counter).
   When `open` is true, push the ID onto `activeOverlayStack`. In cleanup, pop/remove it.
3. **Guard Escape by Topmost Overlay**:
   ```typescript
   const onKey = (event: KeyboardEvent) => {
     if (event.key === "Escape") {
       // Guard: if CommandPalette or a higher overlay is open, ignore Escape in this overlay
       if (document.querySelector(".palette-backdrop") && !panelRef.current?.closest(".palette-backdrop")) {
         return;
       }
       // Only the topmost overlay in the stack handles Escape
       if (activeOverlayStack[activeOverlayStack.length - 1] !== instanceId) {
         return;
       }
       event.preventDefault();
       event.stopImmediatePropagation();
       onCloseRef.current();
       return;
     }
     ...
   };
   ```
4. **CommandPalette Integration**:
   If `CommandPalette` is opened while a `Sheet` is open, ensure `dialogA11y` ignores Escape if `document.querySelector(".palette-backdrop")` is mounted.

---

## 5. Verification Method

### 5.1 Run Challenger Stress Harness
Execute the empirical stress test file:
```powershell
npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx
```
Current output: 17 passed, 3 failed.
Target output after fix: 20 passed (100%).

### 5.2 Run Milestone 2 Test Suites
```powershell
npx vitest run apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx
```
Expected output: 15 passed (15).

### 5.3 Invalidation Conditions
- If opening `TaskEditor` (in `Sheet`), clicking "Delete task" to trigger `ConfirmDialog`, and pressing `Escape` results in the parent `Sheet` closing.
- If opening `CommandPalette` while a `Sheet` is open and pressing `Escape` closes the `Sheet`.
- If pressing `Escape` on any nested dialog closes more than one dialog simultaneously.
