# Architecture

## Workspace Layout

- `apps/web`: React/Vite PWA, Liquid Glass UI, Dexie storage, Today/Goals/Notes/Board/Timeline/Projects, ICS export, JSON backup, notification setup.
- `apps/push-api`: Fastify API for redacted push subscriptions, reminder metadata, and due reminder dispatch.
- `packages/domain`: shared Zod schemas, sample data, gamification, ICS export, and redacted reminder contracts.

## App Flow

1. `apps/web/src/main.tsx` mounts `App` inside a top-level `ErrorBoundary`.
2. `App` lazy-loads secondary views (Goals, Board, Timeline, Notes, Projects, Settings).
3. `useTasks` seeds IndexedDB through `seedIfEmpty`, then exposes live Dexie queries.
4. UI actions call `addTask`, `updateTaskStatus`, or `completeTask`.
5. Progress is recalculated through `deriveUserProgress` in `packages/domain`.
6. Task mutations attempt redacted reminder sync in the background when a push endpoint exists.
7. ICS export calls `exportTasksToIcs` and downloads the result in the browser.

## Data Flow

The browser stores `tasks`, `courses`, and `progress` in IndexedDB. The domain package validates task shape, calculates XP and progress, exports ICS, and creates redacted reminders.

Push data follows a separate path. The browser registers a subscription with `apps/push-api`, stores the returned endpoint hash locally, derives redacted reminders from local tasks, and bulk-syncs them with `PUT /subscriptions/:endpointHash/reminders`. The push service stores subscriptions and redacted reminder metadata only. Task text remains local.

## Push API Model

The push API is split into config, schemas, server routes, and a store interface. The current store is JSON-backed and serializes writes to avoid file races. A future SQLite or hosted store should implement the same store interface.

Dispatch uses `notifyAt`, not `dueAt`, so reminders can fire before a task is due.

## Offline Model

The PWA plugin generates a service worker that precaches the app shell and supports navigation fallback to `index.html`. User data lives in IndexedDB through Dexie. Core task workflows should work without the push API.

Generated PWA files may appear under `apps/web/dev-dist` during local development and under `apps/web/dist` during builds. Both are generated artifacts.

## Visual depth

There is no 3D layer. Depth comes from **layering on a solid background**: opaque content
surfaces sit beneath frosted floating chrome (sidebar / mobile bottom bar, the sticky
`.view-head`, and sheets). One type and spacing scale governs every view.

## Resilience

A top-level `ErrorBoundary` (`apps/web/src/components/ErrorBoundary.tsx`) catches render
errors and shows a calm reload screen; local IndexedDB data is untouched. Users can export
and re-import all planner content as JSON from Settings.

## Future Sync Path

Future cloud accounts should treat IndexedDB as the local interaction source and reconcile records by stable IDs plus timestamps. Full sync should be designed as an explicit feature, not accidentally introduced through push notifications.
