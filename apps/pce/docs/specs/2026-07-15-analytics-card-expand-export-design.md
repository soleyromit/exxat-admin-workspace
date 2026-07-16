# PCE Analytics — card / expand / export design

**Date:** 2026-07-15 · **Status:** proposed, not implemented · **Author:** Romit + Claude
**Scope:** `/analytics` — Overview, By Faculty, By Course, By Term
**Supersedes nothing.** Implements the triage found in the 2026-07-15 UX audit.

---

## 1. Sources consulted (before any design)

| Source | What it bound |
|---|---|
| `Products/pce/personas.md` (vault) | V1 Admin JTBD — "top 5 / bottom 5 → drill in"; A1 "3 at-risk courses surfaced"; A3 "5-term trend with department median overlay" |
| `project_pce_analytics_monil_model` (Jul 13 raw transcript) | Three-row tab template: **KPIs → trend graph → deep-dive**. "By Faculty is the most important tab." "Average score is never one number." "Whatever we build on screen should also have a reporting angle." |
| DS OS catalog `~/Exxat-DS-Workspace/apps/web` (:4000, live) | Real chart vocabulary + `exxat-dashboard-view-charts.mdc` |
| `@exxatdesignux/ui@0.6.57` via `tools/ds/source.mjs` | `ChartContainer`, `KeyMetrics`, `ExportDrawer` real APIs |
| Mobbin | June, Zendesk, Typeform, Craft, Zoho, Coinbase (§6) |

---

## 2. The problem, measured (2026-07-15, live)

| Tab | Length | Sections | Visible tables |
|---|---|---|---|
| **Overview** | **11.4 screens** (9,787px) | **10** | 15-row tinted matrix + **106-row dump** |
| **By Faculty** | **7.4 screens** (6,343px) | 12 | 1 (9 rows) |
| By Course | 3.5 screens | 4 | 1 (10 rows) |
| By Term | 3.9 screens | 7 | 6 small |

Three failures:

1. **Overview is the other three tabs concatenated.** Ten sections against Monil's template of three.
2. **Density is rendered, not resolved.** 34 faculty → 34 stacked sparklines. 12 courses × 6 terms → a 15-row tinted table. Both make the admin do the ranking by eye.
3. **Nothing exports** except one CSV path (`lib/pce-analytics-export.ts` — CSV only, offerings only).

### The rule this spec introduces

> **The card answers the question. The expand shows the data.**
> If a card needs a scrollbar, it is not a card — it is a deep-dive that escaped its dialog.

A card is **≤ 280px of plot**, shows **enough to understand**, and names its outliers. Everything dense — all 34 faculty, the full course × term matrix, every offering — lives **behind the expand**, never on the card.

---

## 3. DS OS first — what exists, and the verdict per card

**Checked:** `charts-overview.tsx`, `chart-previews.tsx`, `chart-heatmap.tsx`, `list-page-dashboard-charts.tsx`, `library-dashboard-charts.tsx`, `dashboard-report-charts.tsx`, `lib/chart-*.ts`, `.cursor/rules/exxat-dashboard-view-charts.mdc`.

**DS OS vocabulary (Recharts):** Bar · Line · Area · Scatter · Radar · RadialBar · Pie/Donut · composites (`ScatterLineTrend`, `RadialLineTrend`, `RadarBarTrend`, `LineAreaTrend`).
**DS OS heatmap (ECharts):** `chart-heatmap.tsx` — `HeatmapChart` + `ChartLeoPixelPlotInsightOverlay`. Already vendored into PCE (`f7caf606`, `a1c47e8d`).
**Binding rules from `exxat-dashboard-view-charts.mdc`:**
- `ChartFigure` + sr-only `ChartDataTable` for **every** chart. *(PCE already complies — 12 sr-only tables on Overview. Keep.)*
- `ChartCard` wraps chart content; `KeyMetrics variant="card"`; **KPI count 1–4**.
- Keyboard selection via `lib/chart-keyboard-selection` — `CHART_KBD_ACTIVE_BAR` / `CHART_KBD_ACTIVE_PIE_SHAPE`.
- **"MUST NOT duplicate another chart system."**

### The engine conflict — decide once

Three engines are live: **Recharts** (DS OS charts), **ECharts** (DS OS heatmap), **Observable Plot** (PCE analytics, `analytics-plots.tsx`, 1,716 lines).

The DS rule bans a *fourth*. It does not resolve the three we have. **Proposed rule, to confirm with Himanshu:**

| Need | Engine | Why |
|---|---|---|
| Standard trend / bar / donut / scatter | **DS OS Recharts** (`ChartCard` + `ChartContainer`) | Fits, keyboard parity free, DS-first |
| Matrix / heatmap | **DS OS ECharts** (`chart-heatmap.tsx`) | Already the chosen DS heatmap |
| Ranked outliers, beeswarm, arrow-change, small multiples | **Observable Plot** | No DS OS equivalent exists — see §4 |

Plot is **not** a fork here — it covers marks the DS OS vocabulary has no answer for. That gap is worth raising (§8).

---

## 4. Observable Plot — all marks checked, chosen per card

Currently used: `text`(22) `dot`(19) `line`(12) `ruleY`(9) `ruleX`(8) `waffleY` `tickX` `dodgeY` `arrow` `areaY`.

Full mark set reviewed against our four jobs (rank · trend · compare-two-ratings · matrix):

| Mark | Fit | Verdict |
|---|---|---|
| **`dodgeY` (beeswarm)** | 34 faculty, one 200px strip, outliers pop, no scroll | **★ the headline pick** |
| **`dot` + `ruleX` (lollipop)** | ranked top/bottom 5 | ★ leaderboard card |
| **`arrow`** | term→term change per entity | ★ "What moved" |
| `line` + `ruleY` (median) | 5–6 term trend + department median (A3's exact ask) | ★ trend card |
| `cell` | heatmap | **rejected — DS OS ECharts heatmap wins (DS-first)** |
| `linearRegressionY` | trend line on the course-vs-faculty scatter | ✓ expand only |
| `boxX` / `tickX` | distribution summary | ✓ alternative to beeswarm at n>60 |
| `crosshair` / `tip` / `pointer` | hover/keyboard readout | ✓ **expand only** |
| `waffleY` | part-to-whole (response loss) | ✓ keep where used |
| `hexbin`, `contour`, `density`, `raster`, `geo`, `tree`, `image`, `vector`, `link`, `bin` | no job here | ✗ |

**Why beeswarm is the answer to "34 faculty".** It shows *all* 34 — nothing hidden — in one 200px band, where the eye reads the distribution instantly and stragglers separate from the pack. It satisfies "don't show everything" (no 34 charts) *and* "enough to understand" (every faculty is on the plot) at once. The 34 small multiples become the **expanded** view, where they're actually appropriate.

---

## 4b. ⚠ CORRECTION — §5 and §10 are WRONG. Read this first.

**Written 2026-07-15, after reading `apps/pce/docs/2026-07-14-analytics-pce-three-walkthrough.md` §2.1/§5/§6 — the authoritative source, which I had not read when §5 and §10 were drafted.** It is stranded on unmerged commit `c787c6f2` (branch `pce-analytics-walkthrough-doc-clean`), not on this branch. That is why the spec below contradicts it.

**The core error: Overview is not "the other three tabs concatenated."** §2.1 defines it as a deliberate **aggregate → rank → pattern → raw** funnel, and says the three aggregate cards *"double as a preview of and a table of contents for the other three tabs."* **The resemblance is the design, not a bug.** §5's "move 6 sections off Overview" would destroy the funnel.

Four specific reversals:

| §5/§10 said | Truth | Source |
|---|---|---|
| Delete "Every offering" (106 rows) → export only | It is the **raw** step and the **door to Monil's "final node"** — each offering links to its single-survey result. It is row 3 of Monil's own template. | `analytics-survey-details.tsx` header; §2.1 |
| Move both leaderboards off Overview | Both **belong on Overview** as the **rank** step (Faculty 5 rows, Course 8 rows) | §2.1 |
| Expand = DS OS ECharts heatmap | The tinted `CourseTermGrid` **replaced** a canvas heatmap deliberately: *"the grid IS the accessible artefact"* — no `aria-label`-on-a-div, no pixel overlay over the worst cell, no parallel sr-only table to sync. Reinstating ECharts is an **a11y regression**. | `analytics-overview-panel.tsx:655–690` |
| KPIs → `KeyMetrics variant="card"` | KPI row is `ChartCard variant="kpi-chart"` + `KpiSpark`, citing **Aarti D17** — *"4 of 6 faculty" beats "67%"* — and the cards double as the TOC. | `analytics-overview-panel.tsx:326–346`; §2.1 |

### The real diagnosis: over-execution, not mis-composition

The funnel is right; **every step is oversized against its own reference.**

| Funnel step | §2.1 reference | Our build | Fix |
|---|---|---|---|
| Aggregate | 3 cards, count / avg / **% below benchmark** | 3 KPI cards, no explicit benchmark | add benchmarks |
| Rank | Faculty leaderboard **5 rows** · Course leaderboard **8 rows** | **34 small multiples** + a collapsed 34-row table | **right-size to 5 / 8 rows** |
| Pattern | heatmap **8 × 4**, cells link to results | grid 15 × 5 | keep grid; keep cell→result links |
| Raw | Survey Details **22 rows** | **106 rows** | paginate / scope to filter |

**11.4 screens is caused by the rank step being a 34-chart wall where the reference is a 5-row list.** Right-size it and Overview lands near 3–4 screens **without moving or deleting a single section.**

### Revised slice (a) — right-size, don't relocate

1. Overview **rank** step → Faculty leaderboard **5 rows** + Course leaderboard **8 rows**. The 34 small multiples move to **By Faculty's expand** (F2) — the only genuine relocation, and it's a duplicate, not a funnel step.
2. Overview **raw** step → keep `AnalyticsSurveyDetails`, scope it to the active filter + paginate. **Do not delete.** Export is *additional*, not a replacement.
3. **Explicit benchmarks on every KPI** (`< 4.00 avg score`) — §6 "worth keeping".
4. **Fix KPI count 4 / 4 / 2 / 4 → consistent** across tabs (§5.8).
5. **Unify the filter grammar** — today: Overview time-range only, Faculty 2 selects + disclosure, Course 1 select, Term 1 select. *"Four tabs, four filter grammars"* (§5.7). This is the real "doesn't make sense to have."
6. `connectNulls={false}` + clamped domain — lines must **break**, not plunge to the floor, on empty terms (§5.6). Same family as "never coerce null to 0".
7. **By Course still needs its leaderboard** (C4) — that finding survives; `courseCodesOnPage: 1` is real.

**Kept from §4/§10 (independently corroborated by §5/§6):** dot plot / beeswarm over bars (§5.2 — *"a dot plot or bullet chart against the program average would say more"*); no red (§5.1); reference lines everywhere (§6); **Gap Analysis quadrants** — §6 calls it *"the sharpest idea here."*

---

## 5. Target IA — per tab ⚠ SUPERSEDED BY §4b

### Overview — 10 sections → 3 rows (~3 screens, from 11.4)

```
┌─ KPIs ──────────────────────────────────────────────────────────┐
│  Avg faculty score 4.31 ▲.04   Avg course 4.18 ▼.02   RR 68% ▲3 │  KeyMetrics variant="card" (3 ≤ 4 ✓)
└─────────────────────────────────────────────────────────────────┘
┌─ Program trajectory ──────────────────────────┐ ┌─ Needs attention ─────────┐
│  DS OS Line (Recharts) · 6 terms · median rule│ │ ▼ DPT-611  3.42  −0.38    │
│      ╭─╮                                      │ │ ▼ DPT-540  3.55  −0.31    │
│   ╭──╯ ╰──╮      ● Sp26                       │ │ ▼ Dr. Beaumont 3.51 −0.44 │
│  ─┴───────┴────────────── median              │ │ ▲ DPT-505  4.61  +0.22    │
│                                    [Expand ⤢] │ │            [Expand ⤢]     │
└───────────────────────────────────────────────┘ └───────────────────────────┘
```

- **Row 3 = triage**, not a table: top 3 down / top 2 up, both axes, each row a drill-in link. This is A1's "3 at-risk courses surfaced every Monday."
- **Deleted:** "Every offering" (106 rows) → becomes **export only** (§7). It is the dataset, not a screen.
- **Moved → By Faculty:** "Which way each faculty is moving" (34 small multiples).
- **Moved → By Course:** "Courses scoring lowest", "Course quality across terms".

### By Faculty — leaderboard first, 34-wall behind expand (~3.5 screens, from 7.4)

```
┌─ KPIs (3) ──────────────────────────────────────────────────────┐
┌─ Where faculty stand ─────────────────────────┐ ┌─ Movers ──────────────────┐
│  Plot.dodgeY beeswarm — all 34, one strip     │ │ Plot.arrow · top 5 movers │
│   ·· ···●●●◍◍◍●●●··· ·                        │ │  Beaumont ●──▶ −0.44      │
│   ▲Beaumont 3.51        ▲Nwosu 4.74           │ │  Morrison ●─▶  −0.29      │
│  3.0        median 4.31            5.0        │ │  Petrova   ◀──● +0.31     │
│                                    [Expand ⤢] │ │            [Expand ⤢]     │
└───────────────────────────────────────────────┘ └───────────────────────────┘
┌─ Faculty leaderboard (deep-dive) ── top 5 / bottom 5 · [Show all 34] ───────┐
```

- **Leaderboard is visible by default** (currently collapsed, `offsetParent: null`). Monil: *"This should be in faculty."*
- Expand on "Where faculty stand" → **the existing 34 small multiples**, which is where they belong.

### By Course — gains the leaderboard it never had (~3.5 screens)

**Current defect:** single-course detail behind a `DPT-501` dropdown. `courseCodesOnPage: 1`, `mentionsLeaderboard: false`. You must already know the answer to use the tab.

```
┌─ KPIs (3) ──────────────────────────────────────────────────────┐
┌─ Course quality across terms ─────────────────┐ ┌─ Content vs teaching ─────┐
│  CARD: top/bottom 5 lollipop (Plot.dot+ruleX) │ │ Plot.dot scatter          │
│  EXPAND: full 12×6 DS OS ECharts heatmap ⤢    │ │ outliers labelled  ⤢      │
└───────────────────────────────────────────────┘ └───────────────────────────┘
┌─ Course leaderboard → drill into a course ─────────────────────────────────┐
│  (the dropdown becomes the drill-in, not the entry)                        │
```

**This is where the heatmap lives — as the expand, never the card.**

### By Term — closest to correct, leave alone

Keep. **"What moved — Fall 2025 → Spring 2026"** (`Plot.arrow`) is the strongest section on the surface — it answers outright. It is the model for §5 everywhere else. Only reconcile "Where Spring 2026 needs attention" against Overview's new triage row so they don't diverge.

---

## 6. Mobbin comparison

| Pattern | Reference | What we take |
|---|---|---|
| **Expand → same chart, bigger, interactive, table beneath** | [June Explorer](https://mobbin.com/screens/1333cb12-7282-400b-b88f-82da4a07a91b) | **The model.** Chart + granularity toggle (DAY/WEEK/MONTH) + data table + footer actions. Our expand = same chart + term granularity + the deep-dive rows. |
| Per-card expand affordance | [Craft](https://mobbin.com/screens/6ef7da6d-acfb-4923-bde1-b888e035590a) | "View all" per mini-card — a quiet text affordance, not a chrome button |
| Chart gallery in a dialog | [Zoho Analytics Gallery](https://mobbin.com/screens/d312b6a5-782a-4667-923f-5c40f82c3862) | Left-nav + card grid — **rejected**, our expand is one chart deep, not a browser |
| Tabs inside the analytics modal | [Gamma](https://mobbin.com/screens/a045c023-0aec-48ac-a75c-86311f200e43) | Sub-toggle inside expand (Score / Response rate) |
| **Export: format checkboxes + image quality** | [Zendesk](https://mobbin.com/screens/16c4a7e1-0d31-4c7f-abc7-a6507ee7f919) | **The model** — CSV · Excel (formatted) · PNG · PDF + quality |
| Export scope radios | [Typeform](https://mobbin.com/screens/e2f9772f-62e2-49aa-8913-cf0a18bd0292) | All / Filtered / Selected → maps to our existing `ExportScope` |
| Format explained, not just listed | [Coinbase](https://mobbin.com/screens/584956f4-7bd3-4384-a012-86cd2a88f2c0) | One line per format ("PNG — slide-ready image") |
| Format dropdown | [Zoho](https://mobbin.com/screens/1fe06eb3-fbd6-4d33-9387-3ef99ce6d434) | Image/PDF/Excel/CSV — simpler than Zendesk; fallback |

**Divergence from Mobbin (deliberate):** all six references put export in a **dialog**. Our DS convention is `ExportDrawer` / `FloatingSheetPanel`, already used at `results/[id]/page.tsx`. **We follow the DS, not Mobbin** — same content, drawer chrome.

---

## 7. The two new surfaces

### 7.1 Expand dialog — `ChartExpandDialog`

Trigger: a quiet **`Expand`** text button in the `ChartCard` header (text-only — no icon, per house rule).

```
┌────────────────────────────────────────────────────────── ✕ ─┐
│  Where faculty stand                                          │  DialogTitle (required)
│  All 34 faculty · Spring 2026 · median 4.31                   │  DialogDescription
│  ┌ Score ─┬ Response rate ┐        [All terms ▾]  [Export ▾]  │  sub-toggle + scope + export
│  ├───────────────────────────────────────────────────────────┤ │
│  │                                                           │ │
│  │   THE SAME VIZ — larger, now interactive:                 │ │  ~60vh
│  │   Plot.crosshair + Plot.tip + Plot.pointer                │ │
│  │   (card is static; only the expand is interactive)        │ │
│  │                                                           │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  Deep-dive rows — sortable, the numbers behind the plot   │ │  Monil's "deep-dive table"
│  └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

**Rules**
- **Same viz, not a different one.** The expand is the card's chart with density restored + interaction added. A card that beeswarms 34 expands to 34 small multiples *plus* the beeswarm — never to an unrelated chart.
- Card = **static** (`Plot.crosshair`/`tip`/`pointer` **only** in the expand). Keeps 4 cards/tab cheap.
- `DialogTitle` + `DialogDescription` mandatory (P7). Focus trap, `Esc` closes, focus returns to the Expand button.
- Deep-dive table under the plot = Monil's third row, and it stops the "table repeats the KPIs" gap he flagged.
- Selecting one term collapses the trend to a dot — **that is the intended behaviour** (Monil), and the reason the table must be there.

**Why Dialog and not Sheet:** Romit specified dialog; it's also correct here — a chart needs width and this is a focused read, not an editing task in context (`exxat-drawer-vs-dialog`). Export stays a drawer (§7.2).

### 7.2 Export — `ChartExportDrawer`

Every chart exports. Entry points: `Export` in the expand dialog header, and a tab-level `Export` in `PageHeader.actions`.

```
┌ Export ─────────────────────── ✕ ┐
│ WHAT                              │
│  ◉ This chart — Where faculty…    │
│  ○ This tab (4 charts + tables)   │
│  ○ Every offering (106 rows)      │  ← the deleted Overview table lands HERE
│ SCOPE            ExportScope      │
│  ◉ Current filters (Sp 2026)      │
│  ○ All terms                      │
│ FORMAT                            │
│  ☑ PDF    Print-ready, chart+table│
│  ☐ PNG    Slide-ready image       │
│  ☑ Excel  Formatted, one sheet/tab│
│  ☐ CSV    Raw rows                │
│ IMAGE QUALITY  [Medium ▾]         │  (PNG/PDF only)
│                                   │
│         [Cancel]  [Export]        │
└───────────────────────────────────┘
```

| Format | Source | Implementation |
|---|---|---|
| **CSV** | exists | `offeringsCsv` + `downloadCsv` — reuse as-is |
| **Excel** | new | `.xlsx`, one sheet per chart, header row frozen. Needs a writer dep — **decision needed** (§9) |
| **PNG** | new | Plot returns SVG → serialize → canvas → `toBlob`. ECharts has native `getDataURL()`. **Recharts has neither** — see §8 |
| **PDF** | new | Chart PNG + deep-dive table + title/filters/date footer |

**Reuse:** `ExportScope`, `scopedOfferings`, `offeringsCsv`, `exportFilename`, `downloadCsv` (`lib/pce-analytics-export.ts`) all survive unchanged. Filename: `pce-analytics_<scope>_<label>_<yyyy-mm-dd>`.

---

## 8. DS gaps — raise with Himanshu (do not silently fork)

1. **`ExportDrawer` is table-only.** Real API is `{open, onOpenChange, totalRows, visibleColumns}` — no format, no scope, no chart concept. Every chart in every product needs PDF/PNG/Excel. **Ask: extend `ExportDrawer` with `formats` + `scope`.** Until then PCE composes locally from DS `Dialog`/`Checkbox`/`Select` — ≥ 4 use cases, so P8 is satisfied, but this belongs in the DS.
2. **`ChartCard` has no `actions` / `expand` slot.** Props are `title, description, children, className, variant("normal"|"tabs"|"selector"|"metrics-tabs"|"kpi-chart"), trendContent, filterOptions, defaultFilter, onFilterChange, miniMetrics, tabOptions, leoInsight`. There is nowhere to hang **Expand**. **Ask: add an `actions?: React.ReactNode` slot** (or a `kpi-chart`-style `expandable` variant). Blocks §7.1 cleanly.
3. **No export primitive for charts.** Recharts (DS OS default) has no `toImage()`; ECharts does (`getDataURL`), Plot yields SVG. A DS-level `chartToPng(ref)` would serve all three.
4. **Three engines, no policy.** §3 proposes one. Needs Himanshu's ratification, since `exxat-dashboard-view-charts.mdc` says "MUST NOT duplicate another chart system" without naming the winner.

---

## 9. Open questions

1. **Excel writer dep** — `xlsx`/SheetJS (heavy, licence) vs `exceljs` vs server-side. Or ship **CSV-as-Excel** in v1 and defer true `.xlsx`?
2. **PDF** — client (`jspdf`) vs a print stylesheet + `window.print()`? Print stylesheet is zero-dep and DS-token-native.
3. **Beeswarm at n=34** confirmed — but cohort is *"up to 20 types"* and *"45–50 faculty roles"* (Monil, Jul 14). At n≈50 beeswarm still holds; past ~80 switch to `boxX` + outlier dots. **Confirm the ceiling.**
4. **Does Overview survive?** Monil says four tabs, on top. Our build retired it once already. This spec keeps it as *triage* — the only job the other three can't do. Confirm before building.
5. **`ChartCard` gap (§8.2)** — wait for the DS, or ship a local wrapper and migrate?

---

## 10. Card-by-card design

Every card below is written against **real fields** in `lib/pce-analytics.ts` — nothing invented.
Card contract: **≤ 280px plot · static · names its outliers · one question · one expand · one export.**

Colour: below-threshold is **amber/orange, never red** (house rule). `RESPONSE_TARGET = 80` is the response-rate rule line. Scores use the brand ramp; `--destructive` appears nowhere on this surface.

---

### O1 · KPI strip — *"Is the program okay this term?"*

`KeyMetrics variant="card"` · **3 tiles** (≤ 4 ✓) · `termKpis(term)`

```
┌──────────────────┬──────────────────┬──────────────────┐
│ Avg faculty 4.31 │ Avg course 4.18  │ Response 68%     │
│ ▲ 0.04 vs Fa25   │ ▼ 0.02 vs Fa25   │ ▼ 12 below target│  target=RESPONSE_TARGET(80)
└──────────────────┴──────────────────┴──────────────────┘
```
- **Faculty and course scores stay separate tiles.** Monil: *"average score is never one number."* Never merge.
- `trendPolarity` — response rate is higher-is-better; verify arrows aren't inverted (`exxat-kpi-trends`).
- **Not on it:** cohort count, faculty count, offering count. Those are inventory, not health.

### O2 · Program trajectory — *"Which way is the program going?"*

**DS OS Line (Recharts)** via `ChartCard` + `ChartContainer` · `termSeries()` · *DS OS fits — no Plot needed.*

```
  4.5 ┤        ╭───╮
      │   ╭────╯   ╰──● 4.31 Sp26
  4.0 ┤───╯                        ← median rule
  3.5 ┤ Sp24  Fa24  Sp25  Fa25  Sp26          [Expand]
```
- One line (faculty score), median rule, last point labelled. **Not** 6 cohort lines — that's the expand.
- **Expand:** per-cohort lines + response-rate axis + brush; deep-dive = `termSeries()` rows.

### O3 · Needs attention — *"What do I do Monday?"* ★ the tab's reason to exist

Not a chart. Ranked rows, both axes, each a drill-in. This is A1's *"3 at-risk courses surfaced every Monday with one-click drill-in."*

```
┌ Needs attention ─────────────────────────────┐
│ ▼ DPT-611  Pediatric PT     3.42   −0.38  →  │  amber
│ ▼ DPT-540  Differential Dx  3.55   −0.31  →  │
│ ▼ Dr. Claire Beaumont       3.51   −0.44  →  │
│ ─────────────────────────────────────────────│
│ ▲ DPT-505  Biomechanics I   4.61   +0.22  →  │
│                                     [Expand] │
└──────────────────────────────────────────────┘
```
- Sort: `drift` ascending, 3 down + 1–2 up. Mixing courses and faculty is deliberate — the admin's question is "what needs me", not "which axis".
- **Could the admin act without clicking?** Yes — name, score, direction, and the row *is* the drill-in.
- **Expand:** full ranked list both axes, filterable.

---

### F1 · KPI strip — same as O1, scoped by the faculty filter.

### F2 · Where faculty stand — *"Who is off the pace?"* ★ replaces the 34-sparkline wall

**Observable Plot · `dodgeY` beeswarm** · `facultyStats(term).score.weighted` + `ratings[]` · median `ruleX`

```
┌ Where faculty stand ───────────────────────── 34 faculty ┐
│                          ·· ·                            │
│      ▲Beaumont    · ···●●◍◍◍◍●●●·· ·      ▲Nwosu         │
│      3.51           ·  ··  ·                4.74         │
│  3.0 ─────────────── median 4.31 ──────────────── 5.0    │
│                                              [Expand]    │
└──────────────────────────────────────────────────────────┘
```
- **All 34 are on the plot** — nothing hidden — in ~200px. Only the two extremes are labelled; the pack stays anonymous until expand. That is "not everything, but enough to understand."
- Dot area ∝ `offerings`; median from `dualMean().weighted`.
- **Not on it:** names for all 34, per-faculty axes, trend lines.
- **Expand:** the beeswarm at full height **plus the existing 34 small multiples** (`analytics-plots.tsx` — reuse, don't rewrite) + `crosshair`/`tip`; deep-dive = the leaderboard rows.

### F3 · Movers — *"Who changed?"*

**Plot · `arrow`** · `facultyStats().drift` (`avg1y − avg3y`) · top 5 |drift|

```
┌ Movers ─────────── 1Y vs 3Y ─┐
│ Beaumont   ●─────▶  −0.44    │  amber
│ Morrison   ●───▶    −0.29    │
│ Petrova     ◀────●  +0.31    │
│                    [Expand]  │
└──────────────────────────────┘
```
- `drift` is null when either window is empty → **render as "—", never 0.** (The code comments are explicit that a single-term scope makes drift identically zero; do not show a fake flat arrow.)
- **Expand:** all 34 arrows + the 1Y/3Y windows drawn explicitly.

### F4 · Faculty leaderboard — the deep-dive row (Monil's third row)

Visible by default — **not** collapsed. Top 5 / bottom 5, `[Show all 34]` expands in place.
Columns: Faculty · Weighted score · Simple mean · Offerings · Courses · Response rate.
- `score.weighted` headline, `score.simple` + `n` on hover — *"shown on hover so the method is legible."*

---

### C1 · KPI strip — course-scoped.

### C2 · Course quality across terms — *"Which courses are slipping?"* ★ the heatmap's new home

**Card: Plot `dot` + `ruleX` lollipop** (bottom 5 by latest `courseAvg`) — **Expand: DS OS ECharts heatmap** (`chart-heatmap.tsx`, full 12×6).

```
┌ Course quality across terms ─────────────┐
│ DPT-611  ├────────●  3.42                │  amber
│ DPT-540  ├─────────●  3.55               │
│ DPT-602  ├──────────●  3.67              │
│ DPT-515  ├───────────────●  4.15         │
│ DPT-501  ├────────────────●  4.20        │
│          3.0        median 4.18      5.0 │
│                   [Expand — all 12 × 6]  │
└──────────────────────────────────────────┘
```
- **This is the resolution of the tinted-table problem.** The matrix isn't deleted — it's promoted to the expand, where a matrix is the right tool. The card answers "which are slipping"; the matrix answers "show me everything".
- **Expand:** ECharts heatmap + `ChartLeoPixelPlotInsightOverlay`; deep-dive = `courseTermPoints()`.

### C3 · Content vs teaching — *"Bad course, or struggling instructor?"*

**Plot · `dot` scatter** · `courseTermPoints() {courseAvg, facultyAvg}` · diagonal `ruleY`

```
┌ Content vs teaching ─────────┐
│ teach 5 ┤   ·  ·°            │
│         │ ·°·:·  ·           │
│       4 ┤·  ·  ● DPT-611     │  labelled: off-diagonal only
│         └────────────────    │
│           4     content   5  │   [Expand]
└──────────────────────────────┘
```
- The **only** card that answers Monil's decomposition question. Off-diagonal = the finding; label those, nothing else.
- **Expand:** + `linearRegressionY`, quadrant labels, term filter.

### C4 · Course leaderboard — **NEW.** The tab's missing entry point.

Top 5 / bottom 5 courses → row click drills into the course detail. **The `DPT-501` dropdown becomes the drill-in, not the entry.** Fixes `courseCodesOnPage: 1`.

---

### T1–T5 · By Term — keep, one change

`termKpis` strip · `termSeries()` trend · **`termSlope(term)` → "What moved"** (already `Plot.arrow` — the best card on the surface, leave it) · content-vs-teaching for the term · `termCourseBreakdown(term)` deep-dive.
**Only change:** reconcile "Where Spring 2026 needs attention" against O3 so the two triage lists cannot disagree — both read `drift`.

---

### States — every card (P5)

| State | Treatment |
|---|---|
| Loading | `Skeleton` at the card's fixed plot height — never a spinner, never a height jump (M9) |
| Empty | "No offerings in Spring 2026." One line, no CTA stack (M8) |
| Null metric | `drift`/`avg1y`/`avg3y`/`facultyAvg` are nullable → render "—". **Never coerce null to 0** |
| n = 1 | Beeswarm degenerates → fall back to a single labelled dot; suppress the median rule |
| Error | `LocalBanner` in the card. **Never a toast** |

### Accessibility — every card

- `ChartFigure` + sr-only `ChartDataTable` retained on **all** cards (already compliant — do not regress).
- Card is static, so keyboard parity lives in the expand: `CHART_KBD_ACTIVE_BAR` for Recharts; Plot cards expose the sr-only table as the keyboard path.
- Expand: `DialogTitle` + `DialogDescription`, focus trap, `Esc`, focus returns to `Expand`.
- Colour never sole encoder — every amber dot carries a label or a numeral (M4).

---

## 11. Acceptance

- [ ] Overview ≤ 3.5 screens (from 11.4); no table > 12 rows on any card
- [ ] No card taller than 280px of plot; no card scrolls
- [ ] By Course opens on a leaderboard; `courseCodesOnPage > 1`
- [ ] By Faculty leaderboard visible without disclosure
- [ ] Every chart: `Expand` → same viz, denser + interactive; sr-only `ChartDataTable` retained
- [ ] Every chart exports PDF · PNG · Excel · CSV
- [ ] 106-row "Every offering" reachable **only** via export
- [ ] axe clean on card + expand; `Esc`/focus-return verified
- [ ] KPI count 1–4 per `exxat-dashboard-view-charts.mdc`
