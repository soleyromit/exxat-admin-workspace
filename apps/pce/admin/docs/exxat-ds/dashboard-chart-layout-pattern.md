# Dashboard chart layout & data narrative

> **Binding rules (agents):** `.cursor/rules/exxat-dashboard-view-charts.mdc`, `exxat-kpi-max-four.mdc`.  
> **Code constants:** `lib/chart-dashboard-layout.ts`.  
> **Reference implementation:** `components/charts-overview.tsx` (`ChartRows`).

## Problem this solves

Dashboard rows look broken when sibling chart cards end at different heights (area chart tall, donut short). That happens when the grid does not stretch cells and `ChartCard` does not fill the cell. Users also lose the story when charts are ordered randomly or sized without intent.

---

## Equal height in a row (MUST)

| Layer | Rule |
|-------|------|
| **Grid** | `items-stretch` on every multi-card row. Use `CHART_DASHBOARD_ROW_GRID_CLASS` (half + half) or `CHART_DASHBOARD_ROW_GRID_THIRDS_CLASS` (2/3 + 1/3). |
| **Cell** | Wrap each card in `CHART_DASHBOARD_CELL_CLASS` (`flex h-full min-h-0 flex-col`). |
| **Card** | `ChartCard` shell is `flex h-full min-h-0 flex-col`; plot area uses `flex-1` + `CHART_DASHBOARD_PLOT_MIN_CLASS` (**180px** floor). |
| **Read vs edit** | **Read mode** stretches rows. **Edit layout** may use `items-start` so drag chrome stays compact — preview still uses the same card shell. |

**MUST NOT** put `self-start`, `!h-auto`, or `shrink-0` on `ChartCard` in read-mode dashboard grids.

---

## Vertical story (top → bottom)

Think in **questions the coordinator answers in under 60 seconds**, not “how many charts fit.”

| Act | Question | Typical widgets | Width |
|-----|----------|-----------------|-------|
| **1 — Pulse** | “Are we okay right now?” | `KeyMetrics` flat or card (≤4 KPIs) | Full row |
| **2 — Trajectory** | “Is it getting better or worse?” | Area / line / stacked area (time on X) | **2/3** when paired |
| **3 — Composition** | “What is it made of?” | Donut / radial / stacked bar % | **1/3** beside trajectory |
| **4 — Comparison** | “Who or what differs?” | Grouped bar, horizontal bar | Half + half |
| **5 — Pipeline / funnel** | “Where do we lose people?” | Funnel, staged bar | Full width |
| **6 — Exceptions** | “What needs action?” | Scatter, ranked h-bar, table embed | Full or half |

**Sequence in gallery (`ChartRows`):**

1. Placement **trends** (area, 2/3) + **status** (donut, 1/3)  
2. **Applications by program** (grouped bar) + **monthly reviews** (stacked bar) — peer comparison  
3. **Weekly activity** (line, 2/3) + **compliance** (radial, 1/3)  
4. **Top sites** (h-bar, 1/3) + **capacity vs placements** (composed, 2/3)  
5. **Competency radar** (1/3) + **site performance** (scatter, 2/3)  
6. **Application pipeline** (funnel, full width)

---

## Horizontal placement (within a row)

| Pattern | When | Layout |
|---------|------|--------|
| **Trend + snapshot** | Time series + current mix | 2/3 left (primary story), 1/3 right (summary) |
| **Peer comparison** | Two related breakdowns | 1/2 + 1/2, same chart family preferred |
| **Detail + context** | Ranked list + multi-series trend | 1/3 list, 2/3 trend (or reverse if list is the hero) |
| **Single narrative** | Funnel, pipeline, one big question | Full width (`span: 2` on Data canvas) |

**Reading order:** left → right, then top → bottom (F-pattern). Put the **primary metric and chart title** top-left; secondary breakdown sits right or below.

---

## Size rules

| Rule | Detail |
|------|--------|
| **KPI strip** | Max **4** metrics (`exxat-kpi-max-four`). One hero number per chart card when using `kpi-chart` variant. |
| **Plot floor** | `CHART_DASHBOARD_PLOT_MIN_HEIGHT_PX` = **180** — never mix 140px donuts with 180px bars in the same row. |
| **Row density** | Max **2** chart cards per row on `lg` (Data canvas). Gallery may use 3 for quota tiles — exception, not default for hubs. |
| **Full width** | Reserve for funnels, long categoricals (>8 labels), or the one chart that answers the page’s main job. |
| **Embedded tables** | Max **5** rows + “View more” — table is supporting evidence, not the first act. |

---

## Chart type ↔ job (quick map)

| Job | Preferred types | Avoid |
|-----|-----------------|-------|
| Change over time | Area, line, stacked area | Donut alone |
| Part-of-whole (≤6 slices) | Donut, radial | Pie with 12 slices |
| Compare categories | Bar, grouped bar, h-bar | Line with unrelated series |
| Stage / drop-off | Funnel, stacked bar | Scatter |
| Correlation / outliers | Scatter, composed | Radial |

---

## Narration inside each card

Each `ChartCard` follows the same **micro-story**:

1. **Title** — noun phrase (what)  
2. **Description** — scope / period (when, filter)  
3. **Hero metric** (optional) — one number + trend polarity  
4. **Plot** — answers the title; legend ≤5 series  
5. **Leo insight** (optional) — one sentence on the anomaly, not a second chart  

**Subtitle + hero number** must agree (e.g. “Aug 2025 — Mar 2026” with trend through Mar). **MUST NOT** stack two competing hero numbers in one card.

---

## Modern SaaS analogues

| Product | Pattern | Exxat mapping |
|---------|---------|---------------|
| **Stripe** dashboard | KPI row → wide revenue chart → side breakdown | Act 1 + 2/3–1/3 row |
| **Linear** | Trend first, distribution second, dense but aligned rows | `ChartRows` row 1 |
| **Notion** databases | Summary properties → filtered views | KeyMetrics → chart cards filtered by hub `tableState` |

---

## Hub implementation checklist

- [ ] KPIs from `tableState.rows` (same filter as table/board)  
- [ ] `DataViewDashboardCanvas` or gallery grid uses stretch classes  
- [ ] Default card order follows Acts 1–4 before exotic types  
- [ ] `ChartFigure` + `ChartDataTable` + keyboard selection on every chart  
- [ ] Layout persisted via `productPersistKey` + `data-view-dashboard-storage`  

---

## Anti-patterns

- Donut beside donut with no time chart above — no story arc  
- Three unrelated full-width rows in a row — scroll fatigue  
- Mismatched plot heights in one row — looks like a bug (user screenshot)  
- More than four KPIs in the strip — dilutes the pulse  
- Chart types chosen for decoration, not the decision the persona needs
