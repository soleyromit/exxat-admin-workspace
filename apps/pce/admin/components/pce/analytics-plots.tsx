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
import { RESPONSE_TARGET } from '@/lib/pce-analytics'
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
          // Every dot here IS a faculty member — so `faculty`, not brand. Brand is
          // reserved for the SUBJECT of a view, and a leaderboard has no subject.
          fill: (d: FacultyStat) => (d.score.weighted < median ? theme.warn : theme.faculty),
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
            Course: (d: GapPoint) => `${d.courseCode} — ${d.courseName}`,
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

/**
 * §3 asks for a clickable cell ("Heatmap cell OT-401/Fa 2025 → view → /results/result-006")
 * and this does NOT do that, deliberately. Two reasons, verified rather than assumed:
 *   1. Plot has no event API — passing `onclick`/`cursor` as mark options is silently ignored.
 *      Measured: 127 rects rendered, 0 with a click handler, 0 with cursor:pointer. Shipping
 *      the option would have produced a dead affordance.
 *   2. More fundamentally, the Plot SVG is `aria-hidden` — that is how the chart avoids axe's
 *      `aria-prohibited-attr` and delegates its accessible duty to ChartFigure + the sr-only
 *      ChartDataTable. A click target inside aria-hidden is mouse-only: unreachable by
 *      keyboard or a screen reader. A door only some people can walk through is not a door.
 *
 * The course-term door is the "Every offering" register below instead: searchable by course,
 * keyboard-reachable, and it opens the same result. The heatmap's job is the pattern; the
 * register's job is the reach.
 */
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
  /** The term the tab is scoped to — marked so the trend reads as context around it. */
  scopedTerm?: string
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
  const scopedShort = React.useMemo(
    () => rows.find((r) => r.term === scopedTerm)?.short,
    [rows, scopedTerm],
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
        // The scoped term, marked before everything else so it reads as ground, not figure.
        ...(scopedShort
          ? [Plot.ruleX([scopedShort], { stroke: theme.border, strokeWidth: 12, strokeOpacity: 0.55 })]
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
    [rows, termOrder, target, scopedShort],
  )

  if (!rows.length) return <ChartEmpty note="No response history recorded yet." />

  return <PlotFigure spec={spec} height={height} />
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
  height = 96,
}: {
  faculty: FacultyStat[]
  median: number
  height?: number
}) {
  const rows = React.useMemo(
    () => faculty.map((f) => ({ name: f.name, score: f.score.weighted })),
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
        Plot.tickX(rows, {
          x: 'score',
          stroke: (d: { score: number }) => (d.score < median ? theme.warn : theme.faculty),
          strokeWidth: 2,
          strokeOpacity: 0.7,
          channels: { Faculty: 'name', Score: (d: { score: number }) => d.score.toFixed(2) },
          tip: { format: { x: false, stroke: false } },
        }),
      ],
    }),
    [rows, median],
  )

  if (!rows.length) return <ChartEmpty note="No faculty in scope." />

  return <PlotFigure spec={spec} height={height} />
}

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
      ],
    }),
    [scoreRows, termOrder, scoreDomain],
  )

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
      ],
    }),
    [rateRows, termOrder, responseTarget],
  )

  // ChartCard's shell is `h-full`, so in a 50/50 row this card stretches to the taller one
  // beside it. Spend that height on the plots rather than leaving it blank under them.
  return (
    <div className="flex flex-col">
      <PlotFigure spec={scoreSpec} height={196} />
      <PlotFigure spec={rateSpec} height={124} />
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
        // Both ends labelled — a slopegraph with one label is a mystery.
        Plot.text(
          points.filter((p) => p.side === fromLabel),
          {
            x: 'side', y: 'value', text: 'code', textAnchor: 'end', dx: -8,
            fill: theme.mutedForeground, fontSize: CHART_TICK_FONT_SIZE,
          },
        ),
        Plot.text(
          points.filter((p) => p.side === toLabel),
          {
            x: 'side',
            y: 'value',
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
    [points, domain, fromLabel, toLabel],
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
}: {
  rows: { short: string; year: number; courseAvg: number | null; facultyAvg: number; responseRate: number }[]
  responseTarget?: number
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
      ],
    }),
    [scoreRows, termOrder, scoreDomain],
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
      ],
    }),
    [rows, termOrder, responseTarget],
  )

  if (rows.length < 2) return <ChartEmpty note="One term of history — a trend needs at least two." />

  return (
    <div className="flex flex-col">
      <PlotFigure spec={scoreSpec} height={172} />
      <PlotFigure spec={rateSpec} height={116} />
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
        {points.length <= 1 ? 'One term of data — no trend yet.' : 'Two terms of data — not enough for a trend.'}
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
   * row of "Courses scoring lowest" was DPT-510 at 4.38 — the highest course in the program,
   * above the median. A card that promises the worst and opens with the best is not a ranking
   * problem, it's a truthfulness one. The screenshot caught it; no test could.
   *
   * `limit` is applied here rather than by the caller so the chart and its ChartDataTable
   * cannot drift apart about which rows exist.
   */
  const ranked = React.useMemo(
    () => [...courses].sort((a, b) => a.score.weighted - b.score.weighted).slice(0, limit),
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
          x1: (d: CourseStat) => Math.min(...d.ratings),
          x2: (d: CourseStat) => Math.max(...d.ratings),
          stroke: theme.border,
          strokeWidth: 2,
        }),
        Plot.dot(spread, { x: 'rating', y: 'code', r: 2.5, fill: theme.mutedForeground, fillOpacity: 0.4 }),
        Plot.dot(ranked, {
          x: (d: CourseStat) => d.score.weighted,
          y: 'courseCode',
          r: 5,
          fill: (d: CourseStat) => (d.score.weighted < median ? theme.warn : theme.content),
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
        Plot.text(ranked, {
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
    [ranked, spread, order, median],
  )

  if (!courses.length) return <ChartEmpty note="No courses with evaluated offerings yet." />

  // `ranked.length`, not `courses.length` — sizing on the unsliced list reserved 520px for 15
  // rows while drawing 6, which is where the card's ~250px of dead white space came from.
  return <PlotFigure spec={spec} height={height ?? Math.max(160, ranked.length * 32 + 40)} />
}
