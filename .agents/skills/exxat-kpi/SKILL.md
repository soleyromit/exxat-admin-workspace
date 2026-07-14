---
name: exxat-kpi
description: >-
  KPI strips and dashboard key-metrics — max four tiles, flat band styling,
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
3. **`variant="flat"`** on hub strip; **`variant="card"`** on dashboard key-metrics tile.
4. Flat band: transparent cells, OKLCH glow only, hairline borders — no grey panel wash.

### Trends & copy

5. **`trend`** matches signed change vs comparison period.
6. **`trendPolarity`** when up is bad → `lower_is_better`; neutral mix → `informational`.
7. **`delta`** is numeric (`"+5"`, `"-3%"`) — prose goes in **`description`**.
8. No empty `—` chip — leave `delta: ""` + `trend: "neutral"` to hide chip.

### Data wiring

9. Hub KPI helpers read **`tableState.rows`** (filtered like the grid).
10. Dashboard persistence: respect `KEY_METRICS_KPI_COUNT_MAX` / `clampKeyMetricsKpiCount`.

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
