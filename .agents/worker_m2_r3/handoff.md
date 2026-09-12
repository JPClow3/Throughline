# Worker M2-R3 Handoff Report: Simultaneous Mount Leaf Candidate Resolution

**Agent**: Worker M2-R3  
**Role**: implementer, qa, specialist  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\worker_m2_r3`  
**Milestone**: Milestone 2, Iteration 3 (Simultaneous Mount Leaf Candidate Resolution)  
**Date**: 2026-09-10T12:37:30Z  
**Verdict**: **RESOLVED / READY FOR AUDIT & APPROVAL**

---

## 1. Observation

### 1.1 Initial Problem Statement & Verbatim Failure
In Iteration 2, peer challenger test suite `apps/web/src/test/challenger-m2-r2-overlay.test.tsx` identified a deadlock when parent and child overlays mount simultaneously:
```
FAIL apps/web/src/test/challenger-m2-r2-overlay.test.tsx > Challenger M2-R2-1: Empirical Stress Harness for Overlay Stack > 4. ADVERSARIAL STRESS TEST: Simultaneous Mount of Nested Overlays (Child Modal inside Sheet) > BUG REPRODUCTION: Simultaneous mount of Child Modal inside Sheet causes Escape deadlock
AssertionError: expected false to be true // Object.is equality
- Expected: true
+ Received: false
  ❯ apps/web/src/test/challenger-m2-r2-overlay.test.tsx:528:32
```

### 1.2 Modified File
`apps/web/src/ui/dialogA11y.ts` (lines 53–69):
```typescript
  // Filter out entries that contain other active dialogs (parents cannot be topmost)
  const candidateStack = dialogStack.filter((entry) => {
    const panel = entry.panelRef.current;
    if (!panel) return false;
    return !dialogStack.some(
      (other) => other.id !== entry.id && other.panelRef.current && panel.contains(other.panelRef.current)
    );
  });

  if (candidateStack.length === 0) {
    return true;
  }

  const topEntry = candidateStack[candidateStack.length - 1];
  return topEntry?.id === dialogId;
```

### 1.3 Verification Command Outputs

1. **Challenger M2-R2 Overlay Stress Suite**:
   Command: `npx vitest run apps/web/src/test/challenger-m2-r2-overlay.test.tsx`
   Output:
   ```
   ✓ apps/web/src/test/challenger-m2-r2-overlay.test.tsx (10 tests) 403ms
   Test Files  1 passed (1)
        Tests  10 passed (10)
   ```

2. **Challenger M2 Dialog Stress Suite**:
   Command: `npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx`
   Output:
   ```
   ✓ apps/web/src/test/challenger-m2-dialog-stress.test.tsx (20 tests) 616ms
   Test Files  1 passed (1)
        Tests  20 passed (20)
   ```

3. **Challenger M2 LIFO Consecutive Stress Suite**:
   Command: `npx vitest run apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx`
   Output:
   ```
   ✓ apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx (7 tests) 370ms
   Test Files  1 passed (1)
        Tests  7 passed (7)
   ```

4. **CommandPalette, Sheet, and App Suite**:
   Command: `npx vitest run apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx`
   Output:
   ```
   ✓ apps/web/src/test/CommandPalette.test.tsx (5 tests)
   ✓ apps/web/src/test/Sheet.test.tsx (7 tests)
   ✓ apps/web/src/test/App.test.tsx (3 tests)
   Test Files  3 passed (3)
        Tests  15 passed (15)
   ```

5. **Full Repository Test Run**:
   Command: `npx vitest run`
   Output:
   ```
   Test Files  45 passed (45)
        Tests  305 passed (305)
     Duration  37.73s
   ```

6. **Monorepo Build**:
   Command: `npm run build`
   Output:
   ```
   > throughline@0.1.0-beta.1 build
   > npm run build --workspaces --if-present
   > @throughline/push-api@0.1.0 build
   > @throughline/web@0.1.0 build
   > @throughline/domain@0.1.0 build
   Exit code 0.
   ```

7. **ESLint Verification**:
   Command: `npx eslint apps/web/src/ui/dialogA11y.ts`
   Output:
   ```
   Exit code 0 (0 errors, 0 warnings).
   ```

---

## 2. Logic Chain

1. **Observation 1.1**: In React, component mounts execute effects in bottom-up order (descendants execute `useEffect` before ancestors). When a `Modal` is rendered inside a `Sheet` simultaneously at initial mount, `Modal` calls `dialogStack.push()` first, followed by `Sheet`. Consequently, `dialogStack = [Modal, Sheet]`.
2. **Prior Logic**: `isTopmostOverlay` disqualified `Sheet` because its DOM panel contained `Modal`'s DOM panel (`panel.contains(other)`). However, it then inspected `dialogStack[dialogStack.length - 1]` to determine topmost entry. Because `topEntry` was `Sheet`, `Modal` was also disqualified (`Sheet.id !== Modal.id`), creating an Escape deadlock where neither dialog could close.
3. **Resolution (Observation 1.2)**: We updated `isTopmostOverlay` to evaluate `candidateStack = dialogStack.filter(...)`, explicitly stripping any entry whose DOM panel contains another active dialog entry. Under simultaneous mount:
   - `Sheet` contains `Modal` -> eliminated from `candidateStack`.
   - `Modal` does not contain any other dialog -> retained in `candidateStack`.
   - Top candidate is `candidateStack[candidateStack.length - 1]`, which evaluates to `Modal`.
   - `Modal` is recognized as topmost overlay and responds to `Escape`, dismissing immediately.
   - Upon `Modal` unmounting, its cleanup hook removes it from `dialogStack`. On subsequent Escape, `Sheet` becomes the sole candidate in `candidateStack` and dismisses cleanly.
4. **Verification (Observation 1.3)**:
   - Simultaneous mount adversarial test in `apps/web/src/test/challenger-m2-r2-overlay.test.tsx` passes immediately (10/10 tests pass).
   - All 20 dialog stress tests in `challenger-m2-dialog-stress.test.tsx` pass.
   - All 7 consecutive LIFO stress tests in `challenger-m2-lifo-consecutive-stress.test.tsx` pass.
   - All 45 test files (305 tests) pass across the monorepo with 0 regressions.
   - Monorepo production build succeeds with 0 errors.

---

## 3. Caveats

- No caveats. The DOM-containment check operates strictly on live DOM references validated through `purgeDisconnectedEntries()`.

---

## 4. Conclusion

The simultaneous mount Escape deadlock is completely resolved. Both sequential and simultaneous multi-overlay mount configurations now adhere to strict LIFO leaf dismissal order on Escape, eliminate double-dismissals, preserve focus trapping in the topmost overlay, and pass all 45 test suites in the repository.

---

## 5. Verification Method

To independently verify:
```powershell
# 1. Run Challenger M2-R2 overlay stress suite (all 10 tests pass)
npx vitest run apps/web/src/test/challenger-m2-r2-overlay.test.tsx

# 2. Run Challenger M2 dialog stress suite (all 20 tests pass)
npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx

# 3. Run Challenger M2 consecutive LIFO stress suite (all 7 tests pass)
npx vitest run apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx

# 4. Run core overlay integration suites (all 15 tests pass)
npx vitest run apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx

# 5. Run full test suite across entire monorepo (45 test files, 305 tests passed)
npx vitest run

# 6. Run monorepo production build
npm run build
```

Invalidation conditions:
- Any test in `apps/web/src/test/challenger-m2-r2-overlay.test.tsx` fails.
- Any regressions in `challenger-m2-dialog-stress.test.tsx` or `challenger-m2-lifo-consecutive-stress.test.tsx`.
- `npm run build` fails with non-zero exit code.
