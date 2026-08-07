---
description: Charts — use ChartCard from charts-overview only; ask user for variant before building
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-chart-cards.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — ChartCard (charts)

**Authoritative API + examples:** `components/charts-overview.tsx` ·
`.agents/skills/exxat-ds-skill/SKILL.md` (ChartCard section).

## MUST

1. **One chart wrapper** — Import **`ChartCard`** from `@/components/charts-overview` for every chart, graph, or KPI+chart tile. Compose Recharts inside it; do not ship parallel card shells.
2. **Variant gate** — When the task adds or changes chart UI and the brief does **not** name a variant, **stop and ask the user** which `ChartCard` `variant` (+ filter/tab options) to use. Do not silently default to `"normal"`.
3. **Accessibility** — Wrap chart bodies in **`ChartFigure`**; keyboard selection follows **`exxat-dashboard-view-charts.md`**.

## ChartCard variants — present these when asking

| `variant` | When to use |
|-----------|-------------|
| `"normal"` | Single chart; Ask Leo in the header |
| `"tabs"` | Chart view + trend (or custom tab pair) |
| `"selector"` | Dropdown filter (period, program, cohort) above the chart |
| `"metrics-tabs"` | KPI strip whose cells are tab triggers for the chart |
| `"kpi-chart"` | Hero KPI number + mini chart in one card |

**Reference surfaces:** gallery in `charts-overview.tsx`; hub Data tab in `library-dashboard-charts.tsx`.

## MUST NOT

- Add new `*ChartCard*`, `MetricsChartCard`, or **`Card` + `CardHeader` + Recharts** wrappers when `ChartCard` covers the job.
- Hand-roll Ask Leo on chart headers — `ChartCard` owns it for supported variants.
- Fork a second chart engine for dashboards (see **`exxat-dashboard-view-charts.md`**).

## Agent workflow (variant unspecified)

1. Post the variant table (above) with one-line when-to-use per row.
2. Ask which variant fits the job; if `"selector"` or `"metrics-tabs"`, ask for filter/metric options too.
3. Point at the closest demo in `charts-overview.tsx` before writing code.

## See also

- **`exxat-dashboard-view-charts.md`** — Data-tab layout, persistence, keyboard parity
- **`exxat-reuse-before-custom.md`** — ask before new shared primitives
- **`exxat-kpi-max-four.md`** — KPI tile count on dashboard layouts
