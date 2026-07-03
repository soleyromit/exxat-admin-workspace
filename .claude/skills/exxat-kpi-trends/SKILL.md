---
name: exxat-kpi-trends
description: Exxat DS — KPI trend arrows and polarity. > Consolidated skill: prefer [.cursor/skills/exxat-kpi/SKILL.md](../exxat-kpi/SKILL.md) for new work.
---

# Exxat DS — KPI trend arrows and polarity

> **Consolidated skill:** prefer [`.cursor/skills/exxat-kpi/SKILL.md`](../exxat-kpi/SKILL.md) for new work.

Use when adding or reviewing **`KeyMetrics`**, **`lib/mock/*-kpi.ts`** helpers, or **`ChartCard`** **`miniMetrics`** / **`kpi-chart`** trends.

## Authoritative references

- **`apps/web/docs/kpi-trend-pattern.md`** — product table + psychometrics example (PBI).
- **`.cursor/rules/exxat-kpi-trends.mdc`** — binding MUST/MUST NOT.
- **`apps/web/components/key-metrics.tsx`** — `MetricTrendPolarity`, `metricTrendTone`, `metricTrendAriaQualifier`, `MetricCell` rendering.

## Checklist (new or changed KPI)

1. **Delta honest?** `trend` follows the sign of the change vs the comparison period.
2. **Polarity correct?** If “more” is bad → **`trendPolarity: "lower_is_better"`**. If no value judgment → **`"informational"`** (muted tints).
3. **Delta is a count, not prose.** **`delta`** is `"+5"`, `"-3"`, `"+12%"`. Captions like `"left + right"`, `"vs last week"`, `"scheduled for removal"` go in **`description`** (renders **below** the value, muted).
4. **No empty `—` chip.** If there’s no direction *and* no count, leave **`delta: ""`** + **`trend: "neutral"`** — **`KeyMetrics`** hides the chip. Don’t hand-roll a placeholder.
5. **Copy contextual?** Label + value + (delta when present) + description tell users *what* moved, not only *how much*.
6. **Screen readers** — Chip keeps icon + visible delta; `aria-label` reflects favorable / unfavorable wording automatically when polarity is set.
7. **Chart cards** — When using **`ChartCard`** `miniMetrics`, pass **`trendPolarity`** the same way as on **`MetricItem`**.

## Quick examples

| Metric | More is… | `trendPolarity` |
| --- | --- | --- |
| Total placements | Better (capacity) | default / `higher_is_better` |
| Pass rate | Better | `higher_is_better` |
| Open incidents | Worse | `lower_is_better` |
| Low PBI / review flags | Worse | `lower_is_better` |
| Items by type (mix %) | Neutral | `informational` |
