# Development Workflow

## Setup

```powershell
npm install
npm run dev:web
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

Run the push API separately when testing push registration:

```powershell
npm run dev:push
```

Open [http://127.0.0.1:8787/health](http://127.0.0.1:8787/health) to verify the API.

## Useful Commands

```powershell
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run test:e2e
npm run test:perf
npm run test:stress
```

Run a workspace command directly:

```powershell
npm run dev -w apps/web
npm run dev -w apps/push-api
npm run test -w packages/domain
```

If you need a custom web port, run the web workspace script directly:

```powershell
npm run dev -w apps/web -- --port 5174
```

## Quality Gate Meaning

- `lint`: source style and React rules. Generated folders are ignored.
- `typecheck`: TypeScript checks for all workspaces.
- `test`: Vitest unit/component tests.
- `test:coverage`: Vitest coverage with V8 reports in `coverage/`.
- `build`: TypeScript plus Vite PWA production build.
- `test:e2e`: Playwright desktop/mobile smoke tests covering task capture, board moves, and the PWA shell.
- `test:perf`: Playwright performance smoke budgets for local preview.
- `test:stress`: Playwright repeated-interaction smoke tests.

## Generated Files

Do not commit:

- `node_modules/`
- `apps/web/dist/`
- `apps/web/dev-dist/`
- `test-results/`
- `playwright-report/`
- `*.tsbuildinfo`
- `apps/push-api/data/`

## Troubleshooting

If dependency install is interrupted, delete generated dependency artifacts and reinstall:

```powershell
Remove-Item -LiteralPath node_modules -Recurse -Force
Remove-Item -LiteralPath package-lock.json -Force
npm install
```

Only do this for generated artifacts. Never delete source folders to fix package-manager state.

If ESLint reports generated service worker files, confirm `apps/web/dev-dist` and `apps/web/dist` are ignored.

If the push API reports `missing-vapid`, generate keys and set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`.

If browser notifications do not appear, check browser permission, HTTPS/PWA context, service worker support, and platform-specific PWA notification support.
