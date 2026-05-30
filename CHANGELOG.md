# Changelog

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
