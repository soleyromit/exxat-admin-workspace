---
name: exxat-kpi
description: >-
  KPI strips and dashboard key-metrics — max four tiles, cards + size sm|md|lg,
  trend polarity, honest deltas. Load when wiring KeyMetrics, *-kpi.ts helpers,
  or chart mini-metrics.
user-invocable: true
---

# Exxat DS — KPI (consolidated)

Replaces separate loads of `exxat-kpi-trends`, `exxat-kpi-max-four`, and `exxat-kpi-flat-band` skills.

## Read first

| Topic | Path |
|-------|------|
| Index | `docs/exxat-ds/INDEX.yaml` → `patterns.kpi-*` |
| Trends | `docs/exxat-ds/kpi-trend-pattern.md` |
| Max four | `docs/exxat-ds/kpi-strip-max-four-pattern.md` |
| Flat band | `docs/exxat-ds/kpi-flat-band-pattern.md` |
| Component | `components/key-metrics.tsx` |

## Rules (scoped — auto-attach on kpi files)

- `.agents/rules/exxat-kpi-trends.md`
- `.agents/rules/exxat-kpi-max-four.md`
- `.agents/rules/exxat-kpi-flat-band.md`

---

## Checklist — new or changed KPI

### Count & layout

1. **≤ 4 tiles** on `ListPageTemplate` metrics strip and Data-tab key-metrics cards.
2. Extra metrics → `MetricInsight`, charts, or another section — not a fifth tile.
3. **Hubs:** `variant="cards"` + **`size="sm"`**. **Grouped strip:** `variant="flat"` (same MetricItem features). **Dashboard tile:** `variant="card"` + `size="md"`.
4. **Mini charts:** `metric.chart` on cards **and** flat. **`sm`:** plot on the **right**. **`md` / `lg`:** larger type + full-bleed chart at the bottom (no bottom padding).
5. **Alerts:** set `alert: "warning" | "danger"` when the KPI needs attention (wrong / negative). Pair with `trendPolarity: "lower_is_better"` when rising is bad. Do not rely on colour alone — icon + aria.
6. **No brand glow** under KeyMetrics — Ask Leo utility glow only on Ask Leo chrome.

### Trends & copy

7. **`trend`** matches signed change vs comparison period.
8. **`trendPolarity`** when up is bad → `lower_is_better`; neutral mix → `informational`.
9. **`delta`** is numeric (`"+5"`, `"-3%"`) — prose goes in **`description`**.
10. No empty `—` chip — leave `delta: ""` + `trend: "neutral"` to hide chip.

### Data wiring

11. Hub KPI helpers read **`tableState.rows`** (filtered like the grid).
12. Dashboard persistence: respect `KEY_METRICS_KPI_COUNT_MAX` / `clampKeyMetricsKpiCount`.

---

## Quick polarity table

| Metric | `trendPolarity` |
|--------|-----------------|
| Pass rate, completions | default / `higher_is_better` |
| Defects, overdue, low PBI flags | `lower_is_better` |
| Mix % / library size | `informational` |

---

## Code pointers

- `lib/mock/*-kpi.ts` — entity helpers
- `lib/dashboard-layout-merge.ts` — max count constant
- `library-client.tsx`, `dashboard-tabs.tsx` — reference usage
