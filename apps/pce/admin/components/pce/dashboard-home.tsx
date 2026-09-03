'use client'

// ============================================================================
// Course Evaluation — Dashboard home, v9 "STATEMENT" (Aug 22 2026, round-2
// visual variant).
//
// SKIN: TERM STATEMENT — Mercury-banking-dashboard editorial language applied
// to the v8 IA (which is preserved wholesale: recs, buckets, hrefs, grid).
// Each term card is typeset like an authoritative program status report, not
// a dashboard widget:
//   - flat square-cornered sheet, hairline border, NO shadow; a 2px ink
//     head-rule across the top and a 3px DOUBLE rule above the footer (the
//     accountant's "total" rule) bracket the document;
//   - masthead: italic serif eyebrow (Current term / Last term / Upcoming
//     term — replaces the StatusBadge pill), term name in the DS serif
//     display face (`font-heading`, Ivy Presto); a 1px ink rule closes the
//     masthead (ROUND 4: dates are sans, not mono — see below);
//   - the #1 goal metric (response rate) is the card's ledger figure: large
//     serif numeral in plain ink, `target 80%` printed beside it, and a
//     small colored delta annotation beneath ("18 points below the 80%
//     target") — color ANNOTATES, the figure itself stays ink;
//   - facts read as dot-leader line items (`Coverage ……… 87%`), figures
//     right-aligned in tabular numerals;
//   - bucket rows are hairline-ruled ledger lines; course codes are named on
//     hover/focus behind a `CourseCodesTip` trigger, at-risk codes carried
//     in the reserved amber (never red) with an inline "N at risk" count;
//
// ROUND 3 — "TIMELINE" (Aug 22 2026): the row list stops being a list and
// becomes the term's lifecycle read top to bottom. Concretely:
//   - STATUS AT A GLANCE: the priority callout leads with a real glyph
//     (fa-triangle-exclamation amber when tinted; circle-info / circle-check
//     for the calm registers) so the register is recognizable pre-reading;
//   - EVIDENCE: the hero's plain thin bar is upgraded to `StatementGauge` —
//     the product's own documented BulletGauge pattern (dashed threshold
//     ticks at the validity floor + target, track filled to the reading in
//     ResponseProgressCell's exact tier color, a solid tick at the reading);
//   - JOURNEY: each bucket row gets its ORIGINAL production icon back
//     (fa-list-check / fa-calendar / fa-circle-dot / fa-flag-checkered /
//     fa-triangle-exclamation, per term-breakdown.tsx) as a NODE on a
//     continuous vertical rail beside the row stack. The rail is solid ink
//     up to the term's current operational position and lighter/dashed
//     beyond it; the current stage's node is filled ink (others hollow),
//     and the stage the callout is about takes the reserved amber accent.
//     The timeline shrinks to whatever stages a card actually shows
//     (Last = Live→Closed; Upcoming = roster→setup→scheduled).
//   - the priority callout is typeset, never boxed: serif pull-quote
//     headline + "Based on" show-your-work line; the emphasized state
//     becomes a full-bleed amber band (flat wash — no border, no nested
//     card).
// Color discipline (ROUND 4, Aug 24 2026 — superseded ROUND 3's "ink + muted
// carry the card, amber is the only signal" rule; Romit: "there isn't enough
// color coding done in these components"): amber stays the ONE reserved
// signal for genuine urgency, but every bucket row now also carries its own
// resting status tint — Live=success, Scheduled=planned, Closed=completed,
// Setup=neutral ink (same three-tint vocabulary `BreakdownRow` already uses
// elsewhere in this product) — so a row's TYPE reads at a glance instead of
// only its position on the rail. Urgency (amber) always overrides a bucket's
// resting tint when both apply to the same row.
//
// ROUND 4 — "CONNECTED ROWS" (Aug 24 2026 dashboard feedback). Two problems
// found live: (1) `font-mono` had spread to dates, KPI figures, footer text,
// and gauge tick labels — `exxat-mono-ids` reserves mono for system
// identifiers only (course codes), never dates or metrics; every other mono
// use above is now sans, tabular-nums doing the digit-alignment job mono
// used to. (2) each row's description sentence and its countdown chip were
// fed by the same date-clause helper and repeated it verbatim two lines
// apart ("Next closes today." directly above a chip reading "Next closes
// today") — Romit: "expecting a connected story with actions." The
// standalone countdown chip is retired; every date fact now prints exactly
// once, folded into the row's own sentence (`liveRowStory`,
// `scheduledRowStory`, `setupRowStory`), and the course-codes disclosure
// renders as that sentence's trailing clause instead of an orphan line
// between the sentence and the action button — sentence → disclosure →
// action, one flow instead of four stacked fragments.
//
// IA: TERM LIFECYCLE MONITOR (Romit, from the live PCE dashboard — IA base per
// pce-design-workflow; visuals mapped to DS, red → amber per aarti_no_red).
//
//   1. Terms triptych — Current / Last term / Upcoming slot. Card internals
//      are ported from the reviewed "priority-first" compare variant
//      (app/(app)/compare/dashboard-cards/variant-d-ai-forward.tsx, review
//      corrections landed Aug 19): each card leads with ONE prioritized
//      `PriorityCallout` recommendation (plain threshold logic, not AI —
//      labelled "Needs attention" / "Recommended" / "Status"), then a
//      `LaneDivider` into the pulled-data facts (`FactStrip`) and a `Ledger`
//      of `BreakdownRow`s, each keeping its own operable action (Set up /
//      Manage / Remind / Review feedback) independent of the headline.
//   2. Past terms / Future terms — two separately-headed, collapsed-by-default
//      disclosure tables below the kanban (split from one merged "Past terms"
//      table — Aug 19). Rows navigate to the term workspace.
//
// REMOVED from the dashboard (Romit: "too crowded"): KPI band, charts, and
// the cross-term action rail — per-course viz + the full work queue live in
// the term workspace (/course-evaluation/term/[id]); cross-term viz lives in
// Analytics. ONE status vocabulary; this page says "evaluations", never
// "surveys".
// ============================================================================

import { useMemo, useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Badge,
  Button,
  Tooltip, TooltipTrigger, TooltipContent,
  PageHeader,
  Card, CardHeader, CardTitle, CardContent, CardFooter,
  StatusBadge,
  Tip,
  KeyMetrics,
  LocalBanner,
  wizardMarkerClass, wizardLabelClass,
  Tabs, TabsList, TabsTrigger, TabsTriggerLabel, TabsCountBadge, TabsContent,
  type WizardStep,
  type MetricItem,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { TermEditorSheet, existingAcademicYears, draftTerm } from '@/components/pce/term-editor-sheet'
import { ProgressCell } from '@/components/data-views/table-cells'
import { ResponseProgressCell } from '@/components/pce/response-gauge'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import { DashboardResponseTrend, dashboardTrendLabel } from '@/components/pce/analytics-plots'
import { ChartCard, ChartFigure, ChartDataTable, type ChartLeoInsight } from '@/components/charts-core'
import { termSeries, programSummary, shortTerm, termToYear, type TermSeriesPoint } from '@/lib/pce-analytics'

import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'
import {
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_PLANNED,
  LIST_HUB_STATUS_TINT_COMPLETED,
  LIST_HUB_STATUS_TINT_NEUTRAL,
  type StatusTint,
} from '@/lib/list-status-badges'
import { auditTerm } from '@/lib/pce-term-readiness'
import { prismCoursesHref } from '@/lib/pce-course-readiness'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'
import {
  RESPONSE_TARGET,
  resolveTermPositions, snapshot, evalWindow, parseDate, breakdownFor, coveragePercent, isFullyCovered,
  coverageDetail, coverageCodes, scheduledCountdown,
  liveCountdown, liveAtRiskCodes, weightedRate, closedNarrative,
  STAGE_BADGE,
  termHasFinishedSurveys, nextTermAction,
  type TermSnapshot, type TermWindowPosition, type CourseBreakdown, type TermStage,
  type TermNextAction, type TermSetupStage,
} from '@/lib/pce-term-metrics'
import { MOCK_PROGRAM_TERMS, type PceSurvey, type PceTemplate, type ProgramTerm } from '@/lib/pce-mock-data'

const COVERAGE_TIP =
  "The share of this term's course offerings with an evaluation set up and collecting responses — not the response rate itself."

/* ── shared bits ──────────────────────────────────────────────────────────── */

/** The three window positions that render a kanban card — 'future' terms
 * (starting 30+ days out) never get a badge, they only surface in the
 * history tables below until they enter the Upcoming window. */
type TermPosition = Exclude<TermWindowPosition, 'future' | 'past'>

/** Masthead status — the real DS `StatusBadge`, not typeset text (Romit's
 *  catch, 2026-08-22: "the first part of the card violates the ds
 *  guidelines, content hierarchy" — an earlier pass replaced this with an
 *  italic-serif eyebrow using the SAME typographic device `LaneDivider`
 *  uses for its section labels, so two different jobs — card-level status
 *  vs. in-card section heading — read as one undifferentiated style
 *  (`design-anti-patterns.md`: "Same label style for everything... Group-
 *  level labels differ from field labels differ from inline metadata").
 *  Tones match the original production mapping: current = success (the
 *  term actively being worked), last = neutral (closed, no urgency),
 *  upcoming = info (informational, nothing due yet). */
const POSITION_BADGE: Record<TermPosition, { label: string; tone: 'success' | 'neutral' | 'info' }> = {
  current:  { label: 'Current term',  tone: 'success' },
  last:     { label: 'Last term',     tone: 'neutral' },
  upcoming: { label: 'Upcoming term', tone: 'info' },
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const fmtDate = (d: string) =>
  parseDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/** Date range — drops the redundant year on the start when both share one. */
const fmtRange = (a: string, b: string) => {
  const sameYear = parseDate(a).getFullYear() === parseDate(b).getFullYear()
  const start = sameYear ? fmtDate(a).replace(/, \d{4}$/, '') : fmtDate(a)
  return `${start} – ${fmtDate(b)}`
}

/* ── row-level storytelling (Romit, 2026-08-24: "I was expecting a connected
   story with actions" — the description line and the countdown/course chip
   used to be fed by the same date fact and repeat it verbatim two lines
   apart, e.g. "Next closes today." directly above a chip reading "Next
   closes today"). Each composer below states every fact exactly once, in
   one paragraph, so the row reads sentence → trigger → action instead of
   sentence → repeated fact → trigger → action. */

function liveRowStory(live: PceSurvey[]): string | null {
  if (live.length === 0) return null
  const rate = weightedRate(live)
  const atRisk = live.filter((s) => s.responseRate < AT_RISK_THRESHOLD)
  const closing = liveCountdown(live)
  const lead =
    atRisk.length > 0
      ? `${atRisk.length} of ${live.length} courses are below the ${AT_RISK_THRESHOLD}% at-risk floor${rate != null ? ` (${rate}% average)` : ''}.`
      : rate != null
        ? `Responses are averaging ${rate}%.`
        : 'No responses recorded yet.'
  return closing ? `${lead} ${closing}.` : lead
}

function scheduledRowStory(scheduled: PceSurvey[]): string | null {
  if (scheduled.length === 0) return null
  const opening = scheduledCountdown(scheduled)
  const lead = 'Scheduled ahead of time — nothing to do until it opens.'
  return opening ? `${lead} ${opening}.` : lead
}

function setupRowStory(notConfiguredCount: number, draftCount: number): string | null {
  const base = coverageDetail(notConfiguredCount, draftCount)
  if (!base) return null
  return `${base.replace(/\.$/, '')} — evaluations can't go out until these are set up.`
}

/* ── pulled-data lane (facts + their own per-row actions) ──────────────────── */

/** The card's ledger figure — the one number this statement is ABOUT, set
 *  like a balance: large serif numeral in plain ink, the target printed
 *  beside it in mono, and a small annotation line beneath that carries the
 *  delta. Color annotates; the figure itself never takes a status color, so
 *  amber keeps its meaning when it appears. */
function StatementHero({
  label,
  trailing,
  value,
  unit,
  annotation,
  annotationColor,
  annotationIcon,
  size = 'lg',
  serif = true,
  tip,
}: {
  label: string
  /** Small mono fact on the label's baseline — e.g. "target 80%". */
  trailing?: string
  value: string
  unit?: string
  annotation?: string
  annotationColor?: string
  /** FA class for a leading trend arrow (e.g. `fa-arrow-trend-up`) — color
   *  alone was the only direction signal before this (A11Y-008: color is
   *  never the only encoding), and the reference pairs every delta with one. */
  annotationIcon?: string
  size?: 'lg' | 'md'
  /** The statement skin's serif display face for the ledger figure — off
   *  for the response-rate hero specifically (Romit, 2026-08-25: "use
   *  Inter font, in the response rate metric instead of serif"), so it
   *  reads in the DS body face like the rest of the row content around it.
   *  Coverage's hero keeps the serif treatment; only asked to change
   *  response rate. */
  serif?: boolean
  /** Same jargon-gloss purpose as `LedgerLine`'s `tip` — this hero is the
   *  ONE fact big enough to not go through LedgerLine at all, so it needs
   *  its own copy of the same affordance rather than inheriting one. */
  tip?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {label}
          {tip && (
            <Tip label={tip} triggerClassName="inline-flex">
              <i className="fa-light fa-circle-info cursor-help text-[11px]" aria-hidden="true" />
            </Tip>
          )}
        </p>
        {trailing && (
          <p className="text-xs tabular-nums text-muted-foreground">{trailing}</p>
        )}
      </div>
      <p
        className={
          (size === 'lg' ? 'text-5xl' : 'text-4xl') +
          (serif ? ' font-heading' : ' font-sans') +
          ' font-semibold leading-none tracking-tight text-foreground tabular-nums'
        }
      >
        {value}
        {unit && <span className={size === 'lg' ? 'text-2xl' : 'text-xl'}>{unit}</span>}
      </p>
      {annotation && (
        <p className="flex items-center gap-1 text-xs font-medium" style={{ color: annotationColor ?? 'var(--muted-foreground)' }}>
          {annotationIcon && <i className={`fa-light ${annotationIcon}`} aria-hidden="true" />}
          {annotation}
        </p>
      )}
    </div>
  )
}

/** Delta annotation for a response-rate ledger figure — same three tiers as
 *  ResponseProgressCell (below AT_RISK_THRESHOLD = amber, floor-to-target =
 *  quiet, at/above = success), stated as words so the signal never rides on
 *  color alone. */
function rateAnnotation(rate: number): { text: string; color: string } {
  if (rate >= RESPONSE_TARGET) {
    return { text: 'On target', color: LIST_HUB_STATUS_TINT_SUCCESS.fg }
  }
  const short = RESPONSE_TARGET - rate
  return {
    text: `${short} point${short === 1 ? '' : 's'} below the ${RESPONSE_TARGET}% target`,
    color: rate < AT_RISK_THRESHOLD ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--muted-foreground)',
  }
}

/** The evidence graphic under the ledger figure — PCE's own documented
 *  BulletGauge pattern (pce-ui-patterns.md), typeset for the statement skin:
 *  a thin track filled from 0 to the reading in the SAME tier color
 *  ResponseProgressCell wires into ProgressCell (success → emerald, brand →
 *  var(--brand-color), warning → amber — identical boundaries: floor =
 *  AT_RISK_THRESHOLD, target = RESPONSE_TARGET), a solid 2px tick at the
 *  reading, and dashed threshold ticks with small mono numerals at the
 *  validity floor and the target so the eye sees WHERE the rate sits
 *  relative to both lines without doing arithmetic. All colored elements are
 *  graphics; every piece of TEXT stays muted-foreground/foreground ink, so
 *  no tier color ever has to clear 4.5:1 as type (the instrument variant's
 *  contrast failure was colored text — deliberately not repeated here). The
 *  graphic is aria-hidden; a full sr-only sentence states the reading's
 *  position against both thresholds. */
function StatementGauge({
  rate,
  floor = AT_RISK_THRESHOLD,
  target = RESPONSE_TARGET,
}: {
  rate: number
  floor?: number
  target?: number
}) {
  const v = Math.max(0, Math.min(100, rate))
  const tier = rate >= target ? 'onTarget' : rate >= floor ? 'valid' : 'belowFloor'
  const fillClass =
    tier === 'onTarget' ? 'bg-[var(--chart-2)]' : tier === 'valid' ? 'bg-[var(--brand-color)]' : 'bg-[var(--chart-4)]'
  /* "Floor" gets a `tip` — it's the one word here that's product shorthand,
     not plain English (Romit, 2026-08-25: "what does floor and coverage
     mean here? the users might be confused"). "Target" doesn't need one;
     the word already says what it means. */
  const marks = [
    {
      at: floor,
      ink: 'var(--muted-foreground)',
      word: 'Floor',
      tip: `Below ${floor}% response, a course's results aren't considered statistically reliable.`,
    },
    /* Target tick in full ink — the line that matters most reads darkest. */
    { at: target, ink: 'var(--foreground)', word: 'Target', tip: undefined as string | undefined },
  ]
  return (
    <div>
      {/* Extra bottom room for the word under each numeral (Romit,
          2026-08-26: "why is 60% line shown?" — the two ticks used to be
          bare numbers with no visible explanation, only an sr-only
          sentence; a sighted reader had no way to know 60 is the at-risk
          floor and 70 is the target without cross-referencing the hero's
          "target 70%" trailing text three lines up). */}
      <div aria-hidden="true" className="relative h-11">
        {/* fixed track — the scale exists even where the fill hasn't reached */}
        <div className="absolute inset-x-0 top-[8px] h-1 bg-muted" />
        {/* fill to the current reading, in the tier color */}
        <div className={`absolute left-0 top-[8px] h-1 ${fillClass}`} style={{ width: `${v}%` }} />
        {/* threshold ticks — dashed rules crossing the track, numeral +
            one-word label stacked beneath */}
        {marks.map((m) => (
          <span key={m.at}>
            <span
              className="absolute top-0 h-5 w-0 -translate-x-1/2 border-l border-dashed"
              style={{ left: `${m.at}%`, borderLeftColor: m.ink }}
            />
            <span
              className="absolute top-[23px] flex -translate-x-1/2 flex-col items-center gap-0.5"
              style={{ left: `${m.at}%` }}
            >
              <span className="text-xs leading-none tabular-nums text-muted-foreground">{m.at}</span>
              {/* Dotted underline here, not the `fa-circle-info` icon used
                  for Coverage — "floor" and "target" ticks sit only 10%
                  apart on the track, and ANY added icon width collides with
                  the neighboring label regardless of which side it's on.
                  The underline adds zero width, so it's the one that
                  actually fits this specific spot. */}
              {m.tip ? (
                <Tip label={m.tip} triggerClassName="inline-flex">
                  <span className="cursor-help text-[10px] leading-none text-muted-foreground underline decoration-dotted underline-offset-2">
                    {m.word}
                  </span>
                </Tip>
              ) : (
                <span className="text-[10px] leading-none text-muted-foreground">{m.word}</span>
              )}
            </span>
          </span>
        ))}
        {/* the reading — a solid tick standing taller than the track */}
        <div
          className={`absolute top-[3px] h-3.5 w-[2px] -translate-x-1/2 ${fillClass}`}
          style={{ left: `${v}%` }}
        />
      </div>
      <span className="sr-only">
        {tier === 'belowFloor'
          ? `Response rate ${rate} percent, below the ${floor} percent validity floor and the ${target} percent target.`
          : tier === 'valid'
            ? `Response rate ${rate} percent, above the ${floor} percent validity floor but below the ${target} percent target.`
            : `Response rate ${rate} percent, at or above the ${target} percent target.`}
      </span>
    </div>
  )
}

/** Dot-leader line item — `Coverage ……… 87%` — the statement's fact row.
 *  Label in quiet ink, figure right-aligned in sans tabular numerals, a
 *  dotted rule filling the measure between them the way a well-set
 *  financial statement connects a line item to its amount. Sans, not mono
 *  (Romit, 2026-08-24: "you are using mono text which isn't a part of DS
 *  guidelines" — `exxat-mono-ids` reserves `font-mono` for system
 *  identifiers only; a KPI figure like "87%" or a row count is explicitly
 *  on the skill's MUST-NOT list. `tabular-nums` alone still keeps digits
 *  fixed-width for alignment — the DS body face supports the feature, mono
 *  isn't required for it). */
function LedgerLine({
  label,
  value,
  bold = false,
  tip,
}: {
  label: string
  value: string
  bold?: boolean
  /** Plain-language gloss for a label that's internal shorthand, not a
   *  self-evident word (Romit, 2026-08-25: "what does floor and coverage
   *  mean here? the users might be confused" — "Coverage" and "floor" are
   *  both product jargon with no visible definition anywhere on the card).
   *  Rendered as a small `fa-circle-info` glyph after the label, the DS's
   *  own convention for this (template-editor.tsx, library form) — the
   *  dotted-underline-on-the-label version tried first put the hover target
   *  on the word itself, easy to miss; a dedicated icon (Romit, same day:
   *  "can have an i icon instead of hovering on the label") is the
   *  recognizable "there's more here" affordance instead. */
  tip?: string
}) {
  const dtClassName = bold ? 'shrink-0 text-sm font-semibold text-foreground' : 'shrink-0 text-xs text-muted-foreground'
  return (
    <div className="flex items-baseline gap-2 py-1">
      <dt className={`${dtClassName} flex items-center gap-1`}>
        {label}
        {tip && (
          <Tip label={tip} triggerClassName="inline-flex">
            <i className="fa-light fa-circle-info cursor-help text-[11px] text-muted-foreground" aria-hidden="true" />
          </Tip>
        )}
      </dt>
      <span
        aria-hidden="true"
        className="mb-[3px] min-w-4 flex-1 self-end border-b border-dotted border-border"
      />
      <dd className="shrink-0 text-sm font-medium leading-none tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  )
}

function FactLedger({ facts }: { facts: { label: string; value: string; tip?: string }[] }) {
  if (facts.length === 0) return null
  return (
    <dl className="flex flex-col">
      {facts.map((f) => (
        <LedgerLine key={f.label} label={f.label} value={f.value} tip={f.tip} />
      ))}
    </dl>
  )
}

/** Course codes behind a bucket count — named on demand rather than left as
 *  an unidentifiable "3 courses" (Romit's original catch), but no longer
 *  printed inline: a full code run doubled the row's height for information
 *  most visits don't need. One `Tip`-disclosed trigger carries every code
 *  instead — hover/focus reveals the full list, same disclosure device the
 *  old "+N more" overflow already used, just covering all of them now
 *  instead of only the overflow. Renders inline as the trailing clause of
 *  the row's own story sentence (Romit, 2026-08-24: "expecting a connected
 *  story with actions" — this used to sit alone on its own line between the
 *  description and the action button, disconnected from both) rather than a
 *  separate meta block. The `Tip` label is JSX, not a plain string, so the
 *  codes themselves render `font-mono` inside the popover — they're the one
 *  genuine identifier in this row, everything else stays sans per
 *  `exxat-mono-ids`. At-risk codes stay visually flagged outside the
 *  tooltip too (the reserved amber ink + an inline count) so that signal
 *  isn't buried behind a hover a sighted user might not trigger. */
function CourseCodesTip({ codes, atRisk }: { codes: string[]; atRisk?: Set<string> }) {
  if (codes.length === 0) return null
  const atRiskCount = atRisk?.size ?? 0
  const tipLabel = (
    <span className="font-mono">
      {codes.map((code) => (atRisk?.has(code) ? `${code} — behind pace` : code)).join(', ')}
    </span>
  )
  return (
    <Tip label={tipLabel} side="top">
      <span
        tabIndex={0}
        className="inline-flex w-fit shrink-0 cursor-default items-center gap-1 underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{ color: atRiskCount > 0 ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--primary)' }}
      >
        <i className="fa-light fa-list-ul text-xs" aria-hidden="true" />
        View courses
        {atRiskCount > 0 && ` · ${atRiskCount} at risk`}
      </span>
    </Tip>
  )
}

/* ── the row rail (round-4 "logical rows" fix, Aug 25 2026) ─────────────────
   ROUND 3 modeled the bucket stack as a single journey the TERM moves
   through — Setup → Scheduled → Live → Closed — with stages "behind" the
   term's current position drawn solid/traversed and the rest dashed/not-
   yet-reached. That's wrong for a running term (Romit, 2026-08-25: "the
   rows doesn't look logical for each card, since the current term has
   started"): a bucket only ever RENDERS a row when it still has real,
   unresolved courses in it, so "Needs setup" being drawn as a "passed"
   stage — solid rail, muted outline, as if that work were behind the term —
   was actively false; those 11 courses still need setup TODAY, they aren't
   history. Courses don't move through these buckets in lockstep either —
   different courses sit in different buckets at the same moment, so there
   never was a single "position" for the rail to mark in the first place.
   ROUND 4 drops the journey metaphor entirely. The rail is now just a
   plain connector between sibling rows in a list (solid line, no dashed
   "future" segments, nothing implies "traversed"). Node fill is reserved
   for the ONE thing that's actually true and worth foregrounding: whether
   this bucket is the one the card's urgency is about (`attention`) — every
   other row is a calm, equally-current fact, hollow and colored by its own
   status tint, never implied to be ahead of or behind another. */

type StageKey = 'roster' | 'setup' | 'scheduled' | 'live' | 'closed'
type TimelineConnect = 'none' | 'solid'

interface RowTimeline {
  connectTop: TimelineConnect
  connectBottom: TimelineConnect
  /** This row is the one the card's callout/urgency is about — its node
   *  takes the reserved amber accent (filled amber with a halo ring). */
  attention?: boolean
  /** The bucket's status color (Romit, 2026-08-24: "there isn't enough
   *  color coding done in these components" — every row used to render in
   *  plain ink/muted regardless of what stage it was, so Live, Scheduled,
   *  and Closed were only distinguishable by icon shape). `null` for Setup —
   *  prep work stays neutral on purpose, matching production's own
   *  `tint={null}` for the same bucket (`term-breakdown.tsx`). */
  tint?: StatusTint | null
}

/** One color per bucket TYPE, independent of the amber `attention` accent
 *  (which stays reserved for whichever row a card's callout is actually
 *  about). Live = success (collecting, healthy by default); Scheduled =
 *  planned; Closed = completed — the same three-tint vocabulary
 *  `BreakdownRow` already established elsewhere in this product, ported
 *  here instead of inventing a new one. */
const STAGE_TINT: Partial<Record<StageKey, StatusTint>> = {
  scheduled: LIST_HUB_STATUS_TINT_PLANNED,
  live: LIST_HUB_STATUS_TINT_SUCCESS,
  closed: LIST_HUB_STATUS_TINT_COMPLETED,
}

/** Per-card rail geometry: given the ordered list of stages a card actually
 *  renders, returns each row's connector — solid to its neighbor, `none` at
 *  the two open ends. No position-dependent styling beyond that; the rows
 *  are peers, not journey checkpoints. */
function timelineFor(stages: StageKey[]) {
  return (key: StageKey): Omit<RowTimeline, 'attention' | 'tint'> => {
    const i = stages.indexOf(key)
    return {
      connectTop: i <= 0 ? 'none' : 'solid',
      connectBottom: i < 0 || i === stages.length - 1 ? 'none' : 'solid',
    }
  }
}

/** One rail segment connecting sibling rows — a plain thread, not a
 *  "traversed journey" indicator, so it stays a quiet border-weight line
 *  rather than stark ink (Romit, 2026-08-25: "use better icon and color,
 *  since the current ones are too sharp"). */
function RailSegment({ kind, className }: { kind: TimelineConnect; className: string }) {
  if (kind === 'none') return null
  return (
    <span
      className={`absolute left-1/2 w-0 -translate-x-1/2 border-l ${className}`}
      style={{ borderLeftStyle: 'solid', borderLeftColor: 'var(--border)' }}
    />
  )
}

/** Wrapper for a run of `StatementRow`s — the rows draw their own hairlines
 *  and their own rail segments (no gap, so the rail runs continuous). */
function Ledger({ rows }: { rows: React.ReactNode }) {
  return <div className="flex flex-col">{rows}</div>
}

/** Ledger row — the statement's actual line item, not a re-skinned list row
 *  bolted beneath a styled number. Reuses `LedgerLine`'s exact dot-leader +
 *  right-aligned mono figure — the SAME device the hero's fact lines use
 *  (`Coverage ……… 87%`) — as the row's primary line (`Needs setup ……… 5`), so
 *  the bucket rows and the metric above them read as one continuous ledger
 *  instead of a styled hero sitting over an unstyled list (Romit's catch,
 *  2026-08-22: "focus on the term card rows as well, not just the metrics").
 *  `description` prints as a visible one-line explanation right under the
 *  count (Romit's catch, 2026-08-22: "the message should be easy to
 *  understand rather than just 13 of 13 closed" — the terse label+count is
 *  scannable but not self-explaining on its own, so every row gets a plain-
 *  language sentence from the same lead-copy helpers that used to feed this
 *  line to screen readers only). `trigger` (the course-codes disclosure)
 *  renders as the TRAILING clause of that same paragraph, not a separate
 *  line (Romit, 2026-08-24: "I was expecting a connected story with
 *  actions" — a standalone chip line between the sentence and the button
 *  used to repeat a fact the sentence already stated and read as
 *  disconnected from both neighbors). The row now reads as one continuous
 *  flow: sentence → course disclosure → action, never sentence → repeated
 *  fact → disclosure → action. */
function StatementRow({
  label,
  count,
  icon,
  timeline,
  description,
  trigger,
  actions,
}: {
  label: string
  count: string
  /** The bucket's ORIGINAL production icon (term-breakdown.tsx vocabulary:
   *  fa-list-check / fa-calendar / fa-circle-dot / fa-flag-checkered /
   *  fa-triangle-exclamation) — recognition over invention. Rendered as the
   *  row's timeline node, tinted by `timeline.tint`, aria-hidden (the
   *  visible label carries the meaning). */
  icon: string
  timeline: RowTimeline
  description?: string
  trigger?: React.ReactNode
  actions?: React.ReactNode
}) {
  const attention = !!timeline.attention
  const tint = timeline.tint ?? null
  /* Settled after a 3-way live comparison (Romit, 2026-08-25: chip layout
     from "B", then "no ring" + "pastel filled circle, no border" as the
     final call). Fill uses each tint's mid-tone `.border` swatch — soft
     enough to read as pastel, not the near-invisible pale `.bg` (tried
     earlier, rejected as "really bad") or the harsh saturated `.fg`. Icon
     renders in `--card` (white) on top for contrast, no stroke. */
  const nodeTint = attention ? LIST_HUB_STATUS_TINT_WARNING : (tint ?? LIST_HUB_STATUS_TINT_NEUTRAL)
  const nodeStyle: React.CSSProperties = {
    background: nodeTint.border,
    color: 'var(--card)',
  }
  return (
    <div className="group flex gap-2.5">
      {/* The rail gutter — decorative; sr users get the same story from the
          row's visible label + description text. */}
      <div aria-hidden="true" className="relative w-5 shrink-0">
        <RailSegment kind={timeline.connectTop} className="top-0 h-[11px]" />
        <span
          className="absolute left-1/2 top-[13px] flex size-5 -translate-x-1/2 items-center justify-center rounded-full"
          style={nodeStyle}
        >
          <i className={`fa-solid ${icon} text-[12px] leading-none`} aria-hidden="true" />
        </span>
        <RailSegment kind={timeline.connectBottom} className="bottom-0 top-[33px]" />
      </div>
      {/* Hairline separators live on the content column only, so the rail
          crosses the row boundary unbroken. */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 border-t border-border/60 py-2.5 group-first:border-t-0">
        <dl>
          <LedgerLine label={label} value={count} bold />
        </dl>
        {(description || trigger) && (
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
            {description}
            {trigger}
          </p>
        )}
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
}

/** Row action — a stock DS `Button`, same shape as every other button in the
 *  DS (Romit's catch, 2026-08-22: "buttons and content aren't matching ds
 *  components" — the earlier `rounded-none` square-corner override fought
 *  the DS's own button radius). The bare-underlined-text-link treatment this
 *  replaced before that (2026-08-22, earlier catch: "the content inside it
 *  with action buttons can be better") read as inert body copy in a row
 *  already dense with a rail, a node, a ledger line, and a mono code run —
 *  a real, DS-shaped button gives the ONE thing in each row you can
 *  actually click real affordance without competing with the card's single
 *  filled CTA up in `PriorityCallout` (constraint: exactly one filled CTA
 *  per card — every row action stays `outline`, never `default`). */
function LedgerAction({
  href,
  primary = false,
  /** Real filled/primary `Button` — distinct from `primary`, which (despite
   *  its name) has only ever mapped to 'outline' vs 'ghost' below, never an
   *  actual filled variant. Every one of this component's ~20 call sites
   *  already passes `primary`, so changing what THAT maps to would silently
   *  reshape every Ledger-design card at once; `filled` is additive and
   *  opt-in instead, for the one row (Operations' `LiveTermCard` "Schedule"
   *  action) that needs to read as the next thing to do among several
   *  otherwise-equal outline rows (caught live 2026-09-02: every action in
   *  that card rendered identically, so nothing read as prioritized). */
  filled = false,
  external = false,
  onClick,
  children,
}: {
  href?: string
  primary?: boolean
  filled?: boolean
  /** Prism lives outside this app — opens in a new tab. */
  external?: boolean
  onClick?: () => void
  children: React.ReactNode
}) {
  const variant = filled ? 'default' : primary ? 'outline' : 'ghost'
  if (onClick) {
    return (
      <Button variant={variant} size="sm" onClick={onClick}>
        {children}
      </Button>
    )
  }
  if (external && href) {
    return (
      <Button variant={variant} size="sm" asChild>
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      </Button>
    )
  }
  return (
    <Button variant={variant} size="sm" asChild>
      <Link href={href ?? '#'}>{children}</Link>
    </Button>
  )
}

/* ── card shell ───────────────────────────────────────────────────────────── */

function TermCardShell({
  term,
  position,
  metaTrailing,
  children,
  footer,
  className,
}: {
  term: ProgramTerm
  position: TermPosition
  metaTrailing?: string
  children: React.ReactNode
  footer: React.ReactNode
  className?: string
}) {
  return (
    /* A genuine DS Card — default rounded-xl shape, ring-1 border, standard
       CardHeader/CardContent/CardFooter regions (Romit's catch, 2026-08-22:
       "buttons and content aren't matching ds components" — the earlier
       square-corner/hairline-rule/no-shadow skin fought the DS's own Card
       shape instead of composing it; that skin is retired here). The
       statement/ledger character now lives entirely in CONTENT choices
       (serif masthead, dot-leader figures, the gauge, the timeline rail) —
       none of which require overriding the card or button shapes DS already
       defines. `border-b` on CardHeader is DS's own supported opt-in
       separator (see card.tsx's `[.border-b]:pb-(--card-spacing)` hook),
       not a hand-drawn rule. */
    <Card className={className}>
      <CardHeader className="border-b">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <CardTitle className="min-w-0 font-heading text-2xl font-semibold leading-tight tracking-tight">
            <Link
              href={`/course-evaluation/term/${term.id}`}
              aria-label={`Open ${term.name} workspace`}
              className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {term.name}
            </Link>
          </CardTitle>
          <StatusBadge label={POSITION_BADGE[position].label} tone={POSITION_BADGE[position].tone} size="sm" />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          AY {term.academicYear.replace(/–20(\d\d)$/, '–$1')}
          {metaTrailing ? ` · ${metaTrailing}` : ''}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">{children}</CardContent>
      {/* gap-2 — without it, a footer's flex-1 label fills 100% of the space
          up to the link with zero gap between them; short labels (e.g. "13
          courses in this term") leave slack inside their own box that reads
          as a gap, but a label long enough to fill its grown box edge-to-edge
          (Upcoming's "Eval window opens Aug 24, 2026") visually touches the
          link with no separation at all (Romit's catch, 2026-08-19). */}
      <CardFooter className="mt-auto gap-2">{footer}</CardFooter>
    </Card>
  )
}

/** Footer link. The destination and the label are BOTH per-column: a finished
 *  term's real next step is reading results (analytics), not re-entering the
 *  operational workspace, and Upcoming vs Current shouldn't read as the same
 *  link twice. */
function ViewDetailsLink({
  term,
  label = 'View details',
  href,
}: {
  term: ProgramTerm
  label?: string
  href?: string
}) {
  return (
    <Link
      href={href ?? `/course-evaluation/term/${term.id}`}
      aria-label={`${label} for ${term.name}`}
      className="ms-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {label}
      <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
    </Link>
  )
}

/** The section heading that opens the card's data lane — a real heading now
 *  (`text-sm font-semibold`, full ink), not metadata-tier muted text (Romit,
 *  2026-08-26: "Term data, is it a heading? can't recognize that at all" —
 *  the previous `text-xs font-medium text-muted-foreground` treatment was
 *  the exact same size/weight/color as a row's own description line, so it
 *  read as one more line of body copy, not a section break). Still not the
 *  masthead's italic-serif device — a section label and a status chip are
 *  different jobs — and still no uppercase/tracking-wide (the banned
 *  "Claude tell"); size + weight + ink alone is enough to read as a
 *  heading. */
function LaneDivider({ label }: { label: string }) {
  return (
    <div className="mt-1">
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
    </div>
  )
}

function CurrentTermCard({
  snap,
  breakdown,
  noTemplates = false,
  className,
}: {
  snap: TermSnapshot
  breakdown: CourseBreakdown | null
  /** No survey templates exist yet — evaluations are blocked on creating one. */
  noTemplates?: boolean
  className?: string
}) {
  const { term } = snap
  const b = breakdown
  const win = evalWindow(term)
  const atRisk = b ? liveAtRiskCodes(b.live) : new Set<string>()
  const setupCount = b ? b.notConfiguredCount + b.draft.length : 0
  const workspaceHref = (tab: 'active' | 'finished') =>
    `/course-evaluation/term/${term.id}?tab=${tab}`

  /* Avg response is NOT a fact line here — it is the statement's ledger
     figure (the hero); printing it twice made the anchor compete with its
     own echo. */
  const facts: { label: string; value: string; tip?: string }[] = []
  /* PRD ("UI feedback on Dashboard.docx", Case 6): once every course has at
     least a scheduled evaluation, coverage should read as a settled
     "complete" state, not a bare percentage sitting alongside the still-in-
     flight response-rate figure above it. */
  if (b) facts.push({ label: 'Coverage', value: isFullyCovered(b) ? 'Complete' : `${coveragePercent(b)}%`, tip: COVERAGE_TIP })
  if (snap.daysLeft != null) facts.push({ label: 'Window closes in', value: plural(snap.daysLeft, 'day') })

  /* Rail geometry — the stages this card actually renders, as peers, not a
     journey (see the round-4 comment above `timelineFor`). The urgent stage
     mirrors the SAME conditions the retired card-level callout used to
     compute (at-risk / below-target → Live, open-window setup gap →
     Setup) — reading them straight off the breakdown now instead of
     through a `Rec` object nothing else consumes. */
  const stages: StageKey[] = b
    ? ([
        setupCount > 0 && 'setup',
        b.scheduled.length > 0 && 'scheduled',
        b.live.length > 0 && 'live',
        b.closed.length > 0 && 'closed',
      ].filter(Boolean) as StageKey[])
    : []
  const attentionStage: StageKey | null =
    !b || noTemplates
      ? null
      : atRisk.size > 0 || (b.live.length > 0 && snap.rate != null && snap.rate < RESPONSE_TARGET)
        ? 'live'
        : setupCount > 0
          ? 'setup'
          : null
  const tl = timelineFor(stages)
  /* `noTemplates` renders as a row ABOVE the bucket rows (see the Ledger
     below) when `b` exists — its own connectBottom bridges into whichever
     stage ends up first, same pattern LastTermCard's "Still open" → Closed
     bridge already established. */
  const firstStage = stages[0] ?? null
  const rowTimeline = (key: StageKey): RowTimeline => ({
    ...tl(key),
    connectTop: noTemplates && key === firstStage ? 'solid' : tl(key).connectTop,
    attention: attentionStage === key,
    tint: STAGE_TINT[key] ?? null,
  })

  return (
    <TermCardShell
      term={term}
      position="current"
      metaTrailing={`Eval window ${win.open.replace(/, \d{4}$/, '')} – ${win.close}`}
      className={className}
      footer={
        <>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {b ? `${plural(b.totalCourses, 'course')} in this term` : `${snap.total} evaluations`}
          </p>
          <ViewDetailsLink term={term} />
        </>
      }
    >
      {/* No course offerings synced at all is the one state this card has
          nothing else to build a row from (Romit, 2026-08-26: "i don't want
          needs attention text to be shown since in the timeline we are
          covering most of the scenarios" — every other state already gets
          a row; this is the last one that used to only live in the retired
          card-level callout). Kept to the SAME heading → Ledger shape every
          other state uses instead of a distinct box, for content-format
          consistency across cards. */}
      {!b && (
        <>
          <LaneDivider label="Term data" />
          <Ledger
            rows={
              <StatementRow
                label="Course offerings"
                count="0"
                icon="fa-graduation-cap"
                timeline={{ connectTop: 'none', connectBottom: 'none' }}
                description="No course offerings have synced for this term yet."
                actions={
                  <LedgerAction href={prismCoursesHref()} external primary>
                    Add courses
                  </LedgerAction>
                }
              />
            }
          />
        </>
      )}

      {b && (
        <>
          <LaneDivider label="Term data" />
          <FactLedger facts={facts} />
          {snap.rate != null && (
            <div className="flex flex-col gap-2">
              <StatementHero
                label="Response rate"
                trailing={`Target ${RESPONSE_TARGET}%`}
                value={`${snap.rate}`}
                unit="%"
                annotation={rateAnnotation(snap.rate).text}
                annotationColor={rateAnnotation(snap.rate).color}
                size="lg"
                serif={false}
              />
              {/* The evidence graphic — replaces the plain thin bar with the
                  product's BulletGauge pattern: floor + target ticks the fill
                  is read AGAINST, not just a fill. Carries its own sr-only
                  floor/target sentence. */}
              <StatementGauge rate={snap.rate} />
            </div>
          )}
          <Ledger
            rows={
              <>
                {noTemplates && (
                  <StatementRow
                    label="Templates"
                    count="0"
                    icon="fa-file-lines"
                    timeline={{ connectTop: 'none', connectBottom: firstStage ? 'solid' : 'none', attention: true }}
                    description="No survey template exists yet, so nothing can go out."
                    actions={
                      <LedgerAction href="/templates/new" primary>
                        Create template
                      </LedgerAction>
                    }
                  />
                )}
                {setupCount > 0 && (
                  <StatementRow
                    label="Needs setup"
                    count={`${setupCount}`}
                    icon="fa-list-check"
                    timeline={rowTimeline('setup')}
                    description={setupRowStory(b.notConfiguredCount, b.draft.length) ?? undefined}
                    trigger={<CourseCodesTip codes={coverageCodes(b.notConfiguredCodes, b.draft)} />}
                    actions={
                      <LedgerAction href={`/surveys/push?term=${term.id}`} primary>
                        {setupCount === 1 ? 'Set up evaluation' : 'Set up evaluations'}
                      </LedgerAction>
                    }
                  />
                )}
                {b.scheduled.length > 0 && (
                  <StatementRow
                    label="Scheduled"
                    count={`${b.scheduled.length}`}
                    icon="fa-calendar"
                    timeline={rowTimeline('scheduled')}
                    description={scheduledRowStory(b.scheduled) ?? undefined}
                    trigger={<CourseCodesTip codes={b.scheduled.map((s) => s.courseCode)} />}
                    actions={
                      <>
                        <LedgerAction href={workspaceHref('active')} primary>
                          Manage
                        </LedgerAction>
                        <LedgerAction href={workspaceHref('active')}>
                          Extend
                        </LedgerAction>
                      </>
                    }
                  />
                )}
                {b.live.length > 0 && (
                  <StatementRow
                    label="Live"
                    count={`${b.live.length}`}
                    icon="fa-bolt"
                    timeline={rowTimeline('live')}
                    description={liveRowStory(b.live) ?? undefined}
                    trigger={<CourseCodesTip codes={b.live.map((s) => s.courseCode)} atRisk={atRisk} />}
                    actions={
                      <>
                        <LedgerAction href={`/surveys/remind?from=term:${term.id}`} primary>
                          Remind
                        </LedgerAction>
                        <LedgerAction href={workspaceHref('active')}>
                          Extend
                        </LedgerAction>
                      </>
                    }
                  />
                )}
                {b.closed.length > 0 && (
                  <StatementRow
                    label="Closed"
                    count={`${b.closed.length} of ${b.totalCourses} (${Math.round((b.closed.length / b.totalCourses) * 100)}%)`}
                    icon="fa-check"
                    timeline={rowTimeline('closed')}
                    description={closedNarrative(b.closed, b.totalCourses) ?? undefined}
                    trigger={<CourseCodesTip codes={b.closed.map((s) => s.courseCode)} />}
                    actions={
                      <LedgerAction href={workspaceHref('finished')} primary>
                        Review feedback
                      </LedgerAction>
                    }
                  />
                )}
              </>
            }
          />
        </>
      )}
    </TermCardShell>
  )
}

/* ── LAST TERM — retrospective / closure ──────────────────────────────────── */

function LastTermCard({
  snap,
  breakdown,
  className,
}: {
  snap: TermSnapshot
  breakdown: CourseBreakdown | null
  className?: string
}) {
  const { term } = snap
  const b = breakdown
  const closedRate = b ? weightedRate(b.closed) : null
  const setupCount = b ? b.notConfiguredCount + b.draft.length : 0
  const workspaceHref = (tab: 'active' | 'finished') =>
    `/course-evaluation/term/${term.id}?tab=${tab}`

  /* Everything that isn't Closed is a straggler once the term has ended —
     including Live (Romit, 2026-08-24: "live row shouldn't exist since the
     term is done" — a course still collecting past its own end date isn't a
     healthy in-progress state, it's the same "needs closing out" situation
     as a course that never went out at all). Rendered as its own row below
     (Romit, 2026-08-25: "i again see needs attention card, which i have
     asked you to remove" — this population used to live ONLY in the
     card-level callout, which is why the callout kept coming back; it now
     has a row like every other bucket, so the callout has nothing left to
     say once `b` exists). */
  const neverWentOut = b ? b.notConfiguredCount + b.draft.length + b.scheduled.length : 0
  const stillLive = b ? b.live.length : 0
  const stragglerCount = neverWentOut + stillLive
  const stragglerCodes = b
    ? [
        ...b.notConfiguredCodes,
        ...b.draft.map((s) => s.courseCode),
        ...b.scheduled.map((s) => s.courseCode),
        ...b.live.map((s) => s.courseCode),
      ].sort()
    : []
  const stragglerStory =
    stillLive > 0 && neverWentOut > 0
      ? `${plural(neverWentOut, 'course')} never went out and ${plural(stillLive, 'course')} still collecting.`
      : stillLive > 0
        ? `${plural(stillLive, 'course')} still collecting responses.`
        : `${plural(neverWentOut, 'course')} never collected.`

  /* The final response rate is the statement's ledger figure (hero); it only
     falls back to a fact line when there is no closed rate to certify. No
     progress bar here — a finished term's figure is a balance, not something
     in flight (progress bars are reserved for 0→100% in-flight collection). */
  /* No "Closed N of M" fact line here — the Closed row below already states
     that exact ratio (plus its own explanation and course list), so a fact
     line repeating it would be the same echo `snap.rate`'s hero comment
     above already rules out for the response figure (Romit's catch,
     2026-08-22: found live as "Closed 13 of 13" printed twice back to back). */
  const facts: { label: string; value: string; tip?: string }[] = []
  if (b) {
    if (closedRate == null) facts.push({ label: 'Avg response', value: '—' })
    facts.push({ label: 'Coverage', value: `${coveragePercent(b)}%`, tip: COVERAGE_TIP })
  }

  /* Rail geometry — the only real bucket a finished term still has is
     Closed; "Still open" below isn't a bucket, it's a standing exception, so
     it gets a hand-built timeline (amber, unconnected-above) rather than a
     slot in `stages`. When it's present, the Closed row's own top connector
     is bridged to it below so the rail still reads as one continuous line
     down the card. */
  const stages: StageKey[] = b && b.closed.length > 0 ? ['closed'] : []
  const tl = timelineFor(stages)

  return (
    <TermCardShell
      term={term}
      position="last"
      className={className}
      metaTrailing={term.startDate && term.endDate ? fmtRange(term.startDate, term.endDate) : undefined}
      footer={
        <>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {b ? `${plural(b.totalCourses, 'course')} in this term` : `${snap.total} evaluations`}
          </p>
          {/* A finished term's next step is reading results, not re-entering
              the operational workspace — this column's footer is the only one
              that leaves /course-evaluation. */}
          <ViewDetailsLink
            term={term}
            label="View analytics"
            href={`/analytics?tab=term&term=${encodeURIComponent(term.name)}`}
          />
        </>
      }
    >
      {/* No course offerings synced is the one Last-term state with nothing
          else to build a row from — same "Course offerings" row anatomy
          CurrentTermCard uses for the identical empty state, for
          content-format consistency across cards (Romit, 2026-08-26: "i am
          seeing different content design in the card"). */}
      {!b && (
        <>
          <LaneDivider label="Term data" />
          <Ledger
            rows={
              <StatementRow
                label="Course offerings"
                count="0"
                icon="fa-graduation-cap"
                timeline={{ connectTop: 'none', connectBottom: 'none' }}
                description="No course offerings synced for this term."
                actions={
                  <LedgerAction href={prismCoursesHref()} external primary>
                    Add courses
                  </LedgerAction>
                }
              />
            }
          />
        </>
      )}

      {b && (
        <>
          <LaneDivider label="Term data" />
          <FactLedger facts={facts} />
          {closedRate != null && (
            <div className="flex flex-col gap-2">
              <StatementHero
                /* "Final" only when every course has actually closed — with
                   stragglers still live or never collected (the Live row
                   below), this figure is an average over whichever courses
                   happen to be done so far, not a settled term total. */
                label={b.closed.length === b.totalCourses ? 'Final response rate' : 'Response rate (closed courses)'}
                trailing={`Target ${RESPONSE_TARGET}%`}
                value={`${closedRate}`}
                unit="%"
                annotation={rateAnnotation(closedRate).text}
                annotationColor={rateAnnotation(closedRate).color}
                size="md"
                serif={false}
              />
              {/* Not the in-flight progress bar this card deliberately never
                  had — a bullet gauge is a settled READING against the fixed
                  floor/target scale, which is exactly what a certified final
                  figure is. The graphic makes "how far from target did we
                  land" visible without arithmetic. */}
              <StatementGauge rate={closedRate} />
            </div>
          )}
          <Ledger
            rows={
              <>
                {/* Setup/draft/scheduled/live stragglers don't get their
                    ORIGINAL bucket rows here (unlike Current/Upcoming) — the
                    term already ended, so "need setup" + a "Manage" action,
                    or a green "collecting" Live row, would imply ongoing
                    operational state that doesn't exist for a closed window
                    (Romit's catch, 2026-08-19: "since the term is done why
                    would there be a warning and again need a setup?"). They
                    still get named, though — as ONE combined "Still open"
                    row instead of the card-level callout that used to be the
                    only place this surfaced (Romit, 2026-08-24/25: "live row
                    shouldn't exist since the term is done"; "i again see
                    needs attention card, which i have asked you to
                    remove"). Amber/attention like `BreakdownRow`'s urgent
                    wash elsewhere — this is the one genuinely wrong state a
                    finished term can be in. */}
                {stragglerCount > 0 && (
                  <StatementRow
                    label="Still open"
                    count={`${stragglerCount}`}
                    icon="fa-triangle-exclamation"
                    timeline={{
                      connectTop: 'none',
                      connectBottom: b.closed.length > 0 ? 'solid' : 'none',
                      attention: true,
                    }}
                    description={stragglerStory}
                    trigger={<CourseCodesTip codes={stragglerCodes} />}
                    actions={
                      <LedgerAction href={workspaceHref('active')} primary>
                        Open term workspace
                      </LedgerAction>
                    }
                  />
                )}
                {b.closed.length > 0 && (
                  <StatementRow
                    label="Closed"
                    count={`${b.closed.length} of ${b.totalCourses} (${Math.round((b.closed.length / b.totalCourses) * 100)}%)`}
                    icon="fa-check"
                    timeline={{
                      ...tl('closed'),
                      connectTop: stragglerCount > 0 ? 'solid' : tl('closed').connectTop,
                      tint: STAGE_TINT.closed ?? null,
                    }}
                    description={closedNarrative(b.closed, b.totalCourses) ?? undefined}
                    trigger={<CourseCodesTip codes={b.closed.map((s) => s.courseCode)} />}
                    actions={
                      <LedgerAction href={workspaceHref('finished')} primary>
                        Review feedback
                      </LedgerAction>
                    }
                  />
                )}
              </>
            }
          />
        </>
      )}
    </TermCardShell>
  )
}

/* ── UPCOMING TERM — readiness / prep ─────────────────────────────────────── */

function UpcomingCard({ snap, breakdown, onEditDates }: {
  snap: TermSnapshot
  breakdown: CourseBreakdown | null
  /** Opens the shared TermEditorSheet (same one Settings' Academic Calendar
   *  and the dashboard's "Set up term" flow use) pre-filled for this term. */
  onEditDates: (term: ProgramTerm) => void
}) {
  const { term } = snap
  const b = breakdown

  const dated = !!term.startDate && !!term.endDate
  const readiness = auditTerm(term.id)
  const startsIn = dated
    ? Math.max(0, Math.ceil((parseDate(term.startDate).getTime() - Date.now()) / 86_400_000))
    : null
  const cov = b ? coveragePercent(b) : null
  const setupCount = b ? b.notConfiguredCount + b.draft.length : 0
  const win = evalWindow(term)

  /* Same compound trigger production uses for the Setup row's urgent wash:
     imminent start AND low coverage — not "any upcoming term with work left",
     which is every upcoming term by definition. */
  const setupUrgent = startsIn != null && startsIn <= 14 && cov != null && cov < 50

  /* Coverage is this card's ledger figure — before a term starts, readiness
     is the balance being certified; response rate doesn't exist yet, so the
     statement anchors on the number that predicts it. */
  const facts: { label: string; value: string; tip?: string }[] = []
  facts.push({ label: 'Course offerings', value: `${snap.coverage?.total ?? readiness.total}` })
  facts.push({ label: 'Starts in', value: startsIn != null ? plural(startsIn, 'day') : 'Not set yet' })

  /* Rail geometry — roster gaps, setup, and scheduled courses are prep work
     that can all be true at once for different courses, not sequential
     steps this card moves through, so they render as peers (see the round-4
     comment above `timelineFor`) rather than a "now" position with a dashed
     not-yet-reached tail. Urgency mirrors the same conditions the retired
     card-level callout used to gate on, read straight off the data now. */
  const stages: StageKey[] = [
    readiness.needsData > 0 && 'roster',
    !!b && setupCount > 0 && 'setup',
    !!b && b.scheduled.length > 0 && 'scheduled',
  ].filter(Boolean) as StageKey[]
  const attentionStage: StageKey | null =
    readiness.needsData > 0 && startsIn != null && startsIn <= 14
      ? 'roster'
      : setupUrgent && setupCount > 0
        ? 'setup'
        : null
  const tl = timelineFor(stages)
  /* No dates set is the one leading blocker that can sit ABOVE real stage
     rows (missing offerings never coexists with stage rows — no offerings
     synced means `readiness.total` is 0, so nothing downstream has
     anything to report either); its connectBottom bridges into whichever
     stage ends up first, same bridge pattern used elsewhere in this file. */
  const firstStage = stages[0] ?? null
  const rowTimeline = (key: StageKey): RowTimeline => ({
    ...tl(key),
    connectTop: !dated && key === firstStage ? 'solid' : tl(key).connectTop,
    attention: attentionStage === key,
    tint: STAGE_TINT[key] ?? null,
  })

  return (
    <TermCardShell
      term={term}
      position="upcoming"
      metaTrailing={dated ? fmtRange(term.startDate, term.endDate) : 'Term dates not set'}
      footer={
        <>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {dated && cov != null ? `Eval window opens ${win.open}` : 'Evaluation window not set'}
          </p>
          {/* Same destination as Current's footer, deliberately a different
              label — two adjacent columns both reading "View details" made the
              triptych look like it had one repeated link. */}
          <ViewDetailsLink term={term} label="View workspace" />
        </>
      }
    >
      <LaneDivider label="Readiness data" />
      <FactLedger facts={facts} />
      {cov != null && (
        <StatementHero
          label="Evaluation coverage"
          tip={COVERAGE_TIP}
          trailing={dated ? `window opens ${win.open}` : undefined}
          value={`${cov}`}
          unit="%"
          /* PRD Case 6: 100% coverage is a settled, done state — the
             annotation says so affirmatively (success tint) instead of the
             same neutral "N of N covered" phrasing a 40% card would show. */
          annotation={
            cov === 100
              ? 'Every course covered'
              : snap.coverage
                ? `${snap.coverage.surveyed} of ${plural(snap.coverage.total, 'course')} covered`
                : undefined
          }
          annotationColor={
            cov === 100
              ? LIST_HUB_STATUS_TINT_SUCCESS.fg
              : setupUrgent
                ? LIST_HUB_STATUS_TINT_WARNING.fg
                : undefined
          }
          size="md"
        />
      )}
      <Ledger
        rows={
          <>
            {/* No dates yet / no offerings synced — the two blocking states
                that used to live only in the retired card-level callout
                (Romit, 2026-08-26: "i don't want needs attention text to be
                shown since in the timeline we are covering most of the
                scenarios"), now the same StatementRow anatomy as every
                other row. */}
            {!dated && (
              <StatementRow
                label="Term dates"
                count="Not set"
                icon="fa-calendar"
                timeline={{ connectTop: 'none', connectBottom: !b || firstStage ? 'solid' : 'none', attention: true }}
                description="No dates set yet, so no evaluation window can open."
                actions={
                  <LedgerAction onClick={() => onEditDates(term)} primary>
                    Add term dates
                  </LedgerAction>
                }
              />
            )}
            {!b && (
              <StatementRow
                label="Course offerings"
                count="0"
                icon="fa-graduation-cap"
                timeline={{ connectTop: !dated ? 'solid' : 'none', connectBottom: 'none' }}
                description="No course offerings have synced for this term yet."
                actions={
                  <LedgerAction href={prismCoursesHref()} external primary>
                    Add courses
                  </LedgerAction>
                }
              />
            )}
            {readiness.needsData > 0 && (
              <StatementRow
                label="Missing roster data"
                count={`${readiness.needsData}`}
                icon="fa-triangle-exclamation"
                timeline={rowTimeline('roster')}
                description={`${plural(readiness.needsData, 'course')} ${readiness.needsData === 1 ? 'is' : 'are'} missing a faculty or student roster — evaluations can't go out until that's filled in.`}
                trigger={
                  <CourseCodesTip
                    codes={readiness.offerings.filter((o) => o.gaps.length > 0).map((o) => o.courseCode)}
                  />
                }
                actions={
                  <LedgerAction href="/course-evaluation/term-setup?phase=readiness" primary>
                    Add missing info
                  </LedgerAction>
                }
              />
            )}
            {b && setupCount > 0 && (
              <StatementRow
                label="Needs setup"
                count={`${setupCount}`}
                icon="fa-list-check"
                timeline={rowTimeline('setup')}
                description={setupRowStory(b.notConfiguredCount, b.draft.length) ?? undefined}
                trigger={<CourseCodesTip codes={coverageCodes(b.notConfiguredCodes, b.draft)} />}
                actions={
                  <LedgerAction href={`/surveys/push?term=${term.id}`} primary>
                    {setupCount === 1 ? 'Set up evaluation' : 'Set up evaluations'}
                  </LedgerAction>
                }
              />
            )}
            {b && b.scheduled.length > 0 && (
              <StatementRow
                label="Scheduled"
                count={`${b.scheduled.length}`}
                icon="fa-calendar"
                timeline={rowTimeline('scheduled')}
                description={scheduledRowStory(b.scheduled) ?? undefined}
                trigger={<CourseCodesTip codes={b.scheduled.map((s) => s.courseCode)} />}
                actions={
                  <>
                    <LedgerAction href={`/course-evaluation/term/${term.id}?tab=active`} primary>
                      Manage
                    </LedgerAction>
                    <LedgerAction href={`/course-evaluation/term/${term.id}?tab=active`}>
                      Extend
                    </LedgerAction>
                  </>
                }
              />
            )}
          </>
        }
      />

    </TermCardShell>
  )
}

/* No term is collecting AND none scheduled next — a slim strip with the setup
 * action. (When an upcoming card is present it speaks for itself, so this
 * notice is suppressed; an absent LAST term needs no placeholder either.) */
function NoActiveTermNotice({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        <i className="fa-light fa-calendar-xmark text-muted-foreground" aria-hidden="true" />
        No term is collecting right now
      </span>
      <span className="text-sm text-muted-foreground">
        Set up a term to start collecting responses.
      </span>
      <Button variant="outline" size="sm" className="ms-auto" onClick={onAdd}>
        Set up term
      </Button>
    </div>
  )
}

/* ── term history (below the kanban, split into Past / Future) ────────────── */

type TermRow = {
  id: string
  name: string
  position: TermWindowPosition
  academicYear: string
  startDate: string
  endDate: string
  offerings: number
  coverage: { surveyed: number; total: number } | null
  rate: number | null
  responseCount: number
  enrollmentCount: number
  stage: TermStage
  /** Null for every account except the one whose terms are the global mock's
   *  own (see `isScoredAccount` in `OperationsDashboardBody`) — there is no
   *  per-account course/faculty score data model, so every other account
   *  correctly shows "—" here instead of a borrowed number. */
  courseAvg: number | null
  facultyAvg: number | null
} & Record<string, unknown>

/** Row population for one history table. `position: 'last'` excludes
 *  `shownLastId` (the one Last-window term already shown as a kanban card —
 *  Vishal, transcript 7a175890: "last should be the first card", singular).
 *  `position: 'future'` is every term 30d+ out that hasn't entered the
 *  Upcoming window yet. `scoreByTermName` is the Operations layout's
 *  account-scoped series (empty map from the Ledger layout, which doesn't
 *  show these two columns' source data) — see `OperationsDashboardBody`. */
function termRowsFor(
  terms: ProgramTerm[],
  ce: PceSurvey[],
  positions: Map<string, TermWindowPosition>,
  position: 'past' | 'future',
  shownLastId: string | null,
  scoreByTermName: Map<string, { courseAvg: number | null; facultyAvg: number | null }>,
): TermRow[] {
  return [...terms]
    .reverse()
    .filter((t) => {
      const pos = positions.get(t.id)
      /* "Past terms" table holds every historical term not currently
         featured as the Last-term card — both the PRD's genuine `'past'`
         bucket (31+ days since end) AND any `'last'`-window term beyond the
         single one shown as a card (Vishal: "last should be the first
         card", singular). Before the 5-state fix these were the same
         unbounded `'last'` bucket; now that `'past'` is its own state, a
         term 45 days gone still needs to land here instead of disappearing. */
      return position === 'past' ? (pos === 'last' || pos === 'past') && t.id !== shownLastId : pos === 'future'
    })
    .map((t) => {
      const snap = snapshot(t, ce)
      const score = scoreByTermName.get(t.name)
      return {
        id: t.id,
        name: t.name,
        position: positions.get(t.id) ?? 'upcoming',
        academicYear: t.academicYear,
        startDate: t.startDate,
        endDate: t.endDate,
        offerings: snap.coverage?.total ?? 0,
        coverage: snap.coverage,
        rate: snap.rate,
        responseCount: snap.responseCount,
        enrollmentCount: snap.enrollmentCount,
        stage: snap.stage,
        courseAvg: score?.courseAvg ?? null,
        facultyAvg: score?.facultyAvg ?? null,
      }
    })
}

/** Shared table anatomy for both history sections (split Aug 19 2026 — one
 *  merged "Past terms" table previously conflated two different populations,
 *  a finished term and one that hasn't started, under one label and one
 *  Actions verb). Only the label, row population, and Actions-column verb
 *  differ between "Past terms" (`mode="past"` — View analytics / View
 *  surveys) and "Future terms" (`mode="future"` — Schedule surveys). Table
 *  anatomy itself — columns, `getRowId`, pagination, row click, empty state —
 *  is unchanged from before the split. */
function TermHistoryTable({
  label,
  rows,
  mode,
  emptyTitle,
  emptyBody,
}: {
  label: string
  rows: TermRow[]
  mode: 'past' | 'future'
  emptyTitle: string
  emptyBody: string
}) {
  const router = useRouter()

  const columns: ColumnDef<TermRow>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Term',
        cell: (row) => (
          <div className="flex flex-col">
            <Link
              href={`/course-evaluation/term/${row.id}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-sm text-sm font-medium text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {row.name}
            </Link>
            <span className="text-xs text-muted-foreground">AY {row.academicYear.replace(/–20(\d\d)$/, '–$1')}</span>
          </div>
        ),
      },
      {
        /* Reference (exxat-surveys-24f.pages.dev): a "Timeline" column
           carrying a Past/Future badge — redundant with which TAB the row is
           already under (this table used to be two headed sections; it's
           one tabbed one now, see `TermHistorySection`), but restored
           because a table exported/printed/scanned outside its tab context
           otherwise loses that fact entirely. */
        key: 'timeline',
        label: 'Timeline',
        width: 100,
        cell: () => (
          <ListHubStatusBadge
            label={mode === 'past' ? 'Past' : 'Future'}
            tint={mode === 'past' ? LIST_HUB_STATUS_TINT_COMPLETED : LIST_HUB_STATUS_TINT_PLANNED}
            icon={mode === 'past' ? 'fa-clock-rotate-left' : 'fa-calendar-plus'}
          />
        ),
      },
      {
        key: 'startDate',
        label: 'Dates',
        width: 190,
        cell: (row) => (row.startDate && row.endDate ? fmtRange(row.startDate, row.endDate) : 'Not set yet'),
      },
      {
        key: 'offerings',
        label: 'Courses',
        width: 90,
        cell: (row) => <span className="tabular-nums">{row.offerings}</span>,
      },
      {
        key: 'coverage',
        label: 'Coverage',
        width: 170,
        /* `tone="brand"` — coverage is "how much is set up," not a quality
           judgment, so it stays off ProgressCell's graded amber/success/red
           auto-tones (those are for the Response column instead). Kept
           deliberately different from the reference's single flat fill for
           both columns — see the file-level note on `TermHistorySection`. */
        cell: (row) =>
          row.coverage ? (
            <ProgressCell
              value={row.coverage.surveyed}
              max={row.coverage.total}
              tone="brand"
              label={<span className="text-xs tabular-nums text-muted-foreground">{row.coverage.surveyed} of {row.coverage.total}</span>}
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: 'rate',
        label: 'Response',
        width: 190,
        cell: (row) =>
          row.rate != null ? (
            <ResponseProgressCell
              rate={row.rate}
              responseCount={row.responseCount}
              enrollmentCount={row.enrollmentCount}
              target={RESPONSE_TARGET}
              floor={AT_RISK_THRESHOLD}
              detail="pct"
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: 'courseAvg',
        label: 'Course avg',
        width: 100,
        cell: (row) => <span className="tabular-nums">{row.courseAvg != null ? row.courseAvg : '—'}</span>,
      },
      {
        key: 'facultyAvg',
        label: 'Faculty avg',
        width: 100,
        cell: (row) => <span className="tabular-nums">{row.facultyAvg != null ? row.facultyAvg : '—'}</span>,
      },
      {
        /* "Evaluation stage" in the reference; this app's own vocabulary is
           `TermStage`/`STAGE_BADGE` (Upcoming/Live/In review/Complete) —
           reused as-is rather than inventing a "Published" state this app
           has no other concept of. */
        key: 'stage',
        label: 'Evaluation stage',
        width: 130,
        cell: (row) => <StatusBadge label={STAGE_BADGE[row.stage].label} tone={STAGE_BADGE[row.stage].tone} />,
      },
      {
        key: 'actions',
        label: 'Action',
        width: 180,
        /* This table's rows are all one `position` by construction (`past`
           rows are always 'last', `future` rows are always 'future'), so the
           `mode` prop — not `row.position` — decides the verb. Checking
           `mode` here rather than trusting every row's `position` field stays
           correct even if row population ever changes upstream. Stacked
           vertically, both outline (reference anatomy) — neither action is
           more "primary" than the other for a row you're just scanning. */
        cell: (row) =>
          mode === 'future' ? (
            <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
              <Link href={`/surveys/push?term=${row.id}`}>Schedule surveys</Link>
            </Button>
          ) : (
            <div className="flex flex-col items-start gap-1.5">
              <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                <Link href={`/analytics?tab=term&term=${encodeURIComponent(row.name)}`}>View analytics</Link>
              </Button>
              <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                <Link href={`/course-evaluation/term/${row.id}`}>View surveys</Link>
              </Button>
            </div>
          ),
      },
    ],
    [mode],
  )

  /* No per-table heading anymore — this is one tab's content inside the
     single "Other terms (N)" tabbed table now (see `TermHistorySection`),
     not its own headed section. `label` stays as the table's aria-label. */
  return (
    <DataTablePaginated<TermRow>
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      /* showQueryControls=false — DataTable's toolbar row defaults to
         min-h-10 regardless of content; with search/filters hidden and no
         toolbarSlot it still reserved that height as dead space (Romit's
         catch, 2026-08-19). showQueryControls collapses the bar to its slim
         min-h-0 variant instead (threaded through as a new opt-in prop on
         DataTable/DataTablePaginated — additive, every other table's
         default behavior is unchanged). */
      showQueryControls={false}
      pagination={{ pageSize: 25 }}
      edgeInset={false}
      stickyHeader={false}
      onRowClick={(row) => router.push(`/course-evaluation/term/${row.id}`)}
      emptyState={
        <div className="flex flex-col items-center gap-2 py-8">
          <i className="fa-light fa-calendar-xmark text-2xl text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">{emptyTitle}</p>
          <p className="text-xs text-muted-foreground">{emptyBody}</p>
        </div>
      }
    />
  )
}

/** Everything NOT on the kanban, as ONE tabbed table — "Other terms (N)"
 *  above, `Past (N)` / `Future (N)` tabs inside, sharing one column set
 *  (reference: exxat-surveys-24f.pages.dev). Was two separately-headed
 *  tables (split Aug 19 2026 so each population got its own Actions verb
 *  instead of a `row.position` ternary inside one table) — merged back
 *  2026-09-02 to match the reference's anatomy; each tab still gets its own
 *  row population and Actions verb via `mode`, just inside one card instead
 *  of two stacked sections. Always visible, no collapse toggle (Romit's
 *  catch, 2026-08-19) — a disclosure gate hid real history/roadmap rows by
 *  default for no reason once the tables carry actual data; a `Tabs`
 *  selector isn't a disclosure gate, both populations are one click away.
 *
 *  `scoreByTermName` backs the Course avg/Faculty avg columns — empty from
 *  the Ledger layout (which has no equivalent source for them), real from
 *  Operations' account-scoped series. See `OperationsDashboardBody`'s
 *  `isScoredAccount` for why most accounts correctly show "—" here instead
 *  of a borrowed number — deliberately NOT flattened to match the
 *  reference's single fill color for both progress-bar columns, which would
 *  mean giving up `ResponseProgressCell`'s floor/target tiers (Jul 10 2026
 *  decision, still valid) for an undifferentiated bar. */
function TermHistorySection({
  ce, terms, positions, shownLastId, scoreByTermName = new Map(),
}: {
  ce: PceSurvey[]
  terms: ProgramTerm[]
  positions: Map<string, TermWindowPosition>
  shownLastId: string | null
  scoreByTermName?: Map<string, { courseAvg: number | null; facultyAvg: number | null }>
}) {
  const pastRows = useMemo(
    () => termRowsFor(terms, ce, positions, 'past', shownLastId, scoreByTermName),
    [terms, ce, positions, shownLastId, scoreByTermName],
  )
  const futureRows = useMemo(
    () => termRowsFor(terms, ce, positions, 'future', shownLastId, scoreByTermName),
    [terms, ce, positions, shownLastId, scoreByTermName],
  )
  const total = pastRows.length + futureRows.length

  if (total === 0) return null

  return (
    <section className="flex flex-col gap-2" aria-label="Other terms">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">Other terms</h2>
        <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1.5 text-xs font-medium tabular-nums">
          {total}
        </Badge>
      </div>
      <Tabs defaultValue="past" className="flex flex-col gap-3">
        <TabsList variant="line" ariaLabel="Other terms — Past or Future">
          <TabsTrigger value="past">
            <TabsTriggerLabel>Past</TabsTriggerLabel>
            <TabsCountBadge count={pastRows.length} />
          </TabsTrigger>
          <TabsTrigger value="future">
            <TabsTriggerLabel>Future</TabsTriggerLabel>
            <TabsCountBadge count={futureRows.length} />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="past">
          <TermHistoryTable
            label="Past terms"
            rows={pastRows}
            mode="past"
            emptyTitle="No past terms yet"
            emptyBody="Completed terms will appear here as history."
          />
        </TabsContent>
        <TabsContent value="future">
          <TermHistoryTable
            label="Future terms"
            rows={futureRows}
            mode="future"
            emptyTitle="No future terms yet"
            emptyBody="Terms starting more than 30 days out will appear here until they enter the Upcoming window."
          />
        </TabsContent>
      </Tabs>
    </section>
  )
}

/* ── populated-state bodies ───────────────────────────────────────────────
   Two interchangeable renders of the populated dashboard, switched via the
   user-menu "Dashboard layout" toggle (identity-menu-items.tsx) + `usePce()`.
   `LedgerDashboardBody` is the prior v9 "STATEMENT" design (round-4, see file
   header) — preserved verbatim rather than deleted so it stays available for
   side-by-side comparison. `OperationsDashboardBody` is the reference-design
   rebuild (Romit, 2026-09-02: reversing the earlier "too crowded" KPI/chart
   removal, on purpose this time, per exxat-surveys-24f.pages.dev). ── */

interface DashboardBodyBaseProps {
  currentSnaps: TermSnapshot[]
  lastSnaps: TermSnapshot[]
  breakdownForSnap: (snap: TermSnapshot) => CourseBreakdown | null
  onAdd: () => void
  ce: PceSurvey[]
  ordered: ProgramTerm[]
  positions: Map<string, TermWindowPosition>
  lastTerms: ProgramTerm[]
  /** Moved here from the Ledger-only prop type — `OperationsDashboardBody`
   *  needs it too now, to know whether "no template" is this term's real
   *  blocker (see `nextTermAction`) rather than always assuming "not
   *  scheduled" is the next step. */
  templates: PceTemplate[]
}

function LedgerDashboardBody({
  currentSnaps, lastSnaps, upcomingSnaps, templates, breakdownForSnap, onAdd, onEditDates, ce, ordered, positions, lastTerms,
}: DashboardBodyBaseProps & {
  upcomingSnaps: TermSnapshot[]
  onEditDates: (term: ProgramTerm) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* ── Terms kanban — Last / Current / Upcoming (Aug 19 2026 feedback:
           fixed left-to-right order; each column can hold more than one
           card). Current stays the wide hero column since it's still the
           working surface — it just isn't the leftmost one anymore. ── */}
      <h2 className="sr-only">Terms</h2>
      {/* No active term → a slim notice ONLY when there's no upcoming
          card to convey it (the Upcoming card's badge + setup CTA already
          say "nothing's collecting, this is next"). */}
      {currentSnaps.length === 0 && upcomingSnaps.length === 0 && (
        <NoActiveTermNotice onAdd={onAdd} />
      )}
      {/* Each column gets an explicit grid-column line, not just source
          order — a demo account with only a Current term (Last/Upcoming
          both empty) left Current as the grid's ONLY child, and CSS
          Grid auto-placement dropped it into track 1 (the narrow 1fr
          column) instead of its intended 1.35fr hero track. Found live
          on Brightwater OT (Case 4, single-term account): the card
          rendered ~100px narrower than intended, which is what made
          the footer summary + "View Details" both wrap to two lines —
          not a text-length problem, a layout one. */}
      {(() => {
        const groups = [
          lastSnaps.length > 0,
          currentSnaps.length > 0,
          upcomingSnaps.length > 0,
        ].filter(Boolean).length
        /* Exactly one populated group → center it instead of pinning it
           to a fixed grid track (Romit, 2026-08-26: "where there is
           only one term card, i want it to be central aligned" —
           e.g. a Current-only demo account used to sit hard in the
           middle track, but a Last-only or Upcoming-only one landed
           flush left/right instead, with two empty tracks either
           side). Same 1.35fr-equivalent max width as the grid's hero
           column, just centered via margin instead of a track. */
        if (groups === 1) {
          return (
            <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4">
              {lastSnaps.map((s) => (
                <LastTermCard key={s.term.id} snap={s} breakdown={breakdownForSnap(s)} />
              ))}
              {currentSnaps.map((s) => (
                <CurrentTermCard
                  key={s.term.id}
                  snap={s}
                  breakdown={breakdownForSnap(s)}
                  noTemplates={templates.length === 0}
                />
              ))}
              {upcomingSnaps.map((s) => (
                <UpcomingCard key={s.term.id} snap={s} breakdown={breakdownForSnap(s)} onEditDates={onEditDates} />
              ))}
            </div>
          )
        }
        return (
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1fr_1.35fr_1fr]">
            {lastSnaps.length > 0 && (
              <div className="flex flex-col gap-4 lg:[grid-column:1]">
                {lastSnaps.map((s) => (
                  <LastTermCard key={s.term.id} snap={s} breakdown={breakdownForSnap(s)} />
                ))}
              </div>
            )}
            {currentSnaps.length > 0 && (
              <div className="flex flex-col gap-4 lg:[grid-column:2]">
                {currentSnaps.map((s) => (
                  <CurrentTermCard
                    key={s.term.id}
                    snap={s}
                    breakdown={breakdownForSnap(s)}
                    noTemplates={templates.length === 0}
                  />
                ))}
              </div>
            )}
            {upcomingSnaps.length > 0 && (
              <div className="flex flex-col gap-4 lg:[grid-column:3]">
                {upcomingSnaps.map((s) => (
                  <UpcomingCard key={s.term.id} snap={s} breakdown={breakdownForSnap(s)} onEditDates={onEditDates} />
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Term history — Past terms + Future terms, separately headed ── */}
      <TermHistorySection
        ce={ce}
        terms={ordered}
        positions={positions}
        shownLastId={lastTerms[0]?.id ?? null}
      />
    </div>
  )
}

/** One line-item row for the Operations "Live term" card — a count phrase,
 *  a status badge, and one action button. Flat by design (no rail, no
 *  gauge) per the reference: the Ledger design's per-row narrative is
 *  deliberately traded for scannability here — this is the OTHER card
 *  design, not a merge of the two. */
function OperationsRow({
  countLabel,
  description,
  courseCodes,
  tint,
  tintLabel,
  icon,
  /* A row can be true on two independent axes at once — e.g. "Live" (this
     status bucket) AND "Low response" (a risk flag within it) — collapsing
     that into one ternary badge (previously `atRisk ? 'Low response' :
     'Live'` on the same slot) silently dropped whichever fact lost the
     ternary (caught live 2026-09-02: an at-risk Live row showed "Low
     response" alone, with no indication it was also the currently-Live
     bucket). Optional second badge for exactly that case. */
  warningLabel,
  warningIcon,
  action,
}: {
  /** Shown only when `courseCodes` is empty (the two account-level rows,
   *  "0 course offerings"/"0 templates", which aren't about any specific
   *  course). Every real row identifies its courses via tags instead. */
  countLabel: string
  /** One line under the tags naming what the status badge means for THIS
   *  row (e.g. "Hasn't been scheduled yet") — the badge alone ("Not set
   *  up"/"Draft"/"Scheduled") reads as a status word, not an explanation,
   *  and nothing previously said what action the button actually takes
   *  (Romit, 2026-09-02: "this is not understood, especially the content"). */
  description: string
  /** Real course codes behind the row. Rendered as tags (up to
   *  `MAX_VISIBLE_COURSE_TAGS`), not a bare "N courses" count — a count
   *  hides which courses are affected until clicked; tags name them up
   *  front, with a "+N more" tooltip for the overflow (Romit, 2026-09-02:
   *  "use tags instead of course count, and later show remaining courses
   *  with tooltip/popover"). */
  courseCodes: string[]
  tint: StatusTint
  tintLabel: string
  icon: string
  warningLabel?: string
  warningIcon?: string
  action: React.ReactNode
}) {
  const visibleCodes = courseCodes.slice(0, MAX_VISIBLE_COURSE_TAGS)
  const overflowCodes = courseCodes.slice(MAX_VISIBLE_COURSE_TAGS)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 py-3 first:border-t-0">
      <div className="flex flex-col gap-1">
        {courseCodes.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleCodes.map((code) => <CourseCodeTag key={code} code={code} />)}
            {overflowCodes.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                    aria-label={`${overflowCodes.length} more ${tintLabel} courses: ${overflowCodes.join(', ')}`}
                  >
                    +{overflowCodes.length} more
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-mono">
                  {overflowCodes.join(', ')}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          <span className="text-sm font-medium text-foreground">{countLabel}</span>
        )}
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <div className="flex items-center gap-2">
        {warningLabel && (
          <ListHubStatusBadge label={warningLabel} tint={LIST_HUB_STATUS_TINT_WARNING} icon={warningIcon ?? 'fa-triangle-exclamation'} flat />
        )}
        <ListHubStatusBadge label={tintLabel} tint={tint} icon={icon} flat />
        {action}
      </div>
    </div>
  )
}

const MAX_VISIBLE_COURSE_TAGS = 3

/** A single course-code chip — neutral and monospaced (system-identifier
 *  convention, matching this app's other record-id treatments), deliberately
 *  quieter than both the colored status `ListHubStatusBadge` and the outline
 *  action `Button` beside it, so all three read as three different kinds of
 *  thing at a glance rather than competing pills of the same visual weight. */
function CourseCodeTag({ code }: { code: string }) {
  return (
    <span className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
      {code}
    </span>
  )
}

/** Compact 4-step setup checklist, embedded directly in the Live-term card's
 *  body (below its "Next" headline) while initial setup is incomplete — was
 *  its own floating "Getting started" `Card` sitting above this one, which
 *  read as disconnected from the term it was actually about (Romit,
 *  2026-09-02). Secondary to the headline by design: no per-step
 *  description, no individually bordered/tinted step boxes — just which
 *  step is next, which are done, which are still ahead. `action` is the
 *  same `nextTermAction` result the headline above and the row list below
 *  already use, so all three can never point at different steps. */
/** Each step's OWN destination — independent of `nextTermAction`'s single
 *  "the one next thing" priority pick — so every reachable, incomplete step
 *  can carry a real button, not just whichever one is currently active
 *  (Romit, 2026-09-02: "needed a better call to action for each step").
 *  Step 0 never needs one here: it's always either done or the active step,
 *  which reads `action` directly instead (see `TermSetupChecklist` below). */
function stepCta(idx: number, term: ProgramTerm | null, hasTemplates: boolean): { href?: string; external?: boolean; label: string } {
  // `term` is only null in the zero-current/zero-last fallback, where step 0
  // ("Set up your first term") is always the active/incomplete one and
  // steps 1-3 are therefore never `reachable` (see `TermSetupChecklist`) —
  // these branches exist for type-safety, not because they render.
  switch (idx) {
    case 1: return { href: prismCoursesHref(), external: true, label: 'Add courses' }
    // Once templates exist, "First survey" and "Schedule evaluations" are
    // the SAME underlying action (`/surveys/push` both creates and
    // schedules in one flow) — showing a button here too would repeat
    // step 4's exact destination under a different number (caught live
    // 2026-09-02 on `acc-noroster`: "Schedule" appeared on both step 3 and
    // step 4). Only offer a distinct action here while a template is
    // actually missing; otherwise this step just describes what step 4's
    // action will also satisfy.
    case 2: return hasTemplates
      ? { label: 'Schedule' }
      : { href: '/templates/new', label: 'Create template' }
    case 3: return { href: term ? `/surveys/push?term=${term.id}` : undefined, label: 'Schedule' }
    default: return { label: 'Set up term' }
  }
}

/** Full step cards (label + description + a real CTA), not a bare
 *  icon+label line — restored after the compact version dropped both the
 *  description and every non-active step's action (Romit, 2026-09-02: "the
 *  earlier stepper UI was better, but needed a better call to action for
 *  each step"). The active step's card IS the "what do I do next" headline
 *  (tinted, with `action`'s own button inside it) rather than a separate
 *  block above the list — that separate block used to duplicate whatever
 *  the active step already said, one of three places the same action could
 *  appear on screen at once (caught live on `acc-noroster`: "Schedule" shown
 *  in a standalone headline, in the checklist, and in the row list below,
 *  all for the same click). */
function TermSetupChecklist({
  done, action, term, hasTemplates, compact,
}: {
  done: boolean[]
  action: TermNextAction
  term: ProgramTerm | null
  hasTemplates: boolean
  /** Set at the embedded `LiveTermCard` call site — the header text there is
   *  a smaller sub-heading (`text-sm`) since `TermCardShell`'s own term
   *  name/badge above it is already the card's primary heading; the
   *  standalone-card call site uses the larger default. Always split
   *  title-left / progress-right either way (Romit, 2026-09-02: "title
   *  progress bar and 1 to 4 setup together but split" — every call site
   *  gets the same header shape now, not just the standalone one). */
  compact?: boolean
}) {
  const current = done.filter(Boolean).length
  const activeIdx = ONBOARDING_STAGE_STEP[action.stage] ?? current
  const progress = (
    <div className="flex items-center gap-2">
      <ProgressCell value={current} max={FIRST_TERM_STEPS.length} tone="brand" label={false} className="w-full max-w-[160px]" />
      <p className="whitespace-nowrap text-xs text-muted-foreground">{current} of {FIRST_TERM_STEPS.length} set up</p>
    </div>
  )
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className={compact ? 'text-sm font-semibold text-foreground' : 'font-heading text-lg font-semibold text-foreground'}>
          Getting started
        </p>
        {progress}
      </div>
      <div className="flex flex-col gap-2">
        {FIRST_TERM_STEPS.map((step, idx) => {
          // NOT `resolveStepStatus(idx, activeIdx, ...)` — that DS helper
          // assumes a linear wizard where every step before `current` is
          // done (`index < current`), which is wrong here: `activeIdx` comes
          // from `nextTermAction`'s priority stage, not "the next undone
          // step in order", so a step can sit BEFORE the active one and
          // still be incomplete (e.g. `not-configured` maps to step 4 while
          // step 3 "First survey" is still outstanding — confirmed live
          // 2026-09-02, "First survey" rendered a false checkmark). Real
          // completion comes only from `done[idx]`.
          const status = done[idx] ? 'completed' : idx === activeIdx ? 'current' : 'upcoming'
          const isActive = idx === activeIdx
          // A step earns its own button once its prerequisite is done — its
          // route exists regardless, but surfacing it before that reads as
          // premature (e.g. "Schedule evaluations" before any courses are
          // connected). Real data completes steps in order (see the
          // `onboardingDone` comment on why step 4 can't be true without
          // step 3), so this is never blocked by anything but real state.
          const reachable = idx === 0 || done[idx - 1]
          const other = stepCta(idx, term, hasTemplates)
          const ctaLabel = isActive ? action.label : other.label
          const ctaHref = isActive ? action.href : other.href
          const ctaExternal = isActive ? action.external : other.external
          return (
            <div
              key={step.id}
              aria-current={isActive ? 'step' : undefined}
              className={`flex flex-col gap-2 rounded-lg border p-3 ${isActive ? 'border-brand bg-brand-tint' : 'border-border'}`}
            >
              <div className="flex items-start gap-2.5">
                <div className={wizardMarkerClass(isActive ? 'completed' : status, 'numbered')}>
                  {status === 'completed' ? (
                    <i className="fa-solid fa-check text-sm text-brand-foreground" aria-hidden="true" />
                  ) : (
                    <span className={isActive ? 'tabular-nums text-brand-foreground' : 'tabular-nums'}>{idx + 1}</span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  {/* Same light-mode-contrast fix as the former standalone
                      strip — `wizardLabelClass`'s "completed" branch is
                      `text-brand`, which fails 4.5:1 in light mode (confirmed
                      live via axe). */}
                  <p className={status === 'completed' || isActive ? 'text-sm font-medium text-foreground' : wizardLabelClass(status)}>
                    {step.label}
                  </p>
                  {status !== 'completed' && (
                    <p className="text-xs text-muted-foreground">{isActive ? action.why : step.description}</p>
                  )}
                </div>
              </div>
              {/* The active step's button is never gated by `reachable` —
                  `nextTermAction` already decided it's the real, currently-
                  actionable priority (that's what "active" means), which
                  can disagree with the naive "previous step must be done
                  first" heuristic: e.g. `not-configured` maps to step 4
                  while step 3 isn't done yet, because this app's push flow
                  creates AND schedules a survey in one action — they're
                  fulfilled together, not strictly in sequence. Confirmed
                  live 2026-09-02 on `acc-noroster`: the gate suppressed the
                  ONLY button on the page, leaving no way to act at all.
                  `reachable` still gates the OTHER, secondary steps' buttons. */}
              {status !== 'completed' && (isActive || (reachable && ctaHref)) && (
                <div className="ms-9 w-fit">
                  <LedgerAction
                    href={ctaHref}
                    external={ctaExternal}
                    onClick={isActive ? action.onClick : undefined}
                    filled={isActive}
                    primary={!isActive}
                  >
                    {ctaLabel}
                  </LedgerAction>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Operations "Live term" card — the reference's flat course/evaluation
 *  line-item list, built from the SAME real breakdown buckets
 *  `CurrentTermCard` uses (never the reference's literal counts). */
function LiveTermCard({
  snap, breakdown, hasTemplates, onboarding,
}: {
  snap: TermSnapshot
  breakdown: CourseBreakdown | null
  hasTemplates: boolean
  /** Only the ONE current-term card `nextTermAction`'s onboarding scope
   *  actually points at gets this (see `OperationsDashboardBody`) — the
   *  compact 4-step checklist beneath the headline below, shown only while
   *  setup is incomplete. Every card gets the headline itself regardless
   *  (computed locally from its own `action`, not this prop) — "what do I
   *  do next" shouldn't go quiet just because initial setup finished
   *  (Romit, 2026-09-02: "nor it is showing for last term or current term
   *  any action that the user needs to do"). */
  onboarding?: { done: boolean[] } | null
}) {
  const { term } = snap
  const b = breakdown
  /* Not-configured and Draft used to share one "Not set up" row/count
     (`notConfiguredCount + draft.length`) — collapsed two structurally
     different buckets (never touched vs. saved-but-unfinished) into one,
     which also meant a term with real draft surveys never got the
     reference's "Draft → Finish" row at all (caught live 2026-09-02, every
     row this card could show was checked against the real breakdown data).
     Split back into their own rows/counts below. */
  const notConfiguredCount = b ? b.notConfiguredCount : 0
  const atRisk = b ? liveAtRiskCodes(b.live) : new Set<string>()
  const win = evalWindow(term)
  const workspaceHref = (tab: 'active' | 'finished') => `/course-evaluation/term/${term.id}?tab=${tab}`
  /* One shared model decides which row is "the next thing to do" — the same
     `nextTermAction` the Getting Started strip reads, so the two surfaces
     never point at different rows (previously the not-configured row was
     unconditionally `filled`, even when e.g. a live course was already
     falling behind target and needed a reminder more urgently). */
  const action = nextTermAction(snap, b, { hasTemplates })
  const isPrimary = (stage: TermSetupStage) => action.stage === stage

  return (
    <TermCardShell
      term={term}
      position="current"
      metaTrailing={`Eval window ${win.open.replace(/, \d{4}$/, '')} – ${win.close}`}
      footer={
        <>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {b ? `${plural(b.totalCourses, 'course')} in this term` : `${snap.total} evaluations`}
          </p>
          <ViewDetailsLink term={term} />
        </>
      }
    >
      {/* The merged "what do I do next" section — was a separate floating
          "Getting started" card above this one, disconnected from the row
          list it was pointing at (Romit, 2026-09-02: "the individual card
          for getting started is not merged with current term").
          While setup is incomplete, the checklist itself IS this section —
          the active step's own card carries the headline + button.
          Once setup is done, this renders NOTHING — a standalone "Next: X"
          headline used to repeat here, duplicating the exact same label,
          description, and filled button the row list already shows on its
          one primary row (Romit, 2026-09-02, pointing at that headline:
          "remove this" — the row list's own filled action + per-row
          description already say what to do and why, once every row has
          both, which they didn't when this headline was first added). */}
      {onboarding && !onboarding.done.every(Boolean) && (
        <div className="border-b border-border pb-4">
          <TermSetupChecklist done={onboarding.done} action={action} term={term} hasTemplates={hasTemplates} compact />
        </div>
      )}
      {/* The row list below is suppressed while the checklist above is
          showing — for every account where setup is genuinely incomplete,
          the row list would just restate whichever single bucket the active
          step already names (confirmed live 2026-09-02 on `acc-noroster`:
          the "Schedule" action appeared a third time here, identical to the
          checklist's own step 4). Mixed-bucket terms only reach this state
          once onboarding is already complete (having several buckets at
          once implies surveys exist in more than one stage, which is enough
          to satisfy all 4 checklist steps — verified against `acc-case4`),
          so the row list never has real information to add while the
          checklist is still visible. */}
      {(!onboarding || onboarding.done.every(Boolean)) && (!b ? (
        <Ledger
          rows={
            <OperationsRow
              countLabel="0 course offerings"
              description="No courses have been connected from Prism yet."
              courseCodes={[]}
              tint={LIST_HUB_STATUS_TINT_NEUTRAL}
              tintLabel="Not synced"
              icon="fa-graduation-cap"
              action={<LedgerAction href={prismCoursesHref()} external primary>Add courses</LedgerAction>}
            />
          }
        />
      ) : (
        <Ledger
          rows={
            <>
              {/* No templates exist yet — the real blocker for an account
                  like "Prairie DPT," which otherwise looked identical to a
                  plain "not scheduled" term and offered the wrong action
                  (caught live 2026-09-02: same as `CurrentTermCard`'s own
                  `noTemplates` row on the Ledger layout, ported here since
                  Operations never had it). */}
              {!hasTemplates && (
                <OperationsRow
                  countLabel="0 templates"
                  description="No survey template exists yet, so nothing can go out to courses."
                  courseCodes={[]}
                  tint={LIST_HUB_STATUS_TINT_NEUTRAL}
                  tintLabel="No template"
                  icon="fa-file-lines"
                  action={<LedgerAction href="/templates/new" filled={isPrimary('no-template')} primary>Create template</LedgerAction>}
                />
              )}
              {/* Every row's count is in COURSES, never "evaluations" — a row
                  is fundamentally "N of my courses are at stage X," and the
                  previous per-bucket noun swap (courses here, evaluations
                  everywhere else) read as an unexplained inconsistency
                  (Romit, 2026-09-02: "this is not understood, especially the
                  content"). The count is also now a real popover naming
                  which course(s), not an anonymous number. */}
              {notConfiguredCount > 0 && (
                <OperationsRow
                  countLabel={plural(notConfiguredCount, 'course')}
                  description="Hasn't been scheduled for evaluation yet."
                  courseCodes={b.notConfiguredCodes}
                  tint={LIST_HUB_STATUS_TINT_NEUTRAL}
                  tintLabel="Not set up"
                  icon="fa-list-check"
                  action={<LedgerAction href={`/surveys/push?term=${term.id}`} filled={isPrimary('not-configured')} primary>Schedule</LedgerAction>}
                />
              )}
              {b.draft.length > 0 && (
                <OperationsRow
                  countLabel={plural(b.draft.length, 'course')}
                  description="Evaluation started but not yet sent to students or faculty."
                  courseCodes={b.draft.map((s) => s.courseCode)}
                  tint={LIST_HUB_STATUS_TINT_NEUTRAL}
                  tintLabel="Draft"
                  icon="fa-pen"
                  action={<LedgerAction href={`/surveys/push?term=${term.id}`} filled={isPrimary('drafts')} primary>Finish</LedgerAction>}
                />
              )}
              {b.scheduled.length > 0 && (
                <OperationsRow
                  countLabel={plural(b.scheduled.length, 'course')}
                  description="Evaluation window is set but hasn't opened yet."
                  courseCodes={b.scheduled.map((s) => s.courseCode)}
                  tint={LIST_HUB_STATUS_TINT_PLANNED}
                  tintLabel="Scheduled"
                  icon="fa-calendar"
                  action={<LedgerAction href={workspaceHref('active')} filled={isPrimary('scheduled')} primary>Update</LedgerAction>}
                />
              )}
              {b.live.length > 0 && (
                <OperationsRow
                  countLabel={plural(b.live.length, 'course')}
                  description={atRisk.size > 0 ? 'Collecting now, but response rate is falling behind target.' : 'Currently collecting responses.'}
                  courseCodes={b.live.map((s) => s.courseCode)}
                  tint={LIST_HUB_STATUS_TINT_SUCCESS}
                  tintLabel="Live"
                  icon="fa-bolt"
                  warningLabel={atRisk.size > 0 ? 'Low response' : undefined}
                  action={<LedgerAction href={`/surveys/remind?from=term:${term.id}`} filled={isPrimary('live-at-risk')} primary>Remind</LedgerAction>}
                />
              )}
              {b.closed.length > 0 && (
                <OperationsRow
                  countLabel={plural(b.closed.length, 'course')}
                  description="Collection has ended — ready for review."
                  courseCodes={b.closed.map((s) => s.courseCode)}
                  tint={LIST_HUB_STATUS_TINT_COMPLETED}
                  tintLabel="Closed"
                  icon="fa-check"
                  action={<LedgerAction href={workspaceHref('finished')} filled={isPrimary('awaiting-review') || isPrimary('released')} primary>Review</LedgerAction>}
                />
              )}
            </>
          }
        />
      ))}
    </TermCardShell>
  )
}

/** Operations "Last closed term" card — a 3-stat panel (response rate /
 *  course avg / faculty avg, each with a real delta vs the prior term in
 *  `termSeries()`) instead of the Ledger design's rail+bucket-row anatomy.
 *
 *  No `StatementGauge` floor/target bullet under the response-rate stat —
 *  the reference (exxat-surveys-24f.pages.dev) has no such element on this
 *  card, plain number + trend-arrow delta only (confirmed live, Romit
 *  2026-09-02: "the progress bar for last term isn't something which is
 *  shown in the link"). The Ledger design's `LastTermCard` and the terms
 *  table's `ResponseProgressCell` still carry the floor/target logic where
 *  it has a real reference counterpart — only this card's copy of it is
 *  removed, not the underlying threshold model in `pce-at-risk.ts`. */
function LastClosedTermCard({
  snap,
  breakdown,
  series,
}: {
  snap: TermSnapshot
  breakdown: CourseBreakdown | null
  series: TermSeriesPoint[]
}) {
  const { term } = snap
  const b = breakdown
  const closedRate = b ? weightedRate(b.closed) : null
  const neverWentOut = b ? b.notConfiguredCount + b.draft.length + b.scheduled.length : 0
  const stillLive = b ? b.live.length : 0
  const stragglerCount = neverWentOut + stillLive

  const idx = series.findIndex((s) => s.term === term.name)
  const current = idx >= 0 ? series[idx] : null
  const prior = idx > 0 ? series[idx - 1] : null

  function deltaOf(curr: number | null | undefined, prev: number | null | undefined) {
    if (curr == null || prev == null) return null
    const d = Math.round((curr - prev) * 100) / 100
    if (d === 0) return { text: 'No change vs prior term', color: undefined as string | undefined, icon: undefined as string | undefined }
    return {
      text: `${d > 0 ? '+' : ''}${d} vs prior term`,
      color: d < 0 ? LIST_HUB_STATUS_TINT_WARNING.fg : undefined,
      icon: d > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down',
    }
  }
  const rateDelta = deltaOf(closedRate, prior?.responseRate ?? null)
  const courseDelta = deltaOf(current?.courseAvg ?? null, prior?.courseAvg ?? null)
  const facultyDelta = deltaOf(current?.facultyAvg ?? null, prior?.facultyAvg ?? null)

  return (
    <TermCardShell
      term={term}
      position="last"
      metaTrailing={term.startDate && term.endDate ? fmtRange(term.startDate, term.endDate) : undefined}
      footer={
        <>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {b ? `${plural(b.totalCourses, 'course')} in this term` : `${snap.total} evaluations`}
          </p>
          <ViewDetailsLink
            term={term}
            label="View analytics"
            href={`/analytics?tab=term&term=${encodeURIComponent(term.name)}`}
          />
        </>
      }
    >
      {!b ? (
        <p className="text-sm text-muted-foreground">No course offerings synced for this term.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatementHero
              label="Response rate"
              value={closedRate != null ? `${closedRate}` : '—'}
              unit={closedRate != null ? '%' : undefined}
              annotation={rateDelta?.text}
              annotationColor={rateDelta?.color}
              annotationIcon={rateDelta?.icon}
              size="md"
              serif={false}
            />
            <StatementHero
              label="Course avg"
              value={current?.courseAvg != null ? `${current.courseAvg}` : '—'}
              annotation={courseDelta?.text}
              annotationColor={courseDelta?.color}
              annotationIcon={courseDelta?.icon}
              size="md"
              serif={false}
            />
            <StatementHero
              label="Faculty avg"
              value={current?.facultyAvg != null ? `${current.facultyAvg}` : '—'}
              annotation={facultyDelta?.text}
              annotationColor={facultyDelta?.color}
              annotationIcon={facultyDelta?.icon}
              size="md"
              serif={false}
            />
          </div>
          {stragglerCount > 0 && (
            <LocalBanner variant="warning" title="Needs attention">
              {[
                neverWentOut > 0 ? `${plural(neverWentOut, 'course')} never went out` : null,
                stillLive > 0 ? `${plural(stillLive, 'course')} still collecting` : null,
              ].filter(Boolean).join(' and ')} past this term's end.
            </LocalBanner>
          )}
          {/* Reference has 3 actions here (View analytics filled, Export
              summary + View details outline) — this card only had one, a
              bare text link in the footer (`ViewDetailsLink`, still there
              below, shared across every term card so left alone). "Export
              summary" has no existing summary-export feature anywhere in
              this codebase to link to (the one real export flow, results/
              [id]'s `ExportDrawer`, is survey-level, not term-level) — wired
              to the browser print dialog rather than a fabricated route;
              real backend export is a separate feature to build, not a UI fix. */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="default" size="sm" asChild>
              <Link href={`/analytics?tab=term&term=${encodeURIComponent(term.name)}`}>View analytics</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              Export summary
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/course-evaluation/term/${term.id}`}>View details</Link>
            </Button>
          </div>
        </>
      )}
    </TermCardShell>
  )
}

/** The reference-design (exxat-surveys-24f.pages.dev) populated dashboard —
 *  program-wide KPI band, a Live-term / Last-closed-term pair (no Upcoming
 *  column — dropped 2026-08-25, not reintroduced), a response-rate trend,
 *  and the same shared Term history tables. All figures are real, derived
 *  from the active demo account's own `ordered`/`ce` — never
 *  `programSummary()`/`termSeries()` called bare, which read the GLOBAL
 *  `MOCK_SURVEYS`/`MOCK_FACULTY_OFFERINGS` constants unconditionally and
 *  never varied by account (caught live 2026-09-02: a zero-term "Riverside
 *  DPT" account still reported "9 of 18 faculty below threshold" and a
 *  5-term chart history — acc-healthy's own numbers, leaked into every
 *  other account). See the two-gate model just below for the per-term
 *  version of that fix. */
function OperationsDashboardBody({
  currentSnaps, lastSnaps, breakdownForSnap, onAdd, ce, ordered, positions, lastTerms, templates,
  onboardingDone, stepAction, onboardingScopeTermId,
}: DashboardBodyBaseProps & {
  /** The same per-step completion + "what's next" model `DashboardHomeInner`
   *  computes once and used to feed a separate floating "Getting started"
   *  card above this whole body — now threaded down into whichever
   *  `LiveTermCard` `onboardingScopeTermId` actually points at, so the
   *  checklist lives inside the term card it's about instead of a card of
   *  its own (Romit, 2026-09-02). */
  onboardingDone: boolean[]
  stepAction: TermNextAction
  onboardingScopeTermId: string | null
}) {
  const hasTemplates = templates.length > 0
  // Resolved from `ordered` (this body's own full term list) rather than
  // threaded down as a separate prop — needed by the zero-current/zero-last
  // fallback branch below, where there's no `LiveTermCard` to read a real
  // `ProgramTerm` off of for the checklist's per-step (non-active) hrefs.
  const onboardingTerm = ordered.find((t) => t.id === onboardingScopeTermId) ?? null

  /* Course/faculty AVERAGE SCORES have no per-account data model at all —
   * the demo-account fixtures (`pce-demo-accounts.ts`) model survey/offering
   * *workflow* state (draft/scheduled/live/closed) for Cases 1-9, never
   * score distributions; every score number `programSummary()`/`termSeries()`
   * can produce still comes from the one legacy `MOCK_FACULTY_OFFERINGS`
   * dataset that only `acc-healthy`'s terms happen to reuse (by literally
   * being built from `MOCK_PROGRAM_TERMS`).
   *
   * Two gates, evaluated PER TERM (the prior version gated the whole
   * ACCOUNT — `ordered.every(...)` — which is what let two zero-survey
   * accounts slip through: `acc-upcoming-only`'s one term is literally
   * `{...FALL26}`, keeping FALL26's own `pt5` id, and `acc-notemplates`'
   * terms are the real `pt1`/`pt5` objects, so both passed the id check
   * despite having zero surveys of their own — showing Johns Hopkins'
   * numbers on both. Caught live 2026-09-02):
   *   1. STATE gate — has this term actually had a survey finish
   *      (`termHasFinishedSurveys`)? Nothing closed → nothing to score,
   *      full stop, regardless of setup progress otherwise.
   *   2. PROVENANCE gate — is this literally one of `MOCK_PROGRAM_TERMS`'
   *      own term objects (by id)? That's the prototype's stand-in for "the
   *      analytics warehouse has rows for this term" — Cases 4-9 build
   *      their OWN term objects (`case4-term`, etc., same NAME as a real
   *      term but a different id) specifically so a name-based check would
   *      wrongly borrow Johns Hopkins' same-named term's scores; id is the
   *      one thing that actually identifies "the same term the global mock
   *      was built from," not a coincidental name match.
   *  A term needs BOTH to contribute a real score — one gate answers "is
   *  there anything to show yet," the other "do we have that data at all,"
   *  and the KPI copy below cites whichever one actually failed. */
  const finishedTermIds = useMemo(
    () => new Set(ordered.filter((t) => termHasFinishedSurveys(t, ce)).map((t) => t.id)),
    [ordered, ce],
  )
  const scoredTermIds = useMemo(
    () => new Set([...finishedTermIds].filter((id) => MOCK_PROGRAM_TERMS.some((mt) => mt.id === id))),
    [finishedTermIds],
  )
  const hasFinished = finishedTermIds.size > 0
  const hasScores = scoredTermIds.size > 0
  const globalSeries = useMemo(() => (hasScores ? termSeries() : []), [hasScores])
  const globalSummary = useMemo(() => (hasScores ? programSummary() : null), [hasScores])

  /* Response rate (+ its raw enrolled/responded/course counts) is rebuilt
   * from the SAME `snapshot()`/`weightedRate()` the term cards and history
   * table already use — never `termSeries()`'s own enrolled/responded sum,
   * which disagreed with the card/table on the same term (the concrete bug:
   * `termSeries()` reported Spring 2025 at 69%, where `snapshot()` — the
   * number actually shown on the card and table — is 74%, because
   * `weightedRate` excludes draft/scheduled surveys' 0% placeholder rate and
   * `termSeries()` doesn't). This part applies to every account, scored or
   * not — it's real survey data, not a borrowed score. */
  const series: TermSeriesPoint[] = useMemo(
    () =>
      ordered.map((t) => {
        const snap = snapshot(t, ce)
        // Per-term gate, not just the account-level `hasScores` that decides
        // whether `globalSeries` is populated at all — a name match alone
        // (`gs.term === t.name`) is exactly how Cases 4-9 would otherwise
        // borrow Johns Hopkins' same-named "Fall 2026" scores despite being
        // a different term with no score data of its own.
        const g = scoredTermIds.has(t.id) ? globalSeries.find((gs) => gs.term === t.name) : undefined
        return {
          term: t.name,
          short: shortTerm(t.name),
          year: termToYear(t.name),
          courseAvg: g?.courseAvg ?? null,
          facultyAvg: g?.facultyAvg ?? null,
          responseRate: snap.rate,
          enrolled: snap.enrollmentCount,
          responded: snap.responseCount,
          courses: snap.coverage?.total ?? 0,
        }
      }),
    [ordered, ce, globalSeries],
  )
  const summary = globalSummary
  /** Feeds the Other-terms table's Course avg / Faculty avg columns —
   *  same `series` computed above, just keyed for lookup by term name. */
  const scoreByTermName = useMemo(
    () => new Map(series.map((s) => [s.term, { courseAvg: s.courseAvg, facultyAvg: s.facultyAvg }])),
    [series],
  )

  const needsSetupTotal = useMemo(
    () =>
      currentSnaps.reduce((sum, s) => {
        const b = breakdownForSnap(s)
        return sum + (b ? b.notConfiguredCount + b.draft.length : 0)
      }, 0),
    [currentSnaps, breakdownForSnap],
  )

  const primaryCurrent = currentSnaps[0] ?? null
  const primaryBreakdown = primaryCurrent ? breakdownForSnap(primaryCurrent) : null
  const primaryLastBreakdown = lastSnaps[0] ? breakdownForSnap(lastSnaps[0]) : null
  const primaryLastClosedRate = primaryLastBreakdown ? weightedRate(primaryLastBreakdown.closed) : null
  const rateDiff =
    primaryCurrent?.rate != null && primaryLastClosedRate != null ? primaryCurrent.rate - primaryLastClosedRate : null
  const hasOpened = primaryCurrent?.rate != null

  // Score-tile fail copy is STATE-shaped ("no results yet"/"not published"),
  // never ACCOUNT-shaped ("for this account") — the old copy implied the
  // gap was about which account was picked, when it's really about which
  // stage this term's own evaluations are at (Romit, 2026-09-02: "metrics
  // doesn't make sense until the complete setup is done"). Two distinct
  // failure copies because they're two distinct facts: nothing has closed
  // yet (state gate) vs. something closed but no score data exists for it
  // (provenance gate) — collapsing them into one sentence would hide which
  // one is actually true for e.g. Brightwater OT (Case 4, has a closed
  // survey, still shows "—" only because of the second gate).
  const scoreFailCopy = (noun: 'course' | 'faculty') =>
    hasFinished
      ? 'Scores not published for these terms yet'
      : `No results yet — ${noun === 'course' ? 'course' : 'faculty'} scores appear once evaluations close`

  const kpis: MetricItem[] = [
    {
      id: 'needs-setup',
      label: 'Needs setup',
      value: primaryBreakdown ? needsSetupTotal : '—',
      href: primaryBreakdown ? `/surveys/push?term=${primaryCurrent!.term.id}` : undefined,
      delta: '',
      trend: 'neutral',
      description: !primaryCurrent
        ? 'No active term'
        : !primaryBreakdown
          ? 'No course offerings connected yet'
          : needsSetupTotal === 0
            ? 'All courses scheduled'
            : currentSnaps.length > 1
              ? `Across ${plural(currentSnaps.length, 'active term')}`
              : 'Courses without a scheduled window',
      /* No `alert` prop here — the DS's `alert: 'warning'` tile styling fails
         WCAG contrast (2.99:1 on the tinted background vs the required
         4.5:1), confirmed live via axe; the value + description already
         carry the signal without relying on a failing DS affordance. Flag to
         Himanshu: KeyMetrics' warning-alert text color needs a token fix
         before any product surface can use it.
         Also flag: `MetricCell` renders no trailing chevron for the `href`
         case (the reference shows one) — link-ness is hover-only today;
         forking the DS component for one affordance isn't worth it here. */
    },
    {
      id: 'response-rate',
      label: 'Response rate',
      value: hasOpened ? `${primaryCurrent!.rate}%` : '—',
      href: hasOpened ? `/course-evaluation/term/${primaryCurrent!.term.id}?tab=active` : undefined,
      delta: rateDiff != null ? `${rateDiff > 0 ? '+' : ''}${rateDiff}` : '',
      trend: rateDiff == null ? 'neutral' : rateDiff > 0 ? 'up' : rateDiff < 0 ? 'down' : 'neutral',
      description: !primaryCurrent
        ? 'No live term right now'
        : hasOpened
          ? `${primaryCurrent.term.name} · vs last closed term`
          : `${primaryCurrent.term.name} · nothing collecting yet`,
    },
    {
      id: 'courses-below',
      label: 'Courses below threshold',
      value: summary ? summary.coursesBelowThreshold : '—',
      href: summary ? '/analytics?tab=course' : undefined,
      delta: '',
      trend: 'neutral',
      description: summary
        ? `Of ${summary.courseCount} scored, below the ${summary.courseMedian} median`
        : scoreFailCopy('course'),
    },
    {
      id: 'faculty-below',
      label: 'Faculty below threshold',
      value: summary ? summary.facultyBelowThreshold : '—',
      href: summary ? '/analytics?tab=faculty' : undefined,
      delta: '',
      trend: 'neutral',
      description: summary
        ? `Of ${summary.facultyCount} scored, below the ${summary.facultyMedian} median`
        : scoreFailCopy('faculty'),
    },
  ]

  /* Real Leo insight (see `ChartLeoPlotInsightOverlay` in
     `analytics-plots.tsx`), modeled on `analytics-panels.tsx`'s
     `responseTrendLeo` for the same "terms vs target" question — replaces
     the chart's former hand-rolled callout entirely. `anchor.xValue` must be
     the exact axis-tick text (`dashboardTrendLabel`), since the overlay
     resolves position by tick textContent match, not by raw term name. */
  const trendLeo: ChartLeoInsight | null = useMemo(() => {
    const pts = series.filter((s) => s.responseRate != null)
    if (pts.length < 2) return null
    const rates = pts.map((s) => s.responseRate as number)
    const below = rates.filter((r) => r < RESPONSE_TARGET).length
    const lowest = Math.min(...rates)
    const trough = pts[rates.indexOf(lowest)]!
    const last = rates[rates.length - 1]!
    const recovered = lowest < last - 4
    return {
      headline: `${below} of ${pts.length} terms came in under the ${RESPONSE_TARGET}% target`,
      explanation: recovered
        ? `Collection bottomed out at ${lowest}% in ${trough.term} and has climbed to ${last}% since. A single delta would hide the dip — a drop-and-recovery and a flat line produce the same number.`
        : `Collection runs to ${last}%, with the low at ${lowest}% in ${trough.term}. Read the path: the target is what a rate means, not the rate on its own.`,
      kind: below > 0 ? 'dip' : 'trend',
      delta: { value: `${lowest}%`, label: `low · ${trough.term}` },
      bullets: [
        `Latest ${last}% · low ${lowest}% (${trough.term}) · target ${RESPONSE_TARGET}%.`,
        `${below} of ${pts.length} terms below target.`,
      ],
      anchor: { xValue: dashboardTrendLabel(trough.term), yValue: lowest },
    }
  }, [series])

  return (
    <div className="flex flex-col gap-6">
      <h2 className="sr-only">Program status</h2>
      {/* KPI band + trend chart both stay hidden until at least one term
          exists at all (`ordered.length === 0` — a genuinely first-time
          account, e.g. `acc-fresh`) — every tile/chart would read nothing
          but dashes and "no results yet" copy, which is noise, not
          information, on a screen whose only real content is "set up your
          first term" (Romit, 2026-09-02: reference shows neither on this
          exact state either). Once ANY term exists — even one that's
          upcoming or has zero courses — they come back, since they start
          reflecting real (if sparse) state at that point. */}
      {ordered.length > 0 && (
        /* shrink-0: the DS's `KeyMetrics variant="flat"` renders its own
            `overflow-hidden` section, which — as a flex-column item — gets an
            automatic min-height of 0 and silently absorbs 100% of any height
            deficit from this page's outer flex-1 scroll chain, clipping every
            value/delta/description to nothing (confirmed live 2026-09-02: real
            height 194px, painted height 87px, `overflow: hidden`). shrink-0
            here stops the deficit from ever reaching it — flag to Himanshu:
            the DS component itself should ship this. */
        <div className="shrink-0">
          <KeyMetrics variant="flat" size="md" showHeader={false} metricsSingleRow metrics={kpis} />
        </div>
      )}

      {currentSnaps.length === 0 && lastSnaps.length === 0 ? (
        /* No current term AND no last term — e.g. a brand-new account, or
           one whose only term is upcoming (acc-upcoming-only). Same merged
           headline+checklist pattern `LiveTermCard` uses below, since there's
           no term card here to embed it in yet — `NoActiveTermNotice`'s old
           plain banner gave no checklist and no "why" at all.
           shrink-0: the DS `Card` bakes in `overflow-hidden` (card.tsx) —
           without this, this Card is a flex-column item in the same
           outer flex-1 chain that clipped the KPI band earlier this
           session (min-height:auto resolves to 0 under `overflow-hidden`,
           so it silently absorbs the layout deficit instead of the
           checklist steps rendering at full height). Confirmed live
           2026-09-02: checklist steps were clipped to a 1px sliver. */
        <div className="shrink-0">
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              {/* Same de-duplication as `LiveTermCard`: while the checklist
                  is showing, its own active-step card carries the headline
                  and button — a separate "Next: X" block above it would
                  repeat "Set up term" twice in the same small card (caught
                  live 2026-09-02 on `acc-fresh`, the same redundancy pattern
                  the row list had). Only falls back to the plain headline if
                  onboarding is somehow already complete despite having no
                  current/last term to show a real card for. */}
              {!onboardingDone.every(Boolean) ? (
                <TermSetupChecklist done={onboardingDone} action={stepAction} term={onboardingTerm} hasTemplates={hasTemplates} />
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">Next: {stepAction.label}</p>
                    <p className="text-sm text-muted-foreground">{stepAction.why}</p>
                  </div>
                  <div className="w-fit">
                    <LedgerAction href={stepAction.href} external={stepAction.external} onClick={stepAction.onClick} filled>
                      {stepAction.stage === 'no-term' && <i className="fa-light fa-calendar-plus" aria-hidden="true" style={{ fontSize: 12 }} />}
                      {stepAction.label}
                    </LedgerAction>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground">Live term</h3>
            {currentSnaps.length > 0 ? (
              currentSnaps.map((s) => (
                <LiveTermCard
                  key={s.term.id}
                  snap={s}
                  breakdown={breakdownForSnap(s)}
                  hasTemplates={hasTemplates}
                  onboarding={s.term.id === onboardingScopeTermId ? { done: onboardingDone } : null}
                />
              ))
            ) : (
              <Card>
                <CardContent className="flex min-h-[160px] flex-1 items-center justify-center">
                  <p className="text-sm text-muted-foreground">No term is collecting right now</p>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground">Last closed term</h3>
            {lastSnaps.length > 0 ? (
              lastSnaps.map((s) => (
                <LastClosedTermCard key={s.term.id} snap={s} breakdown={breakdownForSnap(s)} series={series} />
              ))
            ) : (
              <Card>
                <CardContent className="flex min-h-[160px] flex-1 items-center justify-center">
                  <p className="text-sm text-muted-foreground">No recent term to review</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {ordered.length > 0 && (
        <ChartCard
          variant="normal"
          title="Response rate by term"
          description="Closed terms and the live collection window, against this program's target."
          leoInsight={trendLeo}
        >
          {series.length > 0 ? (
            <ChartFigure
              label="Response rate by term"
              summary={`Response rate against the ${RESPONSE_TARGET}% target across ${series.length} terms.`}
              dataLength={series.length}
              leoInsight={trendLeo}
            >
              {() => (
                <>
                  <DashboardResponseTrend series={series} target={RESPONSE_TARGET} height={220} />
                  <ChartDataTable
                    caption="Response rate by term"
                    headers={['Term', 'Response rate']}
                    rows={series
                      .filter((s) => s.responseRate != null)
                      .map((s) => [s.term, `${s.responseRate}%`])}
                  />
                </>
              )}
            </ChartFigure>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No term history yet.</p>
          )}
        </ChartCard>
      )}

      <TermHistorySection
        ce={ce}
        terms={ordered}
        positions={positions}
        shownLastId={lastTerms[0]?.id ?? null}
        scoreByTermName={scoreByTermName}
      />
    </div>
  )
}

/* ── page ─────────────────────────────────────────────────────────────────── */

function DashboardHomeInner() {
  const { surveys, programTerms, templates, addProgramTerm, updateProgramTerm, dashboardLayout } = usePce()
  /* Same term-editor sheet as Common Settings' Academic Calendar tab (Romit,
   * 2026-09-02: "I want the designs to remain consistent" / "replace the
   * setup term sheet with academic year sheet") — `editingTerm` is null when
   * closed, a `draftTerm()` placeholder when creating, or a real term when
   * editing an existing one's dates. */
  const [editingTerm, setEditingTerm] = useState<ProgramTerm | null>(null)
  function saveTerm(t: ProgramTerm) {
    if (t.id.startsWith('new-')) addProgramTerm({ ...t, id: `pt${Date.now()}` })
    else updateProgramTerm(t.id, t)
    setEditingTerm(null)
  }

  /* Terms come from STATE (not the static mock) so a term finished in the
   * setup wizard appears here as a card immediately. */
  const ordered = useMemo(
    () => [...programTerms].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [programTerms],
  )
  /* Stable within one mount — every classification call below uses this same
   * instant, so terms can't drift into different windows mid-render. */
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const ce = useMemo(
    () => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'),
    [surveys],
  )

  /* Current/Upcoming can still hold more than one term (Aug 19 2026 feedback
   * — genuinely independent programs can each have their own concurrent
   * term). Current additionally runs through `resolveTermPositions`'
   * registrar rule (Romit, 2026-08-24): a term doesn't get to keep "Current"
   * once a later term on the SAME sequential timeline has actually started,
   * even if it's still inside its own trailing grace window — a university
   * doesn't run Spring and Fall as current at once. Terms starting 30+ days
   * out ('future') deliberately aren't in any of these three; they live in
   * the history table below until they enter the Upcoming window. */
  const positions = useMemo(() => resolveTermPositions(ordered, today), [ordered, today])
  const currentTerms = useMemo(
    () => ordered.filter((t) => positions.get(t.id) === 'current'),
    [ordered, positions],
  )
  /* Last is capped to ONE card (Vishal, transcript 7a175890: "last should be
   * the first card" — singular, unlike Current/Upcoming which can genuinely
   * have several concurrent programs). Every other Last-window term falls
   * into the history table via TermHistorySection's `shownLastId` exclusion
   * instead of stacking a second card here. */
  const lastCandidates = useMemo(
    () => ordered.filter((t) => positions.get(t.id) === 'last'),
    [ordered, positions],
  )
  const lastTerms = useMemo(() => {
    const mostRecent = [...lastCandidates].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
    return mostRecent ? [mostRecent] : []
  }, [lastCandidates])
  const upcomingTerms = useMemo(
    () => ordered.filter((t) => positions.get(t.id) === 'upcoming'),
    [ordered, positions],
  )

  const currentSnaps = useMemo(() => currentTerms.map((t) => snapshot(t, ce)), [currentTerms, ce])
  const lastSnaps = useMemo(() => lastTerms.map((t) => snapshot(t, ce)), [lastTerms, ce])
  const upcomingSnaps = useMemo(() => upcomingTerms.map((t) => snapshot(t, ce)), [upcomingTerms, ce])

  /* Breakdown Mode (Cases 4–9) — null whenever the card is still in one of
   * its single-CTA empty states (no courses / no evaluations yet), which the
   * cards themselves check first via `snap.coverage`/`snap.total`. */
  const breakdownForSnap = (snap: TermSnapshot) => breakdownFor(snap.term, ce)

  /* First run = no terms at all (not merely no surveys) — a term created but
   * not yet dated/populated still gets its own card, not the empty state.
   * Only gates the header's "Set up Evaluations"/"Set up term" actions
   * (premature with nothing to evaluate yet) — NOT whether the onboarding
   * strip shows, see `onboardingDone` below. */
  const firstRun = programTerms.length === 0

  /* Real per-step onboarding progress, derived from the same breakdown data
   * the dashboard body already computes — never a hardcoded counter. Steps
   * tick off individually as term/courses/survey/schedule state changes;
   * previously `firstRun` was a hard on/off switch and the entire 4-step
   * checklist vanished the instant one term existed, which read as "steps
   * getting removed" rather than progress (Romit, 2026-09-02).
   *
   * Falls back to the nearest upcoming term when there's no current one —
   * caught live 2026-09-02 on `acc-upcoming-only` ("Cascade Nursing"): its
   * one term is deliberately dated in the future (demoing the Upcoming
   * card), so `currentSnaps[0]` alone saw nothing and step 2 stayed active
   * despite that term's courses already being connected. A term still being
   * set up ahead of its start date is still mid-onboarding for it, not a
   * separate case the strip should be blind to. */
  const onboardingSnap = currentSnaps[0] ?? upcomingSnaps[0] ?? null
  const primaryBreakdown = onboardingSnap ? breakdownForSnap(onboardingSnap) : null
  const hasTemplates = templates.length > 0
  const onboardingDone = useMemo(
    () => [
      programTerms.length > 0,
      primaryBreakdown !== null,
      primaryBreakdown
        ? primaryBreakdown.draft.length + primaryBreakdown.scheduled.length + primaryBreakdown.live.length + primaryBreakdown.closed.length > 0
        : false,
      primaryBreakdown
        ? primaryBreakdown.scheduled.length + primaryBreakdown.live.length + primaryBreakdown.closed.length > 0
        : false,
    ],
    [programTerms.length, primaryBreakdown],
  )
  const onboardingComplete = onboardingDone.every(Boolean)
  /* The one thing to do next, for whichever term onboarding is scoped to —
     same model the Live-term card's own `filled` row uses, so the strip and
     the card underneath it never point at different actions (Romit,
     2026-09-02: "Getting started card isn't connected with any actions"). */
  const stepAction = useMemo(
    () => nextTermAction(onboardingSnap, primaryBreakdown, { hasTemplates, onAdd: () => setEditingTerm(draftTerm()) }),
    [onboardingSnap, primaryBreakdown, hasTemplates],
  )

  return (
    <div className="flex flex-col flex-1">
      {/* Scope in the title — two dashboards live in this shell (Course
          Evaluation vs Programmatic Surveys); a bare "Dashboard" gave no
          orientation (Romit 2026-07-19). Matches the command-menu label. */}
      <SiteHeader title="Course Evaluation Dashboard" />
      <PageHeader
        title="Course Evaluation Dashboard"
        subtitle="Set up evaluations, track response rate, and remind"
        actions={
          /* Before any term exists, "Set up Evaluations" is premature (there's
             nothing to evaluate) and duplicates the empty state's own CTA — so
             the header stays clean and the single "Set up term" action lives in
             the empty state. Both header actions return once a term exists. */
          firstRun ? undefined : (
            <div className="flex items-center gap-2" role="group" aria-label="Dashboard actions">
              <Button variant="outline" size="default" onClick={() => setEditingTerm(draftTerm())}>
                Set up term
              </Button>
              <Button variant="default" size="default" asChild>
                <Link href="/surveys/push">Set up Evaluations</Link>
              </Button>
            </div>
          )
        }
      />

      <div className="flex flex-1 flex-col gap-6 px-7 py-4">
        {/* Operations merges this guidance directly into `LiveTermCard`
            (Romit, 2026-09-02: "not merged with current term") — only the
            Ledger layout, unchanged this round, still needs the standalone
            strip. */}
        {dashboardLayout === 'ledger' && !onboardingComplete && (
          <OnboardingProgressStrip done={onboardingDone} action={stepAction} scopeTerm={onboardingSnap?.term ?? null} />
        )}
        {dashboardLayout === 'ledger' ? (
          <LedgerDashboardBody
            currentSnaps={currentSnaps}
            lastSnaps={lastSnaps}
            upcomingSnaps={upcomingSnaps}
            templates={templates}
            breakdownForSnap={breakdownForSnap}
            onAdd={() => setEditingTerm(draftTerm())}
            onEditDates={setEditingTerm}
            ce={ce}
            ordered={ordered}
            positions={positions}
            lastTerms={lastTerms}
          />
        ) : (
          <OperationsDashboardBody
            currentSnaps={currentSnaps}
            lastSnaps={lastSnaps}
            breakdownForSnap={breakdownForSnap}
            onAdd={() => setEditingTerm(draftTerm())}
            onboardingDone={onboardingDone}
            stepAction={stepAction}
            onboardingScopeTermId={onboardingSnap?.term.id ?? null}
            ce={ce}
            ordered={ordered}
            positions={positions}
            lastTerms={lastTerms}
            templates={templates}
          />
        )}
      </div>

      <TermEditorSheet
        term={editingTerm}
        existingYears={existingAcademicYears(programTerms)}
        onClose={() => setEditingTerm(null)}
        onSave={saveTerm}
      />
    </div>
  )
}

export function DashboardHome() {
  return (
    <Suspense>
      <DashboardHomeInner />
    </Suspense>
  )
}

/** Getting-started task list — what "set up your first term" actually
 *  decomposes into. Copy/order unchanged from the original full-page
 *  version (Romit, 2026-09-01 image ref). Chrome mapped to this file's
 *  existing DS Card + the DS Wizard's own status→style functions
 *  (`resolveStepStatus`/`wizardMarkerClass`/`wizardLabelClass`) rather than
 *  the full `<Wizard>` shell, which is built for paged focus-workflow
 *  routes, not an embedded dashboard checklist. */
const FIRST_TERM_STEPS: WizardStep[] = [
  {
    id: 'term',
    label: 'Set up your first term',
    description: 'Add term dates and academic year so evaluations can be scoped to the right window.',
  },
  {
    id: 'courses',
    label: 'Connect course offerings',
    description: 'Select courses that will receive student and faculty evaluations.',
  },
  {
    id: 'survey',
    label: 'First survey',
    description: 'Import an evaluation template or create the first survey for this term.',
  },
  {
    id: 'schedule',
    label: 'Schedule evaluations',
    description: 'Set open dates for each course before collection starts.',
  },
]

/** Per-browser "user collapsed the checklist" preference — independent of
 *  step completion, so manually hiding it mid-progress doesn't force it
 *  back open on the next visit. Mirrors the restore-post-mount pattern
 *  `pce-state.tsx` already uses for `dashboardLayout`/`activeAccountId`
 *  (localStorage read deferred to an effect so SSR and first client render
 *  agree, avoiding a hydration mismatch). */
function useOnboardingCollapsed(): [boolean, (v: boolean) => void] {
  const STORAGE_KEY = 'pce.onboardingStripCollapsed'
  const [collapsed, setCollapsedState] = useState(false)
  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === '1') setCollapsedState(true)
    } catch { /* ignore */ }
  }, [])
  function setCollapsed(v: boolean) {
    setCollapsedState(v)
    try { window.localStorage.setItem(STORAGE_KEY, v ? '1' : '0') } catch { /* ignore */ }
  }
  return [collapsed, setCollapsed]
}

/** Which checklist step owns a given `nextTermAction` stage — only the
 *  stages reachable while the strip is still showing (`!onboardingComplete`)
 *  are mapped; the post-onboarding stages (`live-*`, `scheduled`,
 *  `awaiting-review`, `released`) can't occur here, since all 4 booleans
 *  being true is exactly what hides the strip. */
const ONBOARDING_STAGE_STEP: Partial<Record<TermSetupStage, number>> = {
  'no-term': 0,
  'no-courses': 1,
  'no-template': 2,
  // 'not-configured' means the courses have no evaluation SCHEDULED at all —
  // that's step 4 ("Schedule evaluations"), not step 3 ("First survey").
  // Previously mapped to 2: harmless when both steps happen to be
  // incomplete together (the common case — no surveys yet at all, so
  // neither "a survey exists" nor "one is scheduled" is true), but it made
  // the checklist highlight "First survey" while the headline/button both
  // said "Schedule" — confusing on `acc-noroster`, caught live 2026-09-02.
  'not-configured': 3,
  drafts: 3,
}

/** Getting-started strip — coexists with the real dashboard body instead of
 *  a full-page takeover. `done` is real per-step completion (see
 *  `onboardingDone` in `DashboardHomeInner`), so steps tick off one at a
 *  time as term/courses/survey/schedule data actually changes; the parent
 *  only renders this at all while at least one step is outstanding, so
 *  there's no separate "fully onboarded" branch to draw here.
 *
 *  `action`/`scopeTerm` connect the checklist to a REAL destination — the
 *  same route the Live-term card's own row for that stage already uses
 *  (`nextTermAction`, `lib/pce-term-metrics.ts`). Previously only step 1 had
 *  a button; steps 2-4 were static text on the theory that "the real action
 *  already lives in the dashboard body below" — true, but nothing told the
 *  reader WHERE below, which is exactly what read as "not connected to any
 *  actions" (Romit, 2026-09-02). Reusing the card's own href here (rather
 *  than inventing a scroll-to/highlight interaction this app has no
 *  precedent for anywhere) means two entry points to one action, the same
 *  relationship step 1's button already has with the page header's own
 *  "Set up term" button. */
function OnboardingProgressStrip({
  done, action, scopeTerm,
}: {
  done: boolean[]
  action: TermNextAction
  scopeTerm: ProgramTerm | null
}) {
  const [collapsed, setCollapsed] = useOnboardingCollapsed()
  const current = done.filter(Boolean).length
  const activeIdx = ONBOARDING_STAGE_STEP[action.stage] ?? current

  if (collapsed) {
    return (
      <Card>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-expanded={false}
          className="flex w-full items-center justify-between gap-2 rounded-[inherit] px-4 py-3 text-left"
        >
          <span className="text-sm font-medium text-foreground">
            Getting started{scopeTerm ? ` · ${scopeTerm.name}` : ''} · {current} of {FIRST_TERM_STEPS.length} done
          </span>
          <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
        </button>
      </Card>
    )
  }

  return (
    <>
      {/* Sr-only heading keeps the document outline at h1→h2→h3 — without it
          this Card's h3 `CardTitle` would be the first heading after the
          page's h1, skipping a level (axe `heading-order`, caught live:
          previously `current` was always 0 so no step ever reached
          `completed`/this strip rendering unconditionally, so the body's own
          `<h2 className="sr-only">Program status</h2>` was always the first
          heading after h1 — now both render together). */}
      <h2 className="sr-only">Getting started</h2>
      <Card>
      <CardHeader className="border-b">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <CardTitle className="min-w-0 font-heading text-xl font-semibold leading-tight tracking-tight">
            Getting started
          </CardTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse getting-started checklist"
            aria-expanded="true"
            onClick={() => setCollapsed(true)}
          >
            <i className="fa-light fa-chevron-up" aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">{current} of {FIRST_TERM_STEPS.length} completed</p>
          <ProgressCell
            value={current}
            max={FIRST_TERM_STEPS.length}
            tone="brand"
            label={false}
            className="w-full max-w-full"
          />
          {/* Names which term this checklist is actually about — previously
              the strip gave no indication of that at all (Romit, 2026-09-02:
              "isn't showing for last term or current term any action that
              the user needs to do"). */}
          {scopeTerm && (
            <p className="text-xs text-muted-foreground">
              Setting up {scopeTerm.name} · {fmtRange(scopeTerm.startDate, scopeTerm.endDate)}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {FIRST_TERM_STEPS.map((step, idx) => {
          // NOT `resolveStepStatus(idx, activeIdx, ...)` — that DS helper
          // marks every step before `activeIdx` "completed" by index alone
          // (`index < current`), which is wrong once `activeIdx` comes from
          // `nextTermAction`'s stage rather than "the next undone step in
          // order": a step can sit before the active one and still be
          // outstanding (confirmed live 2026-09-02 on the Operations
          // twin of this component — "First survey" rendered a false
          // checkmark). Real completion comes only from `done[idx]`.
          const status = done[idx] ? 'completed' : idx === activeIdx ? 'current' : 'upcoming'
          const isActive = idx === activeIdx
          return (
            <div
              key={step.id}
              aria-current={isActive ? 'step' : undefined}
              className={`flex flex-col gap-3 rounded-lg border p-4 transition-colors ${
                isActive ? 'border-brand bg-brand-tint' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Active step gets the DS's own solid "completed" marker
                    treatment (border-brand bg-brand text-brand-foreground)
                    instead of the lighter "current" outline — composing an
                    existing wizardMarkerClass status, not a new color, so the
                    in-progress step reads as prominently as the reference's
                    filled circle while completed/upcoming keep their normal
                    DS states. */}
                <div className={wizardMarkerClass(isActive ? 'completed' : status, 'numbered')}>
                  {status === 'completed' ? (
                    <i className="fa-solid fa-check text-sm text-brand-foreground" aria-hidden="true" />
                  ) : (
                    <span className={isActive ? 'tabular-nums text-brand-foreground' : 'tabular-nums'}>{idx + 1}</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-1">
                  {/* Not `wizardLabelClass(status)` for the completed case —
                      the DS's own completed-label class is `text-brand`,
                      which fails contrast in light mode (3.55:1 vs the
                      required 4.5:1, confirmed live via axe: `#8580c6` on
                      white). It also puts brand color on a non-CTA text
                      label (design-anti-patterns.md: brand reserved for
                      primary CTAs). `text-foreground` matches the DS's own
                      dark/high-contrast override for this exact status.
                      Flag to Himanshu: `wizardLabelClass`'s light-mode
                      completed branch needs the same fix already applied to
                      its dark/hc variants. */}
                  <p className={status === 'completed' ? 'text-sm font-medium leading-4 text-foreground' : wizardLabelClass(status)}>
                    {step.label}
                  </p>
                  {/* Active step shows WHY this is next, specific to this
                      term's real state (`action.why` — e.g. "No survey
                      template exists yet" vs "4 courses have no evaluation
                      scheduled"), not the same static sentence for every
                      account; other steps keep their generic description. */}
                  <p className="text-sm text-muted-foreground">{isActive ? action.why : step.description}</p>
                </div>
              </div>
              {/* Real destination, reused from `nextTermAction` — the same
                  href/onClick the term card's own row for this stage uses,
                  so the strip and the card never disagree on where "next"
                  goes. `LedgerAction` already handles the href/external/
                  onClick fork (see its own doc comment). */}
              {isActive && (
                <div className="ms-12 w-fit">
                  <LedgerAction href={action.href} external={action.external} onClick={action.onClick} filled>
                    {action.stage === 'no-term' && <i className="fa-light fa-calendar-plus" aria-hidden="true" style={{ fontSize: 12 }} />}
                    {action.label}
                  </LedgerAction>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
      </Card>
    </>
  )
}
