# DISPATCH: worker_m1_1

## Identity
- Role: Implementation Worker (M1: Inkline Visual System, Tokens & Elevation)
- Working Directory: H:\Code\Pessoais\Throughline\.agents\worker_m1_1
- Parent Conversation ID: 8dbbbd50-34b8-497e-a5ca-a277e75cae31

## Context & Inputs
- Authoritative User Request: H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md
- Project Scope & Architecture: H:\Code\Pessoais\Throughline\PROJECT.md
- Guidelines & Rules: H:\Code\Pessoais\Throughline\AGENTS.md and H:\Code\Pessoais\Throughline\docs\ui-ux.md
- Domain Skill: H:\Code\Pessoais\Throughline\.agents\skills\throughline-dev\SKILL.md
- Survey Reports (Detailed Evidence & Exact Locations):
  - H:\Code\Pessoais\Throughline\.agents\teamwork_preview_spec_miner_survey_1\survey_report.md
  - H:\Code\Pessoais\Throughline\.agents\teamwork_preview_explorer_survey_2\survey_report.md
  - H:\Code\Pessoais\Throughline\.agents\teamwork_preview_explorer_survey_3\survey_report.md

## Exclusive Write Ownership
You EXCLUSIVELY own and may modify ONLY these files:
- `apps/web/src/styles.css`
- `apps/web/src/ui/Overlay.tsx`
- `apps/web/src/views/OnboardingOverlay.tsx`
- `apps/web/src/views/TaskCard.tsx`
- `apps/web/src/lib/useTheme.ts`
- `apps/web/index.html`

## Objective & Implementation Requirements (M1)
Implement the following 6 features with 100% fidelity:
1. **Full Palette in Tailwind v4 `@theme` (`apps/web/src/styles.css`)**:
   Add all Inkline color tokens to `@theme` block:
   `--color-yellow: var(--yellow);`
   `--color-blue: var(--blue);`
   `--color-green: var(--green);`
   `--color-red: var(--red);`
   `--color-violet: var(--violet);`
   `--color-ink: var(--ink);`
   `--color-ink-soft: var(--ink-soft);`
   `--color-ink-faint: var(--ink-faint);`
   `--color-paper: var(--paper);`
   `--color-card: var(--card);`
   `--color-line: var(--line);`
   `--color-shadow-ink: var(--shadow-ink);`
   and shadow utilities (`--shadow-0: var(--shadow-0);` etc.) so Tailwind utilities work directly.

2. **Level 4 Overlay Elevation (`apps/web/src/ui/Overlay.tsx`, `OnboardingOverlay.tsx`, `styles.css`)**:
   - `docs/ui-ux.md` mandates that Level 4 overlays (sheets, modals) carry an 8px 8px hard offset shadow (`box-shadow: var(--shadow-3);` / `8px 8px 0 0`).
   - Fix `.modal-panel`: Ensure `.modal-panel` explicitly sets `box-shadow: var(--shadow-3);` in `styles.css` so it does not inherit the 3px shadow (`--shadow-1`) from `ik-card`.
   - Fix `.onboarding-panel`: Ensure `.onboarding-panel` explicitly sets `box-shadow: var(--shadow-3);`.

3. **Tactile Press Physics on TaskCard (`apps/web/src/styles.css`, `apps/web/src/views/TaskCard.tsx`)**:
   - In `styles.css`: Add `.task-card:active` rule with `transform: translate(2px, 2px); box-shadow: none;`.
   - In `TaskCard.tsx`: Replace Framer Motion `whileTap={{ scale: 0.985 }}` with tactile press displacement (`whileTap={{ x: 2, y: 2 }}` and collapsing shadow or rely on CSS `:active`). Ensure no scale down happens.

4. **Mobile Touch Target Sizing (`apps/web/src/styles.css`)**:
   - For touch viewports / mobile (e.g. `@media (pointer: coarse)` or mobile breakpoints):
     - Ensure `.icon-toggle` has a minimum touch bounding target of 44x44px (e.g., `min-width: 44px; min-height: 44px;` or using touch target pseudo-elements).
     - Ensure `.btn-sm` on mobile has a minimum touch target height of 44px.

5. **Viewport Meta for Safe Area Insets (`apps/web/index.html`)**:
   - Update `<meta name="viewport" ...>` to include `viewport-fit=cover`.

6. **Storage Key Modernization (`apps/web/src/lib/useTheme.ts`, `apps/web/index.html`)**:
   - Modernize the theme storage key to `"throughline-theme"`, while checking `"lg-theme"` as a fallback so existing user settings are preserved.

## Verification Commands
You MUST run the following build and verification commands:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

Document all commands run and exact outputs in your `handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-10T08:11:09Z
Read your dispatch instructions in H:\Code\Pessoais\Throughline\.agents\worker_m1_1\DISPATCH.md. Also read H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md, H:\Code\Pessoais\Throughline\PROJECT.md, H:\Code\Pessoais\Throughline\docs\ui-ux.md, H:\Code\Pessoais\Throughline\AGENTS.md, and H:\Code\Pessoais\Throughline\.agents\skills\throughline-dev\SKILL.md. Implement Milestone 1 (Inkline Visual System, Tokens & Elevation). Run npm run typecheck, npm run lint, npm run test, and npm run build. Produce handoff.md and progress.md in H:\Code\Pessoais\Throughline\.agents\worker_m1_1 and message parent when complete. DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
