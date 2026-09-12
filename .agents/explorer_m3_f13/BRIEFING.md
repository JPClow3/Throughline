# BRIEFING — 2026-09-10T16:56:00Z

## Mission
Investigate Feature 13: Ensure clicking checkmark button on TaskCard in BoardView and across the app always fires onComplete with XP and confetti bursts.

## 🔒 My Identity
- Archetype: explorer
- Roles: read-only investigation, analysis, synthesis
- Working directory: H:\Code\Pessoais\Throughline\.agents\explorer_m3_f13
- Original parent: 8f799246-901c-493a-bb8b-c25d6da67c09
- Milestone: Feature 13 (Board View Celebration Trigger)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify any code files
- Do NOT run git commit
- Files for content delivery, Messages for coordination

## Current Parent
- Conversation ID: 8f799246-901c-493a-bb8b-c25d6da67c09
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `apps/web/src/views/BoardView.tsx` (Kanban columns, mobile tabs, SortableQuest, moveTo, onComplete, onStatusChange wiring)
  - `apps/web/src/views/TaskCard.tsx` (CompletionBurst, .xp-burst, .burst-particle, complete-button onClick handler, justCompleted state, wasDoneRef)
  - `apps/web/src/App.tsx` (completeTask, onComplete, BoardView, GoalsView wiring)
  - `apps/web/src/views/TodayView.tsx`, `GoalsView.tsx`, `CooldownModal.tsx`
  - `apps/web/src/styles.css` (.completion-burst, .burst-particle, .xp-burst)
  - `apps/web/src/test/BoardView.test.tsx`, `e2e-inkline.test.tsx`, `ui-components.test.tsx`
- **Key findings**:
  1. `TaskCard.tsx` lines 159-164 contains a logic defect: `if (onStatusChange) { onStatusChange(task.id, "done"); return; }`. In BoardView and GoalsView, where `onStatusChange` is provided, `onComplete?.(task)` is completely bypassed.
  2. The contract in `PROJECT.md` lines 63-72 specifically dictates that `onComplete` must ALWAYS be called when the completion checkmark is clicked, whereas `onStatusChange` is reserved for drag-and-drop or footer select dropdown column moves.
  3. `TaskCard.tsx` did not set `setJustCompleted(true)` synchronously in `onClick`, relying solely on a `useEffect` triggered by `task.status === "done"`.
  4. In `BoardView.tsx`, when a task's status becomes `"done"`, it moves across Kanban column DOM parents, unmounting from the source column and mounting into the `"done"` column. In the newly mounted card, `wasDoneRef.current` starts as `true`, so `useEffect` never fires `setJustCompleted(true)`.
  5. The fix requires:
     - In `TaskCard.tsx`: prioritize `onComplete` in `handleComplete`, set `setLocalJustCompleted(true)` immediately, and accept an optional `justCompleted?: boolean` prop.
     - In `BoardView.tsx`: maintain `recentlyCompletedIds` state, implement `handleCompleteTask` which sets `recentlyCompletedIds`, calls `onComplete`, announces `Moved ${target.title} to Done.`, and passes `justCompleted={recentlyCompletedIds.has(task.id)}` to `SortableQuest` and `TaskCard`.
     - In `App.tsx`: pass `showGameLayer={props.showGameLayer}` to `BoardView`.
- **Unexplored areas**: None remaining for Feature 13.

## Key Decisions Made
- Confirmed Inkline design system implementation: neo-brutalist square particles (`burst-particle`), XP burst badge (`xp-burst`), and zero-gradient solid cards.
- Designed comprehensive proposed changes with exact before/after snippets for the implementer agent.

## Artifact Index
- H:\Code\Pessoais\Throughline\.agents\explorer_m3_f13\DISPATCH.md — Dispatch history
- H:\Code\Pessoais\Throughline\.agents\explorer_m3_f13\BRIEFING.md — Working memory
- H:\Code\Pessoais\Throughline\.agents\explorer_m3_f13\progress.md — Liveness heartbeat
- H:\Code\Pessoais\Throughline\.agents\explorer_m3_f13\handoff.md — Final handoff report
