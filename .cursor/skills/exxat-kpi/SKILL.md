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
| Index | `apps/web/docs/INDEX.yaml` → `patterns.kpi-*` |
| Trends | `apps/web/docs/kpi-trend-pattern.md` |
| Max four | `apps/web/docs/kpi-strip-max-four-pattern.md` |
| Flat band | `apps/web/docs/kpi-flat-band-pattern.md` |
| Component | `apps/web/components/key-metrics.tsx` |

## Rules (scoped — auto-attach on kpi files)

- `.cursor/rules/exxat-kpi-trends.mdc`
- `.cursor/rules/exxat-kpi-max-four.mdc`
- `.cursor/rules/exxat-kpi-flat-band.mdc`

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

## Flat-band deep-dive (grey-box bug fix)

When the flat strip renders as a grey/lavender **panel** behind the metrics, the linear wash and gap fill leaked back in. The fix:

- **`flatBandStyle`** = **only** `var(--key-metrics-flat-band-radial)`; shadow **`none`**.
- **No** `--key-metrics-flat-band-linear` in the component or the hub inline `style`.
- Cells are **`bg-transparent`**; the grid uses **`flatMetricsHairlineClass(count, halfLayout)`** — borders only, **no** `gap-px` fill (the gap fill is what painted the grey box).
- **4 KPIs:** verticals between 1|2|3|4 when wide; 2×2 dividers only below `@[max-width:29.99rem]` container.
- Divider + glow tokens stay **OKLCH** (`--key-metrics-flat-divider`, `color-mix(in oklch, var(--brand-color) …)`).

**MUST NOT**

- Grey/lavender **panel** behind metrics (removed linear wash + gap fill).
- Duplicate KPI **`Card`** wall for the same numbers.
- Mute product suffix to grey in dark (`mutedSuffix` does **not** change `wordmarkColor`).

Flat-band code pointers: `key-metrics.tsx` → `flatMetricsHairlineClass`, `flatBandStyle`; `apps/web/app/globals.css` → `--key-metrics-flat-*`.

---

## Quick polarity table

| Metric | `trendPolarity` |
|--------|-----------------|
| Pass rate, completions | default / `higher_is_better` |
| Defects, overdue, low PBI flags | `lower_is_better` |
| Mix % / library size | `informational` |

---

## Code pointers

- `apps/web/lib/mock/*-kpi.ts` — entity helpers
- `apps/web/lib/dashboard-layout-merge.ts` — max count constant
- `library-client.tsx`, `dashboard-tabs.tsx` — reference usage
