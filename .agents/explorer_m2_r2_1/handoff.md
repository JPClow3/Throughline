# Explorer Report: M2-R2-1 — Dialog Stacking & Escape Dismissal Investigation

**Agent**: `explorer_m2_r2_1`  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\explorer_m2_r2_1`  
**Date**: 2026-09-10T12:19:00Z  
**Target File**: `apps/web/src/ui/dialogA11y.ts`  

---

## 1. Observation

Direct code examination and automated test suite execution within `apps/web` revealed the following exact facts and reproduction data:

### 1.1 Verbatim Test Failures in Challenger Stress Harness
Running `npm test` (or `npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx`) produces **3 failed tests** out of 20 tests in `apps/web/src/test/challenger-m2-dialog-stress.test.tsx`:

#### Failure 1: Nested Modal inside Sheet (e.g. `ConfirmDialog` in `TaskEditor`)
- **Location**: `apps/web/src/test/challenger-m2-dialog-stress.test.tsx:382-426`
- **Verbatim Error**:
  ```
  FAIL  apps/web/src/test/challenger-m2-dialog-stress.test.tsx > Challenger M2-2: Dialog & Overlay Empirical Stress Tests > 4. Nested & Stacked Overlays Edge Cases > STRESS TEST: Nested Modal inside Sheet (e.g. ConfirmDialog in TaskEditor)
  AssertionError: expected false to be true // Object.is equality

  - Expected
  + Received

  - true
  + false

   ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:425:30
      423|       const confirmDismissed = screen.queryByRole("dialog", { name: "Confirm Delete" }) === null;
      424|       const sheetStillOpen = screen.queryByText("Parent Sheet") !== null;
      425|       expect(sheetStillOpen).toBe(true);
  ```

#### Failure 2: CommandPalette opened while Sheet is open
- **Location**: `apps/web/src/test/challenger-m2-dialog-stress.test.tsx:478-522`
- **Verbatim Error**:
  ```
  FAIL  apps/web/src/test/challenger-m2-dialog-stress.test.tsx > Challenger M2-2: Dialog & Overlay Empirical Stress Tests > 4. Nested & Stacked Overlays Edge Cases > STRESS TEST: CommandPalette opened while Sheet is open, pressing Escape
  AssertionError: expected false to be true // Object.is equality

  - Expected
  + Received

  - true
  + false

   ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:520:25
      518|       const paletteClosed = screen.queryByPlaceholderText("Type a command or search...") === null;
      519|       const sheetOpen = screen.queryByText("Open Task Sheet") !== null;
      520|       expect(sheetOpen).toBe(true);
  ```

#### Failure 3: Stacked Modal on Modal
- **Location**: `apps/web/src/test/challenger-m2-dialog-stress.test.tsx:524-563`
- **Verbatim Error**:
  ```
  FAIL  apps/web/src/test/challenger-m2-dialog-stress.test.tsx > Challenger M2-2: Dialog & Overlay Empirical Stress Tests > 4. Nested & Stacked Overlays Edge Cases > STRESS TEST: Stacked Modal on Modal, pressing Escape
  AssertionError: expected false to be true // Object.is equality

  - Expected
  + Received

  - true
  + false

   ❯ apps/web/src/test/challenger-m2-dialog-stress.test.tsx:560:26
      558|       const modalBClosed = screen.queryByRole("dialog", { name: "Modal B" }) === null;
      559|       const modalAOpen = screen.queryByRole("dialog", { name: "Modal A" }) !== null;
      560|       expect(modalAOpen).toBe(true);
  ```

### 1.2 Current Keydown Handler in `dialogA11y.ts`
In `apps/web/src/ui/dialogA11y.ts:108-157`:
```typescript
  // Tab trapping and Escape key handling
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

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }
      ...
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, panelRef]);
```

### 1.3 Overlay Stacking Context in `styles.css`
In `apps/web/src/styles.css:121-124`:
```css
  --z-overlay-sheet: 100;
  --z-overlay-modal: 110;
  --z-overlay-palette: 120;
  --z-overlay-onboarding: 150;
```
And in `apps/web/src/views/CommandPalette.tsx:104-115`:
```tsx
    <Command.Dialog
      open={open}
      onOpenChange={handleOpenChange}
      className="palette-backdrop fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[min(14vh,130px)]"
      shouldFilter={false}
      label="Command palette"
```

---

## 2. Logic Chain

### 2.1 Why `event.stopPropagation()` Failed
1. **DOM Event Model Specifics**:
   In the W3C/WHATWG DOM Event standard, `event.stopPropagation()` halts propagation across different DOM nodes along the event dispatch path (preventing bubbling to parent/ancestor nodes or traversal down capture paths).
2. **Sibling Listeners on the Same Target**:
   When multiple components or hooks register independent listeners directly on the same DOM node (`document.addEventListener("keydown", onKey)`), those listeners are *sibling listeners* on that single target. `event.stopPropagation()` **does NOT prevent other listeners registered on that same target node from running**.
3. **Execution Order is FIFO**:
   DOM event listeners on the same node execute strictly in the chronological order of their registration (`addEventListener` invocation order).
4. **Parent Precedes Child in Registration**:
   In nested/stacked overlay workflows (e.g. `Sheet` opens a `ConfirmDialog`, or `Sheet` is open when `CommandPalette` opens, or `Modal A` opens `Modal B`), the parent overlay was opened first. Consequently, the parent overlay registered its `keydown` listener on `document` *before* the child overlay.
5. **The Catastrophic Double-Close Sequence**:
   When the user presses `Escape`:
   - Step A: The event is dispatched to `document`.
   - Step B: The parent's listener fires first because it was registered first. Calling `event.stopPropagation()` does nothing to stop sibling listeners on `document`. The parent calls `onCloseRef.current()`, immediately closing the parent dialog!
   - Step C: The child's listener fires second. The child calls `onCloseRef.current()`, closing the child dialog.
   - Result: Both overlays close simultaneously. For example, attempting to cancel "Confirm Delete" closes the underlying `TaskEditor`, destroying unsaved user edits.
6. **Why `event.stopImmediatePropagation()` Alone Is Insufficient**:
   While `event.stopImmediatePropagation()` does cancel sibling listeners on the same node, it only cancels listeners that are queued *after* the current listener. Because the parent listener executes *first* in FIFO order, calling `event.stopImmediatePropagation()` in the parent would cause the parent to close and swallow the event, starving the child entirely.
7. **Conclusion on Mechanism**:
   Event listener registration order is the reverse of visual/interaction stacking (LIFO). Therefore, relying solely on DOM event propagation primitives cannot solve stacked overlay dismissal. A formal LIFO overlay registry is required.

### 2.2 Architectural Comparison: Module-Level Stack vs React Context
| Criterion | Module-Level Stack (`dialogStack`) | React Context (`DialogContext`) |
| :--- | :--- | :--- |
| **Component Tree Coupling** | **Zero**. Works with any JSX hierarchy. | **High**. Requires `<DialogProvider>` wrapping the entire app tree. |
| **Test Suite Compatibility** | **100% Backward Compatible**. Standalone tests (e.g. `<Sheet open={true} ... />`) continue to pass without changes. | **Breaks Standalone Tests**. All unit tests rendering `<Sheet>` or `<Modal>` would throw or fail unless wrapped in a Provider fixture. |
| **Runtime Overhead** | Minimal array operations (`push`, `splice`). | React Context re-renders, Provider nesting. |
| **SSR / Hydration Safety** | Safe with `typeof document !== "undefined"` guards. | Safe, but unnecessary ceremony. |

**Verdict**: A module-level LIFO stack in `dialogA11y.ts` is the superior architectural choice.

### 2.3 Registration & Stacking Protocol
1. **Unique Instance Identification**:
   Each `useDialogA11y` invocation obtains a stable instance identifier via React's standard `useId()` hook:
   ```typescript
   const dialogId = useId();
   ```
2. **Stack Lifecycle**:
   When `open` is `true`, an entry `{ id: dialogId, panelRef }` is pushed onto `dialogStack`. When `open` becomes `false` or the component unmounts, the entry is removed via cleanup in `useEffect`.
3. **Stale / Disconnected Node Purging**:
   To prevent memory leaks or orphaned references across unit test executions, `purgeDisconnectedEntries()` prunes any entries whose `panelRef.current` is not attached to the current `document` (`!document.contains(el)`).
4. **Hierarchy & Precedence Resolution (`isTopmostOverlay`)**:
   A dialog determines if it is the topmost active overlay via three prioritized checks:
   - **Step 1 (CommandPalette Precedence)**: If `.palette-backdrop` exists in the DOM and the current dialog is not inside it, `CommandPalette` (`z-index: 120`) is active above all sheets and modals. Return `false`.
   - **Step 2 (DOM Containment)**: If another active dialog's panel is a descendant inside this dialog's panel (`currentPanel.contains(entry.panelRef.current)`), this dialog is an underlying container (e.g. `Sheet` containing `ConfirmDialog`). Return `false`.
   - **Step 3 (LIFO Stack Order)**: Check if `dialogStack[dialogStack.length - 1]?.id === dialogId`. Return `true` if this dialog is at the top of the stack.
5. **Full Inertness for Non-Topmost Dialogs**:
   Placing `if (!isTopmostOverlay(dialogId, panelRef)) return;` at the entry of `onKey` ensures that background dialogs ignore **both** `Escape` (preventing double-close) and `Tab` (preventing focus theft from child overlays).

---

## 3. Caveats

- **Read-Only Explorer Constraint**: In accordance with the Explorer role guidelines, no source files in `apps/` were modified. Complete drop-in code and patch files have been placed in `.agents/explorer_m2_r2_1/`.
- **CommandPalette Integration**: `CommandPalette` uses `cmdk`'s `Command.Dialog`, which handles its own `Escape` keydown listeners. By having `dialogA11y.ts` recognize the `.palette-backdrop` presence and yield `Escape`, `CommandPalette` dismisses cleanly while underlying sheets remain open without modifying `CommandPalette.tsx`.
- **Screen Reader Support**: JSDOM does not calculate full accessibility tree virtual cursor traversal, but `aria-modal="true"` and `role="dialog"` attributes remain properly applied on all panels.

---

## 4. Conclusion & Recommended Code Changes

### Exact Proposed Changes for Worker M2

The Worker can apply the changes using the provided patch `H:\Code\Pessoais\Throughline\.agents\explorer_m2_r2_1\dialogA11y.patch` or replace `apps/web/src/ui/dialogA11y.ts` with `H:\Code\Pessoais\Throughline\.agents\explorer_m2_r2_1\proposed_dialogA11y.ts`.

#### Code Comparison in `apps/web/src/ui/dialogA11y.ts`

**Before**:
```typescript
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
...
export function useDialogA11y(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>
) {
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
...
  // Tab trapping and Escape key handling
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
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, panelRef]);
}
```

**After**:
```typescript
import { useEffect, useId, useLayoutEffect, useRef, type RefObject } from "react";

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

export type DialogStackEntry = {
  id: string;
  panelRef: RefObject<HTMLElement | null>;
};

export const dialogStack: DialogStackEntry[] = [];

function purgeDisconnectedEntries(): void {
  if (typeof document === "undefined") return;
  for (let i = dialogStack.length - 1; i >= 0; i--) {
    const el = dialogStack[i].panelRef.current;
    if (!el || !document.contains(el)) {
      dialogStack.splice(i, 1);
    }
  }
}

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
}

export function useDialogA11y(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>
) {
  const dialogId = useId();
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

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

  // Overlay stack registration, Tab trapping, and Escape key handling
  useEffect(() => {
    if (!open) {
      return;
    }

    const entry: DialogStackEntry = { id: dialogId, panelRef };
    dialogStack.push(entry);

    const onKey = (event: KeyboardEvent) => {
      // Non-topmost overlays must ignore all keydown interactions (Escape and Tab trapping)
      if (!isTopmostOverlay(dialogId, panelRef)) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
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
    return () => {
      document.removeEventListener("keydown", onKey);
      for (let i = dialogStack.length - 1; i >= 0; i--) {
        if (dialogStack[i].id === dialogId) {
          dialogStack.splice(i, 1);
        }
      }
    };
  }, [open, dialogId, panelRef]);
}
```

---

## 5. Verification Method

### 5.1 Verification Commands
The Worker can verify this fix by executing the following commands in the workspace root:

1. **Targeted Challenger Stress Test**:
   ```powershell
   npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx
   ```
   **Expected Result**: All 20 tests pass (20/20, 100%), including:
   - `STRESS TEST: Nested Modal inside Sheet (e.g. ConfirmDialog in TaskEditor)`: PASS
   - `STRESS TEST: CommandPalette opened while Sheet is open, pressing Escape`: PASS
   - `STRESS TEST: Stacked Modal on Modal, pressing Escape`: PASS
   - `STRESS TEST: Focus trapping within topmost overlay when nested`: PASS

2. **Milestone 2 Component Suites**:
   ```powershell
   npx vitest run apps/web/src/test/Sheet.test.tsx apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/AppShell.test.tsx
   ```
   **Expected Result**: All tests pass (100%).

3. **Full Monorepo Test Suite**:
   ```powershell
   npm test
   ```
   **Expected Result**: 43 test files passed (43/43), 288 tests passed (288/288), 0 failures.

4. **TypeScript and Lint Checks**:
   ```powershell
   npm run typecheck
   npm run lint
   ```
   **Expected Result**: 0 errors.

### 5.2 Invalidation Conditions
- If pressing `Escape` when `ConfirmDialog` is open inside `Sheet` results in the parent `Sheet` closing (`sheetStillOpen === false`).
- If pressing `Escape` when `CommandPalette` is open while `Sheet` is visible results in the `Sheet` closing (`sheetOpen === false`).
- If pressing `Escape` when `Modal B` is stacked on `Modal A` results in `Modal A` closing (`modalAOpen === false`).
- If tabbing inside a nested dialog jumps focus into the underlying parent dialog.
