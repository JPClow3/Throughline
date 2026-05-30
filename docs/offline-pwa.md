# Offline PWA

## Current Implementation

The web app uses `vite-plugin-pwa` in `apps/web/vite.config.ts`.

Manifest:

- Name: `Throughline`
- Short name: `Throughline`
- Display: `standalone`
- Orientation: `portrait-primary`
- Categories: `productivity`
- Shortcut: Kanban view at `/?view=kanban`
- Icon: SVG maskable icon

Service worker:

- `registerType: autoUpdate`
- App shell precaching through Workbox
- Navigation fallback to `/index.html`
- Dev mode service worker enabled for local verification

## Offline Data

Offline user data is stored in IndexedDB through Dexie. The service worker does not store task data. This separation matters:

- Service worker: app shell and static assets.
- IndexedDB: tasks, courses, and progress.
- Push API: redacted subscriptions and reminders only.

## Generated Files

- `apps/web/dist`: production build output.
- `apps/web/dev-dist`: local PWA dev output.

Both are generated and ignored by git.

## Offline Acceptance Checks

- Build succeeds with generated service worker.
- App loads from preview server.
- Reloading the app keeps task data.
- Core views render without the push API.
- Notification controls degrade gracefully when APIs are missing or permission is denied.
