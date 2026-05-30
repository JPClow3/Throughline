# AI Workflows

## Source Of Truth

Read in this order:

1. `AGENTS.md`
2. `docs/README.md`
3. The relevant constitution or feature doc
4. The code being changed

The installed global Codex skill points back to this repo. Repo docs remain authoritative.

## Default Work Loop

1. Inspect existing code before editing.
2. Identify whether the change belongs in `apps/web`, `apps/push-api`, or `packages/domain`.
3. Keep shared contracts in `packages/domain`.
4. Make the smallest coherent change.
5. Add or update tests when behavior changes.
6. Run the relevant quality gate.
7. Update docs when behavior, architecture, or setup changes.

## UI Work

- Start from the visible workflow, not isolated decoration.
- Follow [ui-constitution.md](ui-constitution.md).
- Follow [ux-constitution.md](ux-constitution.md).
- Check mobile and desktop.
- Keep depth from layering on a solid background; there is no 3D layer.

## Notification Work

- Follow [notifications.md](notifications.md).
- Never add task title, description, course name, tags, or subtasks to push payloads.
- Use `createRedactedReminder` from `packages/domain`.
- Keep unsupported/denied/API-down states visible and non-blocking.

## Documentation Work

- Keep docs factual and tied to current code.
- Put durable decisions in [decision-log.md](decision-log.md).
- Put future work in [roadmap.md](roadmap.md).
- Update [project-map.md](project-map.md) when important files move or are added.
