# PCE — hand-rolled viz register

Required by `docs/governance/ds-adoption.md` §Visualization:

> **HAND-ROLL ALLOWED** when chart is genuinely bespoke (bullet-vs-target, gap heatmap, score
> landscape, slope-paired, cleveland-dot, sankey). Per Aarti "viz first" preference.
> When you hand-roll viz, **add it to `apps/<product>/docs/patterns/viz-handrolled.md`** with: what
> visual it shows, why a standard chart wouldn't work, dimensions.

The DS package ships **zero chart types** — `node tools/ds/source.mjs` → `@exxatdesignux/ui@0.6.57`,
702 exports, of which only 8 are chart primitives (`ChartContainer`, `ChartConfig`, `ChartTooltip`…).
So every chart type in PCE is necessarily local. Nothing here is a hand-rolled `<svg>`: all are built
on `ChartContainer` + recharts, per the Jul 7 2026 no-hand-rolled-viz directive.

---

## `components/pce/score-bullet.tsx` — `ScoreBullet`

| | |
|---|---|
| **Pattern** | `VIZ-PATTERN-003` — `docs/patterns/viz/bullet-vs-target.md` |
| **Selected via** | `docs/patterns/viz/RUBRIC.md` Q1 — *"Where does X stand vs target / cohort?"* (VIZ-005 makes the rubric mandatory) |
| **Built on** | `ChartContainer` + recharts `BarChart` (`layout="vertical"`) + 2 `ReferenceLine` |
| **Dimensions** | 120 × 8 px default — matches the `BulletGauge` sibling |
| **Added** | 2026-07-14 |

**What it shows.** One faculty score on a 1–5 track against two nested benchmarks: department average
(solid marker) and university average (dashed marker). Fill is `--chart-2` at/above the department
average, `--chart-4` amber below — never red (VIZ-004, Aarti).

**Why a standard chart wouldn't work.** There is no bullet chart in the DS, and none in the vendored
gallery (`chart-previews.tsx` has a gallery-only `BulletPreview`, not a product primitive). Rubric Q1's
❌ is explicit: *"Progress bar. Hides cohort, hides target, hides trajectory."*

**Why not extend `BulletGauge`.** `BulletGauge` (`components/pce/bullet-gauge.tsx:27-46`) is a
count/count primitive — `responseCount` / `enrollmentCount` both required, `pct = responseCount /
enrollmentCount`. A 1–5 score against two averages has no numerator and no denominator. It also has 3
live call sites (`my-surveys/page.tsx:102`, `moderation/page.tsx:140`, `surveys-table.tsx:108`), so
loosening its props is breaking. Sibling, not a fork.

**Naming.** `*Bullet`, never `*Gauge`. `DESIGN.md:104` (VIZ-011) bans *"gauges/dials"* — meaning
circular dial/speedometer shapes (Tufte). A horizontal bullet is Tufte-canonical and not banned. The
existing `BulletGauge` **name** is the misnomer; if a future audit flags it, rename to
`ResponseRateBullet`.

**Why it exists at all — this is the percentile substitute.** `Specs/pce/specs/course-evaluation.md`
§7.3 bans peer-comparison metrics in the faculty view: *"'you're at the 60th percentile' included —
that reverse-encodes peer rank"*. §7.3 explicitly **allows** *"department average, university average,
threshold"*, and Aarti validated exactly that framing (A5): *"How am I doing? And how am I doing with
respect to others? compared to the department average to the university average"* — citing
Anthology/Watermark as proof faculty accept it. So this answers the ADMIN task list's
"percentile" ask without encoding peer rank, and is safe in both the admin lens and the self-view.

**Deliberate deviations from the pattern doc** (`bullet-vs-target.md`):
1. Markers use `var(--muted-foreground)`, **not** the recipe's `var(--border)` — **A11Y-021**
   (`design-anti-patterns.md:90`): `--border` as the sole state indicator is ≈1.2:1 and fails WCAG
   1.4.11's 3:1 for non-text. *(`bullet-gauge.tsx:106` and `micro-trend.tsx:131` still violate this —
   separate fix.)*
2. Built on `ChartContainer` + recharts, not the recipe's absolutely-positioned divs — Jul 7 2026
   directive. The recipe also uses `color-mix(…, transparent)`, which `design-anti-patterns.md:41`
   bans (`color-mix` only with two `var()` tokens).
3. Fill is `--chart-2` / `--chart-4` per VIZ-003, not `BulletGauge`'s `--brand-color`
   (`design-anti-patterns.md:72` reserves brand for primary CTAs, not data).

**A11y.** `role="meter"` + `aria-valuenow/min/max` + an `aria-valuetext` naming both benchmarks. The two
markers share a token and are separated by **dash pattern + position**, so colour is never the sole
encoding (A11Y-008). No text is drawn inside — the caller composes the label, matching the
`BulletGauge` contract.

### Its data helper — `facultyBenchmarks()` in `lib/pce-results.ts`

Returns `{ score, deptAvg, universityAvg, program, deptFacultyCount, sampleSize }`.

Two guards that exist because driving the real mock data exposed them:

1. **Faculty can teach across programs.** `Dr. Maria Williams` has results in *both* DPT and PharmD, so
   an `own[0].program` scope makes the department average depend on **array order**. It now scopes to
   the **primary** program (most scored results, alphabetical tie-break) — deterministic.
2. **A department of one is not a comparison.** PharmD has exactly one scored result — Williams' own —
   so her "department average" was literally her own score wearing a benchmark's clothes (4.20 vs her
   4.22). `deptAvg` is now withheld (`null`) unless `deptFacultyCount >= 2`; the caller hides the marker
   and falls back to the university average. On a surface governed by §7.3, a self-referential benchmark
   is worse than none.

**Open — does not block this component.** The enrollment-weighted vs simple-mean question is unanswered
by Aarti (`2026-06-22-evaluations-dashboard-consolidation.md` §4) and **blocks any RANKING** (the faculty
leaderboard, courses-ranked). It does **not** block a bullet: stating one score against two averages does
not order people. `facultyBenchmarks` uses an unweighted mean; if the decision lands, change it there and
both the bullet and its callers follow.
