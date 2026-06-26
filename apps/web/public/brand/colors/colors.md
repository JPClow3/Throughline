# Throughline Color System

Throughline should feel calm, local-first, private, and spatial. The palette is light-by-default, with a softer dark mode rather than a harsh black UI.

## Core idea

- Light mode: porcelain, mist, and glass with soft blue/violet/aqua light.
- Dark mode: blue-black glass, muted contrast, and the same thread accents slightly lifted.
- Accent system: the blue-violet-aqua thread is the brand signature.

## Light mode

| Token | Hex / value | Purpose |
|---|---:|---|
| Background | `#F7F8FB` | Main app background |
| Background alt | `#EEF3FA` | Secondary panels / empty states |
| Surface | `#FFFFFF` | Solid cards and sheets |
| Glass surface | `rgba(255,255,255,0.62)` | Liquid glass cards |
| Strong glass | `rgba(255,255,255,0.78)` | Modals, menus, focused panels |
| Surface tint | `#F3F6FF` | Subtle blue card tint |
| Glass border | `rgba(255,255,255,0.74)` | Frosted border highlight |
| Subtle border | `#DDE5F2` | Non-glass dividers |
| Text primary | `#142033` | Main readable text |
| Text secondary | `#667389` | Descriptions |
| Text muted | `#94A0B4` | Metadata / disabled states |
| Accent blue | `#7EA7FF` | Primary actions / focus |
| Accent violet | `#B9A7FF` | Secondary brand accent |
| Accent aqua | `#8FE7DD` | Sync, privacy, completion |
| Accent pink | `#F5B8FF` | Optional aurora highlight |
| Progress | `#76DCCA` | Task/goal progress |
| Warning | `#F3B95F` | Caution |
| Danger | `#FF8A9A` | Destructive actions |

## Dark mode

| Token | Hex / value | Purpose |
|---|---:|---|
| Background | `#0C1220` | Main dark background |
| Background alt | `#111827` | Navigation / secondary areas |
| Surface | `#172033` | Solid cards and sheets |
| Glass surface | `rgba(24,34,54,0.58)` | Liquid glass cards |
| Strong glass | `rgba(31,43,67,0.76)` | Modals, menus, focused panels |
| Surface tint | `#1B2540` | Blue-tinted panels |
| Glass border | `rgba(255,255,255,0.13)` | Frosted border highlight |
| Subtle border | `#2A3650` | Dividers |
| Text primary | `#F6F8FC` | Main readable text |
| Text secondary | `#BAC5D8` | Descriptions |
| Text muted | `#7F8DA5` | Metadata / disabled states |
| Accent blue | `#94B8FF` | Primary actions / focus |
| Accent violet | `#C8B8FF` | Secondary brand accent |
| Accent aqua | `#8FE7DD` | Sync, privacy, completion |
| Accent pink | `#F2B8FF` | Optional aurora highlight |
| Progress | `#8BEAD9` | Task/goal progress |
| Warning | `#FFD38A` | Caution |
| Danger | `#FF9BA8` | Destructive actions |

## Gradients

```css
--tl-gradient-hero: linear-gradient(135deg, #F7F8FB 0%, #EAF0FF 42%, #F3ECFF 72%, #E7FFFA 100%);
--tl-gradient-thread: linear-gradient(135deg, #7EA7FF 0%, #B9A7FF 52%, #8FE7DD 100%);

[data-theme="dark"] {
  --tl-gradient-hero: linear-gradient(135deg, #0C1220 0%, #111B33 44%, #202548 72%, #123747 100%);
  --tl-gradient-thread: linear-gradient(135deg, #94B8FF 0%, #C8B8FF 52%, #8FE7DD 100%);
}
```

## Suggested semantic usage

- Goals: `accentBlue`
- Tasks: `accentViolet`
- Notes: `accentAqua`
- Projects: use customizable colors, but keep saturation low in calm mode
- Sync/private states: `accentAqua`
- Progress rollup: `progress`
- Focus / selected states: blue ring + glass surface
