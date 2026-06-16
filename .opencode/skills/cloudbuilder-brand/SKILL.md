---
name: cloudbuilder-brand
description: CloudBuilder brand guidelines. Use when creating new UI components, pages, or visual assets to ensure brand consistency. Covers colors, typography, spacing, and visual style.
license: MIT
compatibility: opencode
metadata:
  brand: cloudbuilder
---

# CloudBuilder Brand Guidelines

## Brand Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-navy` | #0a1128 | Primary backgrounds, headers, text |
| `brand-navy-dark` | #0D1B2A | Darker variant for depth |
| `brand-lime` | #ccff00 | Accent, active states, highlights |
| `brand-ice-blue` | #E3E2FD | Subtle backgrounds, hover states |
| White | #ffffff | Card backgrounds, surfaces |

## Tailwind Usage
- `accent-lime` does NOT exist in the project's tailwind config
- Always use `brand-lime` for the lime accent color
- Opacity modifiers work: `bg-brand-lime/20`, `ring-brand-lime/40`

## Typography
- **Display**: Space Grotesk (headings, brand text)
- **Body**: Inter (body text, labels, UI)
- **Mono**: SF Mono / Menlo (code, resource types, metrics)

## Shadows
- `card`: `0 4px 20px rgba(10, 17, 40, 0.05)`
- `card-hover`: `0 8px 32px rgba(10, 17, 40, 0.08)`
- `node`: `0 2px 8px rgba(10, 17, 40, 0.06)`
- `node-selected`: `0 0 0 2px #0a1128, 0 4px 20px rgba(10, 17, 40, 0.08)`
- `toolbar`: `0 4px 20px rgba(10, 17, 40, 0.08)`
- `glow`: `0 0 20px rgba(204, 255, 0, 0.25)`

## Backgrounds
- `dot-grid`: `radial-gradient(#e0f2fe 1.5px, transparent 1.5px)` at 32px
- `brand-gradient`: `linear-gradient(135deg, #0a1128 0%, #0D1B2A 100%)`

## Provider Colors
- **AWS**: orange (#FF9900 / #FF6600)
- **Azure**: blue (#0078D4)
- **GCP**: blue (#4285F4)
- **K8s**: indigo (#326CE5)

## Visual Principles
- Clean, minimal, modern (MD3-inspired)
- Rounded corners (12px cards, 8px small elements)
- Subtle shadows for depth
- Lime green used sparingly as accent
- Ice blue for subtle interactive states
