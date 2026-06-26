# Release And Store Readiness

## PWA checklist

- Manifest has name (`Throughline`), short name, icons, theme color, categories, start URL, and standalone display.
- Service worker precaches the app shell and handles offline navigation.
- App works at mobile and desktop breakpoints (down to 320px).
- IndexedDB data survives reload and offline use.
- Notification states are clear when unsupported, denied, granted, or API unavailable.
- A top-level error boundary shows a calm recovery screen instead of a blank page.
- Local data can be exported/imported as a JSON backup.

## Microsoft Store path

1. Run all quality gates.
2. Validate PWA installability in Edge.
3. Run Lighthouse/PWA checks.
4. Confirm privacy text says task content stays local in v1.
5. Generate Store Screenshots at 1366x768 or 2560x1440. PWABuilder requires at least one screenshot of these dimensions for Windows Store.
6. Go to [PWABuilder](https://www.pwabuilder.com/) and enter the production URL.
7. Verify the manifest contains the `192x192` and `512x512` PNG icons (now included in `vite.config.ts`).
8. Package the app as a Windows store bundle.
9. Verify the packaged app opens Today, Board, Settings, and survives an offline reload.

## Microsoft Store Listing Copy

**Title**: Throughline
**Short Description**: A calm, private, and beautiful planner for students.
**Full Description**:
Throughline is a local-first student planner built with a LiquidGlass design language that is easy on the eyes. Organize your courses into projects, track your deadlines with Kanban boards and timelines, and maintain focus on your daily goals.

Features:
- **Privacy-First**: Your tasks are end-to-end encrypted or stay entirely local.
- **Calm Planning**: Beautiful, distraction-free environment.
- **Gamification**: Optional streaks and XP system to keep you motivated.

## Release blockers

- Full (non-redacted) task data reaching the push API.
- Offline app shell failure.
- Broken IndexedDB migration.
- Unreadable text over glass.
- Missing notification permission fallback.
- Backup export/import that loses or corrupts data.

## Release notes template

```md
## Version

### Added

### Changed

### Fixed

### Verification

- npm run lint
- npm run typecheck
- npm run test
- npm run build
- npm run test:e2e
```
