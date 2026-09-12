# Handoff Report: Global Keyboard Shortcut Isolation for 'n' / 'N'

## 1. Observation

1. **Vitest Failure in STRESS 3.4**:
   Command: `npx vitest run apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx`
   Verbatim output:
   ```
   FAIL  apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx > Tier 5 Adversarial Hardening: UI Press Physics, Focus Trapping & Gesture/Navigation > 3. Keyboard Shortcut Isolation > STRESS 3.4: Typing 'n' or 'N' in a contenteditable element never triggers task composer
   AssertionError: expected true to be false // Object.is equality

   - Expected
   + Received

   - false
   + true

    ❯ apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx:526:39
       524|       const eventN = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
       525|       editable.dispatchEvent(eventN);
       526|       expect(eventN.defaultPrevented).toBe(false);
          |                                       ^
   ```

2. **Test Setup in `apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx` (lines 509–531)**:
   ```typescript
   it("STRESS 3.4: Typing 'n' or 'N' in a contenteditable element never triggers task composer", async () => {
     render(
       <AuthProvider>
         <App />
       </AuthProvider>
     );

     const editable = document.createElement("div");
     editable.contentEditable = "true";
     editable.tabIndex = 0;
     document.body.appendChild(editable);

     editable.focus();
     expect(document.activeElement).toBe(editable);

     const eventN = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
     editable.dispatchEvent(eventN);
     expect(eventN.defaultPrevented).toBe(false);

     expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();

     document.body.removeChild(editable);
   });
   ```

3. **Existing Implementation in `apps/web/src/App.tsx` (lines 311–348)**:
   ```typescript
   // Quick capture: `N` opens the composer (or a new note on Notes) from any
   // planner view, unless the user is typing or a dialog already owns the screen.
   React.useEffect(() => {
     const onKeyDown = (event: KeyboardEvent) => {
       if (event.key !== "n" && event.key !== "N") {
         return;
       }
       if (event.metaKey || event.ctrlKey || event.altKey) {
         return;
       }
       const target = event.target as HTMLElement | null;
       if (target?.isContentEditable || target?.closest("input, textarea, select, [contenteditable='true']")) {
         return;
       }
       const dialogOpen =
         props.commandPaletteOpen ||
         props.composerOpen ||
         props.goalOpen ||
         Boolean(props.editingGoal) ||
         Boolean(props.editingTaskId) ||
         props.cooldownTasks.length > 0 ||
         props.showOnboarding;
       if (dialogOpen) {
         return;
       }
       event.preventDefault();
       void handlePrimaryAction();
     };
     document.addEventListener("keydown", onKeyDown);
     return () => document.removeEventListener("keydown", onKeyDown);
   }, [
     props.commandPaletteOpen,
     props.composerOpen,
     props.goalOpen,
     props.editingGoal,
     props.editingTaskId,
     props.cooldownTasks,
     props.showOnboarding,
     handlePrimaryAction
   ]);
   ```

4. **JSDOM DOM Behavior Verified**:
   When an element has `editable.contentEditable = "true"` set in JSDOM:
   - `editable.isContentEditable` is `undefined` (JSDOM does not implement the standard HTML5 `isContentEditable` getter).
   - `editable.contentEditable` is the string `"true"`.
   - `editable.getAttribute("contenteditable")` is `null` (JSDOM does not automatically reflect the property assignment to the DOM attribute).
   - `editable.closest("[contenteditable='true']")` returns `null` because the attribute `contenteditable` is absent.
   - Consequently, line 320 `target?.isContentEditable || target?.closest("input, textarea, select, [contenteditable='true']")` evaluates to `false` in JSDOM tests, resulting in `event.preventDefault()` being invoked and the task composer opening erroneously.

5. **TypeError Edge Case with Document Target**:
   `target?.closest(...)` throws `TypeError: target.closest is not a function` whenever `event.target` is `Document` (such as global document keyboard events), because optional chaining `?.` only checks for `null` / `undefined`, but `Document` does not implement `Element.prototype.closest`.

---

## 2. Logic Chain

1. **Step 1 (Root Cause Identification)**:
   In test `STRESS 3.4`, `editable.contentEditable = "true"` assigns the IDL property on a `<div>`.
   Because JSDOM does not implement `isContentEditable` (`editable.isContentEditable === undefined`) and does not reflect `contentEditable = "true"` to the `contenteditable` DOM attribute (`editable.getAttribute("contenteditable") === null`), the selector `target?.closest("... [contenteditable='true']")` yields `null`.

2. **Step 2 (Bypass of Input Suppression Guard)**:
   Since both `target?.isContentEditable` and `target?.closest(...)` evaluate to falsy, execution reaches line 334 (`event.preventDefault()`) and line 335 (`void handlePrimaryAction()`). This mutates `eventN.defaultPrevented` to `true`, directly violating the assertion `expect(eventN.defaultPrevented).toBe(false)`.

3. **Step 3 (Dual Target / ActiveElement Inspection)**:
   In real-world browser usage as well as simulated test environments:
   - Keyboard events may target an inner text node, inline element, or the container itself.
   - The focused editing element is tracked by `document.activeElement`.
   - Therefore, a complete suppression check must inspect both `event.target` and `document.activeElement`.

4. **Step 4 (Comprehensive Text Entry Detector)**:
   To cover all specifications and runtime environments (browsers, JSDOM, iframes, synthetic events), a helper must test:
   - HTML form controls: `INPUT`, `TEXTAREA`, `SELECT` (via `tagName` check).
   - Native browser contenteditable: `el.isContentEditable === true`.
   - Property assignment: `el.contentEditable === "true"` or `(el.contentEditable as unknown) === true`.
   - DOM attribute assignment: `el.getAttribute("contenteditable") === "true"` or `""` (empty attribute boolean representation).
   - CSS attribute selector: `el.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']")`.
   - DOM tree traversal: Climbing `parentNode` to detect any editable ancestor container without throwing on `Document` or `Window`.

---

## 3. Caveats

- **No Caveats**: The issue is entirely localized to the input suppression guard in `apps/web/src/App.tsx`. All other view navigation, modal handling, and shortcut bindings remain completely untouched.

---

## 4. Conclusion & Proposed Modifications

### Target File: `apps/web/src/App.tsx`

### Change 1: Add helper function `isTextEntryElement`
Place the helper function at module level above `Workspace` (around line 208):

```typescript
function isTextEntryElement(target: unknown): boolean {
  if (!target || typeof target !== "object" || !("nodeType" in target)) {
    return false;
  }
  let curr: Node | null = target as Node;
  while (curr && curr.nodeType !== 9) {
    if (curr.nodeType === 1) {
      const el = curr as HTMLElement;
      const tag = el.tagName ? el.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return true;
      }
      if (
        el.isContentEditable === true ||
        el.contentEditable === "true" ||
        (el.contentEditable as unknown) === true ||
        (typeof el.getAttribute === "function" &&
          (el.getAttribute("contenteditable") === "true" || el.getAttribute("contenteditable") === ""))
      ) {
        return true;
      }
      if (
        typeof el.closest === "function" &&
        el.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']")
      ) {
        return true;
      }
    }
    curr = curr.parentNode;
  }
  return false;
}
```

### Change 2: Update `onKeyDown` in `Workspace`
Replace lines 319–322 in `apps/web/src/App.tsx`:

**Before**:
```typescript
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || target?.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }
```

**After**:
```typescript
      if (isTextEntryElement(event.target) || isTextEntryElement(document.activeElement)) {
        return;
      }
```

---

## 5. Verification Method

1. **Run Target Stress Test Suite**:
   ```bash
   npx vitest run apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx
   ```
   **Expected**: All 30 tests in `challenger-m5-tier5-ui-stress.test.tsx` pass with 0 failures, specifically confirming `STRESS 3.4` succeeds.

2. **Run Full Web App Test Suite**:
   ```bash
   npx vitest run apps/web/src/test/
   ```
   **Expected**: All unit and e2e integration tests pass (including `e2e-inkline.test.tsx`, `App.test.tsx`, and `challenger-m2-stress.test.tsx`).

3. **Typecheck and Lint**:
   ```bash
   npm run typecheck
   npm run lint
   ```
   **Expected**: 0 type errors and 0 lint warnings/errors.

4. **Invalidation Condition**:
   If typing 'n' or 'N' in a contenteditable div triggers `e.preventDefault()`, or if pressing 'n' on non-input page elements fails to open the task composer, the verification is considered failed.
