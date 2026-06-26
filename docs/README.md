# Documentation Index

This folder is the project memory. If you come back later, read this file first, then follow the links for the part of the app you are changing.

## Current State

- Throughline is implemented as an npm workspace monorepo.
- The web app runs as a Vite PWA with React, Tailwind, Dexie, and Motion (no 3D layer).
- The push API is a Fastify service that stores only push subscriptions and redacted reminder metadata.
- `packages/domain` owns shared schemas, gamification, ICS export, and redacted reminder contracts.
- The app is intentionally local-first in v1; cloud accounts and full sync are future work.

## Core Docs

- [Requirements](requirements.md): Product requirements, v1 boundaries, and acceptance criteria.
- [Architecture](architecture.md): Workspace responsibilities, data flow, offline model, and future sync path.
- [Project Map](project-map.md): Where important code lives.
- [Data Model](data-model.md): Task, course, progress, reminder, and storage shapes.
- [Feature Specs](feature-specs.md): Today, goals, notes, task composer, Kanban, timeline, projects, ICS, and notifications.
- [Offline PWA](offline-pwa.md): Service worker, installability, and offline behavior.
- [Notifications](notifications.md): Local notification flow, push API endpoints, VAPID setup, and privacy rules.
- [Deployment](deployment.md): Docker-first deployment architecture, composition, and Dokploy setup.
- [Design](design.md): LiquidGlass design system rules and tokens.
- [Development Workflow](development-workflow.md): Setup, commands, quality gates, generated files, and troubleshooting.
- [Testing Strategy](testing-strategy.md): Unit, E2E, performance, stress, and quality gate expectations.
- [Coverage Tracking](coverage-tracking.md): Coverage reports, thresholds, and ratchet rules.
- [Release Store Readiness](release-store-readiness.md): PWA and Microsoft Store checklist.
- [Roadmap](roadmap.md): What exists now and what should come next.
- [Decision Log](decision-log.md): Durable implementation decisions.

## Constitutions

- [UI Constitution](ui-constitution.md): Liquid Glass visual rules.
- [UX Constitution](ux-constitution.md): Calm-planner and optional gamification rules.
- [AI Workflows](ai-workflows.md): How AI contributors should work in this repo.

## Recommended Reading Paths

- New contributor: Requirements -> Architecture -> Project Map -> Development Workflow.
- UI work: UI Constitution -> UX Constitution -> Feature Specs.
- Data/storage work: Data Model -> Architecture -> Testing Strategy.
- Notification work: Notifications -> Data Model -> Requirements.
- Release work: Offline PWA -> Release Store Readiness -> Testing Strategy.
