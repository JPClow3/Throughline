# Original User Request

## Initial Request — 2026-09-10T08:01:00Z

Finish and polish the UI and UX of Throughline, ensuring full fidelity to the Inkline editorial neo-brutalist design system, responsive design across mobile and desktop, keyboard navigation, and seamless end-to-end user workflows.

Working directory: H:\Code\Pessoais\Throughline
Integrity mode: development

## Requirements

### R1. Comprehensive View Audit & UX Finishing
Audit and complete all core planner views—Today dashboard, Kanban board, Timeline, Goals, Notes, Courses/Projects, Insights, and Settings. Ensure complete states for every screen: first-load empty states with clear calls to action, populated content states, smooth transitions, and zero dead or non-functional affordances.

### R2. Inkline Visual System Alignment
Ensure all user interface components and layouts adhere strictly to the Inkline design system (`docs/ui-ux.md`):
- Solid warm paper surfaces (`#f1ede3` light / `#15171e` dark slate) and solid ink borders (2px).
- Zero gradients, zero blurs, zero translucency; depth communicated solely via hard offset shadows (`box-shadow: 3px 3px 0px ...` / `5px 5px` / `8px 8px`).
- Tactile press physics (`translate(2px, 2px)` collapsing shadow on active press).
- Consistent Geist typographic hierarchy and signal accents (Highlighter Yellow, Electric Blue, Mint Green, Coral Red, Violet).

### R3. Responsive Layout & Mobile PWA Polish
Refine responsive adaptations from 375px mobile viewports up to 1280px desktop displays. Mobile surfaces must feature fluid stacking, bottom navigation dock, touch-friendly targets (minimum 44x44px), and bottom sheet dialogs. Desktop surfaces must feature clean gutters, tab navigation, and centered dialog overlays.

### R4. Keyboard Workflows & Accessibility
Ensure first-class keyboard navigation and accessibility across the application:
- Global shortcuts (`N` for quick capture / note creation, `Ctrl/Cmd+K` for command palette).
- Proper modal/sheet focus management, focus traps, and `Escape` to close.
- Accessible ARIA roles, labels, live announcements for board moves, and WCAG AA contrast compliance across both light and dark themes.

## Acceptance Criteria

### Visual & Component Fidelity
- [ ] All views (Today, Kanban, Timeline, Goals, Notes, Courses, Insights, Settings) visually match the Inkline design system with 2px ink borders, hard offset shadows, and zero blurs or gradients.
- [ ] Press physics (lift on hover, sink on press) function reliably on all interactive buttons, cards, and chips.
- [ ] Light and dark themes maintain AA contrast across all text and icon elements.

### Responsiveness & Interaction
- [ ] Layout displays correctly without horizontal overflow or clipping across mobile (375px), tablet (768px), and desktop (1280px) viewports.
- [ ] Quick capture (`N`) and command palette (`Ctrl+K`) open reliably and trap focus correctly with keyboard-accessible escape.
- [ ] Empty states in all views have helpful guidance and actionable triggers.
- [ ] No dead controls or non-functional buttons are present in the shell or views.

### Automated Verification
- [ ] `npm run typecheck` succeeds with 0 errors across all workspaces.
- [ ] `npm run lint` succeeds with 0 errors.
- [ ] `npm run test` executes all unit and integration test suites with 100% passing rate.
- [ ] `npm run build` succeeds without build errors.
