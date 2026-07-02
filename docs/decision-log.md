# Decision Log

## 001 - PWA Instead Of Native Wrapper

Decision: Windows support is an installable/store-ready PWA in v1.

Reason: One web app can cover browser, smartphone, and Windows while preserving offline support and faster iteration.

Consequence: Native wrapper features are out of scope until the PWA path is validated.

## 002 - Local-First Task Data

Decision: Tasks, courses, goals, notes, settings, tombstones, and progress live in IndexedDB through Dexie as the UI source of truth.

Reason: Offline reliability is a must-have, and the planner should not require network access for core workflows.

Consequence: Account sync must preserve local-first behavior. With decision 012, synced records may leave the device only as end-to-end-encrypted ciphertext.

## 003 - Redacted Push Service

Decision: The push API stores subscriptions and redacted reminders only.

Reason: Notifications require a server, but task privacy should remain local-first.

Consequence: Push notifications use generic copy. Specific task text is shown only inside the local app.

Update: Reminder dispatch now uses `notifyAt`, while `dueAt` remains optional task due context. Bulk reminder sync replaces reminders by endpoint hash.

## 004 - Shared Domain Package

Decision: Task schemas, gamification, ICS export, and reminder redaction live in `packages/domain`.

Reason: Web and push code must share the same contracts.

Consequence: Feature work should update domain tests when shared behavior changes.

## 005 - 3D As Deferred Ambience

Decision: 3D is lazy-loaded and decorative-but-useful.

Reason: The app should feel alive without slowing task capture or blocking readability.

Consequence: 3D must have fallbacks, capped DPR, reduced-motion support, and tests that prove it renders.

Update: Superseded by decision 011. The current app has no 3D layer.

## 006 - Calm Planner As The Default Identity

Decision: The product leads as a calm, Apple-inspired planner. RPG gamification (XP, levels, attributes, streaks, badges) is preserved in the domain layer but hidden from the default UI behind an optional "game layer" toggle (`appearanceSettings.showGameLayer`, default off).

Reason: The owner's direction is calm-first, uncluttered, strong typographic hierarchy. The gamification engine and its tests still have value for users who opt in.

Consequence: Task cards and the Today view must stay decluttered by default. Gamified detail (XP chips, attribute bars, momentum) renders only when the game layer is on.

## 007 - Light-First Theme With Soft Dark

Decision: Light is the default theme; a softer (less saturated) dark mode is available. Theme preference is `light | dark | system` stored in `appearanceSettings.theme`, applied via `:root[data-theme]` tokens with a pre-paint script to avoid flash.

Reason: Suave, light, easy-to-digest colour was an explicit requirement. The previous all-dark navy palette is superseded.

Consequence: The UI is built on semantic CSS custom-property tokens; both themes must keep text at AA contrast over glass.

## 008 - Goals Hold Real Tasks

Decision: A top-level `Goal` entity groups child tasks (`Task.goalId` + `Task.order`). Goal progress is derived (roll-up) from child task completion, never stored.

Reason: The end-goal-with-smaller-todos workflow (A -> A1..A5) needs first-class goals whose steps are real tasks (own status, due date, board presence).

Consequence: Deleting a goal detaches its tasks rather than deleting them. Roll-up logic lives in `packages/domain/src/goals.ts`.

## 009 - Notes Are First-Class And Cross-Linked

Decision: A single `Note` entity supports both standalone notes and notes opened from a task/goal. Links are many-to-many via `Note.taskIds` and `Note.goalIds`.

Reason: The owner wanted both a notebook and per-task/goal notes, fully cross-linked, without duplicating storage.

Consequence: Notes are local-first like tasks. Note bodies stay in IndexedDB and must never reach the redacted push service.

## 010 - Geist, Phosphor, Ink, And Refractive Glass

Decision: The typeface is self-hosted **Geist** (variable). Icons are **Phosphor** (rounded, via `IconContext`). The palette is **near-monochrome ink** (chrome is ink; chroma comes from project colours and functional states). The **Liquid Glass** material is a clear refractive step up, layered over a single calm 3D relic that gives it depth to refract.

Reason: The owner wanted to reduce the generic "AI look" — default system/Inter fonts, a generic indigo accent, coloured gradient blobs, and weak glass all read as templated. A distinctive font + rounded icons + ink chrome + visible glass-over-depth reads bespoke (Linear / Things / editorial).

Consequence: `lucide-react` was removed. Chasing "clean" by stripping the backdrop weakens glass, so depth now lives in the relic behind translucent panels, not in decorative coloured blobs.

## 011 - No 3D; Depth Via Layering On A Solid Base

Decision: The React Three Fiber ambient scene was removed entirely. The app uses a **solid background**; depth comes from **layering** — opaque content surfaces beneath floating glass chrome (sidebar, mobile bottom bar, overlays).

Reason: The 3D backdrop read as an unfinished gimmick, and "glass refracting a 3D scene" didn't land. A solid base with opaque, crisp cards and floating frosted chrome is cleaner and is the Apple way to get Liquid Glass depth — translucent layers over the app's own content/colour, not over a decorative scene. (This supersedes decisions 005 and 010's relic.)

Consequence: `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`, and `pngjs` were removed; the 3D visual constitution and the canvas e2e/pixel checks are retired. `lowPower3d` stays in settings storage for back-compat but has no UI. A single consistent `.view-head` header + one type/spacing scale now governs every view.

## 012 - Accounts + End-To-End Encrypted Cloud Sync (Zero-Knowledge)

Decision: Add real accounts (email + password) and cross-device sync, while keeping the app **local-first and fully offline**. The web app routes a marketing **landing page** at `/`, the auth screens at `/login` and `/signup`, and the planner behind an auth guard at `/app/*`. Sync runs as a background job over **end-to-end-encrypted** record blobs: the server (Fastify + `node:sqlite`, cookie sessions) stores only ciphertext it cannot read.

Reason: The owner wanted a presentable landing page and a login, then full accounts with cloud sync. To preserve the privacy stance while syncing, the crypto is zero-knowledge — a DEK (random AES-256 key) encrypts records, wrapped by a KEK derived from the password via PBKDF2; only the wrapped DEK, salt, and a scrypt hash of an authKey reach the server. IndexedDB stays the UI source of truth so the app works offline; the engine reconciles with last-write-wins by `updatedAt` plus deletion tombstones.

Consequence: This deliberately reverses "task data never leaves the device" -> "data leaves only as ciphertext the server can't read." A forgotten password can be recovered only with the user-held recovery key. Signup must generate and confirm that key; Settings must allow regeneration. If both password and recovery key are lost, encrypted synced content cannot be recovered. `Course` gained `createdAt`/`updatedAt` (Dexie v5 + a `tombstones` store). New deps: `react-router-dom`, `@fastify/cookie`. The push API now also serves `/auth/*` and `/sync/*`; SQLite lives on the existing data volume.
