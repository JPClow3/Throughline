# Data Model

The canonical data model lives in `packages/domain/src/types.ts`. Use those Zod schemas and exported TypeScript types instead of redefining shapes in app code.

## Task

Required identity and text:

- `id`: stable task ID.
- `title`: 1-140 characters.
- `description`: optional long text, default empty.

Workflow:

- `status`: `backlog`, `ready`, `doing`, `blocked`, or `done`.
- `courseId`: optional link to a course/project.
- `goalId`: optional link to a parent goal.
- `order`: integer sort index within a goal (sequences A1..A5).
- `dueAt`: optional ISO datetime.
- `reminderAt`: optional ISO datetime.
- `createdAt`, `updatedAt`, `completedAt`: ISO datetimes.

Gamification:

- `priority`: `low`, `medium`, `high`, or `critical`.
- `energy`: 1-5.
- `difficulty`: 1-5.
- `estimatedMinutes`: 5-720.
- `xp`: calculated score.
- `attributes`: at least one of `focus`, `memory`, `discipline`, `creativity`, `wellness`.
- `visualSeed`: stable numeric seed for visual variation.

Organization:

- `tags`: short labels.
- `subtasks`: checklist items with `id`, `title`, and `completed`.

## Course (presented as Project/Area)

The `Course` schema is the storage type for what the UI now calls a **Project/Area** (an optional organiser for tasks, goals, and notes, managed in Settings).

- `id`: stable ID.
- `name`: project/course name.
- `code`: short display code such as `CS-240`.
- `color`: UI accent color.
- `icon`: compact symbolic marker.
- `professor`: optional academic extra.
- `semester`: optional academic extra.

## Goal

The canonical shape is `GoalSchema` in `packages/domain/src/types.ts`. Goal progress is **derived** from child tasks via `deriveGoalProgress` (`goals.ts`), never stored.

- `id`: stable goal ID.
- `title`: 1-140 characters.
- `summary`: optional short text.
- `status`: `active`, `paused`, or `done`.
- `targetDate`: optional ISO datetime.
- `projectId`: optional link to a project/course.
- `color`, `icon`: optional display hints.
- `priority`: `low`, `medium`, `high`, or `critical`.
- `createdAt`, `updatedAt`, `completedAt`.

Child tasks are linked by `Task.goalId` and ordered by `Task.order`.

## Note

The canonical shape is `NoteSchema`. Notes are first-class and cross-link to tasks and goals many-to-many.

- `id`: stable note ID.
- `title`: optional (falls back to first body line for display).
- `body`: markdown text, stored locally only.
- `taskIds`: linked task IDs.
- `goalIds`: linked goal IDs.
- `projectId`: optional project/course link.
- `pinned`: boolean.
- `createdAt`, `updatedAt`.

Note bodies are private task-adjacent content and must never reach the push service.

## User Progress

Progress is derived from completed tasks and stored under the fixed ID `local-player`.

- `xp`: total completed XP.
- `level`: derived from XP.
- `streakDays`: count of consecutive completion days ending today.
- `attributes`: cumulative RPG attribute scores.
- `badges`: earned badge names.

## Redacted Reminder

Redacted reminders are the only task-adjacent data the push service may store.

- `reminderId`
- `taskId`
- `dueAt`: optional task due time
- `notifyAt`: required notification dispatch time, derived from `reminderAt ?? dueAt`
- `urgency`: `normal`, `high`, or `critical`
- `title`: always `Quest reminder`
- `body`: always `A study quest needs your attention.`
- `createdAt`

Task title, description, course name, tags, and subtasks are intentionally excluded.

Completed tasks do not generate redacted reminder payloads.

## IndexedDB Stores

Dexie database name: `liquidglass-study-quests`.

- `tasks`: indexed by `id,status,courseId,goalId,dueAt,priority,updatedAt`.
- `courses`: indexed by `id,name,code`.
- `progress`: indexed by `id`.
- `settings`: indexed by `id,updatedAt`; stores reminder sync state and appearance settings.
- `goals`: indexed by `id,status,projectId,targetDate,updatedAt` (added in version 3).
- `notes`: indexed by `id,pinned,projectId,updatedAt,*taskIds,*goalIds` (added in version 4; multi-entry indexes on the link arrays).

Schema versions: v1 (tasks/courses/progress), v2 (+settings), v3 (+goals, +`goalId` task index), v4 (+notes).

Reminder sync state is stored under the fixed ID `reminder-sync`:

- `pushApiUrl`
- `endpointHash`
- `subscriptionEndpoint`
- `lastReminderSyncAt`
- `lastReminderSyncError`
- `updatedAt`

Appearance settings are stored under the fixed ID `appearance-settings`:

- `lowPower3d`
- `theme`: `light | dark | system` (default `system`).
- `showGameLayer`: boolean (default `false`); reveals the optional XP/RPG/momentum layer.
- `updatedAt`

`getAppearanceSettings` merges defaults over stored values so installs created before these fields existed upgrade cleanly.

If a future migration changes these stores, add a new Dexie version and document it here.
