# KPI trend arrows and deltas (`KeyMetrics`)

> **Handbook:** [`AGENTS.md`](../AGENTS.md) (mock KPI helpers, `KeyMetrics`). **Component:** [`components/key-metrics.tsx`](../components/key-metrics.tsx). **Cursor:** [`.cursor/rules/exxat-kpi-trends.mdc`](../../.cursor/rules/exxat-kpi-trends.mdc). **Skill:** [`.cursor/skills/exxat-kpi-trends/SKILL.md`](../../.cursor/skills/exxat-kpi-trends/SKILL.md).

## Goals

1. **Contextual** — The **label**, **value format** (count, %, currency, days), and **comparison period** (e.g. “vs last week”) must read as one story. Do not paste a generic “+12%” without tying it to what moved.
2. **Honest direction** — **`trend`** (`up` | `down` | `neutral`) always matches the **signed change** in the underlying metric so the **arrow** reflects reality.
3. **Correct sentiment** — **`trendPolarity`** decides whether “up” is **good news** (tint + assistive copy), **bad news**, or **informational** (muted — direction only).

## `MetricItem` fields

| Field | Role |
| --- | --- |
| `value` | Current bucket total or rate (formatted string or number). |
| `delta` | **Count change for the trend chip**, e.g. `+5`, `-3`, `+12%`. Pass `""` (or `0`) when there is no comparison this period — the chip is then **hidden**, not rendered as `—`. **Never** put captions or labels like `"left + right"` here. |
| `description` | Optional **caption** rendered **below** the value + trend row (muted, small). Use for *what* moved or *how* the value breaks down — `"left + right"`, `"vs last week"`, `"across 4 sites"`, `"scheduled for removal"`. |
| `trend` | **Visual direction** of the delta: more → `up`, less → `down`, flat / N/A → `neutral`. Combined with an empty `delta`, `neutral` collapses the chip. |
| `trendPolarity` | Optional. **`higher_is_better`** (default) \| **`lower_is_better`** \| **`informational`**. |

### Layout

```
┌─────────────────────────────────────────────┐
│ Pinned columns                              │  ← label
│ 2  ↑ +1                                     │  ← value + (delta in chip)
│ left + right                                │  ← description (caption)
└─────────────────────────────────────────────┘
```

The **only** thing next to the arrow is the **count**. Prose lives **below** the value as a description. When there is no direction *and* no count, the chip is **suppressed** entirely (no `—` placeholder).

## Polarity cheat sheet

| `trendPolarity` | Use when | Up arrow tint | Down arrow tint |
| --- | --- | --- | --- |
| **`higher_is_better`** (default) | Revenue, pass rate, completions, enrolled count, positive CSAT | Favorable (brand / chart positive token) | Unfavorable (destructive) |
| **`lower_is_better`** | Error rate, overdue tasks, **low PBI / item quality flags**, time-on-task when minimizing, spend when cutting cost | Unfavorable | Favorable |
| **`informational`** | Library size, mix %, neutral volume | Muted | Muted |

**Psychometrics example:** Point-biserial (PBI) **dropping** usually helps discrimination — often good (`lower_is_better` on a *“low quality” count* is clearer: **count of items below a review threshold** rising → `trend: "up"` + `trendPolarity: "lower_is_better"` → arrow up with **unfavorable** tint).

## Accessibility

- **Never colour alone:** `KeyMetrics` keeps **icon + numeric delta**; `aria-label` on the chip uses **`metricTrendAriaQualifier`** (e.g. “increased, unfavorable +1”).
- **Decorative icons** stay `aria-hidden`; meaning lives in the chip’s **`aria-label`** and visible delta text.

## Anti-patterns

- Forcing **`trend: "up"`** green because “up feels good” when the metric is **defects** or **flags** — set **`lower_is_better`** instead.
- Hiding a worsening metric by flipping the arrow without changing **`trend`** — arrows must match the data.
- Using **`informational`** for KPIs that **do** have an agreed quality bar — pick a polarity instead.
- Rendering an **empty `—`** chip just for layout symmetry. The component already hides the chip when there is no direction *and* no count; leave `delta: ""` + `trend: "neutral"` and use `description` for the supporting caption.
- Putting captions like **`"left + right"`**, **`"hidden"`**, **`"shown"`**, **`"vs last week"`** in **`delta`**. Those are not deltas. Use **`description`**.

## Related surfaces

- **`ChartCard`** `miniMetrics` / `kpi-chart` variant — optional **`trendPolarity`** on each mini metric; uses the same **`metricTrendTone`** helper from `key-metrics.tsx`.
