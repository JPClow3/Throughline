# Worker M5-R3 Context

- Working Directory: H:\Code\Pessoais\Throughline\.agents\worker_m5_r3
- Project Root: H:\Code\Pessoais\Throughline
- Original Request: H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md
- Project Scope: H:\Code\Pessoais\Throughline\PROJECT.md
- Reviewer 1 Handoff: H:\Code\Pessoais\Throughline\.agents\reviewer_m5_r2_1\handoff.md
- Focus File: `apps/web/src/App.tsx` (Exclusive Write Ownership)

## Objective
Harden keyboard shortcut handling in `apps/web/src/App.tsx` according to Reviewer M5-R2-1's feedback:
1. **Shadow DOM Retargeting**:
   - Add helper `getDeepActiveElement()`:
     ```typescript
     function getDeepActiveElement(): Element | null {
       let el = document.activeElement;
       while (el && el.shadowRoot && el.shadowRoot.activeElement) {
         el = el.shadowRoot.activeElement;
       }
       return el;
     }
     ```
   - In `isTextEntryElement`, allow traversing across shadow boundaries:
     ```typescript
     curr = curr.parentNode ?? (curr instanceof ShadowRoot ? (curr as ShadowRoot).host : null);
     ```
   - In `Workspace` `onKeyDown`, inspect the deep event target via `event.composedPath?.()[0] ?? event.target`:
     ```typescript
     const target = (event.composedPath?.()[0] ?? event.target) as HTMLElement | null;
     const activeEl = getDeepActiveElement();
     if (isTextEntryElement(target) || isTextEntryElement(activeEl)) {
       return;
     }
     ```
2. **Window Event Registration**:
   - Switch listener in `Workspace` from `document.addEventListener("keydown", onKeyDown)` to `window.addEventListener("keydown", onKeyDown)`.
   - Update cleanup to `window.removeEventListener("keydown", onKeyDown)`.
3. **Verify All Quality Gates**:
   - `npm run lint` (0 errors)
   - `npm run typecheck` (0 errors)
   - `npx vitest run apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx` (30/30 pass)
   - `npx vitest run apps/web/src/test/e2e-inkline.test.tsx` (70/70 pass)
   - `npm run test` (100% pass)
   - `npm run build` (clean)
4. Write handoff report to `H:\Code\Pessoais\Throughline\.agents\worker_m5_r3\handoff.md` and message parent.
