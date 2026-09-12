# Dispatch for Worker M2

- Archetype: teamwork_preview_worker
- Working Directory: H:\Code\Pessoais\Throughline\.agents\worker_m2
- Milestone: Milestone 2 (Shell, Navigation & Keyboard Workflows)

MANDATORY FIRST STEP: Read H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md before starting any work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Files Owned Exclusively:
- apps/web/src/App.tsx
- apps/web/src/views/CommandPalette.tsx
- apps/web/src/ui/dialogA11y.ts
- apps/web/src/ui/Overlay.tsx
- apps/web/src/test/CommandPalette.test.tsx

Explorer Findings & Implementation Instructions:
1. Feature 7: Global 'N' shortcut in Goals view (`apps/web/src/App.tsx`):
   - In `primaryActionLabel` (lines 266-271), include `props.view === "goals"` alongside `"dashboard"`, `"kanban"`, `"timeline"`, `"courses"` to return `"New task"`.
2. Feature 8: Command Palette Insights navigation (`apps/web/src/views/CommandPalette.tsx`):
   - Import `ChartLine` from `@phosphor-icons/react`.
   - In `<Command.Group heading="Navigation">`, add:
     `<NavItem icon={<ChartLine size={16} weight="bold" />} label="Go to Insights" onSelect={() => runCommand(() => onNavigate("insights"))} />`
   - Update `CommandPalette.test.tsx` to verify "Go to Insights" navigates to insights.
3. Feature 9: URL query view alias 'view=today' (`apps/web/src/App.tsx`):
   - In `App.tsx`, introduce `VALID_VIEWS: AppView[] = ["dashboard", "goals", "kanban", "timeline", "notes", "courses", "insights", "settings"]`.
   - Introduce `VIEW_ALIASES: Record<string, AppView> = { today: "dashboard" }`.
   - Update `initialView()` to resolve aliases and validate views cleanly.
   - Update `useStateWithUrl` to normalize aliases in the URL query if needed.
4. Feature 10: Focus management, focus trapping, and Escape key handling (`apps/web/src/ui/dialogA11y.ts`, `Overlay.tsx`, `CommandPalette.tsx`):
   - Implement robust focus trapping and Escape key handling in `dialogA11y.ts`:
     - Tabbable selector filtering out `[tabindex="-1"]` and `[aria-hidden="true"]`.
     - Record `previouslyFocused` before autoFocus steals it, and restore it when closed.
     - If dialog contains an element that is already focused (e.g. `autoFocus`), do not steal focus with the initial focus timeout.
     - Stop propagation on `Escape` keydown when handling dialog close.
     - Trap Tab and Shift+Tab strictly inside the panel.
   - In `CommandPalette.tsx`, add backdrop click dismissal (close palette when clicking outside panel) and ensure focus is restored to previous active element on close.

Verification Requirements:
- Run `npm run typecheck` or test commands.
- Run `npx vitest run apps/web/src/test/CommandPalette.test.tsx`.
- Run `npx vitest run apps/web/src/test/Sheet.test.tsx`.
- Document all modified files, diffs, and verification commands/outputs in `H:\Code\Pessoais\Throughline\.agents\worker_m2\handoff.md`.

## 2026-09-10T11:56:07Z
You are Worker M2 for Throughline Milestone 2 (Shell, Navigation & Keyboard Workflows).
Working Directory: H:\Code\Pessoais\Throughline\.agents\worker_m2

MANDATORY FIRST STEP: Read H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md before starting any work.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Detailed instructions are provided in H:\Code\Pessoais\Throughline\.agents\worker_m2\DISPATCH.md and the 3 Explorer handoff reports:
- H:\Code\Pessoais\Throughline\.agents\explorer_m2_1\handoff.md
- H:\Code\Pessoais\Throughline\.agents\explorer_m2_2\handoff.md
- H:\Code\Pessoais\Throughline\.agents\explorer_m2_3\handoff.md

Implement the following features:
1. Feature 7: In `apps/web/src/App.tsx`, include `props.view === "goals"` in `primaryActionLabel` so 'N' triggers "New task", enabling quick capture on Goals view.
2. Feature 8: In `apps/web/src/views/CommandPalette.tsx`, import `ChartLine` from `@phosphor-icons/react` and add "Go to Insights" navigation item. Update `apps/web/src/test/CommandPalette.test.tsx` to verify this navigation item.
3. Feature 9: In `apps/web/src/App.tsx`, define `VALID_VIEWS` and `VIEW_ALIASES = { today: "dashboard" }` in `initialView()` to handle `view=today` alias cleanly.
4. Feature 10: In `apps/web/src/ui/dialogA11y.ts`, `Overlay.tsx`, and `CommandPalette.tsx`, implement robust focus trapping, focus restoration to the trigger element on close, proper `autoFocus` respect, Escape key event handling with stopPropagation, and backdrop dismissal on CommandPalette.

Verify your implementation with tests:
- Run `npx vitest run apps/web/src/test/CommandPalette.test.tsx`
- Run `npx vitest run apps/web/src/test/Sheet.test.tsx`
- Run `npm run typecheck` and any other relevant tests.

Write your complete handoff report to H:\Code\Pessoais\Throughline\.agents\worker_m2\handoff.md and notify via send_message when done.

