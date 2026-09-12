# Handoff Report: Milestone 1 — Inkline Visual System, Tokens & Elevation

- **Agent**: `worker_m1_1`
- **Role**: Implementation Worker (M1: Inkline Visual System, Tokens & Elevation)
- **Directory**: `H:\Code\Pessoais\Throughline\.agents\worker_m1_1`
- **Parent Conversation ID**: `8dbbbd50-34b8-497e-a5ca-a277e75cae31`
- **Date**: 2026-09-10T08:22:00Z
- **Type**: Hard Handoff (Task Complete)

---

## 1. Observation

Direct observations from the codebase and build tools:

1. **Tailwind v4 `@theme` block in `apps/web/src/styles.css`**:
   - Lines 6–16 previously defined only generic semantic tokens: `--color-primary`, `--color-on-primary`, `--color-surface`, `--color-background`, `--color-on-surface`, `--color-on-surface-variant`, `--color-outline`, `--color-outline-variant`, and `--font-sans`.
   - None of the core Inkline color variables (`--yellow`, `--yellow-soft`, `--blue`, `--blue-soft`, `--green`, `--green-soft`, `--red`, `--red-soft`, `--violet`, `--violet-soft`, `--ink`, `--ink-soft`, `--ink-faint`, `--paper`, `--paper-2`, `--card`, `--card-tinted`, `--line`, `--line-soft`, `--shadow-ink`, `--on-signal`, `--on-accent`, `--warn`, `--danger`) or shadow tokens (`--shadow-0` through `--shadow-3`) were registered in `@theme`.

2. **Overlay Elevation on Modal and Onboarding Panels**:
   - `docs/ui-ux.md` Section 3 mandates: "Level 4 (Overlay): Sheets/modals carry an 8px 8px shadow over a dimmed backdrop." (`--shadow-3`).
   - In `apps/web/src/styles.css`, `.modal-panel` (lines 3040–3047) and `.onboarding-panel` (lines 3359–3365) lacked explicit `box-shadow` rules.
   - In `apps/web/src/ui/Overlay.tsx:71`, the modal element is rendered as `className="modal-panel ik-card"`.
   - In `apps/web/src/views/OnboardingOverlay.tsx:105`, the panel is rendered as `className="ik-card onboarding-panel flex flex-col"`.
   - Because `.ik-card` in `styles.css:358` specifies `box-shadow: var(--shadow-1);` (3px 3px 0 0), both overlays were rendering with Level 1 (3px) elevation instead of Level 4 (8px).

3. **Tactile Press Physics on TaskCard**:
   - In `apps/web/src/views/TaskCard.tsx:136`, the card used Framer Motion `whileTap={{ scale: 0.985 }}`.
   - In `apps/web/src/styles.css:1689`, `.task-card:hover` defined hover lift (`transform: translate(-2px, -2px); box-shadow: var(--shadow-2);`), but there was no `.task-card:active` rule.

4. **Touch Target Dimensions for Micro-Controls on Mobile**:
   - In `apps/web/src/styles.css:2592`, `.icon-toggle` was defined as `width: 36px; height: 36px;`.
   - In `apps/web/src/styles.css:416`, `.btn-sm` was defined as `min-height: 34px;`.
   - Neither component enforced the WCAG 2.5.5 / 2.5.8 and Inkline specification minimum touch target of 44x44px on mobile or touch viewports.

5. **Safe-Area Inset Handling in Viewport Meta**:
   - In `apps/web/index.html:5`, the viewport meta tag was `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`, lacking `viewport-fit=cover`.
   - `apps/web/src/styles.css` already relied on `env(safe-area-inset-bottom, 0px)` in lines 261, 1114, and 3265 for the mobile bottom dock and primary FAB.

6. **Theme Storage Key Modernization**:
   - `apps/web/index.html:16` and `apps/web/src/hooks/useTheme.ts:6` used the legacy storage key `"lg-theme"`.
   - The dispatch specified standardizing on `"throughline-theme"`, while retaining `"lg-theme"` as a fallback to preserve existing user settings.

---

## 2. Logic Chain

1. **Tailwind v4 Token Integration**:
   - By adding all color tokens (`--color-yellow`, `--color-blue`, etc.) and shadow tokens (`--shadow-0` through `--shadow-3`) into `@theme` in `apps/web/src/styles.css`, developers and components can write standard Tailwind utilities (e.g. `bg-yellow`, `text-ink-soft`, `border-line`, `shadow-3`) without needing arbitrary bracket syntax like `text-[var(--ink-soft)]`.

2. **Level 4 Overlay Elevation Guarantee**:
   - Setting `box-shadow: var(--shadow-3);` on `.modal-panel`, `.modal-panel.ik-card`, `.onboarding-panel`, and `.onboarding-panel.ik-card` in `apps/web/src/styles.css` ensures that modals and onboarding panels always display an 8px 8px hard offset shadow (`8px 8px 0 0 var(--shadow-ink)`), overriding the 3px shadow from `.ik-card` regardless of class order or specificity.

3. **Tactile Press Physics Alignment**:
   - Replacing `whileTap={{ scale: 0.985 }}` in `apps/web/src/views/TaskCard.tsx` with `whileTap={justCompleted ? undefined : { translateX: 2, translateY: 2 }}` eliminates the spring scale-down effect and aligns with `whileHover={justCompleted ? undefined : { translateX: -2, translateY: -2 }}`.
   - Adding `.task-card:active { transform: translate(2px, 2px); box-shadow: none; }` in `apps/web/src/styles.css` ensures the hard shadow collapses to 0 and the card sinks 2px on press, completing the Inkline Level 3 elevation state.

4. **Touch Target Accessibility**:
   - Adding `@media (pointer: coarse), (max-width: 640px) { .btn-sm { min-height: 44px; } }` and `@media (pointer: coarse), (max-width: 640px) { .icon-toggle { min-width: 44px; min-height: 44px; } }` in `apps/web/src/styles.css` satisfies the 44px minimum touch target requirement on touch devices and small viewports without disrupting dense desktop layouts.

5. **Safe-Area Inset Support**:
   - Updating `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />` in `apps/web/index.html` enables WebKit and Chromium on mobile to supply valid `env(safe-area-inset-*)` values, preventing the floating bottom dock and FAB from overlapping the iOS home indicator bar.

6. **Storage Key Modernization with Zero Migration Pain**:
   - In `apps/web/index.html`, the pre-paint script checks `localStorage.getItem("throughline-theme") || localStorage.getItem("lg-theme") || "light"`.
   - In `apps/web/src/lib/useTheme.ts`, `STORAGE_KEY = "throughline-theme"` and `LEGACY_STORAGE_KEY = "lg-theme"`. `getStoredThemePreference()` checks the modern key first and falls back to the legacy key. Whenever a preference is saved, it writes to `"throughline-theme"`.
   - `apps/web/src/hooks/useTheme.ts` re-exports from `../lib/useTheme` to ensure all existing consumers in the codebase seamlessly use the modern key.

---

## 3. Caveats

1. **Milestone 4 E2E Test Suite**:
   - A parallel worker (`teamwork_preview_test_writer_m4_1`) is currently authoring `apps/web/src/test/e2e-inkline.test.tsx` for Milestone 4. That file contains tests for upcoming features (M2 shortcuts, M3 affordances) and currently has TypeScript type errors and failing assertions that are outside M1's scope. All 40 baseline test suites in the repository pass with 100% rate.
2. **Pre-existing ESLint Warnings**:
   - Two pre-existing Fast Refresh warnings in `PlannerProvider.tsx:125` and `FilterBar.tsx:213` remain untouched as they belong to other milestones.

---

## 4. Conclusion

All 6 requirements for Milestone 1 (Inkline Visual System, Tokens & Elevation) have been fully implemented with genuine logic and strict adherence to the project rules and constraints:
1. Full Inkline color palette and shadow tokens added to Tailwind v4 `@theme`.
2. Level 4 overlay elevation (`box-shadow: var(--shadow-3)`) applied to `.modal-panel` and `.onboarding-panel`.
3. Tactile press physics (`translate(2px, 2px)` collapsing shadow) implemented on `TaskCard` via CSS and Framer Motion, with `scale: 0.985` eliminated.
4. Mobile touch targets for `.btn-sm` (44px min-height) and `.icon-toggle` (44x44px min bounding area) implemented via media queries.
5. `viewport-fit=cover` added to `<meta name="viewport">` in `index.html`.
6. Theme storage key modernized to `"throughline-theme"` with fallback to legacy `"lg-theme"` in `index.html`, `apps/web/src/lib/useTheme.ts`, and `apps/web/src/hooks/useTheme.ts`.

---

## 5. Verification Method

To independently verify this implementation, run:

1. **Linting on Modified Files**:
   ```powershell
   npx eslint apps/web/src/lib/useTheme.ts apps/web/src/hooks/useTheme.ts apps/web/src/ui/Overlay.tsx apps/web/src/views/OnboardingOverlay.tsx apps/web/src/views/TaskCard.tsx
   ```
   *Expected result*: Exit code 0, 0 errors.

2. **Run All Core Unit & Integration Tests**:
   ```powershell
   npx vitest run --exclude "**/e2e-inkline.test.tsx"
   ```
   *Expected result*: 40 test files passed, 155 tests passed (100% pass rate).

3. **Build All Apps & Packages**:
   ```powershell
   npm run build
   ```
   *Expected result*: Exit code 0, all workspaces compiled and bundled successfully.

4. **Inspect Code Diffs**:
   ```powershell
   git diff apps/web/index.html apps/web/src/styles.css apps/web/src/views/TaskCard.tsx apps/web/src/hooks/useTheme.ts
   ```
   *Expected result*: Verify exact token definitions in `@theme`, `.task-card:active`, touch target media queries, Level 4 box shadows, `viewport-fit=cover`, and theme key modernization.
