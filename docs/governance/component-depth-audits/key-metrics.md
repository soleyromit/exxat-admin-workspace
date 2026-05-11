# KeyMetrics — Depth audit (2026-05-11)

## Library reality

- **Source:** `exxat-ds/apps/web/components/key-metrics.tsx` (860 lines)
- **Library demo:** `Admin/apps/web/components/component-catalog/component-preview.tsx:699-726` (`KeyMetricsCatalogPreview`), live at `http://localhost:4000/library/key-metrics`
- **Published API:** NOT exported from `@exxat-ds/ui` — adoption requires vendoring (same pattern as DataTable)
- **Two exported entries:** `KeyMetrics` (full organism) + `KeyMetricsContent` (raw grid + insight, no chrome — for embedding in ChartCard)

### Variants (`KeyMetricsProps.variant`)
| Variant | Chrome | Used for |
|---|---|---|
| `"card"` (default) | shadcn `Card` wrapper + brand-glow background + integrated Ask Leo button + Period select in header | Standalone dashboard hero — see `component-preview.tsx:703-712` |
| `"flat"` | Full-width section, brand-glow band, no card border | Page-top KPI band — see `component-preview.tsx:713-723` |
| `"compact"` | Card chrome, no header, metrics only | Dense / embedded |

### Key props (`exxat-ds/apps/web/components/key-metrics.tsx:115-155`)
```ts
variant?: "card" | "flat" | "compact"        // default "card"
title?: string                                // default "Key Metrics"
description?: string
metrics: MetricItem[]                         // required
metricsSingleRow?: boolean                    // force all KPIs into one row
metricsHalfWidthLayout?: boolean              // 2-col grid for half-width cards
insight?: MetricInsight                       // side rail (md+) or stacked
insightFullWidth?: boolean                    // insight as full row below
insightCompact?: boolean                      // tighter insight card
periods?: PeriodOption[]                      // default 4: week/month/quarter/year
defaultPeriod?: string                        // default "week"
onPeriodChange?: (period: string) => void
showHeader?: boolean                          // default true
className?: string
```

### `MetricItem` (lines 69-89)
```ts
id: string                  // React key
label: string
value: string | number
delta: string | number       // "+5", "-3"
trend: "up" | "down" | "neutral"
href?: string                // → renders <a>
onClick?: () => void         // → renders <button>
metricVariant?: "default" | "hero"   // hero = larger value
```

### A11y + features none of the hand-rolls have
- Trend never colour-only — icon + sr-only `aria-label` (lines 223-237, WCAG 1.4.1)
- Period select `aria-label="Select comparison period"` (line 454); insight rail `role="region"` (line 298)
- Brand-color radial-glow background (lines 741-746) — hero treatment
- Integrated `Ask Leo` CTA with `⌘⌥K` tooltip (lines 38-65, 764-777)
- Period Select with onChange (lines 778-794)
- Insight rail + 3:2 KPI/insight grid, side/stacked/full-width modes (lines 432-650)
- `metricVariant="hero"` for primary KPI emphasis (line 88)
- Severity tokens `--insight-severity-*` (lines 364-377)

---

## Adoption snapshot

| Workspace | Files importing canonical KeyMetrics | Files hand-rolling KPI shape | Total KPI surfaces |
|---|---|---|---|
| PCE admin | 0 | 1 local: `KpiButton` (analytics/page.tsx) | 4 tiles |
| exam-mgmt admin | 0 (vendored hand-roll) | 3: `key-metrics.tsx` + `KpiTile` + `KpiCard` | 2 KeyMetrics usages + 7 KpiTile usages = 9 surfaces |
| exam-mgmt assessment-taker | 0 | 1 local: `StatCard` (SidebarDrawer.tsx) | 4 tiles |
| studentUX | n/a (separate DS — has `KeyMetricsShowcase`) | 0 | — |

**Note:** studentUX exports a parallel canonical component (`@exxat/student/components/shared/key-metrics-showcase.tsx`). This audit covers admin DS only.

---

## PCE: `KpiButton` hand-roll

- **Definition:** `apps/pce/admin/app/(app)/analytics/page.tsx:95-152` (~55 lines)
- **Props (lines 98-105):** `label`, `value`, `meta` (≈delta+description merged), `icon?`, `iconColor?`, `href?` (wraps in `<Link>`)
- **Usage sites (4 tiles, one strip):**
  - `analytics/page.tsx:539-544` — "Program avg" (no icon)
  - `analytics/page.tsx:545-552` — "At-risk courses" (conditional iconColor)
  - `analytics/page.tsx:553-560` — "Pending review"
  - `analytics/page.tsx:561-567` — "Reflection rate" (decorative, no href)
- **Composition:** uses DS `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` (not raw divs)
- **Features missing vs canonical:**
  - No `trend` / `delta` — flattened into `meta` string (no WCAG 1.4.1 icon, no `aria-label`)
  - No period selector, no insight rail, no Ask Leo CTA (PCE renders a separate `AiInsightCard` at line 521 — visually disconnected from the KPI strip)
  - No brand-glow background, no "hero" variant
  - Hover uses `color-mix` inline (line 113) vs canonical's `hover:bg-foreground/5`
- **Visual mismatch with exam-mgmt:** PCE renders 4 separate `Card` boxes in `grid-cols-4`. Exam-mgmt's `KeyMetrics` renders a single rounded container with divider-separated cells. Canonical does the latter. Two products, two visual languages, same intent.

---

## exam-mgmt: three concurrent hand-rolls

### A. `apps/exam-management/admin/components/key-metrics.tsx` (54 lines)

- **API:** `Metric { id, label, value, delta?, trend? }` + `KeyMetricsProps { metrics }` — no title, no insight, no period
- **Implementation:** raw `<div>` flex with `borderLeft` inline style (line 29) — does NOT use DS `Card`/`Separator`
- **Usage sites:**
  - `app/(app)/competency/competency-client.tsx:23, 77` — 4 metrics: cohort avg / at-risk / untested / active courses
  - `app/(app)/assessments/[id]/monitor/live-monitor-client.tsx:32, 199` — 4 metrics: not-started / in-progress / submitted / flagged
  - `app/(app)/courses/courses-client.tsx:10, 27` — referenced in docstring, **removed per Vishaka** (line 27 comment)
- **Diverges from canonical:**
  - No insight rail, period, Ask Leo, glow, header
  - `trend` optional, renders only arrow + raw delta — no `aria-label`
  - Uses `text-primary` for up-trend (line 38) — canonical uses `text-chart-2`. Will render wrong colour on Lavender brand where `--primary` is dark grey.
  - Uses `text-chart-5` for down-trend; canonical uses `--destructive`
  - Cells not interactive (no href / onClick)
- **Diverges from PCE's `KpiButton`:** single rounded container w/ internal dividers vs 4 separate Cards; no icon support; supports trend chip (PCE flattens to `meta`)

### B. `KpiTile` in `apps/exam-management/admin/components/faculty-ui-kit.tsx:46-86`

- **Props:** `icon` (required FA class), `label`, `value`, `tone?` (6 tones), `sub?`, `onClick?`, `pulseIcon?`, `active?`
- **Implementation:** raw `<button>`/`<div>` with `before:` left-rail accent (line 68). DS Card NOT used.
- **Usage sites (7 tiles, 2 files):**
  - `app/(app)/assessments/[id]/analytics/analytics-client.tsx:34, 328-341` — 4 tiles (aliased `Kpi` at line 468): cohort avg / pass rate / std deviation / items-to-review (interactive)
  - `app/(app)/courses/[id]/tabs/overview-tab.tsx:28, 72-87` — 2 tiles: cohort avg / at-risk students (interactive)
- **Distinct value vs canonical:** tone-aware icon swatch, left-rail accent, `pulseIcon` for live state — none in canonical. But canonical's `metricVariant="hero"` + trend chip + interactive cell covers the *common* case.

### C. `KpiCard` (same file, lines 195-219)

Wraps `KpiTileInner` inside a DS `Card`. **0 usage sites** — dead code.

---

## Other KPI-shaped UIs (not regex-named)

### `StatCard` — assessment-taker
- **Def:** `apps/exam-management/assessment-taker/src/components/SidebarDrawer.tsx:234-280`
- **Usage:** lines 113-141 — 4 tiles: Questions / Time Limit / Passing / Difficulty
- **Why KeyMetrics:** identical intent — labeled value tiles with iconified accent — built as raw `<div>` with inline `borderColor` / `backgroundColor`. No trend, no a11y label.
- **Caveat:** Vite/React project (not Next.js admin) — vendor path differs.

### Section-score rows in PCE surveys
- `apps/pce/admin/app/(app)/surveys/[id]/responses/page.tsx:93-102` — 3 section avg/5 values, raw flex `<div>` w/ inline styles
- `apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx:220-244` — section header avg/5
- Borderline KPI surfaces (label + value + score). Would map to `KeyMetrics` w/ `metricsSingleRow` + `metricsHalfWidthLayout`.

### PCE `FolderCard` — leave as-is
- `apps/pce/admin/app/(app)/page.tsx:36-91`, `apps/pce/admin/app/(app)/admin/page.tsx` — primarily nav cards, not a KPI strip.

---

## Recommended vendor path

1. **Vendor canonical `KeyMetrics`** from `exxat-ds/apps/web/components/key-metrics.tsx` into `apps/pce/admin/components/key-metrics/` (mirroring DataTable vendor structure). Dependencies to re-wire: `@/components/ui/card`, `@/components/ui/select`, `@/components/ui/separator`, `@/components/ui/button`, `@/components/ui/tooltip`, `@/components/ask-leo-sidebar`, `@/lib/utils`. Most of these are already vendored or trivially aliased. **Effort: ~3-4h** (single biggest unknown is `useAskLeo` — if PCE doesn't have an Ask Leo provider yet, stub or guard it).
2. **Replace `KpiButton` at `analytics/page.tsx:539-567`** with `<KeyMetrics variant="card" metricsSingleRow ... />` and pass through the conditional iconColor via `MetricItem.trend` semantics. Move the `AiInsightCard` at line 521 into KeyMetrics' `insight` prop — collapses two surfaces into one. **Effort: ~2h.**
3. **Remove `KpiButton` definition (lines 95-152).** Trivial.
4. **Cross-product: exam-mgmt** — vendor the same canonical into `apps/exam-management/admin/components/key-metrics/` and replace the 3 hand-rolls:
   - Swap 54-line `key-metrics.tsx` at the 2 usage sites (competency, live-monitor). **Effort: ~1h.**
   - `KpiTile` → `KeyMetrics` with `metricsSingleRow` + interactive cells. 7 usage sites. **Effort: ~3-4h** because tone/pulseIcon/active props don't have 1:1 canonical equivalents — may need to either drop them or extend the vendored copy.
   - `KpiCard` → delete (dead code).
   - **Total exam-mgmt: ~5-6h** in a separate session.
5. **assessment-taker `StatCard`** — defer. Vite/React project, separate vendor decision.

---

## What audit can't see

- Whether the visual matches between PCE's 4-Card grid and exam-mgmt's bordered-row variant in the browser (likely diverges, but only side-by-side confirms)
- Whether `KpiTile.pulseIcon` / `active` / `tone` carry product-specific behaviour that canonical can't express — needs 1:1 prop-by-prop comparison with the analytics-client live-monitor scenarios
- Whether the `useAskLeo` provider needs scaffolding in PCE before vendoring is feasible
- Whether the `--insight-severity-*` CSS tokens (referenced at `key-metrics.tsx:367-374`) are defined in the admin DS `theme.css` — if not, vendoring will surface as broken pill colours

---

## Recommended next 2 fixes

1. **PCE vendor + replace `KpiButton`** (steps 1-3 above, ~5-6h total). Single product, single page, biggest visibility — and the dashboard is the canonical demo surface for "drone view → drill in" per Aarti's 2026-05-08 directive. Land this, then the exam-mgmt cleanup has a working precedent.
2. **Delete `KpiCard` dead code in `faculty-ui-kit.tsx:195-219`** — 25 lines, zero usage sites, trivial PR. Removes confusion about which of `KpiTile`/`KpiCard`/`KeyMetrics` is "the" KPI primitive in exam-mgmt before the bigger migration.
