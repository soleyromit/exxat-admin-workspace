---
description: KeyMetrics variant flat — transparent band, brand glow only, OKLCH hairlines
activation: glob
globs: components/**/*key-metrics*,src/styles/globals.css,docs/exxat-ds/kpi*.md
---

<!-- Synced from .agents/rules/exxat-kpi-flat-band.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — KPI flat band (`variant="flat"`)

**Authoritative detail:** **`docs/exxat-ds/kpi-flat-band-pattern.md`**, **`.agents/skills/exxat-kpi-flat-band/SKILL.md`**.

## MUST

1. **`KeyMetrics variant="flat"`** on list hubs / dashboard mix — **no** opaque band surface; section background is **only** `--key-metrics-flat-band-radial` (brand glow).
2. **Cells** — **`bg-transparent`**; hairlines via **`flatMetricsHairlineClass`** (cell **borders**, not `gap-px` grid fill).
3. **Four tiles** — default **4-across** verticals between columns; **2×2** hairlines only when `@container` is narrow (`@[max-width:29.99rem]`). **No** horizontal rule in 4-across layout.
4. **OKLCH** — `--key-metrics-flat-divider`, glow stops via `color-mix(in oklch, var(--brand-color) …)`; divider uses `var(--sidebar-border)` mix. **Do not** hardcode rose/indigo on one product for all themes.
5. **`--key-metrics-flat-band-shadow: none`** on flat band. **≤ 4** tiles — **`exxat-kpi-max-four.md`**.

## MUST NOT

- Stack linear gradients, `bg-background` on cells, or `gap-px` + tinted grid background on flat KPI (reads as a grey/lavender **box**).
- Use **`variant="card"`** for **`ListPageTemplate`** metrics when the strip should sit on the page canvas.
- Reintroduce **`lg:border-l`** on insight column when `variant="flat"` (insight card ring is enough).

## See also

- **`exxat-kpi-max-four.md`**, **`exxat-kpi-trends.md`**, **`exxat-list-page-connected-views.md`**
- **`exxat-primary-nav-secondary-panel.md`** — shell elevation (separate from KPI band)
