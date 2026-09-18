# Throughline — Style Reference
> ink-on-cardstock planner with hard offset shadows, signal accents, and tactile press physics

**Design System:** Inkline  
**Themes:** Light (warm paper `#f1ede3`) & Dark (matte slate `#15171e`)  
**Product Target:** Student-life execution cockpit (fast capture, Kanban momentum, timeline pressure, and focus sessions)

Throughline is built on the **Inkline** visual system: a bold, editorial neo-brutalist design language engineered for cognitive clarity and frictionless productivity. Surfaces emulate physical heavyweight cardstock sitting on warm newsprint paper (`#f1ede3`), stamped with crisp 2px solid ink borders (`#191712`) and grounded by hard, unblurred offset shadows (`2px 2px`, `3px 3px`, `5px 5px`, `8px 8px`). Depth is communicated strictly by displacement and mechanical press physics rather than blur or elevation gradients: cards and buttons physically lift on hover (`translate(-2px, -2px)`) and compress into the paper on press (`translate(2px, 2px)` as the shadow collapses to zero). Five punchy signal accents cut through the monochrome ledger — led by Highlighter Yellow (`#ffd43b`) for primary user intent and Electric Blue (`#3d5afe`) for focus and key actions — paired with soft-tint companion backgrounds for tags, status chips, and guidance containers. The typographic voice is self-hosted **Geist Variable**, where bold 800 headings anchor sections with tight tracking, uppercase micro-type (11–12px) categorizes metadata, and tabular numerals make stats and countdowns feel like precision instruments.

---

## Tokens — Colors

### Core Surfaces & Ink

| Name | Light Hex | Dark Hex | Token | Role |
|------|-----------|----------|-------|------|
| Paper Canvas | `#f1ede3` | `#15171e` | `--paper` | Main viewport canvas; warm off-white newsprint in light mode, matte slate in dark mode. Styled with a subtle 26px radial dot grid. |
| Inset Paper | `#e7e2d4` | `#101218` | `--paper-2` | Recessed surfaces, input fields at rest, completed task backgrounds, and segmented track wells. |
| Cardstock | `#faf8f1` | `#1e212b` | `--card` | Standard interactive cards, modal dialogs, sheets, buttons, and popovers. Crisp, solid paper feel. |
| Tinted Cardstock | `#f6f2e9` | `#232633` | `--card-tinted` | Subtle elevated panels, static chips, and notice containers that need quiet separation without a full border contrast shift. |
| Primary Ink | `#191712` | `#ece7da` | `--ink` | Primary text, heavy headings, filled primary buttons, and active toggle chips. High-contrast ink. |
| Soft Ink | `#57513f` | `#b0ab9c` | `--ink-soft` | Secondary copy, subheadings, column counts, inactive segmented items, and metadata labels. |
| Faint Ink | `#8b8570` | `#77735f` | `--ink-faint` | Placeholder copy, scrollbar thumbs, strike-through lines on completed tasks, and subtle helper icons. |
| Ink Border | `#191712` | `#ece7da` | `--line` | Workhorse 2px solid border for all cards, buttons, inputs, dialogs, and dividers. |
| Soft Line | `rgba(25, 23, 18, 0.28)` | `rgba(236, 231, 218, 0.32)` | `--line-soft` | Canvas background dot-grid pattern (`radial-gradient`), sub-dividers, and subtle inactive borders. |
| Shadow Ink | `#191712` | `#000000` | `--shadow-ink` | Color of hard offset box-shadows. Near-black in light mode; pure pitch black (`#000000`) in dark mode. |

### Signal Accents

| Name | Light Hex | Dark Hex | Token | Role |
|------|-----------|----------|-------|------|
| Highlighter Yellow | `#ffd43b` | `#ffd43b` | `--yellow` | Primary user intent, main CTA buttons, active desktop navigation tabs, sheet headers, and focus glows. |
| Yellow Soft | `#ffe58a` | `#66531a` | `--yellow-soft` | Due soon chips, warning notices, and active category highlights. |
| Electric Blue | `#3d5afe` | `#7d92ff` | `--blue` | Secondary action buttons, focus session timers, active links, and info notices. |
| Blue Soft | `#c3ceff` | `#2c3767` | `--blue-soft` | Tinted background for focus stats and info notification badges. |
| Mint Green | `#1fae67` | `#46cd88` | `--green` | Task completion indicators, success notices, save confirm actions, and positive momentum markers. |
| Green Soft | `#b4ecc9` | `#1d4432` | `--green-soft` | Completed status chips, streak celebration backgrounds, and success alerts. |
| Coral Red | `#ff5d47` | `#ff7a68` | `--red` | Danger actions, overdue chips, error alerts, and high/critical priority left-border stripes (7px). |
| Red Soft | `#ffc4ba` | `#66322a` | `--red-soft` | Overdue task badges, error alert backgrounds, and destructive prompt highlights. |
| Arcane Violet | `#8f6bf5` | `#ab8dff` | `--violet` | Gamification layer, XP counters, level badges, and RPG quest metadata. |
| Violet Soft | `#ded1ff` | `#3d3370` | `--violet-soft` | XP chip backgrounds, attribute badges, and quest reward highlights. |
| Text On Signal | `#191712` | `#191712` | `--on-signal` | **Fixed dark ink** used unconditionally for text and icons sitting on yellow or signal fills in both themes. |
| Text On Accent | `#ffffff` | `#10121a` | `--on-accent` | High-contrast text on blue action buttons and high-contrast fills. |
| Warning Amber | `#e8a013` | `#f0b429` | `--warn` | Warning icons, sync offline warning state, and alert titles. |
| Danger Fire | `#e03e2b` | `#ff6a57` | `--danger` | High-severity error icons, delete confirmation buttons, and critical alerts. |

---

## Tokens — Typography

### Geist Variable
Sole type family across the entire application — headings, body, metadata, navigation, buttons, and tabular counters.
- **Font Family:** `"Geist Variable", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` (`--font-sans`)
- **Substitute:** `Space Grotesk`, `Inter Tight`, or `DM Sans`
- **Weights:**
  - `500` Medium (`--fw-medium`) — Body paragraphs, descriptions, input values
  - `650` Semibold (`--fw-semibold`) — Buttons, chip labels, subtask items, table headers
  - `800` Bold (`--fw-bold`) — Page titles, card headlines, section banners, metric readouts
- **OpenType features:** `"tnum" on` (tabular numbers for all dates, timers, percentages, and counters)
- **Tracking:**
  - Eyebrows & micro-labels: `0.09em` (`--tracking-eyebrow`), uppercase
  - Headings: `-0.01em` to `-0.03em` for tight, confident editorial authority

### Type Scale

| Role | Size | Line Height | Letter Spacing | Weight | Token |
|------|------|-------------|----------------|--------|-------|
| Eyebrow / Label | `0.76rem` (12px) | `1.15rem` | `+0.09em` (caps) | 800 Bold | `--text-label` |
| Small / Caption | `0.84rem` (13.5px) | `1.30rem` | `-0.005em` | 500 / 650 | `--text-sm` |
| Body | `0.90rem` (14.5px) | `1.45rem` | `normal` | 500 Medium | `--text-body` |
| Card Title | `0.95rem` (15px) | `1.35rem` | `-0.01em` | 800 Bold | `--text-card` |
| Section Title | `1.05rem` (17px) | `1.40rem` | `-0.01em` | 800 Bold | `--text-section` |
| View Title (H3) | `1.25rem` (20px) | `1.60rem` | `-0.015em` | 800 Bold | `--text-title` |
| Page Heading (H2) | `1.55rem` (25px) | `1.90rem` | `-0.02em` | 800 Bold | `--text-page` |
| Display Hero (H1) | `clamp(2rem, 3.2vw, 2.75rem)` | `1.08` | `-0.03em` | 800 Bold | `--text-display` |

---

## Tokens — Spacing & Shapes

**Base unit:** 4px / 8px grid (`0.25rem` scale)  
**Density:** High-efficiency student workspace (tight scannable task lists, generous section gutters)

### Spacing Scale

| Token | Rem | Px | Usage |
|-------|-----|----|-------|
| `--space-1` | `0.25rem` | 4px | Micro gaps, badge inner padding, border offsets |
| `--space-2` | `0.50rem` | 8px | Button gaps, chip horizontal padding, icon spacing |
| `--space-3` | `0.75rem` | 12px | Compact item padding, list item gaps |
| `--space-4` | `1.00rem` | 16px | Standard card internal padding (mobile), form field gaps |
| `--space-5` | `1.25rem` | 20px | Standard card internal padding (desktop), modal padding |
| `--space-6` | `1.50rem` | 24px | Section header bottom spacing, panel gutters |
| `--space-8` | `2.00rem` | 32px | Major component vertical separation |
| `--space-10`| `2.50rem` | 40px | View header to content separation |

### Border Radius

| Element | Value | Token | Notes |
|---------|-------|-------|-------|
| Cards & Panels | `14px` | `--radius-card` | Signature Throughline card silhouette |
| Buttons & Inputs | `10px` | `--radius-control` | Tactile, punchy controls |
| Chips & Badges | `999px` | `--radius-chip` | Pill shape for filter tags, status chips, and sync pills |
| Project Indicators | `3px` | N/A | Square dot with tiny radius for course identifiers |
| Sheet (Mobile Top) | `18px 18px 0 0` | N/A | Rounded top sheet on viewports `< 640px` |

### Layout Dimensions

- **Container Max-Width:** `1280px` (`--container-max`)
- **Control Height:** `44px` (`--control-h`) — guarantees accessible touch targets on all platforms
- **Side Rail / Column Width:** `232px` (`--rail-w`)
- **Kanban Column Min-Width:** `280px`
- **Background Dot Grid:** `26px 26px` radial dot pattern (`var(--line-soft) 1px, transparent 1px`)

---

## Elevation & Motion

Throughline rejects artificial drop shadows, blurred glows, and glassmorphism. Depth is created through **physical displacement**, **solid 2px ink borders**, and **hard offset shadows**.

### Shadow Ladder

| Level | Token | CSS Rule | Displacement | Usage |
|-------|-------|----------|--------------|-------|
| 0 | `--shadow-0` | `2px 2px 0 0 var(--shadow-ink)` | 2px | Small buttons (`.btn-sm`), filter chips, inline badges |
| 1 | `--shadow-1` | `3px 3px 0 0 var(--shadow-ink)` | 3px | Standard cards (`.ik-card`), regular buttons (`.btn`), inputs on focus |
| 2 | `--shadow-2` | `5px 5px 0 0 var(--shadow-ink)` | 5px | Hover states of buttons and lifted cards |
| 3 | `--shadow-3` | `8px 8px 0 0 var(--shadow-ink)` | 8px | Modal dialogs, slide-up sheets (`.sheet`), command palette |

### Tactile Press Physics
Interactive surfaces behave like physical punch cards or mechanical keys:
- **Resting:** Element sits at `translate(0, 0)` with `--shadow-1` (`3px 3px`).
- **Hover:** Element lifts up and left `translate(-2px, -2px)` with expanded `--shadow-2` (`5px 5px`).
- **Active / Pressed:** Element sinks down and right `translate(2px, 2px)` while the shadow completely collapses (`box-shadow: none`).
- **Transitions:** Snappy and tactile — `120ms ease` (`--dur-fast`). Entrances use `160ms` (`--dur-enter`).
- **Reduced Motion:** If `prefers-reduced-motion: reduce` is detected, animations and transitions collapse to `0.01ms` while preserving instant state changes.

### Layering (Z-Index Ladder)

```css
--z-drag: 5;
--z-lifted-card: 20;
--z-celebrate: 30;
--z-nav: 50;
--z-dock: 60;
--z-fab: 70;
--z-popover: 80;
--z-banner: 90;
--z-focus-shell: 95;
--z-overlay-sheet: 100;
--z-overlay-modal: 110;
--z-overlay-palette: 120;
--z-overlay-onboarding: 150;
--z-skip-link: 400;
```

---

## Components

### 1. Primary Action Button (`.btn.btn-primary`)
**Role:** Main execution trigger (e.g., "Add Task", "Save Changes").  
- **Background:** `var(--ink)` (near-black in light mode, bone in dark mode)
- **Text:** `var(--paper)` (high-contrast paper fill)
- **Border:** `2px solid var(--line)`
- **Radius:** `10px` (`--radius-control`)
- **Padding:** `0 1.1rem` (height `44px`)
- **Typography:** Geist Variable 650 Semibold, `--text-body`
- **Shadow:** `3px 3px 0 0 var(--shadow-ink)`
- **Physics:** Hover lifts to `translate(-2px, -2px)` with `5px 5px` shadow; active sinks to `translate(2px, 2px)` with zero shadow.

### 2. Signal Accent Button (`.btn.btn-accent`)
**Role:** High-visibility hero actions (e.g., "Start Focus", "Quick Capture").  
- **Background:** `var(--yellow)` (`#ffd43b`)
- **Text:** `var(--on-signal)` (`#191712` unconditionally)
- **Border:** `2px solid var(--line)`
- **Radius:** `10px`
- **Shadow:** `3px 3px 0 0 var(--shadow-ink)`
- **Physics:** Same snappy lift-and-sink press physics.

### 3. Electric Blue Action Button (`.btn.btn-blue`)
**Role:** Secondary focus mode trigger or link conversion.  
- **Background:** `var(--blue)` (`#3d5afe` light / `#7d92ff` dark)
- **Text:** `var(--on-accent)` (`#ffffff` light / `#10121a` dark)
- **Border:** `2px solid var(--line)`

### 4. Danger Action Button (`.btn.btn-danger`)
**Role:** Destructive confirmation actions (e.g., "Delete Quest", "Wipe Local Data").  
- **Background:** `var(--red)` (`#ff5d47`)
- **Text:** `var(--ink)` (dark ink in light mode, `#191712` on signal in dark mode)
- **Border:** `2px solid var(--line)`

### 5. Quiet / Surface Button (`.btn`)
**Role:** Standard utility actions, view switches, and cancel buttons.  
- **Background:** `var(--card)` (`#faf8f1` / `#1e212b`)
- **Text:** `var(--ink)`
- **Border:** `2px solid var(--line)`
- **Shadow:** `3px 3px 0 0 var(--shadow-ink)`

### 6. Ghost Button (`.btn-ghost`)
**Role:** Low-emphasis actions inside headers or dense toolbars.  
- **Background:** Transparent; border transparent at rest.
- **Hover:** Borders appear in `2px solid var(--line)` with `var(--card)` background and `--shadow-0`.

### 7. Icon Button (`.btn-icon`)
**Role:** Compact action triggers (e.g., close modal, calendar step, menu toggle).  
- **Dimensions:** `38px × 38px` (or `34px × 34px` for `.btn-sm`)
- **Alignment:** Grid place-items center with bold Phosphor icon (`16px`).

### 8. Task / Quest Card (`.task-card`)
**Role:** Central atomic entity representing tasks, assignments, and study quests.  
- **Surface:** `var(--card)` background with `2px solid var(--line)` border and `14px` radius.
- **Shadow:** `--shadow-1` (`3px 3px 0 0 var(--shadow-ink)`).
- **Completion Checkbox (`.complete-button`):** `34px × 34px` button on the top-right. Unchecked = white/card fill with 2px border; checked = fills with green/ink with bold white checkmark. One-click instant completion.
- **Priority Indicator:** High and critical priority tasks display a **solid 7px left border stripe** in Coral Red (`border-left: 7px solid var(--red)`).
- **Title (`.task-card-title`):** Geist Variable 800 Bold, `--text-card`. Hovering the title highlights it with a 3px yellow underline (`text-decoration: underline var(--yellow) 3px`). Touch screens keep a faint line visible.
- **Completed State (`.task-card.is-done`):** Card sinks onto `var(--paper-2)`, shadow collapses to zero, title is struck through with `var(--ink-faint)`, and priority stripe dims to `var(--line-soft)`.
- **Subtask Progress Drawer:** Shows fraction pill (e.g. `2/5`); expanding unveils inline checkboxes with 10px control radius and an auto-focused "Add subtask" input.
- **Completion Celebration:** Completing triggers a short confetti burst of 14 square particles in signal colors + floating `+XP` chip that gently rises and fades without locking the UI.

### 9. Form Field & Inset Inputs (`.input`)
**Role:** High-speed capture of task titles, notes, dates, and search terms.  
- **Background:** `var(--paper-2)` at rest; shifts to `var(--card)` on hover and focus.
- **Border:** `2px solid var(--line)`
- **Radius:** `10px` (`--radius-control`)
- **Height:** `44px` (`--control-h`)
- **Focus State:** 3px solid focus outline in Electric Blue (`outline: 3px solid var(--focus)`), hard offset shadow `--shadow-1`, and an **inner yellow border glow** (`box-shadow: var(--shadow-1), inset 0 0 0 2px var(--yellow)`).
- **Textarea:** Minimum height `96px` with vertical resize enabled and 1.45 line-height.

### 10. Filter & Toggle Chip (`.chip`)
**Role:** Interactive filters for tags, projects, priorities, and view modes.  
- **Shape:** Pill radius `999px` (`--radius-chip`).
- **Border:** `2px solid var(--line)`
- **Resting:** `var(--card)` background with `--shadow-0` (`2px 2px`).
- **Active State (`.chip.active` / `[aria-pressed="true"]`):** Inverts to solid `var(--ink)` background with `var(--paper)` text.
- **Physics:** Micro-lift on hover (`translate(-1px, -1px)`), sink on press (`translate(1px, 1px)`). Minimum 44px height on touch.

### 11. Static State Chip (`.chip-static`)
**Role:** Non-clickable metadata pills (e.g., due dates, course badges).  
- **Border:** `1.5px solid var(--line)`
- **Overdue (`.is-overdue` / `.meta-due-overdue`):** Tinted Coral Red (`var(--red-soft)`).
- **Due Soon (`.is-soon` / `.meta-due-soon`):** Tinted Highlighter Yellow (`var(--yellow-soft)`).
- **Done (`.is-done` / `.meta-due-done`):** Tinted Mint Green (`var(--green-soft)`).
- **Project Dot (`.project-dot`):** `9px × 9px` square indicator with 3px radius and 1.5px ink border, filled with the course's signature color.

### 12. Segmented Control (`.segmented`)
**Role:** Exclusive view switches (e.g., Write vs Preview in Notes, Board vs List).  
- **Track:** `var(--paper-2)` recessed background with `2px solid var(--line)` outer border and 10px radius.
- **Buttons:** Divided by `2px solid var(--line)` vertical rules. Active item fills with `var(--ink)` and `var(--paper)` text.

### 13. Goal Progress Ring (`.goal-ring`)
**Role:** Visual roll-up progress indicator for decomposing large goals into steps.  
- **Geometry:** Conic gradient ring (`thickness ~5–7px`) using `@property --ring-ratio` for smooth GPU transition.
- **Inner Center:** Solid cardstock disc with bold percentage readout (Geist Variable 800 Bold, tabular numerals).
- **Color:** Defaults to `var(--green)` or inherits `--project-color`.

### 14. Slide-Up Sheet & Overlay Dialog (`.sheet`)
**Role:** Mobile-friendly fast capture, task editing, and course settings.  
- **Backdrop:** Flat ink wash `color-mix(in srgb, var(--shadow-ink) 45%, transparent)` with zero blur.
- **Sheet Frame:** `2px solid var(--line)` border, `--shadow-3` (`8px 8px`), bottom-anchored on mobile (`18px 18px 0 0`), centered dialog on desktop (`14px` radius).
- **Signature Sheet Head (`.sheet-head`):** Solid **Highlighter Yellow** (`var(--yellow)`) background with dark ink text (`var(--on-signal)`), 2px bottom border, and uppercase bold eyebrow title (`--text-section`).

### 15. Shell Masthead & Navigation
**Role:** Global navigation, quick capture, search, and sync status.  
- **Brand Mark (`<Mark />`):** Bold yellow tile with a clean geometric glyph: diagonal ink rail (`strokeWidth="3"`) connecting three circular nodes (`M5 17 L19 7`).
- **Global Search:** Inset button with `Ctrl K` / `⌘ K` keyboard badge; triggers command palette.
- **Sync Pill (`.sync-pill`):** Pill-shaped live sync status indicator:
  - Green dot = Up to date
  - Pulsing blue = Syncing…
  - Amber = Offline (saved locally)
  - Red = Error / Paused
- **Desktop Navigation:** Top tab strip with `2px solid var(--line)` borders; active tab fills with signal yellow.
- **Mobile Dock (`.mobile-dock`):** Fixed bottom floating bar with 4 primary views + quick capture FAB.

---

## Do's and Don'ts

### Do
- **Do use solid 2px ink borders (`--line`)** on every interactive component, card, sheet, and input.
- **Do use hard offset shadows (`var(--shadow-1)`, `var(--shadow-2)`)** with zero blur for all elevation.
- **Do use Highlighter Yellow (`#ffd43b`)** strictly for primary user intent, the main view CTA, and focused conversion.
- **Do pair yellow backgrounds unconditionally with `--on-signal` (`#191712`) dark text** in both light and dark themes.
- **Do apply mechanical press physics** (`translate(-2px, -2px)` hover, `translate(2px, 2px)` active with collapsed shadow) to all buttons and actionable cards.
- **Do use tabular numbers (`font-variant-numeric: tabular-nums`)** for all timestamps, due dates, countdowns, and stats.
- **Do represent course/project colors with compact accents** (a 7px left border stripe, a 9px project dot, or a badge border), never as large background washes.
- **Do enforce a minimum 44px control height (`--control-h`)** for touch accessibility.
- **Do keep the initial screen immediately usable** without requiring account creation or network access.

### Don't
- **Don't use CSS blur filters (`backdrop-filter: blur()`, blurred shadows, soft glows).** Depth comes from displacement, not Gaussian blur.
- **Don't use decorative gradients or translucent glass surfaces.** Surfaces must look like physical ink stamped onto cardstock (`#faf8f1` / `#1e212b`).
- **Don't add 3D layers, WebGL meshes, or artificial lighting simulations.** The product's tactile depth is pure neo-brutalist offset shadow physics.
- **Don't introduce unapproved pastel colors.** Stick strictly to the 5 signal accents (Yellow, Blue, Green, Red, Violet) and their defined soft tints.
- **Don't center body paragraphs or headings.** Text is left-aligned with strong editorial conviction.
- **Don't render dead affordances.** If an action or notification center has no backend behavior yet, remove it from the shell until implemented.
- **Don't expose task titles, notes, or course names in unencrypted cloud sync or push payloads.** All synced records must remain end-to-end encrypted ciphertext.

---

## Surfaces

| Level | Name | Light Mode | Dark Mode | Purpose |
|-------|------|------------|-----------|---------|
| 0 | Paper Canvas | `#f1ede3` | `#15171e` | Root page canvas with 26px radial dot-grid texture. |
| 1 | Inset Surface | `#e7e2d4` | `#101218` | Recessed input fields, completed task rows, segmented track wells. |
| 2 | Cardstock | `#faf8f1` | `#1e212b` | Standard cards, modal bodies, sheet panels, resting buttons. |
| 3 | Tinted Card | `#f6f2e9` | `#232633` | Sub-panels, guidance notices, and static badge containers. |
| 4 | Dim Backdrop | `rgba(25, 23, 18, 0.45)` | `rgba(0, 0, 0, 0.65)` | Flat ink wash for sheet and dialog overlays (zero blur). |
| 5 | Signal Yellow | `#ffd43b` | `#ffd43b` | High-priority intent, active desktop tabs, sheet mastheads. |

---

## Imagery & Iconography

- **Icon Family:** Self-hosted Phosphor Icons (`@phosphor-icons/react`). Use `weight="bold"` across all controls, buttons, and navigation items for strong ink-line consistency (1.5px to 2px stroke).
- **Brand Glyph:** Solid vector SVG consisting of a 45-degree ink bar connecting 3 circular nodes, framed in a signal yellow tile.
- **Task Feedback:** Confetti square particles (`14` fragments) in the 4 primary accents rotating and bursting outwards upon task completion, accompanied by a floating `+XP` pill.
- **No Stock Photography or 3D Renders:** Illustrations are restricted to functional diagrams, progress rings, and clean line art.

---

## Agent Prompt Guide

### Quick Color Reference

```
Light Canvas:       #f1ede3
Light Inset:        #e7e2d4
Light Card:         #faf8f1
Light Ink:          #191712
Light Soft Ink:     #57513f
Light Border:       #191712
Light Shadow:       #191712

Dark Canvas:        #15171e
Dark Inset:         #101218
Dark Card:          #1e212b
Dark Ink:           #ece7da
Dark Soft Ink:      #b0ab9c
Dark Border:        #ece7da
Dark Shadow:        #000000

Signal Yellow:      #ffd43b (Text on signal: #191712 always)
Signal Blue:        #3d5afe (Dark: #7d92ff)
Signal Green:       #1fae67 (Dark: #46cd88)
Signal Red:         #ff5d47 (Dark: #ff7a68)
Signal Violet:      #8f6bf5 (Dark: #ab8dff)
```

### Example Component Prompts

1. **Primary Call to Action Button:**
   > "Create an Inkline primary button: background `#ffd43b`, text `#191712`, 2px solid border in `var(--line)`, 10px radius, 44px min-height, padding 0 1.1rem, font-weight 650. Hover lifts by `translate(-2px, -2px)` with `5px 5px 0 0 var(--shadow-ink)` hard shadow; active sinks by `translate(2px, 2px)` with shadow collapsed to zero."

2. **Kanban Quest Card:**
   > "Build an Inkline task card: background `var(--card)`, 2px solid border `var(--line)`, 14px radius, `3px 3px 0 0 var(--shadow-ink)` hard shadow. Title at 15px bold Geist. Top-right has a 34px square complete button with 2px border. If priority is high or critical, add a 7px solid border-left in `#ff5d47`. Bottom metadata row has pill chips for course name and due date. On hover, lift card `translate(-2px, -2px)` with `5px 5px` shadow."

3. **Slide-Up Sheet Dialog:**
   > "Generate an Inkline modal sheet: overlay backdrop is `rgba(25, 23, 18, 0.45)` with no blur. Sheet container has background `var(--card)`, 2px solid border `var(--line)`, `8px 8px 0 0 var(--shadow-ink)` hard shadow, 14px radius (18px top-only on mobile). Sheet header has background `#ffd43b`, text `#191712`, 2px solid bottom border, and uppercase bold title with 0.09em letter spacing."

4. **Input Field with Focus Glow:**
   > "Create an Inkline form input: 44px height, background `var(--paper-2)`, 2px solid border `var(--line)`, 10px radius, padding 0 0.75rem. On focus-visible: 3px solid outline in `var(--focus)`, `3px 3px 0 0 var(--shadow-ink)` box shadow, and an inset 2px border in `#ffd43b`."

5. **Filter Chip Pill:**
   > "Build an Inkline filter chip: 999px pill radius, 2px solid `var(--line)` border, background `var(--card)`, text `var(--ink)`, `2px 2px 0 0 var(--shadow-ink)` shadow. Active state inverts to background `var(--ink)` and text `var(--paper)`. Minimum touch height 44px on mobile."

---

## Similar Brands & Design Inspirations

- **Teenage Engineering** — Hardware-grade tactile precision, high-contrast labels, and physical snap physics.
- **Gumroad** — Neo-brutalist paper aesthetic, heavy ink borders, and flat unblurred offset drop shadows.
- **Figma** — Confident monochromatic workspace accented with focused signal moments and high-density tabular tooling.
- **Retro Computing & Terminals** — Utilitarian, distraction-free productivity with monospace/tabular discipline.

---

## Quick Start

### CSS Custom Properties

```css
:root {
  color-scheme: light;
  --font-sans: "Geist Variable", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  /* Paper & ink */
  --paper: #f1ede3;
  --paper-2: #e7e2d4;
  --card: #faf8f1;
  --card-tinted: #f6f2e9;
  --ink: #191712;
  --ink-soft: #57513f;
  --ink-faint: #8b8570;
  --line: #191712;
  --line-soft: rgba(25, 23, 18, 0.28);
  --shadow-ink: #191712;

  /* Signal palette */
  --yellow: #ffd43b;
  --yellow-soft: #ffe58a;
  --blue: #3d5afe;
  --blue-soft: #c3ceff;
  --red: #ff5d47;
  --red-soft: #ffc4ba;
  --green: #1fae67;
  --green-soft: #b4ecc9;
  --violet: #8f6bf5;
  --violet-soft: #ded1ff;

  /* Text on fills */
  --on-signal: #191712;
  --on-accent: #ffffff;
  --warn: #e8a013;
  --danger: #e03e2b;

  /* Elevation (hard offset ink blocks) */
  --shadow-0: 2px 2px 0 0 var(--shadow-ink);
  --shadow-1: 3px 3px 0 0 var(--shadow-ink);
  --shadow-2: 5px 5px 0 0 var(--shadow-ink);
  --shadow-3: 8px 8px 0 0 var(--shadow-ink);

  /* Motion */
  --dur-fast: 120ms;
  --dur-enter: 160ms;

  /* Shapes */
  --radius-card: 14px;
  --radius-control: 10px;
  --radius-chip: 999px;

  /* Layout */
  --control-h: 44px;
  --container-max: 1280px;
  --rail-w: 232px;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --paper: #15171e;
  --paper-2: #101218;
  --card: #1e212b;
  --card-tinted: #232633;
  --ink: #ece7da;
  --ink-soft: #b0ab9c;
  --ink-faint: #77735f;
  --line: #ece7da;
  --line-soft: rgba(236, 231, 218, 0.32);
  --shadow-ink: #000000;

  --yellow: #ffd43b;
  --yellow-soft: #66531a;
  --blue: #7d92ff;
  --blue-soft: #2c3767;
  --red: #ff7a68;
  --red-soft: #66322a;
  --green: #46cd88;
  --green-soft: #1d4432;
  --violet: #ab8dff;
  --violet-soft: #3d3370;

  --on-accent: #10121a;
  --warn: #f0b429;
  --danger: #ff6a57;
}
```

### Tailwind v4 Configuration

```css
@theme {
  --color-primary: var(--blue);
  --color-on-primary: var(--paper);
  --color-surface: var(--card);
  --color-background: var(--paper);
  --color-on-surface: var(--ink);
  --color-on-surface-variant: var(--ink-soft);
  --color-outline: var(--ink-faint);
  --color-outline-variant: var(--line-soft);

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

  --color-ink: var(--ink);
  --color-ink-soft: var(--ink-soft);
  --color-ink-faint: var(--ink-faint);
  --color-paper: var(--paper);
  --color-paper-2: var(--paper-2);
  --color-card: var(--card);
  --color-card-tinted: var(--card-tinted);
  --color-line: var(--line);
  --color-line-soft: var(--line-soft);
  --color-shadow-ink: var(--shadow-ink);
  --color-on-signal: var(--on-signal);
  --color-on-accent: var(--on-accent);
  --color-warn: var(--warn);
  --color-danger: var(--danger);

  --shadow-0: var(--shadow-0);
  --shadow-1: var(--shadow-1);
  --shadow-2: var(--shadow-2);
  --shadow-3: var(--shadow-3);

  --font-sans: "Geist Variable", system-ui, -apple-system, "Segoe UI", sans-serif;
}
```
