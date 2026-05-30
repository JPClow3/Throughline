# UI Constitution

## Principles

- First screen is the usable app, not a marketing page.
- The UI should feel like a calm, spacious, Apple-inspired planner. Lead with clarity and whitespace; RPG progress is optional and tucked away.
- Visual richness must never slow task capture, task scanning, or board movement.

## Theme & Colour

- Light is the default theme; a softer (less saturated) dark mode is available. Both are token sets switched by `:root[data-theme="light" | "dark"]` in `apps/web/src/styles.css`.
- Everything reads from semantic CSS custom-property tokens (`--ink`, `--glass-bg`, `--accent`, radii, type scale). Theme is a value swap, not new CSS.
- The palette is **near-monochrome**: chrome (nav, icons, eyebrows, rings, bars) is ink/graphite; the single accent is ink itself, used only for primary actions (dark buttons in light mode, light buttons in dark mode). Chroma comes only from content (project colours) and the functional mint/amber/coral signals (success / due-soon / overdue).
- The backdrop is a **solid** app colour — no 3D scene, no decorative gradient blobs. Hierarchy comes from type, space, and layering, not loud colour.

## LiquidGlass Rules

- Use translucent layers, hairline borders, a soft top highlight, and restrained blur for elevation.
- Add opaque backing whenever glass weakens text contrast. Keep body and label text at WCAG AA in both themes.
- Radii follow tokens: cards `--radius-card` (16px), controls `--radius-control` (10px), chips `--radius-chip` (8px), pills/rings circular.
- Interactive controls (inputs, selects, primary/secondary buttons, details toggle) share one height via `--control-h` so rows align.

## Typography & Hierarchy

- The typeface is **Geist** (variable), self-hosted via `@fontsource-variable/geist` so it works offline; system fonts are the fallback. One family throughout.
- Use the shared modular scale tokens (display, title, heading, body, subhead, footnote) and the tracking tokens: tighten large sizes (display/title use negative tracking), letter-space uppercase eyebrows.
- Use `tabular-nums` for stats, counts, dates, and the goal ring.
- Carry hierarchy with size + weight + ink/muted/faint colour, not boxes or dividers.

## Icons & Vector

- Icons come from **Phosphor** (`@phosphor-icons/react`) — rounded style, weight set globally via `IconContext`. Do not hand-author inline SVG icons.
- Non-icon vector flourishes should be CSS where practical: the goal progress ring is a CSS `conic-gradient`, not an SVG.

## Surfaces, Depth & Glass

- Depth comes from **layering on a solid base**, not from a backdrop scene. There is no 3D ambience.
- Three layers: solid background < **opaque content surfaces** (`--surface`, hairline border, soft `--shadow-sm`; raise to `--shadow-md` on hover/active) < **floating glass chrome** — the sidebar, the sticky page header (`.view-head`), the mobile bottom bar, and any overlays — which use translucency + `blur` (`--chrome-*`) to read as sitting *on top of* the screen. The sticky header lets content scroll and frost beneath it.
- The frosted blur is reserved for floating chrome and frosts the solid app colour. Content cards stay **opaque and crisp**. Tune via `--surface*`, `--shadow*`, and `--chrome-*` tokens — not per component.

## Layout Consistency

- Every view opens with the same header pattern (`.view-head`): an uppercase eyebrow + a page title at one consistent size, with an optional primary action on the right.
- One type ramp (page / section / card / body / label / eyebrow) and one spacing scale. Do not introduce ad-hoc sizes.

## Layout Rules

- Use spacious, breathable productivity layouts. Empty space is a feature.
- Today is the calm cockpit; Goals hold end goals and their steps; Board is the workbench; Timeline is the agenda; Notes is the cross-linked notebook; Settings is utility (theme, optional game layer, projects/areas).
- Do not place UI cards inside other cards.
- Do not let text overlap, clip, or depend on viewport-scaled font sizes.
- Maintain stable dimensions for fixed controls, boards, and cards.

## Controls

- Use icons for compact controls.
- Add accessible labels or titles to icon-only controls.
- Use selects for status/option sets, sliders for numeric energy/difficulty, and buttons for commands.
- Preserve keyboard focus visibility.

## Responsive Behavior

- Desktop: sidebar navigation, dashboard plus composer side-by-side.
- Tablet/mobile: bottom navigation, composer below dashboard, single-column settings/courses.
- Text must remain readable over the ambient 3D layer.
- Spacious cinematic layouts are preferred, but never at the cost of capture speed or task scanning.
