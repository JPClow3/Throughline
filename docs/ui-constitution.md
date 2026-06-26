# UI Constitution: LiquidGlass, Glassmorphism, and Spatial UI

## Principles

- **First Screen Efficiency:** The initial screen is the fully usable application, not a promotional splash.
- **Spatial Canvas Concept:** The UI acts as a spatial layout where depth, clarity, and organic movement dictate hierarchy. Elements sit on floatable planes along the Z-axis, with shadows and light leaks indicating physical presence. The emotional response is one of "focused serenity."
- **Calm, High-Contrast Planner:** Lead with typographic clarity and functional whitespace. Prevent rich materials from becoming overwhelming. Gamification and RPG trackers are visually clean and easily toggled.
- **Glassmorphic Legibility:** Visual depth must never compromise accessibility. Text colors maintain high contrast (Neutral 900/800) to ensure readability through translucent layers.

## Theme, Light & Colour

- **Active Themes:** Light mode execution leverages ambient "light leaks." The background is a dynamic mesh of Lavender, Mint, and Soft Blue, creating a sense of deep, illuminated space.
- **Palette:**
  - **Primary:** Refined Indigo, used sparingly for high-intent actions and active states.
  - **Surface:** Semi-translucent whites and neutrals acting as the "glass" substrate.
  - **Accents:** Secondary (Mint) and Tertiary (Blue) reserved for semantic feedback and subtle data visualization.
  - **Refraction:** Pure White (#FFFFFF) at 20% opacity is used exclusively for "inner-glow" borders to simulate light catching on the edges of glass.
- **Theming:** Themes switch using `:root[data-theme="light" | "dark"]` variables in [styles.css](file:///c:/Code/Personal/To-Do-App/apps/web/src/styles.css).

## Glassmorphism & Elevation Z-Axis

Depth is the primary navigator in the design system, utilizing a multi-layered Z-axis approach:

1. **Level 0 (Background):** The ambient mesh gradient.
2. **Level 1 (Substrate):** Main content panels (e.g. Workspace columns, Task Boards). 40px Backdrop Blur, 60% opacity white fill, 1px White/20 border. Low-offset ambient shadow (`0px 4px 20px rgba(0,0,0,0.05)`).
3. **Level 2 (Interactive):** Hovered states, dropdowns, and cards. 60px Backdrop Blur, 80% opacity white fill. Pronounced shadow (`0px 12px 40px rgba(0,0,0,0.12)`).
4. **Level 3 (Modals/Overlays):** The highest elevation (Quick-add sheets, Dialogs). 80px Backdrop Blur. Deepest shadow (`0px 24px 64px rgba(0,0,0,0.18)`).

**Refracting borders are essential:** Every glass element must have a 1px solid border at 20% white to define its edges against the mesh background. Avoid inner borders; use subtle tonal shifts in the background glass to separate sections within a card.

## Shapes

The shape language is "Soft-Geometric." 
- Base components: `0.5rem (8px)` corner radius.
- Primary layout containers: Scale up to `1.5rem (24px)`.
- This creates a nested "squircle" effect that feels modern while maintaining the structural integrity of the Geist typeface.

## Typography & Hierarchy

- **Font Family:** Self-hosted **Geist Variable** (offline-first) for its technical precision and clean architecture.
- **Typographic Scale:** Weights are intentionally reduced (300 for display and body-large) emphasizing the "lightness" of the interface. Headlines use tighter tracking; labels use slightly increased tracking for legibility.
- **Data Styling:** Tabular numerals (`tabular-nums`) are required for statistics, quest levels, dates, and progress rings.
- **Visual Weight:** Differentiate details using size, weight, and subtle ink tones rather than horizontal line dividers.

## Responsive & Layout Consistency

The layout follows a **Fixed Grid** philosophy for desktop, centered within a 1440px max-width container. The system utilizes an 8pt spatial system to drive padding and margins.

- **Desktop Layout:** 12-column grid with 24px gutters and 64px side margins. Sidebar navigation acts as a "Spatial Dock."
- **Mobile/Tablet Layout:** Bottom navigation spatial dock floating at the footer, single-column settings, and bottom-sheet composers.
- **Whitespace:** Emphasize "Functional Whitespace" with larger-than-standard gaps between major glass modules (48px+) to allow the ambient background mesh to "breathe."
- **Glass Modules:** Content is grouped into floating glass panels. Each panel must have consistent internal padding of 24px to ensure content does not touch the refracting borders.
