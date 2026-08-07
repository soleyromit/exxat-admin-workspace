# KPI strip — maximum four tiles

> **Code:** `lib/dashboard-layout-merge.ts` — **`KEY_METRICS_KPI_COUNT_MIN`**, **`KEY_METRICS_KPI_COUNT_MAX`** (4), **`clampKeyMetricsKpiCount`**. **Component:** `KeyMetrics` in `components/key-metrics.tsx`.

## Rule

On **primary list hubs** (`ListPageTemplate` metrics slot) and on **dashboard “key metrics” cards** (Data tab chart bundles), **show at most four** `MetricItem` tiles at once.

## Why four

- **Scanning** — More than four headline numbers compete; users miss deltas and period context.
- **Layout** — `KeyMetrics` wraps to multiple rows; four keeps one or two clean rows on common breakpoints (including **`metricsHalfWidthLayout`** on span-1 cards).
- **Persistence** — Dashboard layout already stores **`keyMetricsKpiCount`** in **`1…4`**; list-page KPI helpers should **not** return a fifth tile expecting it to display.

## Implementation

1. **KPI builders** (`lib/mock/*-kpi.ts`) — Return **≤ 4** items, or **`.slice(0, 4)`** after prioritizing (hero total + top three drivers). Merge extras into **`MetricInsight`** copy instead of a fifth tile when possible.
2. **Dashboard canvas** — Never raise **`KEY_METRICS_KPI_COUNT_MAX`**; use **`clampKeyMetricsKpiCount`** when reading saved JSON.
3. **Full-page dashboards** — If more summaries are needed, add **sections** (charts, tables, secondary cards), not a fifth KPI in the same strip.

## MUST NOT

- Ship **five+** `MetricItem` entries in a single **`KeyMetrics`** band meant as the **primary** KPI row for a hub or the **key-metrics** dashboard card.
- Duplicate the same metric as two tiles to pad count — prefer **insight rail** or **`MetricInsight`**.

## See also

- **`docs/kpi-trend-pattern.md`** — deltas, arrows, **`trendPolarity`**.
- **`docs/kpi-flat-band-pattern.md`** — **`variant="flat"`** presentation (orthogonal to tile count).
- **`.cursor/rules/exxat-kpi-max-four.mdc`**, **`.cursor/skills/exxat-kpi-max-four/SKILL.md`**
