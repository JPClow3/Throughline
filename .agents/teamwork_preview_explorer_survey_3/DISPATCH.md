# DISPATCH: teamwork_preview_explorer_survey_3

## Identity
- Role: Codebase Explorer (Responsive, PWA, Keyboard Navigation & Accessibility)
- Working Directory: H:\Code\Pessoais\Throughline\.agents\teamwork_preview_explorer_survey_3
- Parent Conversation ID: 8dbbbd50-34b8-497e-a5ca-a277e75cae31

## Context & Inputs
- Authoritative User Request: H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md
- Developer Guidelines: H:\Code\Pessoais\Throughline\AGENTS.md
- UI/UX System Specification: H:\Code\Pessoais\Throughline\docs\ui-ux.md
- Product Specification: H:\Code\Pessoais\Throughline\docs\product.md
- Codebase paths: `apps/web/src` (shell, navigation, modals, keyboard hooks, accessibility features)
- Domain Skill: H:\Code\Pessoais\Throughline\.agents\skills\throughline-dev\SKILL.md

## Objective
Audit the application's responsiveness, mobile PWA adaptations, keyboard workflows, and accessibility:
1. Responsive Layout:
   - Behavior at 375px (mobile), 768px (tablet), and 1280px (desktop).
   - Mobile: fluid stacking, bottom navigation dock, min 44x44px touch targets, bottom sheets for dialogs.
   - Desktop: clean gutters, sidebar/header tab navigation, centered dialog overlays.
   - Check for horizontal overflow, clipping, or viewport layout bugs.
2. Keyboard Navigation & Shortcuts:
   - Global shortcuts: 'N' for quick capture / note creation, 'Ctrl/Cmd+K' for command palette.
   - Modal/sheet focus management: focus trapping, Escape to close, restoring focus to trigger element.
3. Accessibility & A11y:
   - ARIA roles, labels on buttons/icons, screen reader announcements for Kanban board moves or status changes.
   - WCAG AA contrast compliance across both light (`#f1ede3`) and dark (`#15171e`) paper modes with ink text and signal accents.
4. Current build & test health:
   - Check existing test files, typecheck configurations, lint rules, and playwright test structures.

## Scope Boundaries
- Read-only investigation. DO NOT modify any code or run builds/tests.
- Deliver findings in `survey_report.md` and a formal `handoff.md` in your working directory.
- Send a completion message to the parent orchestrator with the link to your report.

## 2026-09-10T08:02:44Z
Audit responsive layouts (375px to 1280px), mobile PWA adaptations, keyboard workflows ('N', 'Ctrl+K'), focus traps, ARIA roles, and announcements. Produce survey_report.md and handoff.md in H:\Code\Pessoais\Throughline\.agents\teamwork_preview_explorer_survey_3. Send a message to parent when done.

