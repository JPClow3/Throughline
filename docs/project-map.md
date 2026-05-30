# Project Map

## Root

- `package.json`: npm workspace scripts and shared dev dependencies.
- `tsconfig.base.json`: shared TypeScript baseline.
- `eslint.config.js`: flat ESLint config and generated-folder ignores.
- `vitest.config.ts`: unit/component test and coverage config.
- `playwright.config.ts`: desktop/mobile E2E, performance, and stress project config.
- `AGENTS.md`: repo instructions for AI/code agents.

## Web App

- `apps/web/vite.config.ts`: React, Tailwind, PWA manifest, Workbox config, and chunk warning budget.
- `apps/web/src/App.tsx`: view routing (Today, Goals, Board, Timeline, Notes, Settings), lazy-loaded secondary views, lazy-loaded 3D scene.
- `apps/web/src/styles.css`: LiquidGlass token system (light + soft dark) and responsive layout.
- `apps/web/src/data/db.ts`: Dexie database (v4), IndexedDB stores (tasks, courses, progress, settings, goals, notes), seed logic, progress refresh.
- `apps/web/src/data/repositories.ts`: local-first task, course/project, goal, note, progress, and reminder-sync repositories.
- `apps/web/src/data/reminderSync.ts`: redacted reminder derivation and client-to-push-API sync.
- `apps/web/src/hooks/useTasks.ts`, `useGoals.ts`, `useNotes.ts`: live queries and mutation helpers.
- `apps/web/src/hooks/useTheme.ts`: resolves and applies the light/dark/system theme.
- `apps/web/src/components/AppShell.tsx`: sidebar/bottom navigation.
- `apps/web/src/components/Dashboard.tsx`: the Today view.
- `apps/web/src/components/TaskCard.tsx`: calm task representation (replaces the old QuestCard).
- `apps/web/src/components/TaskComposer.tsx`: fast task capture form (rendered inside the quick-add sheet).
- `apps/web/src/components/TaskEditor.tsx`: edit/delete form for an existing task (rendered inside the edit sheet).
- `apps/web/src/components/Sheet.tsx`: floating glass overlay/dialog (quick-add, task editing) with backdrop + Esc dismissal.
- `apps/web/src/components/EmptyState.tsx`: shared mono empty state (Phosphor glyph + title + body + optional action).
- `apps/web/src/components/GoalsView.tsx`, `GoalDetail.tsx`, `GoalRing.tsx`: goals grid, detail, and progress ring.
- `apps/web/src/components/NotesView.tsx`, `NoteEditor.tsx`: notebook master/detail and linking.
- `apps/web/src/components/ProjectsManager.tsx`: project/area management (rendered in Settings).
- `apps/web/src/components/KanbanBoard.tsx`: drag/drop board behavior.
- `apps/web/src/components/SettingsPanel.tsx`: appearance (theme + game layer), projects, notification setup, and ICS export.
- `apps/web/src/lib/noteCounts.ts`: maps note links to per-task counts.
- `apps/web/tests/*.e2e.spec.ts`: Playwright desktop/mobile functional smoke tests.
- `apps/web/tests/*.perf.spec.ts`: Playwright performance smoke budgets.
- `apps/web/tests/*.stress.spec.ts`: Playwright repeated-interaction stress smoke tests.

## Push API

- `apps/push-api/src/config.ts`: environment-derived host, port, store path, and VAPID config.
- `apps/push-api/src/schemas.ts`: route validation schemas.
- `apps/push-api/src/server.ts`: Fastify routes, VAPID setup, dispatch flow.
- `apps/push-api/src/store.ts`: JSON-backed subscription/reminder repository and endpoint hashing.

## Domain Package

- `packages/domain/src/types.ts`: Zod schemas and shared TypeScript types (Task, Course, Goal, Note, ...).
- `packages/domain/src/factories.ts`: task/course/goal/note creation helpers.
- `packages/domain/src/gamification.ts`: XP, levels, streaks, badges, RPG attributes (optional layer).
- `packages/domain/src/goals.ts`: goal roll-up progress and child-task ordering.
- `packages/domain/src/notes.ts`: note linking, search, and display helpers.
- `packages/domain/src/ics.ts`: calendar export.
- `packages/domain/src/reminders.ts`: redacted reminder creation.
- `packages/domain/src/sample-data.ts`: seeded student-life courses and quests.
- `packages/domain/test/*.test.ts`: domain unit tests.
