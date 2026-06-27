# Architecture & Data Model

This document outlines the system architecture, core data models, and design system (LiquidGlass) for Throughline.

## 1. System Architecture

### Workspace Layout
- `apps/web`: React/Vite PWA, Liquid Glass UI, Dexie storage, Today/Goals/Notes/Board/Timeline/Projects, ICS export, JSON backup, notification setup.
- `apps/push-api`: Fastify API for redacted push subscriptions, reminder metadata, and due reminder dispatch.
- `packages/domain`: shared Zod schemas, sample data, gamification, ICS export, and redacted reminder contracts.

### App Flow
1. `apps/web/src/main.tsx` mounts `App` inside a top-level `ErrorBoundary`.
2. `App` lazy-loads secondary views (Goals, Board, Timeline, Notes, Projects, Settings).
3. `useTasks` seeds IndexedDB through `seedIfEmpty`, then exposes live Dexie queries.
4. UI actions call `addTask`, `updateTaskStatus`, or `completeTask`.
5. Progress is recalculated through `deriveUserProgress` in `packages/domain`.
6. Task mutations attempt redacted reminder sync in the background when a push endpoint exists.
7. ICS export calls `exportTasksToIcs` and downloads the result in the browser.

### Data Flow
The browser stores `tasks`, `courses`, and `progress` in IndexedDB. The domain package validates task shape, calculates XP and progress, exports ICS, and creates redacted reminders.

Push data follows a separate path. The browser registers a subscription with `apps/push-api`, stores the returned endpoint hash locally, derives redacted reminders from local tasks, and bulk-syncs them with `PUT /subscriptions/:endpointHash/reminders`. The push service stores subscriptions and redacted reminder metadata only. Task text remains local.

### Push API Model
The push API is split into config, schemas, server routes, and a store interface. The current store is JSON-backed and serializes writes to avoid file races. A future SQLite or hosted store should implement the same store interface. Dispatch uses `notifyAt`, not `dueAt`, so reminders can fire before a task is due.

### Offline Model
The app utilizes a custom service worker (`sw.ts`) built via the Vite PWA plugin's `injectManifest` strategy. This worker precaches the app shell via Workbox, supports push notifications, handles background and periodic sync events, and falls back to `index.html`. User data lives in IndexedDB through Dexie. Core task workflows should work without the push API.

### Resilience
A top-level `ErrorBoundary` catches render errors and shows a calm reload screen; local IndexedDB data is untouched. Users can export and re-import all planner content as JSON from Settings.

### Future Sync Path
Future cloud accounts should treat IndexedDB as the local interaction source and reconcile records by stable IDs plus timestamps. Full sync should be designed as an explicit feature, not accidentally introduced through push notifications.

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
- `settings`: indexed by `id,updatedAt`.
- `goals`: indexed by `id,status,projectId,targetDate,updatedAt`.
- `notes`: indexed by `id,pinned,projectId,updatedAt,*taskIds,*goalIds`.

---

## 3. Design System (LiquidGlass)

The design system embodies a "LiquidGlass" aesthetic—a sophisticated evolution of spatial UI that prioritizes depth, clarity, and organic movement.

### Brand & Style
The style merges Glassmorphism with Minimalism, utilizing heavy backdrop blurs and light-refracting surfaces to create a sense of physical presence. The emotional response is one of "focused serenity"—the UI should feel like a high-end physical tool crafted from crystal and light.

### Colors
The palette is centered on a light mode execution that leverages ambient "light leaks."
- **Primary:** Refined Indigo.
- **Surface:** Semi-translucent whites and neutrals.
- **Accents:** Mint and Blue.
- **Refraction:** Pure White (#FFFFFF) at 20% opacity.

### Typography
Uses **Geist** for its technical precision and clean, geometric architecture. Font weights are intentionally reduced.

### Layout & Spacing
- **Desktop:** 12-column grid with 24px gutters and 64px side margins.
- **Whitespace:** Emphasize "Functional Whitespace" (48px+ gaps).
- **Glass Modules:** 24px internal padding.

### Elevation & Depth
1. **Level 0 (Background):** Ambient mesh gradient.
2. **Level 1 (Substrate):** Main content panels (40px blur).
3. **Level 2 (Interactive):** Hovered states (60px blur).
4. **Level 3 (Modals/Overlays):** Highest elevation (80px blur).

### Visual Depth
There is no 3D layer. Depth comes from **layering on a solid background**: opaque content surfaces sit beneath frosted floating chrome.
