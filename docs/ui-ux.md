# UI/UX Constitution

This document defines the interface and interaction guidelines for Throughline, built upon the **LiquidGlass** visual system.

## 1. Core Principles & Mindset

- **First Screen Efficiency:** The initial screen is the fully usable application.
- **Student-Life Focus:** Optimize for frictionless action and reduced cognitive load to help manage classes, assignments, and study stress.
- **Calm, High-Contrast Planner:** Lead with typographic clarity and functional whitespace. Gamification is visually clean and easily toggled.
- **Layered Glass Depth:** The UI uses glass, elevation, blur, and motion to clarify hierarchy without adding a separate 3D workspace layer.
- **Glassmorphic Legibility:** Visual depth must never compromise accessibility. Text colors maintain high contrast against translucent layers.

## 2. Theme, Light & Colour

- **Themes:** Light mode leverages ambient "light leaks" (a mesh of Lavender, Mint, Soft Blue). Soft dark mode supported.
- **Palette:**
  - **Primary:** Refined Indigo (sparingly for high intent).
  - **Surface:** Semi-translucent whites and neutrals (glass substrate).
  - **Accents:** Mint (Secondary) and Blue (Tertiary) for semantic feedback.
  - **Refraction:** Pure White (#FFFFFF) at 20% opacity for "inner-glow" borders.

## 3. Glassmorphism & Elevation Z-Axis

Depth is the primary navigator. There is no 3D layer—depth comes from layering on a solid background.
- **Level 0 (Background):** Ambient mesh gradient.
- **Level 1 (Substrate):** Main content panels (40px blur, 60% white fill, 1px White/20 border).
- **Level 2 (Interactive):** Hovered states, cards (60px blur, 80% white fill, pronounced shadow).
- **Level 3 (Modals/Overlays):** Quick-add sheets, dialogs (80px blur, deepest shadow).
*Rule:* Every glass element must have a 1px solid refracting border to define edges.

## 4. Typography & Layout

- **Typography:** Self-hosted **Geist Variable**. Weights are reduced (300 for display) to emphasize lightness. Use tabular numerals for stats and dates.
- **Layout:** 12-column fixed grid (1440px max-width) on desktop with 24px gutters. 8pt spatial system.
- **Whitespace:** Emphasize "Functional Whitespace" (48px+ gaps) to let the background breathe.
- **Glass Modules:** Floating glass panels must have consistent 24px internal padding.

## 5. Interaction & Motion

- **Hover Micro-Animations:** Interactive elements scale up slightly (`1.015x`) and elevate their shadows.
- **Tactile Click Feedback:** Clicks trigger a quick compression effect (`0.98x`).
- **Z-Axis Sheet Transitions:** Sheets (like task composer) use smooth spring transitions to zoom and slide in over a blurred backdrop (Level 3).
- **Navigation Dock:** The primary navigation is a high-blur floating dock.

## 6. Component Specifics

- **Buttons:** Primary uses Indigo fill/white text. Secondary uses glass with a refraction border.
- **Input Fields:** Semi-translucent (10% white). Focus increases border opacity and backdrop blur.
- **Lists & Selectors:** Transparent background by default, frosted on hover.
- **Cards & Modules:** Strict 24px internal padding; avoid inner borders.

## 7. Core Workflows

1. **Quick Capture:** Fast, keyboard-accessible floating sheet.
2. **Goal Decomposition:** Break large goals down into minor subtasks.
3. **Cross-Linked Context:** Link markdown study notes to tasks and goals.
4. **Workflow Movement:** Process tasks naturally from Backlog to Done.
5. **Calendar Export:** Export due dates via `.ics`.

## 8. First-Run, Search, Filters & Focus

- **Setup Onboarding:** First run helps the user choose a school/work/personal workspace, create 1-3 projects or courses, add one real task, and then arrive in a useful Today view. Sync remains a Settings handoff; notification permission is optional.
- **Command/Search:** The global search control opens the command palette and shows a desktop `Ctrl K` hint. Search results cover tasks, notes, goals, and projects, and selecting one jumps directly to the matching surface.
- **Mobile Filters:** Board and task filters collapse on small screens into visible search plus a Filters disclosure, preserving project, goal, date, tag, status, and priority behavior.
- **Filter Presets:** Filters use native chips for built-in presets, tag chips for existing tags, saved custom presets in IndexedDB settings, and a visible Clear filters command.
- **Focus Sessions:** A single focus system supports untitled focus and task-attached focus. Completed sessions are stored as first-class focus records and feed Today/Insights instead of synthetic completed tasks.
- **Board Accessibility:** Kanban cards support keyboard movement, focus restoration, clear labels, and live announcements when a task changes columns.

## 9. Optional Gamification (Momentum Layer)

- **Disabled by Default:** XP, levels, and attributes are hidden unless `showGameLayer` is enabled.
- **Positive Streaks:** Celebrate momentum without penalizing missed days.
- **Tactile Celebration:** Task completion triggers a subtle pulse or motion sweep without blocking the UI.
