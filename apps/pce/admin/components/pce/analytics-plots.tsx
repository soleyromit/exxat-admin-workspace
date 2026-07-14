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
import { heatmapCellColor, heatmapCellUsesLightText } from '@/lib/chart-heatmap-scale'
import { CHART_TICK_FONT_SIZE } from '@/lib/chart-typography'
import type {
  FacultyStat,
  CourseStat,
  GapPoint,
  HeatCell,
  TermSeriesPoint,
  FacultyCourseStat,
} from '@/lib/pce-analytics'

const SCORE_DOMAIN: [number, number] = [1, 5]
/** Scores cluster 3.4–4.8; a full 1–5 axis flattens every difference into noise. */
const SCORE_VIEW: [number, number] = [3.0, 5]

const fmt2 = (v: number) => v.toFixed(2)

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
        Plot.dot(faculty, {
          x: (d: FacultyStat) => d.score.weighted,
          y: 'name',
          r: 5,
          fill: (d: FacultyStat) => (d.score.weighted < median ? theme.warn : theme.brand),
          stroke: theme.card,
          strokeWidth: 1.5,
          channels: {
            Weighted: (d: FacultyStat) => fmt2(d.score.weighted),
            'Simple mean': (d: FacultyStat) => fmt2(d.score.simple),
            Offerings: (d: FacultyStat) => d.offerings,
            Courses: (d: FacultyStat) => d.courses,
            'Response rate': (d: FacultyStat) => `${d.responseRate}%`,
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
        Plot.text(faculty, {
          y: 'name',
          text: (d: FacultyStat) => fmt2(d.score.weighted),
          frameAnchor: 'right',
          dx: 34,
          fill: theme.foreground,
          fontSize: CHART_TICK_FONT_SIZE,
          textAnchor: 'end',
        }),
      ],
    }),
    [faculty, spread, order, median],
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
      key: `${p.courseCode}::${p.term}`,
      residual: Math.abs(p.facultyAvg - (slope * p.courseAvg + intercept)),
    }))
    const sd = Math.sqrt(scored.reduce((s, r) => s + r.residual ** 2, 0) / scored.length)
    if (!(sd > 0)) return empty
    const off = scored.filter((r) => r.residual > sd * 1.2)

    // One label per COURSE, not per offering. A course that is off-trend in three terms is
    // one story, and naming it three times just stacks text on its own cluster — which is
    // exactly what happened once the scenarios gained depth.
    const bestPerCourse = new Map<string, { key: string; residual: number }>()
    off.forEach((r) => {
      const code = r.key.split('::')[0]!
      const prev = bestPerCourse.get(code)
      if (!prev || r.residual > prev.residual) bestPerCourse.set(code, r)
    })
    const top = [...bestPerCourse.values()]
      .sort((a, b) => b.residual - a.residual)
      .slice(0, MAX_PLOT_LABELS)

    return {
      outliers: new Set(off.map((r) => r.key)),
      labelled: new Set(top.map((r) => r.key)),
    }
  }, [points])

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 44,
      marginBottom: 36,
      marginTop: 24,
      marginRight: 20,
      x: { domain: SCORE_VIEW, label: 'Course content score →', labelAnchor: 'center' as const, ...axisDefaults(theme) },
      y: { domain: SCORE_VIEW, label: '↑ Faculty score', labelAnchor: 'center' as const, ...axisDefaults(theme) },
      r: { range: [3, 14] },
      marks: [
        gridMark(theme),

        // Quadrant split at the program means.
        Plot.ruleX([courseMean], { stroke: theme.rule, strokeDasharray: '4,4' }),
        Plot.ruleY([facultyMean], { stroke: theme.rule, strokeDasharray: '4,4' }),

        // Quadrant labels — muted, so they read as scaffolding not data.
        Plot.text(['Faculty strong · course gap'], {
          frameAnchor: 'top-left', dx: 6, dy: 6, fill: theme.mutedForeground,
          fontSize: CHART_TICK_FONT_SIZE, textAnchor: 'start',
        }),
        Plot.text(['Both strong'], {
          frameAnchor: 'top-right', dx: -6, dy: 6, fill: theme.mutedForeground,
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

        // The trend + its 95% band — "is this low for its own kind?"
        Plot.linearRegressionY(points, {
          x: 'courseAvg',
          y: 'facultyAvg',
          stroke: theme.mutedForeground,
          strokeOpacity: 0.7,
          fill: theme.mutedForeground,
          fillOpacity: 0.08,
          ci: 0.95,
        }),

        Plot.dot(points, {
          x: 'courseAvg',
          y: 'facultyAvg',
          r: 'enrolled',
          fill: (d: GapPoint) =>
            outliers.has(`${d.courseCode}::${d.term}`) ? theme.warn : theme.brand,
          fillOpacity: 0.75,
          stroke: theme.card,
          strokeWidth: 1,
          channels: {
            Course: (d: GapPoint) => `${d.courseCode} — ${d.courseName}`,
            Term: 'term',
            'Course score': (d: GapPoint) => fmt2(d.courseAvg),
            'Faculty score': (d: GapPoint) => fmt2(d.facultyAvg),
            Enrolled: 'enrolled',
          },
          tip: { format: { x: false, y: false, r: false, fill: false } },
        }),

        // Name only the sharpest few — see the note on `labelled`.
        Plot.text(
          points.filter((p) => labelled.has(`${p.courseCode}::${p.term}`)),
          {
            x: 'courseAvg',
            y: 'facultyAvg',
            text: (d: GapPoint) => `${d.courseCode} · ${d.short}`,
            dy: -14,
            fill: theme.foreground,
            fontSize: CHART_TICK_FONT_SIZE,
            stroke: theme.card,
            strokeWidth: 3,
            paintOrder: 'stroke',
          },
        ),
      ],
    }),
    [points, courseMean, facultyMean, outliers, labelled],
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

export function CourseTermHeat({
  cells,
  courses,
  terms,
  height,
}: {
  cells: HeatCell[]
  courses: string[]
  terms: string[]
  height?: number
}) {
  const [lo, hi] = React.useMemo(() => {
    const vals = cells.map((c) => c.courseAvg)
    // Math.min(...[]) is Infinity and Math.max(...[]) is -Infinity. The norm() guard below
    // happens to survive that, but shipping IEEE sentinels into a scale is a trap for the
    // next edit — fall back to the score domain instead.
    if (!vals.length) return SCORE_DOMAIN
    return [Math.min(...vals), Math.max(...vals)]
  }, [cells])

  const norm = React.useCallback(
    (v: number) => (hi > lo ? (v - lo) / (hi - lo) : 0.5),
    [lo, hi],
  )

  /**
   * Every course × term slot, including the ones with no survey.
   *
   * Without this layer the sparse rows render as isolated rectangles and the whole thing
   * reads as a bar chart rather than a matrix. Drawing the empty slots makes the grid a grid
   * — and makes absence legible, which is the point: a term a course went un-evaluated is an
   * accreditation finding, not a rendering gap.
   */
  const slots = React.useMemo(
    () => courses.flatMap((courseCode) => terms.map((term) => ({ courseCode, term }))),
    [courses, terms],
  )

  const spec = React.useCallback(
    (theme: PlotTheme) => {
      // theme.* comes from `resolveToken`, which actually resolves the cascade —
      // `readChartToken` silently returns its fallback for any var() token.
      const brand = theme.brand
      const card = theme.card
      const lightText = theme.primaryForeground
      return {
        marginLeft: 84,
        marginTop: 24,
        marginBottom: 8,
        x: { domain: terms.map((t) => t), label: null, ...axisDefaults(theme) },
        y: { domain: courses, label: null, ...axisDefaults(theme) },
        color: { type: 'identity' as const },
        marks: [
          // Empty slots first — the grid the data cells sit in.
          Plot.cell(slots, {
            x: 'term',
            y: 'courseCode',
            fill: theme.card,
            stroke: theme.border,
            strokeOpacity: 0.7,
            inset: 1,
            rx: 3,
          }),
          Plot.cell(cells, {
            x: 'term',
            y: 'courseCode',
            fill: (d: HeatCell) => heatmapCellColor(norm(d.courseAvg), 1, brand, card),
            inset: 1,
            rx: 3,
            channels: {
              Course: 'courseCode',
              Term: 'term',
              'Course score': (d: HeatCell) => fmt2(d.courseAvg),
              'Faculty score': (d: HeatCell) => (d.facultyAvg != null ? fmt2(d.facultyAvg) : '—'),
            },
            tip: { format: { x: false, y: false, fill: false } },
          }),
          // The number in the cell — color alone can never be the encoding (A11Y-008).
          Plot.text(cells, {
            x: 'term',
            y: 'courseCode',
            text: (d: HeatCell) => fmt2(d.courseAvg),
            fill: (d: HeatCell) =>
              heatmapCellUsesLightText(norm(d.courseAvg), 1) ? lightText : theme.foreground,
            fontSize: CHART_TICK_FONT_SIZE,
          }),
        ],
      }
    },
    [cells, courses, terms, norm, slots],
  )

  if (!cells.length) return <ChartEmpty note="No course-content scores recorded yet." />

  return <PlotFigure spec={spec} height={height ?? Math.max(180, courses.length * 34 + 44)} />
}

/* ════════════════════════════════════════════════════════════════════════════
   Stories 2 & 3 — Who needs attention, on 1-year vs 3-year trends.
   Q: "Where does X stand vs its own past?" → RUBRIC Q1/Q5 → paired change (VIZ-PATTERN-004).
   A: comment to faculty / internal note / escalate.

   An arrow from the 3-year mean to the 1-year mean. Direction and magnitude in one mark,
   rows sorted by drift so the movers are at the ends. Two columns of numbers (the legacy
   app's leaderboard) is exactly the duo-numbers shape VIZ-006 forbids.
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
   * Zoom the axis to the values actually plotted, with padding.
   *
   * Real drifts in this data are ±0.2 on a 1–5 scale. Rendered on the full score axis every
   * arrow collapses to a dot and the mark conveys nothing — the chart would be decorative.
   * The axis still shows its own ticks, so the zoom is legible rather than misleading.
   */
  const domain = React.useMemo<[number, number]>(() => {
    if (!usable.length) return SCORE_VIEW
    const vals = usable.flatMap((r) => [r.avg1y, r.avg3y])
    const lo = Math.min(...vals)
    const hi = Math.max(...vals)
    const pad = Math.max((hi - lo) * 0.35, 0.12)
    return [lo - pad, hi + pad]
  }, [usable])

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 132,
      marginRight: 56,
      marginTop: 20,
      x: { domain, label: null, ticks: 4, ...axisDefaults(theme) },
      y: { domain: order, label: null, ...axisDefaults(theme) },
      marks: [
        // Where they were.
        Plot.dot(usable, {
          x: 'avg3y',
          y: 'label',
          r: 3.5,
          fill: theme.card,
          stroke: theme.mutedForeground,
          strokeWidth: 1.5,
        }),
        // Where they are now — arrow carries direction + magnitude.
        Plot.arrow(usable, {
          x1: 'avg3y',
          x2: 'avg1y',
          y1: 'label',
          y2: 'label',
          stroke: (d: (typeof usable)[number]) => (d.drift < 0 ? theme.warn : theme.good),
          strokeWidth: 2,
          headLength: 6,
          insetEnd: 4,
        }),
        Plot.dot(usable, {
          x: 'avg1y',
          y: 'label',
          r: 4.5,
          fill: (d: (typeof usable)[number]) => (d.drift < 0 ? theme.warn : theme.good),
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

export function ProgramTrendStack({
  series,
  responseTarget = 80,
}: {
  series: TermSeriesPoint[]
  responseTarget?: number
}) {
  const scoreRows = React.useMemo(
    () =>
      series.flatMap((s) => [
        ...(s.courseAvg != null ? [{ term: s.short, metric: 'Course content', value: s.courseAvg }] : []),
        ...(s.facultyAvg != null ? [{ term: s.short, metric: 'Faculty', value: s.facultyAvg }] : []),
      ]),
    [series],
  )

  const rateRows = React.useMemo(
    () => series.filter((s) => s.responseRate != null).map((s) => ({ term: s.short, value: s.responseRate as number })),
    [series],
  )

  const termOrder = React.useMemo(() => series.map((s) => s.short), [series])

  const scoreSpec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 36,
      marginTop: 16,
      marginBottom: 4,
      // The term axis belongs to the LOWER plot only — the two are stacked precisely so
      // there is one shared axis to read across. Drawing it twice defeats the arrangement.
      x: { domain: termOrder, label: null, axis: null },
      y: { domain: SCORE_VIEW, label: null, ticks: 4, ...axisDefaults(theme) },
      color: {
        domain: ['Course content', 'Faculty'],
        range: [theme.series[0]!, theme.series[1]!],
        legend: true,
      },
      marks: [
        gridMark(theme),
        Plot.line(scoreRows, { x: 'term', y: 'value', stroke: 'metric', strokeWidth: 2, curve: 'monotone-x' }),
        Plot.dot(scoreRows, {
          x: 'term',
          y: 'value',
          fill: 'metric',
          r: 3,
          channels: { Term: 'term', Metric: 'metric', Score: (d: { value: number }) => fmt2(d.value) },
          tip: { format: { x: false, y: false, fill: false } },
        }),
      ],
    }),
    [scoreRows, termOrder],
  )

  const rateSpec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 36,
      marginTop: 16,
      marginBottom: 22,
      x: { domain: termOrder, label: null, ...axisDefaults(theme) },
      y: { domain: [0, 100], label: null, ticks: 3, tickFormat: (d: number) => `${d}%`, ...axisDefaults(theme) },
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
        Plot.areaY(rateRows, {
          x: 'term',
          y: 'value',
          fill: theme.series[2]!,
          fillOpacity: 0.12,
          curve: 'monotone-x',
        }),
        Plot.line(rateRows, { x: 'term', y: 'value', stroke: theme.series[2]!, strokeWidth: 2, curve: 'monotone-x' }),
        Plot.dot(rateRows, {
          x: 'term',
          y: 'value',
          fill: (d: { value: number }) => (d.value < responseTarget ? theme.warn : theme.series[2]!),
          r: 3,
          channels: { Term: 'term', 'Response rate': (d: { value: number }) => `${d.value}%` },
          tip: { format: { x: false, y: false, fill: false } },
        }),
      ],
    }),
    [rateRows, termOrder, responseTarget],
  )

  return (
    <div className="flex flex-col">
      <PlotFigure spec={scoreSpec} height={150} />
      <PlotFigure spec={rateSpec} height={104} />
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

export function FacultyCompareLines({
  rows,
  programMean,
  height,
}: {
  rows: { facultyId: string; name: string; short: string; year: number; rating: number }[]
  programMean: number
  height?: number
}) {
  const termOrder = React.useMemo(
    () => [...new Map(rows.map((r) => [r.short, r.year])).entries()].sort((a, b) => a[1] - b[1]).map(([s]) => s),
    [rows],
  )

  const names = React.useMemo(() => [...new Set(rows.map((r) => r.name))].sort(), [rows])

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
          stroke: theme.brand,
          strokeWidth: 2,
          curve: 'monotone-x',
        }),
        Plot.dot(rows, {
          fy: 'name',
          x: 'short',
          y: 'rating',
          r: 2.5,
          fill: (d: { rating: number }) => (d.rating < programMean ? theme.warn : theme.brand),
          channels: { Faculty: 'name', Term: 'short', Score: (d: { rating: number }) => fmt2(d.rating) },
          tip: { format: { x: false, y: false, fill: false, r: false, fy: false } },
        }),
      ],
    }),
    [rows, ghost, termOrder, names, programMean],
  )

  if (!names.length) return <ChartEmpty note="No faculty scores recorded across terms yet." />

  return <PlotFigure spec={spec} height={height ?? Math.max(260, names.length * 76 + 44)} />
}

/* ════════════════════════════════════════════════════════════════════════════
   Story 11 — one faculty member's response-rate trend.
   Q4 → line + target. "Single % delta with arrow" is the RUBRIC's ❌ here: it hides
   the path, and a drop-and-recovery looks identical to flat.
   ════════════════════════════════════════════════════════════════════════════ */

export function ResponseTrendLine({
  rows,
  target = 80,
  height = 170,
}: {
  rows: { short: string; year: number; responseRate: number }[]
  target?: number
  height?: number
}) {
  const termOrder = React.useMemo(() => rows.map((r) => r.short), [rows])

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 36,
      marginTop: 16,
      marginBottom: 24,
      x: { domain: termOrder, label: null, ...axisDefaults(theme) },
      y: { domain: [0, 100], label: null, ticks: 4, tickFormat: (d: number) => `${d}%`, ...axisDefaults(theme) },
      marks: [
        gridMark(theme),
        Plot.ruleY([target], { stroke: theme.rule, strokeDasharray: '4,4' }),
        Plot.text([`target ${target}%`], {
          y: target,
          frameAnchor: 'right',
          dy: -7,
          dx: -2,
          fill: theme.mutedForeground,
          fontSize: CHART_TICK_FONT_SIZE,
          textAnchor: 'end',
        }),
        Plot.areaY(rows, { x: 'short', y: 'responseRate', fill: theme.brand, fillOpacity: 0.1, curve: 'monotone-x' }),
        Plot.line(rows, { x: 'short', y: 'responseRate', stroke: theme.brand, strokeWidth: 2, curve: 'monotone-x' }),
        Plot.dot(rows, {
          x: 'short',
          y: 'responseRate',
          r: 3.5,
          fill: (d: { responseRate: number }) => (d.responseRate < target ? theme.warn : theme.brand),
          stroke: theme.card,
          strokeWidth: 1,
          channels: { Term: 'short', 'Response rate': (d: { responseRate: number }) => `${d.responseRate}%` },
          tip: { format: { x: false, y: false, fill: false, r: false } },
        }),
      ],
    }),
    [rows, termOrder, target],
  )

  return <PlotFigure spec={spec} height={height} />
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
      ],
    }),
    [peers, value, department, university, showPeers, same],
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
                stroke: theme.brand,
                strokeWidth: 1.75,
                curve: 'monotone-x',
              }),
            ]
          : []),
        Plot.dot(course.trend, {
          x: 'short',
          y: 'rating',
          r: 2.5,
          fill: (d: { rating: number }) => (d.rating < median ? theme.warn : theme.brand),
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
              ? theme.good
              : theme.brand
      return {
        marginLeft: 1,
        marginRight: 1,
        marginTop: 4,
        marginBottom: 4,
        x: { axis: null },
        y: { axis: null, domain: [Math.min(...points.map((p) => p.y)) * 0.96, Math.max(...points.map((p) => p.y)) * 1.04] },
        marks: [
          Plot.areaY(points, { x: 'x', y: 'y', fill: stroke, fillOpacity: 0.1, curve: 'monotone-x' }),
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
        {points.length <= 1 ? 'One term of data — no trend yet.' : 'Two terms of data — not enough for a trend.'}
      </p>
    )
  }
  return <PlotFigure spec={spec} height={height} />
}

/* ── Course-level ranked dots, reused by By Course + the "needs attention" split. ── */

export function CourseRankDots({
  courses,
  median,
  height,
}: {
  courses: CourseStat[]
  median: number
  height?: number
}) {
  const order = React.useMemo(() => courses.map((c) => c.courseCode), [courses])
  const spread = React.useMemo(
    () => courses.flatMap((c) => c.ratings.map((r) => ({ code: c.courseCode, rating: r }))),
    [courses],
  )

  const spec = React.useCallback(
    (theme: PlotTheme) => ({
      marginLeft: 76,
      marginRight: 44,
      marginTop: 18,
      x: { domain: SCORE_VIEW, label: null, ticks: 5, ...axisDefaults(theme) },
      y: { domain: order, label: null, ...axisDefaults(theme) },
      marks: [
        Plot.ruleY(courses, {
          y: 'courseCode',
          x1: (d: CourseStat) => Math.min(...d.ratings),
          x2: (d: CourseStat) => Math.max(...d.ratings),
          stroke: theme.border,
          strokeWidth: 2,
        }),
        Plot.dot(spread, { x: 'rating', y: 'code', r: 2.5, fill: theme.mutedForeground, fillOpacity: 0.4 }),
        Plot.dot(courses, {
          x: (d: CourseStat) => d.score.weighted,
          y: 'courseCode',
          r: 5,
          fill: (d: CourseStat) => (d.score.weighted < median ? theme.warn : theme.brand),
          stroke: theme.card,
          strokeWidth: 1.5,
          channels: {
            Course: (d: CourseStat) => `${d.courseCode} — ${d.courseName}`,
            Weighted: (d: CourseStat) => fmt2(d.score.weighted),
            'Simple mean': (d: CourseStat) => fmt2(d.score.simple),
            Terms: 'terms',
            'Response rate': (d: CourseStat) => `${d.responseRate}%`,
          },
          tip: { format: { x: false, y: true, fill: false, r: false } },
        }),
        Plot.ruleX([median], { stroke: theme.rule, strokeDasharray: '4,4' }),
        Plot.text([`median ${fmt2(median)}`], {
          x: median, frameAnchor: 'top', dy: -8, dx: 4,
          fill: theme.mutedForeground, fontSize: CHART_TICK_FONT_SIZE, textAnchor: 'start',
        }),
        // Pinned to the right frame — see the note in FacultyLeaderboardDots.
        Plot.text(courses, {
          y: 'courseCode',
          text: (d: CourseStat) => fmt2(d.score.weighted),
          frameAnchor: 'right',
          dx: 34,
          fill: theme.foreground,
          fontSize: CHART_TICK_FONT_SIZE,
          textAnchor: 'end',
        }),
      ],
    }),
    [courses, spread, order, median],
  )

  if (!courses.length) return <ChartEmpty note="No courses with evaluated offerings yet." />

  return <PlotFigure spec={spec} height={height ?? Math.max(160, courses.length * 32 + 40)} />
}
