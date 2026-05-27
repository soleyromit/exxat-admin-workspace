---
name: exxat-kpi-max-four
description: Exxat DS — KPI strip (max four). Use when building KeyMetrics on ListPageTemplate or Data tab key-metrics cards. Enforces four-tile maximum and dashboard persistence rules.
user-invocable: true
---
# Exxat DS — KPI strip (max four)

Use when building **`KeyMetrics`** on **`ListPageTemplate`** or **Data tab** key-metrics cards.

## Read first

- **`docs/kpi-strip-max-four-pattern.md`**
- **`lib/dashboard-layout-merge.ts`** — `KEY_METRICS_KPI_COUNT_MAX`, `clampKeyMetricsKpiCount`
- **`.cursor/rules/exxat-kpi-max-four.mdc`**

## Checklist

1. **`entityKpiMetrics`** returns **at most four** `MetricItem` for those surfaces (or `.slice(0, 4)` after priority sort).
2. **Extra metrics** → `MetricInsight` description, a chart, or another card — not a fifth tile.
3. **Dashboard persistence** — Respect clamped `keyMetricsKpiCount` (1–4); never bump max without design approval.

## Related

- **`docs/kpi-trend-pattern.md`** — deltas and `trendPolarity`.
