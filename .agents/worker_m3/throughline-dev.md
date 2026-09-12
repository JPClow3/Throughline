# Throughline Development Skill

## 1. Project Architecture & Stack
- **Runtime**: Node.js 20+ / TypeScript
- **Monorepo Structure**:
  - `apps/`: Web application and services
  - `packages/`: Shared libraries, data structures, and utilities
- **Testing**: Vitest + Playwright
- **Linting & Quality**: ESLint 9+ (flat config), TypeScript strict mode

## 2. Key Commands
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Unit/Integration tests: `npm run test`
- Build: `npm run build`
