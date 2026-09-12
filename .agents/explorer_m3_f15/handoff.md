# Feature 15 Handoff Report: FilterBar Accessible Dialog & Mobile Preset UX

## 1. Observation

### 1.1 Use of Synchronous `window.prompt`
A codebase-wide search across `apps/` and `packages/` reveals that native browser dialog `window.prompt` is used exclusively in:
- **File**: `apps/web/src/views/FilterBar.tsx` (Lines 61–66):
  ```tsx
  function handleSavePreset() {
    const name = window.prompt("Name this filter preset");
    if (name?.trim()) {
      onSavePreset?.(name.trim());
    }
  }
  ```
- **Trigger**: Line 185–188:
  ```tsx
  {onSavePreset ? (
    <Button size="sm" onClick={handleSavePreset}>
      <BookmarkSimple size={13} weight="bold" />
      Save preset
    </Button>
  ) : null}
  ```
- **Test File**: `apps/web/src/test/FilterBar.test.tsx` (Line 13 & Lines 49–50):
  ```tsx
  13: vi.spyOn(window, "prompt").mockReturnValue("Lab day");
  ...
  49: fireEvent.click(screen.getByRole("button", { name: /Save preset/i }));
  50: expect(onSavePreset).toHaveBeenCalledWith("Lab day");
  ```

### 1.2 Presets are Inaccessible on Mobile / Compact Viewports
In `apps/web/src/views/FilterBar.tsx` (Lines 70–79):
```tsx
{!isCompact && presets.length ? (
  <div className="filter-chip-row" aria-label="Filter presets">
    {presets.map((preset) => (
      <Chip key={preset.id} onClick={() => onApplyPreset?.(preset)}>
        <BookmarkSimple size={12} weight="bold" />
        {preset.name}
      </Chip>
    ))}
  </div>
) : null}
```
- Line 43: `const isCompact = useCompactFilters();` (evaluates `(max-width: 720px)`).
- When `isCompact` is `true` (e.g. mobile viewports 375px–640px, or browser window <= 720px), `!isCompact` evaluates to `false`.
- Consequently, the entire preset chip row is omitted from rendering.
- Even when the user taps the compact "Filters" toggle button (`filtersOpen = true`, opening `showAdvanced`), presets are **not** present in `showAdvanced` either (which only renders project, tag, goal, date, priority, status filters, and the active-filter summary).
- Result: On mobile devices, users are completely unable to see, select, or apply their saved filter presets.

### 1.3 Mobile Touch Target Sizing Shortfalls
In `apps/web/src/styles.css`:
- Lines 584–599 (`.chip`):
  ```css
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.28rem 0.65rem;
    background: var(--card);
    border: 2px solid var(--line);
    border-radius: var(--radius-chip);
    font-size: var(--text-label);
    ...
  }
  ```
  Computed height on mobile is approximately 28–30px.
- Lines 2169–2178 (`.filter-segmented > button`):
  ```css
  .filter-segmented > button {
    min-height: 40px;
    padding: 0 0.75rem;
    ...
  }
  ```
- While `.btn-sm` (Lines 461–465) and `.icon-toggle` (Lines 2659–2664) received mobile 44px min-height in Milestone 1, `.chip` (used by filter presets and filter categories) and `.filter-segmented > button` (used by the date filter) do not meet the 44px touch target requirement on mobile (`max-width: 640px` or `pointer: coarse`).

### 1.4 Existing Accessible Dialog Infrastructure
In `apps/web/src/ui/Overlay.tsx` (Lines 60–83) and `apps/web/src/ui/dialogA11y.ts` (Lines 71–224):
- `<Modal title={title} onClose={onClose}>{children}</Modal>` already exists and uses `useDialogA11y`.
- `useDialogA11y` provides:
  1. Priority LIFO dialog stack (`dialogStack`, `isTopmostOverlay`).
  2. Trapping of keyboard focus via Tab / Shift+Tab cycling.
  3. Automatic initial focus prioritization on elements with `autoFocus` / `[data-autofocus]`.
  4. `Escape` key dismissal with event propagation stoppage.
  5. Focus restoration to the triggering element upon dialog unmount.
  6. Backing `.modal-panel.ik-card` with Level 4 elevation (`box-shadow: var(--shadow-3)` / `8px 8px 0px var(--shadow-ink)`), 2px solid ink border, and responsive `width: min(520px, 100%)`.

---

## 2. Logic Chain

1. **PWA & Platform Safety**:
   `window.prompt()` blocks the main thread. In PWA standalone mode (iOS Safari, Android WebAPK) or webview wrappers, synchronous prompt dialogs are frequently suppressed, ignored, or rendered with non-dismissible OS chrome. Replacing `window.prompt()` with an in-app React modal eliminates platform-specific prompt blocking.

2. **Inkline Editorial Neo-Brutalist Consistency**:
   Native browser alerts/prompts break the Inkline visual constitution (`docs/ui-ux.md`), which requires warm paper surfaces (`#f1ede3` / `#15171e`), 2px ink borders, and hard offset block shadows (`var(--shadow-3)`). An Inkline `<Modal>` retains stylistic harmony.

3. **Accessibility Compliance (WCAG 2.1 AA & WAI-ARIA)**:
   A modal dialog utilizing Throughline's `Overlay.tsx` and `useDialogA11y.ts` implements:
   - `role="dialog"`, `aria-modal="true"`, and `aria-label="Save filter preset"`.
   - LIFO focus trapping (preventing tabbing outside the dialog).
   - Instant focus placement into `<TextInput autoFocus>`.
   - `Escape` key listener to dismiss the modal without side effects.
   - Restoration of focus to the "Save preset" button upon dismissal.
   - Form validation with an inline error announcement (`role="alert"`).

4. **Mobile Preset Visibility & 1-Tap Access**:
   Removing the restrictive `!isCompact` condition from the presets container ensures presets are rendered on mobile devices.
   On viewports <= 720px / < 640px, displaying presets in a dedicated horizontal scroll container (`.filter-presets-row` with `flex-wrap: nowrap`, `overflow-x: auto`, `scrollbar-width: none`):
   - Prevents vertical clutter and multi-line wrapping above the search bar.
   - Provides immediate 1-tap preset application without requiring the user to toggle the "Filters" accordion.
   - Reuses the established horizontal scrolling pattern from `.day-strip` in `TimelineView.tsx`.

5. **Ergonomic Touch Targets**:
   Target 4 mandates minimum 44px touch targets on `<640px`. Adding `@media (pointer: coarse), (max-width: 640px)` rules for `.chip` and `.filter-segmented > button` guarantees compliance with Apple HIG and WCAG 2.5.5 / 2.5.8 while preserving compact sizing on desktop.

---

## 3. Caveats

1. **Focus Restoration Edge Case**:
   If the user applies a preset or clears filters that unmounts the triggering button, `useDialogA11y` safely checks `document.contains(toRestore)` before attempting to call `.focus()`, preventing DOM exceptions.
2. **Preset Overwriting Behavior**:
   `useFilters.ts` (Line 93) already handles duplicate preset names by replacing existing presets of identical name: `[...presets.filter((preset) => preset.name !== trimmed), nextPreset]`. The dialog subtitle notes that presets can be saved or updated.
3. **Form Key Handling**:
   Pressing `Enter` within the preset text input naturally submits the `<form>` via `onSubmit={handleSavePresetSubmit}`, executing `event.preventDefault()`. Pressing `Escape` is intercepted by `useDialogA11y` to close the modal. Both paths are cleanly decoupled.
4. **Test Suite Mock Update**:
   Existing `apps/web/src/test/FilterBar.test.tsx` used `vi.spyOn(window, "prompt")`. This mock must be removed in favor of testing the modal dialog DOM interactions (`fireEvent.click`, typing into the input, and submitting).
5. **No Source Code Changes During Exploration**:
   As an explorer, no production files have been modified. All proposed changes below are ready for the implementing worker.

---

## 4. Conclusion & Proposed Code Changes

The solution consists of three targeted modifications:
1. **`apps/web/src/views/FilterBar.tsx`**:
   - Replace `window.prompt` with an accessible Inkline `<Modal>` dialog containing `<TextInput autoFocus>`, validation, and Cancel/Save actions.
   - Remove `!isCompact &&` from the preset rendering condition so presets are always available.
   - Wrap preset chips in `<div className="filter-presets-row" role="region" aria-label="Filter presets">`.
2. **`apps/web/src/styles.css`**:
   - Add `.filter-presets-row` with desktop wrapping and mobile horizontal swipe scrolling (`overflow-x: auto`).
   - Add mobile 44px min-height touch targets for `.chip` and `.filter-segmented > button`.
   - Add styling for the preset modal (`.save-preset-modal`, `.save-preset-head`, `.save-preset-icon`, `.save-preset-actions`).
3. **`apps/web/src/test/FilterBar.test.tsx`**:
   - Update the preset test to interact with the accessible modal instead of `window.prompt`.
   - Add test coverage for modal cancellation, Escape dismissal, empty-name validation, and mobile compact preset rendering.

### 4.1 Diff for `apps/web/src/views/FilterBar.tsx`

```diff
--- a/apps/web/src/views/FilterBar.tsx
+++ b/apps/web/src/views/FilterBar.tsx
@@ -5,3 +5,3 @@ import { FilterState } from "../hooks/useFilters";
 import type { SavedFilterPreset } from "../data/types";
-import { Button, Chip, TextInput } from "../ui";
+import { Button, Chip, Modal, ModalCloseButton, TextInput } from "../ui";
 
@@ -43,4 +43,7 @@ export function FilterBar({
   const isCompact = useCompactFilters();
   const [filtersOpen, setFiltersOpen] = useState(false);
+  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
+  const [presetNameInput, setPresetNameInput] = useState("");
+  const [presetError, setPresetError] = useState("");
   const showAdvanced = !isCompact || filtersOpen;
   const activeTagSet = new Set(filters.tags);
@@ -60,7 +63,18 @@ export function FilterBar({
 
-  function handleSavePreset() {
-    const name = window.prompt("Name this filter preset");
-    if (name?.trim()) {
-      onSavePreset?.(name.trim());
+  function handleOpenSavePreset() {
+    setPresetNameInput("");
+    setPresetError("");
+    setIsSavePresetOpen(true);
+  }
+
+  function handleSavePresetSubmit(event: React.FormEvent) {
+    event.preventDefault();
+    const trimmed = presetNameInput.trim();
+    if (!trimmed) {
+      setPresetError("Please enter a name for this preset");
+      return;
     }
+    onSavePreset?.(trimmed);
+    setIsSavePresetOpen(false);
   }
 
@@ -68,6 +82,6 @@ export function FilterBar({
     <div className="view-toolbar">
-      {!isCompact && presets.length ? (
-        <div className="filter-chip-row" aria-label="Filter presets">
+      {presets.length ? (
+        <div className="filter-presets-row" role="region" aria-label="Filter presets">
           {presets.map((preset) => (
             <Chip key={preset.id} onClick={() => onApplyPreset?.(preset)}>
               <BookmarkSimple size={12} weight="bold" />
@@ -184,3 +198,3 @@ export function FilterBar({
               {onSavePreset ? (
-                <Button size="sm" onClick={handleSavePreset}>
+                <Button size="sm" onClick={handleOpenSavePreset}>
                   <BookmarkSimple size={13} weight="bold" />
@@ -196,4 +210,50 @@ export function FilterBar({
       ) : null}
+
+      {isSavePresetOpen ? (
+        <Modal title="Save filter preset" onClose={() => setIsSavePresetOpen(false)}>
+          <form onSubmit={handleSavePresetSubmit} className="save-preset-modal">
+            <ModalCloseButton onClose={() => setIsSavePresetOpen(false)} />
+            <div className="save-preset-head">
+              <div className="save-preset-icon" aria-hidden="true">
+                <BookmarkSimple size={20} weight="bold" />
+              </div>
+              <div>
+                <h2 className="save-preset-title">Save filter preset</h2>
+                <p className="save-preset-sub">
+                  Save current active filters as a quick preset for 1-tap access.
+                </p>
+              </div>
+            </div>
+
+            <label className="save-preset-field">
+              <span className="save-preset-label">Preset Name</span>
+              <TextInput
+                autoFocus
+                value={presetNameInput}
+                onChange={(event) => {
+                  setPresetNameInput(event.target.value);
+                  if (presetError) setPresetError("");
+                }}
+                placeholder="e.g. Bio 101 Labs, Urgent Overdue"
+                aria-label="Filter preset name"
+                aria-invalid={Boolean(presetError)}
+                aria-describedby={presetError ? "preset-name-error" : undefined}
+              />
+            </label>
+
+            {presetError ? (
+              <div id="preset-name-error" className="composer-error composer-error-inline" role="alert">
+                {presetError}
+              </div>
+            ) : null}
+
+            <div className="save-preset-actions">
+              <Button type="button" onClick={() => setIsSavePresetOpen(false)}>
+                Cancel
+              </Button>
+              <Button type="submit" variant="accent" disabled={!presetNameInput.trim()}>
+                Save preset
+              </Button>
+            </div>
+          </form>
+        </Modal>
+      ) : null}
     </div>
   );
 }
```

### 4.2 Diff for `apps/web/src/styles.css`

```diff
--- a/apps/web/src/styles.css
+++ b/apps/web/src/styles.css
@@ -610,2 +610,12 @@
 }
+@media (pointer: coarse), (max-width: 640px) {
+  .chip {
+    min-height: 44px;
+    padding: 0 0.85rem;
+  }
+  .filter-segmented > button {
+    min-height: 44px;
+  }
+}
 .chip-static {
@@ -2153,2 +2163,22 @@
 }
+.filter-presets-row {
+  display: flex;
+  flex-wrap: wrap;
+  align-items: center;
+  gap: 0.4rem;
+  width: 100%;
+}
+@media (max-width: 720px) {
+  .filter-presets-row {
+    flex-wrap: nowrap;
+    overflow-x: auto;
+    -webkit-overflow-scrolling: touch;
+    scrollbar-width: none;
+    padding-bottom: 3px;
+    padding-top: 1px;
+  }
+  .filter-presets-row::-webkit-scrollbar {
+    display: none;
+  }
+  .filter-presets-row .chip {
+    flex-shrink: 0;
+  }
+}
 .filter-chip-row {
@@ -4066,2 +4096,44 @@
 }
+
+/* Save filter preset modal */
+.save-preset-modal {
+  display: flex;
+  flex-direction: column;
+  gap: var(--space-4);
+  padding: var(--space-5);
+}
+.save-preset-head {
+  display: flex;
+  align-items: center;
+  gap: var(--space-3);
+}
+.save-preset-icon {
+  display: grid;
+  place-items: center;
+  width: 40px;
+  height: 40px;
+  border: 2px solid var(--line);
+  border-radius: var(--radius-control);
+  background: var(--yellow-soft);
+  box-shadow: var(--shadow-0);
+  flex-shrink: 0;
+}
+.save-preset-title {
+  font-size: var(--text-section);
+  font-weight: var(--fw-bold);
+  margin: 0;
+}
+.save-preset-sub {
+  margin: 0.15rem 0 0 0;
+  font-size: var(--text-sm);
+  color: var(--ink-soft);
+}
+.save-preset-field {
+  display: flex;
+  flex-direction: column;
+  gap: 0.35rem;
+}
+.save-preset-label {
+  font-size: var(--text-label);
+  font-weight: var(--fw-bold);
+  text-transform: uppercase;
+  letter-spacing: var(--tracking-eyebrow);
+  color: var(--ink-soft);
+}
+.save-preset-actions {
+  display: flex;
+  justify-content: flex-end;
+  gap: var(--space-3);
+  margin-top: var(--space-2);
+}
```

### 4.3 Diff for `apps/web/src/test/FilterBar.test.tsx`

```diff
--- a/apps/web/src/test/FilterBar.test.tsx
+++ b/apps/web/src/test/FilterBar.test.tsx
@@ -11,4 +11,2 @@ describe("FilterBar", () => {
     const onClearFilters = vi.fn();
     const onSavePreset = vi.fn();
-    vi.spyOn(window, "prompt").mockReturnValue("Lab day");
 
@@ -48,4 +46,14 @@ describe("FilterBar", () => {
     fireEvent.click(screen.getByRole("button", { name: /Save preset/i }));
+    expect(screen.getByRole("dialog", { name: /Save filter preset/i })).toBeInTheDocument();
+    
+    const input = screen.getByLabelText(/Filter preset name/i);
+    fireEvent.change(input, { target: { value: "Lab day" } });
+    
+    // Submit the modal form
+    fireEvent.click(screen.getByRole("button", { name: /^Save preset$/i }));
     expect(onSavePreset).toHaveBeenCalledWith("Lab day");
+    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
   });
 
@@ -98,2 +106,62 @@ describe("FilterBar", () => {
   });
+
+  it("renders presets cleanly in compact mobile mode and allows application", () => {
+    const originalMatchMedia = window.matchMedia;
+    Object.defineProperty(window, "matchMedia", {
+      writable: true,
+      value: vi.fn().mockImplementation((query: string) => ({
+        matches: query === "(max-width: 720px)",
+        media: query,
+        onchange: null,
+        addEventListener: vi.fn(),
+        removeEventListener: vi.fn(),
+        addListener: vi.fn(),
+        removeListener: vi.fn(),
+        dispatchEvent: vi.fn()
+      }))
+    });
+
+    const onApplyPreset = vi.fn();
+    render(
+      <FilterBar
+        courses={[]}
+        filters={defaultFilterState}
+        setFilter={vi.fn()}
+        presets={defaultFilterPresets}
+        onApplyPreset={onApplyPreset}
+      />
+    );
+
+    // Presets must be visible even when compact/mobile
+    const overduePreset = screen.getByRole("button", { name: "Overdue" });
+    expect(overduePreset).toBeInTheDocument();
+    fireEvent.click(overduePreset);
+    expect(onApplyPreset).toHaveBeenCalledWith(defaultFilterPresets[0]);
+
+    Object.defineProperty(window, "matchMedia", {
+      writable: true,
+      value: originalMatchMedia
+    });
+  });
+
+  it("allows dismissing save preset modal without saving", () => {
+    const onSavePreset = vi.fn();
+    render(
+      <FilterBar
+        courses={[]}
+        filters={{ ...defaultFilterState, search: "exam" }}
+        setFilter={vi.fn()}
+        onSavePreset={onSavePreset}
+      />
+    );
+
+    fireEvent.click(screen.getByRole("button", { name: /Save preset/i }));
+    expect(screen.getByRole("dialog", { name: /Save filter preset/i })).toBeInTheDocument();
+
+    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
+    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
+    expect(onSavePreset).not.toHaveBeenCalled();
+  });
 });
```

---

## 5. Verification Method

### 5.1 Automated Command Verification
After implementing the changes, execute the following commands in order:

1. **Unit & Component Tests**:
   ```powershell
   npx vitest run apps/web/src/test/FilterBar.test.tsx
   ```
   **Expected**: 100% tests pass (validating modal open, text entry, form submission, cancel dismissal, and mobile compact preset rendering).

2. **TypeScript Compilation Check**:
   ```powershell
   npm run typecheck
   ```
   **Expected**: 0 errors across all workspaces (`@throughline/domain`, `web`, `push-api`).

3. **Linter**:
   ```powershell
   npm run lint
   ```
   **Expected**: 0 lint errors or warnings.

4. **Full Test Suite**:
   ```powershell
   npm run test
   ```
   **Expected**: All test suites in `domain`, `web`, and `push-api` pass without regressions.

5. **Production Build**:
   ```powershell
   npm run build
   ```
   **Expected**: Vite build produces production bundles cleanly.

### 5.2 Manual & Visual Inspection
- Open BoardView or TimelineView in browser / mobile emulator (e.g. 375x667 iPhone SE).
- Observe preset chips ("Overdue", "Due today", etc.) appearing at the top in a single horizontally swipeable track without wrapping or breaking layout.
- Measure computed chip height: >= 44px on mobile viewport.
- Apply a filter (e.g. type search query or select course). The yellow active filter bar appears.
- Tap "Save preset":
  - Verify smooth modal overlay with 8px hard offset shadow (`box-shadow: 8px 8px 0px ...`).
  - Verify input field has focus immediately.
  - Test keyboard navigation: Tab cycles through close button, input, Cancel, and Save preset.
  - Test `Escape` key: Dialog immediately dismisses and returns focus to the "Save preset" button.
  - Test Enter key with valid preset name: Modal submits, closes, and preset is persisted to Dexie and appears in the presets row.
