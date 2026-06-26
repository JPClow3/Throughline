---
name: Throughline
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#464554'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#0058be'
  on-tertiary: '#ffffff'
  tertiary-container: '#2170e4'
  on-tertiary-container: '#fefcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '300'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '300'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 64px
  padding-glass: 24px
---

## Brand & Style
The design system embodies a "LiquidGlass" aesthetic—a sophisticated evolution of spatial UI that prioritizes depth, clarity, and organic movement. The target audience includes high-performance professionals and creative technologists who value a workspace that feels both infinite and focused.

The style merges **Glassmorphism** with **Minimalism**, utilizing heavy backdrop blurs and light-refracting surfaces to create a sense of physical presence. The emotional response is one of "focused serenity"—the UI should feel like a high-end physical tool crafted from crystal and light, using functional whitespace to prevent the rich materials from becoming overwhelming.

## Colors
The palette is centered on a light mode execution that leverages ambient "light leaks." The background is not a flat color but a dynamic mesh of Lavender, Mint, and Soft Blue, creating a sense of deep, illuminated space.

- **Primary:** A refined Indigo used sparingly for high-intent actions and active states.
- **Surface:** Semi-translucent whites and neutrals that act as the "glass" substrate.
- **Accents:** Secondary (Mint) and Tertiary (Blue) are reserved for semantic feedback and subtle data visualization.
- **Refraction:** A pure White (#FFFFFF) at 20% opacity is used exclusively for "inner-glow" borders to simulate light catching on the edges of glass.

## Typography
This design system utilizes **Geist** for its technical precision and clean, geometric architecture. To maintain a minimalist feel, font weights are intentionally reduced (300 for display and body-large), emphasizing the "lightness" of the interface.

Type should be treated as an architectural element. Headlines use tighter tracking to feel cohesive, while labels use slightly increased tracking for legibility against glass backgrounds. Text color should maintain high contrast (Neutral 900/800) to ensure readability through translucent layers.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for desktop, centered within a 1440px max-width container to maintain focus. We utilize an 8pt spatial system to drive all padding and margin decisions.

- **Desktop:** 12-column grid with 24px gutters and 64px side margins. 
- **Whitespace:** Emphasize "Functional Whitespace"—larger-than-standard gaps between major glass modules (48px+) to allow the ambient background mesh to "breathe" through the layout.
- **Glass Modules:** Content is grouped into floating glass panels. Each panel should have a consistent internal padding of 24px to ensure content does not touch the refracting borders.

## Elevation & Depth
Depth is the primary navigator in the design system. We use a multi-layered Z-axis approach:

1.  **Level 0 (Background):** The ambient mesh gradient.
2.  **Level 1 (Substrate):** Main content panels. 40px Backdrop Blur, 60% opacity white fill, 1px White/20 border. Low-offset ambient shadow (0px 4px 20px rgba(0,0,0,0.05)).
3.  **Level 2 (Interactive):** Hovered states, dropdowns, and cards. 60px Backdrop Blur, 80% opacity white fill. Pronounced shadow (0px 12px 40px rgba(0,0,0,0.12)).
4.  **Level 3 (Modals/Overlays):** The highest elevation. 80px Backdrop Blur. Deepest shadow (0px 24px 64px rgba(0,0,0,0.18)).

Refracting borders are essential; every glass element must have a 1px solid border at 20% white to define its edges against the mesh background.

## Shapes
The shape language is "Soft-Geometric." We use a standard 0.5rem (8px) corner radius for base components, scaling up to 1.5rem (24px) for primary layout containers. This creates a nested "squircle" effect that feels modern and approachable while maintaining the structural integrity of the Geist typeface.

## Components
### Buttons
Primary buttons use a high-saturation Indigo fill with white text. Secondary buttons are glass-based with a 1px refraction border.
- **Interaction:** On hover, buttons scale to 1.015x and increase shadow spread. On click, they compress to 0.98x.

### Cards & Modules
All cards must use the `Level 1` or `Level 2` elevation rules. Content should be strictly aligned to the internal 24px padding. Avoid inner borders; use subtle tonal shifts in the background glass to separate sections within a card.

### Input Fields
Inputs are semi-translucent (white at 10% opacity) with a 1px border. When focused, the border opacity increases to 60%, and the backdrop blur intensifies.

### Navigation (Spatial Dock)
The primary navigation should be treated as a "Dock"—a high-blur glass element floating at the bottom or side of the screen, utilizing the 1.015x hover scale for individual icons.

### Lists & Selectors
List items should have a transparent background by default, turning into a "frosted" layer (white at 20% opacity) on hover, following the standard scale transitions.
