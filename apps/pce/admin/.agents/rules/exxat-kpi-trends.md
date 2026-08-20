---
description: Exxat DS — KPI deltas and trend arrows must be contextual; use trendPolarity when “up” is not good news.
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-kpi-trends.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — KPI trends (`KeyMetrics` + chart mini-metrics)

## MUST

1. **`trend` matches reality** — `up` / `down` / `neutral` reflects the **signed change** in the metric; arrows are not “spin for optimism”.
2. **Set `trendPolarity` on `MetricItem`** when an increase is **not** favorable:
   - **`lower_is_better`** — defect / error / overdue / **low PBI or quality-flag counts**, cost or time when the product goal is to **reduce**.
   - **`informational`** — volume or mix where **direction is not** inherently good or bad (library size, % split between categories); tints stay **muted**, arrows still show direction.
3. **Default** — Omitting `trendPolarity` means **`higher_is_better`** (legacy): up = positive tint, down = negative tint.
4. **`delta` is a count, `description` is a caption.** **`delta`** (next to the arrow) is a **numeric change** like `"+5"`, `"-3"`, `"+12%"`. Contextual prose like `"left + right"`, `"vs last week"`, `"across 4 sites"` goes in **`MetricItem.description`** which renders **below** the value row (muted, small). **MUST NOT** stuff prose into **`delta`**.
5. **Hide the trend chip when there is nothing to say.** If **`trend === "neutral"`** **and** **`delta`** is empty (`""` / `0` / unset), `KeyMetrics` suppresses the chip entirely — no `—` placeholder. Use **`description`** for the supporting caption instead. Only show the chip when the metric has a real direction (`up` / `down`) or a real count to surface.
6. **Contextual copy** — `label` + `value` + (`delta` when present) + period header should read as one sentence; avoid orphan deltas.
7. **Accessibility** — Do not rely on colour alone; keep delta text + icon; chip `aria-label` comes from **`metricTrendAriaQualifier`** in **`components/key-metrics.tsx`**.

## MUST NOT

- Paint an **up** arrow with the “good” tint when the metric is **worse** when it goes up (unless **`trendPolarity: "lower_is_better"`** is set so “up” correctly tints **destructive**).
- Use **`ResizeObserver`** or JS layout measurement **only** to pick trend colours — polarity is a **product** decision, not a layout one.
- Render an **empty `—`** trend chip just to keep the layout symmetric. If a metric has no comparison this period, leave **`delta`** empty and let **`KeyMetrics`** hide the chip.
- Put words like **"left + right"**, **"hidden"**, **"shown"**, **"vs last week"** in **`delta`** — they are not deltas. Put them in **`description`**.

## See also

- **`docs/kpi-trend-pattern.md`** (app) — narrative + table of examples.
- **`.agents/skills/exxat-kpi-trends/SKILL.md`** — checklist for new hubs.
- **`components/key-metrics.tsx`** — `MetricTrendPolarity`, `metricTrendTone`, `metricTrendAriaQualifier`.
