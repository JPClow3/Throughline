# Product & Requirements

This document outlines the product requirements, features, current roadmap, and codebase structure for Throughline.

## 1. Product Goal & Requirements

**Goal**: Build a personal student-life task app that feels alive, fast, and motivating without giving up practical reliability. The app should make school work feel like RPG quests while still behaving like a serious offline productivity tool.

**Target Platforms**: 
- Browser: modern Chromium, Edge, Firefox, and Safari where supported by PWA APIs.
- Smartphone: mobile browser and installable PWA experience.
- Windows: installable/store-ready PWA.

**Must Have**:
- Installable PWA with offline app shell.
- Local-first task data stored in IndexedDB.
- LiquidGlass visual system with translucent depth, strong contrast, suave colors, and responsive layout.
- Visual task representation through quest cards, XP, urgency, energy, difficulty, RPG attributes, and completion state.
- Kanban visualization with Backlog, Ready, Doing, Blocked, and Done.
- ICS export for due-date tasks.
- Notification support through local browser notifications and a redacted push API scaffold.
- Optional game layer (RPG attributes, XP, levels, streaks), off by default and toggled in Settings.
- Local JSON backup export/import so device-local data is portable and recoverable.

**V1 Boundaries**:
- No user accounts in production behavior.
- No full cloud sync.
- No server storage of full task records.
- Push payloads must not include task titles, descriptions, course names, or tags.
- 3D is supportive ambience, not the primary management surface.

## 2. Feature Specs

### Today Dashboard
A calm cockpit for the day. Shows greeting, date, and a progress hero ("X of Y tasks done"). Includes daily progress (grid of per-project cards) and a "Due soon" list.

### Task Composer & Cards
- **Composer**: Fast capture via a floating glass sheet. Up-front fields are minimal (Title, Project, Due).
- **Cards**: Calm, scannable task representation. Show project colour, title, due date (quietly), and quiet glyphs. Clicking the card title opens the task in an Edit task sheet.

### Goals & Notes
- **Goals**: End goals decomposed into real tasks with roll-up progress. Goal detail view shows a progress ring and child tasks.
- **Notes**: A cross-linked notebook. Notes link many-to-many to tasks and goals. Includes a Write/Preview toggle for markdown.

### Views
- **Kanban**: Primary workflow surface (Backlog, Ready, Doing, Blocked, Done). Drag/drop is implemented with `@dnd-kit`.
- **Timeline**: A time-of-day agenda for a single day. Time-blocked agenda cards.
- **Projects / Areas**: Optional organiser for tasks, goals, and notes.

### Notifications & ICS Export
- **Notifications**: Reminders without compromising local-first privacy. Syncs redacted reminders to the push API.
- **ICS Export**: Move due quests into external calendar tools.

## 3. Roadmap

**Shipped (beta)**:
- Calm, light-first planner with a softer dark mode (LiquidGlass visual system).
- Core entities: Goals, Tasks, Notes, Projects.
- Views: Today, Board, Timeline, Projects, Notes.
- Tech: React 19 / Vite / Tailwind 4 PWA; Dexie local-first storage. Fastify push API. Docker images + Compose stack. Playwright E2E suites.
- End-to-end-encrypted cloud sync (beta).

**Next product milestones**:
1. Recovery key at signup & email verification/password reset.
2. Inline subtask editing inside the task editor.
3. Richer Board/Timeline filters.
4. Keyboard-only Kanban alternative and accessibility pass.
5. PWA install polish (Microsoft Store packaging).
6. Lightweight observability on the API.

## 4. Project Map

### Root
- `package.json`: workspace scripts.
- `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`: test and linting configs.

### Web App (`apps/web`)
- `vite.config.ts`: React, Tailwind, PWA manifest.
- `src/App.tsx`: view routing.
- `src/styles.css`: LiquidGlass token system.
- `src/data/`: Dexie database (`db.ts`), repositories, reminder sync.
- `src/hooks/`: React hooks for data (`useTasks.ts`, `useGoals.ts`, etc).
- `src/components/`: Core UI components (AppShell, Dashboard, TaskCard, Sheet, KanbanBoard, etc).
- `tests/`: Playwright E2E, performance, and stress tests.

### Push API (`apps/push-api`)
- `src/server.ts`: Fastify routes.
- `src/store.ts`: JSON-backed subscription/reminder repository.

### Domain Package (`packages/domain`)
- `src/types.ts`: Zod schemas and shared types.
- `src/gamification.ts`, `goals.ts`, `notes.ts`, `ics.ts`, `reminders.ts`: Core business logic.
- `src/sample-data.ts`: Seeded student-life courses and quests.
