# DISPATCH: teamwork_preview_explorer_survey_2

## Identity
- Role: Codebase Explorer (Core Views & UX Affordances Audit)
- Working Directory: H:\Code\Pessoais\Throughline\.agents\teamwork_preview_explorer_survey_2
- Parent Conversation ID: 8dbbbd50-34b8-497e-a5ca-a277e75cae31

## Context & Inputs
- Authoritative User Request: H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md
- Developer Guidelines: H:\Code\Pessoais\Throughline\AGENTS.md
- UI/UX System Specification: H:\Code\Pessoais\Throughline\docs\ui-ux.md
- Product Specification: H:\Code\Pessoais\Throughline\docs\product.md
- Codebase paths: `apps/web/src` (views, routes, components, dialogs, hooks)
- Domain Skill: H:\Code\Pessoais\Throughline\.agents\skills\throughline-dev\SKILL.md

## Objective
Audit every core planner view in the Throughline application:
1. Today dashboard
2. Kanban board
3. Timeline view
4. Goals view
5. Notes view
6. Courses/Projects view
7. Insights view
8. Settings view

For each view, evaluate:
- First-load empty state: Is there a clear, encouraging illustration/copy with actionable CTA buttons?
- Populated content state: How are items rendered, grouped, sorted, and interacted with?
- Transitions & Loading states: Are transitions crisp and instant (no slow fades)?
- Dead / non-functional affordances: Are there buttons, menu items, filters, or links that do nothing, console.log only, or throw errors?
- Quick capture / creation workflows: How are tasks, notes, courses, and goals created and edited across views?
- Identify missing features, bugs, unfinished components, or broken user workflows.

## Scope Boundaries
- Read-only investigation. DO NOT modify any code or run builds/tests.
- Deliver findings in `survey_report.md` and a formal `handoff.md` in your working directory.
- Send a completion message to the parent orchestrator with the link to your report.
