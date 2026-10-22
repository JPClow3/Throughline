# Cloudflare CI/CD

Cloudflare Pages throughline-web and Workers Builds throughline are independent release owners for the frontend and push API. Watch paths include the respective app, packages/domain and root dependency/configuration files; unrelated app-only changes do not trigger both deployments. Pages runs lint, typecheck, coverage and its frontend build. The Worker runs lint, typecheck, API/domain tests and the API build. Existing Hyperdrive/runtime secrets and the no-cron policy remain unchanged. Windows browser CI is retained for pull requests and explicit manual runs; Microsoft Store publishing remains independent.

Configured on 2026-10-22. Cloudflare settings live outside Git. Rollback: restore the prior build settings and re-enable push triggers in the retained GitHub workflow. Never run both automatic deployment owners at the same time.
