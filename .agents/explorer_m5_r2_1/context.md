# Explorer M5-R2-1 Context

- Project Root: H:\Code\Pessoais\Throughline
- Working Directory: H:\Code\Pessoais\Throughline\.agents\explorer_m5_r2_1
- Original Request: H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md
- Project Scope: H:\Code\Pessoais\Throughline\PROJECT.md
- Victory Audit Report: H:\Code\Pessoais\Throughline\.agents\victory_auditor\VICTORY_AUDIT_REPORT.md
- Focus File: `apps/web/src/App.tsx`

## Mission
Investigate the global keyboard shortcut handler for 'n' / 'N' in `apps/web/src/App.tsx`.
The Victory Auditor reported:
"STRESS 3.4: 'Typing n or N in a contenteditable element never triggers task composer': AssertionError: expected true to be false (line 526: expect(eventN.defaultPrevented).toBe(false)). In apps/web/src/App.tsx, ensure that typing 'n' or 'N' in a contenteditable element (isContentEditable or contenteditable='true') is treated as an active text entry element so that the global shortcut does NOT call e.preventDefault()."

Examine `apps/web/src/App.tsx` where the `keydown` listener handles 'n' / 'N' and checks the active element / target. Determine the exact condition needed so that elements with `isContentEditable` or `contenteditable="true"` are treated like `INPUT` and `TEXTAREA` inputs and are not intercepted. Write your findings to `H:\Code\Pessoais\Throughline\.agents\explorer_m5_r2_1\handoff.md`.
