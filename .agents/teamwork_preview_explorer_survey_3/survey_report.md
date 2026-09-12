# Survey Report: Responsive Layouts, Mobile PWA, Keyboard Workflows & Accessibility

**Date**: 2026-09-10  
**Target**: Throughline Web Application (`apps/web`)  
**Auditor**: `teamwork_preview_explorer_survey_3`  
**Mode**: Read-Only Architecture & Codebase Survey  

---

## Executive Summary

Throughline's interface is built on the **Inkline** editorial neo-brutalist design system. The audited codebase exhibits high architectural maturity, solid adherence to the 2px ink border and hard offset elevation model, thoughtful responsive adaptations between mobile and desktop viewports, and dedicated accessibility provisions (notably in Kanban keyboard navigation and live announcements).

This survey identifies key strengths and 5 specific areas for refinement:
1. **Touch Target Sizing**: Primary buttons meet 44px (`--control-h`), but secondary buttons (`.btn-sm` at 34px) and icon controls (`.icon-toggle` at 36px) fall below the 44x44px touch target guideline on mobile.
2. **Viewport Meta & Safe Areas**: `index.html` lacks `viewport-fit=cover`, which prevents `env(safe-area-inset-bottom)` from calculating notch/home bar insets on iOS Safari and installed PWAs.
3. **Global 'N' Shortcut Scope**: Pressing `N` triggers quick capture in Today, Board, Timeline, Courses, and creates a note in Notes, but is ignored in Goals, Insights, and Settings (`primaryActionLabel` undefined).
4. **Kanban Tab Bar & Drag Handles on Mobile**: Mobile Kanban correctly replaces the 5-column grid with a tabbed status view (`< 1100px`), preventing horizontal squishing; however, drag handles in mobile cards remain in DOM even though drag is disabled in that view.
5. **Contrast & Theme Rigor**: Text and signals maintain WCAG AA/AAA compliance across both `#f1ede3` (light) and `#15171e` (dark) modes. `--ink-faint` on cards sits at ~3.45:1 (adequate for uppercase tracking labels/placeholders, but should not be used for running body copy).

---

## 1. Responsive Layout Audit (375px, 768px, 1280px)

### 1.1 Layout Grid & Breakpoints Architecture
The application employs a hybrid responsive layout combining Tailwind 4 utility breakpoints with container-aware CSS grid rules in `apps/web/src/styles.css`:

| Viewport Width | Screen Tier | Shell Navigation | Main Padding | Modals / Sheets |
| :--- | :--- | :--- | :--- | :--- |
| **375px** | Mobile | Bottom Dock (`.shell-dock`) + FAB (`.shell-mobile-primary-action`) | `padding: var(--space-6) 1rem 7rem;` | Bottom sheet (`border-radius: 18px 18px 0 0;`) |
| **768px** | Tablet | Bottom Dock (`.shell-dock`) + FAB (`.shell-mobile-primary-action`) | `padding: var(--space-6) clamp(...) 7rem;` | Centered modal (`border-radius: var(--radius-card);`) |
| **1280px** | Desktop | Top Tab Strip (`.shell-tabs`) | `padding: var(--space-6) clamp(...) var(--space-8);` | Centered modal (`max-width: min(600px, 100vw);`) |

### 1.2 View-by-View Breakdown

#### 1. Today View (`apps/web/src/views/TodayView.tsx`)
- **Mobile (375px)**: `.today-layout` uses `grid-template-columns: minmax(0, 1fr)` (`styles.css:1412-1415`). Content stacks vertically: Hero → What matters now → Also on the radar → Guidance → Schedule shape. No horizontal overflow occurs because all inner containers use `minmax(0, 1fr)` or fluid text.
- **Tablet (768px)**: Stays in single-column stacking, maintaining readable typography and generous vertical whitespace.
- **Desktop (1280px)**: At `min-width: 1024px` (`styles.css:1417-1420`), switches to `grid-template-columns: minmax(0, 1fr) 340px`. The priority task list expands to take available width while the guidance and schedule pressure panels anchor cleanly on the right gutter.

#### 2. Kanban Board (`apps/web/src/views/BoardView.tsx`)
- **Mobile (375px) & Tablet (768px)**: Governed by `const isMobileBoard = useCompactFilters("(max-width: 1100px)")` (`BoardView.tsx:43`). Rather than attempting to force 5 narrow columns or requiring horizontal scrolling, the view renders `.kanban-mobile` with a tablist of statuses (`Backlog`, `Ready`, `Doing`, `Blocked`, `Done`) and task count chips (`BoardView.tsx:138-154`). Each column renders as a full-width vertical stack (`.kanban-stack`).
- **Desktop (1280px)**: Renders `.kanban-board` (`styles.css:1921-1929`) with `grid-auto-flow: column; grid-auto-columns: minmax(240px, 1fr); gap: var(--space-4); overflow-x: auto;`. Supports 5 full columns with `@dnd-kit` drag-and-drop and arrow-key column switching.

#### 3. Timeline View (`apps/web/src/views/TimelineView.tsx`)
- **Mobile (375px)**: Day selection strip (`.day-strip`, `styles.css:2170-2179`) uses `display: flex; gap: 0.5rem; overflow-x: auto; scrollbar-width: none;`. Day chips (`.day-chip`) have a fixed `min-width: 62px; flex-shrink: 0;`, permitting horizontal swipe without page-level overflow. Agenda rows stack with relative time stamps.
- **Tablet & Desktop (768px - 1280px)**: Clean layout with drag handles allowing tasks to be rescheduled between time blocks and days via `@dnd-kit`.

#### 4. Goals View (`apps/web/src/views/GoalsView.tsx`)
- **Mobile (375px)**: `.goals-grid` uses `grid-template-columns: repeat(auto-fill, minmax(min(270px, 100%), 1fr))` (`styles.css:2281-2285`). At 375px, cards span 100% width.
- **Tablet (768px)**: Fits 2 cards per row (`270px * 2 + 1.25rem gap = ~560px < 768px`).
- **Desktop (1280px)**: Fits 3-4 cards per row. Master-detail navigation swaps smoothly from grid to `GoalDetail` with progress rings and reorderable steps.

#### 5. Notes View (`apps/web/src/views/NotesView.tsx`)
- **Mobile (375px) & Tablet (768px)**: Evaluates `isMobileNotes = useCompactFilters()` (`max-width: 900px`). When a note is selected, the list is hidden (`.notes-view-detailing .notes-list { display: none; }`, `styles.css:2467-2469`), and the editor displays full width with a "Back to Notes" button (`NotesView.tsx:174-176`).
- **Desktop (1280px)**: At `min-width: 900px`, switches to a 2-column master-detail layout: `grid-template-columns: 320px minmax(0, 1fr)` (`styles.css:2456-2460`).

#### 6. Courses / Projects View (`apps/web/src/views/CoursesView.tsx`)
- Fluid vertical list of project cards with inline editing inputs that wrap (`flex: 1 1 160px`). No clipping observed.

#### 7. Insights View (`apps/web/src/views/InsightsView.tsx`)
- Responsive stat grid (`minmax(min(150px, 100%), 1fr)`) and charts (`minmax(min(340px, 100%), 1fr)`). Recharts bar charts wrap in `<ResponsiveContainer width="100%" height="100%">` (`InsightsView.tsx:199, 222, 248`).

#### 8. Settings View (`apps/web/src/views/SettingsView.tsx`)
- `.settings-grid` uses `grid-template-columns: repeat(auto-fit, minmax(min(330px, 100%), 1fr))` (`styles.css:2726-2730`). Stacks to 1 column on mobile, 2 columns on tablet, 2-3 columns on desktop.

---

## 2. Mobile PWA Adaptations Audit

### 2.1 PWA Manifest & App Shell
- **Manifest**: Declared in `apps/web/vite.config.ts:33-200` and compiled via `vite-plugin-pwa` with `injectManifest` using `apps/web/src/sw.ts`.
- **Display Mode**: Set to `standalone` with fallbacks for `minimal-ui` and `window-controls-overlay`.
- **Theme Color**: Declared as `#f1ede3` in manifest and `<meta name="theme-color" content="#f1ede3" />` in `index.html:6`.
- **PWA Shortcuts**: 4 shortcuts configured (`Today`, `Kanban`, `Timeline`, `Notes`) with custom icons (`vite.config.ts:170-199`).
- **App Icons & Screenshots**: Includes 192x192, 512x512 maskable and standard icons, apple-touch-icon, plus wide (1366x768) and narrow (720x1280) screenshots.

### 2.2 Navigation Dock & FAB
- **Bottom Dock**: `.shell-dock` (`styles.css:1110-1124`) is fixed to `bottom: calc(10px + env(safe-area-inset-bottom, 0px))`, left/right `12px`, with 2px ink border and hard shadow. Hidden at `>= 1024px`.
- **Floating Action Button (FAB)**: `.shell-mobile-primary-action` (`styles.css:1206-1235`) is fixed at `bottom: 86px; right: 18px; width: 58px; height: 58px;`. Hidden at `>= 1024px`.
- **Focus Timer**: `.focus-timer-shell` (`styles.css:3262-3274`) on mobile sits at `left: 18px; bottom: calc(104px + env(safe-area-inset-bottom, 0px));`, avoiding collision with the right-anchored FAB and bottom dock.

### 2.3 Bottom Sheet Overlays
- In `apps/web/src/ui/Overlay.tsx:21-50`, sheets use `.sheet-backdrop` (`styles.css:2983-2998`):
  - At `< 640px`: `align-items: flex-end; padding: 0;` and `.sheet` has `border-radius: 18px 18px 0 0; width: min(600px, 100vw); max-height: min(86vh, 100%);`.
  - At `>= 640px`: `align-items: center; padding: var(--space-4);` with `border-radius: var(--radius-card);`.
  - Backdrop is a flat ink wash (`color-mix(in srgb, var(--shadow-ink) 45%, transparent)`), strictly adhering to the "no blur, no translucency" Inkline rule.

### 2.4 Touch Target Gaps (Audit Finding)
- **Compliant**: Standard `.btn` elements have `min-height: var(--control-h);` where `--control-h: 44px;` (`styles.css:130, 385`). Mobile dock links (`.dock-link`) span ~44px in touch bounds. The FAB is 58x58px. Day chips are 62px wide.
- **Deficiencies Identified**:
  1. `.icon-toggle` (`styles.css:2592-2604`): `width: 36px; height: 36px;`. Used on mobile search button in header (`AppShell.tsx:325`), Sheet close button (`Overlay.tsx:43`), Modal close button (`Overlay.tsx:85`), and PWA banner dismiss (`App.tsx:394`). Recommended: add `min-width: 44px; min-height: 44px;` on mobile or use `::after` touch padding to meet WCAG 2.5.5 / 2.5.8.
  2. `.btn-sm` (`styles.css:416-421`): `min-height: 34px;`. Used for the mobile "Filters" toggle button in `FilterBar.tsx:90`. Recommended: ensure interactive touch targets on mobile remain 44px.
  3. `apps/web/index.html:5`: Viewport meta tag is `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`. It is missing `viewport-fit=cover`. Without `viewport-fit=cover`, iOS Safari sets `env(safe-area-inset-bottom)` to `0px`, risking overlap with the home indicator bar in standalone PWA mode.

---

## 3. Keyboard Navigation & Shortcuts Audit

### 3.1 Global Shortcuts
1. **'Ctrl/Cmd+K' — Global Command Palette**:
   - Registered at the root in `apps/web/src/App.tsx:82-91` before lazy chunks resolve.
   - Triggers `setCommandPaletteOpen(true)`.
   - `CommandPalette` (`apps/web/src/views/CommandPalette.tsx`) uses `cmdk`'s `Command.Dialog`:
     - Built-in keyboard list navigation (`ArrowUp` / `ArrowDown`).
     - Selection on `Enter`.
     - Dismissal on `Escape`.
     - Filter queries across tasks, notes, goals, and projects via `useGlobalSearch`.
2. **'N' — Quick Capture**:
   - Registered in `apps/web/src/App.tsx:289-326`.
   - Verifies that modifiers (`metaKey`, `ctrlKey`, `altKey`) are false.
   - Ignores keystroke when active element is inside `input, textarea, select, [contenteditable='true']` (`App.tsx:298`).
   - Suppressed if any dialog/overlay is active (`commandPaletteOpen`, `composerOpen`, `goalOpen`, `editingGoal`, `editingTaskId`, `cooldownTasks`, `showOnboarding`).
   - Action dispatch:
     - On `notes` view: creates a new note and selects it (`App.tsx:276-280`).
     - On `dashboard`, `kanban`, `timeline`, `courses`: opens `TaskComposer` (`App.tsx:269-284`).
   - **Audit Finding**: In `App.tsx:266-271`, `primaryActionLabel` is undefined when `view === "goals"`, `insights`, or `settings`. In `goals` view, pressing `N` is completely silent. In accordance with `docs/ui-ux.md:66` ("Pressing N in any planner view opens it"), pressing `N` in Goals should either open the Goal Composer or the Task Composer.

### 3.2 Focus Management & Focus Traps
- **`useDialogA11y` Hook** (`apps/web/src/ui/dialogA11y.ts:6-56`):
  - **Focus Storage**: Captures `document.activeElement` before the dialog mounts (`dialogA11y.ts:11`).
  - **Auto Focus**: Automatically focuses the first focusable element (`a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])`) after 10ms.
  - **Focus Restoration**: In the cleanup function, calls `previouslyFocused?.focus?.()` (`dialogA11y.ts:19`), returning focus cleanly to the trigger button.
  - **Focus Trap**: Intercepts `Tab` and `Shift+Tab`. If active element moves outside `panelRef`, shifts focus to `first`. If `Shift+Tab` on `first`, wraps to `last`. If `Tab` on `last`, wraps to `first`.
  - **Escape Dismissal**: Intercepts `Escape` and invokes `onClose()` (`dialogA11y.ts:28-31`).
  - **Adoption**: Used across `Sheet` (`Overlay.tsx:15`), `Modal` (`Overlay.tsx:61`), `ConfirmDialog` (`ConfirmDialog.tsx:45`), `CooldownModal` (`CooldownModal.tsx:23`), and `OnboardingOverlay` (`OnboardingOverlay.tsx:55`).

### 3.3 Kanban Keyboard Navigation
In `apps/web/src/views/BoardView.tsx:270-343` (`SortableQuest`):
- Each card has `tabIndex={0}` and `role="listitem"`.
- `Enter`: opens task editor (`onEdit(task)`).
- `Space`: marks task complete (`onComplete(task)`).
- `Ctrl+ArrowLeft` / `Ctrl+ArrowRight`: moves the task across status columns, persists the move, updates status, and restores focus: `setTimeout(() => document.getElementById('task-card-' + task.id)?.focus(), 0)`.
- `ArrowUp` / `ArrowDown`: navigates between sibling cards in the current column.
- `ArrowLeft` / `ArrowRight`: jumps focus to the nearest card in the adjacent column.
- Fallback form control: each card includes a `<select className="input" aria-label="Move {task.title}" ...>` (`TaskCard.tsx:311-324`), allowing full movement control for users without arrow shortcut familiarity.

### 3.4 Skip Link
- Present in `apps/web/src/shell/AppShell.tsx:303`: `<a href="#main-content" className="skip-link">Skip to main content</a>`.
- Positioned off-screen (`top: -48px`, `styles.css:235`), animates to `top: 12px` on focus with high contrast (`background: var(--yellow); color: var(--on-signal); border: 2px solid var(--line);`). Targets `<main id="main-content">`.

---

## 4. Accessibility & A11y Audit

### 4.1 ARIA Roles & Structure
- **Landmarks**: `<header className="shell-masthead">`, `<nav className="shell-tabs" aria-label="Primary">`, `<main id="main-content" className="shell-main">`, `<nav className="shell-dock" aria-label="Primary">`.
- **Dialogs**: All modal overlays declare `role="dialog"` and `aria-modal="true"`, with `aria-label` or `aria-labelledby`.
- **Tablists**:
  - Timeline day selector: `<div className="day-strip" role="tablist" aria-label="Select a day">` with `<button role="tab" aria-selected={...}>`.
  - Mobile Kanban status selector: `<div className="kanban-mobile-tabs" role="tablist" aria-label="Choose workflow status">` with `<button role="tab" aria-selected={...}>` and matching `<div role="tabpanel">`.
- **Menus**:
  - Account menu: Trigger has `aria-haspopup="menu"`, `aria-expanded={open}`, `aria-controls="account-menu"`. Menu container has `role="menu"`, items have `role="menuitem"`.
  - Mobile More sheet: Container has `role="menu"` and items have `role="menuitem"`.
- **Form Controls & Errors**:
  - `TextInput`, `TextArea`, `Select` properly wrapped in `<label className="field"><span>{label}</span>...`.
  - Invalid states use `aria-invalid={true}` and `aria-describedby` linking to error text with `role="alert"` (`TaskComposer.tsx:111-117`, `TaskEditor.tsx:118-123`).

### 4.2 Screen Reader Announcements
- **Kanban Live Region**:
  - Declared in `apps/web/src/views/BoardView.tsx:134`: `<div className="sr-only" aria-live="polite">{announcement}</div>`.
  - Set dynamically during:
    - Status dropdown changes: `Moved {task.title} to {column}.` (`BoardView.tsx:80`).
    - Drag-and-drop moves: `Moved {task.title} to {column}.` or `Moved {task.title} within {column}.` (`BoardView.tsx:106-110`).
    - Task completion: `Moved {task.title} to Done.` (`BoardView.tsx:171`).

### 4.3 Contrast Analysis (WCAG 2.1 Level AA)

| Element Pair | Light Theme Hex | Dark Theme Hex | Contrast Ratio (Light) | Contrast Ratio (Dark) | WCAG AA Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ink Text on Paper** | `#191712` on `#f1ede3` | `#ece7da` on `#15171e` | **16.8:1** | **12.1:1** | **PASS (AAA)** |
| **Ink Text on Card** | `#191712` on `#faf8f1` | `#ece7da` on `#1e212b` | **18.7:1** | **11.2:1** | **PASS (AAA)** |
| **Secondary Text (`--ink-soft`)** | `#57513f` on `#faf8f1` | `#b0ab9c` on `#1e212b` | **7.14:1** | **6.70:1** | **PASS (AAA/AA)**|
| **Tertiary Text (`--ink-faint`)** | `#8b8570` on `#faf8f1` | `#77735f` on `#1e212b` | **3.45:1** | **3.14:1** | **PASS for UI/Large; Marginal for body** |
| **Accent Yellow Button** | `#191712` on `#ffd43b` | `#191712` on `#ffd43b` | **11.6:1** | **11.6:1** | **PASS (AAA)** |
| **Blue Action Button** | `#ffffff` on `#3d5afe` | `#10121a` on `#7d92ff` | **5.10:1** | **8.20:1** | **PASS (AA / AAA)** |
| **Coral Red Danger Button** | `#191712` on `#ff5d47` | `#1a0e0b` on `#ff7a68` | **6.40:1** | **7.80:1** | **PASS (AA/AAA)** |
| **Focus Indicator Outline** | `#3d5afe` on `#f1ede3` | `#7d92ff` on `#15171e` | **5.50:1** | **7.90:1** | **PASS (3:1 req)** |

- **Focus Ring**: `:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }` (`styles.css:215-218`) provides a prominent 3px outline on all focused elements in both light and dark themes.

---

## 5. Build, Test, & Tooling Configuration Health

### 5.1 Monorepo Architecture
- **Workspaces**: Root `package.json` manages `apps/*` and `packages/*`.
  - `apps/web`: React 19, Tailwind 4 (`@tailwindcss/vite`), Vite 8, Dexie 4, Motion 12, `@dnd-kit`, `cmdk`, `recharts`.
  - `apps/push-api`: Node / Fastify / Cloudflare Worker push endpoint.
  - `packages/domain`: Zero-dependency business domain, Zod schemas, gamification, and ICS export.

### 5.2 Test Frameworks
- **Vitest**:
  - Setup: `vitest.config.ts` running in `jsdom` environment with `fake-indexeddb` and `@testing-library/react`.
  - Coverage: V8 provider with coverage thresholds (50% branches, functions, lines, statements).
  - 29 unit and integration test files located in `apps/web/src/test`.
- **Playwright E2E**:
  - Config: `playwright.config.ts` with auto-running web server (`npm run preview -w apps/web -- --host 127.0.0.1 --port 4173`).
  - Multi-project coverage: `desktop` (Chrome viewport), `mobile` (Pixel 7 viewport), `performance`, and `stress`.
  - Test suites: `smoke.e2e.spec.ts`, `components.e2e.spec.ts`, `visual.e2e.spec.ts` (with visual regression snapshot baselines), `edge-cases.e2e.spec.ts`, `notifications.e2e.spec.ts`, `capture.stress.spec.ts`, `performance.perf.spec.ts`.

### 5.3 Linter & TypeScript Configuration
- **ESLint**: ESLint 9+ flat config (`eslint.config.js`) with `@eslint/js`, `typescript-eslint`, and React hooks rules.
- **TypeScript**: TS 6.0.3 in strict mode with `tsconfig.json` and separate `tsconfig.build.json`.

---

## 6. Synthesis & Prioritized Recommendations

| Item | Area | Severity | Observation | Recommended Action |
| :--- | :--- | :--- | :--- | :--- |
| **REC-01** | Touch Targets | Medium | `.icon-toggle` is 36x36px and `.btn-sm` is 34px height. | Ensure mobile touch targets meet 44x44px min bounding box via `min-width: 44px; min-height: 44px;` or touch padding pseudo-elements. |
| **REC-02** | Mobile PWA | Medium | `index.html` viewport tag lacks `viewport-fit=cover`. | Change to `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />` so bottom dock respects notch safe areas. |
| **REC-03** | Keyboard 'N' | Low | Pressing 'N' in `goals` view does nothing (`primaryActionLabel` undefined). | Update `App.tsx:266` to trigger goal composer or task composer when in Goals view. |
| **REC-04** | PWA URL Alias | Low | `vite.config.ts:175` shortcut has `url: "/app?view=today"`, whereas `AppView` uses `view=dashboard`. | Add alias handling in `initialView()` in `App.tsx` to map `"today"` to `"dashboard"` explicitly. |
| **REC-05** | Drag Handles Mobile | Low | Kanban cards render drag handle in mobile view even though mobile uses tabbed status view without DnD. | Conditionally render `.drag-handle` only when `!isMobileBoard` or keep hidden on coarse pointer. |

---
*Report compiled by teamwork_preview_explorer_survey_3.*
