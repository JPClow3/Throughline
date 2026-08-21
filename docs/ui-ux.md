# UI/UX Constitution

This document defines the interface and interaction guidelines for Throughline, built upon the **Claymorphism** visual system.

## 1. Core Principles & Mindset

- **First Screen Efficiency:** The initial screen is the fully usable application.
- **Student-Life Focus:** Optimize for frictionless action and reduced cognitive load to help manage classes, assignments, and study stress.
- **Calm, High-Contrast Planner:** Lead with typographic clarity and functional whitespace. Gamification is visually clean and easily toggled.
- **Tactile Clay Depth:** The UI uses soft 3D inflated shapes, double inner shadows, and soft drop shadows to clarify hierarchy without relying on blurs or translucency.
- **Solid Legibility:** Visual depth must never compromise accessibility. Text colors maintain high contrast against solid pastel or matte backgrounds.

## 2. Theme, Light & Colour

- **Themes:** Light mode leverages soft pastel backgrounds. Soft dark mode uses matte grays and deep blues.
- **Palette:**
  - **Primary:** Refined Indigo (sparingly for high intent).
  - **Surface:** Solid off-whites and pastels (clay base).
  - **Accents:** Mint (Secondary) and Blue (Tertiary) for semantic feedback.
  - **Inner Shadows:** A bright top-left inner shadow (highlight) and a darker bottom-right inner shadow (depth) to create the "inflated" 3D look.

## 3. Claymorphism & Elevation Z-Axis

Depth is the primary navigator. There is no separate 3D canvas—depth comes from inflated surfaces on a solid background.
- **Level 0 (Background):** Solid soft color (e.g., off-white or soft pastel).
- **Level 1 (Substrate):** Main content panels (solid fill, double inner shadows, larger border radius).
- **Level 2 (Interactive):** Hovered states, cards (slightly lighter fill, pronounced drop shadow).
- **Level 3 (Modals/Overlays):** Quick-add sheets, dialogs (deepest outer shadow, prominent inflation).
*Rule:* Every clay element must have inner highlights and inner shadows to define its 3D volume, with larger, bubbly corner radii.

## 4. Typography & Layout

- **Typography:** Self-hosted **Geist Variable**. Weights are standard to anchor the fluffy UI elements. Use tabular numerals for stats and dates.
- **Layout:** 12-column fixed grid (1440px max-width) on desktop with 24px gutters. 8pt spatial system.
- **Whitespace:** Emphasize "Functional Whitespace" (48px+ gaps) to let the background breathe.
- **Clay Modules:** Solid clay panels must have consistent 24px internal padding and bubbly radii (e.g., 24px+).

## 5. Interaction & Motion

- **Hover Micro-Animations:** Interactive elements scale up slightly (`1.015x`), increase their drop shadow, and slightly lighten their inner shadow to feel more "inflated".
- **Tactile Click Feedback:** Clicks trigger a deep compression effect (`0.95x`) and increased inner darkness to simulate pressing a soft button.
- **Z-Axis Sheet Transitions:** Sheets (like task composer) use smooth spring transitions to zoom and slide in over a dimmed solid backdrop.
- **Navigation Dock:** The primary navigation is a soft, solid floating dock.

## 6. Shell Chrome & Account

- **Every control is real:** the shell must not render dead affordances. If a control has no behavior yet, it is removed until it does.
- **Account Menu:** The avatar shows the signed-in user's initial and opens a clay popover with the email, an end-to-end-encrypted reassurance, live sync status (Up to date / Syncing… / Offline · saved on this device / Paused · will retry) with relative last-sync time, plus Sync now, Settings, and Sign out actions. Available on desktop top bar and mobile header.
- **Sync Pill:** The desktop top bar shows a compact sync status pill; clicking it triggers a manual sync. Status colors: success green (up to date), primary pulse (syncing), warning amber (offline), danger red (error).
- **Notifications Bell:** There is no notification center yet, so no bell appears in the shell. Add one only together with a real notification surface.

## 7. Component Specifics

- **Buttons:** Primary uses Indigo fill/white text with clay inner shadows. Secondary uses a lighter clay surface.
- **Input Fields:** Inset clay surfaces (reversing the inner shadows so they look pressed-in).
- **Lists & Selectors:** Solid background by default, elevated on hover.
- **Cards & Modules:** Strict 24px internal padding; bubbly borders.
- **Install Banner:** The PWA install prompt is a clay modal chip (icon tile, title, subtitle, primary Install action, quiet dismiss). Dismissal persists in appearance settings in IndexedDB, not ad hoc localStorage.

## 8. Core Workflows

1. **Quick Capture:** Fast, keyboard-accessible floating sheet.
2. **Goal Decomposition:** Break large goals down into minor subtasks.
3. **Cross-Linked Context:** Link markdown study notes to tasks and goals.
4. **Workflow Movement:** Process tasks naturally from Backlog to Done.
5. **Calendar Export:** Export due dates via `.ics`.

## 9. First-Run, Search, Filters & Focus

- **Setup Onboarding:** First run helps the user choose a school/work/personal workspace, create 1-3 projects or courses, add one real task, and then arrive in a useful Today view. Sync remains a Settings handoff; notification permission is optional.
- **Command/Search:** The global search control opens the command palette and shows a desktop `Ctrl K` hint. Search results cover tasks, notes, goals, and projects, and selecting one jumps directly to the matching surface.
- **Mobile Filters:** Board and task filters collapse on small screens into visible search plus a Filters disclosure, preserving project, goal, date, tag, status, and priority behavior.
- **Filter Presets:** Filters use native chips for built-in presets, tag chips for existing tags, saved custom presets in IndexedDB settings, and a visible Clear filters command.
- **Focus Sessions:** A single focus system supports untitled focus and task-attached focus. Completed sessions are stored as first-class focus records and feed Today/Insights instead of synthetic completed tasks.
- **Board Accessibility:** Kanban cards support keyboard movement, focus restoration, clear labels, and live announcements when a task changes columns.

## 10. Optional Gamification (Momentum Layer)

- **Disabled by Default:** XP, levels, and attributes are hidden unless `showGameLayer` is enabled.
- **Positive Streaks:** Celebrate momentum without penalizing missed days.
- **Tactile Celebration:** Task completion triggers a subtle pulse or motion sweep without blocking the UI.
