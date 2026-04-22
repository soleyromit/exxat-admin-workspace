# Design System

A design system built on Tailwind CSS v4, OKLCH color tokens, and Radix UI primitives. It is product-agnostic — any app built on this stack can follow these rules.

For product-specific guidelines (navigation, business conventions, page catalog), see [`docs/product/`](../product/README.md).

---

## Principles

1. **Token-first** — Use design tokens (CSS variables → Tailwind utilities) instead of hardcoded values.
2. **Composable** — Build pages by composing shared components; avoid one-off implementations.
3. **Accessible** — WCAG 2.1 AA: 4.5:1 text contrast, 3:1 UI contrast, keyboard navigable, screen-reader friendly.
4. **Theme-aware** — All colors use CSS custom properties; support light/dark and brand-hue variants.

---

## Documentation Map

| Document | What it covers |
|----------|----------------|
| [Tokens](./tokens.md) | Colors, typography, spacing, density, **form field border & height**, layout rail, breakpoints, transitions |
| [IvyPresto Font Styles](./ivypresto-font-styles.md) | All IvyPresto Headline classes with values (font-display, page-title, hero-header, etc.) |
| [Button Styles](./button-styles.md) | Button variants, sizes, and classes with values |
| [Banner Guidelines](./banner-guidelines.md) | Fonts, colors, spacing for banners and promo blocks — use design tokens only |
| [Windows QA](./windows-qa.md) | Validation on Windows 11 @125% scaling |
| [Components](./components.md) | UI primitives — Button, Card, Input, Badge, Tabs, Dialog, etc. |
| [Composites](./composites.md) | Shared building blocks — SectionWithHeader, DataTable, ChartCard, MetricsShowcase, etc. |
| [Patterns](./patterns.md) | Layout, form, responsive, icon patterns |
| [Accessibility](./accessibility.md) | WCAG 2.1 AA: ARIA labels, keyboard nav, tooltips, contrast |
| [High Contrast Style Guidelines](./high-contrast-style-guidelines.md) | **HC-specific** UX: hierarchy, borders-over-fills, charts, dark vs HC, review checklist |
| [High Contrast & WCAG AA](./high-contrast-wcag-aa.md) | Token overrides, `forced-colors`, compliance checklist |

---

## Source of Truth

| Concern | File |
|---------|------|
| Token values | `src/styles/globals.css` (`:root`, `@theme inline`) |
| Theme variants | `src/styles/globals.css` (`.theme-lavender`, `.theme-sage`, `.dark`) |
| UI primitives | `src/components/ui/*.tsx` |
| Shared composites | `src/components/shared/*.tsx` |
| Layout shell | `src/components/layout/*.tsx` |
| Brand assets | `src/components/brand/*.tsx` |

---

## Theme Variants

Applied via class on `<html>`:

| Theme | Class | Brand Hue |
|-------|-------|-----------|
| Rose (default) | — | 343 |
| Lavender | `theme-lavender` | 270 |
| Sage | `theme-sage` | 155 |
| Dark | `.dark` | (same hues, inverted palette) |

---

## Scaling This System

When adding new tokens, components, or patterns:

1. **Tokens** — Add to `globals.css` under `:root`; document in `tokens.md`.
2. **Primitives** — Add to `src/components/ui/`; document in `components.md`.
3. **Composites** — Add to `src/components/shared/`; document in `composites.md`.
4. **Patterns** — If a layout or interaction recurs 3+ times, extract it to a shared component and document in `patterns.md`.
5. **Product rules** — Keep in `docs/product/`, never in design-system docs.
