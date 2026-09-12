# DISPATCH: teamwork_preview_test_writer_m4_1

## Identity
- Role: E2E Test Suite Designer & Writer (Milestone 4: E2E Testing Track)
- Working Directory: H:\Code\Pessoais\Throughline\.agents\teamwork_preview_test_writer_m4_1
- Parent Conversation ID: 8dbbbd50-34b8-497e-a5ca-a277e75cae31

## Context & Inputs
- Authoritative User Request: H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md
- Project Scope & Architecture: H:\Code\Pessoais\Throughline\PROJECT.md
- Guidelines & Rules: H:\Code\Pessoais\Throughline\AGENTS.md and H:\Code\Pessoais\Throughline\docs\ui-ux.md
- Domain Skill: H:\Code\Pessoais\Throughline\.agents\skills\throughline-dev\SKILL.md

## Exclusive Write Ownership
You EXCLUSIVELY own and may create/modify:
- `TEST_INFRA.md` (at project root `H:\Code\Pessoais\Throughline\TEST_INFRA.md`)
- `TEST_READY.md` (at project root `H:\Code\Pessoais\Throughline\TEST_READY.md`)
- Test files in `apps/web/src/test/` (e.g., `apps/web/src/test/e2e-inkline.test.tsx` or new test suites)

DO NOT modify application source code in `apps/web/src/views/`, `apps/web/src/shell/`, `styles.css`, etc.

## Objective & Test Suite Design (4 Tiers)
Derive a comprehensive, requirement-driven opaque-box test suite from `ORIGINAL_REQUEST.md` and `docs/ui-ux.md`:

1. **Tier 1 - Feature Coverage (>=5 per feature)**:
   - Happy path tests for every view and feature in isolation:
     - Today Dashboard: agenda rendering, overdue tasks, quick log.
     - Kanban Board: columns (Inbox, Backlog, Ready, In Progress, Done), status switching, live announcements.
     - Timeline: date navigation, agenda schedule display.
     - Goals: goal rendering, metric progress calculation, linked items.
     - Notes: note list, active note editor, tagging.
     - Projects/Courses: course groupings, task list.
     - Insights: completion metrics, focus statistics.
     - Settings: theme switching (light/dark), storage key persistence.
     - Global shortcuts: 'N' quick capture, 'Ctrl/Cmd+K' command palette.
     - Dialog overlays: focus trap, Escape to close.

2. **Tier 2 - Boundary & Corner Cases (>=5 per feature)**:
   - Empty states for all views (zero tasks, zero notes, zero goals, zero courses).
   - Maximum length strings (long task titles, notes bodies).
   - Extreme dates (past due, far future).
   - Theme toggle edge cases.
   - Rapid keyboard inputs.

3. **Tier 3 - Cross-Feature Combinations (Pairwise Coverage)**:
   - Creating a task with linked course and linked goal.
   - Creating a note linked to a goal and verifying cross-link visibility.
   - Completing a task on the Board or Today and checking updated metrics in Insights.
   - Searching for newly created tasks in Command Palette.

4. **Tier 4 - Real-World Workload Scenarios (>=5 realistic scenarios)**:
   - Student semester setup scenario: Add courses, add assignments with due dates, break into subtasks.
   - Daily morning planning scenario: Open Today, triage overdue, drag to In Progress on Kanban, start focus timer.
   - Midterm study sprint scenario: Create study goal, link notes, log study sessions, track progress.
   - End-of-day review scenario: Complete remaining tasks, verify confetti/XP, review completion metrics in Insights.
   - Full keyboard navigation flow: Jump through views using 'Ctrl+K', capture items with 'N', close with Escape.

## Outputs & Deliverables
1. `TEST_INFRA.md` at project root (`H:\Code\Pessoais\Throughline\TEST_INFRA.md`).
2. Concrete automated test implementation in `apps/web/src/test/e2e-inkline.test.tsx` (using Vitest and Testing Library/fake-indexeddb).
3. Verify tests compile and run via `npm run test` and `npm run typecheck`.
4. Publish `TEST_READY.md` at project root with coverage summary and invocation command.
5. Deliver `handoff.md` in your working directory.

## 2026-09-10T08:11:09Z
Read your dispatch instructions in H:\Code\Pessoais\Throughline\.agents\teamwork_preview_test_writer_m4_1\DISPATCH.md. Also read H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md, H:\Code\Pessoais\Throughline\PROJECT.md, H:\Code\Pessoais\Throughline\docs\ui-ux.md, H:\Code\Pessoais\Throughline\AGENTS.md, and H:\Code\Pessoais\Throughline\.agents\skills\throughline-dev\SKILL.md. Design and write the 4-tier E2E test suite in apps/web/src/test/e2e-inkline.test.tsx, write TEST_INFRA.md and TEST_READY.md at project root, verify with npm run test and npm run typecheck, and write handoff.md in H:\Code\Pessoais\Throughline\.agents\teamwork_preview_test_writer_m4_1. Send a message to parent when done.
