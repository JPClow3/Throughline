# Throughline Development Skill

This skill provides procedures and guidelines for developing and verifying the Throughline platform and packages.

## 1. Project Architecture & Stack

- **Runtime**: Node.js 20+ / TypeScript
- **Monorepo Structure**:
  - `apps/`: Web application and services
  - `packages/`: Shared libraries, data structures, and utilities
- **Testing**: Vitest + Playwright
- **Linting & Quality**: ESLint 9+ (flat config), TypeScript strict mode

## 2. Key Commands

### Environment Setup
```powershell
npm ci
```

### Verification & Testing
```powershell
# Typecheck entire workspace
npm run typecheck

# Run linter
npm run lint

# Run unit and integration tests (Vitest)
npm run test

# Run Playwright tests
npm run test:e2e

# Build all apps and packages
npm run build
```

## 3. Development Guidelines

1. **Modular Boundary**: Shared code must live in `packages/` with clear exports in `package.json`. Apps should not import internal unexported package internals.
2. **Strict Typing**: Avoid `any` types; define explicit interfaces and schemas for API payloads and database records.

## 4. Git Tagging & Release Workflow

- **Release Tag Standard**: `vMAJOR.MINOR.PATCH` (e.g. `v0.5.0`)
- **Commands**:
  ```powershell
  git tag -a v0.5.0 -m "Release v0.5.0: Timeline sync engine overhaul"
  git push origin v0.5.0
  ```
