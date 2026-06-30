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
- Local-first task data stored in IndexedDB, with optional account sync across devices.
- End-to-end-encrypted cloud sync: planner records are encrypted on-device, and the server stores ciphertext it cannot read.
- Recovery key generation and confirmation during signup, plus regeneration from Settings.
- LiquidGlass visual system with translucent depth, strong contrast, suave colors, and responsive layout.
- Visual task representation through quest cards, XP, urgency, energy, difficulty, RPG attributes, and completion state.
- Kanban visualization with Backlog, Ready, Doing, Blocked, and Done.
- ICS export for due-date tasks.
- Notification support through local browser notifications and a redacted push API scaffold.
- Optional game layer (RPG attributes, XP, levels, streaks), off by default and toggled in Settings.
- Local JSON backup export/import so device-local data is portable and recoverable.

**V1 Boundaries**:
- Core planner workflows must remain usable offline, with IndexedDB as the UI source of truth.
- Accounts and sync are optional, not required for capture, planning, export, or local backup.
- No server storage of readable task records. Synced planner content may leave the device only as end-to-end-encrypted ciphertext.
- Recovery keys are required for password-loss recovery. If both password and recovery key are lost, encrypted synced content cannot be recovered.
- Push payloads must not include task titles, descriptions, course names, or tags.
- There is no 3D layer in the current product direction; LiquidGlass depth comes from layered surfaces on a solid base.

## 2. Feature Specs

### Today Dashboard
A calm cockpit for the day. Shows greeting, date, and a progress hero ("X of Y tasks done") backed only by real task data. Focus time, planned study time, completed-by-day activity, overdue count, and the next study block are derived from local tasks and focus sessions.

### Task Composer & Cards
- **Composer**: Fast capture via a floating glass sheet. Up-front fields are minimal (Title, Project, Due).
- **Cards**: Calm, scannable task representation. Show project colour, title, due date (quietly), and quiet glyphs. Clicking the card title opens the task in an Edit task sheet.
- **Focus**: Focus sessions can start from a task or as untitled focus. Completed sessions are stored as focus-session records, not as fake completed tasks.

### Goals & Notes
- **Goals**: End goals decomposed into real tasks with roll-up progress. Goal detail view shows a progress ring and child tasks.
- **Notes**: A cross-linked notebook. Notes link many-to-many to tasks and goals. Includes a Write/Preview toggle for markdown.

### Views
- **Kanban**: Primary workflow surface (Backlog, Ready, Doing, Blocked, Done). Drag/drop is implemented with `@dnd-kit`.
- **Timeline**: A time-of-day agenda for a single day. Time-blocked agenda cards.
- **Projects / Areas**: Optional organiser for tasks, goals, and notes.
- **Command/Search**: `Ctrl K` opens the command palette, searches tasks, notes, goals, and projects, and jumps directly to the right view or editor.
- **Filters**: Board and Timeline use native preset chips, tag chips, saved custom presets, and a visible clear action.
- **Insights**: Coaching cards answer what to adjust next using deterministic rules from tasks, projects, and focus sessions.
- **Onboarding**: First run is a setup wizard: choose school/work/personal, create 1-3 projects or courses, add a real task, optionally enable notifications or open Settings for sync, then land in Today.

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
1. Email verification.
2. Inline subtask editing inside the task editor.
3. PWA install polish (Microsoft Store packaging).
4. Lightweight observability on the API.

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
