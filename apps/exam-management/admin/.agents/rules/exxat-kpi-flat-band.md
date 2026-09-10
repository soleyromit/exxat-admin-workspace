---
description: KeyMetrics hubs use per-metric cards + size sm|md|lg — flat only for grouped strips
activation: glob
globs: components/**/*key-metrics*,src/styles/globals.css,docs/exxat-ds/kpi*.md
---

<!-- Synced from .agents/rules/exxat-kpi-flat-band.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — KPI strip (`KeyMetrics` cards + size)

**Authoritative detail:** **`docs/exxat-ds/kpi-flat-band-pattern.md`**, **`.agents/skills/exxat-kpi/SKILL.md`**.

## MUST

1. **List hubs** — **`KeyMetrics variant="cards" size="sm"`** (one card per metric).
2. **Size scale** — `sm` hubs, `md` default / dashboard, `lg` catalog / hero demos only.
3. **Mini charts** — optional `metric.chart` (`sparkline` | `bars`) on **`sm` / `md` / `lg`** (`cards` and `flat`). **`sm`:** chart on the **right** of the value (~28px). **`md` / `lg`:** chart below.
4. **Alerts** — `alert: "warning" | "danger"` when something is wrong / negative (icon + tint + aria).
5. **Whole-tile click** — `href` / `onClick` on `MetricItem`.
6. **`variant="flat"`** — **grouped KPI strip only** (hairline cells in one band). Same MetricItem features as cards (size, chart, alert, click). Do **not** use flat for default list hubs.
7. **No brand radial glow** — glow tokens stay **`none`**.
8. **≤ 4** tiles — **`exxat-kpi-max-four.md`**.

## MUST NOT

- Use glow under KPI strips or KPI cards.
- Ship hubs as `flat` when `cards` is the product default.
- Embed pie / donut / radar / axes / legends inside KeyMetrics tiles.
- Stack a fifth KPI on the strip.

## See also

- **`exxat-kpi-max-four.md`**, **`exxat-kpi-trends.md`**, **`exxat-list-page-connected-views.md`**
