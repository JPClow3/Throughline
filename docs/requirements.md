# Requirements

## Product Goal

Build a personal student-life task app that feels alive, fast, and motivating without giving up practical reliability. The app should make school work feel like RPG quests while still behaving like a serious offline productivity tool.

## Target Platforms

- Browser: modern Chromium, Edge, Firefox, and Safari where supported by PWA APIs.
- Smartphone: mobile browser and installable PWA experience.
- Windows: installable/store-ready PWA. Native wrappers are out of scope for v1.

## Must Have

- Installable PWA with offline app shell.
- Local-first task data stored in IndexedDB.
- LiquidGlass visual system with translucent depth, strong contrast, suave colors, and responsive layout.
- Visual task representation through quest cards, XP, urgency, energy, difficulty, RPG attributes, and completion state.
- Kanban visualization with `Backlog`, `Ready`, `Doing`, `Blocked`, and `Done`.
- ICS export for due-date tasks.
- Notification support through local browser notifications and a redacted push API scaffold.
- Optional game layer (RPG attributes, XP, levels, streaks), off by default and toggled in Settings.
- Local JSON backup export/import so device-local data is portable and recoverable.

## V1 Boundaries

- No user accounts in production behavior.
- No full cloud sync.
- No server storage of full task records.
- Push payloads must not include task titles, descriptions, course names, or tags.
- 3D is supportive ambience, not the primary management surface.
- Collaboration and team boards are out of scope.

## Acceptance Criteria

- A user can open the app, see seeded student tasks, add a quest, and move tasks on Kanban.
- A user can view Dashboard, Kanban, Timeline, Courses, and Settings.
- A user can export due tasks as `.ics`.
- A user can request notification permission and see push capability state.
- The app still renders after offline reload from the built PWA.
- The 3D layer renders visible pixels on desktop and mobile Playwright runs.
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, and `npm run test:e2e` pass.

## Privacy Requirements

- Local task data is the source of truth.
- Push service data is intentionally redacted.
- Any future cloud account work must update this file and [notifications.md](notifications.md) before implementation.
