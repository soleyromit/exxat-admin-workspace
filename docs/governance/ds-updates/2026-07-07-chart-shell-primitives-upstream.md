# DS updates review — 2026-07-07 (chart-shell-primitives-upstream)

> Source: `docs/governance/ds-updates/pending-review.md` (last_checked: 2026-06-30T12:15:21Z; upstream request logged 2026-07-07).
> Watcher: `.claude/agents/ds-updates-watcher.md`.

---

## Context

This is not a submodule-delta run (no `git submodule update` landed). It is an UPSTREAM REQUEST
logged by Romit (2026-07-07): promote five chart-shell primitives from the DS workspace app
(`Exxat-DS-Workspace/apps/web`) into the published `@exxatdesignux/ui` package, and assess
follow-up candidates from `apps/pce/admin`.

---

## DS deltas digested

| DS | Delta type | Count |
|---|---|---|
| @exxatdesignux/ui (published) | chart shell primitives MISSING from package | 5 |
| @exxatdesignux/ui (published) | chart utility constants MISSING from package | 2 |
| PCE admin | upstream-candidate micro-primitives | 2 |
| Exam-management admin | SVG micro-trend (not yet ported to ChartContainer) | 1 |

Current published chart exports (v0.6.48, confirmed via
`apps/pce/admin/node_modules/@exxatdesignux/ui/dist/index.d.ts:51`):

```
ChartConfig, ChartContainer, ChartLegend, ChartLegendContent,
ChartStyle, ChartTooltip, ChartTooltipContent, chartTooltipKeyboardSyncProps
```

**Not yet published:** `ChartCard`, `ChartFigure`, `ChartDataTable`,
`CHART_AXIS_TICK`, `CHART_TICK_FONT_SIZE`.

---

## Verdict summary

| Item | Type | Verdict | Consumer-side mapping |
|---|---|---|---|
| `CHART_AXIS_TICK` + `CHART_TICK_FONT_SIZE` | DS workspace lib constant | ADOPT — Phase 1 | Delete `lib/chart-typography.ts` in PCE + EM; update 3 inline-escaped call sites in PCE |
| `ChartDataTable` | DS workspace component | ADOPT — Phase 1 | Consumers already use it via local `charts-overview.tsx` copy; re-export from package removes the copy-dep |
| `ChartFigure` | DS workspace component | ADOPT — Phase 2 (after Leo dep resolved) | Used in both PCE + EM `charts-overview.tsx` copies; 1 known sub-floor a11y gap in hand-copies |
| `ChartCard` | DS workspace component | ADOPT — Phase 3 (after ChartFigure lands) | Used in both products; Leo + Tabs + Select deps require DS-side resolution first |
| `MicroTrend` | PCE component (upstream candidate) | ADOPT — Phase 4 (follow-up) | PCE copy uses ChartContainer (clean); EM copy is SVG hand-roll (needs port); same `MicroTrendProps` interface |
| `BulletGauge` | PCE component (upstream candidate) | WATCH | PCE-only, no cross-product evidence yet; flag for DS team when EM/Portal add collection-gauge UI |
| Sub-12px axis ticks in offerings page | WCAG violation (revealed by grep) | WATCH | `offerings/[code]/page.tsx:124` (11px) + `:139,140` (10px) — violates 12px floor, unrelated to upstream request |

---

## ADOPT proposals

### ADOPT-1: `CHART_AXIS_TICK` + `CHART_TICK_FONT_SIZE` — Phase 1

**Delta evidence:** These constants exist only in `Exxat-DS-Workspace/apps/web/lib/chart-typography.ts`.
The DS package does not export them. Consumers hand-copied them verbatim.

**Upstream source:**
`/Users/romitsoley/Exxat-DS-Workspace/apps/web/lib/chart-typography.ts`

```ts
export const CHART_TICK_FONT_SIZE = 12 as const
export const CHART_AXIS_TICK = { fontSize: CHART_TICK_FONT_SIZE } as const
```

**Consumer copies confirmed identical (byte-for-byte):**
- `apps/pce/admin/lib/chart-typography.ts` — exact copy
- `apps/exam-management/admin/lib/chart-typography.ts` — exact copy

**Inline-escaped instances that bypassed the constant (PCE only):**
- `apps/pce/admin/components/pce/dashboard-monitor.tsx:232` — `tick={{ fontSize: 12 }}`
- `apps/pce/admin/components/pce/dashboard-monitor.tsx:233` — `tick={{ fontSize: 12 }}`
- `apps/pce/admin/components/pce/dashboard-monitor.tsx:234` — `label={{ ..., fontSize: 12, ... }}` (ReferenceLine label, not a tick — CHART_AXIS_TICK does not apply here directly)
- `apps/pce/admin/components/pce/section-score-strip.tsx:93` — `tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}` (adds fill — cannot swap CHART_AXIS_TICK verbatim without merging; use `{ ...CHART_AXIS_TICK, fill: 'var(--muted-foreground)' }`)
- `apps/pce/admin/components/pce/question-chart-block.tsx:55` — `tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}` (same pattern)

**Suggested export API:**
```ts
// in @exxatdesignux/ui (new export from packages/ui/src/lib/chart-typography.ts)
export const CHART_TICK_FONT_SIZE: 12
export const CHART_AXIS_TICK: { readonly fontSize: 12 }
```

**Consumer migration once published:**
1. `apps/pce/admin/lib/chart-typography.ts` — DELETE.
2. `apps/exam-management/admin/lib/chart-typography.ts` — DELETE.
3. All callers of `from "@/lib/chart-typography"` → `from '@exxatdesignux/ui'`.
4. `dashboard-monitor.tsx:232,233` — replace `tick={{ fontSize: 12 }}` with `tick={CHART_AXIS_TICK}`.
5. `section-score-strip.tsx:93`, `question-chart-block.tsx:55` — replace with `tick={{ ...CHART_AXIS_TICK, fill: 'var(--muted-foreground)' }}`.

**Risk:** very low — additive package export; consumer deletes a duplicate file.

---

### ADOPT-2: `ChartDataTable` — Phase 1

**Delta evidence:** `ChartDataTable` is defined in
`Exxat-DS-Workspace/apps/web/components/charts-overview.tsx:241–263`.
No external deps — pure JSX + Tailwind `sr-only`. Not in the published package.

**Consumer copies:** Both products have a local `components/charts-overview.tsx` that includes
this function verbatim. Consumer call-sites (PCE) include:
- `components/catalog-live-previews.tsx:15` (imports from `@/components/charts-overview`)
- `components/design-system/chart-previews.tsx:72`
- `components/dashboard-report-deferred.tsx:5`

The DS workspace `AreaChartContent`, `DonutChartContent`, `GroupedBarContent`, `StackedBarContent`
all close with `<ChartDataTable ... />` — it is the canonical a11y fallback pattern for every chart.
Every product hand-copy that omits it creates an a11y regression (WCAG 1.1.1 non-text content).

**Suggested export API:**
```ts
// in @exxatdesignux/ui
export function ChartDataTable(props: {
  caption: string
  headers: string[]
  rows: (string | number)[][]
}): React.JSX.Element
```

**Consumer migration once published:**
- Remove `ChartDataTable` definition from `apps/pce/admin/components/charts-overview.tsx`
  (or delete the full local copy once all 5 primitives land).
- Same for `apps/exam-management/admin/components/charts-overview.tsx`.
- All import sites: `from "@/components/charts-overview"` → add `ChartDataTable` to the
  `@exxatdesignux/ui` import.

**Risk:** very low — zero deps, no behavior change.

---

### ADOPT-3: `ChartFigure` — Phase 2 (after Leo dep resolved)

**Delta evidence:** `ChartFigure` is defined in
`Exxat-DS-Workspace/apps/web/components/charts-overview.tsx:271–373`.
It provides: keyboard arrow-key data-point navigation, Esc-to-clear, live region announcement,
and pointer-down focus capture. The a11y layer most often dropped in hand-copies.

**Leo dependency blocker:** `ChartFigure` directly wraps children in `<ChartLeoInsightOverlay>`,
which lives in `@/components/chart-leo-spotting` (DS workspace app-only, not in the package).
Publishing `ChartFigure` as-is would pull in the Leo overlay system. Two resolution paths:

1. **Preferred (leoSlot prop):** strip the Leo overlay from `ChartFigure`'s body; accept an
   optional `leoSlot?: React.ReactNode` prop. Callers that want the overlay wrap children
   themselves. `ChartFigure` becomes purely the keyboard-navigation + live-region shell.
2. **Alternative:** publish `ChartLeoInsightOverlay` alongside `ChartFigure` as a package export.
   Heavier but preserves the default integration pattern.

This is an open question for the DS team — see "Open questions" section.

**Suggested export API (path 1, preferred):**
```ts
export function ChartFigure(props: {
  label: string
  summary: string
  dataLength: number
  leoSlot?: React.ReactNode   // caller wraps with overlay if needed
  children: (activeIndex: number | null) => React.ReactNode
}): React.JSX.Element
```

**Consumer migration once published:**
- Remove `ChartFigure` definition from both products' local `charts-overview.tsx`.
- Add `ChartFigure` to `@exxatdesignux/ui` import.
- If using `leoSlot` path: each call site that currently has `leoInsight={...}` on a `ChartCard`
  will need to wrap its `ChartFigure` usage with the overlay (or accept no Leo on the figure layer,
  only on the card layer — which `ChartCard` already handles).

**Risk:** medium — the Leo unwiring requires DS-team review of the overlay contract.

---

### ADOPT-4: `ChartCard` — Phase 3 (after ChartFigure lands)

**Delta evidence:** `ChartCard` is defined in
`Exxat-DS-Workspace/apps/web/components/charts-overview.tsx:455–711`.
It is the primary chart-layout primitive across all products: used in both PCE and EM
via their local `charts-overview.tsx` copies.

**Dependency inventory (from DS workspace imports):**
- `AskLeoButton` — `@/components/ask-leo-button` (not in DS package)
- `ChartLeoInsightOverlay` — `@/components/chart-leo-spotting` (not in DS package)
- `ChartFigure` — resolved in Phase 2
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` — already in `@exxatdesignux/ui`
- `Select`, `SelectContent`, etc. — already in `@exxatdesignux/ui`
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription` — already in `@exxatdesignux/ui`
- `metricTrendTone` — from `@/components/key-metrics` (KeyMetrics is in DS package; this helper
  is a RENAME-CANDIDATE — needs DS-team verification)
- `cn` — `@/lib/utils` (already in DS package internal utils)
- `chartLineStrokeDash` — `@/lib/chart-line-dash` (not in DS package)

The blocker is the same Leo system as `ChartFigure` plus `AskLeoButton` and `chartLineStrokeDash`.
Phase 3 is contingent on Phase 2 resolution + Leo package decision.

**Consumer files (product-code, non-rule/non-skill):**

PCE:
- `apps/pce/admin/components/dashboard-report-deferred.tsx:5` — imports `ChartsOverview, ChartCardVariant`
- `apps/pce/admin/components/dashboard-tabs.tsx:16` — imports `ChartCardVariant` type
- `apps/pce/admin/components/catalog-live-previews.tsx:15` — imports chart content components

Exam-management:
- `apps/exam-management/admin/components/dashboard-report-deferred.tsx:5`
- `apps/exam-management/admin/components/dashboard-tabs.tsx:16`
- `apps/exam-management/admin/components/catalog-live-previews.tsx:15`
- `apps/exam-management/admin/components/design-system/chart-previews.tsx:72`

**Consumer migration once published:**
- Delete local `components/charts-overview.tsx` in both products.
- Update all import sites to `@exxatdesignux/ui`.
- Note: `ChartsOverview` (the full gallery component exported from the local file) would NOT be
  promoted to the DS package — it is a demo surface. Product code should use `ChartCard` directly,
  not `ChartsOverview`.

**Risk:** high until Leo deps resolved; medium once they are — the `ChartCardVariant` type and all
variant logic are stable.

---

## ADOPT follow-up candidates

### ADOPT-5: `MicroTrend` sparkline — Phase 4

**Upstream candidate note:** Both local copies flag themselves as upstream candidates in their
file headers.

**PCE copy** (`apps/pce/admin/components/pce/micro-trend.tsx`):
- Uses `ChartContainer` from `@exxatdesignux/ui` + recharts `ComposedChart/Area`.
- This is the canonical, DS-system-aligned version.
- Interface: `MicroTrendProps` with `points`, `stroke`, `areaFill`, `lastPointFill`, `min`, `max`,
  `referenceLine`, `sizing`, `width`, `height`, `strokeWidth`, `lastPointRadius`, `ariaLabel`.

**EM copy** (`apps/exam-management/admin/components/micro-trend.tsx`):
- Hand-rolled `<svg>` — no ChartContainer. Described in its own header as "not yet migrated."
- Interface: same `MicroTrendProps` shape.
- Gap: uses `vector-effect="non-scaling-stroke"` and raw path math; no tooltip sync or
  `chartTooltipKeyboardSyncProps` integration (intentional — sparklines are tooltip-free per design).

**Cross-product evidence:** 2 products, identical interface, both flagged in file headers.
Strong upstream candidate. When DS publishes, both products delete and import from package.

**Consumer migration:** 
- PCE: `apps/pce/admin/components/pce/micro-trend.tsx` — DELETE; update callers to import from `@exxatdesignux/ui`.
- EM: `apps/exam-management/admin/components/micro-trend.tsx` — DELETE; callers already import the
  same interface so migration is mechanical.
- EM callers should verify the ChartContainer rendering matches the SVG visual (line geometry,
  fluid mode) before deleting the SVG version.

---

## WATCH list

### WATCH-1: `BulletGauge` — PCE-only, insufficient cross-product evidence

`apps/pce/admin/components/pce/bullet-gauge.tsx` is a horizontal bullet chart (response count
vs enrollment with amber threshold marker). Uses `ChartContainer` + recharts `BarChart`.
No EM or Portal equivalent found. The domain semantics (responseCount / enrollmentCount /
publishable-minimum threshold) are PCE-specific today. Flag for DS team when EM or Portal
add a collection-progress or quota-gauge UI — that would confirm the primitive is cross-product.

No consumer migration needed at this time. Do not promote until a second consumer emerges.

### WATCH-2: Sub-12px axis ticks in offerings detail page

Revealed by the `fontSize: 12` grep across PCE admin. Three instances in
`apps/pce/admin/app/(app)/admin/offerings/[code]/page.tsx` that violate the 12px font floor:
- Line 124: `tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}` (PolarAngleAxis)
- Line 139: `tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}` (XAxis)
- Line 140: `tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}` (YAxis)

These violate `feedback_ds_typography_color_discipline` (12px floor) and the CHART_AXIS_TICK
contract. The 10px ticks in particular may fail WCAG 1.4.4 (text resize) in some
user-agent/zoom combinations. This is outside the upstream-request scope but is actionable
without waiting for DS publication.

---

## DROP candidates

None. All items are additive promotions or new package exports. No removals proposed.

---

## What I did NOT propose

- **`SectionScoreStrip` upstream:** `apps/pce/admin/components/pce/section-score-strip.tsx` is a
  Likert 1–5 scale strip dot. No cross-product evidence. Domain-specific (survey scores). SKIPPED.
- **`AskLeoButton` upstream:** mentioned as a dependency of `ChartCard`. Whether to publish it
  separately is an Ask-Leo system decision, not a chart-shell decision. DEFERRED to Leo
  infrastructure team.
- **`chartLineStrokeDash` upstream:** used internally by `ChartCard`'s tabs variant for line
  differentiation. Single-file utility. Not proposed independently — it travels with `ChartCard`.
- **`ChartLeoInsightOverlay` / `ChartLeoPlotInsightOverlay` upstream:** Leo overlay system.
  Referenced in `charts-overview.tsx` but deeply tied to the Leo feature system
  (`chartLeoPeakAnchor`, `chart-leo-spotting`, data-attribute protocols). Outside chart-shell
  scope for this review.
- **`ChartsOverview` (the full gallery component) upstream:** this is a demo/catalog surface,
  not a reusable primitive. Not a DS package candidate.

---

## Open questions for Romit + DS team

1. **Leo decoupling strategy for `ChartFigure` / `ChartCard`:** Does the DS team prefer the
   `leoSlot?: React.ReactNode` approach (consumer wraps with overlay) or publishing
   `ChartLeoInsightOverlay` alongside the chart shell? The answer determines Phase 2 complexity.

2. **`metricTrendTone` helper in `ChartCard`:** `ChartCard` variant `"metrics-tabs"` and `"kpi-chart"`
   call `metricTrendTone(trend, trendPolarity)` from `@/components/key-metrics`. This helper is
   already adjacent to `KeyMetrics` in the DS package — is it exported? If not, it needs to be
   added as part of Phase 3. Verify in the package before publishing `ChartCard`.

3. **`chartLineStrokeDash` utility:** Used by `ChartCard` for stroke-dash cycling on multi-series
   line charts. Should it ship as part of the package? Or should `ChartCard` inline the pattern?
   A published `chartLineStrokeDash(seriesIndex: number): string` export would help consumers
   building charts outside `ChartCard`.

4. **Package entry point:** Should the chart shell primitives land in the existing
   `@exxatdesignux/ui` barrel, or under a subpath like `@exxatdesignux/ui/charts`? Barrel
   is simplest for consumers; subpath keeps tree-shaking cleaner for apps that don't use charts.

5. **Sequencing:** Is Phase 1 (`CHART_AXIS_TICK` + `ChartDataTable`) unblocked and shippable
   without resolving the Leo questions? Both have zero Leo deps. Recommend releasing Phase 1
   independently as a v0.6.53 or patch.

---

## Self-retiring queue

First run — no previously rejected proposals to check. Queue is empty.

---

## Consumer migration quick-reference (when all phases land)

| File | Action |
|---|---|
| `apps/pce/admin/lib/chart-typography.ts` | DELETE |
| `apps/exam-management/admin/lib/chart-typography.ts` | DELETE |
| `apps/pce/admin/components/charts-overview.tsx` | DELETE (after Phase 3) |
| `apps/exam-management/admin/components/charts-overview.tsx` | DELETE (after Phase 3) |
| `apps/pce/admin/components/pce/micro-trend.tsx` | DELETE (after Phase 4) |
| `apps/exam-management/admin/components/micro-trend.tsx` | DELETE (after Phase 4) |
| `apps/pce/admin/components/pce/dashboard-monitor.tsx:232,233` | `tick={CHART_AXIS_TICK}` |
| `apps/pce/admin/components/pce/section-score-strip.tsx:93` | `tick={{ ...CHART_AXIS_TICK, fill: 'var(--muted-foreground)' }}` |
| `apps/pce/admin/components/pce/question-chart-block.tsx:55` | `tick={{ ...CHART_AXIS_TICK, fill: 'var(--muted-foreground)' }}` |
| All `from "@/components/charts-overview"` in product code | Redirect to `@exxatdesignux/ui` |
| All `from "@/lib/chart-typography"` in product code | Redirect to `@exxatdesignux/ui` |
| `apps/pce/admin/app/(app)/admin/offerings/[code]/page.tsx:124,139,140` | Fix sub-12px ticks (WATCH-2) |
