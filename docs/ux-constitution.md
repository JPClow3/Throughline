# UX Constitution: Spatial & LiquidGlass Interaction Guidelines

## Audience & Mindset

- **Student-Life Focus:** Optimize interactions for busy students managing classes, assignments, and study stress. The target audience values a workspace that feels both infinite and focused.
- **Frictionless Action:** Design layouts that reduce the cognitive load of tracking deadlines and reviewing study materials.

## Core Loops

- **Quick Capture:** Capture a task immediately using the floating keyboard-accessible quick-add sheet.
- **Goal Decomposition:** Break large goals down into minor subtasks, viewing roll-up progress instantly.
- **Cross-Linked Context:** Link markdown study notes directly to tasks and goals.
- **Workflow Movement:** Process tasks naturally from Backlog to Done using board drag-and-drop or select menus.
- **Calendar Export:** Export academic due dates directly to external calendar tools using `.ics`.

## Spatial & Interactive Feedback

- **Hover Micro-Animations:** When hovering over interactive elements (task cards, goal cards, buttons, nav items), they must shift physically:
  * Scale up slightly (`scale(1.015)`) to show focus.
  * Elevate their shadows (increase blur and spread) to feel as if they are floating closer to the user (e.g., transition from Level 1 to Level 2 elevation).
- **Tactile Click Feedback:** Active presses on buttons or cards should trigger a quick compression effect (`scale(0.98)`) to simulate a physical button depress.
- **Navigation (Spatial Dock):** The primary navigation is treated as a "Dock" — a high-blur glass element floating at the bottom or side of the screen, utilizing the 1.015x hover scale for individual icons.
- **Z-Axis Sheet Transitions:** Quick-add and task editor sheets must use smooth spring transitions to zoom and slide in from the screen depth (Z-axis scale/translate) over a blurred backdrop, representing Level 3 elevation.

## Component Specifics

- **Buttons:** Primary buttons use a high-saturation Indigo fill with white text. Secondary buttons are glass-based with a 1px refraction border. Hover scales to 1.015x and increases shadow spread; click compresses to 0.98x.
- **Input Fields:** Inputs are semi-translucent (white at 10% opacity) with a 1px border. When focused, the border opacity increases to 60%, and the backdrop blur intensifies.
- **Lists & Selectors:** List items should have a transparent background by default, turning into a "frosted" layer (white at 20% opacity) on hover, following the standard scale transitions.
- **Cards & Modules:** Content must be strictly aligned to the internal 24px padding. Avoid inner borders.

## Gamification (Optional Momentum Layer)

- **Opt-In Behavior:** The gamification system (XP, levels, attributes) is **disabled by default** and only visible if `showGameLayer` is enabled in Settings.
- **Positive Streaks:** Streaks motivate and celebrate momentum; they do not penalize or shame users for missed days.
- **Tactile Celebration:** Completing a task triggers a subtle, satisfying 3D card pulse or motion sweep without cluttering the screen or blocking the next task capture.

## Workflow Priority

1. Fast task capture and sheets opening.
2. Fluid Kanban movements and drag-and-drop.
3. High-contrast due-date visibility.
4. Smooth spatial hover and selection feedback.
5. Calendar exports and notification syncing.

## Notification UX

- **Clear Permission State:** Show honest states regarding browser notification support and service worker readiness.
- **Redacted Privacy:** Push sync runs silently in the background. Payloads contain zero readable task info to guarantee student privacy.
