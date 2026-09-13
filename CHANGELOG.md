# Changelog

## Unreleased (v1 release hardening)

### Fixed
- Backup import now clears deletion tombstones so restored tasks/goals/notes do not ghost-delete on the next encrypted sync.
- Settings import dialog copy now correctly says import replaces planner content (was: merged).
- Release blocker wording updated from glass to Inkline contrast (AA on paper/ink).
- Views no longer flash a false empty state on first paint: the data hooks report `undefined` until IndexedDB resolves, so the skeleton renders instead.
- Error notices now use the real `--danger` token (the previous `var(--error)` was undefined and fell back to inherited ink).
- The dark-mode brand mark keeps ink-on-yellow contrast (a duplicate `color` declaration was overriding it).
- The mobile "More" sheet no longer opens underneath the floating New Task button, and scrollable content clears the FAB.
- Board columns with no tasks now offer an "Add task" action instead of a dead placeholder; inline step editing works on Today and Board cards once a card has steps.
- Goal detail shows a single "Add linked note" action.

### Changed
- Insights reads planner context like every other view, and its charts expose screen-reader summaries; the course-load empty state offers capture.
- Mobile board status tabs and Timeline day chips are real tablists: `aria-controls`/`tabpanel` wiring plus Arrow/Home/End navigation.
- Goal completion and step reordering are announced to assistive tech; subtask and recurrence controls are labelled; card titles keep a visible "open task" affordance on touch.
- One entrance-animation duration (`--dur-enter`) and one eyebrow tracking token now drive tabs, dock, sheet heads, and status pills; project swatches come from `lib/palette.ts` (Inkline hexes only).
- Onboarding, FocusTimer, TaskEditor subtask rows, CoursesView edit rows, and the crash screen use semantic classes instead of inline styles.
- Visual snapshots freeze the clock (`page.clock.setFixedTime`), so masthead dates and time-derived guidance no longer drift between runs.
- Vitest caps workers at 50% of cores, and the push-api suite documents its longer first-test timeout; both previously surfaced as false failures and worker-start errors on loaded Windows machines.

### Verification
- `npm run lint` (0 errors, 2 fast-refresh warnings)
- `npm run typecheck`
- `npm run test` (51 files, 441 tests passed)
- `npm run test:coverage` (65% lines / 65% statements / 63% functions / 65% branches — above thresholds)
- `npm run build` (web PWA + push-api + domain)
- `npm run test:e2e` (40 passed: desktop + mobile, incl. regenerated visual snapshots)
- `npm run test:perf` (1 passed)
- `npm run test:stress` (1 passed)

## 0.1.0-beta.1

First public beta of **Throughline** — a calm, local-first planner where goals hold the work.

### Added
- Goals that hold ordered child tasks with derived roll-up progress; goals are editable and steps reorderable.
- Notes notebook with markdown Write/Preview, cross-linked many-to-many to tasks and goals; linked chips navigate to their record.
- Projects view to create, edit (rename + recolour), and delete projects.
- Board (Kanban) project filter + search; Timeline project filter.
- Attach a task to a goal from the task composer/editor.
- Local JSON backup **export/import** and **reset to sample data** in Settings.
- Top-level error boundary with a calm recovery screen.
- Docker images + Compose stack (web, push API, ofelia cron) and a Dokploy/EC2 deployment guide.

### Changed
- Rebranded from "LiquidGlass Study Quests" to **Throughline**; neutral on-brand sample data.
- Calm, light-first Liquid Glass redesign with a softer dark mode; gamification is optional and off by default.
- Generalised Courses to Projects; unified control sizing, typography, spacing, and responsive layout.
- Removed the 3D ambience layer in favour of depth-through-layering.

### Verification
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run test:e2e`
