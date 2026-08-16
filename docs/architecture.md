# Architecture & Data Model

This document outlines the system architecture, core data models, and design system (Claymorphism) for Throughline.

## 1. System Architecture

### Workspace Layout
- `apps/web`: React/Vite PWA, Claymorphism UI, Dexie storage, Today/Goals/Notes/Board/Timeline/Projects, ICS export, JSON backup, notification setup.
- `apps/push-api`: Fastify API for redacted push subscriptions, reminder metadata, and due reminder dispatch.
- `packages/domain`: shared Zod schemas, sample data, gamification, ICS export, and redacted reminder contracts.

### App Flow
1. `apps/web/src/main.tsx` mounts `App` inside a top-level `ErrorBoundary`.
2. `App` lazy-loads secondary views (Goals, Board, Timeline, Notes, Projects, Settings).
3. `useTasks` exposes live Dexie queries for tasks, projects, goals, notes, settings, and progress.
4. UI actions call `addTask`, `updateTaskStatus`, or `completeTask`.
5. Progress, Today metrics, focus totals, and coaching prompts are recalculated through shared helpers in `packages/domain`.
6. Task mutations attempt redacted reminder sync in the background when a push endpoint exists.
7. ICS export calls `exportTasksToIcs` and downloads the result in the browser.

### Data Flow
The browser stores `tasks`, `courses`, `goals`, `notes`, `focusSessions`, settings, tombstones, and progress in IndexedDB. IndexedDB remains the UI source of truth, so capture, planning, focus logging, exports, and local backups keep working offline. The domain package validates record shape, calculates XP and progress, derives Today/focus/coaching metrics, exports ICS, and creates redacted reminders.

Account sync is optional. When a user signs in, records are encrypted on-device with a random data encryption key (DEK). The DEK is wrapped by keys derived from the password and from the recovery key; the server receives only derived auth material and encrypted DEK wrappers. `/sync/*` stores encrypted record blobs, IVs, timestamps, and tombstones; it never stores readable task titles, descriptions, notes, tags, subtasks, goals, or course details. The server cannot decrypt planner content.

Push data follows a separate path. The browser registers a subscription with `apps/push-api`, stores the returned endpoint hash locally, derives redacted reminders from local tasks, and bulk-syncs them with `PUT /subscriptions/:endpointHash/reminders`. The push service stores subscriptions and redacted reminder metadata only. Task text remains local.

### Push API Model
The push API is split into config, schemas, server routes, and a store interface. The current store is JSON-backed and serializes writes to avoid file races. A future SQLite or hosted store should implement the same store interface. Dispatch uses `notifyAt`, not `dueAt`, so reminders can fire before a task is due.

### Offline Model
The app utilizes a custom service worker (`sw.ts`) built via the Vite PWA plugin's `injectManifest` strategy. This worker precaches the app shell via Workbox, supports push notifications, handles background and periodic sync events, and falls back to `index.html`. User data lives in IndexedDB through Dexie. Core task workflows should work without the push API.

### Resilience
A top-level `ErrorBoundary` catches render errors and shows a calm reload screen; local IndexedDB data is untouched. Users can export and re-import all planner content as JSON from Settings.

### Sync & Recovery Model
Encrypted cloud sync has been added as an explicit beta feature. Reconciliation uses stable record IDs, `updatedAt`/`changedAt` timestamps, last-write-wins behavior, and deletion tombstones. Push notifications remain separate and redacted.

Password loss is recoverable only with the recovery key. If both password and recovery key are lost, encrypted synced content cannot be recovered because the server has no readable task data and no escrowed DEK.

---

## 2. Data Model

The canonical data model lives in `packages/domain/src/types.ts`. Use those Zod schemas and exported TypeScript types instead of redefining shapes in app code.

### Task
Required identity and text: `id`, `title` (1-140 chars), `description` (optional).
Workflow: `status`, `courseId`, `goalId`, `order`, `dueAt`, `reminderAt`, `createdAt`, `updatedAt`, `completedAt`.
Gamification: `priority`, `energy`, `difficulty`, `estimatedMinutes`, `xp`, `attributes`, `visualSeed`.
Organization: `tags`, `subtasks`.

### Course (Project/Area)
The `Course` schema is the storage type for what the UI now calls a **Project/Area**.
Properties: `id`, `name`, `code`, `color`, `icon`, `professor`, `semester`.

### Goal
Progress is **derived** from child tasks via `deriveGoalProgress` (`goals.ts`), never stored.
Properties: `id`, `title`, `summary`, `status`, `targetDate`, `projectId`, `color`, `icon`, `priority`, `createdAt`, `updatedAt`, `completedAt`.

### Note
Notes are first-class and cross-link to tasks and goals many-to-many.
Properties: `id`, `title`, `body`, `taskIds`, `goalIds`, `projectId`, `pinned`, `createdAt`, `updatedAt`. Note bodies are private task-adjacent content and must never reach the push service.

### Focus Session
Focus sessions are first-class local planner records. They may be untitled or attached to a task, project/course, and goal.
Properties: `id`, `title`, `taskId`, `courseId`, `goalId`, `startedAt`, `endedAt`, `durationMinutes`, `createdAt`, `updatedAt`.

Legacy synthetic completed tasks named `Focus Session` with the `focus` tag are preserved for historical analytics only; new focus work is stored in `focusSessions`.

### User Progress
Progress is derived from completed tasks and stored under the fixed ID `local-player`.
Properties: `xp`, `level`, `streakDays`, `attributes`, `badges`.

### Redacted Reminder
Redacted reminders are the only task-adjacent data the push service may store. Task title, description, course name, tags, and subtasks are intentionally excluded.
Properties: `reminderId`, `taskId`, `dueAt`, `notifyAt`, `urgency`, `title` (always `Quest reminder`), `body` (always `A study quest needs your attention.`), `createdAt`.

### IndexedDB Stores
Dexie database name: `liquidglass-study-quests`.
- `tasks`: indexed by `id,status,courseId,goalId,dueAt,priority,updatedAt`.
- `courses`: indexed by `id,name,code`.
- `progress`: indexed by `id`.
- `settings`: indexed by `id,updatedAt` and stores appearance, sync, onboarding, and saved filter presets.
- `goals`: indexed by `id,status,projectId,targetDate,updatedAt`.
- `notes`: indexed by `id,pinned,projectId,updatedAt,*taskIds,*goalIds`.
- `focusSessions`: indexed by `id,startedAt,taskId,courseId,goalId,updatedAt`.

---

## 3. Design System (Claymorphism)

The design system embodies the Claymorphism aesthetic described in `ui-ux.md`—soft inflated shapes, double inner shadows, and solid pastel surfaces that prioritize depth, clarity, and legibility without blurs or translucency.

### Brand & Style
The style merges Claymorphism with Minimalism: solid opaque surfaces with a bright top-left inner highlight and a darker bottom-right inner shadow create a tactile "inflated" 3D volume. The emotional response is one of "focused serenity"—the UI should feel like a soft, high-end physical planner.

### Colors
The palette is centered on a light-first execution on solid surfaces.
- **Primary:** Refined Indigo.
- **Surface:** Solid off-whites and pastels (clay base).
- **Accents:** Mint and Blue.
- **Inner Shadows:** Bright top-left highlight plus darker bottom-right depth.

### Typography
Uses **Geist** for its technical precision and clean, geometric architecture. Font weights are intentionally reduced. Tabular numerals are used for stats and dates.

### Layout & Spacing
- **Desktop:** 12-column grid with 24px gutters and 64px side margins.
- **Whitespace:** Emphasize "Functional Whitespace" (48px+ gaps).
- **Clay Modules:** 24px internal padding and bubbly (24px+) corner radii.

### Elevation & Depth
1. **Level 0 (Background):** Solid soft color (off-white or soft pastel).
2. **Level 1 (Substrate):** Main content panels (solid fill, double inner shadows, large radius).
3. **Level 2 (Interactive):** Hovered states and cards (lighter fill, pronounced drop shadow).
4. **Level 3 (Modals/Overlays):** Deepest outer shadow and prominent inflation.

### Visual Depth
There is no 3D layer and no blur/translucency. Depth comes from **inflated solid surfaces**: every clay element carries inner highlights and inner shadows that define its volume.
