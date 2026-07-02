# Design Principles: Visual DNA

This document serves as the absolute frontend bible for the AI-Developer Copilot visual aesthetic. Every component, view, and interaction built moving forward must strictly adhere to the rules defined here.

## Core Inspiration
- **Apple Vision Pro**: Heavy reliance on glassmorphism, translucency, blurring, and high contrast against a void-like background.
- **Linear**: Pixel-perfect crispness, subtle borders, high legibility, lack of drop shadows in favor of ambient glow and precise lines.
- **High-End Aerospace Control Rooms**: Muted tones, clear structural hierarchy, telemetry-focused typography.

---

## 1. Space & Layout System

We use a strict **8-point grid system**. All padding, margin, height, and width values should be a multiple of 8 (with 4px allowed for micro-adjustments).

- `xs`: 4px (micro-spacing between icon and label)
- `sm`: 8px (tight layout gaps)
- `md`: 16px (standard component padding)
- `lg`: 24px (section margins)
- `xl`: 32px (major layout gaps)
- `2xl`: 48px
- `3xl`: 64px

## 2. Radius System

We use specific border radiuses to communicate interactivity and hierarchy:
- `4px` (`radius-xs`): Checkboxes, small badges, inner technical elements.
- `6px` (`radius-sm`): Input fields, standard buttons.
- `8px` (`radius-md`): Menus, dropdowns, tooltips.
- `12px` (`radius-lg`): Outer cards, glass panels, modals.
- `16px` (`radius-xl`): Massive structural blocks.
- `9999px` (`radius-pill`): Scrollbars, notification dots.

## 3. Shadows vs. Glows

We **do not** use traditional muddy drop shadows. 
- Depth is achieved via **Glass** (`backdrop-filter`) and **Border** contrasts.
- Elevation relies on sharp, high-opacity black shadows (`rgba(0,0,0,0.8)`) for floating modals.
- Highlighting is achieved via **Ambient Glows** (e.g., an Ice Blue subtle radial glow behind an active node).

## 4. Layering (Z-Index)

Z-indexes are completely mechanical:
- `-1`: Backgrounds (Noise, Starfield).
- `0`: Base Canvas (Graph, Main Views).
- `10`: Surface UI (Sidebars, Topbars).
- `100`: Dropdowns, Tooltips, Context Menus.
- `500`: Overlays (Dimming the background).
- `1000`: Modals / Dialogs.
- `9999`: Toasts / Urgent Notifications.

## 5. Motion Philosophy

Motion must be instantaneous, premium, and purposeful.
- **No bouncing, no spring physics, no flashiness.**
- **Fade and Scale**: Elements smoothly appear via opacity and a slight scale-up (`0.96` to `1`).
- **Duration**: `150ms` for micro-interactions (hover), `300ms` for structural layout shifts.
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` to provide a sharp snap out and smooth finish.

## 6. Glassmorphism

Glass is our primary surface layer.
- Must always include a `backdrop-filter: blur(16px) saturate(1.2)`.
- Must always have a subtle semi-transparent background (e.g., `rgba(15,18,24, 0.45)`).
- Must always have a top-border highlight (`rgba(255,255,255, 0.03)`) to simulate light reflection.

## 7. Contrast & Accessibility

While dark and moody, text legibility is paramount.
- **Primary Text**: `White` or `Off-White` (`#F8F9FA`).
- **Secondary Text**: `Silver` (`#8E97A8`).
- **Muted Text**: `Slate/Muted` (`#5C657A`).
- Never put muted text on an elevated surface without checking the WCAG contrast ratio (aim for AA).
- **Focus Rings**: Active interactive elements must render a sharp focus ring when keyboard navigated.

## 8. Color Rules
- **No Neon**: We use soft, muted cyans, ice blues, and auroras. We do not use `#00FF00` or `#FF00FF`.
- **Status Context**: Status colors (Error, Success) are slightly desaturated so they don't scream against the dark void.

---
*No components are defined here. This document serves to explain the variables in `tokens.css`, `typography.css`, `utilities.css`, and `animations.css`.*
