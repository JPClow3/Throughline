# Throughline Development Skill (Local Copy)

## 1. Project Architecture & Stack
- **Runtime**: Node.js 20+ / TypeScript
- **Monorepo Structure**:
  - `apps/`: Web application and services
  - `packages/`: Shared libraries, data structures, and utilities
- **Testing**: Vitest + Playwright
- **Linting & Quality**: ESLint 9+ (flat config), TypeScript strict mode

## 2. Key Commands
```powershell
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```
