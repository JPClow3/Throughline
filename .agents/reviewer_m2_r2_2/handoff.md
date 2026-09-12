# Handoff Report: Reviewer M2-R2-2 (Overlay Stack A11y & Adversarial Review)

**Agent**: Reviewer M2-R2-2  
**Role**: reviewer, critic  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\reviewer_m2_r2_2`  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Milestone**: Milestone 2, Iteration 2 (Stacked Overlay Escape Dismissal)  
**Date**: 2026-09-10T12:30:30Z  

---

## 1. Observation

### 1.1 Integrity Audit Results
- **Hardcoding Check**: No hardcoded test IDs, mocks, or synthetic bypasses were found in `apps/web/src/ui/dialogA11y.ts`. The query `.palette-backdrop` references the actual production CSS class declared in `apps/web/src/views/CommandPalette.tsx:107` and `apps/web/src/styles.css:3215`.
- **Logic Substantiality**: Genuine DOM traversal, focus trapping, event propagation controls (`event.stopImmediatePropagation()`), and stack management were implemented.
- **Verdict on Integrity**: **PASS** (Zero integrity violations).

### 1.2 Verification Commands Executed
1. **Challenger Dialog Stress Test (`apps/web/src/test/challenger-m2-dialog-stress.test.tsx`)**:
   - Command: `npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx`
   - Result: **20 passed (20)**, duration 6.99s. Exit code 0.
2. **Production Build (`npm run build`)**:
   - Command: `npm run build`
   - Result: `tsc -p tsconfig.build.json && vite build` completed successfully; PWA service worker precached 61 entries (1573.48 KiB). Exit code 0.
3. **Monorepo Unit Test Suite**:
   - Command: `npx vitest run`
   - Result: **43 test files passed (43), 288 tests passed (288)**. Duration 43.70s. Exit code 0.
4. **Linter on Modified Implementation**:
   - Command: `npx eslint apps/web/src/ui/dialogA11y.ts`
   - Result: **0 errors, 0 warnings**. Exit code 0.
5. **Strict LIFO Consecutive Stress Suite (`apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx`)**:
   - Command: `npx vitest run apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx`
   - Result: **7 passed (7)**. Exit code 0.
6. **Overlay Stack Adversarial Test Suite (`apps/web/src/test/challenger-m2-r2-overlay.test.tsx`)**:
   - Command: `npx vitest run apps/web/src/test/challenger-m2-r2-overlay.test.tsx`
   - Result: **9 passed, 1 FAILED**:
     ```
     FAIL apps/web/src/test/challenger-m2-r2-overlay.test.tsx > Challenger M2-R2-1: Empirical Stress Harness for Overlay Stack > 4. ADVERSARIAL STRESS TEST: Simultaneous Mount of Nested Overlays (Child Modal inside Sheet) > BUG REPRODUCTION: Simultaneous mount of Child Modal inside Sheet causes Escape deadlock
     AssertionError: expected false to be true // Object.is equality
     - Expected: true
     + Received: false
      ❯ apps/web/src/test/challenger-m2-r2-overlay.test.tsx:528:32
     ```

---

## 2. Logic Chain

1. **Sequential vs. Simultaneous Mount Order in React**:
   - In sequential openings (e.g. user opens `Sheet`, then clicks a button inside it which sets `confirmOpen = true`), `Sheet`'s `useEffect` runs first, pushing `Sheet` to `dialogStack`. Then `ConfirmDialog`'s `useEffect` runs second, pushing `ConfirmDialog` to `dialogStack`.
   - In this sequential case: `dialogStack = [Sheet, ConfirmDialog]`.
   - When Escape is pressed, `ConfirmDialog` is `dialogStack[dialogStack.length - 1]` (the top entry), and `Sheet` is disqualified because `sheetPanel.contains(confirmPanel)`. `ConfirmDialog` successfully closes. This explains why `challenger-m2-dialog-stress.test.tsx` passes.

2. **The Simultaneous Mount Inversion Defect**:
   - In scenarios where a nested overlay is rendered initially open or opens concurrently with its parent container (e.g. `<Sheet open={true}><Modal open={true} /></Sheet>` or state restoration / deep linking), React executes `useEffect` hooks in **bottom-up (child-first)** order during the commit phase.
   - Therefore, the child `Modal` pushes itself to `dialogStack` FIRST: `dialogStack = [Modal]`.
   - The parent `Sheet` pushes itself to `dialogStack` SECOND: `dialogStack = [Modal, Sheet]`.
   - `dialogStack[dialogStack.length - 1]` is now `Sheet`!

3. **Deadlock Mechanism in `isTopmostOverlay` (`apps/web/src/ui/dialogA11y.ts:39-70`)**:
   - When evaluating `Sheet`:
     ```typescript
     if (currentPanel.contains(entry.panelRef.current)) {
       return false; // Sheet contains Modal -> returns false!
     }
     ```
     `Sheet` correctly determines it is a parent container and yields.
   - When evaluating `Modal`:
     ```typescript
     const topEntry = dialogStack[dialogStack.length - 1]; // topEntry is Sheet!
     return topEntry?.id === dialogId; // Modal.id !== Sheet.id -> returns false!
     ```
     `Modal` checks if it matches `topEntry`. Because `topEntry` is `Sheet`, `Modal` also returns `false`!
   - **Outcome**: Both `Sheet` and `Modal` evaluate `isTopmostOverlay(...) === false`.
   - **Consequence 1 (Escape Deadlock)**: Neither dialog invokes `onClose()`. Pressing `Escape` does nothing, locking keyboard users into the dialog state.
   - **Consequence 2 (WCAG Tab Trapping Failure)**: Because line 169 exits early when `!isTopmostOverlay(...)`, neither dialog traps Tab. Tabbing immediately escapes the modal into the underlying page DOM.

---

## 3. Caveats

- In Throughline's current manual UI flows, `ConfirmDialog` in `TaskEditor` is typically opened via a button click after `TaskEditor` is already visible (`setConfirmDelete(true)`), which executes sequentially.
- However, simultaneous mount scenarios occur during state hydration, URL query state activation, testing fixtures, and programmatic error/confirmation dialog triggers.
- The failure in `apps/web/src/test/challenger-m2-r2-overlay.test.tsx` is an automated regression that must be resolved to meet strict Milestone 2 acceptance criteria.

---

## 4. Conclusion & Verdict

**Verdict**: **REQUEST_CHANGES**

Worker M2-R2 successfully solved the sequential overlay dismissals and prevented duplicate Escape executions. However, the current stack implementation naively relies on `dialogStack[dialogStack.length - 1]` matching the dialog ID without filtering out disqualified parent containers. This introduces an Escape deadlock and destroys focus trapping under simultaneous mounting of nested overlays.

### Required Changes for Worker M2-R3:
In `apps/web/src/ui/dialogA11y.ts`, update `isTopmostOverlay` so that candidate overlays are filtered to exclude any active dialog whose panel contains another active dialog panel before determining the top of the stack:

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

  // An overlay cannot be topmost if its panel contains another active dialog panel
  const topmostCandidates = dialogStack.filter((entry) => {
    const el = entry.panelRef.current;
    if (!el) return false;
    return !dialogStack.some(
      (other) => other.id !== entry.id && other.panelRef.current && el.contains(other.panelRef.current)
    );
  });

  if (topmostCandidates.length === 0) {
    return false;
  }

  const topEntry = topmostCandidates[topmostCandidates.length - 1];
  return topEntry?.id === dialogId;
}
```

This guarantees that:
1. Under sequential mount (`[Parent, Child]`), `Parent` is excluded, `topEntry` is `Child`.
2. Under simultaneous mount (`[Child, Parent]`), `Parent` is excluded, `topEntry` is `Child`.
3. Under deeply nested stacks (`[ChildC, ChildB, ParentA]`), ancestors are excluded, and `ChildC` is topmost.
4. All tests in `challenger-m2-dialog-stress.test.tsx`, `challenger-m2-lifo-consecutive-stress.test.tsx`, and `challenger-m2-r2-overlay.test.tsx` will pass simultaneously.

---

## 5. Verification Method

To verify the required fix:
```powershell
# 1. Run all 3 overlay stress suites
npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx
npx vitest run apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx
npx vitest run apps/web/src/test/challenger-m2-r2-overlay.test.tsx

# 2. Verify build integrity
npm run build

# 3. Verify monorepo test suite (43 files, 288+ tests)
npx vitest run
```

### Invalidation Conditions
- Any Escape press fails to dismiss the topmost child dialog when simultaneously mounted inside a parent overlay.
- Tab key escapes a nested dialog and focuses background elements.
- Any test in `apps/web/src/test/challenger-m2-r2-overlay.test.tsx` fails.

---

## 6. Detailed Quality Review Report

### Findings

#### [Critical] Finding 1: Escape Deadlock and Tab Trapping Leak on Simultaneous Mount of Nested Overlays
- **What**: Simultaneous mounting of child and parent overlays (e.g. `<Sheet open={true}><Modal open={true} /></Sheet>`) leads to an Escape deadlock where neither dialog closes and Tab focus is leaked.
- **Where**: `apps/web/src/ui/dialogA11y.ts:56-70`
- **Why**: React commits `useEffect` from child to parent, pushing `[Child, Parent]` into `dialogStack`. In `isTopmostOverlay`, `Parent` returns `false` due to containing `Child`, while `Child` returns `false` because it does not equal `dialogStack[dialogStack.length - 1]`.
- **Suggestion**: Filter `dialogStack` to only candidate overlays that do NOT contain any other active overlay panel, then pick the top candidate.

### Verified Claims
- Zero integrity violations or hardcoded test bypasses → verified via AST/grep inspection → **PASS**
- `npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx` (20 tests) → verified → **PASS**
- `npm run build` → verified → **PASS**
- `npx vitest run` (43 files, 288 tests) → verified → **PASS**
- `npx eslint apps/web/src/ui/dialogA11y.ts` (0 errors) → verified → **PASS**
- `apps/web/src/test/challenger-m2-r2-overlay.test.tsx` (10 tests) → 1 test failed → **FAIL**

---

## 7. Adversarial Challenge Report

### Challenge Summary
**Overall risk assessment**: **HIGH**

### Challenges

#### [High] Challenge 1: Non-Deterministic Effect Registration Order in React Fiber Tree
- **Assumption challenged**: Assumed `dialogStack[dialogStack.length - 1]` always represents the topmost overlay in the DOM.
- **Attack scenario**: Simultaneous opening or initial render of nested overlays results in child effects running before parent effects, pushing parent to the top of the stack.
- **Blast radius**: Keyboard accessibility (WCAG AA 2.1.2 No Keyboard Trap & 2.1.1 Keyboard) completely broken in simultaneous/nested overlay contexts; user unable to dismiss modal with Escape.
- **Mitigation**: Exclude parent containers before inspecting stack top.
