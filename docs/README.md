# Documentation Index

This folder is the project memory. If you come back later, read this file first, then follow the links for the part of the app you are changing.

## Current State

- Throughline is implemented as an npm workspace monorepo.
- The web app runs as a Vite PWA with React, Tailwind, Dexie, and Motion (no 3D layer).
- The push API is a Fastify service that stores only push subscriptions and redacted reminder metadata.
- The same API also supports accounts and encrypted sync: planner records leave the device only as end-to-end-encrypted ciphertext the server cannot read.
- `packages/domain` owns shared schemas, gamification, focus/Today/Insights derivations, ICS export, and redacted reminder contracts.
- The app is local-first by default and fully offline-capable; account sync is optional and requires a recovery key for password-loss recovery.

## Core Docs

- [Product & Requirements](product.md): Product requirements, current features, roadmap, and project map.
- [Architecture](architecture.md): Workspace responsibilities, data flow, offline model, encrypted sync, and storage shapes.
- [Notifications](notifications.md): Local notification flow, push API endpoints, VAPID setup, and privacy rules.
- [Deployment](deployment.md): Docker-first deployment architecture, composition, and Dokploy setup.
- [UI/UX](ui-ux.md): LiquidGlass design system, interaction rules, and workflow guidance.
- [Development Workflow](development.md): Setup, commands, quality gates, coverage, generated files, and troubleshooting.
- [Windows Packaging](windows-packaging.md): Microsoft Store packaging notes.
- [Decision Log](decision-log.md): Durable implementation decisions.

## Working Principles

- Privacy story: local-first by default, optional account sync, end-to-end-encrypted records, recovery key required for password-loss recovery, and no server access to task content.
- Design story: LiquidGlass depth via layered surfaces on a solid base. The old 3D visual constitution is retired.
- AI workflow: follow `AGENTS.md`, then this index, then the task-specific docs above.

## Recommended Reading Paths

- New contributor: Product & Requirements -> Architecture -> Development Workflow.
- UI work: UI/UX -> Product & Requirements.
- Data/storage work: Architecture -> Product & Requirements -> Development Workflow.
- Notification work: Notifications -> Architecture -> Product & Requirements.
- Release work: Deployment -> Windows Packaging -> Development Workflow.
