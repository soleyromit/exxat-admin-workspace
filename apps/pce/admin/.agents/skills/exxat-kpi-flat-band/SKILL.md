---
name: exxat-kpi-flat-band
description: KeyMetrics variant flat — transparent KPI strip, OKLCH brand glow only, cell-border hairlines (no grid surface). Use when wiring ListPageTemplate metrics, dashboard mix KPIs, or fixing flat band looking like a grey box.
user-invocable: true
---

# Exxat DS — KPI flat band

> **Consolidated skill:** prefer [`.agents/skills/exxat-kpi/SKILL.md`](../exxat-kpi/SKILL.md) for new work.

**Rule:** `.agents/rules/exxat-kpi-flat-band.md`  
**Doc:** `docs/exxat-ds/kpi-flat-band-pattern.md`

## Checklist

- [ ] `variant="flat"` on hub / mix view — not `card` for list-page strip.
- [ ] `flatBandStyle` = **only** `var(--key-metrics-flat-band-radial)`; shadow **`none`**.
- [ ] No `--key-metrics-flat-band-linear` in component or hub inline `style`.
- [ ] Cells **`bg-transparent`**; grid uses **`flatMetricsHairlineClass(count, halfLayout)`** — borders only, **no** `gap-px` fill.
- [ ] **4 KPIs:** verticals between 1|2|3|4 when wide; 2×2 dividers only below `@[max-width:29.99rem]` container.
- [ ] Divider + glow tokens stay **OKLCH** (`--key-metrics-flat-divider`, `color-mix(in oklch, var(--brand-color) …)`).
- [ ] **≤ 4** `MetricItem` — `docs/kpi-strip-max-four-pattern.md`.
- [ ] KPI helpers use **`tableState.rows`** on connected hubs.

## MUST NOT

- Grey/lavender **panel** behind metrics (removed linear wash + gap fill).
- Duplicate KPI **`Card`** wall for same numbers.
- Mute product suffix to grey in dark (`mutedSuffix` does **not** change `wordmarkColor`).

## Code pointers

- `components/key-metrics.tsx` — `flatMetricsHairlineClass`, `flatBandStyle`
- `src/globals.css` — `--key-metrics-flat-*`
- `library-client.tsx`, `dashboard-tabs.tsx` — reference usage

## Pair with

- `exxat-kpi-max-four`, `exxat-kpi-trends`, `exxat-list-page-connected-views`
- `docs/shell-surface-elevation-pattern.md` — sidebar vs page (not the KPI band)
