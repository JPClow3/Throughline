# Handoff Report — Explorer M5-R2-2: Stress Test ESLint & STRESS 3.4 Investigation

## 1. Observation

### 1.1 ESLint Errors in `apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx`
Direct execution of `npx eslint apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx` outputs:
```
H:\Code\Pessoais\Throughline\apps\web\src\test\challenger-m5-tier5-ui-stress.test.tsx
   1:27  error  'useRef' is defined but never used. Allowed unused vars must match /^_/u             @typescript-eslint/no-unused-vars
   1:35  error  'useEffect' is defined but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars
   2:37  error  'act' is defined but never used. Allowed unused vars must match /^_/u                @typescript-eslint/no-unused-vars
   6:39  error  'Button' is defined but never used. Allowed unused vars must match /^_/u             @typescript-eslint/no-unused-vars
   6:65  error  'UnlinkButton' is defined but never used. Allowed unused vars must match /^_/u       @typescript-eslint/no-unused-vars
   7:23  error  'isTopmostOverlay' is defined but never used. Allowed unused vars must match /^_/u   @typescript-eslint/no-unused-vars
  12:20  error  'makeCourse' is defined but never used. Allowed unused vars must match /^_/u         @typescript-eslint/no-unused-vars
  12:32  error  'makeGoal' is defined but never used. Allowed unused vars must match /^_/u           @typescript-eslint/no-unused-vars
  12:42  error  'makeNote' is defined but never used. Allowed unused vars must match /^_/u           @typescript-eslint/no-unused-vars
  12:52  error  'renderWithPlanner' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  13:24  error  'addTask' is defined but never used. Allowed unused vars must match /^_/u            @typescript-eslint/no-unused-vars

✖ 11 problems (11 errors, 0 warnings)
```

The monorepo-wide lint `npm run lint` confirmed that these 11 errors in `apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx` are the **only errors** across the entire repository (the only other findings are two non-fatal warnings in `PlannerProvider.tsx` and `FilterBar.tsx` regarding fast refresh exports).

Inspection of lines 1–13 in `apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx` shows:
```typescript
1: import React, { useState, useRef, useEffect } from "react";
2: import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
3: import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
4: import fs from "node:fs";
5: import path from "node:path";
6: import { Sheet, Modal, ConfirmDialog, Button, IconButton, Chip, UnlinkButton } from "../ui";
7: import { dialogStack, isTopmostOverlay } from "../ui/dialogA11y";
8: import { CommandPalette } from "../views/CommandPalette";
9: import { TaskCard } from "../views/TaskCard";
10: import { App } from "../App";
11: import { AuthProvider } from "../auth/AuthProvider";
12: import { makeTask, makeCourse, makeGoal, makeNote, renderWithPlanner } from "./planner-test-utils";
13: import { clearAllData, addTask, saveAppearanceSettings } from "../data/repositories";
```

Symbol usage analysis across lines 14–722 of `challenger-m5-tier5-ui-stress.test.tsx`:
- `React`: Required for JSX `<AuthProvider><App /></AuthProvider>` etc.
- `useState`: Used 11 times (lines 46, 56, 75, 94, 114, 137, 160, 185, 230, 248, 276).
- `useRef`: 0 occurrences in file body. Unused.
- `useEffect`: 0 occurrences in file body. Unused.
- `render`: Used 21 times.
- `screen`: Used 54 times.
- `fireEvent`: Used 22 times.
- `act`: 0 occurrences in file body. Unused.
- `waitFor`: Used 4 times.
- `Sheet`: Used 48 times.
- `Modal`: Used 29 times.
- `ConfirmDialog`: Used 4 times.
- `Button`: 0 occurrences in file body (the test checks CSS `.btn-sm`, not `<Button>`). Unused.
- `IconButton`: Used 3 times (lines 405, 412, 420).
- `Chip`: Used 4 times (lines 415, 423, 426).
- `UnlinkButton`: 0 occurrences in file body (STRESS 2.7 inspects stylesheet for `.note-link-unlink`, does not import `<UnlinkButton>`). Unused.
- `dialogStack`: Used at line 203.
- `isTopmostOverlay`: 0 occurrences in file body. Unused.
- `makeTask`: Used 2 times (lines 273, 695).
- `makeCourse`: 0 occurrences in file body. Unused.
- `makeGoal`: 0 occurrences in file body. Unused.
- `makeNote`: 0 occurrences in file body. Unused.
- `renderWithPlanner`: 0 occurrences in file body. Unused.
- `clearAllData`: Used at line 40.
- `addTask`: 0 occurrences in file body. Unused.
- `saveAppearanceSettings`: Used at line 683.

---

### 1.2 STRESS 3.4 Failure at Line 526
Running `npx vitest run apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx` yields 29 passing tests and 1 failure:
```
FAIL  apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx > Tier 5 Adversarial Hardening: UI Press Physics, Focus Trapping & Gesture/Navigation > 3. Keyboard Shortcut Isolation > STRESS 3.4: Typing 'n' or 'N' in a contenteditable element never triggers task composer
AssertionError: expected true to be false // Object.is equality

- Expected
+ Received

- false
+ true

 ❯ apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx:526:39
    524|       const eventN = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
    525|       editable.dispatchEvent(eventN);
    526|       expect(eventN.defaultPrevented).toBe(false);
       |                                       ^
    527|
    528|       expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
```

Inspection of `apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx` lines 509–531:
```typescript
509:     it("STRESS 3.4: Typing 'n' or 'N' in a contenteditable element never triggers task composer", async () => {
510:       render(
511:         <AuthProvider>
512:           <App />
513:         </AuthProvider>
514:       );
515: 
516:       const editable = document.createElement("div");
517:       editable.contentEditable = "true";
518:       editable.tabIndex = 0;
519:       document.body.appendChild(editable);
520: 
521:       editable.focus();
522:       expect(document.activeElement).toBe(editable);
523: 
524:       const eventN = new KeyboardEvent("keydown", { key: "n", bubbles: true, cancelable: true });
525:       editable.dispatchEvent(eventN);
526:       expect(eventN.defaultPrevented).toBe(false);
527: 
528:       expect(screen.queryByRole("dialog", { name: "New task" })).not.toBeInTheDocument();
529: 
530:       document.body.removeChild(editable);
531:     });
```

Inspection of `apps/web/src/App.tsx` lines 311–338:
```typescript
311:   React.useEffect(() => {
312:     const onKeyDown = (event: KeyboardEvent) => {
313:       if (event.key !== "n" && event.key !== "N") {
314:         return;
315:       }
316:       if (event.metaKey || event.ctrlKey || event.altKey) {
317:         return;
318:       }
319:       const target = event.target as HTMLElement | null;
320:       if (target?.isContentEditable || target?.closest("input, textarea, select, [contenteditable='true']")) {
321:         return;
322:       }
323:       const dialogOpen =
...
334:       event.preventDefault();
335:       void handlePrimaryAction();
336:     };
337:     document.addEventListener("keydown", onKeyDown);
338:     return () => document.removeEventListener("keydown", onKeyDown);
```

Investigation into JSDOM environment specifics:
When `editable.contentEditable = "true"` is executed in JSDOM:
- `editable.isContentEditable` is `undefined` (JSDOM does not implement the `isContentEditable` getter).
- `editable.getAttribute("contenteditable")` is `null` (JSDOM does not reflect the property assignment to the DOM attribute).
- `editable.closest("input, textarea, select, [contenteditable='true']")` returns `null`.
- However, `(editable as any).contentEditable` is the string `"true"`.

---

## 2. Logic Chain

1. **ESLint Failure Logic**:
   - ESLint's `@typescript-eslint/no-unused-vars` rule flags any imported identifier that is never referenced in executable code or type positions.
   - The 11 symbols (`useRef`, `useEffect`, `act`, `Button`, `UnlinkButton`, `isTopmostOverlay`, `makeCourse`, `makeGoal`, `makeNote`, `renderWithPlanner`, `addTask`) are imported in lines 1, 2, 6, 7, 12, 13 but have 0 references anywhere in the rest of `challenger-m5-tier5-ui-stress.test.tsx`.
   - Removing those 11 identifiers leaves all other imported symbols intact and used.
   - Because no other errors exist in the monorepo, removing these 11 unused imports directly brings `npm run lint` to 0 errors.

2. **STRESS 3.4 Failure Logic**:
   - The test setup creates `<div contenteditable="true" tabindex="0">` via property assignment `editable.contentEditable = "true"`.
   - When the user/test dispatches a `keydown` event for `"n"` on `editable`, the event bubbles up to `document` where `App.tsx`'s listener captures it.
   - In `App.tsx` line 320, the guard checks:
     `target?.isContentEditable || target?.closest("input, textarea, select, [contenteditable='true']")`
   - In JSDOM, `target.isContentEditable` is `undefined` (unsupported by JSDOM), and `target.getAttribute("contenteditable")` is `null` because JSDOM does not sync the property to the attribute. Therefore, `target.closest(...)` finds no match and returns `null`.
   - The guard fails to trigger an early return.
   - `App.tsx` proceeds to line 334, invoking `event.preventDefault()` and `handlePrimaryAction()`.
   - As a result, `eventN.defaultPrevented` becomes `true`.
   - Line 526 (`expect(eventN.defaultPrevented).toBe(false)`) fails with an `AssertionError`.
   - In addition, invoking `handlePrimaryAction()` triggers an unexpected React state update outside of `act()`.

3. **STRESS 3.8 Interaction Logic**:
   - Test STRESS 3.8 explicitly asserts that calling `.closest()` on `document` (or any non-Element node) throws a `TypeError` if there is no element guard (`typeof target?.closest === "function"` or `target instanceof HTMLElement`).
   - Any fix in `App.tsx` must ensure that checking editable elements does not throw when `event.target` is `document` or `window`.

---

## 3. Caveats

1. **Scope of File Ownership**:
   - `apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx` is the test file containing the 11 ESLint errors.
   - The root cause of STRESS 3.4's failure is in the production component `apps/web/src/App.tsx:320`, not an invalid test assertion in `challenger-m5-tier5-ui-stress.test.tsx`.
   - The test STRESS 3.4 itself is well-formed: typing 'n' in a `contenteditable` element must NOT trigger quick capture or prevent default behavior.
2. **Read-Only Explorer Constraint**:
   - As Explorer M5-R2-2, this report proposes the exact edits for Worker M5 / Implementer. No source files outside `.agents/` were directly modified.

---

## 4. Conclusion & Proposed Fixes

### 4.1 Exact Clean-Up for `apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx` (Lines 1–14)

Replace lines 1–13 with the following cleaned imports:

```typescript
// BEFORE:
import React, { useState, useRef, useEffect } from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { Sheet, Modal, ConfirmDialog, Button, IconButton, Chip, UnlinkButton } from "../ui";
import { dialogStack, isTopmostOverlay } from "../ui/dialogA11y";
import { CommandPalette } from "../views/CommandPalette";
import { TaskCard } from "../views/TaskCard";
import { App } from "../App";
import { AuthProvider } from "../auth/AuthProvider";
import { makeTask, makeCourse, makeGoal, makeNote, renderWithPlanner } from "./planner-test-utils";
import { clearAllData, addTask, saveAppearanceSettings } from "../data/repositories";

// AFTER:
import React, { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { Sheet, Modal, ConfirmDialog, IconButton, Chip } from "../ui";
import { dialogStack } from "../ui/dialogA11y";
import { CommandPalette } from "../views/CommandPalette";
import { TaskCard } from "../views/TaskCard";
import { App } from "../App";
import { AuthProvider } from "../auth/AuthProvider";
import { makeTask } from "./planner-test-utils";
import { clearAllData, saveAppearanceSettings } from "../data/repositories";
```

### 4.2 Exact Fix for `apps/web/src/App.tsx` (Line 319–322)

To satisfy STRESS 3.4 (as well as STRESS 3.1, 3.2, 3.3, 3.5, 3.6, 3.7, and 3.8), replace lines 319–322 in `apps/web/src/App.tsx`:

```typescript
// BEFORE:
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || target?.closest("input, textarea, select, [contenteditable='true']")) {
        return;
      }

// AFTER:
      const target = event.target as HTMLElement | null;
      const isTargetEditable = (el: HTMLElement | null): boolean => {
        if (!el || typeof el.closest !== "function") {
          return false;
        }
        if (
          el.isContentEditable ||
          (el as { contentEditable?: unknown }).contentEditable === "true" ||
          (el as { contentEditable?: unknown }).contentEditable === true ||
          el.getAttribute("contenteditable") === "true" ||
          el.getAttribute("contenteditable") === ""
        ) {
          return true;
        }
        return Boolean(el.closest("input, textarea, select, [contenteditable='true'], [contenteditable='']"));
      };

      if (isTargetEditable(target)) {
        return;
      }
```

This ensures:
1. `(el as { contentEditable?: unknown }).contentEditable === "true"` catches elements created via `editable.contentEditable = "true"` in JSDOM environments.
2. `el.isContentEditable` catches standard DOM contenteditable implementations in real browsers.
3. `typeof el.closest !== "function"` safely guards against `TypeError` when `event.target` is `document` or `window` (satisfying STRESS 3.8).
4. `el.closest(...)` detects ancestor inputs, textareas, selects, and contenteditable wrappers.

---

## 5. Verification Method

1. **Verify ESLint (0 errors)**:
   ```bash
   npx eslint apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx
   npm run lint
   ```
   *Expected output*: 0 errors.

2. **Verify STRESS 3.4 & Tier 5 Suite (30/30 passed)**:
   ```bash
   npx vitest run apps/web/src/test/challenger-m5-tier5-ui-stress.test.tsx
   ```
   *Expected output*: 30 passed (100%), 0 failed.

3. **Verify Full Monorepo Test Suite (421/421 passed)**:
   ```bash
   npm run test
   ```
   *Expected output*: 50 test files passed, 421 tests passed (100%).

4. **Invalidation Conditions**:
   - If any removed import in `challenger-m5-tier5-ui-stress.test.tsx` causes a TypeScript compilation error (`npm run typecheck`), that symbol was erroneously identified. (Double-checked: all remaining symbols were verified with zero missing references).
   - If `STRESS 3.8` fails with a `TypeError` due to missing `closest` guard, `typeof el.closest !== "function"` must be restored.
