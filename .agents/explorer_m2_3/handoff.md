# Explorer M2-3 Handoff Report: Feature 10 (Focus Management, Focus Trapping & Escape Restoration)

**Executive Summary**: While `Sheet` and `Modal` integrate a custom `useDialogA11y` hook and `CommandPalette` utilizes `cmdk` on top of Radix Dialog, neither implementation reliably restores focus to the previously focused trigger on close, and `Sheet` actively steals focus from autofocus inputs. Concrete code fixes are detailed below for the Worker to achieve strict WCAG AA / Inkline compliance for Feature 10.

---

## 1. Observation

### 1.1 `apps/web/src/ui/Overlay.tsx`
- **Lines 13-19 (`Sheet`)**:
  ```tsx
  export function Sheet({ open, title, onClose, children }: SheetProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    useDialogA11y(open, onClose, panelRef);

    if (!open) {
      return null;
    }
  ```
- **Lines 29-48 (`Sheet` JSX)**:
  ```tsx
  <motion.div
    ref={panelRef}
    className="sheet"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    onClick={(event) => event.stopPropagation()}
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 420, damping: 30 }}
  >
    <span className="sheet-handle" aria-hidden="true" />
    <header className="sheet-head">
      <h2>{title}</h2>
      <button className="icon-toggle" type="button" aria-label="Close" onClick={onClose}>
        <X size={16} weight="bold" />
      </button>
    </header>
    {children}
  </motion.div>
  ```
- **Lines 59-81 (`Modal`)**:
  ```tsx
  export function Modal({ title, onClose, children }: ModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    useDialogA11y(true, onClose ?? (() => undefined), panelRef);

    return (
      <div
        className="modal-backdrop"
        onClick={onClose}
        role="presentation"
      >
        <div
          ref={panelRef}
          className="modal-panel ik-card"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    );
  }
  ```
- **Observation**: `Sheet` and `Modal` delegate 100% of focus management, focus trapping, and Escape key handling to `useDialogA11y` in `apps/web/src/ui/dialogA11y.ts`. Neither component renders a standalone `FocusTrap` wrapper.

---

### 1.2 `apps/web/src/ui/dialogA11y.ts`
- **Lines 3-4 (Selector)**:
  ```ts
  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  ```
- **Lines 6-21 (Focus Initialization & Cleanup Effect)**:
  ```ts
  export function useDialogA11y(open: boolean, onClose: () => void, panelRef: RefObject<HTMLElement | null>) {
    useEffect(() => {
      if (!open) {
        return;
      }
      const previouslyFocused = document.activeElement as HTMLElement | null;
      const timeout = window.setTimeout(() => {
        const focusables = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
        focusables[0]?.focus();
      }, 10);

      return () => {
        window.clearTimeout(timeout);
        previouslyFocused?.focus?.();
      };
    }, [open, panelRef]);
  ```
- **Lines 23-56 (Keydown Listener for Escape and Tab Trapping)**:
  ```ts
    useEffect(() => {
      if (!open) {
        return;
      }
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose();
          return;
        }
        if (event.key !== "Tab" || !panelRef.current) {
          return;
        }
        const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusables.length === 0) {
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (!panelRef.current.contains(active)) {
          event.preventDefault();
          first.focus();
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
    }, [open, onClose, panelRef]);
  ```

---

### 1.3 `apps/web/src/views/CommandPalette.tsx`
- **Lines 78-95**:
  ```tsx
  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      className="palette-backdrop fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[min(14vh,130px)]"
      shouldFilter={false}
      label="Command palette"
    >
      <div className="palette-panel">
        <Command.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Type a command or search..."
          className="palette-input"
        />
  ```
- **Internal implementation of `Command.Dialog` in `node_modules/cmdk/dist/index.mjs` (line 1)**:
  ```js
  xe = t.forwardRef((r, o) => {
    let { open: n, onOpenChange: u, overlayClassName: c, contentClassName: d, container: f, ...p } = r;
    return t.createElement(
      w.Root,
      { open: n, onOpenChange: u },
      t.createElement(
        w.Portal,
        { container: f },
        t.createElement(w.Overlay, { "cmdk-overlay": "", className: c }),
        t.createElement(w.Content, { "aria-label": r.label, "cmdk-dialog": "", className: d },
          t.createElement(me, { ref: o, ...p })
        )
      )
    );
  });
  ```
- **Internal implementation of Radix Dialog close focus in `node_modules/@radix-ui/react-dialog/dist/index.mjs` (lines 148-151)**:
  ```js
  onCloseAutoFocus: composeEventHandlers(props.onCloseAutoFocus, (event) => {
    event.preventDefault();
    context.triggerRef.current?.focus();
  }),
  ```

---

### 1.4 Test Suite Expectations (`e2e-inkline.test.tsx` and `Sheet.test.tsx`)
- `apps/web/src/test/e2e-inkline.test.tsx`:
  - **T1.44 (line 958)**: Asserts `Ctrl+K` keydown on `document.body` displays the search input `screen.findByPlaceholderText("Type a command or search...")`.
  - **T1.46-T1.50 (lines 988-1045)**:
    - Asserts Sheet renders title and body when `open={true}`.
    - Asserts `fireEvent.keyDown(document.body, { key: "Escape" })` calls `onClose`.
    - Asserts Close button click calls `onClose`.
    - Asserts Sheet returns `null` when `open={false}`.
    - Asserts `.sheet` has Level 4 elevation class.
  - **T4.5 (lines 1624-1655)**:
    - Opens palette via `Ctrl+K`.
    - Closes palette via `Escape` on `paletteInput`.
    - Opens quick capture via `N` on `document.body`.
    - Closes quick capture via `Escape` on `document.body`.
- `apps/web/src/test/Sheet.test.tsx`:
  - Asserts rendering, close button click, Escape key press on `document`, and `open={false}` returning null.
- **Observation**: Neither test suite currently asserts:
  1. Tab / Shift+Tab cycling or boundary trapping within `Sheet` or `Modal`.
  2. Element focus restoration upon dismissal (Escape, backdrop click, or close button).
  3. `autoFocus` preservation inside `TaskComposer` upon `Sheet` opening.
  4. Backdrop click dismissal on `CommandPalette`.

---

## 2. Logic Chain

### 2.1 The Focus Restoration Breakdown in `Sheet` & `Modal` (`dialogA11y.ts`)
1. **Observation 1.2 line 11**: `previouslyFocused` is read inside `useEffect`:
   ```ts
   const previouslyFocused = document.activeElement as HTMLElement | null;
   ```
2. In React 18 & 19, child components mount and their `autoFocus` attributes (e.g. `TaskComposer.tsx:102 <TextInput autoFocus ... />`) are processed during DOM insertion before `useEffect` executes.
3. Therefore, when `useDialogA11y`'s `useEffect` executes, `document.activeElement` is ALREADY the `<TextInput>` inside `TaskComposer` (inside `panelRef.current`).
4. `previouslyFocused` captures this inner input instead of the external trigger button (e.g., the "Capture a task" button or Kanban task card).
5. When the sheet is closed, `previouslyFocused?.focus?.()` attempts to focus the inner input which is being unmounted and removed from the DOM.
6. The browser drops focus to `document.body`. The actual trigger button that opened the sheet never gets restored.

### 2.2 The Initial Focus Hijacking in `Sheet` (`dialogA11y.ts` & `Overlay.tsx`)
1. **Observation 1.1 line 43**: In `Sheet`, `<button className="icon-toggle" type="button" aria-label="Close" onClick={onClose}>` appears in `<header className="sheet-head">`, which precedes `{children}`.
2. **Observation 1.2 line 14-15**: 10ms after mounting, `useDialogA11y` queries `FOCUSABLE` elements and runs `focusables[0]?.focus()`.
3. Because the Close "X" button is the first focusable element in DOM order, `focusables[0]` is ALWAYS the Close button.
4. When `TaskComposer` mounts with `<TextInput autoFocus />`, the user expects to immediately begin typing their task title. 10ms later, `focusables[0]?.focus()` yanks focus to the Close button, interrupting the typing flow.
5. If `panelRef.current` already contains the active element (or an element with `autoFocus`), `useDialogA11y` must not override it.

### 2.3 The Focus Restoration Breakdown in `CommandPalette.tsx`
1. **Observation 1.3**: `CommandPalette` uses `cmdk`'s `Command.Dialog`.
2. As observed in `node_modules/cmdk/dist/index.mjs`, `Command.Dialog` renders `@radix-ui/react-dialog`'s `Content` without a `Dialog.Trigger`.
3. As observed in `node_modules/@radix-ui/react-dialog/dist/index.mjs` lines 148-151, Radix Dialog's default `onCloseAutoFocus` executes:
   ```js
   event.preventDefault();
   context.triggerRef.current?.focus();
   ```
4. Because cmdk does not register a `Dialog.Trigger`, `context.triggerRef.current` is `null`.
5. Because `event.preventDefault()` was called, browser default restoration is suppressed, and `null?.focus()` is a no-op.
6. When `CommandPalette` closes (via `Escape`, click outside, or item selection), focus is completely lost and reverts to `document.body`.
7. `CommandPalette.tsx` must explicitly track `document.activeElement` before opening and restore it on close.

### 2.4 Focus Trap Selector Holes (`dialogA11y.ts`)
1. **Observation 1.2 line 3-4**: The `FOCUSABLE` selector is:
   `'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'`
2. Notice that `button:not([disabled])` matches `<button tabindex="-1">`. If an author explicitly gives a button `tabIndex={-1}`, it is still matched by `button:not([disabled])`.
3. Non-tabbable controls (`tabindex="-1"`) and `aria-hidden="true"` controls are incorrectly included in the Tab cycle.
4. If a dialog has zero focusables (e.g. an informational alert panel), lines 36-38 do an early return without `event.preventDefault()`, allowing Tab focus to leak out into the underlying page.

### 2.5 Escape Key Propagation (`dialogA11y.ts`)
1. **Observation 1.2 line 28-31**:
   ```ts
   if (event.key === "Escape") {
     onClose();
     return;
   }
   ```
2. Neither `event.preventDefault()` nor `event.stopPropagation()` is called.
3. If an overlay is stacked or nested (e.g., `ConfirmDialog` on top of `TaskEditor`), the unstopped `Escape` key event bubbles through `document`, potentially dismissing both overlays simultaneously.

### 2.6 Backdrop Click Dismissal in `CommandPalette.tsx`
1. **Observation 1.3**: In `CommandPalette.tsx`:
   ```tsx
   <Command.Dialog
     open={open}
     className="palette-backdrop fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[min(14vh,130px)]"
     ...
   >
     <div className="palette-panel">
   ```
2. In cmdk, props passed to `Command.Dialog` (other than `overlayClassName`, `contentClassName`, `container`) are forwarded to `div[cmdk-root]`, which sits INSIDE Radix's `Dialog.Content`.
3. Because `palette-backdrop` is inside `Dialog.Content`, clicks anywhere on the backdrop are considered clicks INSIDE `Dialog.Content` by Radix.
4. Radix does not trigger `onPointerDownOutside`, and `CommandPalette.tsx` has no click handler.
5. Consequently, clicking on the dark backdrop around the palette panel does nothing—the palette does not dismiss on backdrop click.

---

## 3. Caveats

1. **jsdom Limitations in Vitest**:
   - In jsdom, `element.offsetWidth`, `element.offsetHeight`, and `element.getClientRects()` always return `0`. Visibility checks using bounding box dimensions must NOT be used directly in `useDialogA11y` without a fallback, or unit tests in jsdom will treat all elements as invisible and break focus trapping.
2. **Onboarding Overlay**:
   - `apps/web/src/views/OnboardingOverlay.tsx` uses `useDialogA11y(true, () => undefined, panelRef)`. By design, first-run onboarding is mandatory and does not close on `Escape`. Any modifications to `useDialogA11y` must preserve this requirement when `onClose` is a no-op.
3. **Double Renders & Timing**:
   - Focus restoration must be scheduled with `requestAnimationFrame` or `setTimeout(..., 0)` to ensure that React 19's unmount/commit phase has completed before calling `.focus()` on the trigger element.

---

## 4. Conclusion & Recommended Code Changes for Worker

### Recommended Changes for Worker

#### File 1: `apps/web/src/ui/dialogA11y.ts`
Replace `apps/web/src/ui/dialogA11y.ts` with the robust implementation below:

```ts
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

export function useDialogA11y(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>
) {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // 1. Capture trigger element BEFORE dialog mounts children into focus
  useLayoutEffect(() => {
    if (open) {
      const active = document.activeElement as HTMLElement | null;
      // Only capture if active element is OUTSIDE this panel
      if (active && (!panelRef.current || !panelRef.current.contains(active))) {
        previouslyFocusedRef.current = active;
      }
    }
  }, [open, panelRef]);

  // 2. Initial focus and focus restoration
  useEffect(() => {
    if (!open) {
      if (previouslyFocusedRef.current) {
        const toRestore = previouslyFocusedRef.current;
        previouslyFocusedRef.current = null;
        const frame = requestAnimationFrame(() => {
          if (toRestore && typeof toRestore.focus === "function" && document.contains(toRestore)) {
            toRestore.focus();
          }
        });
        return () => cancelAnimationFrame(frame);
      }
      return;
    }

    const timeout = window.setTimeout(() => {
      if (!panelRef.current) return;

      const active = document.activeElement;
      // If focus is already inside the panel (e.g. child has autoFocus), keep it
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
      if (previouslyFocusedRef.current) {
        const toRestore = previouslyFocusedRef.current;
        previouslyFocusedRef.current = null;
        if (toRestore && typeof toRestore.focus === "function" && document.contains(toRestore)) {
          toRestore.focus();
        }
      }
    };
  }, [open, panelRef]);

  // 3. Tab trapping & Escape to close
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
  }, [open, panelRef]);
}
```

---

#### File 2: `apps/web/src/views/CommandPalette.tsx`
Update `CommandPalette.tsx`:
1. Add `previousActiveElementRef` to record `document.activeElement` before opening and restore it on close:
   ```tsx
   const previousActiveElementRef = useRef<HTMLElement | null>(null);

   useEffect(() => {
     if (open) {
       const active = document.activeElement as HTMLElement | null;
       if (active && !active.closest("[cmdk-root]")) {
         previousActiveElementRef.current = active;
       }
     } else {
       if (previousActiveElementRef.current) {
         const toRestore = previousActiveElementRef.current;
         previousActiveElementRef.current = null;
         requestAnimationFrame(() => {
           if (toRestore && typeof toRestore.focus === "function" && document.contains(toRestore)) {
             toRestore.focus();
           }
         });
       }
     }
   }, [open]);
   ```
2. Provide `handleOpenChange` to clear query on close:
   ```tsx
   const handleOpenChange = (nextOpen: boolean) => {
     setOpen(nextOpen);
     if (!nextOpen) {
       setQuery("");
     }
   };
   ```
3. Add backdrop click dismissal to `Command.Dialog`:
   ```tsx
   <Command.Dialog
     open={open}
     onOpenChange={handleOpenChange}
     className="palette-backdrop fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[min(14vh,130px)]"
     shouldFilter={false}
     label="Command palette"
     onClick={(event) => {
       if (event.target === event.currentTarget) {
         handleOpenChange(false);
       }
     }}
   >
   ```

---

#### File 3: `apps/web/src/ui/Overlay.tsx`
Ensure `Modal` and `Sheet` panels carry `tabIndex={-1}` for resilient screen reader and fallback panel focusing:
- In `Sheet`:
  ```tsx
  <motion.div
    ref={panelRef}
    className="sheet"
    role="dialog"
    tabIndex={-1}
    aria-modal="true"
    aria-label={title}
  ```
- In `Modal`:
  ```tsx
  <div
    ref={panelRef}
    className="modal-panel ik-card"
    role="dialog"
    tabIndex={-1}
    aria-modal="true"
    aria-label={title}
  ```

---

#### File 4: Tests to Add in `apps/web/src/test/Sheet.test.tsx`
Add explicit tests verifying focus trapping, focus restoration, and autofocus preservation:
```tsx
it("traps focus between first and last focusable element on Tab and Shift+Tab", () => {
  render(
    <Sheet open={true} title="Trap Sheet" onClose={vi.fn()}>
      <input data-testid="input-1" />
      <button data-testid="btn-2">Action</button>
    </Sheet>
  );

  const closeBtn = screen.getByRole("button", { name: "Close" });
  const input1 = screen.getByTestId("input-1");
  const btn2 = screen.getByTestId("btn-2");

  // Tab from last element wraps to first (close button)
  btn2.focus();
  expect(document.activeElement).toBe(btn2);
  fireEvent.keyDown(document, { key: "Tab" });
  expect(document.activeElement).toBe(closeBtn);

  // Shift+Tab from first element wraps to last
  closeBtn.focus();
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(btn2);
});

it("restores focus to previous active element upon Escape dismissal", async () => {
  function TestWrapper() {
    const [open, setOpen] = React.useState(false);
    return (
      <div>
        <button data-testid="trigger-btn" onClick={() => setOpen(true)}>Open Sheet</button>
        <Sheet open={open} title="Restoration Sheet" onClose={() => setOpen(false)}>
          <input data-testid="inner-input" />
        </Sheet>
      </div>
    );
  }

  render(<TestWrapper />);
  const trigger = screen.getByTestId("trigger-btn");
  trigger.focus();
  expect(document.activeElement).toBe(trigger);

  fireEvent.click(trigger);
  expect(screen.getByText("Restoration Sheet")).toBeInTheDocument();

  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() => {
    expect(screen.queryByText("Restoration Sheet")).not.toBeInTheDocument();
  });
  expect(document.activeElement).toBe(trigger);
});
```

---

## 5. Verification Method

1. **Automated Vitest Verification**:
   ```powershell
   npx vitest run apps/web/src/test/Sheet.test.tsx apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/e2e-inkline.test.tsx
   ```
   - Verifies that all existing tests (T1.44, T1.46-T1.50, T4.5) pass 100%.
   - Verifies the new focus trap and restoration tests pass.
2. **Full Monorepo Test & Typecheck**:
   ```powershell
   npm run typecheck
   npm run lint
   npm run test
   ```
3. **Invalidation Conditions**:
   - If pressing Tab inside an open `Sheet` moves focus to elements outside `.sheet` (e.g. background links or buttons).
   - If pressing Escape closes a modal/sheet and `document.activeElement` becomes `document.body` instead of the trigger button.
   - If pressing `N` to open quick capture leaves focus on the Close button rather than the Title input.
