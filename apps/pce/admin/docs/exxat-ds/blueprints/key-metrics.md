# Blueprint: Key metrics (KPI strip + dashboard tiles)

> **Status:** Stable. **Owner:** Design system. **Implements:** SC 1.3.1, 1.4.3, 1.4.11, 2.4.6, 4.1.2.

## 1. Intent

A **key-metrics strip** summarizes a hub's headline numbers — count, % share,
average, freshness — in 1-4 horizontal tiles. Each tile carries a label, a
formatted value, and an optional **trend chip** (`+12% MoM`, `↓ 0.4 day`,
`stable`). The strip exists in two variants:

- `variant="flat"` — transparent band glued under `ListPageTemplate` headers
  (brand glow + cell hairlines, no surface panel).
- `variant="card"` — solid card with header / actions / chart annotations
  (dashboard "Key metrics" section).

Both feed from the **same row bag** the hub's `DataTable` shows, so the
numbers reflect active filters / search.

**Use when:**

- The hub's headline answer can be expressed in **≤ 4 numbers**.
- The numbers update in response to filters, search, or a date scope.
- The user benefits from a trend chip (signed delta + period label).

**Do NOT use when:**

- You need 5 + tiles (push secondary stats into a `MetricInsight`, a chart, or
  another section — never raise `KEY_METRICS_KPI_COUNT_MAX` without DS review).
- The metric is a long-form chart (use `Chart` family, possibly with a
  `MetricInsight` mini-callout inside).

## 2. Anatomy

```
flat:
─────────────────────────────────────────────────────────────────
│ Label   Value   [+12% MoM ▲] │ Label   Value   [−0.4d ▼]    │
─────────────────────────────────────────────────────────────────
                                ↑ hairline between cells (no panel)
```

```
card:
┌──────────────────────────────────────────────┐
│ Key metrics                       [Ask Leo]  │  ← header (label + actions)
│ ──────────────────────────────────────────── │
│ Label   Value   [trend]   ↪ insight chip     │  ← MetricItem rows
│ Label   Value   [trend]                      │
└──────────────────────────────────────────────┘
```

| Slot | Required? | What it carries |
|---|---|---|
| `metrics` | required | `MetricItem[]` (≤ 4) — label, value, optional trend, optional polarity |
| `variant` | required | `"flat"` (list-hub strip) or `"card"` (dashboard tile) |
| `insight` | optional | `MetricInsight` — a narrative chip (e.g. "Renewals up 12% MoM") |
| `headerActions` | optional (card only) | Ask-Leo trigger or drill-down button |
| `loading` | optional | Skeleton state — same layout, no values |

## 3. States

| State | Visual / behavior |
|---|---|
| Default | Tiles render label + value + optional trend |
| Loading | Skeleton bars in the value + trend positions, label visible |
| Empty | Value = `0` (or `—` for averages), trend = `neutral` |
| Trend up + favorable | Up arrow + positive tint |
| Trend up + unfavorable (`trendPolarity: "lower_is_better"`) | Up arrow + destructive tint |
| Trend neutral / informational | Muted tint, arrow still shows direction |
| RTL | Trend chip flips alignment; arrows stay direction-correct (logical, not visual) |

## 4. Tokens consumed

| Token | Used for |
|---|---|
| `--exxat-color-surface-muted` / `--muted` | Card variant header band |
| `--exxat-color-surface-2` / `--card` | Card variant background |
| `--exxat-color-brand-tint-1` / `--brand-tint` | Flat variant OKLCH brand glow |
| `--exxat-color-border-1` / `--border` | Cell hairlines (flat variant) |
| `--exxat-color-ink-1` / `--foreground` | Value text |
| `--exxat-color-ink-2` / `--muted-foreground` | Label + meta text |
| Trend chip tokens (positive / destructive / neutral) | Trend tint + foreground |

## 5. Accessibility

| WCAG SC | How this blueprint complies |
|---|---|
| 1.3.1 Info & relationships | The strip is `role="group"` + `aria-label="Key metrics"`; each tile is a `<dl>`-style label / value pair |
| 1.4.3 Contrast | Trend chip text + tile value ≥ 4.5:1; trend icon ≥ 3:1 |
| 1.4.11 Non-text contrast | Trend chip border / glyph ≥ 3:1 against tile background |
| 2.4.6 Headings / labels | Each tile's label is the accessible name; value is `aria-describedby` |
| 4.1.2 Name / role / value | Trend chip has `aria-label` like "Trending up 12% month over month" (via `metricTrendAriaQualifier`) |

## 6. Variants

| Variant | When to use | Differences from default |
|---|---|---|
| `flat` | List-page hub headers — transparent band under `ListPageTemplate` | No surface panel; OKLCH brand glow; hairlines only |
| `card` | Dashboards (Data tab, embed widgets) | Solid card chrome + header + optional Ask Leo trigger |
| `compact` | Embedded in another card (chart annotation) | 1-2 tiles inline with the chart legend |
| `mini` | Inside a chart card | Single tile rendered next to the chart title |

## 7. Implementation

| Framework | Component(s) | File |
|---|---|---|
| **React (this app)** | `KeyMetrics` + `MetricItem` + `MetricInsight` + `metricTrendTone` + `metricTrendAriaQualifier` | `@exxatdesignux/ui/components/key-metrics` |
| Service injection (Ask Leo) | `KeyMetricsProvider` (in `apps/web/components/key-metrics-ask-leo-bridge.tsx`) | Wires `useAskLeo` → DS context |
| Mobile | — | — |
| Figma | "Key metrics – flat" and "Key metrics – card" frames | — |

## 8. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Cap visible tiles at 4 (`KEY_METRICS_KPI_COUNT_MAX`) | Add a fifth tile by raising the constant without DS review |
| Set `trendPolarity: "lower_is_better"` for metrics where up = bad (defects, overdue, low-quality flags) | Always paint "up" as the favorable tint |
| Feed KPI builders with `tableState.rows` so numbers honor filters | Pass raw mock arrays — the numbers will lie when filters change |
| Use `variant="flat"` on hub headers and `variant="card"` in dashboards | Build a bespoke 3-column tile grid duplicating `KeyMetrics` |
| Pair trend with a `MetricInsight` for narrative context | Show a bare delta with no period header or qualifier |

## 9. References

- `apps/web/docs/kpi-flat-band-pattern.md`, `kpi-strip-max-four-pattern.md`, `kpi-trend-pattern.md`
- `.cursor/rules/exxat-kpi-flat-band.mdc`, `exxat-kpi-max-four.mdc`, `exxat-kpi-trends.mdc`
- `apps/web/AGENTS.md` §4.1 (template metrics slot), §4.3 (charts + mini-metrics)
- `apps/web/lib/dashboard-layout-merge.ts` — `KEY_METRICS_KPI_COUNT_MAX`, `clampKeyMetricsKpiCount`
