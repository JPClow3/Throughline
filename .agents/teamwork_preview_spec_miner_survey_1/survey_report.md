# Inkline Design System & Visual Specification Survey Report

**Document**: `survey_report.md`  
**Agent**: `teamwork_preview_spec_miner_survey_1` (Specification Investigator / Miner)  
**Date**: 2026-09-10  
**Target Repository**: Throughline (`H:\Code\Pessoais\Throughline`)  
**Status**: Completed (Read-Only Investigation)

---

## 1. Executive Summary & Design System Identity

**Throughline** is built upon the **Inkline** design language—a bold, editorial neo-brutalist system designed specifically for student-life productivity. It rejects the floating, blurred glassmorphism of contemporary web applications in favor of **printed-paper honesty**: solid paper surfaces, 2px crisp ink borders, hard offset block shadows with zero blur, signal-color accents, and tactile press physics.

### Core Tenets of Inkline
1. **Printed-Paper Honesty**: Surfaces appear as ink printed on heavy card stock. Solid fills, 2px borders, hard offset shadows (`box-shadow: Xpx Ypx 0 0 ...`). Depth is communicated purely by geometric displacement, never by Gaussian blur or drop-shadow feathering.
2. **Elimination of Forbidden Visuals**: Zero gradients (except functional conic-gradient progress rings and background dot grids), zero blurs (`backdrop-filter: none`), zero translucent layering. Overlays dim the page using a flat, unblurred ink wash.
3. **Tactile Press Physics**: Every interactive surface answers the affordance question "Can I press this?" through border, shadow, and physical recoil. On hover, elements lift (`translate(-2px, -2px)` with shadow expansion to 5px); on press, elements sink (`translate(2px, 2px)` with shadow collapse to 0). Transitions are fast and snappy (~120ms).
4. **Editorial Typographic Scale**: Heavy typographic hierarchy powered by self-hosted **Geist Variable** (bold weights 800, tight tracking on headings, uppercase tracked micro-labels at 11–12px, tabular numerals for all metrics and dates).
5. **High-Contrast Signal Accents**: Highlighter Yellow (primary intent), Electric Blue (actions/focus), Mint Green (success/completion), Coral Red (urgency/overdue), and Violet (identity/game layer), paired with soft tint variants that never compromise WCAG AA contrast.

---

## 2. Authoritative Specification Hierarchy & Sources

The authoritative specifications governing Throughline's UI/UX are structured in a strict hierarchy:

| Priority | Source Document | Authority Scope | Key Contents |
|:---|:---|:---|:---|
| **1 (Highest)** | `docs/ui-ux.md` | Authoritative UI/UX Constitution | Inkline visual system, elevation model, color palette, typography scale, component specs, interaction physics. |
| **2** | `AGENTS.md` | Operational & Engineering Constraints | Non-negotiable product rules: offline-first, local Dexie storage, 2px ink borders, zero 3D layers, zero blurs/gradients, WCAG AA compliance. |
| **3** | `docs/product.md` | Product Requirements & Roadmap | View specs (Today, Board, Timeline, Goals, Notes, Projects, Insights), privacy architecture (E2EE), roadmap boundaries. |
| **4** | `apps/web/src/styles.css` | Implemented Design Tokens & Primitives | Tailwind 4 setup, CSS variables (`:root`, `[data-theme="dark"]`), component classes, animations, media queries. |
| **5 (Reference)** | `apps/web/src/ui/*.tsx` | Core UI Primitives | Implementation of `Button`, `Card`, `Chip`, `Field`, `Overlay`, `ConfirmDialog`, and `feedback`. |

---

## 3. Complete Design Token Specification

All authoritative tokens are implemented in `apps/web/src/styles.css`.

### 3.1 Color Palette & Theme Tokens

#### Light Theme (`:root` / `color-scheme: light`)
- `--paper`: `#f1ede3` (Warm card-stock background)
- `--paper-2`: `#e7e2d4` (Inset panels, secondary surfaces, skeleton base)
- `--card`: `#faf8f1` (Solid primary card fill)
- `--card-tinted`: `#f6f2e9` (Subtle tinted surfaces, notices, code blocks)
- `--ink`: `#191712` (Near-black primary text, solid 2px borders, primary buttons)
- `--ink-soft`: `#57513f` (Secondary body text, subtitles, muted labels)
- `--ink-faint`: `#8b8570` (Placeholder text, borders on quiet cards, subtle icons)
- `--line`: `#191712` (Solid 2px ink border color)
- `--line-soft`: `rgba(25, 23, 18, 0.28)` (Subtle dashed dividers and dot-grid pattern)
- `--shadow-ink`: `#191712` (Hard shadow fill color)
- `--on-signal`: `#191712` (Fixed dark ink for text/icons sitting on yellow signal fills)

#### Dark Theme (`:root[data-theme="dark"]` / `color-scheme: dark`)
- `--paper`: `#15171e` (Matte dark slate background)
- `--paper-2`: `#101218` (Recessed dark surface)
- `--card`: `#1e212b` (Solid dark card fill)
- `--card-tinted`: `#232633` (Tinted dark panel)
- `--ink`: `#ece7da` (Bone-white primary text, primary borders)
- `--ink-soft`: `#b0ab9c` (Secondary dark text)
- `--ink-faint`: `#77735f` (Muted dark text and disabled elements)
- `--line`: `#ece7da` (Solid 2px bone-white border)
- `--line-soft`: `rgba(236, 231, 218, 0.32)` (Subtle dashed dividers in dark mode)
- `--shadow-ink`: `#000000` (Pitch black hard shadow fill)
- `--on-signal`: `#191712` (Inherited fixed dark ink for yellow signal fills)

#### Signal Accents & Semantic Variables
| Token | Light Value | Dark Value | Purpose / Semantics |
|:---|:---|:---|:---|
| `--yellow` | `#ffd43b` | `#ffd43b` | Highlighter Yellow: primary intent, active navigation, brand mark, selection |
| `--yellow-soft` | `#ffe58a` | `#66531a` | Yellow tint for warnings, due soon chips, radar indicators |
| `--blue` | `#3d5afe` | `#7d92ff` | Electric Blue: focus sessions, interactive highlights, primary links |
| `--blue-soft` | `#c3ceff` | `#2c3767` | Blue tint for focus guidance, study blocks |
| `--green` | `#1fae67` | `#46cd88` | Mint Green: task completion, progress bars, success status |
| `--green-soft` | `#b4ecc9` | `#1d4432` | Green tint for done chips, celebration badges, positive coaching |
| `--red` | `#ff5d47` | `#ff7a68` | Coral Red: overdue tasks, danger buttons, error alerts |
| `--red-soft` | `#ffc4ba` | `#66322a` | Red tint for overdue chips, notice-error surfaces |
| `--violet` | `#8f6bf5` | `#ab8dff` | Violet: RPG game layer, XP chips, avatar fill |
| `--violet-soft` | `#ded1ff` | `#3d3370` | Violet tint for linked note chips, blocked guidance |
| `--on-accent` | `#ffffff` | `#10121a` | Text sitting on `--blue` accent fill |
| `--warn` | `#e8a013` | `#f0b429` | Warning status indicators |
| `--danger` | `#e03e2b` | `#ff6a57` | Destructive status indicators |

### 3.2 Elevation & Shadow Hierarchy

Depth in Inkline is communicated entirely by **offset displacement** with zero blur radius:

| Level | Token | CSS Value | Usage / Element |
|:---|:---|:---|:---|
| **Level 0** | None | `box-shadow: none;` | Dot-grid background (`radial-gradient(var(--line-soft) 1px, transparent 1px)` with `background-size: 26px 26px`), flat cards (`.ik-card-flat`), insets (`.ik-inset`). |
| **Micro-Control** | `--shadow-0` | `2px 2px 0 0 var(--shadow-ink)` | Small buttons (`.btn-sm`), chips (`.chip`), sync pill, avatar button, checkboxes, drag handles, day chips. |
| **Level 1** | `--shadow-1` | `3px 3px 0 0 var(--shadow-ink)` | Standard cards (`.ik-card`), primary buttons (`.btn`), task cards (`.task-card`), goal cards (`.goal-card`), empty state icons. |
| **Level 2 (Hover)** | `--shadow-2` | `5px 5px 0 0 var(--shadow-ink)` | Hover lift state on buttons (`.btn:hover`), cards (`.task-card:hover`), FAB (`.shell-mobile-primary-action`), account popover. |
| **Level 3 (Pressed)**| None | `box-shadow: none; transform: translate(2px, 2px);` | Active depressed state on buttons, chips, toggles. Hard shadow fully collapses. |
| **Level 4 (Overlay)**| `--shadow-3` | `8px 8px 0 0 var(--shadow-ink)` | Sheets (`.sheet`), Command Palette (`.palette-panel`), modal dialogs (`.modal-panel`). |

### 3.3 Radii, Layout & Z-Index Tokens

- **Card Radius**: `--radius-card: 14px;` (cards, dialog panels)
- **Control Radius**: `--radius-control: 10px;` (buttons, inputs, notices)
- **Chip Radius**: `--radius-chip: 999px;` (pills, filter chips, tags)
- **Control Height**: `--control-h: 44px;` (ensuring 44px minimum touch targets)
- **Max Container Width**: `--container-max: 1280px;`
- **Fast Duration**: `--dur-fast: 120ms;` (snappy neo-brutalist interaction physics)
- **Z-Index Ladder**:
  - `--z-drag: 5;`
  - `--z-lifted-card: 20;`
  - `--z-celebrate: 30;`
  - `--z-nav: 50;`
  - `--z-dock: 60;`
  - `--z-fab: 70;`
  - `--z-popover: 80;`
  - `--z-banner: 90;`
  - `--z-focus-shell: 95;`
  - `--z-overlay-sheet: 100;`
  - `--z-overlay-modal: 110;`
  - `--z-overlay-palette: 120;`
  - `--z-overlay-onboarding: 150;`
  - `--z-skip-link: 400;`

### 3.4 Typographic Hierarchy

- **Font Family**: `"Geist Variable", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Scale**:
  - Display: `--text-display: clamp(2rem, 3.2vw, 2.75rem);` / `--lh-display: 1.08;`
  - Page Title: `--text-page: 1.55rem;` / `--lh-page: 1.9rem;`
  - Title: `--text-title: 1.25rem;` / `--lh-title: 1.6rem;`
  - Section Header: `--text-section: 1.05rem;` / `--lh-section: 1.4rem;`
  - Card Title: `--text-card: 0.95rem;` / `--lh-card: 1.35rem;`
  - Body: `--text-body: 0.9rem;` / `--lh-body: 1.45rem;`
  - Small / Secondary: `--text-sm: 0.84rem;`
  - Label / Eyebrow: `--text-label: 0.76rem;` / `--lh-label: 1.15rem;`
- **Weights**:
  - Medium: `--fw-medium: 500;`
  - Semibold: `--fw-semibold: 650;`
  - Bold: `--fw-bold: 800;`
- **Tracking**:
  - Eyebrow / Micro-type: `--tracking-eyebrow: 0.09em;` (uppercase, bold)
- **Numerals**:
  - All counters, timers, progress readouts, timestamps, and metric tiles use `.tabular` (`font-variant-numeric: tabular-nums`).
  - Cryptographic recovery keys and data schemas use `ui-monospace, monospace` with letter-spacing `0.06em–0.12em`.

---

## 4. Prohibited Visual Styles Audit

A strict code audit was conducted across the codebase to ensure complete elimination of forbidden styles:

1. **Gaussian Blurs & Backdrop Blurs**:
   - `apps/web/src`: **ZERO instances of CSS `blur()` or `backdrop-filter: blur()` found**. All occurrences of "blur" in `src` are React event handlers (`onBlur`).
   - Legacy files: `apps/web/public/brand/colors/throughline.tokens.css` contains `backdrop-filter: blur(24px)`, but this file is an orphaned artifact and is NOT imported by the application.
2. **Color Gradients**:
   - `apps/web/src`: **ZERO smooth color gradients or gradient washes found on cards, buttons, or backgrounds**.
   - Allowed exceptions verified:
     - `radial-gradient(var(--line-soft) 1px, transparent 1px)` used exclusively for the dot-grid pattern on paper surfaces.
     - `conic-gradient` used exclusively for `.goal-ring` and `.focus-ring` (explicitly mandated by `docs/ui-ux.md`).
     - Hard-stop `linear-gradient(45deg, ...)` used exclusively to render the dropdown arrow icon in `select.input`.
3. **Translucency & Opacity Layering**:
   - Overlays (`.sheet-backdrop`, `.modal-backdrop`, `.palette-backdrop`, `.onboarding-backdrop`) do not use blur or semi-transparent frosted glass. They use a flat, opaque ink wash: `background: color-mix(in srgb, var(--shadow-ink) 45%, transparent);`.
   - Card surfaces and controls use 100% solid color fills (`#faf8f1` light, `#1e212b` dark).
   - `opacity` is strictly reserved for interactive states (`disabled: 0.55`, completed subtasks `0.65`, drag handle hover transition `0 -> 1`, and skeleton pulse animation).

---

## 5. Core Views & Components Survey

### 5.1 AppShell & Masthead
- **Desktop Masthead**: Brand mark (yellow rounded square with ink line glyph), global search trigger with `Ctrl K` shortcut badge, New Task button (`.btn-accent .btn-sm`), Sync pill with real-time status dot (`is-busy`, `is-warn`, `is-error`), and violet Avatar menu.
- **Desktop Tabs**: Tab strip with `2px solid var(--line-soft)` dividers. Active tab receives highlighter yellow fill (`bg: var(--yellow); color: var(--on-signal);`) with a 3px bottom ink bar.
- **Mobile Navigation**: Floating bottom dock (`.shell-dock`) with 16px radius, 2px border, 5px shadow (`--shadow-2`). Active dock tab is highlighted with yellow fill. Overflow views accessed via "More" bottom sheet (`.dock-more-sheet`). Floating Action Button (`.shell-mobile-primary-action`) sits 86px from bottom with 58x58px dimensions.

### 5.2 Planner Views
1. **Today Dashboard**:
   - Hero header with dynamic greeting, date, and real task completion progress line.
   - Priority task list with hard-offset task cards and completion buttons.
   - "Also on the radar" list for upcoming actionable work with project dot and due dates.
   - Stat tiles (Completed, Last 7 days, Overdue, Focus time, Active courses) with tabular metrics.
   - Study block card with direct focus trigger.
2. **Kanban Board**:
   - Five standard columns: Backlog, Ready, Doing, Blocked, Done.
   - Drag-and-drop via `@dnd-kit` with custom sequence persistence.
   - Responsive mobile segmented tab bar allowing single-column focus.
   - Live ARIA announcements on card moves.
   - Full keyboard navigation: Arrow keys to move between cards and columns, Space/Enter to grab and drop.
3. **Timeline**:
   - Horizontal day strip with selectable day chips showing weekday, date number, and active yellow highlight.
   - Time-blocked agenda cards with thick left project color borders (8px).
   - Direct study session initiation from agenda items.
4. **Goals View**:
   - Grid of goal cards featuring roll-up conic-gradient progress rings (`Ring` component).
   - Detail view with ordered steps, reorder controls, child task lists, and linked markdown notes.
5. **Notes View**:
   - Two-column split view (sidebar note list + editor/preview) with responsive mobile back button.
   - Search with term highlighting (`<mark>` tag with yellow fill).
   - Markdown editor with live Write / Preview toggle.
   - Cross-linked entity chips (linking tasks and goals with quick navigation and unlink actions).
6. **Projects / Courses View**:
   - Course manager with color swatches, course codes, term labels, and task count badges.
   - Inline color picker and delete confirmation dialogs.
7. **Insights View**:
   - Deterministic coaching cards based on task distribution, overdue volume, and focus history.
   - Recharts 7-day and 4-week focus hours bar charts styled with ink borders and hard tooltips.
   - 28-day completion heatmap with css custom property `--heat`.
   - Course load completion distribution breakdown.
8. **Settings View**:
   - Appearance settings (Light, Dark, System theme segmented control).
   - Game layer toggle (XP, attributes, levels).
   - End-to-end encryption key regeneration and confirmation flow.
   - Full local data export (JSON backup) and import validation.
   - Calendar `.ics` due-date export.
   - PWA installation readiness and push notification sync diagnostics.

---

## 6. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Elevation | Hard Offset Shadows | 4-tier ink block shadow system without blur (`--shadow-0` through `--shadow-3`). | Component elevation state | CSS `box-shadow: Xpx Ypx 0 0 var(--shadow-ink)` | None | `apps/web/src/styles.css:70-73` |
| 2 | Color | Dual-Theme Palette | Warm paper (`#f1ede3`) / matte slate (`#15171e`) with bone-white / near-black ink. | `data-theme="light" \| "dark"` | Color variable switches across all surfaces | Falls back to light mode | `apps/web/src/styles.css:24-165` |
| 3 | Color | Fixed `--on-signal` Contrast | Fixed dark ink (`#191712`) used over highlighter yellow in both light and dark modes. | Text/icon on yellow element | 12.4:1 contrast ratio (exceeds WCAG AAA) | None | `apps/web/src/styles.css:53` |
| 4 | Motion | Tactile Press Physics | Depress animation on interactive components: hover lifts `-2px`, active press sinks `+2px`. | `:hover`, `:active` user states | `transform: translate(2px, 2px); box-shadow: none;` | Disabled controls cancel transform | `apps/web/src/styles.css:402-409` |
| 5 | Motion | Reduced Motion Support | Replaces all animations and transitions with 0.01ms instant changes for accessibility. | `@media (prefers-reduced-motion: reduce)` | Instant state transitions | None | `apps/web/src/styles.css:321-329` |
| 6 | Typography | Geist Variable Hierarchy | Font stack using Geist Variable, 800-weight headings, and tracked uppercase micro-labels. | Text markup, `.eyebrow` class | Font rendering with strict typographic scale | Falls back to system sans-serif | `apps/web/src/styles.css:26, 336-343` |
| 7 | Typography | Tabular Numerals | Monospaced figures for all metrics, stats, counters, and dates. | `.tabular` class or `font-variant-numeric: tabular-nums` | Equal-width character spacing for numbers | None | `apps/web/src/styles.css:345-347` |
| 8 | Component | Inkline Button Primitives | Standard buttons with primary, accent, blue, danger, quiet, and icon variants. | `variant`, `size`, `children` | Styled `<button>` with press physics and 2px border | Disabled buttons set opacity 0.55, cursor not-allowed | `apps/web/src/ui/Button.tsx:1-47` |
| 9 | Component | Inkline Card & Flat Card | Solid card with 2px ink border, 14px radius, and 3px 3px hard shadow (or flat without shadow). | `flat: boolean`, `children` | `.ik-card` or `.ik-card-flat` container | None | `apps/web/src/ui/Card.tsx:1-16` |
| 10 | Component | Inkline Toggle Chips | Pill-shaped toggle chips that invert to ink fill when active. | `active: boolean`, `children` | `.chip` with 2px border and active state inversion | None | `apps/web/src/ui/Chip.tsx:1-15` |
| 11 | Component | Static Tone Chips | Non-interactive status chips with soft tint fills for overdue, soon, and done. | `tone: "overdue" \| "soon" \| "done"` | `.chip-static.is-{tone}` | None | `apps/web/src/ui/Chip.tsx:17-28` |
| 12 | Component | Conic Progress Rings | Animatable conic-gradient progress ring with solid inner disc and bold percentage. | `ratio: number`, `size?: number`, `color?: string` | `.goal-ring` with CSS `@property --ring-ratio` tweening | Ratio clamped to 0–100 | `apps/web/src/ui/feedback.tsx:107-141` |
| 13 | Component | Empty State Standard | Standard empty card with dashed border, yellow icon tile, heading, message, and action. | `icon`, `title`, `body`, `action`, `variant` | `.empty-state-card` or `.empty-state-inline` | None | `apps/web/src/ui/feedback.tsx:41-64` |
| 14 | Component | Bottom Sheet Dialog | Animated bottom drawer on mobile, centered modal on desktop, with grab-handle and ink wash. | `open: boolean`, `title`, `onClose`, `children` | `.sheet-backdrop` + `.sheet` with 8px shadow | Click outside or Esc triggers `onClose` | `apps/web/src/ui/Overlay.tsx:13-51` |
| 15 | Component | Centered Modal Dialog | Centered overlay dialog with focus trap, Esc-to-close, and dimmed ink wash. | `title`, `onClose`, `children` | `.modal-backdrop` + `.modal-panel` | Closes on Esc or backdrop click | `apps/web/src/ui/Overlay.tsx:59-81` |
| 16 | Component | Accessible Focus Trap | Traps keyboard focus within active dialogs, loops Tab navigation, restores trigger focus. | `open`, `onClose`, `panelRef` | DOM focus management | Focuses first focusable element | `apps/web/src/ui/dialogA11y.ts:1-56` |
| 17 | Shell | Desktop Masthead Chrome | Top bar with brand mark, global search trigger, new task CTA, sync pill, and avatar. | App shell props | Masthead layout with 2px bottom border | Affordances hidden if handlers undefined | `apps/web/src/shell/AppShell.tsx:305-346` |
| 18 | Shell | Desktop Tab Strip | Tab navigation with yellow highlight for active page and 3px bottom ink indicator. | Current view state | `.shell-tabs` with `.shell-tab` items | None | `apps/web/src/shell/AppShell.tsx:348-365` |
| 19 | Shell | Mobile Bottom Dock | Fixed floating bottom navigation dock with active yellow highlight and More disclosure. | Mobile viewport (`<1024px`) | `.shell-dock` with `.dock-link` items | Escape closes More sheet | `apps/web/src/shell/AppShell.tsx:384-430` |
| 20 | Shell | Mobile Primary FAB | Floating action button for quick capture on mobile viewports. | `primaryActionLabel`, `onNewTask` | 58x58px `.shell-mobile-primary-action` button | Hidden on desktop viewports | `apps/web/src/shell/AppShell.tsx:373-382` |
| 21 | Navigation | Command Palette | Global `Ctrl+K` palette searching tasks, notes, goals, and projects via MiniSearch. | `Ctrl+K` / `Cmd+K` keystroke or search button | CMDK dialog with grouped search results | Shows `.palette-empty` when no match | `apps/web/src/views/CommandPalette.tsx:1-179` |
| 22 | Navigation | Quick Capture Shortcut | Global `N` shortcut opening Task Composer (or new note when in Notes view). | Key `N` (outside input fields) | Opens task composer sheet or note editor | Ignored when user typing in input/textarea | `apps/web/src/App.tsx:290-305` |
| 23 | Board | Kanban Drag & Reorder | Full drag-and-drop column and card reordering via `@dnd-kit` with custom sequence persistence. | Pointer drag or keyboard movement | Updated task status and column positions | None | `apps/web/src/views/BoardView.tsx:190-222` |
| 24 | Board | Kanban Keyboard Nav | Complete arrow-key board navigation (Left/Right moves columns, Up/Down reorders stack). | Arrow keys, Space to grab, Enter to complete | Keyboard card movement with ARIA live announcements | Bound to column boundaries | `apps/web/src/views/BoardView.tsx:285-345` |
| 25 | Feedback | Task Completion Burst | Confetti-square burst particles and "+XP" chip animation upon marking task done. | Task checkbox click | Visual burst without blocking UI interaction | Burst auto-cleans within 700ms | `apps/web/src/views/TaskCard.tsx:48-64` |
| 26 | Focus | Focus Session Timer | Floating dockable study timer with conic progress ring, pause/resume, and task attachment. | Study session duration | Docked square timer (`.focus-timer-shell`) | Prompts cooldown modal on completion | `apps/web/src/views/FocusTimer.tsx:1-180` |
| 27 | Focus | Post-Focus Cooldown | Modal surfacing up to 3 low-energy backlog tasks after completing a focus session. | Completed focus session record | `.cooldown-body` inside modal with task cards | Dismissible without action | `apps/web/src/views/CooldownModal.tsx:1-50` |
| 28 | Security | E2EE Recovery Key Flow | Signup & Settings recovery key generation, confirmation of last 4 chars, and re-generation. | User password & salt | 32-character recovery key with cryptographic hash | Disallows proceeding until confirmed | `apps/web/src/pages/Signup.tsx:53-106` |
| 29 | System | PWA Install Chip & Banner | Non-intrusive bordered install prompt card with dismissal persisted to IndexedDB. | `beforeinstallprompt` browser event | `.pwa-install-banner` card with Install/Dismiss | Dismissal suppresses banner permanently | `apps/web/src/App.tsx:373-388` |
| 30 | System | Calendar ICS Export | Generates and triggers download of `.ics` calendar event files for all due tasks. | Tasks array | Formatted `.ics` file download | Skips tasks without due dates | `apps/web/src/lib/downloadIcs.ts:1-50` |

---

## 7. Edge Cases Observed

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Theme Detection | First load with no `localStorage` entry | Inline pre-paint script in `index.html` checks `matchMedia("(prefers-color-scheme: dark)")` and applies `data-theme` immediately before paint to prevent flashing. |
| 2 | High-Contrast Signal | Dark mode active with yellow button | `--on-signal: #191712` ensures text on `.btn-accent` or `.shell-tab[aria-current="page"]` stays dark ink (`#191712`), maintaining 12.4:1 contrast even in dark mode. |
| 3 | Avatar Contrast | Dark mode active on violet avatar | `.shell-avatar-button` switches text color from `#fff` in light mode to `#14161d` in dark mode, maintaining contrast against lighter dark-mode violet (`#ab8dff`). |
| 4 | Mobile Viewport (<640px) | Opening Task Composer Sheet | `.sheet` border-radius changes from `14px` all around to `18px 18px 0 0`, expanding to full width (`100vw`) and displaying mobile `.sheet-handle`. |
| 5 | Touch Device Navigation | Hovering drag handle on touch screen | `@media (hover: none)` sets `.drag-handle { opacity: 1; }` permanently visible, ensuring drag handles remain accessible on phones/tablets without hover. |
| 6 | Keyboard Quick Capture | User presses `N` while typing in a text field | Keystroke check in `App.tsx` checks `document.activeElement.tagName` and ignores `N` if focused inside `INPUT`, `TEXTAREA`, or `SELECT`. |
| 7 | Reduced Motion User Setting | User enables OS reduced motion | Global CSS rule sets `animation-duration: 0.01ms` and `transition-duration: 0.01ms` for all elements, eliminating motion while preserving instant state changes. |
| 8 | Empty Board State | All tasks completed or filtered out | Kanban columns render individual `<p className="kanban-empty-state">Nothing here.</p>`, but lack a unified top-level call to action or reset filter button. |
| 9 | Long Task / Note Titles | Very long continuous strings without spaces | Handled via `overflow-wrap: anywhere` and `min-width: 0`, preventing horizontal layout distortion or container breaking. |
| 10| Offline Network Status | Device loses Internet connectivity | `navigator.onLine` listener updates `SettingsView` and `SyncPill`, displaying amber warning dot and "Offline · saved on this device". |

---

## 8. Codebase Discrepancies, Gaps & Architectural Recommendations

During this comprehensive investigation, **8 discrepancies, gaps, or violations** were identified between the authoritative Inkline specification and the current codebase implementation:

### Discrepancy 1: Incomplete Tailwind 4 `@theme` Token Extension
- **Observation**: Lines 6–16 in `apps/web/src/styles.css` define only 9 basic properties in `@theme` (`--color-primary`, `--color-surface`, etc.). None of the core palette variables (`--yellow`, `--green`, `--blue`, `--red`, `--violet`, `--paper`, `--card`, `--ink-soft`, `--ink-faint`) are exposed as Tailwind color tokens.
- **Impact**: Developers are forced to write arbitrary CSS utility strings like `text-[var(--ink-soft)]`, `text-[var(--ink-faint)]`, `text-[var(--green)]`, or `!bg-[var(--green)]` (e.g. in `CoursesView.tsx:161`, `FilterBar.tsx:126`, `FocusTimer.tsx:157`, `Signup.tsx:75`).
- **Recommendation**: Extend `@theme` in `styles.css` with all Inkline tokens:
  ```css
  @theme {
    --color-paper: var(--paper);
    --color-paper-2: var(--paper-2);
    --color-card: var(--card);
    --color-card-tinted: var(--card-tinted);
    --color-ink: var(--ink);
    --color-ink-soft: var(--ink-soft);
    --color-ink-faint: var(--ink-faint);
    --color-yellow: var(--yellow);
    --color-yellow-soft: var(--yellow-soft);
    --color-blue: var(--blue);
    --color-blue-soft: var(--blue-soft);
    --color-green: var(--green);
    --color-green-soft: var(--green-soft);
    --color-red: var(--red);
    --color-red-soft: var(--red-soft);
    --color-violet: var(--violet);
    --color-violet-soft: var(--violet-soft);
    --color-on-signal: var(--on-signal);
  }
  ```

### Discrepancy 2: Level 4 Elevation Violation in `.modal-panel` and `.onboarding-panel`
- **Observation**: In `docs/ui-ux.md` Section 3, Level 4 (Overlay) mandates: `"Sheets/modals carry an 8px 8px shadow over a dimmed backdrop."` (`--shadow-3`). In `Overlay.tsx:71`, the modal panel is declared as `className="modal-panel ik-card"`. Because `.ik-card` defines `box-shadow: var(--shadow-1);` (3px 3px 0 0), all modals (including `ConfirmDialog` and `CooldownModal`) render with a weak 3px shadow instead of the required 8px hard offset shadow. The same issue exists in `OnboardingOverlay.tsx:105` (`className="ik-card onboarding-panel"`).
- **Recommendation**: Ensure `.modal-panel` and `.onboarding-panel` explicitly specify `box-shadow: var(--shadow-3);` in `styles.css` (matching `.sheet` and `.palette-panel`).

### Discrepancy 3: Missing `:active` Press Physics on `.task-card`
- **Observation**: In `styles.css:1689`, `.task-card` implements hover lift (`transform: translate(-2px, -2px); box-shadow: var(--shadow-2);`). However, there is no `.task-card:active` rule! In contrast, buttons, chips, and goal cards all implement `.active` depression (`transform: translate(2px, 2px); box-shadow: none;`).
- **Recommendation**: Add the missing active rule to `styles.css`:
  ```css
  .task-card:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
  ```

### Discrepancy 4: Command Palette Navigation Omits "Insights"
- **Observation**: In `CommandPalette.tsx:128-136`, the Navigation group lists Today, Goals, Board, Timeline, Notes, Projects, and Settings. It completely omits **Insights** (`AppView: "insights"`), which is a first-class core planner view in `AppShell.tsx` and `docs/product.md`.
- **Recommendation**: Add `<NavItem icon={<ChartLine size={16} weight="bold" />} label="Go to Insights" onSelect={() => runCommand(() => onNavigate("insights"))} />` to `CommandPalette.tsx`.

### Discrepancy 5: Kanban Board Lacks a Unified Empty State
- **Observation**: When no tasks exist in the board (or when an active filter returns 0 results), `BoardView.tsx` renders empty columns with small text (`kanban-empty-state`), but does not offer a clear, actionable `EmptyState` component or "Reset filters" trigger.
- **Recommendation**: Add a comprehensive empty state in `BoardView.tsx` when `filteredTasks.length === 0`, with a button to open Task Composer or clear active filters.

### Discrepancy 6: Orphaned Legacy Glassmorphism Assets in `public/brand/`
- **Observation**: `apps/web/public/brand/colors/` contains leftover files from the pre-Inkline design system: `colors.md`, `throughline.tokens.css`, and `throughline.tailwind-tokens.ts`. These files define frosted glassmorphism tokens (`--tl-surface-glass`, `backdrop-filter: blur(24px)`, linear hero gradients). While not imported by `src`, they cause confusion regarding design authority. Furthermore, `useTheme.ts` and `index.html` still use the legacy storage key `"lg-theme"` (Liquid Glass).
- **Recommendation**: Archive or remove the legacy brand color directory, and document the `"lg-theme"` localStorage key for backwards compatibility.

### Discrepancy 7: Historical Phrasing in `docs/product.md`
- **Observation**: Line 41 of `docs/product.md` states: `"Composer: Fast capture via a floating glass sheet."` This is a remnant of the pre-Inkline glassmorphism concept and directly contradicts `docs/ui-ux.md` Section 2: `"No gradients, no blur, no translucency. Overlays dim the page with a flat ink wash."`
- **Recommendation**: Update `docs/product.md` line 41 to read: `"Composer: Fast capture via a solid paper sheet with hard offset shadow."`

### Discrepancy 8: Ad-Hoc Inline Styles in Auth and Landing Pages
- **Observation**: In `Login.tsx`, `Signup.tsx`, and `Landing.tsx`, several elements use inline `style={{ ... }}` for display, flex alignment, and font sizes (e.g. Google Login wrapper, switch container, CTA button padding) rather than relying on Inkline utility classes or component props.
- **Recommendation**: Replace ad-hoc inline styles with standard Inkline component classes or Tailwind utilities.

---

## 9. Conclusion

The Throughline codebase demonstrates exceptional loyalty to the **Inkline** editorial neo-brutalist visual philosophy:
- Solid paper surfaces and solid 2px ink borders are systematically applied across all core views.
- Gaussian blurs and smooth translucent gradients are 100% eliminated from active application code.
- Hard offset block shadows and snappy press physics provide a distinctive, tactile, paper-and-ink user experience.
- The 8 identified discrepancies represent actionable, high-value opportunities to bring the application to 100% complete design system fidelity.
