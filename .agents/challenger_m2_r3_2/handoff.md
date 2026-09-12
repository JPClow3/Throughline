# Challenger M2-R3-2 Handoff Report: Tab Focus Wrapping, Shift+Tab Boundary Cycling & Non-Topmost Overlay Inertness Under Simultaneous Mount

**Agent**: Challenger M2-R3-2  
**Role**: critic, specialist  
**Working Directory**: `H:\Code\Pessoais\Throughline\.agents\challenger_m2_r3_2`  
**Parent Agent**: `a9220575-477d-4571-88de-6eb44cdafdee` (`parent`)  
**Milestone**: Milestone 2, Iteration 3  
**Verdict**: **APPROVE**  
**Date**: 2026-09-10T12:47:00Z  

---

## 1. Observation

### 1.1 Context & Target Code Under Review
Worker M2-R3 updated `apps/web/src/ui/dialogA11y.ts` (lines 53–69) to resolve parent-child simultaneous mount resolution:
```typescript
53:   // Filter out entries that contain other active dialogs (parents cannot be topmost)
54:   const candidateStack = dialogStack.filter((entry) => {
55:     const panel = entry.panelRef.current;
56:     if (!panel) return false;
57:     return !dialogStack.some(
58:       (other) => other.id !== entry.id && other.panelRef.current && panel.contains(other.panelRef.current)
59:     );
60:   });
61: 
62:   if (candidateStack.length === 0) {
63:     return true;
64:   }
65: 
66:   const topEntry = candidateStack[candidateStack.length - 1];
67:   return topEntry?.id === dialogId;
```

In addition, `useDialogA11y` implements keyboard event handling (lines 166–212):
```typescript
166:     const onKey = (event: KeyboardEvent) => {
167:       // Non-topmost overlays must ignore all keydown interactions (Escape and Tab trapping)
168:       if (!isTopmostOverlay(dialogId, panelRef)) {
169:         return;
170:       }
171: 
172:       if (event.key === "Escape") {
173:         event.preventDefault();
174:         event.stopPropagation();
175:         event.stopImmediatePropagation();
176:         onCloseRef.current();
177:         return;
178:       }
179: 
180:       if (event.key !== "Tab" || !panelRef.current) {
181:         return;
182:       }
183: 
184:       const focusables = Array.from(
185:         panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
186:       ).filter(isFocusable);
187: 
188:       if (focusables.length === 0) {
189:         event.preventDefault();
190:         panelRef.current.focus();
191:         return;
192:       }
193: 
194:       const first = focusables[0];
195:       const last = focusables[focusables.length - 1];
196:       const active = document.activeElement;
197: 
198:       if (!panelRef.current.contains(active)) {
199:         event.preventDefault();
200:         if (event.shiftKey) {
201:           last.focus();
202:         } else {
203:           first.focus();
204:         }
205:       } else if (event.shiftKey && active === first) {
206:         event.preventDefault();
207:         last.focus();
208:       } else if (!event.shiftKey && active === last) {
209:         event.preventDefault();
210:         first.focus();
211:       }
212:     };
```

### 1.2 Dedicated Empirical Stress Suite
We created and executed a dedicated stress test suite in `apps/web/src/test/challenger-m2-r3-2-overlay.test.tsx` containing 17 rigorous test cases covering:
1. **Tab Focus Wrapping During Simultaneous Mount**:
   - `1.1`: Forward wrap from last focusable to first focusable in topmost modal without leaking to parent Sheet or page background.
   - `1.2`: Complex focusable filtering (disabled buttons, `tabindex="-1"`, `aria-hidden="true"`, hidden inputs, anchors without href) skipped correctly when wrapping forward.
   - `1.3`: Single focusable element in topmost overlay maintains focus lock on Tab.
   - `1.4`: Zero focusable elements in topmost overlay traps focus on panel.
   - `1.5`: External or lost focus (in parent Sheet or page background) is intercepted and pulled to the first focusable element of the topmost overlay.
2. **Shift+Tab Boundary Cycling During Simultaneous Mount**:
   - `2.1`: Backward wrap from first focusable to last focusable in topmost modal without leaking to parent Sheet.
   - `2.2`: Continuous multi-turn alternating cycling (`Tab` -> `Shift+Tab` back and forth across 10 boundary traversals) with 100% boundary integrity.
   - `2.3`: Single focusable element in topmost overlay maintains focus lock on Shift+Tab.
   - `2.4`: External or lost focus intercepted on Shift+Tab and pulled to the last focusable element of the topmost overlay.
3. **Non-Topmost Overlay Inertness During Simultaneous Mount**:
   - `3.1`: Parent Sheet is completely inert to `Escape` (0 close calls) while Child Modal handles `Escape`.
   - `3.2`: Parent Sheet's Tab key listener is completely inert while Child Modal is mounted (Sheet does not hijack focus).
   - `3.3`: Triple simultaneous nesting (`Root Sheet` + `Modal 1` + `Modal 2` all mounted simultaneously): only grandchild `Modal 2` is active; `Modal 1` and `Sheet` remain inert. Sequentially closes `Modal 2` -> `Modal 1` -> `Sheet` with focus trapping transitioning smoothly at each stage.
   - `3.4`: Simultaneous sibling modals inside Sheet (`Modal A` and `Modal B` simultaneously mounted): last mounted sibling is topmost, first sibling is inert. Sequential Escapes close `Modal B` -> `Modal A` -> `Sheet`.
   - `3.5`: `ConfirmDialog` inside Sheet during simultaneous mount: `ConfirmDialog` is active topmost, Sheet is inert.
   - `3.6`: `CommandPalette` precedence: `CommandPalette` takes precedence over simultaneously mounted Sheet and Modal, and upon Palette dismissal, Modal resumes topmost status, followed by Sheet.
   - `3.7`: Abrupt DOM detachment of topmost modal promotes Sheet to topmost immediately.
   - `3.8`: Rapid Escape burst (10 keydowns synchronously) invokes only topmost modal without double-triggering inert Sheet.

### 1.3 Verbatim Tool Command Results

1. **Challenger M2-R3-2 Dedicated Overlay Stress Test**:
   Command: `npx vitest run apps/web/src/test/challenger-m2-r3-2-overlay.test.tsx`
   Output:
   ```
    RUN  v4.1.9 H:/Code/Pessoais/Throughline

    ✓ apps/web/src/test/challenger-m2-r3-2-overlay.test.tsx (17 tests) 389ms

    Test Files  1 passed (1)
         Tests  17 passed (17)
      Start at  09:45:14
      Duration  5.81s (transform 134ms, setup 151ms, import 4.30s, tests 389ms, environment 799ms)
   ```

2. **All 6 Overlay and Dialog Test Suites**:
   Command: `npx vitest run apps/web/src/test/challenger-m2-r3-2-overlay.test.tsx apps/web/src/test/challenger-m2-r2-overlay.test.tsx apps/web/src/test/challenger-m2-dialog-stress.test.tsx apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/CommandPalette.test.tsx`
   Output:
   ```
    RUN  v4.1.9 H:/Code/Pessoais/Throughline

    ✓ apps/web/src/test/CommandPalette.test.tsx (5 tests) 1105ms
    ✓ apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx (7 tests) 992ms
    ✓ apps/web/src/test/challenger-m2-r3-2-overlay.test.tsx (17 tests) 1056ms
    ✓ apps/web/src/test/Sheet.test.tsx (7 tests) 1154ms
    ✓ apps/web/src/test/challenger-m2-r2-overlay.test.tsx (10 tests) 2246ms
    ✓ apps/web/src/test/challenger-m2-dialog-stress.test.tsx (20 tests) 2686ms

    Test Files  6 passed (6)
         Tests  66 passed (66)
      Start at  09:41:28
      Duration  39.17s
   ```

3. **ESLint Verification**:
   Command: `npx eslint apps/web/src/ui/dialogA11y.ts apps/web/src/test/challenger-m2-r3-2-overlay.test.tsx`
   Output:
   ```
   Exit code 0 (0 errors, 0 warnings).
   ```

4. **Monorepo Build**:
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

---

## 2. Logic Chain

1. **Observation 1.1**: `isTopmostOverlay` in `dialogA11y.ts` identifies topmost dialogs by constructing `candidateStack = dialogStack.filter(...)`, filtering out any element whose DOM panel contains another active dialog's panel.
2. **Tab Focus Wrapping Verification (Observation 1.2 & 1.3, Tests 1.1–1.5)**:
   - When Sheet and Modal mount simultaneously, `isTopmostOverlay` returns `true` for Modal and `false` for Sheet.
   - When on the last focusable element in Modal, pressing `Tab` triggers `!event.shiftKey && active === last` in `useDialogA11y`. It calls `event.preventDefault()` and `first.focus()`, cycling focus directly back to the first focusable element.
   - Non-interactive elements (`disabled`, `tabindex="-1"`, `aria-hidden="true"`, hidden inputs, anchors without href) are correctly filtered by `isFocusable` and `FOCUSABLE_SELECTOR`, preventing focus from landing on dead DOM nodes.
   - For single-element overlays, `active === last` holds immediately, retaining focus on that element. For zero-element overlays, `focusables.length === 0` prevents leakage by trapping focus on `panelRef.current`.
   - If focus escapes into the parent Sheet or background, `!panelRef.current.contains(active)` triggers on the next Tab, immediately pulling focus back into the topmost overlay.
3. **Shift+Tab Boundary Cycling Verification (Observation 1.2 & 1.3, Tests 2.1–2.4)**:
   - When on the first focusable element of the topmost overlay, pressing `Shift+Tab` triggers `event.shiftKey && active === first`, calling `event.preventDefault()` and `last.focus()`. Focus wraps cleanly to the last element.
   - Repeated multi-turn cycling across 10 boundary traversals confirms that alternating between forward Tab wrapping and backward Shift+Tab cycling preserves strict boundary isolation without leaking focus to underlying sheets or document body.
4. **Non-Topmost Overlay Inertness Verification (Observation 1.2 & 1.3, Tests 3.1–3.8)**:
   - Non-topmost overlays evaluate `isTopmostOverlay(dialogId, panelRef)` to `false` at line 168 of `dialogA11y.ts`, immediately returning before handling either Escape or Tab.
   - In 2-level, 3-level, and sibling configurations under simultaneous mount, only the innermost leaf dialog executes `onCloseRef.current()` or manipulates focus. All parent and sibling overlays remain completely inert until they ascend to topmost status upon dismissal of higher-priority overlays.
   - CommandPalette precedence (`.palette-backdrop`) correctly subordinates all simultaneously mounted standard overlays.
   - Abrupt DOM detachment invokes `purgeDisconnectedEntries()`, immediately transferring topmost status and active Tab/Shift+Tab trapping to the next valid underlying overlay.
   - Synchronous rapid Escape barrages (10 consecutive Escapes) execute exclusively on the topmost overlay without leaking to or double-triggering inert parents.

---

## 3. Caveats

- No caveats. All 17 empirical stress tests in `challenger-m2-r3-2-overlay.test.tsx` and all 66 overlay/dialog tests across the repository pass cleanly and deterministically.

---

## 4. Conclusion

**VERDICT: APPROVE**

Worker M2-R3's leaf candidate resolution implementation in `apps/web/src/ui/dialogA11y.ts` is empirically robust, complete, and resilient.
- Tab focus wrapping operates strictly within the topmost overlay during simultaneous mount.
- Shift+Tab boundary cycling traverses boundaries cleanly without leakage or recursion errors.
- Non-topmost overlays (whether parent containers, intermediate ancestors, or simultaneous siblings) are completely inert to both Escape and Tab events.
- All 6 overlay/dialog test suites (66 tests) pass with 100% success rate, linting passes with 0 errors, and the production build completes successfully.

---

## 5. Verification Method

To independently verify this verdict:

```powershell
# 1. Run Challenger M2-R3-2 dedicated stress suite (all 17 tests pass)
npx vitest run apps/web/src/test/challenger-m2-r3-2-overlay.test.tsx

# 2. Run all 6 overlay and dialog test suites (all 66 tests pass)
npx vitest run apps/web/src/test/challenger-m2-r3-2-overlay.test.tsx apps/web/src/test/challenger-m2-r2-overlay.test.tsx apps/web/src/test/challenger-m2-dialog-stress.test.tsx apps/web/src/test/challenger-m2-lifo-consecutive-stress.test.tsx apps/web/src/test/Sheet.test.tsx apps/web/src/test/CommandPalette.test.tsx

# 3. Verify linting
npx eslint apps/web/src/ui/dialogA11y.ts apps/web/src/test/challenger-m2-r3-2-overlay.test.tsx

# 4. Run monorepo production build
npm run build
```

Invalidation conditions:
- Any of the 17 tests in `apps/web/src/test/challenger-m2-r3-2-overlay.test.tsx` fails.
- Any regression across the other 5 overlay test suites.
- `npm run build` fails.
