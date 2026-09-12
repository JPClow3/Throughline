# Explorer Report & Implementation Plan: M2-R2-3
**Agent**: Explorer M2-R2-3  
**Role**: Teamwork Explorer (Investigation & Synthesis)  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\explorer_m2_r2_3`  
**Target Milestone**: Milestone 2, Iteration 2 (Shell, Navigation & Keyboard Workflows — Feature 10 Remediation)  
**Date**: 2026-09-10T12:19:00Z  

---

## 1. Observation

Direct code examination and automated test suite execution across `apps/web` revealed the following exact empirical facts:

### 1.1 Test Suite Breakdown (`apps/web/src/test/challenger-m2-dialog-stress.test.tsx`)
The test file contains exactly **20 tests** divided into 4 groups:

#### Group 1: Sheet Focus Trapping & Keyboard Workflows (6 tests — ALL PASSING)
1. `traps focus and wraps forward from last element to first (Close button)` (lines 21–37)
   - Dispatches: `submitBtn.focus()`, `fireEvent.keyDown(document, { key: "Tab" })`
   - Assertions: `expect(document.activeElement).toBe(closeBtn)`
2. `traps focus and wraps backward from first element (Close button) to last` (lines 39–55)
   - Dispatches: `closeBtn.focus()`, `fireEvent.keyDown(document, { key: "Tab", shiftKey: true })`
   - Assertions: `expect(document.activeElement).toBe(submitBtn)`
3. `handles single focusable element (only Close button) without leaking` (lines 57–75)
   - Dispatches: `closeBtn.focus()`, Tab and Shift+Tab on `document`
   - Assertions: `expect(document.activeElement).toBe(closeBtn)`
4. `preserves autoFocus on inner element without stealing focus to Close button` (lines 77–91)
   - Dispatches: `autofocusInput.focus()`, waits 25ms timeout
   - Assertions: `expect(document.activeElement).toBe(autofocusInput)`
5. `restores focus to trigger button upon Escape dismissal` (lines 93–119)
   - Dispatches: `trigger.focus()`, `fireEvent.click(trigger)`, `fireEvent.keyDown(document, { key: "Escape" })`
   - Assertions: `expect(document.activeElement).toBe(trigger)`, sheet unmounted
6. `closes when clicking backdrop but does NOT close when clicking content` (lines 121–141)
   - Dispatches: `fireEvent.click(innerCard)`, `fireEvent.click(backdrop)`
   - Assertions: `expect(onClose).not.toHaveBeenCalled()`, then `expect(onClose).toHaveBeenCalledTimes(1)`

#### Group 2: Modal Focus Trapping & Edge Cases (6 tests — ALL PASSING)
7. `traps focus and wraps forward from last button to first button` (lines 144–161)
   - Dispatches: `action2.focus()`, `fireEvent.keyDown(document, { key: "Tab" })`
   - Assertions: `expect(document.activeElement).toBe(closeBtn)`
8. `traps focus and wraps backward from first button to last button` (lines 163–180)
   - Dispatches: `closeBtn.focus()`, `fireEvent.keyDown(document, { key: "Tab", shiftKey: true })`
   - Assertions: `expect(document.activeElement).toBe(action2)`
9. `handles completely empty modal (0 focusable elements) by trapping focus on modal panel` (lines 182–202)
   - Dispatches: waits 25ms timeout, Tab and Shift+Tab on `document`
   - Assertions: `expect(document.activeElement).toBe(panel)`
10. `preserves autoFocus inside modal` (lines 204–218)
    - Dispatches: `input.focus()`, waits 25ms timeout
    - Assertions: `expect(document.activeElement).toBe(input)`
11. `restores focus to trigger when Modal is unmounted via Escape` (lines 220–248)
    - Dispatches: `trigger.focus()`, `fireEvent.click(trigger)`, `fireEvent.keyDown(document, { key: "Escape" })`
    - Assertions: `expect(document.activeElement).toBe(trigger)`, modal unmounted
12. `closes Modal when clicking backdrop but NOT when clicking modal content` (lines 250–267)
    - Dispatches: `fireEvent.click(content)`, `fireEvent.click(backdrop)`
    - Assertions: `expect(onClose).not.toHaveBeenCalled()`, then `expect(onClose).toHaveBeenCalledTimes(1)`

#### Group 3: CommandPalette Keyboard Workflows & Trapping (4 tests — ALL PASSING)
13. `autofocuses input upon opening` (lines 271–284)
    - Assertions: `expect(document.activeElement).toBe(input)`
14. `restores focus to trigger button upon close` (lines 286–319)
    - Dispatches: `trigger.focus()`, `fireEvent.click(trigger)`, `fireEvent.click(backdrop)`
    - Assertions: `expect(document.activeElement).toBe(trigger)`
15. `clicking palette panel does NOT dismiss palette` (lines 321–337)
    - Dispatches: `fireEvent.click(panel)`
    - Assertions: `expect(setOpen).not.toHaveBeenCalled()`
16. `evaluates Tab behavior when CommandPalette is open` (lines 339–366)
    - Appends `outsideBtn` to `document.body`
    - Dispatches: `fireEvent.keyDown(input, { key: "Tab" })`
    - Assertions: `expect(document.activeElement).not.toBe(outsideBtn)`

#### Group 4: Nested & Stacked Overlays Edge Cases (4 tests — 1 PASSING, 3 FAILING)
17. `STRESS TEST: Nested Modal inside Sheet (e.g. ConfirmDialog in TaskEditor)` (lines 370–426) — **FAILING**
    - Fixture: Parent `<Sheet open={sheetOpen}>` containing interactive `<ConfirmDialog open={confirmOpen}>` (which renders `<Modal>`).
    - Dispatched events:
      1. Initial state: `sheetOpen = true`, `confirmOpen = false`.
      2. `fireEvent.click(deleteBtn)` -> triggers `setConfirmOpen(true)`.
      3. `await new Promise((r) => setTimeout(r, 25))` -> waits for modal focus initialization.
      4. `fireEvent.keyDown(document, { key: "Escape" })`.
    - Exact assertions:
      ```typescript
      const confirmDismissed = screen.queryByRole("dialog", { name: "Confirm Delete" }) === null;
      const sheetStillOpen = screen.queryByText("Parent Sheet") !== null;

      expect(confirmDismissed).toBe(true);
      expect(sheetStillOpen).toBe(true); // Line 425: FAILED (Expected: true, Received: false)
      ```
    - Verbatim failure:
      ```
      FAIL apps/web/src/test/challenger-m2-dialog-stress.test.tsx > STRESS TEST: Nested Modal inside Sheet (e.g. ConfirmDialog in TaskEditor)
      AssertionError: expected false to be true // Object.is equality
      - Expected: true
      + Received: false
      ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:425:30
      ```
    - Defect: Pressing Escape closes **BOTH** `ConfirmDialog` AND the parent `Sheet`.

18. `STRESS TEST: Focus trapping within topmost overlay when nested` (lines 428–476) — **PASSING**
    - Fixture: Parent `Sheet` containing `ConfirmDialog`.
    - Dispatched events: Focuses `confirmBtn`, dispatches `fireEvent.keyDown(document, { key: "Tab" })`.
    - Assertions: Focus wraps to `cancelBtn` inside `ConfirmDialog`, does not leak to `sheetCloseBtn` or `sheetInput`.

19. `STRESS TEST: CommandPalette opened while Sheet is open, pressing Escape` (lines 478–521) — **FAILING**
    - Fixture: `<Sheet open={sheetOpen}>` with trigger button that renders `<CommandPalette open={paletteOpen}>` as a sibling.
    - Dispatched events:
      1. Initial state: `sheetOpen = true`, `paletteOpen = false`.
      2. `fireEvent.click(paletteBtn)` -> triggers `setPaletteOpen(true)`.
      3. Palette is visible with `.palette-backdrop` and input.
      4. `fireEvent.keyDown(document, { key: "Escape" })`.
    - Exact assertions:
      ```typescript
      const paletteClosed = screen.queryByPlaceholderText("Type a command or search...") === null;
      const sheetOpen = screen.queryByText("Open Task Sheet") !== null;

      expect(paletteClosed).toBe(true); // Passed!
      expect(sheetOpen).toBe(true);    // Line 520: FAILED (Expected: true, Received: false)
      ```
    - Verbatim failure:
      ```
      FAIL apps/web/src/test/challenger-m2-dialog-stress.test.tsx > STRESS TEST: CommandPalette opened while Sheet is open, pressing Escape
      AssertionError: expected false to be true // Object.is equality
      - Expected: true
      + Received: false
      ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:520:25
      ```
    - Defect: `CommandPalette` correctly handled Escape and closed, but `Sheet`'s `document` keydown listener also caught Escape and closed `Sheet`.

20. `STRESS TEST: Stacked Modal on Modal, pressing Escape` (lines 523–562) — **FAILING**
    - Fixture: Sibling modals: `<Modal title="Modal A">` with button opening `<Modal title="Modal B">`.
    - Dispatched events:
      1. Initial state: `modalAOpen = true`, `modalBOpen = false`.
      2. `fireEvent.click(openModalBBtn)` -> triggers `setModalBOpen(true)`.
      3. Both Modal A and Modal B are mounted.
      4. `fireEvent.keyDown(document, { key: "Escape" })`.
    - Exact assertions:
      ```typescript
      const modalBClosed = screen.queryByRole("dialog", { name: "Modal B" }) === null;
      const modalAOpen = screen.queryByRole("dialog", { name: "Modal A" }) !== null;

      expect(modalBClosed).toBe(true); // Passed!
      expect(modalAOpen).toBe(true);  // Line 560: FAILED (Expected: true, Received: false)
      ```
    - Verbatim failure:
      ```
      FAIL apps/web/src/test/challenger-m2-dialog-stress.test.tsx > STRESS TEST: Stacked Modal on Modal, pressing Escape
      AssertionError: expected false to be true // Object.is equality
      - Expected: true
      + Received: false
      ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:560:26
      ```
    - Defect: Modal A was opened first, so its keydown listener on `document` fired first and called `setModalAOpen(false)`. Then Modal B's listener fired and called `setModalBOpen(false)`. Both modals closed simultaneously.

### 1.2 Entire Repository Health
Running the full repository test suite (`npx vitest run`) shows:
- **42 passed test files out of 43**
- **285 passed tests out of 288**
- **The ONLY 3 failures in the entire project are the 3 stress tests above.**
- `npm run typecheck` and `npm run lint` are completely clean.

---

## 2. Logic Chain

1. **Overlay Keydown Event Registration (`apps/web/src/ui/dialogA11y.ts:108–157`)**:
   In `useDialogA11y`, when `open` is true, each dialog instance executes:
   ```typescript
   document.addEventListener("keydown", onKey);
   ```
2. **DOM Event Model Specifics**:
   - In DOM Level 2/3 Event standards, when multiple event listeners are attached to the **same event target** (`document`), they execute in FIFO order (the order in which `addEventListener` was invoked).
   - Calling `event.stopPropagation()` stops propagation to parent/ancestor DOM nodes in the bubble phase. Because `document` is the topmost node and has no parents (other than `window`), `stopPropagation()` does **NOT** prevent other listeners already registered on `document` from executing.
   - Calling `event.stopImmediatePropagation()` stops other listeners on the *same* element, but because FIFO order executes the *oldest* listener first, parent dialogs (registered earlier) execute before child dialogs (registered later). If a parent called `stopImmediatePropagation()`, it would close the parent and prevent the child from closing — the exact opposite of desired LIFO stacking!
3. **Stacked Overlay Categories**:
   Three distinct overlay relationship patterns exist in Throughline:
   - **Pattern A: Nested Overlays (DOM Descendant)**:
     `<Sheet><ConfirmDialog /></Sheet>`. The child dialog's panel is a descendant of the parent dialog's panel (`parentPanel.contains(childPanel) === true`).
   - **Pattern B: Sibling Overlays (DOM Siblings / Portals)**:
     `<Modal A />` followed by `<Modal B />` or `<Sheet />` followed by `<CommandPalette />`. The panels are not DOM ancestors of each other, but exist as concurrent overlays in `document`.
   - **Pattern C: Third-Party Overlay (`CommandPalette` / `cmdk`)**:
     `CommandPalette` uses `cmdk` (`Command.Dialog`). When open, it renders a container with class `.palette-backdrop`. `CommandPalette` handles its own Escape dismissal internally.
4. **Tab Trapping Exposure in Stacked Overlays**:
   In `apps/web/src/ui/dialogA11y.ts:139–145`:
   ```typescript
   if (!panelRef.current.contains(active)) {
     event.preventDefault();
     if (event.shiftKey) last.focus();
     else first.focus();
   }
   ```
   If Modal A is underneath Modal B (or Sheet is underneath CommandPalette), when the user presses `Tab` while focused inside Modal B, Modal A's `!panelRef.current.contains(active)` evaluates to `true`! If Modal A does not guard against inactive overlay state, it will intercept the `Tab` event, call `event.preventDefault()`, and steal focus back to Modal A!
5. **Unified Solution Architecture**:
   To fix both `Escape` dismissal and `Tab` trapping without regressions, `useDialogA11y` must enforce an `isTopmostOverlay` check. An overlay is topmost if and only if:
   - **Condition 1 (CommandPalette Precedence)**: No `.palette-backdrop` element is present in `document` (unless the panel itself is inside the palette).
   - **Condition 2 (Nested Dialog Precedence)**: The overlay's panel does not contain another active modal dialog in its DOM subtree (`panelRef.current.querySelector('.sheet, .modal-panel, .onboarding-panel, [aria-modal="true"]') === null`).
   - **Condition 3 (LIFO Stack Precedence)**: The overlay's ID matches the top entry of a module-level `activeOverlayStack`. Stale entries (whose panel is no longer connected to `document`) are automatically pruned.

---

## 3. Caveats

1. **`CommandPalette.tsx` modification is NOT required**:
   `CommandPalette` already handles Escape dismissal and focus restoration cleanly via `cmdk` and `previousActiveElementRef`. All 4 tests in Group 3 pass. Modifying `CommandPalette.tsx` directly could risk regressions in search filtering or arrow key navigation. Resolving the stacked conflict inside `dialogA11y.ts` via Condition 1 keeps the fix 100% localized to `apps/web/src/ui/dialogA11y.ts`.
2. **`OnboardingOverlay.tsx` intentionally ignores Escape**:
   Line 55 of `OnboardingOverlay.tsx` calls `useDialogA11y(true, () => undefined, panelRef);`. Setup is mandatory, so Escape does not close it. The overlay stack design preserves this: Onboarding registers in the stack, traps focus, and calls the provided no-op `onClose`.
3. **No other dialog implementations exist**:
   A search across the entire codebase confirmed that only `Sheet`, `Modal`, `ConfirmDialog`, `OnboardingOverlay`, and `CommandPalette` render overlay dialogs.

---

## 4. Conclusion & Exact Code Changes for Worker M2

### 4.1 Implementation Scope
A single file modification to `apps/web/src/ui/dialogA11y.ts` will resolve all 3 failing stress tests while preserving all 285 passing tests across the monorepo.

### 4.2 Exact Code for `apps/web/src/ui/dialogA11y.ts`

Replace the entirety of `apps/web/src/ui/dialogA11y.ts` with the following clean, typed implementation:

```typescript
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"]):not([aria-hidden="true"])',
  'button:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])',
  'input:not([disabled]):not([tabindex="-1"]):not([type="hidden"]):not([aria-hidden="true"])',
  'select:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])',
  'textarea:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])',
  '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])'
].join(", ");

function isFocusable(el: HTMLElement): boolean {
  if (el.getAttribute("tabindex") === "-1" || el.getAttribute("aria-hidden") === "true") {
    return false;
  }
  if ("disabled" in el && (el as HTMLButtonElement | HTMLInputElement).disabled) {
    return false;
  }
  return true;
}

interface ActiveOverlayEntry {
  id: number;
  panelRef: RefObject<HTMLElement | null>;
}

let overlayIdCounter = 0;
const activeOverlayStack: ActiveOverlayEntry[] = [];

function isTopmostOverlay(
  instanceId: number,
  panelRef: RefObject<HTMLElement | null>
): boolean {
  if (typeof document === "undefined") {
    return true;
  }

  // 1. Guard: if CommandPalette is open and this dialog is not inside it, ignore Escape and Tab
  const paletteBackdrop = document.querySelector(".palette-backdrop");
  if (paletteBackdrop && (!panelRef.current || !panelRef.current.closest(".palette-backdrop"))) {
    return false;
  }

  // 2. Guard: if this dialog contains another active dialog inside its own panel (e.g. ConfirmDialog in Sheet)
  if (panelRef.current) {
    const nestedDialog = panelRef.current.querySelector(
      '.sheet, .modal-panel, .onboarding-panel, [aria-modal="true"]'
    );
    if (nestedDialog) {
      return false;
    }
  }

  // 3. Prune disconnected nodes from the stack
  for (let i = activeOverlayStack.length - 1; i >= 0; i--) {
    const entry = activeOverlayStack[i];
    if (entry.panelRef.current && !document.contains(entry.panelRef.current)) {
      activeOverlayStack.splice(i, 1);
    }
  }

  if (activeOverlayStack.length === 0) {
    return true;
  }

  const topEntry = activeOverlayStack[activeOverlayStack.length - 1];
  return topEntry.id === instanceId;
}

export function useDialogA11y(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>
) {
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const instanceIdRef = useRef<number>(0);

  if (instanceIdRef.current === 0) {
    instanceIdRef.current = ++overlayIdCounter;
  }
  const instanceId = instanceIdRef.current;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Maintain active overlay stack
  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const existingIdx = activeOverlayStack.findIndex((item) => item.id === instanceId);
    if (existingIdx !== -1) {
      activeOverlayStack.splice(existingIdx, 1);
    }
    activeOverlayStack.push({ id: instanceId, panelRef });

    return () => {
      const idx = activeOverlayStack.findIndex((item) => item.id === instanceId);
      if (idx !== -1) {
        activeOverlayStack.splice(idx, 1);
      }
    };
  }, [open, instanceId, panelRef]);

  // Track active element while dialog is closed
  useEffect(() => {
    if (!open) {
      const handleFocus = () => {
        const active = document.activeElement as HTMLElement | null;
        if (active && active !== document.body && (!panelRef.current || !panelRef.current.contains(active))) {
          triggerElementRef.current = active;
        }
      };
      handleFocus();
      document.addEventListener("focusin", handleFocus);
      return () => document.removeEventListener("focusin", handleFocus);
    }
  }, [open, panelRef]);

  // Capture active element if opened before focus listener caught it
  useLayoutEffect(() => {
    if (open) {
      const active = document.activeElement as HTMLElement | null;
      if (active && active !== document.body && (!panelRef.current || !panelRef.current.contains(active))) {
        triggerElementRef.current = active;
      }
    }
  }, [open, panelRef]);

  // Initial focus and focus restoration
  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (!panelRef.current) return;

      const active = document.activeElement;
      // If focus is already inside the panel (e.g. child has autoFocus), do not steal it
      if (active && panelRef.current.contains(active) && active !== panelRef.current) {
        return;
      }

      // If an element explicitly requests autofocus, prioritize it
      const autofocusEl = panelRef.current.querySelector<HTMLElement>("[autofocus], [data-autofocus]");
      if (autofocusEl && isFocusable(autofocusEl)) {
        autofocusEl.focus();
        return;
      }

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter(isFocusable);

      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        if (!panelRef.current.hasAttribute("tabindex")) {
          panelRef.current.setAttribute("tabindex", "-1");
        }
        panelRef.current.focus();
      }
    }, 10);

    return () => {
      window.clearTimeout(timeout);
      if (triggerElementRef.current) {
        const toRestore = triggerElementRef.current;
        triggerElementRef.current = null;
        if (toRestore && typeof toRestore.focus === "function" && document.contains(toRestore)) {
          toRestore.focus();
        }
      }
    };
  }, [open, panelRef]);

  // Tab trapping and Escape key handling
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!isTopmostOverlay(instanceId, panelRef)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      if (!isTopmostOverlay(instanceId, panelRef)) {
        return;
      }

      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter(isFocusable);

      if (focusables.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (!panelRef.current.contains(active)) {
        event.preventDefault();
        if (event.shiftKey) {
          last.focus();
        } else {
          first.focus();
        }
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, instanceId, panelRef]);
}
```

---

## 5. Verification Method

### 5.1 Verification Commands
Once Worker M2 applies the changes to `apps/web/src/ui/dialogA11y.ts`, run:

```powershell
# 1. Run the empirical stress test suite (Target: 20 passed, 0 failed):
npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx

# 2. Run all related dialog, navigation, and keyboard workflow tests:
npx vitest run apps/web/src/test/Sheet.test.tsx apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/challenger-m2-stress.test.tsx apps/web/src/test/App.test.tsx

# 3. Run the full repository test suite (Target: 288 passed, 0 failed across all 43 files):
npx vitest run

# 4. Run typecheck and linting:
npm run typecheck
npm run lint
```

### 5.2 Invalidation Conditions
The fix is invalid if:
- Pressing Escape while `ConfirmDialog` is open closes both `ConfirmDialog` and the parent `Sheet`.
- Pressing Escape while `CommandPalette` is open closes the underlying `Sheet`.
- Pressing Escape on stacked sibling modals closes both modals.
- Tab key in nested overlays escapes to the background sheet or page trigger.
- Any existing test in `Sheet.test.tsx`, `CommandPalette.test.tsx`, `App.test.tsx`, or `challenger-m2-stress.test.tsx` fails.
