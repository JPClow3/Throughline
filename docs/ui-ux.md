# UI/UX Constitution

This document defines the interface and interaction guidelines for Throughline, built upon the **Inkline** visual system — a bold, editorial neo-brutalist design language.

## 1. Core Principles & Mindset

- **First Screen Efficiency:** The initial screen is the fully usable application.
- **Student-Life Focus:** Optimize for frictionless action and reduced cognitive load to help manage classes, assignments, and study stress.
- **Bold, High-Contrast Planner:** Lead with heavy typographic hierarchy, hard edges, and functional whitespace. Gamification stays visually clean and easily toggled.
- **Printed-Paper Honesty:** Surfaces look like ink on card stock: solid fills, 2px borders, hard offset shadows with zero blur. Nothing pretends to float; emphasis comes from weight and contrast.
- **Solid Legibility:** Visual boldness must never compromise accessibility. Text maintains high contrast against paper or ink fills in both themes.

## 2. Theme, Light & Colour

- **Themes:** Light mode is warm paper (`#f1ede3`) with near-black ink. Dark mode is a matte slate (`#15171e`) with bone-white ink and black offset shadows.
- **Palette:**
  - **Paper & Ink:** Warm off-whites/card fills with `#191712` (light) / `#ece7da` (dark) ink for text and borders.
  - **Signal accents:** Highlighter Yellow `#ffd43b` (primary intent), Electric Blue `#3d5afe` (focus/actions), Mint Green `#1fae67` (success/progress), Coral Red `#ff5d47` (danger/overdue), Violet `#8f6bf5` (identity/game layer).
  - **Soft variants** of each accent tint chips, guidance cards, and state surfaces without breaking contrast.
- **No gradients, no blur, no translucency.** Overlays dim the page with a flat ink wash.

## 3. Elevation Model

Depth is communicated by displacement, not blur:
- **Level 0 (Background):** Paper with a subtle dot-grid texture.
- **Level 1 (Card):** Solid card fill, 2px ink border, `14px` radius, `3px 3px` hard shadow.
- **Level 2 (Hover):** The element lifts — `translate(-2px, -2px)` with a `5px 5px` shadow.
- **Level 3 (Pressed):** The element sinks — `translate(2px, 2px)`, shadow collapses to nothing.
- **Level 4 (Overlay):** Sheets/modals carry an `8px 8px` shadow over a dimmed backdrop.

*Rule:* Every interactive surface answers "can I press this?" through its border and shadow. Decorative panels may drop the shadow but keep the border.

## 4. Typography & Layout

- **Typography:** Self-hosted **Geist Variable**. Headings run at weight ~800 with tight letter-spacing; section labels are uppercase micro-type (`~11–12px`, bold, wide tracking). Stats and dates use tabular numerals.
- **Layout:** Single content column up to `1280px`, fluid gutters on desktop. Mobile-first stacking with a persistent bottom dock.
- **Whitespace:** Generous vertical rhythm between sections (`24–40px+`); dense areas (board columns, lists) tighten to `8–12px`.
- **Panels:** Cards use consistent internal padding of roughly `20–24px`.

## 5. Interaction & Motion

- **Press physics:** Buttons and cards translate against their shadow on click (see elevation model). Transitions are fast (`~120ms`) and snappy rather than springy-soft.
- **Completion feedback:** Completing a task fires a brief confetti-square burst plus a "+XP" chip when relevant; it never blocks interaction.
- **Sheet transitions:** Sheets slide up from the bottom edge (centered dialog on desktop) over a dimmed backdrop using a short spring.
- **Navigation dock:** Mobile uses a floating bottom dock; desktop uses a top tab strip where the active tab is highlighted with signal yellow.

## 6. Shell Chrome & Account

- **Every control is real:** the shell must not render dead affordances. If a control has no behavior yet, it is removed until it does.
- **Masthead:** Brand mark (yellow tile + line-and-nodes glyph), global search trigger with a `Ctrl K` hint, New Task action, sync pill, and account avatar.
- **Account Menu:** The avatar shows the signed-in user's initial and opens a bordered popover with the email, an end-to-end-encrypted reassurance, live sync status (Up to date / Syncing… / Offline · saved on this device / Paused · will retry) with relative last-sync time, plus Sync now, Settings, and Sign out actions.
- **Sync Pill:** Compact status pill in the masthead; clicking it triggers a manual sync. Status colors: green (up to date), pulsing blue (syncing), amber (offline), red (error).
- **Notifications Bell:** There is no notification center yet, so no bell appears in the shell. Add one only together with a real notification surface.

## 7. Component Specifics

- **Buttons:** Primary = ink fill with paper text; Accent = highlighter yellow with ink text (the "main action" on a view); Danger = coral red; Quiet = card surface with border and shadow. All share the press physics.
- **Input Fields:** Inset paper-toned fields with 2px borders; focus replaces the shadow with a yellow offset glow.
- **Chips:** Pill-shaped, bordered, hard-shadowed toggles; active chips invert to ink fill.
- **Cards & Modules:** Solid card fills with 2px borders; project colour appears as left edge bars or dots, never as large washes.
- **Task Cards:** Completion is always one press. Inline step editing opens from the step-progress control once a card has steps; goal steps additionally keep an always-visible "Add subtask" field because decomposition is the point there. Dense lists stay quiet. On touch, card titles keep a visible "open task" affordance instead of relying on hover.
- **Progress rings:** Conic-gradient ring with a card-coloured inner disc and a bold percentage readout.
- **Install Banner:** The PWA install prompt is a bordered card chip (icon tile, title, subtitle, primary Install action, quiet dismiss). Dismissal persists in appearance settings in IndexedDB, not ad hoc localStorage.

## 8. Core Workflows

1. **Quick Capture:** Fast, keyboard-accessible sheet with minimal required fields (Title; Project/Due up front; Details collapsed). Pressing `N` in any planner view opens it (new note on Notes).
2. **Goal Decomposition:** Break large goals into ordered steps with roll-up progress rings.
3. **Cross-Linked Context:** Link markdown notes to tasks and goals.
4. **Workflow Movement:** Process tasks naturally from Backlog to Done by drag, select, or keyboard; drag-reordered columns persist their custom sequence.
5. **Calendar Export:** Export due dates via `.ics`.

## 9. First-Run, Search, Filters & Focus

- **Setup Onboarding:** First run helps the user choose a school/work/personal workspace, create 1-3 projects or courses, add one real task, and then arrive in a useful Today view. Sync remains a Settings handoff; notification permission is optional.
- **Command/Search:** The global search control opens the command palette and shows a desktop `Ctrl K` hint. Search results cover tasks, notes, goals, and projects, and selecting one jumps directly to the matching surface.
- **Mobile Filters:** Board and task filters collapse on small screens into visible search plus a Filters disclosure, preserving project, goal, date, tag, status, and priority behavior.
- **Filter Presets:** Filters use native chips for built-in presets, tag chips for existing tags, saved custom presets in IndexedDB settings, and a visible Clear filters command.
- **Focus Sessions:** A single focus system supports untitled focus and task-attached focus via a dockable square timer. Completed sessions are stored as first-class focus records and feed Today/Insights instead of synthetic completed tasks.
- **Board Accessibility:** Kanban cards support keyboard movement, focus restoration, clear labels, and live announcements when a task changes columns. The mobile status switcher and the Timeline day strip are real tablists (`aria-controls`/`tabpanel`, Arrow/Home/End keys). Empty columns offer an "Add task" action instead of a dead placeholder.
- **Honest Loading:** Views render the skeleton until IndexedDB resolves. An empty state always means "there is nothing here", never "data has not arrived yet".

## 10. Optional Gamification (Momentum Layer)

- **Disabled by Default:** XP, levels, and attributes are hidden unless `showGameLayer` is enabled.
- **Positive Streaks:** Celebrate momentum without penalizing missed days.
- **Tactile Celebration:** Task completion triggers a short confetti burst and XP chip without blocking the UI.
