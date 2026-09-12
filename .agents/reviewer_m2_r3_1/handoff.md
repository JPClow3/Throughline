# Reviewer M2-R3-1 Handoff Report: Simultaneous Mount Leaf Candidate Resolution

**Agent**: Reviewer M2-R3-1  
**Archetype**: Reviewer & Adversarial Critic  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\reviewer_m2_r3_1`  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Milestone**: Milestone 2, Iteration 3  
**Date**: 2026-09-10T12:43:15Z  
**Verdict**: **APPROVE**  

---

## Review Summary

**Verdict**: **APPROVE**  
**Overall Risk Assessment**: **LOW**  
**Integrity Audit**: **CLEAN (0 integrity violations, 0 facades, 0 hardcoded test workarounds)**  

The implementation of `isTopmostOverlay` in `apps/web/src/ui/dialogA11y.ts` correctly resolves the Escape deadlock that occurred when parent and child overlays were mounted simultaneously. All required test suites and adversarial challenge suites pass with 100% success rate, monorepo production build succeeds with exit code 0, and ESLint reports zero errors.

---

## 1. Observation

### 1.1 Reviewed Source Code
File: `apps/web/src/ui/dialogA11y.ts` (lines 53–69)
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

### 1.2 Independent Verification Command Outputs

1. **Challenger M2-R2 Overlay Suite**:
   Command: `npx vitest run apps/web/src/test/challenger-m2-r2-overlay.test.tsx`
   Output:
   ```
   ✓ apps/web/src/test/challenger-m2-r2-overlay.test.tsx (10 tests) 442ms
   Test Files  1 passed (1)
        Tests  10 passed (10)
     Duration  6.09s
   ```
   Exit code: `0`. Test 4 ("BUG REPRODUCTION: Simultaneous mount of Child Modal inside Sheet causes Escape deadlock") passed completely without failure.

2. **Challenger M2 Dialog Stress Suite**:
   Command: `npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx`
   Output:
   ```
   ✓ apps/web/src/test/challenger-m2-dialog-stress.test.tsx (20 tests) 699ms
   Test Files  1 passed (1)
        Tests  20 passed (20)
     Duration  7.34s
   ```
   Exit code: `0`.

3. **Core Overlay & Shell Interaction Suites**:
   Command: `npx vitest run apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx`
   Output:
   ```
   ✓ apps/web/src/test/CommandPalette.test.tsx (5 tests) 525ms
   ✓ apps/web/src/test/Sheet.test.tsx (7 tests) 258ms
   ✓ apps/web/src/test/App.test.tsx (3 tests) 1135ms
   Test Files  3 passed (3)
        Tests  15 passed (15)
     Duration  8.55s
   ```
   Exit code: `0`.

4. **Consecutive LIFO Stress Suite**:
   Command: `npx vitest run apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx`
   Output:
   ```
   ✓ apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx (7 tests) 382ms
   Test Files  1 passed (1)
        Tests  7 passed (7)
     Duration  7.22s
   ```
   Exit code: `0`.

5. **Challenger M2-R3-2 Overlay & Focus Wrapping Stress Suite**:
   Command: `npx vitest run apps/web/src/test/challenger-m2-r3-2-overlay.test.tsx`
   Output:
   ```
   ✓ apps/web/src/test/challenger-m2-r3-2-overlay.test.tsx (17 tests) 406ms
   Test Files  1 passed (1)
        Tests  17 passed (17)
     Duration  6.23s
   ```
   Exit code: `0`.

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

7. **ESLint on Modified File**:
   Command: `npx eslint apps/web/src/ui/dialogA11y.ts`
   Output:
   ```
   Exit code 0 (0 errors, 0 warnings).
   ```

---

## 2. Logic Chain

1. **Observation 1.1**: In React, `useEffect` hooks run bottom-up (children before parents). Under simultaneous mount of `<Sheet><Modal /></Sheet>`, `Modal`'s effect executes first, appending `Modal` to `dialogStack`, followed by `Sheet`'s effect, appending `Sheet`. Consequently, `dialogStack = [Modal, Sheet]`.
2. **Prior Defect**: The previous implementation checked `dialogStack[dialogStack.length - 1]` to identify the top overlay. This selected `Sheet`. However, `Sheet`'s DOM panel contained `Modal`'s DOM panel (`panel.contains(other)`), which disqualified `Sheet`. As a result, neither `Sheet` nor `Modal` claimed `isTopmostOverlay()`, creating an Escape deadlock.
3. **Worker M2-R3 Solution**: `candidateStack` filters out any entry whose DOM panel contains another active dialog panel:
   - `Sheet` contains `Modal` -> eliminated from `candidateStack`.
   - `Modal` does not contain any other dialog -> retained in `candidateStack`.
   - `candidateStack[candidateStack.length - 1]` correctly yields `Modal`.
   - `Modal` is identified as topmost overlay, traps Tab focus, and intercepts Escape keydown, unmounting cleanly.
   - Upon `Modal` unmounting, `dialogStack` cleanup hook splices `Modal`. `Sheet` becomes the sole candidate in `candidateStack` and responds to subsequent Escape keydown.
4. **Adversarial Analysis**:
   - **Arbitrary Depth ($k \ge 1$)**: For arbitrary nesting levels (e.g. Sheet -> Modal 1 -> Modal 2), all ancestor nodes contain descendant nodes and are filtered from `candidateStack`. Only the leaf node remains, guaranteeing strict leaf-to-root unwinding.
   - **Independent Peer Overlays**: If peer overlays mount simultaneously without DOM containment, `panel.contains()` returns false for both, preserving existing LIFO behavior based on mount order.
   - **CommandPalette Precedence**: Lines 40-46 explicitly maintain absolute precedence for `.palette-backdrop`, ensuring the global command palette is never locked out by underlying dialogs.
   - **Fallback Safety**: If `candidateStack.length === 0` (e.g. unreferenced panels), it safely defaults to `true`, preventing deadlocks.
5. **Empirical Verification (Observation 1.2)**:
   - All 10 tests in `challenger-m2-r2-overlay.test.tsx` pass.
   - All 20 tests in `challenger-m2-dialog-stress.test.tsx` pass.
   - All 15 tests in `CommandPalette.test.tsx`, `Sheet.test.tsx`, and `App.test.tsx` pass.
   - All 7 tests in `challenger-m2-lifo-consecutive-stress.test.tsx` pass.
   - All 17 tests in `challenger-m2-r3-2-overlay.test.tsx` pass.
   - Monorepo production build succeeds with 0 errors.

---

## 3. Caveats

- No caveats. The DOM containment logic relies on standard native DOM API `Node.contains()`, which is universally supported across all browsers and jsdom environments. Disconnected DOM elements are purged via `purgeDisconnectedEntries()` before candidate filtering.

---

## 4. Conclusion

Worker M2-R3's changes to `apps/web/src/ui/dialogA11y.ts` completely resolve the simultaneous mount Escape deadlock. The solution is robust, clean, free of integrity violations or hardcoded facades, maintains backward compatibility with sequential dialog stacking and CommandPalette precedence, and satisfies all requirements.

**Verdict: APPROVE**

---

## 5. Verification Method

To independently verify this verdict:

```powershell
# 1. Run Challenger M2-R2 overlay stress suite (all 10 pass)
npx vitest run apps/web/src/test/challenger-m2-r2-overlay.test.tsx

# 2. Run Challenger M2 dialog stress suite (all 20 pass)
npx vitest run apps/web/src/test/challenger-m2-dialog-stress.test.tsx

# 3. Run core overlay integration suites (all 15 pass)
npx vitest run apps/web/src/test/CommandPalette.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/App.test.tsx

# 4. Run consecutive LIFO stress suite (all 7 pass)
npx vitest run apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx

# 5. Run Challenger M2-R3-2 overlay and focus wrapping stress suite (all 17 pass)
npx vitest run apps/web/src/test/challenger-m2-r3-2-overlay.test.tsx

# 6. Run monorepo production build
npm run build
```

Invalidation conditions:
- Any test failure in `challenger-m2-r2-overlay.test.tsx` or `challenger-m2-r3-2-overlay.test.tsx`.
- Non-zero exit code on `npm run build`.
