# Feature Specs

## Today

Purpose: a calm cockpit for the day.

Must show:

- A greeting and the date in the sticky page header, with a **New task** action.
- A **progress hero**: "X of Y tasks done" with a progress bar and an overall completion ring, plus a short headline.
- **Daily progress** — a grid of per-project cards, each with a completion ring (project colour), task count, and done/left pills (an "Unsorted" card covers tasks with no project).
- A **Due soon** list of calm task cards.

Capture happens through a floating quick-add **sheet** opened from the New task action (see Task Composer), not a fixed panel.

Optional (only when `showGameLayer` is on): a level/XP pill in the header and a quiet Momentum strip (streak + XP progress + attribute meters).

## Task Composer

Purpose: fast capture via a floating glass **sheet** (`Sheet` + `TaskComposer`) that opens over the content from the "New task" action, with a dimmed/blurred backdrop and Esc / backdrop / close-button dismissal. It closes after a task is added.

Up-front fields are minimal: Title, Project, Due. "Details" reveals description, priority, reminder, tags, and subtasks. Energy, difficulty, and RPG attribute appear only when the game layer is on.

New tasks default to `backlog`. `estimatedMinutes` is derived from energy as `energy * 25`.

## Task Cards

Purpose: calm, scannable task representation (`TaskCard`).

Cards show by default:

- Project colour-dot and name (or "No project").
- Title (clear hierarchy), short summary where space allows.
- Due date only when set, with quiet relative wording (Today/Tomorrow/Overdue) and a tone for soon/overdue.
- Quiet glyphs for checklist progress, linked-note count, and goal membership.
- A single round complete control; a status selector when on the board.

Hidden unless `showGameLayer` is on: the XP chip. Energy, difficulty, and RPG attributes are no longer shown on the card.

Clicking the card **title** opens the task in an **Edit task** sheet (`TaskEditor`) to change title, project, due, status, priority, description, and tags — or delete it. Cards must stay readable and must not depend on a background for meaning.

## Goals

Purpose: end goals decomposed into real tasks, with roll-up progress.

- Goals view: a grid of goal cards (project chip, progress ring, title, summary, "x/y steps", target date) plus a "New goal" form.
- Goal detail: header with roll-up progress ring and complete/reopen/delete controls; an ordered list of child tasks with an inline "add step"; and a linked-notes panel with an "add linked note" action.
- Progress is derived from child tasks; a goal is completable once all steps are done.

## Notes

Purpose: a cross-linked notebook (`NotesView` + `NoteEditor`).

- Master/detail: searchable note list (title, excerpt, pinned, linked count) and an editor (title, markdown body, pin, delete) with a **Write / Preview** toggle that renders the markdown via `react-markdown`.
- Notes link many-to-many to tasks and goals via a picker; links show as removable chips, and counts surface on task cards and goal detail.
- New notes can be created standalone or pre-linked from a goal.

## Kanban

Purpose: primary workflow surface.

Columns:

- Backlog
- Ready
- Doing
- Blocked
- Done

Drag/drop is implemented with `@dnd-kit`. A status selector remains available for accessibility and precise control.

## Timeline

Purpose: a time-of-day agenda for a single day.

A horizontal **day strip** picks a day (today onward); the selected day shows its dated tasks down a time gutter as time-blocked agenda cards (start–end derived from `dueAt` + `estimatedMinutes`, project colour accent, status). Empty days show a calm empty state.

## Projects / Areas

Purpose: an optional organiser for tasks, goals, and notes (the generalised Course).

- Managed in a lightweight Settings card (`ProjectsManager`): list with colour dot and task count, add (name + colour), and delete (which detaches tasks rather than deleting them).
- Surfaced as a colour-dotted chip on task cards and goal cards. Not a top-level nav item, to keep the navigation lean.
- `professor`/`semester` remain optional academic extras on the schema and are not shown by default.

## ICS Export

Purpose: move due quests into external calendar tools.

Current behavior:

- Exports all tasks with `dueAt`.
- Uses course code/name in event summary when available.
- Includes description, status, XP, and tags in event description/categories.
- Downloads `liquidglass-study-quests.ics`.

## Notifications

Purpose: reminders without compromising local-first privacy.

Current behavior:

- Settings displays browser notification support, service worker support, and push support.
- User can request notification permission.
- User can send a local generic test notification.
- User can configure a push API URL and VAPID public key.
- User can subscribe to push, persist the endpoint hash locally, and sync redacted reminders.
- Task changes attempt reminder sync in the background without blocking local writes.
- Settings shows PWA/offline readiness and local data status.
- Settings includes a low-power 3D control stored in IndexedDB.

## Depth & Layering

There is no 3D ambience. Depth comes from layering on a solid background:

- Solid app background (no canvas, no gradient blobs).
- Opaque content surfaces (cards, panels) with hairline borders and soft shadows.
- Floating glass chrome — the sidebar (desktop) and bottom bar (mobile), plus overlays — uses translucency + blur + a larger shadow to read as sitting on top of the content.
