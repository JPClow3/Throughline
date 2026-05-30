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
5. Package with PWABuilder.
6. Use generated Windows assets from the PWA icon.
7. Verify the packaged app opens Today, Board, Settings, and survives an offline reload.

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
