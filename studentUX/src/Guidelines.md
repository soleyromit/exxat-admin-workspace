# Exxat One Guidelines

> **This file is a pointer.** The full guidelines have been restructured into focused, maintainable documents.

---

## Design System (product-agnostic)

Tokens, components, patterns, and accessibility rules that apply to any app built on this stack.

**Location:** [`docs/design-system/`](../docs/design-system/README.md)

| Document | Covers |
|----------|--------|
| [README](../docs/design-system/README.md) | Principles, file structure, theme variants |
| [Tokens](../docs/design-system/tokens.md) | Colors, typography, spacing, radius, shadows, breakpoints |
| [Components](../docs/design-system/components.md) | UI primitives (Button, Card, Input, Badge, Tabs, etc.) |
| [Composites](../docs/design-system/composites.md) | Shared building blocks (SectionWithHeader, DataTable, ChartCard, etc.) |
| [Patterns](../docs/design-system/patterns.md) | Layout, form, responsive, icon patterns |
| [Accessibility](../docs/design-system/accessibility.md) | WCAG 2.1 AA: ARIA labels, keyboard nav, tooltips, contrast |

**Key rules:**
- Main Key Metrics (`KeyMetricsShowcase`) — full width, no horizontal margins (padding stays).
- Tabs — use `TabsList` with `flex-nowrap w-max`, icon + label on triggers, `m-0` on `TabsContent`.
- Page scroll — list pages: only tab content scrolls; content pages (Reports): `fullPageScroll` so the whole page scrolls.
- Report pages — use `ReportPageTemplate` (no top key metrics); use `PrimaryPageTemplate` for list pages with metrics.
- **Accessibility (WCAG AA):** Icon-only buttons need `aria-label` + `Tooltip`; regions need `role="region"` + `aria-label`; custom tabs need Arrow key support. See [Accessibility](../docs/design-system/accessibility.md).

---

## Product Guidelines

Navigation, business conventions, and page catalog specific to this product.

**Location:** [`docs/product/`](../docs/product/README.md)

| Document | Covers |
|----------|--------|
| [README](../docs/product/README.md) | Overview, page hierarchy |
| [Navigation](../docs/product/navigation.md) | Sidebar structure, sub-items, breadcrumbs, collapsed mode |
| [Conventions](../docs/product/conventions.md) | Date formats, program context, state management, status badges |
| [Page Catalog](../docs/product/page-catalog.md) | Which templates each page uses, page-specific rules |

---

## Cursor Rules

Automated rules that apply when editing matching files:

| Rule | Scope | Location |
|------|-------|----------|
| Design System Components | `src/components/**/*.tsx` | `.cursor/rules/design-system-components.mdc` |
| Design System Pages | `src/components/pages/**/*.tsx` | `.cursor/rules/design-system-pages.mdc` |
| Product Conventions | `src/**/*.tsx`, `src/**/*.ts` | `.cursor/rules/product-conventions.mdc` |
