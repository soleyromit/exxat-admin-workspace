'use client'

/**
 * The multi-survey analytics chart vocabulary, built on Observable Plot.
 *
 * Every chart here is chosen against `docs/patterns/viz/RUBRIC.md` (VIZ-005 makes it the
 * mandatory gate) and answers one question with one action, per `pce-ui-patterns.md` §0.2.
 * Registered there; do not add a chart to this file without adding its row.
 *
 * The house style, applied to all of them:
 *   · the benchmark is drawn ON the plot, never described beside it (VIZ-002)
 *   · the outlier is named on the plot, not enumerated in prose (VIZ-002)
 *   · color is never the only encoding — every threshold pairs with position + a label (A11Y-008)
 *   · below-threshold is amber `--chart-4`, NEVER red (VIZ-004, Aarti)
 *   · reference lines use `--muted-foreground`, never `--border` (A11Y-021: --border ≈ 1.2:1)
 */

import * as React from 'react'
import * as Plot from '@observablehq/plot'
import {
  PlotFigure,
  axisDefaults,
  gridMark,
  type PlotTheme,
} from '@/components/pce/plot-figure'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@exxatdesignux/ui/components/ui/chart'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceArea,
  LineChart, Line, ScatterChart, Scatter, ZAxis, BarChart, Bar, Cell,
} from 'recharts'
import { ChartLeoPlotInsightOverlay } from '@/components/charts-core'
import { heatmapCellColor, heatmapCellUsesLightText } from '@/lib/chart-heatmap-scale'
import { ChartHeatmap, buildChartHeatmapPoints } from '@/components/chart-heatmap'
import { CHART_TICK_FONT_SIZE } from '@/lib/chart-typography'
import { RESPONSE_TARGET, RATING_THRESHOLD, shortTerm } from '@/lib/pce-analytics'
import type {
  FacultyStat,
  CourseStat,
  DualMean,
  GapPoint,
  HeatCell,
  TermSeriesPoint,
  FacultyCourseStat,
  CourseQuestionTrendRow,
} from '@/lib/pce-analytics'

const SCORE_DOMAIN: [number, number] = [1, 5]
/** Scores cluster 3.4–4.8; a full 1–5 axis flattens every difference into noise. */
const SCORE_VIEW: [number, number] = [3.0, 5]

const fmt2 = (v: number) => v.toFixed(2)

/**
 * Fit the axis to the data, with padding and a floor on the span.
 *
 * A fixed 3.0–5.0 score axis buries the story: real programme movement is ~0.3, which on a
 * 2.0 domain is 15% of the plot height — the line reads flat while the delta chips beside it
 * say -0.22. Same failure as a line stretched to 100% width, on the other axis.
 *
 * `minSpan` stops the opposite error: with near-identical values a data-fitted domain would
 * magnify noise into a mountain. The axis keeps its own ticks either way, so the scale is
 * always legible. (Tufte's non-zero-baseline ban is about BARS, whose length encodes the
 * value; a line encodes position and a fitted domain is standard practice.)
 */
function paddedDomain(values: number[], minSpan: number, pad = 0.18): [number, number] {
  if (!values.length) return SCORE_VIEW
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = Math.max(hi - lo, minSpan)
  const mid = (lo + hi) / 2
  const half = span / 2 + span * pad
  return [Math.max(1, mid - half), Math.min(5, mid + half)]
}

/**
 * Most on-plot text labels any one chart may draw.
 *
 * Naming the outlier is the point (VIZ-002) — naming twelve is a pile-up that hides the one
 * that matters. With thin data a residual threshold flagged 2; with real scenario data it
 * flags a dozen. Cap the text, keep the colour + tooltip on the rest.
 */
const MAX_PLOT_LABELS = 4

/**
 * Inline empty state for a chart body.
 *
 * A chart with no data must SAY so — a blank plot area inside a titled card reads as a
 * rendering failure, and the user cannot tell "no data" from "broken". DriftDumbbell already
 * did this; the rest of the file now shares it.
 */
function ChartEmpty({ note }: { note: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{note}</p>
}

/* ════════════════════════════════════════════════════════════════════════════
   Story 10 — Faculty leaderboard.
   Q: "Who is an outlier across N faculty?"  → RUBRIC Q2 → Cleveland dot (N≤30).
   A: coach the person / read their comments.

   The upgrade over a ranked bar: every one of that person's offerings is drawn as a
   faint dot behind their mean. A bar says 4.2. This says 4.2 ± 0.1 (consistent) or
   4.2 ± 0.9 (volatile) — the same headline number, two different conversations.
   ════════════════════════════════════════════════════════════════════════════ */

export function FacultyLeaderboardDots({
  faculty,
  median,
  height,
  leoAnchor,
}: {
  faculty: FacultyStat[]
  median: number
  height?: number
  leoAnchor?: { x: unknown; y: unknown }
}) {
  const order = React.useMemo(() => faculty.map((f) => f.name), [faculty])

  const spread = React.useMemo(
    () => faculty.flatMap((f) => f.ratings.map((r) => ({ name: f.name, rating: r }))),
    [faculty],
  )

  // Charts can't render a Pending/na score as a data point — filter those rows out before
  // building mark data rather than plotting them as 0. The range spine and per-offering
  // dots above don't touch `.score`, so they keep drawing from the full `faculty` list; only
  // the marks that read a score need the narrowed, always-`value`-state array.
  const plottable = React.useMemo(
    () =>
      faculty.filter(
        (f): f is typeof f & { score: { state: 'value'; value: DualMean } } => f.score.state === 'value',
      ),
    [faculty],
  )

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 132,
      marginRight: 44,
      marginTop: 18,
      x: { domain: SCORE_VIEW, label: null, ticks: 5, ...axisDefaults(theme) },
      y: { domain: order, label: null, ...axisDefaults(theme) },
      marks: [
        // Range spine — min to max of the person's offerings.
        Plot.ruleY(faculty, {
          y: 'name',
          x1: (d: FacultyStat) => Math.min(...d.ratings),
          x2: (d: FacultyStat) => Math.max(...d.ratings),
          stroke: theme.border,
          strokeWidth: 2,
        }),
        // Every individual offering — the distribution a bar destroys.
        Plot.dot(spread, {
          x: 'rating',
          y: 'name',
          r: 2.5,
          fill: theme.mutedForeground,
          fillOpacity: 0.4,
        }),
        // The weighted mean.
        Plot.dot(plottable, {
          x: (d) => d.score.value.weighted,
          y: 'name',
          r: 5,
          // Every dot here IS a faculty member — so `faculty`, not brand. Brand is
          // reserved for the SUBJECT of a view, and a leaderboard has no subject.
          fill: (d) => (d.score.value.weighted < median ? theme.warn : theme.faculty),
          stroke: theme.card,
          strokeWidth: 1.5,
          channels: {
            Weighted: (d) => fmt2(d.score.value.weighted),
            'Simple mean': (d) => fmt2(d.score.value.simple),
            Offerings: (d) => d.offerings,
            Courses: (d) => d.courses,
            'Response rate': (d) => `${d.responseRate}%`,
          },
          tip: {
            format: { x: false, y: true, fill: false, r: false },
          },
        }),
        // The median is the anchor — hiding it removes the reason the amber dots are amber.
        Plot.ruleX([median], { stroke: theme.rule, strokeDasharray: '4,4' }),
        Plot.text([`median ${fmt2(median)}`], {
          x: median,
          frameAnchor: 'top',
          dy: -8,
          dx: 4,
          fill: theme.mutedForeground,
          fontSize: CHART_TICK_FONT_SIZE,
          textAnchor: 'start',
        }),
        // Value label — readable without hovering (A11Y-008). Pinned to the right frame
        // rather than offset from the dot: a dot-relative label collides with the median
        // rule and with neighbouring labels whenever scores cluster, which they do.
        Plot.text(plottable, {
          y: 'name',
          text: (d) => fmt2(d.score.value.weighted),
          frameAnchor: 'right',
          dx: 34,
          fill: theme.foreground,
          fontSize: CHART_TICK_FONT_SIZE,
          textAnchor: 'end',
        }),
      ],
    }),
    [faculty, spread, order, plottable, median],
  )

  if (!faculty.length) return <ChartEmpty note="No faculty with evaluated offerings yet." />

  return (
    <PlotFigure
      spec={spec}
      height={height ?? Math.max(160, faculty.length * 34 + 40)}
      leoAnchor={leoAnchor}
      leoFamily="scatter"
    />
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Story 8 — Gap analysis (marked NEW on the task list; the legacy app already had it).
   Q: "Who is an outlier across two variables?" → RUBRIC Q2 → scatter with quadrants.
   A: redesign the curriculum vs coach the instructor — two different interventions.

   The upgrade over a plain quadrant scatter: a regression line with its confidence band.
   Quadrants alone tell you a course is low. The band tells you whether it is low *for
   its own kind* — a 3.6 sitting on the trend is a hard course; a 3.6 sitting below the
   band is anomalous. Only off-trend points get labelled, so the eye goes to the story.
   ════════════════════════════════════════════════════════════════════════════ */

export function GapQuadrant({
  points,
  courseMean,
  facultyMean,
  height = 320,
  leoAnchor,
}: {
  points: GapPoint[]
  courseMean: number
  facultyMean: number
  height?: number
  leoAnchor?: { x: unknown; y: unknown }
}) {
  /**
   * Residual from the fitted line — off-trend, not merely low.
   *
   * `outliers` colours the dots; `labelled` is a strict subset that gets text. Once the data
   * has real structure a threshold flags a dozen points, and labelling a dozen is a pile-up,
   * not annotation — so only the MOST extreme few are named. VIZ-002 says draw the outlier on
   * the viz; it does not say name every one. The rest keep their amber fill and their tooltip.
   */
  const { outliers, labelled } = React.useMemo(() => {
    const empty = { outliers: new Set<string>(), labelled: new Set<string>() }
    if (points.length < 3) return empty
    const xs = points.map((p) => p.courseAvg)
    const ys = points.map((p) => p.facultyAvg)
    const n = xs.length
    const mx = xs.reduce((s, v) => s + v, 0) / n
    const my = ys.reduce((s, v) => s + v, 0) / n
    const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
    const slope = den === 0 ? 0 : xs.reduce((s, x, i) => s + (x - mx) * (ys[i]! - my), 0) / den
    const intercept = my - slope * mx
    const scored = points.map((p) => ({
      key: p.courseCode,
      residual: Math.abs(p.facultyAvg - (slope * p.courseAvg + intercept)),
    }))
    const sd = Math.sqrt(scored.reduce((s, r) => s + r.residual ** 2, 0) / scored.length)
    if (!(sd > 0)) return empty
    const off = scored.filter((r) => r.residual > sd * 1.2)
    const top = [...off].sort((a, b) => b.residual - a.residual).slice(0, MAX_PLOT_LABELS)

    return {
      outliers: new Set(off.map((r) => r.key)),
      labelled: new Set(top.map((r) => r.key)),
    }
  }, [points])

  /* Fit both axes to the plotted courses (means always fall inside), so the dots use the
     frame instead of huddling in the middle third of a fixed 3–5 grid. */
  const xDomain = React.useMemo(
    () => paddedDomain([...points.map((p) => p.courseAvg), courseMean], 0.8),
    [points, courseMean],
  )
  const yDomain = React.useMemo(
    () => paddedDomain([...points.map((p) => p.facultyAvg), facultyMean], 0.8),
    [points, facultyMean],
  )

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 44,
      marginBottom: 36,
      /*
        A tall top margin, sized from MEASURED pixels rather than guessed — three attempts at
        this by eye each looked plausible and each still collided.

        Both top corners are contested by construction: the Leo chip and the widest-gap course
        fight for top-LEFT, "Both strong" and the highest-scoring course fight for top-RIGHT,
        because a corner label and the extreme point in that corner want the same pixels.

        The measured layout: the chip is clamped ~15px under the SVG top and is 28px tall
        (158–186 at the observed geometry). So the labels have to sit BELOW it, just above the
        frame line, and the margin has to be tall enough to put the frame there. 52px does it;
        the labels land clear of the chip and above the topmost dot's own label.
      */
      marginTop: 52,
      marginRight: 20,
      x: { domain: xDomain, label: 'Course content score →', labelAnchor: 'center' as const, ...axisDefaults(theme) },
      y: { domain: yDomain, label: '↑ Faculty score', labelAnchor: 'center' as const, ...axisDefaults(theme) },
      r: { range: [4, 11] },
      marks: [
        gridMark(theme),

        // Quadrant split at the program means.
        Plot.ruleX([courseMean], { stroke: theme.rule, strokeDasharray: '4,4' }),
        Plot.ruleY([facultyMean], { stroke: theme.rule, strokeDasharray: '4,4' }),

        /*
          Quadrant labels — muted, so they read as scaffolding not data. Top two live in the
          band opened by marginTop (see above); bottom two sit inside the frame, where no
          overlay competes. Verified by asserting bounding boxes don't intersect, not by eye —
          my first two attempts at this both looked plausible and both still collided.
        */
        Plot.text(['Faculty strong · course gap'], {
          frameAnchor: 'top-left', dx: 0, dy: -3, fill: theme.mutedForeground,
          fontSize: CHART_TICK_FONT_SIZE, textAnchor: 'start',
        }),
        Plot.text(['Both strong'], {
          frameAnchor: 'top-right', dx: 0, dy: -3, fill: theme.mutedForeground,
          fontSize: CHART_TICK_FONT_SIZE, textAnchor: 'end',
        }),
        Plot.text(['Both need attention'], {
          frameAnchor: 'bottom-left', dx: 6, dy: -6, fill: theme.mutedForeground,
          fontSize: CHART_TICK_FONT_SIZE, textAnchor: 'start',
        }),
        Plot.text(['Course strong · faculty gap'], {
          frameAnchor: 'bottom-right', dx: -6, dy: -6, fill: theme.mutedForeground,
          fontSize: CHART_TICK_FONT_SIZE, textAnchor: 'end',
        }),

        /*
          NO REGRESSION LINE HERE, deliberately — it used to draw `linearRegressionY` with a
          95% band and it argued against the card's own thesis.

          Measured on this data: Pearson r = 0.114, r² = 0.013. Course-content score explains
          1.3% of faculty-score variance. The fit was noise, so the band rendered as an
          enormous grey hourglass that swallowed the median crosshairs — the very lines that
          define the four quadrants — while the flat line inside it invited the reader to see a
          trend the band itself was denying.

          The deeper problem is semantic. This card exists to SEPARATE course quality from
          instructor quality ("two problems, two different fixes"). A regression asserts that
          one PREDICTS the other — the opposite claim. r² = 0.013 is not a missing finding, it
          IS the finding, and the honest way to show independence is a quadrant with median
          crosshairs, not a fitted line through a cloud.
        */

        Plot.dot(points, {
          x: 'courseAvg',
          y: 'facultyAvg',
          r: 'enrolled',
          // One dot per COURSE — content, not brand.
          fill: (d: GapPoint) => (outliers.has(d.courseCode) ? theme.warn : theme.content),
          fillOpacity: 0.72,
          stroke: theme.card,
          strokeWidth: 1.25,
          channels: {
            Course: (d: GapPoint) => `${d.courseCode} · ${d.courseName}`,
            Terms: 'terms',
            'Course score': (d: GapPoint) => fmt2(d.courseAvg),
            'Faculty score': (d: GapPoint) => fmt2(d.facultyAvg),
            Enrolled: 'enrolled',
          },
          tip: { format: { x: false, y: false, r: false, fill: false } },
        }),

        // Name only the sharpest few — see the note on `labelled`.
        Plot.text(
          points.filter((p) => labelled.has(p.courseCode)),
          {
            x: 'courseAvg',
            y: 'facultyAvg',
            text: 'courseCode',
            dy: -15,
            fill: theme.foreground,
            fontSize: CHART_TICK_FONT_SIZE,
            stroke: theme.card,
            strokeWidth: 3,
            paintOrder: 'stroke',
          },
        ),
      ],
    }),
    [points, courseMean, facultyMean, outliers, labelled, xDomain, yDomain],
  )

  if (points.length < 3) {
    return (
      <ChartEmpty note="Needs at least three evaluated offerings before a course-vs-faculty pattern means anything." />
    )
  }

  return <PlotFigure spec={spec} height={height} leoAnchor={leoAnchor} leoFamily="scatter" />
}

/* ════════════════════════════════════════════════════════════════════════════
   Story 4 — Course quality across terms.
   Q: "Where are the gaps across two dimensions?" → RUBRIC Q3 → heatmap (VIZ-PATTERN-001).
   A: open the weak cell's result page.

   Fill uses the DS heatmap ramp (`heatmapCellColor`, card → brand) so this matches the
   DS heatmap rather than inventing a second scale — and it has no red in it, which the
   legacy app's red→amber→green ramp did (a direct VIZ-004 conflict).
   Rows are ordered worst → best so the problem courses band together.
   ════════════════════════════════════════════════════════════════════════════ */

export interface DriftRow {
  label: string
  avg1y: number | null
  avg3y: number | null
  drift: number | null
}

export function DriftDumbbell({
  rows,
  height,
  emptyNote = 'Not enough history to compare windows.',
}: {
  rows: DriftRow[]
  height?: number
  emptyNote?: string
}) {
  const usable = React.useMemo(
    () =>
      rows
        .filter((r): r is DriftRow & { avg1y: number; avg3y: number; drift: number } =>
          r.avg1y != null && r.avg3y != null && r.drift != null,
        )
        .sort((a, b) => a.drift - b.drift),
    [rows],
  )

  const order = React.useMemo(() => usable.map((r) => r.label), [usable])

  /**
   * THE AXIS IS THE CHANGE, not the score. This is the fix for a chart that was decorative.
   *
   * It used to plot absolute means (3-year dot → 1-year dot on a score axis, zoomed to the
   * data). That puts TWO variables on one axis — a person's LEVEL and their CHANGE — and
   * level wins: levels spread ~1.0 across this roster while drifts are ±0.25, so four of six
   * arrows rendered as a 9px smudge of two overlapping dots. Screenshot, not tsc, caught it.
   *
   * The card already disclaimed level in its own description ("this says nothing about who is
   * lowest") — and then scaled to level anyway. That was the incoherence. Scale to the one
   * variable the card is actually about and every arrow becomes readable and comparable:
   * each runs from 0 (their own 3-year baseline) to their drift.
   *
   * Symmetric around zero so "fell 0.25" and "rose 0.25" are mirror-length. An asymmetric
   * domain would make a small rise look like a big one.
   */
  const domain = React.useMemo<[number, number]>(() => {
    if (!usable.length) return [-0.5, 0.5]
    const widest = Math.max(...usable.map((r) => Math.abs(r.drift)))
    const half = Math.max(widest * 1.35, 0.15)
    return [-half, half]
  }, [usable])

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 132,
      marginRight: 56,
      marginTop: 20,
      x: {
        domain,
        label: null,
        ticks: 5,
        // Signed ticks — the axis must read as change, not as a score anyone scored.
        tickFormat: (d: number) => (d === 0 ? '0' : `${d > 0 ? '+' : ''}${d.toFixed(2)}`),
        ...axisDefaults(theme),
      },
      y: { domain: order, label: null, ...axisDefaults(theme) },
      marks: [
        gridMark(theme),
        // Zero — every arrow's origin, and the line the whole chart is read against.
        Plot.ruleX([0], { stroke: theme.rule, strokeWidth: 1 }),
        // Where they were: their own baseline, which on a change axis is always zero.
        Plot.dot(usable, {
          x: () => 0,
          y: 'label',
          r: 3.5,
          fill: theme.card,
          stroke: theme.mutedForeground,
          strokeWidth: 1.5,
        }),
        // Where they are now — arrow carries direction + magnitude.
        Plot.arrow(usable, {
          x1: () => 0,
          x2: 'drift',
          y1: 'label',
          y2: 'label',
          // Declined = amber; improved = neutral, NOT green. Green means "faculty" across
          // this set (see PlotTheme's semantic contract), and a drift chart's story is the
          // decline — only the exception earns colour.
          stroke: (d: (typeof usable)[number]) => (d.drift < 0 ? theme.warn : theme.mutedForeground),
          strokeWidth: 2,
          headLength: 6,
          insetEnd: 4,
        }),
        Plot.dot(usable, {
          x: 'drift',
          y: 'label',
          r: 4.5,
          fill: (d: (typeof usable)[number]) => (d.drift < 0 ? theme.warn : theme.mutedForeground),
          stroke: theme.card,
          strokeWidth: 1.5,
          channels: {
            '3-year mean': (d: (typeof usable)[number]) => fmt2(d.avg3y),
            '1-year mean': (d: (typeof usable)[number]) => fmt2(d.avg1y),
            Change: (d: (typeof usable)[number]) => `${d.drift >= 0 ? '+' : ''}${fmt2(d.drift)}`,
          },
          tip: { format: { x: false, y: true, fill: false, r: false } },
        }),
        // Delta as text — direction must not rely on the arrow color alone (A11Y-008).
        // Right-gutter aligned so the deltas read as a column.
        Plot.text(usable, {
          y: 'label',
          text: (d: (typeof usable)[number]) => `${d.drift >= 0 ? '+' : ''}${fmt2(d.drift)}`,
          frameAnchor: 'right',
          dx: 40,
          fill: theme.foreground,
          fontSize: CHART_TICK_FONT_SIZE,
          textAnchor: 'end',
        }),
      ],
    }),
    [usable, order, domain],
  )

  if (!usable.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyNote}</p>
  }

  return <PlotFigure spec={spec} height={height ?? Math.max(140, usable.length * 32 + 40)} />
}

/* ════════════════════════════════════════════════════════════════════════════
   Stories 5, 6, 7 — the program's trajectory.
   Q: "How is X changing over time?" → RUBRIC Q4 → line.
   A: investigate the term where the lines diverge.

   Two stacked plots on ONE shared term axis: scores (1–5) above, response rate (0–100)
   below. They are different units, so a single chart would need a dual y-axis — which
   VIZ-011 bans outright and the RUBRIC tells you to "split into small multiples". This
   is that split, but kept vertically aligned so you can still read "the response rate
   collapsed the same term the score dipped" — the story two separate cards would hide.
   ════════════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════════════
   Story 13's response half, for By Term.

   The By Term panel charted "Program trend" (course avg vs faculty avg) and then reported
   response rate as a single KPI delta chip. RUBRIC Q4's ❌ is exactly that: "single % delta
   with arrow — hides the path; a drop-and-recovery looks identical to flat". The story asks
   for "term avg score AND response trends"; only the score half was a trend.

   It sits BESIDE the score card rather than under it, which also retires the last 100%-width
   line chart on this tab (Romit: a line chart doesn't earn full width).

   Not `ProgramTrendStack` (the Overview component): that one already carries score AND rate,
   so dropping it here would put two cards answering the score question on one panel. This is
   the complement to what's already there, not a second copy of it.
   ════════════════════════════════════════════════════════════════════════════ */

export function ProgramResponseTrend({
  series,
  target = 80,
  scopedTerm,
  height = 168,
}: {
  series: TermSeriesPoint[]
  target?: number
  /** The term(s) the tab is scoped to — marked so the trend reads as context around them. A
   *  bare string is one term (the original shape); an array highlights every one the page-level
   *  AY/Term selector has picked (Course Analytics threads that selection down here, same
   *  scope Overview's own `TermRatingTrend`/`TermResponseTrend` already highlight with their
   *  `scopedTerms` array prop — this just gives the singular-named prop the same range). */
  scopedTerm?: string | string[]
  height?: number
}) {
  const rows = React.useMemo(
    () =>
      series
        .filter((s) => s.responseRate != null)
        .map((s) => ({ term: s.term, short: s.short, value: s.responseRate as number })),
    [series],
  )
  const termOrder = React.useMemo(() => rows.map((r) => r.short), [rows])
  const scopedTerms = React.useMemo(
    () => (scopedTerm == null ? [] : Array.isArray(scopedTerm) ? scopedTerm : [scopedTerm]),
    [scopedTerm],
  )
  const scopedShorts = React.useMemo(
    () => rows.filter((r) => scopedTerms.includes(r.term)).map((r) => r.short),
    [rows, scopedTerms],
  )

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 34,
      marginTop: 16,
      marginBottom: 26,
      marginRight: 12,
      x: { domain: termOrder, label: null, ...axisDefaults(theme) },
      // Same 45–100 window as the roster chart: the question is "which terms missed the bar",
      // and a zero baseline spends half the panel on rates nobody has recorded. The target
      // rule is what makes the truncated axis honest — you read against 80%, not the floor.
      y: { domain: [45, 100], label: null, ticks: [50, 80], tickFormat: (d: number) => `${d}%`, ...axisDefaults(theme) },
      marks: [
        gridMark(theme),
        // The scoped term(s), marked before everything else so they read as ground, not figure.
        ...(scopedShorts.length
          ? [Plot.ruleX(scopedShorts, { stroke: theme.border, strokeWidth: 12, strokeOpacity: 0.55 })]
          : []),
        Plot.ruleY([target], { stroke: theme.rule, strokeDasharray: '4,4', strokeOpacity: 0.8 }),
        // frameAnchor, NOT `x: termOrder[0]`. In Plot a string option is a FIELD ACCESSOR, so
        // `x: 'Sp 24'` looks up a field named "Sp 24", finds undefined, and silently drops the
        // mark — the rule drew and its label vanished with no error. Caught by counting text
        // nodes in the rendered SVG, which is why the check is "did it render", not "did it
        // compile".
        Plot.text([`target ${target}%`], {
          frameAnchor: 'left', y: target, dy: -7, dx: 4,
          fill: theme.mutedForeground, fontSize: CHART_TICK_FONT_SIZE, textAnchor: 'start',
        }),
        Plot.line(rows, { x: 'short', y: 'value', stroke: theme.rate, strokeWidth: 2, curve: 'monotone-x' }),
        Plot.dot(rows, {
          x: 'short', y: 'value', r: 3,
          // Colour is never the only encoding (A11Y-008) — the target rule carries the same
          // fact positionally, so a dot below the line reads as below without the amber.
          fill: (d: { value: number }) => (d.value < target ? theme.warn : theme.rate),
          channels: { Term: 'term', 'Response rate': (d: { value: number }) => `${d.value}%` },
          tip: { format: { x: false, y: false, fill: false, r: false } },
        }),
      ],
    }),
    [rows, termOrder, target, scopedShorts],
  )

  if (!rows.length) return <ChartEmpty note="No response history recorded yet." />

  return <PlotFigure spec={spec} height={height} />
}

// Shared between the gradient's `userSpaceOnUse` pixel math and the
// AreaChart's own `margin` prop below - they must stay identical, or the
// gradient's y1/y2 stop won't line up with where the axis actually renders.
const DASHBOARD_TREND_MARGIN = { top: 20, right: 12, left: 34, bottom: 26 }

const DASHBOARD_TREND_CONFIG: ChartConfig = {
  above: { label: 'On target', color: 'var(--chart-2)' },
  /* Literal red (`--destructive`), NOT the file's usual VIZ-004/Aarti amber
     house rule — a deliberate, scoped exception for this one chart only
     (Romit, 2026-09-11: "switch", after being shown the Aarti-red conflict
     and choosing to override it here). Every OTHER chart in this file, and
     Exam Management, still follows the amber rule — do not propagate this
     past this one config without the same explicit confirmation. */
  below: { label: 'Below target', color: 'var(--destructive)' },
}

// "Spring 2026" -> "Spring '26" - the reference's fuller axis label. Exported
// because the Leo anchor's `xValue` must match this string EXACTLY (the
// overlay resolves x by axis-tick textContent, see `ChartLeoPlotInsightOverlay`
// usage below) - a second inline copy of this regex elsewhere would silently
// drift out of sync with what the axis actually renders.
export const dashboardTrendLabel = (term: string) => term.replace(/(\d{2})(\d{2})$/, "'$2")

interface DashboardTrendPoint { x: number; long: string; value: number; crossing?: boolean }
export interface DashboardTrendRun { above: boolean; key: string; points: DashboardTrendPoint[] }

/** Splits a series into contiguous above/below-target runs, inserting ONE
 *  linearly-interpolated point at every crossing so consecutive runs SHARE
 *  that exact point — segments touch precisely on the target line with no
 *  gap and no overlap, matching the reference's construction (confirmed live
 *  via its rendered DOM: separate solid-colored `<path>` segments, not one
 *  continuous curve tinted by a position-based gradient — that band-not-
 *  segment approach was this chart's own prior attempt, reverted here
 *  because it painted a horizontal wash instead of following the real
 *  above/below shape, 2026-09-02). Exported for testability. */
export function splitAtTarget(
  rows: { long: string; value: number }[],
  target: number,
): DashboardTrendRun[] {
  if (!rows.length) return []
  const isAbove = (v: number) => v >= target
  const runs: DashboardTrendRun[] = []
  let current: DashboardTrendRun = {
    above: isAbove(rows[0].value),
    key: 'run0',
    points: [{ x: 0, long: rows[0].long, value: rows[0].value }],
  }
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i]
    const b = rows[i + 1]
    const aAbove = isAbove(a.value)
    const bAbove = isAbove(b.value)
    if (aAbove !== bAbove) {
      const t = (target - a.value) / (b.value - a.value)
      const crossPoint: DashboardTrendPoint = { x: i + t, long: '', value: target, crossing: true }
      current.points.push(crossPoint)
      runs.push(current)
      current = { above: bAbove, key: `run${runs.length}`, points: [crossPoint] }
    }
    current.points.push({ x: i + 1, long: b.long, value: b.value })
  }
  runs.push(current)
  return runs
}

/**
 * Dashboard hero variant of the response-rate trend - full 0-100 axis,
 * per-run above/below-target gradient segments, and this codebase's real
 * Leo-insight overlay on the worst term (not a hand-rolled callout — see
 * below). A dedicated export rather than a `ProgramResponseTrend` prop so
 * the three existing Analytics call sites (`analytics-panels.tsx`,
 * `analytics-overview-panel.tsx`) keep their current axis/label behaviour
 * unchanged - this chart answers a different question (the dashboard's
 * single hero trend, glanced at daily) than the Analytics page's denser
 * multi-chart grid, so it earns its own row here rather than a branch in
 * the shared one.
 *
 * Built on Recharts + `ChartContainer` (`@exxatdesignux/ui/components/ui/chart`)
 * rather than this file's usual Observable Plot - that's the DS's own chart
 * wrapper (already used the same way by `micro-trend.tsx`, `faculty-profile-
 * dashboard.tsx`, `question-chart-block.tsx`), and it's what the
 * exxat-surveys-24f.pages.dev reference this chart matches is itself built
 * on (confirmed live via its rendered `.recharts-wrapper`/`<linearGradient>`
 * DOM, 2026-09-02) - Plot was the wrong engine choice for this one chart.
 *
 * Gradient recipe matches the reference's own `<linearGradient>` defs
 * (5%/95% stop-opacity 0.35->0.02, vertical) with one deviation: the
 * reference's below-target stop is literal `var(--destructive)` (red) -
 * substituted here for `--chart-4` (amber) per the file-wide no-red rule.
 *
 * Real Leo, not a hand-rolled pill: this chart previously drew its own
 * `<ReferenceDot label={...}>` callout on the worst term — a from-scratch
 * copy of a pattern this codebase already has a real, shared component for
 * (`ChartLeoPlotInsightOverlay`, used exactly this way by
 * `app/(app)/analytics/programmatic/page.tsx`). Replaced below; the caller
 * (`OperationsDashboardBody`) builds the `ChartLeoInsight` and passes it
 * through `ChartCard`/`ChartFigure`, same double-wire that reference uses.
 */
export function DashboardResponseTrend({
  series,
  target = RESPONSE_TARGET,
  height = 220,
}: {
  series: TermSeriesPoint[]
  target?: number
  height?: number
}) {
  const rows = React.useMemo(
    () =>
      series
        .filter((s) => s.responseRate != null)
        .map((s) => ({ long: dashboardTrendLabel(s.term), value: s.responseRate as number })),
    [series],
  )
  const runs = React.useMemo(() => splitAtTarget(rows, target), [rows, target])

  // Flatten every run's points into one shared data array, one row per
  // distinct x — a crossing point is written by BOTH the run that ends
  // there and the run that starts there, so their two `<Area dataKey>`
  // columns both have a real value at that x and the paths touch exactly,
  // with every other run's column left `null` there (Area/`connectNulls=
  // false` treats null as "nothing to draw," not zero).
  const chartData = React.useMemo(() => {
    // `crossing` is 1/undefined, not boolean — `ChartLeoPlotInsightOverlay`'s
    // `data` prop is typed `Record<string, string | number | null | undefined>[]`.
    const byX = new Map<number, Record<string, number | string | null | undefined>>()
    for (const run of runs) {
      for (const p of run.points) {
        const row = byX.get(p.x) ?? { x: p.x, long: p.long, crossing: p.crossing ? 1 : undefined }
        row[run.key] = p.value
        if (p.long) row.long = p.long
        byX.set(p.x, row)
      }
    }
    for (const row of byX.values()) {
      for (const run of runs) if (!(run.key in row)) row[run.key] = null
    }
    return [...byX.values()].sort((a, b) => (a.x as number) - (b.x as number))
  }, [runs])

  const plotTop = DASHBOARD_TREND_MARGIN.top
  const plotBottom = height - DASHBOARD_TREND_MARGIN.bottom

  if (!rows.length) return <ChartEmpty note="No response history recorded yet." />

  return (
    <div className="relative w-full">
      <ChartContainer config={DASHBOARD_TREND_CONFIG} style={{ height }} className="w-full">
        <AreaChart data={chartData} margin={DASHBOARD_TREND_MARGIN}>
          <defs>
            {/* One gradient per TONE (above/below), not per run — every run
                of a given tone reuses the same fade, matching the reference's
                per-segment fill exactly without redefining it per segment. */}
            {(['above', 'below'] as const).map((tone) => (
              <linearGradient
                key={tone} id={`dashboardTrendFill-${tone}`}
                x1="0" y1={plotTop} x2="0" y2={plotBottom} gradientUnits="userSpaceOnUse"
              >
                <stop offset="5%" stopColor={`var(--color-${tone})`} stopOpacity={0.35} />
                <stop offset="95%" stopColor={`var(--color-${tone})`} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
          {/* Numeric, not categorical — a crossing point sits at a fractional
              index (e.g. x=1.4), which a category axis can't place. Points
              still land exactly where a categorical axis would (integer x),
              this only adds room for the interpolated in-between points. */}
          <XAxis
            dataKey="x"
            type="number"
            domain={rows.length > 1 ? [0, rows.length - 1] : [-0.5, 0.5]}
            ticks={rows.map((_, i) => i)}
            tickFormatter={(i: number) => rows[i]?.long ?? ''}
            tick={{ fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(d: number) => `${d}%`}
            tick={{ fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }}
            tickLine={false}
            axisLine={false}
          />
          {/* Reference lines use `--muted-foreground`, never `--border`
              (A11Y-021: --border about 1.2:1) - house rule, top of this file. */}
          <ReferenceLine
            y={target}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.8}
            label={{
              value: `Target ${target}%`,
              position: 'insideTopRight',
              fill: 'var(--muted-foreground)',
              fontSize: CHART_TICK_FONT_SIZE,
            }}
          />
          {runs.map((run) => (
            <Area
              key={run.key}
              dataKey={run.key}
              type="monotone"
              connectNulls={false}
              isAnimationActive={false}
              stroke={run.above ? 'var(--color-above)' : 'var(--color-below)'}
              strokeWidth={2}
              fill={`url(#dashboardTrendFill-${run.above ? 'above' : 'below'})`}
              dot={(props: { cx?: number; cy?: number; payload?: { crossing?: number } }) =>
                props.payload?.crossing ? (
                  // Construction point, not real data — no dot drawn for it.
                  <g key={`x-${props.cx}`} />
                ) : (
                  <circle
                    key={`d-${props.cx}`}
                    cx={props.cx}
                    cy={props.cy}
                    r={3}
                    fill={run.above ? 'var(--color-above)' : 'var(--color-below)'}
                  />
                )
              }
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ChartContainer>
      {/* Real Leo overlay (pill + dashed connector + dot), not a hand-rolled
          copy — reads `leoInsight` from the `ChartLeoInsightOverlay` context
          `ChartFigure` already provides (see the caller in
          `OperationsDashboardBody`). Renders nothing when no insight is set. */}
      <ChartLeoPlotInsightOverlay data={chartData} xDataKey="long" chartFamily="line" />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Term-scoped Overview (2026-09-14 PRD) — Recharts, not this file's usual Plot.

   Romit, 2026-09-14: "ensure the chart types are matching and use recharts."
   Checked the https://pce-three.vercel.app/analytics-2 reference's own rendered
   DOM first (`svg.highcharts-root`) — it's Highcharts, not Recharts, so this
   isn't a library-for-library match. It's "use this codebase's own Recharts
   convention" (`DashboardResponseTrend` above, built on the same `ChartContainer`
   from `@exxatdesignux/ui/components/ui/chart`) rather than Plot for these four
   — Overview's own components, not the shared `KpiSpark`/`ProgramScoreTrend`/
   `ProgramResponseTrend`/`GapQuadrant` still used by By Term/By Faculty/By
   Course, which stay on Plot unchanged (same reasoning `DashboardResponseTrend`'s
   own comment gives for not becoming a branch in the shared components).
   ════════════════════════════════════════════════════════════════════════════ */

export function TermKpiSpark({
  points,
  tone = 'brand',
  seriesIndex,
  height = 34,
}: {
  points: { x: number; y: number }[]
  tone?: 'brand' | 'warn' | 'good'
  /** Pin to a `--chart-N` series colour so a metric keeps one identity across the tab —
   *  same reasoning as the Plot `KpiSpark` this replaces. */
  seriesIndex?: number
  height?: number
}) {
  if (points.length < 3) {
    return (
      <p className="py-2 text-xs text-muted-foreground">
        {points.length <= 1 ? 'One term of data. No trend yet.' : 'Two terms of data. Not enough for a trend.'}
      </p>
    )
  }
  const color =
    seriesIndex != null
      ? `var(--chart-${seriesIndex + 1})`
      : tone === 'warn'
        ? 'var(--chart-4)'
        : tone === 'good'
          ? 'var(--chart-3)'
          : 'var(--brand-color)'
  const yVals = points.map((p) => p.y)
  const domain: [number, number] = [Math.min(...yVals) * 0.96, Math.max(...yVals) * 1.04]
  return (
    <ChartContainer config={{ y: { color } }} style={{ height }} className="w-full">
      <LineChart data={points} margin={{ top: 4, right: 1, bottom: 4, left: 1 }}>
        <YAxis domain={domain} hide />
        <Line
          type="monotone"
          dataKey="y"
          stroke="var(--color-y)"
          strokeWidth={1.5}
          isAnimationActive={false}
          dot={(props: { cx?: number; cy?: number; index?: number }) =>
            props.index === points.length - 1 ? (
              <circle key={`spark-dot-${props.index}`} cx={props.cx} cy={props.cy} r={2.5} fill={color} />
            ) : (
              <React.Fragment key={`spark-empty-${props.index}`} />
            )
          }
        />
      </LineChart>
    </ChartContainer>
  )
}

const TERM_RATING_TREND_CONFIG: ChartConfig = {
  courseAvg: { label: 'Course', color: 'var(--chart-1)' },
  facultyAvg: { label: 'Faculty', color: 'var(--chart-2)' },
}

/** Course + faculty rating, term only — no program-average line (PRD: students rate two
 *  distinct things; a third blended line answers neither question, same D27/D7 rule the
 *  Plot version already followed) and no AY/Term toggle (PRD drops it). `scopedTerms` marks
 *  every selected term with a fat translucent reference line (Overview's Term filter is a
 *  multi-select — one selected term highlighted is the one-element case), the same "fake band"
 *  technique `DashboardResponseTrend`'s reference line and the Plot version's `scopedTerm` use. */
export function TermRatingTrend({
  series,
  scopedTerms,
  height = 260,
  courseThreshold = RATING_THRESHOLD,
  facultyThreshold = RATING_THRESHOLD,
}: {
  series: TermSeriesPoint[]
  scopedTerms?: string[]
  height?: number
  /** Dotted reference lines (Vishal, 2026-09-15: "dotted line for faculty and course score
   *  thresholds, default to 4.0") — both default to the shared `RATING_THRESHOLD` constant
   *  (pce-analytics.ts, same 4.0 the Dashboard KPI band and Last-closed-term banner already
   *  use), so by default they render as ONE dashed line both series share; pass distinct values
   *  if course/faculty thresholds ever diverge. */
  courseThreshold?: number
  facultyThreshold?: number
}) {
  const rows = React.useMemo(
    () => series.map((s) => ({ short: s.short, term: s.term, courseAvg: s.courseAvg, facultyAvg: s.facultyAvg })),
    [series],
  )
  const scored = rows.filter((r) => r.courseAvg != null || r.facultyAvg != null)
  if (!scored.length) return <ChartEmpty note="Not enough term history to show a trend yet." />

  const vals = scored.flatMap((r) => [r.courseAvg, r.facultyAvg]).filter((v): v is number => v != null)
  // `courseThreshold`/`facultyThreshold` fold into the min/max so the dotted line is never
  // clipped off-domain when every real rating sits comfortably above (or below) it.
  const domain: [number, number] = [
    Math.floor(Math.min(...vals, courseThreshold, facultyThreshold) * 10) / 10 - 0.2,
    Math.ceil(Math.max(...vals, courseThreshold, facultyThreshold) * 10) / 10 + 0.2,
  ]
  const scopedRows = rows.filter((r) => scopedTerms?.includes(r.term))

  return (
    <div className="relative w-full">
      <ChartContainer config={TERM_RATING_TREND_CONFIG} style={{ height }} className="w-full">
        <LineChart data={rows} margin={{ top: 16, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="short"
            tick={{ fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            domain={domain}
            tickFormatter={(v: number) => fmt2(v)}
            tickCount={5}
            tick={{ fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          {scopedRows.map((r) => (
            <ReferenceLine key={r.term} x={r.short} stroke="var(--border)" strokeWidth={14} strokeOpacity={0.55} ifOverflow="visible" />
          ))}
          {/* Course/faculty threshold lines — dotted, in each series' own color so a line reads
              as "that series' floor" without a separate legend entry. Equal by default (both
              4.0), so they draw on top of each other as what looks like one dotted line. */}
          <ReferenceLine
            y={courseThreshold} stroke="var(--color-courseAvg)" strokeDasharray="2 3" strokeOpacity={0.7} ifOverflow="visible"
          />
          <ReferenceLine
            y={facultyThreshold} stroke="var(--color-facultyAvg)" strokeDasharray="2 3" strokeOpacity={0.7} ifOverflow="visible"
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <Line
            dataKey="courseAvg" type="monotone" stroke="var(--color-courseAvg)" strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-courseAvg)', strokeWidth: 0 }} connectNulls isAnimationActive={false}
          />
          <Line
            dataKey="facultyAvg" type="monotone" stroke="var(--color-facultyAvg)" strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-facultyAvg)', strokeWidth: 0 }} connectNulls isAnimationActive={false}
          />
          <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
        </LineChart>
      </ChartContainer>
      <ChartLeoPlotInsightOverlay data={rows} xDataKey="short" chartFamily="line" />
    </div>
  )
}

const TERM_RESPONSE_TREND_CONFIG: ChartConfig = {
  responseRate: { label: 'Response rate', color: 'var(--chart-3)' },
}

export function TermResponseTrend({
  series,
  target = RESPONSE_TARGET,
  scopedTerms,
  height = 260,
}: {
  series: TermSeriesPoint[]
  target?: number
  scopedTerms?: string[]
  height?: number
}) {
  const rows = React.useMemo(
    () =>
      series
        .filter((s) => s.responseRate != null)
        .map((s) => ({ short: s.short, term: s.term, responseRate: s.responseRate as number })),
    [series],
  )
  if (!rows.length) return <ChartEmpty note="No response history recorded yet." />
  const scopedRows = rows.filter((r) => scopedTerms?.includes(r.term))

  return (
    <div className="relative w-full">
      <ChartContainer config={TERM_RESPONSE_TREND_CONFIG} style={{ height }} className="w-full">
        <LineChart data={rows} margin={{ top: 16, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
          <XAxis
            dataKey="short"
            tick={{ fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
          />
          <YAxis
            domain={[45, 100]}
            ticks={[50, 80, 100]}
            tickFormatter={(d: number) => `${d}%`}
            tick={{ fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          {scopedRows.map((r) => (
            <ReferenceLine key={r.term} x={r.short} stroke="var(--border)" strokeWidth={14} strokeOpacity={0.55} ifOverflow="visible" />
          ))}
          <ReferenceLine
            y={target}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.8}
            label={{ value: `target ${target}%`, position: 'insideTopRight', fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <Line
            dataKey="responseRate" type="monotone" stroke="var(--color-responseRate)" strokeWidth={2}
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; index?: number; payload?: { responseRate: number } }) => (
              <circle
                key={`resp-dot-${props.index}`} cx={props.cx} cy={props.cy} r={3}
                fill={(props.payload?.responseRate ?? 0) < target ? 'var(--chart-4)' : 'var(--color-responseRate)'}
              />
            )}
          />
        </LineChart>
      </ChartContainer>
      <ChartLeoPlotInsightOverlay data={rows} xDataKey="short" chartFamily="line" />
    </div>
  )
}

const QUADRANT_CONFIG: ChartConfig = { courseAvg: { label: 'Course rating', color: 'var(--chart-3)' } }

const QUAD_KEYS = ['tl', 'tr', 'bl', 'br'] as const
type QuadKey = (typeof QUAD_KEYS)[number]

export const QUAD_LABELS: Record<QuadKey, string> = {
  tl: 'Faculty strong · course gap',
  tr: 'Both strong',
  bl: 'Both need attention',
  br: 'Course strong · faculty gap',
}

export type QuadrantPalette = 'zone' | 'diverging' | 'marked' | 'domain'

/**
 * Sixth pass (2026-09-14). Round 5 (Opus) misread "unique creative quad charts" as a request
 * for three different chart TYPES (scatter/grid/bar) and built all three — Romit corrected
 * that immediately: "within quadrant map, i want to see color variants. need 3 variants, i
 * don't need grid or gap tabs, but more interested in color palette options for quad map." The
 * chart stays a single scatter (`ScatterChart`, dots in XY space, bubble-sized by enrolment —
 * unchanged since round 1). What toggles is COLOR TREATMENT, same as rounds 2-4, using only
 * the corrected tokens from round 4's audit (ink `--chart-3`, amber `--chart-5`, the DS's
 * `--status-badge-warning-fill`/`-fg` pair) plus, in `domain` only, the two series colors this
 * SAME dashboard already teaches the reader two cards down (`TermRatingTrend`'s own legend:
 * Course = `--chart-1`, Faculty = `--chart-2`):
 *   - `zone` — one amber wash on "Both need attention," the other three quadrants bare card.
 *     Clockwise's Team Habits pattern (single accent on the one risk cell).
 *   - `diverging` — adds a second, cool wash on "Both strong" using the DS's paired
 *     `--status-badge-info-fill`/`-fg`. The two "one dimension lags" quadrants stay bare — a
 *     two-tone good/bad read, not four hues.
 *   - `marked` — zero zone fill anywhere; color moves onto the marks. Only the dots inside
 *     "Both need attention" go amber, everything else stays ink. Hume AI's embedding-plot /
 *     Vanta's colored-count-badge pattern (color spent on marks, not regions).
 *   - `domain` (2026-09-14, round 7 — Romit: "not sure whether the user would understand just
 *     2 colors"; corrected same round — Romit: "how can course strong faculty gap be green?
 *     same goes for faculty strong course gap?"). Zone/Diverging both leave the two "one
 *     dimension lagging" quadrants identical (bare), so a reader can't tell WHICH dimension is
 *     short without reading the corner text. The first cut of `domain` tinted each quadrant
 *     with its LAGGING series' color — `br` ("Course strong · faculty gap") in `--chart-2`,
 *     because faculty is what's short there. That's backwards: `--chart-2` reads as green, and
 *     green is a "this is good" color in every reader's head regardless of which series it's
 *     borrowed from, so painting it on the one cell literally named "gap" contradicts itself.
 *     Fixed by tinting each quadrant with its STRONG series' color instead — `tl` ("Faculty
 *     strong · course gap") washes in `--chart-2` (faculty, the strong one there); `br`
 *     ("Course strong · faculty gap") washes in `--chart-1` (course, the strong one there).
 *     Green now only ever appears where faculty is actually strong, blue only where course is
 *     actually strong — the hue's cultural "good" reading and what it's marking finally agree.
 *     Reusing `TermRatingTrend`'s own legend colors, so the quadrant reads without a second
 *     color key. "Both need attention" keeps the amber wash and its emphasized label; "Both
 *     strong" stays bare — there's no single strong domain to credit when both are strong.
 * Rounds 1-7 never used red (Aarti's standing rule on rating visualizations) — round 8 (below)
 * names one deliberate exception for `domain`'s `bl` quadrant; see that comment for why. */
const ATTENTION_QUAD: QuadKey = 'bl'
const GOOD_QUAD: QuadKey = 'tr'
/** `marked`'s flag dot color — `--chip-4`, not `--chart-5`. Validated (dataviz skill's
 *  `validate_palette.js`, 2026-09-14): `--chart-5` vs `--chart-4` (the other amber this same
 *  file already uses) measure ΔE 8.0 under NORMAL vision — the DS's two ambers are nearly
 *  indistinguishable even with full color vision, floor is 15. `--chip-4` (the saturated,
 *  mark-weight sibling of the same amber, not the pale fill-weight one) against the ink dot
 *  color (`--chart-3`) measures ΔE 17.5 normal-vision / 13.9–15.2 CVD — clears the floor. */
const ATTENTION_FILL = 'var(--chip-4)'
/**
 * `domain` (2026-09-15, round 8 — Vishal, via Romit: "top right corner is all green, top left
 * and bottom right are a tone of amber and bottom left is a tone of red"). Supersedes round 7's
 * strong-series tint above: every quadrant now carries an explicit fill, keyed by OUTCOME
 * (good/mixed/bad) rather than by which series is strong — `tr` (Both strong) green, `tl`/`br`
 * (one dimension lagging) amber, `bl` (Both need attention) red.
 *
 * `bl` = red is a deliberate, named exception to "Never red (Aarti's standing rule on rating
 * visualizations)" documented just above — NOT a silent violation. Precedent for exactly this
 * exception already exists on this same page: `RatingCell` in `analytics-overview-panel.tsx`
 * already uses `--conditional-rule-red` for below-threshold leaderboard cells, sourced from the
 * SAME 2026-09-14 PRD session ("Romit's 2026-09-14 PRD asks for red by name, twice, for these
 * two leaderboards specifically"). This is that same override extended to a third element on
 * the page it already appears on, not a new one. Flagged to Romit/Aarti regardless — if the
 * house rule wins, the `bl` red is the one line to revert.
 *
 * All four fills use the DS's own `--conditional-rule-*` tokens (already pre-mixed to a pale
 * tint) rather than a literal hex/oklch — no `fillOpacity` layered on top, unlike round 7's
 * `DOMAIN_FILL_OPACITY`, since these tokens already carry their own opacity.
 */
const DOMAIN_FILL: Record<QuadKey, string> = {
  tr: 'var(--conditional-rule-green)',
  tl: 'var(--conditional-rule-yellow)',
  br: 'var(--conditional-rule-yellow)',
  bl: 'var(--conditional-rule-red)',
}
/** Label text pairing for each `DOMAIN_FILL` quadrant — the DS's matching `-fg` token per
 *  outcome (`--destructive` for `bl`, since no `--status-badge-danger-fg` exists in this DS). */
const DOMAIN_LABEL_FG: Record<QuadKey, string> = {
  tr: 'var(--status-badge-success-fg)',
  tl: 'var(--status-badge-warning-fg)',
  br: 'var(--status-badge-warning-fg)',
  bl: 'var(--destructive)',
}

function zoneFillFor(key: QuadKey, palette: QuadrantPalette): { fill: string; fillOpacity?: number } {
  if (palette === 'marked') return { fill: 'transparent' }
  if (palette === 'domain') return { fill: DOMAIN_FILL[key] }
  if (key === ATTENTION_QUAD) return { fill: 'var(--status-badge-warning-fill)' }
  if (palette === 'diverging' && key === GOOD_QUAD) return { fill: 'var(--status-badge-info-fill)' }
  return { fill: 'transparent' }
}

function quadrantOf(courseAvg: number, facultyAvg: number, courseMean: number, facultyMean: number): QuadKey {
  if (courseAvg < courseMean) return facultyAvg >= facultyMean ? 'tl' : 'bl'
  return facultyAvg >= facultyMean ? 'tr' : 'br'
}

/** One dot per course, bubble-sized by enrolment, quadrant-split at the term's own means.
 *  Labels stay the subtle, non-judgmental wording the Plot `GapQuadrant` already used
 *  ("Both need attention" / "Course strong · faculty gap") — the PRD's ask to soften the
 *  reference's "Teaching support recommended" tone was already met before this Recharts
 *  rebuild; only the rendering engine changed here.
 *
 *  `palette` toggles between three color treatments of this one chart — see the design-history
 *  comment on `QuadrantPalette` above for the audit behind each one. */
export function CourseFacultyQuadrant({
  points,
  courseMean,
  facultyMean,
  height = 320,
  palette = 'domain',
  square = false,
  hoverMetric = 'enrolled',
  highlightedTerms,
}: {
  points: GapPoint[]
  courseMean: number
  facultyMean: number
  height?: number
  palette?: QuadrantPalette
  /** Square aspect ratio (Vishal 2026-09-15, then re-confirmed by Romit 2026-09-15 after a
   *  detour: full-card-width `aspect-square` first made the card ~1100px tall; a fixed-height
   *  "roomy" mode traded squareness for that back; the REAL fix was changing the surrounding
   *  layout to give this chart a narrower column — `analytics-overview-panel.tsx` now puts the
   *  Rating/Response trend cards beside it instead of below it, so `aspect-square` at that
   *  column's own width is naturally compact again). Opt-in — the two `analytics-panels.tsx`
   *  call sites (a per-course detail view + its zoom dialog, neither mentioned in any of this
   *  feedback) keep the original `height` prop behavior. */
  square?: boolean
  /** Bubble size + tooltip count. Overview's per-COURSE points (`gapPoints`) never carry a real
   *  `responded` figure (it's a multi-term, multi-offering roll-up), so `enrolled` stays the
   *  default there. Course Analytics' per-OFFERING points (`courseOfferingQuadrantPoints`) do
   *  carry one, and Romit asked that dot's hover text say "responded" (2026-09-15) — scoped to
   *  that one call site via this prop rather than changing the shared default. */
  hoverMetric?: 'enrolled' | 'responded'
  /** Course Analytics only (PRD 2026-09-14: "offerings from the selected term/AY should be
   *  highlighted"). Matched against `GapPoint.courseCode`, which on the per-offering points
   *  carries the TERM's short label, not a course code (see `courseOfferingQuadrantPoints`'s
   *  own field-reuse comment). Omit on Overview's per-course points, where `courseCode` is a
   *  real course code and this comparison would never match anything. */
  highlightedTerms?: string[]
}) {
  if (!points.length) return <ChartEmpty note="No courses scored in this term yet." />

  // Fixed 0–5 on both axes (Vishal, 2026-09-15) — ratings are always a 1–5 Likert scale in this
  // product, so a domain that shrinks to a tight window around the actual points (the prior
  // `min/max ± 0.3` calculation) visually exaggerated small differences; 0–5 is the real,
  // consistent scale every reader already knows from every other rating viz in this app.
  const xDomain: [number, number] = [0, 5]
  const yDomain: [number, number] = [0, 5]
  const labelStyle = { fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }
  const cornerLabelStyle = { fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }
  const attentionLabelStyle = { fill: 'var(--status-badge-warning-fg)', fontSize: CHART_TICK_FONT_SIZE, fontWeight: 500 }
  // `diverging` only: "Both strong" picks up the info-fg color to match its cool wash, but
  // stays regular weight — it's informational, not something to act on, so the hierarchy still
  // points at "Both need attention" as the one emphasized label.
  const goodLabelStyle = { fill: 'var(--status-badge-info-fg)', fontSize: CHART_TICK_FONT_SIZE }
  // `domain` only (round 8): every quadrant's label takes its own `DOMAIN_LABEL_FG` text color —
  // NOT `DOMAIN_FILL`, which is now a pale background tint unsuitable as text color. `bl` goes
  // bold (the one quadrant worth acting on); the other three stay regular weight.
  const domainLabelStyle = (key: QuadKey) => ({
    fill: DOMAIN_LABEL_FG[key],
    fontSize: CHART_TICK_FONT_SIZE,
    ...(key === ATTENTION_QUAD ? { fontWeight: 500 } : null),
  })

  const labelStyleFor = (key: QuadKey) => {
    if (palette === 'domain') return domainLabelStyle(key)
    if (key === ATTENTION_QUAD) return attentionLabelStyle
    if (palette === 'diverging' && key === GOOD_QUAD) return goodLabelStyle
    return cornerLabelStyle
  }

  const zoneRect = (key: QuadKey) => {
    const isLeft = key === 'tl' || key === 'bl'
    const isTop = key === 'tl' || key === 'tr'
    const x1 = isLeft ? xDomain[0] : courseMean
    const x2 = isLeft ? courseMean : xDomain[1]
    const y1 = isTop ? facultyMean : yDomain[0]
    const y2 = isTop ? yDomain[1] : facultyMean
    const position = `inside${isTop ? 'Top' : 'Bottom'}${isLeft ? 'Left' : 'Right'}` as const
    return (
      <ReferenceArea
        key={key}
        x1={x1} x2={x2} y1={y1} y2={y2}
        {...zoneFillFor(key, palette)}
        label={{ value: QUAD_LABELS[key], position, offset: 12, ...labelStyleFor(key) }}
      />
    )
  }

  return (
    <div className="relative w-full">
    {/* `aspect-square` (via `cn`'s tailwind-merge) overrides `ChartContainer`'s own baked-in
        `aspect-video` — same "aspect" utility group, so no conflicting inline style needed.
        Square again (Romit, 2026-09-15, third pass on this one chart): now that it shares its
        row with the two trend charts instead of spanning the full card width, a plain
        `aspect-square` sizes itself off this ~half-width column instead of the ~1100px full
        card width that made an earlier `aspect-square` attempt blow up to ~1100px tall. */}
    <ChartContainer config={QUADRANT_CONFIG} style={square ? undefined : { height }} className={square ? 'w-full aspect-square' : 'w-full'}>
      <ScatterChart margin={{ top: 40, right: 20, bottom: 34, left: 48 }}>
        <XAxis
          type="number" dataKey="courseAvg" domain={xDomain} name="Course rating"
          tickFormatter={(v: number) => fmt2(v)}
          label={{ value: 'Course content score →', position: 'insideBottom', offset: -10, ...labelStyle }}
          tick={{ fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }}
          tickLine={false} axisLine={{ stroke: 'var(--border)' }}
        />
        <YAxis
          type="number" dataKey="facultyAvg" domain={yDomain} name="Faculty rating"
          tickFormatter={(v: number) => fmt2(v)}
          label={{ value: '↑ Faculty score', angle: -90, position: 'insideLeft', ...labelStyle }}
          tick={{ fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }}
          tickLine={false} axisLine={false}
        />
        {/* 90–460, not the old 60–260 — enrolment was rendering across a 4.7px radius span,
            too tight to read as a real encoding rather than noise. Bubble SIZE stays on
            `enrolled` regardless of `hoverMetric` — Romit's ask was scoped to the hover TEXT
            ("the text on hover of a dot, replace enrolled with responded"), not to which count
            sizes the dot. `ZAxis`'s own `name` is unused for display either way: the tooltip
            below is a full custom `content`, not Recharts' default z-axis tooltip line. */}
        <ZAxis type="number" dataKey="enrolled" range={[90, 460]} name="Enrolled" />
        <ReferenceLine
          x={courseMean} stroke="var(--muted-foreground)" strokeOpacity={0.65} strokeDasharray="4 4"
          label={{ value: 'Term mean', position: 'top', fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }}
        />
        <ReferenceLine
          y={facultyMean} stroke="var(--muted-foreground)" strokeOpacity={0.65} strokeDasharray="4 4"
          label={{ value: 'Term mean', position: 'insideBottomRight', fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }}
        />
        {QUAD_KEYS.map(zoneRect)}
        <ChartTooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const p = payload[0]!.payload as GapPoint
            return (
              <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
                <p className="font-medium text-foreground">{p.courseCode} · {p.courseName}</p>
                <p className="text-muted-foreground">Course {p.courseAvg.toFixed(2)} · Faculty {p.facultyAvg.toFixed(2)}</p>
                <p className="text-muted-foreground">
                  {hoverMetric === 'responded' ? (p.responded ?? p.enrolled) : p.enrolled} {hoverMetric === 'responded' ? 'responded' : 'enrolled'}
                </p>
              </div>
            )
          }}
        />
        {/* Dots are `--chart-3` ink in `zone`/`diverging` — they recede so the wash reads as
            the flag. `marked` spends no color on the zone at all, so the flag moves onto the
            marks instead: only dots inside "Both need attention" go amber. */}
        <Scatter data={points} fillOpacity={0.9} stroke="var(--card)" strokeWidth={1.5} isAnimationActive={false}>
          {points.map((p, i) => {
            const fill =
              palette === 'marked'
                ? quadrantOf(p.courseAvg, p.facultyAvg, courseMean, facultyMean) === ATTENTION_QUAD
                  ? ATTENTION_FILL
                  : 'var(--chart-3)'
                : 'var(--chart-3)'
            // Offerings from the selected term/AY (PRD 2026-09-14) — a bold outline, not a
            // color swap, so the encoding survives next to `marked`'s own amber fill and
            // colour is never the only signal (A11Y-008); the data table below still lists
            // every term in plain text regardless.
            const isHighlighted = !!highlightedTerms?.includes(p.courseCode)
            return (
              <Cell
                key={i}
                fill={fill}
                stroke={isHighlighted ? 'var(--foreground)' : 'var(--card)'}
                strokeWidth={isHighlighted ? 2.5 : 1.5}
              />
            )
          })}
        </Scatter>
      </ScatterChart>
    </ChartContainer>
      {/* No `data`/`xDataKey` — a scatter's two free axes don't resolve to one cartesian
          x-lookup the way a term-axis line chart does. Same data-less call this codebase
          already uses for other scatter/bubble charts (`components/charts-overview.tsx`). */}
      <ChartLeoPlotInsightOverlay chartFamily="scatter" />
    </div>
  )
}

/**
 * A one-entity term grid — the By Course "Faculty heat map" (PRD 2026-09-14) AND its By
 * Faculty mirror, "Course heat map" (PRD 2026-09-15). Rows are the other axis's entities
 * (course→instructors, or faculty→courses, best → worst from `courseFacultyHeatCells` /
 * `facultyHeatCells`), columns are terms, cell = that row's score for that term. Built on the
 * ECharts DS heatmap primitive (`ChartHeatmap`) rather than the vendored table variant
 * (`course-term-grid.tsx`) — this file's other charts already wire into `ChartHeatmap`'s Leo-
 * spotting convention.
 *
 * `rows`/`rowLabel` are generic on purpose — this is the SAME component both axes render,
 * not two lookalikes, so a fix to one (color ramp, program-avg row, term windowing) can't
 * drift between them.
 */
export function CourseFacultyHeatmap({
  rows: rowEntities,
  terms,
  cells,
  programAvgByTerm,
  height,
  threshold,
  highlightedCols,
  emptyNote = 'No data scored yet.',
}: {
  rows: string[]
  terms: string[]
  cells: { rowLabel: string; term: string; score: number }[]
  /** Program-average row appended below the entities, for comparison (PRD: "show program
   *  average in each term for easy comparison"). Omit terms with no program value. */
  programAvgByTerm?: Map<string, number>
  height?: number
  /** Pass/fail bar (Romit, 2026-09-15) — switches the ramp to `ChartHeatmap`'s diverging
   *  red/green mode. See `heatmapDivergingColor`'s doc comment for why this is a scoped
   *  exception to this file's own amber-only house rule. */
  threshold?: number
  /** Selected term(s) to highlight (PRD 2026-09-15, both axes) — see `ChartHeatmap`'s own doc
   *  comment. Pass short-term ('Sp 26') strings. */
  highlightedCols?: readonly string[]
  /**
   * Empty-state copy. Defaults to the true-empty wording. The caller's own faculty/role
   * filters can narrow `rows` to nothing while the entity itself has real heat-map data —
   * that's a FILTERED empty, a different fact from "never been scored" (state-review,
   * 2026-09-15: the two were reading identically, which tells the reader to stop looking
   * rather than to clear a filter). The caller knows which case it is; this component
   * doesn't (it only sees the already-filtered `rows` list).
   */
  emptyNote?: string
}) {
  const rows = programAvgByTerm ? [...rowEntities, 'Program average'] : rowEntities
  const scoreByCell = React.useMemo(() => {
    const m = new Map<string, number>()
    cells.forEach((c) => m.set(`${c.rowLabel}::${c.term}`, c.score))
    return m
  }, [cells])

  const matrix = React.useMemo(
    () =>
      rows.map((row) =>
        terms.map((term) =>
          row === 'Program average'
            ? (programAvgByTerm?.get(term) ?? null)
            : (scoreByCell.get(`${row}::${term}`) ?? null),
        ),
      ),
    [rows, terms, scoreByCell, programAvgByTerm],
  )

  const points = React.useMemo(
    () => buildChartHeatmapPoints(rows, terms.map(shortTerm), matrix),
    [rows, terms, matrix],
  )

  if (!rowEntities.length || !terms.length) {
    return <ChartEmpty note={emptyNote} />
  }

  const peakCellIndex = points.reduce(
    (best, p, i) => (p.value != null && p.value > (points[best]?.value ?? Number.NEGATIVE_INFINITY) ? i : best),
    0,
  )

  return (
    <div className="flex flex-col gap-2">
      <ChartHeatmap
        rows={rows}
        cols={terms.map(shortTerm)}
        points={points}
        config={{}}
        peakCellIndex={peakCellIndex}
        valueLabel="Score"
        domain={[1, 5]}
        valueFormatter={fmt2}
        height={height}
        maxVisibleRows={8}
        threshold={threshold}
        highlightedCols={highlightedCols}
      />
      {/* Threshold mode drops ECharts' own gradient legend (a single ramp can't describe a
          split scale) — this text stands in for it, and doubles as the A11Y-008 text
          equivalent for the red/green encoding. */}
      {threshold != null && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium" style={{ color: 'var(--destructive)' }}>Red</span> = below the {threshold.toFixed(1)} threshold, darkest is lowest ·{' '}
          <span className="font-medium" style={{ color: 'var(--chart-2)' }}>Green</span> = at or above, darkest is highest
        </p>
      )}
    </div>
  )
}

const RATING_BINS = [
  { label: '3.0–3.5', min: 3.0, max: 3.5 },
  { label: '3.5–4.0', min: 3.5, max: 4.0 },
  { label: '4.0–4.5', min: 4.0, max: 4.5 },
  { label: '4.5–5.0', min: 4.5, max: 5.01 },
] as const

const HISTOGRAM_CONFIG: ChartConfig = { count: { label: 'Count', color: 'var(--chart-1)' } }

/** Distribution of a leaderboard's own rating column, four fixed bins — the small bar chart
 *  the reference sits above both leaderboard tables (Course and Faculty). */
export function RatingDistributionHistogram({ values, height = 140 }: { values: number[]; height?: number }) {
  const data = React.useMemo(
    () => RATING_BINS.map((b) => ({ label: b.label, count: values.filter((v) => v >= b.min && v < b.max).length })),
    [values],
  )
  if (!values.length) return <ChartEmpty note="No scored rows yet." />
  return (
    <ChartContainer config={HISTOGRAM_CONFIG} style={{ height }} className="w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
        <XAxis dataKey="label" tick={{ fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
        <YAxis allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: CHART_TICK_FONT_SIZE }} tickLine={false} axisLine={false} width={24} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}

/**
 * The cohort's STUDENTS, one cell each — the dimension every other chart here aggregates away.
 *
 * A cohort is n students, n faculty and n courses, and the cohort axis showed none of the
 * three: it rendered `69%` and four scalars. Courses and faculty are N≤30, where the rubric
 * mandates a Cleveland dot (`VIZ-PATTERN-005`) — so those repeat the dot vocabulary by
 * instruction, not by accident. Students are the N>30 case (371 here), and `cleveland-dot.md:25`
 * puts N>30 outside the dot's range. That left the student dimension with no mark at all.
 *
 * A waffle because the question is part-of-whole over countable people: `unit: 1` means one
 * cell IS one student, so the answer is read by counting, not by trusting a percentage. That
 * is D17 verbatim — *"frequency counts > percentages for coverage data"*, "255 of 371" over
 * "69%" — and it satisfies VIZ-010's `n-of-total` requirement that a bare `69%` fails.
 *
 * Not a progress bar (VIZ-P: bars are last resort, and Q1 ❌ *"Progress bar. Hides cohort,
 * hides target, hides trajectory."*). The waffle keeps the individuals visible: a class of 38
 * and a class of 371 look different here, and under a percentage they look identical.
 */
export function CohortStudentWaffle({
  responded,
  enrolled,
  target = RESPONSE_TARGET,
  height = 188,
}: {
  responded: number
  enrolled: number
  target?: number
  height?: number
}) {
  const missing = Math.max(0, enrolled - responded)
  const rows = React.useMemo(
    () => [
      { k: 'Answered', n: responded },
      { k: 'No response', n: missing },
    ],
    [responded, missing],
  )

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 8,
      marginTop: 10,
      marginBottom: 28,
      marginRight: 8,
      // No `x` scale block: the waffle declares no x channel, so it spans the frame. Declaring
      // scale options for an absent channel is how the first version rendered an empty <g>.
      y: { axis: null },
      // Answered earns the colour; the shortfall is left as unfilled ground. Colour is not the
      // only encoding (A11Y-008) — filled vs unfilled cells differ in fill AND position, and
      // the caption carries the counts in text.
      color: {
        domain: ['Answered', 'No response'],
        range: [theme.rate, theme.border],
      },
      marks: [
        Plot.waffleY(rows, {
          y: 'n',
          fill: 'k',
          unit: 1,
          // rx '12%' rounded the cells into circles while the caption said "one square is one
          // student" — the copy and the picture disagreed. 1px keeps them squares.
          rx: 1,
          stroke: theme.card,
          strokeWidth: 0.5,
          channels: { Students: 'n' },
          tip: { format: { y: false, fill: true } },
        }),
      ],
    }),
    [rows],
  )

  if (enrolled <= 0) return <ChartEmpty note="No students enrolled in this cohort yet." />

  const pct = Math.round((responded / enrolled) * 100)
  return (
    <div className="flex flex-col gap-2">
      <PlotFigure spec={spec} height={height} />
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{responded.toLocaleString()}</span> of{' '}
        {enrolled.toLocaleString()} students answered · one square is one student ·{' '}
        {pct >= target ? 'at or above' : `${target - pct} points under`} the {target}% target
      </p>
    </div>
  )
}

/** The N above which a ranked dot plot stops being readable and becomes a wall of rows. */
export const LARGE_ROSTER_N = 30

/**
 * The whole faculty body as one strip — the N>30 mark.
 *
 * `cleveland-dot.md:25` scopes the dot plot to N≤30 and hands anything larger to a strip plot,
 * and the fixture is why that line never bit: it carried SIX faculty, so the leaderboard fit
 * its card by accident of fixture size. Romit, 2026-07-15: a real university or cohort runs
 * faculty "in the 30s". At 34 the dot plot is 34 labelled rows — a scrolling wall that answers
 * "how is the faculty body doing" only if you read all of it.
 *
 * A strip answers that in one line: every faculty member is one tick on the score axis, and
 * OVERLAP IS THE POINT — where ticks pile up is where the body sits, and a lone tick out left
 * is the person to open. No names, deliberately: this is the "short crisp idea" half of the
 * summary→expand pattern, and names arrive on expand.
 *
 * Amber below the median (VIZ-004 — never red), but the median rule carries the same fact
 * positionally, so colour is not the only encoding (A11Y-008).
 */
export function FacultyScoreStrip({
  faculty,
  median,
  height = 132,
  leoAnchor,
}: {
  faculty: FacultyStat[]
  median: number
  height?: number
  leoAnchor?: { x: unknown; y: unknown }
}) {
  // Pending/na faculty have no score to place on the strip — filter them out rather than
  // stacking a phantom tick at 0.
  const rows = React.useMemo(
    () =>
      faculty
        .filter((f): f is typeof f & { score: { state: 'value'; value: DualMean } } => f.score.state === 'value')
        .map((f) => ({ name: f.name, score: f.score.value.weighted })),
    [faculty],
  )

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 12,
      marginRight: 12,
      // 26, not 10: the ticks span the full frame height, so a median label with only 10px of
      // top margin lands ON the densest part of the strip — exactly the cluster it is naming.
      // The label lives in the margin, above the marks.
      marginTop: 26,
      marginBottom: 30,
      x: { domain: SCORE_VIEW, label: null, ticks: [3, 3.5, 4, 4.5, 5], ...axisDefaults(theme) },
      y: { axis: null },
      marks: [
        Plot.ruleX([median], { stroke: theme.rule, strokeDasharray: '4,4', strokeOpacity: 0.9 }),
        Plot.text([`median ${median.toFixed(2)}`], {
          frameAnchor: 'top-left', x: median, dy: -10, dx: 4,
          fill: theme.mutedForeground, fontSize: CHART_TICK_FONT_SIZE, textAnchor: 'start',
        }),
        /* A dodged swarm, not a barcode. 34 full-height ticks read as a glitch ("this viz is
           ugly" — Romit 2026-07-15): overlapping ticks hide people and pile-ups melt into one
           thick line. Dots dodged into a swarm keep the same axis and the same amber/teal
           split, but density becomes visible STACKING — and it is the vocabulary
           BenchmarkDistribution already speaks one card down, so the tab's two distribution
           charts finally match. */
        Plot.dot(
          rows,
          Plot.dodgeY(
            { anchor: 'middle' },
            {
              x: 'score',
              r: 4.5,
              fill: (d: { score: number }) => (d.score < median ? theme.warn : theme.faculty),
              fillOpacity: 0.85,
              stroke: theme.card,
              strokeWidth: 1,
              channels: { Faculty: 'name', Score: (d: { score: number }) => d.score.toFixed(2) },
              tip: { format: { x: false, y: false, fill: false, r: false } },
            },
          ),
        ),
      ],
    }),
    [rows, median],
  )

  if (!rows.length) return <ChartEmpty note="No faculty in scope." />

  return <PlotFigure spec={spec} height={height} leoAnchor={leoAnchor} leoFamily="scatter" />
}

/**
 * Course-vs-faculty score trend only, no response-rate half. Factored out of
 * `ProgramTrendStack` so a card that wants JUST the score line (analytics-panels.tsx's
 * By Term tab, which already has response rate as its own adjacent card) doesn't have to
 * pull in a second charting library to get one — this is the same Plot spec `ProgramTrendStack`
 * renders as its top half, exposed standalone.
 */
export function ProgramScoreTrend({
  series,
  detail = false,
  height,
  scopedTerm,
}: {
  series: TermSeriesPoint[]
  /**
   * Expanded-dialog mode. The card and its Expand dialog must not show the SAME plot at the
   * SAME size — the dialog earns its click with height and with every value labelled in
   * place (Romit, 2026-07-17: "if I see the same minimum info in the dialog, expanding makes
   * no sense"). Density for a fixed-length term series is exact values, not more marks.
   */
  detail?: boolean
  /** Caller-specific sizing — the Overview stack and a standalone score card size differently. */
  height?: number
  /** The term the tab is scoped to, marked so the trend reads as context around it — same
   *  mechanism and prop name as `ProgramResponseTrend`'s `scopedTerm`, so the two trend cards
   *  in the term-scoped Overview (2026-09-14 PRD) highlight the same term identically. */
  scopedTerm?: string
}) {
  const scoreRows = React.useMemo(
    () =>
      series.flatMap((s) => [
        ...(s.courseAvg != null ? [{ term: s.short, metric: 'Course content', value: s.courseAvg }] : []),
        ...(s.facultyAvg != null ? [{ term: s.short, metric: 'Faculty', value: s.facultyAvg }] : []),
      ]),
    [series],
  )

  const termOrder = React.useMemo(() => series.map((s) => s.short), [series])
  const scopedShort = React.useMemo(
    () => series.find((s) => s.term === scopedTerm)?.short,
    [series, scopedTerm],
  )

  /** 0.6 keeps a quiet programme from looking like a rollercoaster. */
  const scoreDomain = React.useMemo(
    () => paddedDomain(scoreRows.map((r) => r.value), 0.6),
    [scoreRows],
  )

  const scoreSpec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 36,
      marginTop: 16,
      marginBottom: 4,
      // The term axis belongs to the LOWER plot only — the two are stacked precisely so
      // there is one shared axis to read across. Drawing it twice defeats the arrangement.
      x: { domain: termOrder, label: null, axis: null },
      y: { domain: scoreDomain, label: null, ticks: 4, ...axisDefaults(theme) },
      // Direct labelling, not a legend. A legend costs a whole row of card height and makes
      // the reader look away from the line to decode it; the label at the line's end is read
      // in place. Removing it also gives the two stacked plots room to breathe.
      color: { domain: ['Course content', 'Faculty'], range: [theme.content, theme.faculty], legend: false },
      marginRight: 92,
      marks: [
        gridMark(theme),
        // Same highlight band as `ProgramResponseTrend`'s `scopedTerm` — drawn before the
        // lines so it reads as ground, not figure.
        ...(scopedShort
          ? [Plot.ruleX([scopedShort], { stroke: theme.border, strokeWidth: 12, strokeOpacity: 0.55 })]
          : []),
        Plot.line(scoreRows, { x: 'term', y: 'value', stroke: 'metric', strokeWidth: 2, curve: 'monotone-x' }),
        // Course and faculty scores track each other closely by nature, so their end-labels
        // land on top of each other. A fixed opposing offset guarantees separation without
        // depending on the data — Plot has no collision avoidance for text marks.
        // One mark per series: `dy` is a constant in Plot, not a channel, and the two labels
        // need opposing offsets or they collide — course and faculty scores track each other
        // closely by nature, so their line-ends sit on the same pixel.
        ...(['Faculty', 'Course content'] as const).map((metric) =>
          Plot.text(
            [[...scoreRows].reverse().find((r) => r.metric === metric)].filter(
              (r): r is (typeof scoreRows)[number] => !!r,
            ),
            {
              x: 'term',
              y: 'value',
              text: 'metric',
              fill: 'metric',
              textAnchor: 'start',
              dx: 8,
              dy: metric === 'Faculty' ? -9 : 9,
              fontSize: CHART_TICK_FONT_SIZE,
            },
          ),
        ),
        Plot.dot(scoreRows, {
          x: 'term',
          y: 'value',
          fill: 'metric',
          r: 3,
          channels: { Term: 'term', Metric: 'metric', Score: (d: { value: number }) => fmt2(d.value) },
          tip: { format: { x: false, y: false, fill: false } },
        }),
        // Detail mode labels every point in place — the dialog's added value over the card.
        // Opposing dy per series, same reason as the end-labels: the two lines track closely.
        ...(detail
          ? (['Faculty', 'Course content'] as const).map((metric) =>
              Plot.text(
                scoreRows.filter((r) => r.metric === metric),
                {
                  x: 'term',
                  y: 'value',
                  text: (d: { value: number }) => fmt2(d.value),
                  fill: 'metric',
                  dy: metric === 'Faculty' ? -12 : 14,
                  fontSize: CHART_TICK_FONT_SIZE,
                },
              ),
            )
          : []),
      ],
    }),
    [scoreRows, termOrder, scoreDomain, detail, scopedShort],
  )

  // Blank axes read as a rendering failure, not as an empty state — guard like every other
  // multi-term chart in this file (state-review 2026-07-15; this was the one outlier).
  if (!series.length || !scoreRows.length) {
    return <ChartEmpty note="Not enough term history to show a trend yet." />
  }

  return <PlotFigure spec={scoreSpec} height={height ?? (detail ? 340 : 196)} />
}

/**
 * One entity's score against the program's, over a term axis — the By Course "Rating trend
 * by term" (PRD 2026-09-14): this course vs the program average, term-only (no AY toggle),
 * selected term highlighted. Same direct-labelled two-line grammar as `ProgramScoreTrend`
 * (course content vs faculty) — a sibling, not a new chart species, just a different pair of
 * series over the same term axis.
 */
export function CourseVsProgramTrend({
  points,
  detail = false,
  height,
  scopedTerm,
  entityLabel = 'This course',
  band,
}: {
  points: { term: string; short: string; courseAvg: number | null; programAvg: number | null }[]
  detail?: boolean
  height?: number
  /** The term(s) to highlight — see `ProgramResponseTrend`'s own doc comment on the identical
   *  single-term-or-array shape. */
  scopedTerm?: string | string[]
  entityLabel?: string
  /**
   * Per-term min↔max rule (By Faculty PRD 2026-09-15: "show lowest rating and highest rating
   * in each term across courses"). Rendered as `Plot.ruleY`, NOT a filled area — the spread is
   * across this entity's different COURSES in that term, not a confidence interval on one
   * value, and a filled band would falsely imply continuity between terms. Optional; the
   * By Course caller omits it (that axis has no equivalent "across courses" spread to show).
   */
  band?: { short: string; min: number; max: number }[]
}) {
  const rows = React.useMemo(
    () =>
      points.flatMap((p) => [
        ...(p.courseAvg != null ? [{ term: p.short, metric: entityLabel, value: p.courseAvg }] : []),
        ...(p.programAvg != null ? [{ term: p.short, metric: 'Program average', value: p.programAvg }] : []),
      ]),
    [points, entityLabel],
  )

  const termOrder = React.useMemo(() => points.map((p) => p.short), [points])
  const scopedTerms = React.useMemo(
    () => (scopedTerm == null ? [] : Array.isArray(scopedTerm) ? scopedTerm : [scopedTerm]),
    [scopedTerm],
  )
  const scopedShorts = React.useMemo(
    () => points.filter((p) => scopedTerms.includes(p.term)).map((p) => p.short),
    [points, scopedTerms],
  )
  const domain = React.useMemo(
    () => paddedDomain([...rows.map((r) => r.value), ...(band?.flatMap((b) => [b.min, b.max]) ?? [])], 0.6),
    [rows, band],
  )

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 36,
      marginTop: 16,
      marginBottom: 24,
      x: { domain: termOrder, label: null, ...axisDefaults(theme) },
      y: { domain, label: null, ticks: 4, ...axisDefaults(theme) },
      // `theme.series[2]` (--chart-3), not `mutedForeground` — this is a real second DATA
      // series (its own dots + end-label), not a static reference line, so it earns a real
      // chart color like every other two-series chart in this file (content/faculty pairs on
      // chart-1/chart-2); a muted-gray series read as "greyed out" next to a colored one
      // (Romit, 2026-09-14: "colors used in this tab are all different"). Dashed stroke still
      // carries the "benchmark, not a second course" meaning (VIZ-002).
      color: { domain: [entityLabel, 'Program average'], range: [theme.content, theme.series[2]!], legend: false },
      marginRight: 100,
      marks: [
        gridMark(theme),
        ...(scopedShorts.length
          ? [Plot.ruleX(scopedShorts, { stroke: theme.border, strokeWidth: 12, strokeOpacity: 0.55 })]
          : []),
        // Min↔max across this entity's courses, per term — a vertical rule (`ruleX`, positioned
        // by `x` and spanning `y1`→`y2`; `ruleY` draws HORIZONTAL lines and has no `y1`/`y2`).
        // Never `Plot.areaY`: see the `band` prop's own doc comment for why a filled area would
        // misstate what the spread means.
        ...(band?.length
          ? [Plot.ruleX(band, { x: 'short', y1: 'min', y2: 'max', stroke: theme.mutedForeground, strokeWidth: 1.5, strokeOpacity: 0.5 })]
          : []),
        // Two marks, not one dasharray-per-datum callback (Plot's line-mark types don't accept
        // a data-driven `strokeDasharray` function) — program average reads as a benchmark,
        // not a second course, so its own line is dashed per this file's own convention for
        // reference lines (VIZ-002).
        Plot.line(rows.filter((r) => r.metric === entityLabel), {
          x: 'term', y: 'value', stroke: 'metric', strokeWidth: 2, curve: 'monotone-x',
        }),
        Plot.line(rows.filter((r) => r.metric === 'Program average'), {
          x: 'term', y: 'value', stroke: 'metric', strokeWidth: 2, curve: 'monotone-x', strokeDasharray: '4,3',
        }),
        ...([entityLabel, 'Program average'] as const).map((metric) =>
          Plot.text(
            [[...rows].reverse().find((r) => r.metric === metric)].filter(
              (r): r is (typeof rows)[number] => !!r,
            ),
            {
              x: 'term', y: 'value', text: 'metric', fill: 'metric', textAnchor: 'start',
              dx: 8, dy: metric === entityLabel ? -9 : 9, fontSize: CHART_TICK_FONT_SIZE,
            },
          ),
        ),
        Plot.dot(rows, {
          x: 'term', y: 'value', fill: 'metric', r: 3,
          channels: { Term: 'term', Series: 'metric', Score: (d: { value: number }) => fmt2(d.value) },
          tip: { format: { x: false, y: false, fill: false } },
        }),
        ...(detail
          ? ([entityLabel, 'Program average'] as const).map((metric) =>
              Plot.text(rows.filter((r) => r.metric === metric), {
                x: 'term', y: 'value', text: (d: { value: number }) => fmt2(d.value),
                fill: 'metric', dy: metric === entityLabel ? -12 : 14, fontSize: CHART_TICK_FONT_SIZE,
              }),
            )
          : []),
      ],
    }),
    [rows, termOrder, domain, detail, scopedShorts, entityLabel, band],
  )

  if (!points.length || !rows.length) {
    return <ChartEmpty note="Not enough term history to show a trend yet." />
  }

  return <PlotFigure spec={spec} height={height ?? (detail ? 340 : 196)} />
}

/**
 * Course Analytics' "Question trend" — one line per course-content question, over its last N
 * evaluated terms, threshold dashed. Replaces a per-question sparkline list (Romit, 2026-09-15:
 * "not able to make out the trend from this visualization... try a different graph, maybe a
 * line graph") — a 6-point sparkline per row read as an isolated shape per question, with no
 * shared axis to compare one question's slope against another's, which is exactly the "which
 * question is dragging this course down, and since when" question the PRD asks this card to
 * answer. One shared term axis puts every question's trajectory on the same ground.
 *
 * Domain comes from the row with the MOST points, not an arbitrary one — `courseQuestionTrend`
 * only pushes a point for a term a question actually has data for, so a question missing one
 * term's survey link has a shorter `points` array than a sibling question that resolved every
 * term. Every other row's points land on the right ordinal tick because Plot's categorical
 * x-scale positions by label, not by array index.
 *
 * NOT a guarantee, only true when question coverage NESTS (every question's terms are a subset
 * of the fullest question's) — verified against all 15 fixture courses (verification-reviewer,
 * 2026-09-15: zero dropped terms), but a genuinely non-nested split (question A covers {T1,T2},
 * question B covers {T3,T4}, neither a subset of the other) would silently drop whichever
 * question's terms aren't on the domain built from the other. Harden by unioning every row's
 * `short` values in chronological order instead of taking one row's, if that split ever occurs.
 */
export function CourseQuestionTrendLines({
  rows,
  threshold,
  height = 260,
}: {
  rows: CourseQuestionTrendRow[]
  /** Dashed reference line — the same benchmark the ranked list below already states per row. */
  threshold: number
  height?: number
}) {
  const termOrder = React.useMemo(() => {
    const fullest = [...rows].sort((a, b) => b.points.length - a.points.length)[0]
    return fullest ? fullest.points.map((p) => p.short) : []
  }, [rows])

  const flat = React.useMemo(
    () =>
      rows.flatMap((r) => r.points.map((p) => ({ term: p.short, questionId: r.questionId, text: r.text, value: p.avg }))),
    [rows],
  )

  const domain = React.useMemo(() => paddedDomain([...flat.map((r) => r.value), threshold], 0.6), [flat, threshold])

  const spec = React.useCallback(
    (theme: PlotTheme) => {
      // A course can carry more content questions than the 5-hue categorical palette
      // (`theme.series`) — verified live (ds-conformance-reviewer, 2026-09-15): a 6th question
      // repeats `--chart-1` and is indistinguishable from the 1st. Plot's line marks don't
      // accept a data-driven `strokeDasharray` (same constraint `CourseVsProgramTrend`'s own
      // comment documents for its two-series case), so a REPEAT of the palette gets its own
      // dashed `Plot.line` call instead of a per-datum property.
      const paletteLen = theme.series.length
      const dashedIds = new Set(rows.filter((_, i) => Math.floor(i / paletteLen) >= 1).map((r) => r.questionId))
      const solidRows = flat.filter((d) => !dashedIds.has(d.questionId))
      const dashedRows = flat.filter((d) => dashedIds.has(d.questionId))
      return {
        marginLeft: 36,
        marginTop: 16,
        marginBottom: 24,
        marginRight: 12,
        x: { domain: termOrder, label: null, ...axisDefaults(theme) },
        y: { domain, label: null, ticks: 4, ...axisDefaults(theme) },
        color: {
          domain: rows.map((r) => r.questionId),
          range: rows.map((_, i) => theme.series[i % paletteLen]!),
          legend: false,
        },
        marks: [
          gridMark(theme),
          Plot.ruleY([threshold], { stroke: theme.rule, strokeDasharray: '4,4', strokeOpacity: 0.8 }),
          Plot.text([`Target ${threshold.toFixed(1)}`], {
            frameAnchor: 'left', y: threshold, dy: -7, dx: 4,
            fill: theme.mutedForeground, fontSize: CHART_TICK_FONT_SIZE, textAnchor: 'start',
          }),
          Plot.line(solidRows, { x: 'term', y: 'value', stroke: 'questionId', strokeWidth: 2, curve: 'monotone-x' }),
          ...(dashedRows.length
            ? [Plot.line(dashedRows, { x: 'term', y: 'value', stroke: 'questionId', strokeWidth: 2, curve: 'monotone-x', strokeDasharray: '5,3' })]
            : []),
          Plot.dot(flat, {
            x: 'term', y: 'value', fill: 'questionId', r: 2.5,
            channels: { Question: 'text', Term: 'term', Average: (d: { value: number }) => fmt2(d.value) },
            tip: { format: { x: false, y: false, fill: false, r: false } },
          }),
        ],
      }
    },
    [flat, termOrder, domain, rows, threshold],
  )

  // Defensive, not reachable from `ByCoursePanel` today — that call site gates the whole card
  // on `questionTrendRows.length > 0` (its own `description` computes a `Math.max` over the
  // same array, which needs the guard more than this component does). Kept here too so a
  // future caller that skips that gate still gets an empty state instead of a blank Plot.
  if (!rows.length) return <ChartEmpty note="No question history to show a trend yet." />

  return (
    <div className="flex flex-col gap-3">
      <PlotFigure spec={spec} height={height} />
      {/* Text legend, ranked weakest-first (the row order already answers "what's dragging
          this course down") — colour is not the only encoding (A11Y-008): each swatch pairs a
          fixed identity with the line's exact latest value, which N lines of pure hue cannot
          carry past 4-5 series. */}
      <ul className="flex flex-col">
        {rows.map((r, i) => (
          <li key={r.questionId} className="flex items-center gap-2 border-b border-border py-1.5 text-xs last:border-b-0">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: `var(--chart-${(i % 5) + 1})` }}
            />
            <span className="truncate text-muted-foreground">{r.text}</span>
            <span className="ml-auto shrink-0 tabular-nums font-medium text-foreground">{r.latest.toFixed(1)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Score trend + response-rate trend, stacked with one shared term axis. Used on Overview's
 * "Program trajectory" card, where both halves belong on the same card (Monil: the trend
 * graph is program-wide, not term-scoped, same as the KPI strip's cohort scope is not).
 */
export function ProgramTrendStack({
  series,
  responseTarget = 80,
  detail = false,
}: {
  series: TermSeriesPoint[]
  responseTarget?: number
  detail?: boolean
}) {
  const rateRows = React.useMemo(
    () => series.filter((s) => s.responseRate != null).map((s) => ({ term: s.short, value: s.responseRate as number })),
    [series],
  )

  const termOrder = React.useMemo(() => series.map((s) => s.short), [series])

  const rateSpec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 36,
      marginTop: 16,
      marginBottom: 22,
      // MUST match the score plot's marginRight. The two are stacked precisely so one term
      // axis reads across both; a different right margin shifts the plot area and silently
      // misaligns the terms, which is worse than not stacking at all.
      marginRight: 92,
      x: { domain: termOrder, label: null, ...axisDefaults(theme) },
      // Response rates live 50-95; a 0-100 domain spends most of the plot on empty space and
      // squashes the line into a flat ribbon. The 80% target is on-plot, so the scale is still
      // anchored to something real rather than to zero.
      y: { domain: [40, 100], label: null, ticks: 3, tickFormat: (d: number) => `${d}%`, ...axisDefaults(theme) },
      marks: [
        gridMark(theme),
        // The target is the point of the chart — a rate without its bar means nothing.
        Plot.ruleY([responseTarget], { stroke: theme.rule, strokeDasharray: '4,4' }),
        Plot.text([`target ${responseTarget}%`], {
          y: responseTarget,
          frameAnchor: 'right',
          dy: -7,
          dx: -2,
          fill: theme.mutedForeground,
          fontSize: CHART_TICK_FONT_SIZE,
          textAnchor: 'end',
        }),
        // NO areaY here. `Plot.areaY` fills from the value down to y=0, and this facet's domain
        // starts at 40 — so the fill ran far outside the frame, unclipped, sitting on top of
        // the x-axis tick labels as a grey slab. Clipping it would only hide the deeper
        // problem: area encodes ACCUMULATION, and a response rate does not accumulate. The
        // line carries the shape and the target rule carries the meaning.
        Plot.line(rateRows, { x: 'term', y: 'value', stroke: theme.rate, strokeWidth: 2, curve: 'monotone-x' }),
        Plot.dot(rateRows, {
          x: 'term',
          y: 'value',
          fill: (d: { value: number }) => (d.value < responseTarget ? theme.warn : theme.rate),
          r: 3,
          channels: { Term: 'term', 'Response rate': (d: { value: number }) => `${d.value}%` },
          tip: { format: { x: false, y: false, fill: false } },
        }),
        ...(detail
          ? [
              Plot.text(rateRows, {
                x: 'term',
                y: 'value',
                text: (d: { value: number }) => `${d.value}%`,
                fill: (d: { value: number }) => (d.value < responseTarget ? theme.warn : theme.rate),
                dy: -12,
                fontSize: CHART_TICK_FONT_SIZE,
              }),
            ]
          : []),
      ],
    }),
    [rateRows, termOrder, responseTarget, detail],
  )

  // Blank axes read as a rendering failure, not as an empty state — guard like every other
  // multi-term chart in this file (state-review 2026-07-15; this was the one outlier).
  if (!series.length || !series.some((s) => s.courseAvg != null || s.facultyAvg != null)) {
    return <ChartEmpty note="Not enough term history to show a trajectory yet." />
  }

  // ChartCard's shell is `h-full`, so in a 50/50 row this card stretches to the taller one
  // beside it. Spend that height on the plots rather than leaving it blank under them.
  return (
    <div className="flex flex-col">
      <ProgramScoreTrend series={series} detail={detail} />
      <PlotFigure spec={rateSpec} height={detail ? 180 : 124} />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Slopegraph — VIZ-PATTERN-004 (slope-paired).
   Q5 ("how does A compare to B") across two adjacent terms.
   A: open the course that fell.

   Exists because the rest of this file kept answering ONE question — "who is
   low?" — which is why it kept reaching for a ranked dot plot. This asks "who
   MOVED", which a ranked list cannot show at all and an aggregate trend line
   averages away. Crossing lines are the whole point: they are courses that
   swapped places between two terms.

   Tufte's slopegraph rules, kept: no gridlines, no y-axis furniture, the two
   term columns ARE the axis, and every line is labelled at both ends.
   ════════════════════════════════════════════════════════════════════════════ */

export function Slopegraph({
  rows,
  fromLabel,
  toLabel,
  height,
}: {
  rows: { courseCode: string; courseName: string; from: number; to: number; delta: number }[]
  fromLabel: string
  toLabel: string
  height?: number
}) {
  /** Long form: two points per course, joined by `courseCode`. */
  const points = React.useMemo(
    () =>
      rows.flatMap((r) => [
        { code: r.courseCode, side: fromLabel, value: r.from, delta: r.delta },
        { code: r.courseCode, side: toLabel, value: r.to, delta: r.delta },
      ]),
    [rows, fromLabel, toLabel],
  )

  const domain = React.useMemo(
    () => paddedDomain(rows.flatMap((r) => [r.from, r.to]), 0.5, 0.1),
    [rows],
  )

  /** Movement worth naming — below this the label is noise on a flat line. */
  const MOVED = 0.15

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 92,
      marginRight: 92,
      marginTop: 26,
      marginBottom: 10,
      x: { domain: [fromLabel, toLabel], label: null, axis: 'top' as const, ...axisDefaults(theme) },
      y: { domain, axis: null },
      marks: [
        // The two term columns are the axis — no gridlines (Tufte).
        Plot.line(points, {
          x: 'side',
          y: 'value',
          z: 'code',
          // Fell = amber, held = border, rose = neutral foreground. Rising is not painted
          // green: green is "faculty" in this set, and the story of a slopegraph is who fell.
          stroke: (d: { delta: number }) =>
            d.delta < -MOVED ? theme.warn : d.delta > MOVED ? theme.mutedForeground : theme.border,
          strokeWidth: (d: { delta: number }) => (Math.abs(d.delta) > MOVED ? 2 : 1),
        }),
        Plot.dot(points, {
          x: 'side',
          y: 'value',
          r: 3,
          fill: (d: { delta: number }) =>
            d.delta < -MOVED ? theme.warn : d.delta > MOVED ? theme.foreground : theme.mutedForeground,
          channels: {
            Course: 'code',
            Term: 'side',
            Score: (d: { value: number }) => fmt2(d.value),
            Change: (d: { delta: number }) => `${d.delta >= 0 ? '+' : ''}${fmt2(d.delta)}`,
          },
          tip: { format: { x: false, y: false, fill: false, r: false } },
        }),
        // Both ends labelled — a slopegraph with one label is a mystery. Labels are DODGED:
        // several courses land within a few px of each other on either rail (Sp 26 saw
        // "+0.87" and "+0.75" overprint into a smear — caught on the 2026-07-15 tab walk).
        Plot.text(
          dodgeLabelY(points.filter((p) => p.side === fromLabel), (d) => d.value, domain, height ?? Math.max(260, rows.length * 26 + 60)),
          {
            x: 'side', y: 'labelY', text: 'code', textAnchor: 'end', dx: -8,
            fill: theme.mutedForeground, fontSize: CHART_TICK_FONT_SIZE,
          },
        ),
        Plot.text(
          dodgeLabelY(points.filter((p) => p.side === toLabel), (d) => d.value, domain, height ?? Math.max(260, rows.length * 26 + 60)),
          {
            x: 'side',
            y: 'labelY',
            text: (d: { code: string; delta: number }) =>
              Math.abs(d.delta) > MOVED
                ? `${d.code}  ${d.delta >= 0 ? '+' : ''}${fmt2(d.delta)}`
                : d.code,
            textAnchor: 'start',
            dx: 8,
            fill: (d: { delta: number }) =>
              Math.abs(d.delta) > MOVED ? theme.foreground : theme.mutedForeground,
            fontSize: CHART_TICK_FONT_SIZE,
          },
        ),
      ],
    }),
    [points, domain, fromLabel, toLabel, height, rows.length],
  )

  if (rows.length < 2) {
    return <ChartEmpty note="Needs two terms with at least two shared courses to show movement." />
  }

  return <PlotFigure spec={spec} height={height ?? Math.max(260, rows.length * 26 + 60)} />
}

/* ════════════════════════════════════════════════════════════════════════════
   Story 12 — one course over time.
   Q4 (change over time) → line, one per rated entity + the response path below.

   Replaces a single "Avg rating" line that plotted the FACULTY score — so the
   curriculum-committee tab, whose question is "is this COURSE working", was
   charting the instructor. D27/D7: two entities, never merged.
   ════════════════════════════════════════════════════════════════════════════ */

export function CourseTrendStack({
  rows,
  responseTarget = 80,
  detail = false,
}: {
  rows: { short: string; year: number; courseAvg: number | null; facultyAvg: number; responseRate: number }[]
  responseTarget?: number
  /** Expanded-dialog mode — taller plots + every point labelled (see ProgramTrendStack). */
  detail?: boolean
}) {
  const termOrder = React.useMemo(() => rows.map((r) => r.short), [rows])

  const scoreRows = React.useMemo(
    () =>
      rows.flatMap((r) => [
        ...(r.courseAvg != null ? [{ term: r.short, metric: 'Course content', value: r.courseAvg }] : []),
        { term: r.short, metric: 'Faculty', value: r.facultyAvg },
      ]),
    [rows],
  )

  const scoreDomain = React.useMemo(
    () => paddedDomain(scoreRows.map((r) => r.value), 0.6),
    [scoreRows],
  )

  const scoreSpec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 36,
      marginTop: 16,
      marginBottom: 4,
      marginRight: 92,
      x: { domain: termOrder, label: null, axis: null },
      y: { domain: scoreDomain, label: null, ticks: 4, ...axisDefaults(theme) },
      color: { domain: ['Course content', 'Faculty'], range: [theme.content, theme.faculty], legend: false },
      marks: [
        gridMark(theme),
        Plot.line(scoreRows, { x: 'term', y: 'value', stroke: 'metric', strokeWidth: 2, curve: 'monotone-x' }),
        Plot.dot(scoreRows, {
          x: 'term', y: 'value', fill: 'metric', r: 3,
          channels: { Term: 'term', Metric: 'metric', Score: (d: { value: number }) => fmt2(d.value) },
          tip: { format: { x: false, y: false, fill: false } },
        }),
        ...(['Faculty', 'Course content'] as const).map((metric) =>
          Plot.text(
            [[...scoreRows].reverse().find((r) => r.metric === metric)].filter(
              (r): r is (typeof scoreRows)[number] => !!r,
            ),
            {
              x: 'term', y: 'value', text: 'metric', fill: 'metric',
              textAnchor: 'start', dx: 8, dy: metric === 'Faculty' ? -9 : 9,
              fontSize: CHART_TICK_FONT_SIZE,
            },
          ),
        ),
        ...(detail
          ? (['Faculty', 'Course content'] as const).map((metric) =>
              Plot.text(
                scoreRows.filter((r) => r.metric === metric),
                {
                  x: 'term',
                  y: 'value',
                  text: (d: { value: number }) => fmt2(d.value),
                  fill: 'metric',
                  dy: metric === 'Faculty' ? -12 : 14,
                  fontSize: CHART_TICK_FONT_SIZE,
                },
              ),
            )
          : []),
      ],
    }),
    [scoreRows, termOrder, scoreDomain, detail],
  )

  const rateSpec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 36,
      marginTop: 16,
      marginBottom: 22,
      // Must match the score plot — the two are stacked to be read across ONE term axis.
      marginRight: 92,
      x: { domain: termOrder, label: null, ...axisDefaults(theme) },
      y: { domain: [40, 100], label: null, ticks: 3, tickFormat: (d: number) => `${d}%`, ...axisDefaults(theme) },
      marks: [
        gridMark(theme),
        Plot.ruleY([responseTarget], { stroke: theme.rule, strokeDasharray: '4,4' }),
        Plot.text([`target ${responseTarget}%`], {
          y: responseTarget, frameAnchor: 'right', dy: -7, dx: -2,
          fill: theme.mutedForeground, fontSize: CHART_TICK_FONT_SIZE, textAnchor: 'end',
        }),
        // No areaY — same reason as ProgramTrendStack: fills to y=0 outside a [40,100] domain,
        // and a rate doesn't accumulate.
        Plot.line(rows, { x: 'short', y: 'responseRate', stroke: theme.rate, strokeWidth: 2, curve: 'monotone-x' }),
        Plot.dot(rows, {
          x: 'short', y: 'responseRate', r: 3,
          fill: (d: { responseRate: number }) => (d.responseRate < responseTarget ? theme.warn : theme.rate),
          channels: { Term: 'short', 'Response rate': (d: { responseRate: number }) => `${d.responseRate}%` },
          tip: { format: { x: false, y: false, fill: false, r: false } },
        }),
        ...(detail
          ? [
              Plot.text(rows, {
                x: 'short',
                y: 'responseRate',
                text: (d: { responseRate: number }) => `${d.responseRate}%`,
                fill: (d: { responseRate: number }) =>
                  d.responseRate < responseTarget ? theme.warn : theme.rate,
                dy: -12,
                fontSize: CHART_TICK_FONT_SIZE,
              }),
            ]
          : []),
      ],
    }),
    [rows, termOrder, responseTarget, detail],
  )

  if (rows.length < 2) return <ChartEmpty note="One term of history. A trend needs at least two." />

  return (
    <div className="flex flex-col">
      <PlotFigure spec={scoreSpec} height={detail ? 340 : 172} />
      <PlotFigure spec={rateSpec} height={detail ? 180 : 116} />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   Story 9 — faculty compared against each other over time.
   Q: "How is X changing over time?" → RUBRIC Q4 → line, one per entity.

   Small multiples, one panel per faculty, NOT six colored lines on one chart:
     · `small-multiples.md:27` only excuses a single chart at "≤5 series"; six is past it.
     · the DS ships five chart tokens (--chart-1..5), so a sixth series silently recycles
       a colour and two faculty become indistinguishable — which is what happened.
     · VIZ-007 makes small multiples the default for a faceted view anyway.
     · `small-multiples.md:8` — "the eye scans 16 mini-charts in 5 seconds; outliers
       self-announce."

   Each panel ghosts every OTHER faculty member's line behind the subject's, so the panel
   answers "how is she doing" and "compared to whom" at once — the comparison story 9 asks
   for survives the split, which is the usual objection to faceting.
   ════════════════════════════════════════════════════════════════════════════ */

/*
  COLOUR = METRIC, WEIGHT = SUBJECT.

  These lines used to draw in `brand` on the rule "brand = the subject of the view". That rule
  cost more than it bought: the faculty-score metric renders as --chart-2 green in Overview's
  "Program trajectory" and rendered as brand pink here, so the SAME METRIC had two colours one
  tab apart. Spotted by looking at the two tabs side by side, which is the only way to see it.

  The subject is already unambiguous without colour — it's the 2px solid line against 1px
  ghosted peers, in its own labelled panel. Colour was doing redundant work and paying for it
  in cross-tab consistency.

  So: faculty score is --chart-2 wherever it appears. The paired response chart beside this one
  stays --chart-3 because it is a DIFFERENT metric — you read across by panel row, not by hue.
  `brand` is reserved for where there is a genuine subject and no metric ambiguity (the "you"
  dot in BenchmarkDistribution).
*/

/**
 * Nudge end-labels apart vertically. Plot.text has no collision handling, and movers often
 * finish within a few px of each other (all three low collectors end at ~45% — the labels
 * overprinted into a smear). Sort top-down, then push each label down to keep a minimum gap,
 * expressed in data units derived from the pixel height it will render at.
 */
function dodgeLabelY<T>(
  ends: T[],
  y: (d: T) => number,
  domain: readonly [number, number],
  heightPx: number,
  labelPx = 15,
): (T & { labelY: number })[] {
  const span = Math.abs(domain[1] - domain[0])
  const minGap = (span * labelPx) / Math.max(heightPx - 40, 1)
  let prev = Infinity
  return [...ends]
    .sort((a, b) => y(b) - y(a))
    .map((d) => {
      const ly = Math.min(y(d), prev - minGap)
      prev = ly
      return { ...d, labelY: ly }
    })
}

export function FacultyCompareLines({
  rows,
  programMean,
  height,
  mode = 'facets',
  highlight = [],
}: {
  rows: { facultyId: string; name: string; short: string; year: number; rating: number }[]
  programMean: number
  height?: number
  /**
   * 'facets' is the original one-panel-per-entity layout (height grows N×76 — a wall at 34).
   * 'shared' is the card layout: ONE axis, every entity ghosted, only `highlight` drawn solid
   * and end-labelled. Same component, same data, different density — extending rather than
   * cloning, per the note on ResponseCompareLines below.
   */
  mode?: 'facets' | 'shared'
  /** Entity names to draw solid + label in shared mode. Everyone else stays ghost context. */
  highlight?: string[]
}) {
  const termOrder = React.useMemo(
    () => [...new Map(rows.map((r) => [r.short, r.year])).entries()].sort((a, b) => a[1] - b[1]).map(([s]) => s),
    [rows],
  )

  const names = React.useMemo(() => [...new Set(rows.map((r) => r.name))].sort(), [rows])

  const hlSet = React.useMemo(() => new Set(highlight), [highlight])
  const hlRows = React.useMemo(() => rows.filter((r) => hlSet.has(r.name)), [rows, hlSet])
  /** Last point of each highlighted line — where its name + score hang. */
  const hlEnds = React.useMemo(() => {
    const last = new Map<string, (typeof rows)[number]>()
    for (const r of hlRows) {
      const prev = last.get(r.name)
      if (!prev || r.year > prev.year) last.set(r.name, r)
    }
    return [...last.values()]
  }, [hlRows])

  const sharedSpec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 34,
      marginTop: 12,
      marginBottom: 26,
      marginRight: 132,
      x: { domain: termOrder, label: null, ...axisDefaults(theme) },
      y: { domain: SCORE_VIEW, label: null, ticks: [3.5, 4.0, 4.5], ...axisDefaults(theme) },
      marks: [
        gridMark(theme),
        // The pack. One z per faculty so lines don't join across people.
        Plot.line(rows, {
          x: 'short', y: 'rating', z: 'name',
          stroke: theme.border, strokeWidth: 1, strokeOpacity: 0.7, curve: 'monotone-x',
        }),
        Plot.ruleY([programMean], { stroke: theme.rule, strokeDasharray: '4,4', strokeOpacity: 0.8 }),
        // The movers — ink only where there is news.
        Plot.line(hlRows, {
          x: 'short', y: 'rating', z: 'name',
          stroke: theme.faculty, strokeWidth: 2, curve: 'monotone-x',
        }),
        Plot.dot(hlEnds, {
          x: 'short', y: 'rating', r: 3,
          fill: (d: { rating: number }) => (d.rating < programMean ? theme.warn : theme.faculty),
        }),
        Plot.text(dodgeLabelY(hlEnds, (d) => d.rating, SCORE_VIEW, height ?? 220), {
          x: 'short', y: 'labelY',
          text: (d: { name: string; rating: number }) => `${d.name.replace(/^Dr\.\s*/, '')} ${fmt2(d.rating)}`,
          dx: 8, textAnchor: 'start', fill: theme.ink, fontSize: CHART_TICK_FONT_SIZE,
        }),
      ],
    }),
    [rows, hlRows, hlEnds, termOrder, programMean, height],
  )

  /** Every row re-emitted under each panel — the grey context layer. */
  const ghost = React.useMemo(
    () => names.flatMap((panel) => rows.map((r) => ({ ...r, panel, series: `${panel}::${r.name}` }))),
    [names, rows],
  )

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 34,
      marginTop: 12,
      marginBottom: 26,
      // Panel names sit in the right margin (Plot's fy default). 12px clipped them to "Dr.".
      marginRight: 124,
      x: { domain: termOrder, label: null, ...axisDefaults(theme) },
      // Plot repeats the y axis inside every facet band. Five ticks in a ~72px panel
      // collide with the neighbouring panel's ticks; two anchor the scale without noise.
      y: { domain: SCORE_VIEW, label: null, ticks: [3.5, 4.5], ...axisDefaults(theme) },
      fy: { domain: names, label: null, ...axisDefaults(theme) },
      marks: [
        gridMark(theme),
        // Peers, ghosted — context without competing for attention.
        Plot.line(ghost, {
          fy: 'panel',
          x: 'short',
          y: 'rating',
          z: 'series',
          stroke: theme.border,
          strokeWidth: 1,
          curve: 'monotone-x',
        }),
        Plot.ruleY([programMean], { stroke: theme.rule, strokeDasharray: '4,4', strokeOpacity: 0.8 }),
        // The subject of the panel.
        Plot.line(rows, {
          fy: 'name',
          x: 'short',
          y: 'rating',
          z: 'name',
          stroke: theme.faculty,
          strokeWidth: 2,
          curve: 'monotone-x',
        }),
        Plot.dot(rows, {
          fy: 'name',
          x: 'short',
          y: 'rating',
          r: 2.5,
          fill: (d: { rating: number }) => (d.rating < programMean ? theme.warn : theme.faculty),
          channels: { Faculty: 'name', Term: 'short', Score: (d: { rating: number }) => fmt2(d.rating) },
          tip: { format: { x: false, y: false, fill: false, r: false, fy: false } },
        }),
      ],
    }),
    [rows, ghost, termOrder, names, programMean],
  )

  if (!names.length) return <ChartEmpty note="No faculty scores recorded across terms yet." />

  // One term = one x position = no line segments; a shared plot of floating dots reads as
  // broken. The facet layout tolerates a single column; the shared one needs a real axis.
  if (mode === 'shared' && termOrder.length < 2) {
    return <ChartEmpty note="Needs at least two terms of data to draw trends." />
  }
  if (mode === 'shared') return <PlotFigure spec={sharedSpec} height={height ?? 220} />

  return <PlotFigure spec={spec} height={height ?? Math.max(260, names.length * 76 + 44)} />
}

/* ════════════════════════════════════════════════════════════════════════════
   §2.2's SECOND trend — response rate across every faculty member.
   Q4 → line per entity → small multiples, same reason FacultyCompareLines uses them
   (6 faculty > the ≤5-series rule, and the DS ships 5 chart tokens).

   The ref app shows score-by-term and rate-by-term SIDE BY SIDE, and we only had the
   first. They are different problems with different fixes: a low score is a coaching
   conversation; a low collection rate is a reminder. Asking "whose collection is
   failing" was only possible one faculty member at a time.
   ════════════════════════════════════════════════════════════════════════════ */

export function ResponseCompareLines({
  rows,
  target = 80,
  height,
  mode = 'facets',
  highlight = [],
}: {
  /**
   * `label` is whatever the panels are — faculty on the roster chart, COURSE inside one
   * faculty member's portfolio. The component was called `FacultyResponseCompare` and typed
   * to `name`/`facultyId`, but nothing in it is about people: it draws "N entities' response
   * rates by term against a target". Story 19 needs exactly that shape with course as the
   * entity, and cloning it to change one field name is how a vocabulary rots into six
   * near-identical charts.
   */
  rows: { label: string; short: string; year: number; responseRate: number }[]
  target?: number
  height?: number
  /** Same contract as FacultyCompareLines: 'shared' = one axis, ghosts + highlighted movers. */
  mode?: 'facets' | 'shared'
  highlight?: string[]
}) {
  const termOrder = React.useMemo(
    () => [...new Map(rows.map((r) => [r.short, r.year])).entries()].sort((a, b) => a[1] - b[1]).map(([s]) => s),
    [rows],
  )
  const names = React.useMemo(() => [...new Set(rows.map((r) => r.label))].sort(), [rows])
  const ghost = React.useMemo(
    () => names.flatMap((panel) => rows.map((r) => ({ ...r, panel, series: `${panel}::${r.label}` }))),
    [names, rows],
  )

  const hlSet = React.useMemo(() => new Set(highlight), [highlight])
  const hlRows = React.useMemo(() => rows.filter((r) => hlSet.has(r.label)), [rows, hlSet])
  const hlEnds = React.useMemo(() => {
    const last = new Map<string, (typeof rows)[number]>()
    for (const r of hlRows) {
      const prev = last.get(r.label)
      if (!prev || r.year > prev.year) last.set(r.label, r)
    }
    return [...last.values()]
  }, [hlRows])

  const sharedSpec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 40,
      marginTop: 12,
      marginBottom: 26,
      marginRight: 132,
      x: { domain: termOrder, label: null, ...axisDefaults(theme) },
      y: { domain: [45, 100], label: null, ticks: [50, 80], tickFormat: (d: number) => `${d}%`, ...axisDefaults(theme) },
      marks: [
        gridMark(theme),
        Plot.line(rows, {
          x: 'short', y: 'responseRate', z: 'label',
          stroke: theme.border, strokeWidth: 1, strokeOpacity: 0.7, curve: 'monotone-x',
        }),
        // The target IS the chart — a rate without its bar means nothing.
        Plot.ruleY([target], { stroke: theme.rule, strokeDasharray: '4,4', strokeOpacity: 0.8 }),
        Plot.line(hlRows, {
          x: 'short', y: 'responseRate', z: 'label',
          stroke: theme.rate, strokeWidth: 2, curve: 'monotone-x',
        }),
        Plot.dot(hlEnds, {
          x: 'short', y: 'responseRate', r: 3,
          fill: (d: { responseRate: number }) => (d.responseRate < target ? theme.warn : theme.rate),
        }),
        Plot.text(dodgeLabelY(hlEnds, (d) => d.responseRate, [45, 100], height ?? 220), {
          x: 'short', y: 'labelY',
          text: (d: { label: string; responseRate: number }) => `${d.label.replace(/^Dr\.\s*/, '')} ${d.responseRate}%`,
          dx: 8, textAnchor: 'start', fill: theme.ink, fontSize: CHART_TICK_FONT_SIZE,
        }),
      ],
    }),
    [rows, hlRows, hlEnds, termOrder, target, height],
  )

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 40,
      marginTop: 12,
      marginBottom: 26,
      marginRight: 124,
      x: { domain: termOrder, label: null, ...axisDefaults(theme) },
      // 45 not 0: the question is "who is under the bar", not "what fraction responded", and a
      // zero baseline spends half the panel on rates nobody has ever recorded. The target rule
      // is the reference that makes a truncated axis honest here — you read against 80%, not
      // against the floor. (A zero baseline IS required for bar length; these are positions.)
      y: { domain: [45, 100], label: null, ticks: [50, 80], tickFormat: (d: number) => `${d}%`, ...axisDefaults(theme) },
      fy: { domain: names, label: null, ...axisDefaults(theme) },
      marks: [
        gridMark(theme),
        Plot.line(ghost, {
          fy: 'panel', x: 'short', y: 'responseRate', z: 'series',
          stroke: theme.border, strokeWidth: 1, curve: 'monotone-x',
        }),
        // The target IS the chart — a rate without its bar means nothing.
        Plot.ruleY([target], { stroke: theme.rule, strokeDasharray: '4,4', strokeOpacity: 0.8 }),
        Plot.line(rows, {
          fy: 'label', x: 'short', y: 'responseRate', z: 'label',
          stroke: theme.rate, strokeWidth: 2, curve: 'monotone-x',
        }),
        Plot.dot(rows, {
          fy: 'label', x: 'short', y: 'responseRate', r: 2.5,
          fill: (d: { responseRate: number }) => (d.responseRate < target ? theme.warn : theme.rate),
          channels: { Panel: 'label', Term: 'short', 'Response rate': (d: { responseRate: number }) => `${d.responseRate}%` },
          tip: { format: { x: false, y: false, fill: false, r: false, fy: false } },
        }),
      ],
    }),
    [rows, ghost, termOrder, names, target],
  )

  if (!names.length) return <ChartEmpty note="No response history recorded yet." />

  if (mode === 'shared' && termOrder.length < 2) {
    return <ChartEmpty note="Needs at least two terms of data to draw trends." />
  }
  if (mode === 'shared') return <PlotFigure spec={sharedSpec} height={height ?? 220} />

  return <PlotFigure spec={spec} height={height ?? Math.max(260, names.length * 76 + 44)} />
}

/* ════════════════════════════════════════════════════════════════════════════
   Story 15 — "percentile", answered without a percentile.
   Q: "Where does X stand vs target / cohort?" → RUBRIC Q1 → dot-on-distribution.
   A: write an action plan.

   §7.3 bans percentile by name: "'you're at the 60th percentile' included — that
   reverse-encodes peer rank". Aarti validated the substitute ("compared to the
   department average to the university average") and cited Watermark/Anthology as
   proof faculty accept it. A beeswarm of unnamed peers + your dot + two benchmark
   rules shows position — including whether the pack is tight or spread — while
   encoding no rank and naming no peer.
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Below this many people in the pool, a percentile is false precision and the mark degrades
 * to a plain rank. 20 ⇒ each person moves the percentile at most 5 points, which is about
 * where the third digit stops lying.
 */
const PERCENTILE_MIN_POOL = 20

/**
 * 1st / 2nd / 3rd / 4th … — English ordinals, including the 11–13 exception that a naive
 * `n % 10` gets wrong ("11st percentile").
 */
function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

export function BenchmarkDistribution({
  distribution,
  value,
  department,
  university,
  showPeers = true,
  height = 148,
}: {
  distribution: number[]
  value: number
  department: number
  university: number
  /**
   * The access-scope toggle — one component, two lenses, which is how
   * `prototype-cards-catalog.md` describes the chair/faculty split ("same component as
   * faculty self-view but different access scope").
   *
   * `false` drops the peer swarm and leaves own-dot + two benchmark rules, i.e. a plain
   * bullet-vs-target (VIZ-PATTERN-003) — the shape §7.3 explicitly allows for faculty
   * ("✅ Allowed: department average, university average, threshold"). The swarm has to go
   * on that lens because you can count the dots to your left, which is a percentile in
   * everything but name — the thing §7.3 bans.
   */
  showPeers?: boolean
  height?: number
}) {
  const peers = React.useMemo(() => distribution.map((v, i) => ({ v, i })), [distribution])

  /**
   * Story 15's standing, derived here rather than passed in — it is a property of THIS
   * chart's own distribution, and computing it anywhere else invites the two numbers to
   * drift apart (the "numbers disagree" class of bug this layer exists to end).
   *
   * PERCENTILE ONLY WHEN THE POOL CAN CARRY ONE. Below ~20 people a percentile is false
   * precision: in this tenant a department is 3 faculty, so "67th percentile" is "2nd of 3"
   * wearing a lab coat — each person moves it 33 points. So the mark degrades to a rank,
   * which is the same fact stated at the precision the data actually has. Both answer "where
   * does this person stand"; only one of them pretends.
   *
   * This is not mock-data scaffolding — a real program with 40 faculty crosses the threshold
   * and gets the percentile the story asks for. The component is honest at both scales.
   */
  const standing = React.useMemo((): string | null => {
    const n = distribution.length
    if (n < 2) return null
    if (n >= PERCENTILE_MIN_POOL) {
      // Strictly-below / n — the standard definition.
      const below = distribution.filter((v) => v < value).length
      return `${ordinal(Math.round((below / n) * 100))} percentile`
    }
    const rank = distribution.filter((v) => v > value).length + 1
    return `${ordinal(rank)} of ${n}`
  }, [distribution, value])
  /** One department in the tenant ⇒ the two benchmarks are the same number. */
  const same = Math.abs(department - university) < 0.005

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 12,
      marginRight: 12,
      // Headroom for the benchmark labels above and the axis below — at 26px the "dept"
      // label sat on the swarm and the "university" label sat on the axis ticks.
      marginTop: 34,
      marginBottom: 34,
      x: { domain: SCORE_VIEW, label: null, ticks: 5, ...axisDefaults(theme) },
      y: { axis: null },
      r: { range: [4, 4] },
      marks: [
        // Unnamed peers — the shape of the pack, with no identity attached. Admin lens only.
        ...(showPeers
          ? [
              Plot.dot(
                peers,
                Plot.dodgeY(
                  { anchor: 'middle' },
                  { x: 'v', r: 4, fill: theme.mutedForeground, fillOpacity: 0.3, stroke: theme.card, strokeWidth: 1 },
                ),
              ),
            ]
          : []),
        Plot.ruleX([department], { stroke: theme.rule, strokeDasharray: '4,4' }),
        Plot.text(
          [
            // One label when the two coincide — a single department tenant makes them
            // identical, and two stacked labels at the same x reads as a rendering fault.
            same
              ? `dept · university ${fmt2(department)}`
              : `dept ${fmt2(department)}`,
          ],
          {
            x: department, frameAnchor: 'top', dy: -14, dx: 3,
            fill: theme.mutedForeground, fontSize: CHART_TICK_FONT_SIZE, textAnchor: 'start',
          },
        ),
        ...(same
          ? []
          : [
              Plot.ruleX([university], { stroke: theme.rule, strokeDasharray: '1,3' }),
              Plot.text([`university ${fmt2(university)}`], {
                x: university, frameAnchor: 'top', dy: -2, dx: 3,
                fill: theme.mutedForeground, fontSize: CHART_TICK_FONT_SIZE, textAnchor: 'start',
              }),
            ]),
        // You.
        Plot.dot([{ v: value }], {
          x: 'v',
          r: 7,
          fill: theme.brand,
          stroke: theme.card,
          strokeWidth: 2,
        }),
        Plot.text([`${fmt2(value)}`], {
          x: value, frameAnchor: 'middle', dy: -18,
          fill: theme.foreground, fontSize: CHART_TICK_FONT_SIZE, fontWeight: 600,
          stroke: theme.card, strokeWidth: 3, paintOrder: 'stroke',
        }),
        /*
          Story 15's standing — ON the dot, never as a KPI tile.

          The dot's position in the swarm ALREADY is the percentile; you can count the peers
          to its left. Printing it as a fourth tile would be a bare number restating what the
          chart shows (VIZ-010, VIZ-002 "viz first, text annotates"), and it would restate it
          in the weakest form: "63rd" tells you where you stand but not that the pack is
          bunched between 4.0 and 4.4 with you a hair outside it.

          Bound to `showPeers`, which is the §7.3 RBAC lens — the ban on percentile is a ban
          on the SELF-view, where it reverse-encodes peer rank. The admin lens ranks faculty
          by name on the leaderboard one card up, so there is nothing left to leak here.
        */
        ...(showPeers && standing !== null
          ? [
              Plot.text([standing], {
                x: value, frameAnchor: 'bottom', dy: 14,
                fill: theme.mutedForeground, fontSize: CHART_TICK_FONT_SIZE,
                stroke: theme.card, strokeWidth: 3, paintOrder: 'stroke',
              }),
            ]
          : []),
      ],
    }),
    [peers, value, department, university, showPeers, same, standing],
  )

  return <PlotFigure spec={spec} height={height} />
}

/* ════════════════════════════════════════════════════════════════════════════
   Stories 16 + 19 — one component, because they are one idea: the course as the
   unit of analysis *within* a person. The legacy app only ever sliced a person by
   term, which is why "ranked best to worst" and "trends by course" both came back
   MISSING there.

   Ranked rows, each carrying its own trend — the Pinterest "Rank │ Category │ Trend
   │ Growth" shape. Degrades to n=1 without looking broken (some faculty teach one
   course, so "ranked best to worst" over a list of one has to read sanely).
   ════════════════════════════════════════════════════════════════════════════ */

export function CourseRankSpark({ course, median }: { course: FacultyCourseStat; median: number }) {
  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 2,
      marginRight: 2,
      marginTop: 6,
      marginBottom: 6,
      x: { axis: null, domain: course.trend.map((t) => t.short) },
      y: { axis: null, domain: SCORE_VIEW },
      marks: [
        Plot.ruleY([median], { stroke: theme.border, strokeDasharray: '2,3' }),
        ...(course.trend.length > 1
          ? [
              Plot.line(course.trend, {
                x: 'short',
                y: 'rating',
                stroke: theme.content,
                strokeWidth: 1.75,
                curve: 'monotone-x',
              }),
            ]
          : []),
        Plot.dot(course.trend, {
          x: 'short',
          y: 'rating',
          r: 2.5,
          fill: (d: { rating: number }) => (d.rating < median ? theme.warn : theme.content),
          channels: { Term: 'term', Score: (d: { rating: number }) => fmt2(d.rating) },
          tip: { format: { x: false, y: false, fill: false, r: false } },
        }),
      ],
    }),
    [course, median],
  )

  return <PlotFigure spec={spec} height={40} />
}

/* ── Sparkline for a KPI tile — VIZ-010 forbids a bare number on a dashboard card. ── */

export function KpiSpark({
  points,
  tone = 'brand',
  seriesIndex,
  height = 34,
}: {
  points: { x: number; y: number }[]
  tone?: 'brand' | 'warn' | 'good'
  /**
   * Pin the spark to a `--chart-N` series colour so a metric keeps ONE identity across the
   * tab. Without this the faculty KPI spark drew in brand while the faculty line in
   * "Program trajectory" drew in --chart-2 — the same metric in two colours on one screen,
   * which trains the reader that colour means nothing.
   */
  seriesIndex?: number
  height?: number
}) {
  const spec = React.useCallback(
    (theme: PlotTheme) => {
      const stroke =
        seriesIndex != null
          ? theme.series[seriesIndex] ?? theme.brand
          : tone === 'warn'
            ? theme.warn
            : tone === 'good'
              ? theme.rate
              : theme.brand
      return {
        marginLeft: 1,
        marginRight: 1,
        marginTop: 4,
        marginBottom: 4,
        x: { axis: null },
        y: { axis: null, domain: [Math.min(...points.map((p) => p.y)) * 0.96, Math.max(...points.map((p) => p.y)) * 1.04] },
        marks: [
          // No areaY. The y domain here is [min*0.96, max*1.04] — a tight window that never
          // includes zero — so an area filling to y=0 was not a sparkline fill at all: it was
          // a solid rectangle covering the whole tile and bleeding past the card edge. That is
          // the "decorative gradient blob" it rendered as. Area under a truncated baseline
          // measures nothing. A sparkline is a line.
          Plot.line(points, { x: 'x', y: 'y', stroke, strokeWidth: 1.5, curve: 'monotone-x' }),
          Plot.dot(points.slice(-1), { x: 'x', y: 'y', r: 2.5, fill: stroke }),
        ],
      }
    },
    [points, tone, seriesIndex],
  )

  // A sparkline needs ≥3 points to show a shape. Returning null would leave the tile as a
  // bare number, which is precisely what VIZ-010 forbids — so say why the trend is missing
  // rather than silently omitting it.
  if (points.length < 3) {
    return (
      <p className="py-2 text-xs text-muted-foreground">
        {points.length <= 1 ? 'One term of data. No trend yet.' : 'Two terms of data. Not enough for a trend.'}
      </p>
    )
  }
  return <PlotFigure spec={spec} height={height} />
}

/* ── Course-level ranked dots, reused by By Course + the "needs attention" split. ── */

/** Default rows for "Courses scoring lowest" — enough to act on, few enough to read. */
export const COURSE_RANK_LIMIT = 6

export function CourseRankDots({
  courses,
  median,
  limit = COURSE_RANK_LIMIT,
  height,
}: {
  courses: CourseStat[]
  median: number
  /** How many of the lowest to draw. The caller must say what was dropped — no silent caps. */
  limit?: number
  height?: number
}) {
  /**
   * The N LOWEST, worst first — the card is called "Courses scoring lowest" and its job
   * (story 3) is to flag low courses.
   *
   * It used to take whatever order it was handed and render all 15, best first, so the top
   * row of "Courses scoring lowest" was NURS-510 at 4.38 — the highest course in the program,
   * above the median. A card that promises the worst and opens with the best is not a ranking
   * problem, it's a truthfulness one. The screenshot caught it; no test could.
   *
   * `limit` is applied here rather than by the caller so the chart and its ChartDataTable
   * cannot drift apart about which rows exist.
   *
   * Pending/na courses have no score to rank by — filtered out before the sort, same
   * principle as `FacultyLeaderboardDots`/`FacultyScoreStrip` above.
   */
  const ranked = React.useMemo(
    () =>
      courses
        .filter(
          (c): c is typeof c & { score: { state: 'value'; value: DualMean } } => c.score.state === 'value',
        )
        .sort((a, b) => a.score.value.weighted - b.score.value.weighted)
        .slice(0, limit),
    [courses, limit],
  )
  const order = React.useMemo(() => ranked.map((c) => c.courseCode), [ranked])
  const spread = React.useMemo(
    () => ranked.flatMap((c) => c.ratings.map((r) => ({ code: c.courseCode, rating: r }))),
    [ranked],
  )

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 76,
      marginRight: 44,
      marginTop: 18,
      x: { domain: SCORE_VIEW, label: null, ticks: 5, ...axisDefaults(theme) },
      y: { domain: order, label: null, ...axisDefaults(theme) },
      marks: [
        Plot.ruleY(ranked, {
          y: 'courseCode',
          x1: (d) => Math.min(...d.ratings),
          x2: (d) => Math.max(...d.ratings),
          stroke: theme.border,
          strokeWidth: 2,
        }),
        Plot.dot(spread, { x: 'rating', y: 'code', r: 2.5, fill: theme.mutedForeground, fillOpacity: 0.4 }),
        Plot.dot(ranked, {
          x: (d) => d.score.value.weighted,
          y: 'courseCode',
          r: 5,
          fill: (d) => (d.score.value.weighted < median ? theme.warn : theme.content),
          stroke: theme.card,
          strokeWidth: 1.5,
          channels: {
            Course: (d) => `${d.courseCode} · ${d.courseName}`,
            Weighted: (d) => fmt2(d.score.value.weighted),
            'Simple mean': (d) => fmt2(d.score.value.simple),
            Terms: 'terms',
            'Response rate': (d) => `${d.responseRate}%`,
          },
          tip: { format: { x: false, y: true, fill: false, r: false } },
        }),
        Plot.ruleX([median], { stroke: theme.rule, strokeDasharray: '4,4' }),
        Plot.text([`median ${fmt2(median)}`], {
          x: median, frameAnchor: 'top', dy: -8, dx: 4,
          fill: theme.mutedForeground, fontSize: CHART_TICK_FONT_SIZE, textAnchor: 'start',
        }),
        // Pinned to the right frame — see the note in FacultyLeaderboardDots.
        Plot.text(ranked, {
          y: 'courseCode',
          text: (d) => fmt2(d.score.value.weighted),
          frameAnchor: 'right',
          dx: 34,
          fill: theme.foreground,
          fontSize: CHART_TICK_FONT_SIZE,
          textAnchor: 'end',
        }),
      ],
    }),
    [ranked, spread, order, median],
  )

  // `ranked.length`, not `courses.length` — a roster that's entirely Pending/na filters down
  // to zero rankable rows even though `courses` itself isn't empty, and rendering the chart
  // shell on zero marks is a broken-looking empty state instead of the real one.
  if (!ranked.length) return <ChartEmpty note="No courses with evaluated offerings yet." />

  // `ranked.length`, not `courses.length` — sizing on the unsliced list reserved 520px for 15
  // rows while drawing 6, which is where the card's ~250px of dead white space came from.
  return <PlotFigure spec={spec} height={height ?? Math.max(160, ranked.length * 32 + 40)} />
}
