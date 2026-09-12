# BRIEFING — 2026-09-10T11:55:00Z

## Mission
Investigate Feature 10: Focus management, focus trapping, and Escape key restoration in Overlay.tsx, dialogA11y.ts, CommandPalette.tsx, and related tests for Milestone 2.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: H:\Code\Pessoais\Throughline\.agents\explorer_m2_3
- Original parent: a9220575-477d-4571-88de-6eb44cdafdee
- Milestone: Milestone 2 (Shell, Navigation & Keyboard Workflows)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Inspect Focus management, focus trapping, and Escape key restoration (Feature 10)
- Inspect apps/web/src/ui/Overlay.tsx and CommandPalette.tsx
- Check e2e-inkline.test.tsx expectations

## Current Parent
- Conversation ID: a9220575-477d-4571-88de-6eb44cdafdee
- Updated: 2026-09-10T11:55:00Z

## Investigation State
- **Explored paths**:
  - `apps/web/src/ui/Overlay.tsx` (`Sheet`, `Modal`, `ModalCloseButton`)
  - `apps/web/src/ui/dialogA11y.ts` (`useDialogA11y`)
  - `apps/web/src/views/CommandPalette.tsx`
  - `node_modules/cmdk/dist/index.mjs` & `node_modules/@radix-ui/react-dialog/dist/index.mjs`
  - `apps/web/src/test/e2e-inkline.test.tsx` (T1.44, T1.46-T1.50, T3.4, T4.5)
  - `apps/web/src/test/Sheet.test.tsx`, `CommandPalette.test.tsx`, `ui-components.test.tsx`
  - `apps/web/src/styles.css` (.palette-backdrop, .sheet, .modal-panel)
- **Key findings**:
  1. `dialogA11y.ts` captures `previouslyFocused` in `useEffect`, which runs after child `autoFocus` has already focused an inner element, causing `previouslyFocused` to reference the unmounting inner input instead of the trigger.
  2. `dialogA11y.ts` forces focus onto `focusables[0]` after 10ms, which in `Sheet` is always the header Close "X" button, stealing focus from `TaskComposer`'s `<TextInput autoFocus />`.
  3. `dialogA11y.ts` focusable selector does not exclude `[tabindex="-1"]` on `button`/`input`/`select`/`textarea`, trapping focus on non-tabbable controls, and doesn't handle empty focusable dialogs.
  4. In `Escape` key handler, `event.preventDefault()` and `event.stopPropagation()` are missing.
  5. `CommandPalette.tsx` uses `cmdk`'s `Command.Dialog` which wraps Radix Dialog without a trigger; Radix's `onCloseAutoFocus` prevents default and tries to focus `null`, dropping focus completely on close.
  6. `CommandPalette.tsx` applies backdrop classes to `cmdk-root` inside Radix's content, so clicks on the backdrop do not dismiss the palette.
  7. No existing tests verify Tab wrapping or focus restoration after Escape for Sheet or CommandPalette.
- **Unexplored areas**: None within Feature 10 scope.

## Key Decisions Made
- Fully documented exact bugs, root causes, and before/after code proposals for Worker.

## Artifact Index
- handoff.md — Final 5-component handoff report
- progress.md — Liveness and progress tracking
- DISPATCH.md — Initial task dispatch record
