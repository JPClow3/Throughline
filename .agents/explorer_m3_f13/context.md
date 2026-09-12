# Explorer M3-F13 Context: Board View Celebration Trigger (Feature 13)

Project Root: H:\Code\Pessoais\Throughline
Original Request: H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md
Full Project Architecture & Milestone Plan: H:\Code\Pessoais\Throughline\PROJECT.md
Working Directory: H:\Code\Pessoais\Throughline\.agents\explorer_m3_f13

Task:
Explore Feature 13: Ensure clicking checkmark button on TaskCard in BoardView and across the app always fires onComplete with XP and confetti bursts.
Investigate:
1. `apps/web/src/views/BoardView.tsx`
2. `apps/web/src/views/TaskCard.tsx`
3. `apps/web/src/App.tsx` (how completeTask, XP, celebration, confetti are wired)
4. Any celebration / confetti utilities (e.g. `apps/web/src/ui/confetti.ts` or canvas-confetti, or celebration banner)
Provide exact lines, code changes, and test verification methods.
Write report to `H:\Code\Pessoais\Throughline\.agents\explorer_m3_f13\handoff.md`.
