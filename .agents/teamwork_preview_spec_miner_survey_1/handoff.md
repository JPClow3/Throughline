# Handoff Report: Inkline Design System & Visual Specification Survey

**Agent**: `teamwork_preview_spec_miner_survey_1` (Specification Investigator / Miner)  
**Parent Agent Conversation ID**: `8dbbbd50-34b8-497e-a5ca-a277e75cae31`  
**Date**: 2026-09-10  
**Status**: Hard Handoff (Task Complete)  
**Artifact Link**: `H:\Code\Pessoais\Throughline\.agents\teamwork_preview_spec_miner_survey_1\survey_report.md`

---

## 1. Observation

Direct observations from authoritative specifications and codebase files:

1. **Design System & Elevation Authority (`docs/ui-ux.md:15-32`)**:
   - Palette: `"Light mode is warm paper (#f1ede3) with near-black ink. Dark mode is a matte slate (#15171e) with bone-white ink and black offset shadows."`
   - Prohibition: `"No gradients, no blur, no translucency. Overlays dim the page with a flat ink wash."`
   - Elevation Ladder:
     - Level 0: `"Paper with a subtle dot-grid texture."`
     - Level 1: `"Solid card fill, 2px ink border, 14px radius, 3px 3px hard shadow."`
     - Level 2: `"The element lifts — translate(-2px, -2px) with a 5px 5px shadow."`
     - Level 3: `"The element sinks — translate(2px, 2px), shadow collapses to nothing."`
     - Level 4: `"Sheets/modals carry an 8px 8px shadow over a dimmed backdrop."`
2. **Product Rules & Boundaries (`AGENTS.md:14-16`)**:
   - `"Preserve the Inkline visual system (bold editorial neo-brutalism: paper surfaces, ink borders, hard offset shadows, signal accents) as defined in docs/ui-ux.md."`
   - `"Do not add a complex 3D layer unless the product direction explicitly changes; current Inkline depth comes from hard offset shadows and press physics on solid paper surfaces. No gradients, blurs, or translucency."`
3. **Current Token Implementation (`apps/web/src/styles.css:6-16, 24-77`)**:
   - `@theme` block defines only:
     ```css
     @theme {
       --color-primary: var(--blue);
       --color-on-primary: var(--paper);
       --color-surface: var(--card);
       --color-background: var(--paper);
       --color-on-surface: var(--ink);
       --color-on-surface-variant: var(--ink-soft);
       --color-outline: var(--ink-faint);
       --color-outline-variant: var(--line-soft);
       --font-sans: "Geist Variable", system-ui, -apple-system, "Segoe UI", sans-serif;
     }
     ```
   - Core palette variables defined in `:root` and `:root[data-theme="dark"]`:
     - Paper & Card: `--paper: #f1ede3` / `#15171e`, `--card: #faf8f1` / `#1e212b`.
     - Ink & Borders: `--ink: #191712` / `#ece7da`, `--line: #191712` / `#ece7da`, `--line-soft: rgba(25, 23, 18, 0.28)` / `rgba(236, 231, 218, 0.32)`.
     - Shadows: `--shadow-0: 2px 2px 0 0`, `--shadow-1: 3px 3px 0 0`, `--shadow-2: 5px 5px 0 0`, `--shadow-3: 8px 8px 0 0`.
     - Signal: `--yellow: #ffd43b`, `--blue: #3d5afe` / `#7d92ff`, `--green: #1fae67` / `#46cd88`, `--red: #ff5d47` / `#ff7a68`, `--violet: #8f6bf5` / `#ab8dff`.
     - Contrast Anchor: `--on-signal: #191712`.
4. **Active Element Press Physics (`apps/web/src/styles.css`)**:
   - `.btn:hover:not(:disabled)`: `transform: translate(-2px, -2px); box-shadow: var(--shadow-2);` (lines 402-405).
   - `.btn:active:not(:disabled)`: `transform: translate(2px, 2px); box-shadow: none;` (lines 406-409).
   - `.task-card:hover`: `transform: translate(-2px, -2px); box-shadow: var(--shadow-2);` (lines 1689-1692).
   - `.task-card:active`: **Completely missing** in `styles.css`.
5. **Overlay Shadows (`apps/web/src/ui/Overlay.tsx` & `styles.css`)**:
   - `.sheet`: `box-shadow: var(--shadow-3);` (8px 8px) in `styles.css:3008`.
   - `.palette-panel`: `box-shadow: var(--shadow-3);` (8px 8px) in `styles.css:3178`.
   - `.modal-panel`: Rendered via `<div ref={panelRef} className="modal-panel ik-card" ...>` (`Overlay.tsx:71`). Inherits `box-shadow: var(--shadow-1);` (3px 3px) from `.ik-card` instead of Level 4's 8px shadow.
   - `.onboarding-panel`: Rendered via `<div className="ik-card onboarding-panel ...">` (`OnboardingOverlay.tsx:105`). Inherits 3px shadow instead of 8px shadow.
6. **Navigation Group in Command Palette (`apps/web/src/views/CommandPalette.tsx:128-136`)**:
   - Nav items include Today, Goals, Board, Timeline, Notes, Projects, and Settings.
   - **Insights** is completely missing from the command palette navigation list, despite being a primary view in `AppShell.tsx:22` and `NAV_ITEMS`.
7. **Legacy Assets (`apps/web/public/brand/colors/`)**:
   - `throughline.tokens.css`, `throughline.tailwind-tokens.ts`, and `colors.md` define legacy glassmorphism styles (`backdrop-filter: blur(24px)`, `--tl-surface-glass`, and linear hero gradients).
   - `useTheme.ts:6` and `index.html:16` still use `STORAGE_KEY = "lg-theme"` (Liquid Glass).

---

## 2. Logic Chain

1. **Elevation Conformance**:
   - `docs/ui-ux.md` specifies that overlays (Level 4) must use an 8px 8px hard offset shadow (`--shadow-3`).
   - Observations show `.sheet` and `.palette-panel` comply by setting `box-shadow: var(--shadow-3)`.
   - However, `Overlay.tsx` assigns `ik-card` to `.modal-panel`, causing it to receive `--shadow-1` (3px 3px 0 0).
   - Therefore, modals and confirmation dialogs fall short of the Level 4 elevation requirement by 5px of displacement.
2. **Press Physics Completeness**:
   - `ORIGINAL_REQUEST.md` (R2/Acceptance Criteria) requires tactile press physics (`translate(2px, 2px)` collapsing shadow on active press) across all interactive cards, buttons, and chips.
   - Observations show `.task-card` has hover physics (`translate(-2px, -2px)` with 5px shadow), but lacks an `:active` rule.
   - Therefore, clicking or pressing a task card feels rigid compared to buttons and goal cards.
3. **Tailwind v4 Token Availability**:
   - In Tailwind CSS v4, utilities like `text-ink-soft` or `bg-green` require definition in `@theme`.
   - The current `@theme` block in `styles.css` only maps 9 semantic keys and omits all palette tokens.
   - Consequently, components in `src/views/` use ad-hoc arbitrary Tailwind values (`text-[var(--ink-soft)]`, `text-[var(--green)]`, `!bg-[var(--green)]`).
   - Extending `@theme` with the full Inkline palette will clean up component syntax and ensure consistency.
4. **Navigation Parity**:
   - `docs/product.md` and `AppShell.tsx` establish 8 distinct views: Today, Goals, Board, Timeline, Notes, Projects, Insights, and Settings.
   - `CommandPalette.tsx` includes shortcuts to 7 views, omitting Insights.
   - Therefore, keyboard-driven navigation via Command Palette is incomplete for power users.

---

## 3. Caveats

- **Scope Boundary**: This investigation was strictly read-only. No code modifications were made and no builds or test suites were executed, per dispatch constraints.
- **Legacy Files**: While `apps/web/public/brand/colors/` contains glassmorphism tokens and blurs, verification confirmed they are not imported or bundled into `apps/web/src/main.tsx`.
- **Pre-existing Tests**: Existing test files in `apps/web/src/test/` test functional logic, but do not assert CSS computed box-shadow values on modal dialogs or task cards.

---

## 4. Conclusion

Throughline's visual architecture is remarkably aligned with the Inkline neo-brutalist philosophy:
- Gaussian blurs, soft drop-shadows, and smooth translucent gradients are 100% eliminated from active code.
- Solid paper surfaces, 2px crisp ink borders, and hard offset block shadows are consistently implemented.
- The 8 identified discrepancies (detailed in `survey_report.md` Section 8) represent concrete, scoped, and high-leverage fixes that will elevate the design system to 100% specification fidelity.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Prohibited Styles Elimination**:
   ```powershell
   # Confirm no CSS blurs in web app source
   rg -i "backdrop-filter|blur\(" apps/web/src/
   
   # Confirm no linear gradient washes in web app source
   rg -i "linear-gradient" apps/web/src/
   ```
2. **Verify Missing TaskCard Active State**:
   ```powershell
   rg "\.task-card:active" apps/web/src/styles.css
   # Result: 0 matches
   ```
3. **Verify Modal Shadow Elevation Defect**:
   - Open `apps/web/src/ui/Overlay.tsx:71` and observe `className="modal-panel ik-card"`.
   - Open `apps/web/src/styles.css:358-363` and observe `.ik-card { box-shadow: var(--shadow-1); }` (3px 3px 0 0) instead of `--shadow-3` (8px 8px 0 0).
4. **Verify Missing Insights in Command Palette**:
   - Open `apps/web/src/views/CommandPalette.tsx:128-136` and observe Navigation group list.
