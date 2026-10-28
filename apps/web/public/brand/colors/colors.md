# Throughline Color System (Inkline)

Throughline should feel calm, local-first, and private. The live visual system is **Inkline**: warm paper surfaces, hard ink borders, and unblurred offset shadows — no glass, blur, or translucency.

## Core idea

- Light mode: warm newsprint paper (`#f1ede3`) with near-black ink.
- Dark mode: matte slate (`#15171e`) with bone-white ink and black offset shadows.
- Signal accents: highlighter yellow (primary intent), electric blue (focus), mint green (success), coral red (danger), violet (optional game layer).

## Light mode

| Token | Hex / value | Purpose |
|---|---:|---|
| Background | `#f1ede3` | Paper canvas |
| Background alt | `#e7e2d4` | Inset / recessed paper |
| Surface | `#faf8f1` | Cardstock cards and sheets |
| Surface tint | `#f6f2e9` | Quiet elevated panels |
| Border | `#191712` | 2px ink borders |
| Soft border | `rgba(25, 23, 18, 0.28)` | Dot-grid / subtle dividers |
| Text primary | `#191712` | Headings and body |
| Text secondary | `#57513f` | Descriptions |
| Text muted | `#8b8570` | Metadata / placeholders |
| Yellow | `#ffd43b` | Primary CTA / active tabs |
| Blue | `#3d5afe` | Focus / secondary actions |
| Green | `#1fae67` | Completion / success |
| Red | `#ff5d47` | Danger / overdue |
| Violet | `#8f6bf5` | Game layer only |

## Dark mode

| Token | Hex / value | Purpose |
|---|---:|---|
| Background | `#15171e` | Matte slate canvas |
| Background alt | `#101218` | Inset surfaces |
| Surface | `#1e212b` | Cards and sheets |
| Surface tint | `#232633` | Quiet panels |
| Border | `#ece7da` | Bone ink borders |
| Soft border | `rgba(236, 231, 218, 0.32)` | Subtle dividers |
| Text primary | `#ece7da` | Headings and body |
| Text secondary | `#b0ab9c` | Descriptions |
| Text muted | `#77735f` | Metadata |
| Yellow | `#ffd43b` | Primary CTA |
| Blue | `#7d92ff` | Focus / secondary |
| Green | `#46cd88` | Success |
| Red | `#ff7a68` | Danger |
| Violet | `#ab8dff` | Game layer |

## Elevation

Depth comes from hard offset shadows (`2px/3px/5px/8px`) in `--tl-shadow-ink`, plus press physics — never blur or frosted glass.
