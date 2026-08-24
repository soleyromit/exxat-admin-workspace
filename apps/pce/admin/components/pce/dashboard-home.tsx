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

import { useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Badge,
  Button,
  PageHeader,
  Card, CardHeader, CardTitle, CardContent, CardFooter,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  StatusBadge,
  Tip,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { AddTermDrawer, AddTermDatesDrawer } from '@/components/pce/add-term-drawer'

import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'
import {
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_PLANNED,
  LIST_HUB_STATUS_TINT_COMPLETED,
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
  type TermSnapshot, type TermWindowPosition, type CourseBreakdown,
} from '@/lib/pce-term-metrics'
import type { PceSurvey, ProgramTerm } from '@/lib/pce-mock-data'

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
  size = 'lg',
  serif = true,
}: {
  label: string
  /** Small mono fact on the label's baseline — e.g. "target 80%". */
  trailing?: string
  value: string
  unit?: string
  annotation?: string
  annotationColor?: string
  size?: 'lg' | 'md'
  /** The statement skin's serif display face for the ledger figure — off
   *  for the response-rate hero specifically (Romit, 2026-08-25: "use
   *  Inter font, in the response rate metric instead of serif"), so it
   *  reads in the DS body face like the rest of the row content around it.
   *  Coverage's hero keeps the serif treatment; only asked to change
   *  response rate. */
  serif?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
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
        <p className="text-xs font-medium" style={{ color: annotationColor ?? 'var(--muted-foreground)' }}>
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
  const marks = [
    { at: floor, ink: 'var(--muted-foreground)', word: 'floor' },
    /* Target tick in full ink — the line that matters most reads darkest. */
    { at: target, ink: 'var(--foreground)', word: 'target' },
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
              <span className="text-[10px] leading-none text-muted-foreground">{m.word}</span>
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
function LedgerLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 py-1">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
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

function FactLedger({ facts }: { facts: { label: string; value: string }[] }) {
  if (facts.length === 0) return null
  return (
    <dl className="flex flex-col">
      {facts.map((f) => (
        <LedgerLine key={f.label} label={f.label} value={f.value} />
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

/** Overflow trigger for a row's secondary action — pairs with one visible
 *  `RowAction primary`. term-breakdown.tsx's own `RowActionMenu` is
 *  module-private, so the anatomy (ghost `icon-sm` trigger, fa-ellipsis,
 *  `DropdownMenuItem asChild` → `Link`) is reproduced verbatim rather than
 *  re-designed — if that component is ever exported, delete this and import
 *  it instead. */
function RowOverflowMenu({ items }: { items: { href: string; label: string; icon: string }[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm" aria-label="More actions" className="text-muted-foreground">
          <i className="fa-light fa-ellipsis text-xs" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>
              <i className={`fa-light ${item.icon}`} aria-hidden="true" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
  /* Node treatment: filled is reserved for the ONE row a card's urgency is
     actually about (amber, per the reserved-warning doctrine elsewhere in
     this file) — every other row is a hollow disc in its own status tint
     (Live=success, Scheduled=planned, Closed=completed, Setup=neutral ink),
     never implied to be "ahead of" or "behind" another. Fill color for the
     attention node uses the tint's mid-tone `.border` swatch rather than
     its darkest `.fg` — a small solid disc in the deep, near-black amber
     `.fg` read as harsh (Romit, 2026-08-25: "use better icon and color,
     since the current ones are too sharp"); the softer mid-tone still
     reads clearly against the ring + icon. Node/icon size bumped 18→20px /
     9→11px the same day ("icons aren't visible to me, therefore its not
     indicative") — every icon here is still decorative reinforcement of a
     visible text label + tint, never the only signal, but a signal too
     small to perceive isn't reinforcing anything. */
  const nodeStyle: React.CSSProperties = attention
    ? {
        background: LIST_HUB_STATUS_TINT_WARNING.border,
        color: 'var(--card)',
        boxShadow: `0 0 0 2px var(--card), 0 0 0 3.5px ${LIST_HUB_STATUS_TINT_WARNING.border}`,
      }
    : {
        background: tint ? tint.bg : 'var(--card)',
        border: `1px solid ${tint ? tint.border : 'var(--border)'}`,
        color: tint ? tint.fg : 'var(--muted-foreground)',
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
          <i className={`${attention ? 'fa-solid' : 'fa-light'} ${icon} text-[11px] leading-none`} aria-hidden="true" />
        </span>
        <RailSegment kind={timeline.connectBottom} className="bottom-0 top-[33px]" />
      </div>
      {/* Hairline separators live on the content column only, so the rail
          crosses the row boundary unbroken. */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 border-t border-border/60 py-2.5 group-first:border-t-0">
        <dl>
          <LedgerLine label={label} value={count} />
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
  external = false,
  onClick,
  children,
}: {
  href?: string
  primary?: boolean
  /** Prism lives outside this app — opens in a new tab. */
  external?: boolean
  onClick?: () => void
  children: React.ReactNode
}) {
  const variant = primary ? 'outline' : 'ghost'
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
  const facts: { label: string; value: string }[] = []
  /* PRD ("UI feedback on Dashboard.docx", Case 6): once every course has at
     least a scheduled evaluation, coverage should read as a settled
     "complete" state, not a bare percentage sitting alongside the still-in-
     flight response-rate figure above it. */
  if (b) facts.push({ label: 'Coverage', value: isFullyCovered(b) ? 'Complete' : `${coveragePercent(b)}%` })
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
                trailing={`target ${RESPONSE_TARGET}%`}
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
                        <RowOverflowMenu
                          items={[
                            { href: workspaceHref('active'), label: 'Extend', icon: 'fa-calendar-pen' },
                          ]}
                        />
                      </>
                    }
                  />
                )}
                {b.live.length > 0 && (
                  <StatementRow
                    label="Live"
                    count={`${b.live.length}`}
                    icon="fa-circle-dot"
                    timeline={rowTimeline('live')}
                    description={liveRowStory(b.live) ?? undefined}
                    trigger={<CourseCodesTip codes={b.live.map((s) => s.courseCode)} atRisk={atRisk} />}
                    actions={
                      <>
                        <LedgerAction href={`/surveys/remind?from=term:${term.id}`} primary>
                          Remind
                        </LedgerAction>
                        <RowOverflowMenu
                          items={[
                            { href: workspaceHref('active'), label: 'Extend', icon: 'fa-calendar-pen' },
                          ]}
                        />
                      </>
                    }
                  />
                )}
                {b.closed.length > 0 && (
                  <StatementRow
                    label="Closed"
                    count={`${b.closed.length} of ${b.totalCourses} (${Math.round((b.closed.length / b.totalCourses) * 100)}%)`}
                    icon="fa-flag-checkered"
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
  const facts: { label: string; value: string }[] = []
  if (b) {
    if (closedRate == null) facts.push({ label: 'Avg response', value: '—' })
    facts.push({ label: 'Coverage', value: `${coveragePercent(b)}%` })
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
                trailing={`target ${RESPONSE_TARGET}%`}
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
                    icon="fa-circle-exclamation"
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
                    icon="fa-flag-checkered"
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

function UpcomingCard({ snap, breakdown }: { snap: TermSnapshot; breakdown: CourseBreakdown | null }) {
  const { term } = snap
  const b = breakdown
  const [datesOpen, setDatesOpen] = useState(false)

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
  const facts: { label: string; value: string }[] = []
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
                  <LedgerAction onClick={() => setDatesOpen(true)} primary>
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
                icon="fa-circle-exclamation"
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
                    <RowOverflowMenu
                      items={[
                        {
                          href: `/course-evaluation/term/${term.id}?tab=active`,
                          label: 'Extend',
                          icon: 'fa-calendar-pen',
                        },
                      ]}
                    />
                  </>
                }
              />
            )}
          </>
        }
      />

      <AddTermDatesDrawer term={term} open={datesOpen} onOpenChange={setDatesOpen} />
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
} & Record<string, unknown>

/** Row population for one history table. `position: 'last'` excludes
 *  `shownLastId` (the one Last-window term already shown as a kanban card —
 *  Vishal, transcript 7a175890: "last should be the first card", singular).
 *  `position: 'future'` is every term 30d+ out that hasn't entered the
 *  Upcoming window yet. */
function termRowsFor(
  terms: ProgramTerm[],
  ce: PceSurvey[],
  positions: Map<string, TermWindowPosition>,
  position: 'past' | 'future',
  shownLastId: string | null,
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
        key: 'startDate',
        label: 'Dates',
        width: 190,
        cell: (row) => (row.startDate && row.endDate ? fmtRange(row.startDate, row.endDate) : 'Not set yet'),
      },
      {
        key: 'offerings',
        label: 'Course offerings',
        width: 130,
        cell: (row) => <span className="tabular-nums">{row.offerings}</span>,
      },
      {
        key: 'coverage',
        label: 'Evaluation coverage',
        width: 160,
        cell: (row) =>
          row.coverage ? (
            <span className="tabular-nums">
              {row.coverage.total > 0 ? Math.round((row.coverage.surveyed / row.coverage.total) * 100) : 0}%
              <span className="text-muted-foreground"> · {row.coverage.surveyed} of {row.coverage.total}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: 'rate',
        label: 'Response rate',
        width: 130,
        cell: (row) => (
          <span className="tabular-nums">{row.rate != null ? `${row.rate}%` : '—'}</span>
        ),
      },
      {
        key: 'actions',
        label: '',
        width: 210,
        /* This table's rows are all one `position` by construction (`past`
           rows are always 'last', `future` rows are always 'future'), so the
           `mode` prop — not `row.position` — decides the verb. Checking
           `mode` here rather than trusting every row's `position` field stays
           correct even if row population ever changes upstream. */
        cell: (row) =>
          mode === 'future' ? (
            <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
              <Link href={`/surveys/push?term=${row.id}`}>Schedule surveys</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="default" size="sm" asChild onClick={(e) => e.stopPropagation()}>
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

  if (rows.length === 0) return null

  return (
    <section className="flex flex-col gap-2" aria-label={label}>
      {/* Plain heading, always visible — no click-to-expand (Romit's catch,
          2026-08-19: the earlier single-trigger-Tabs disclosure hid Past/
          Future terms behind a collapsed toggle by default). Every row that
          exists here is real history/roadmap, not overflow to hide. */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">{label}</h2>
        <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1.5 text-xs font-medium tabular-nums">
          {rows.length}
        </Badge>
      </div>
      <DataTablePaginated<TermRow>
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        /* showQueryControls=false — DataTable's toolbar row defaults to
           min-h-10 regardless of content; with search/filters hidden and no
           toolbarSlot it still reserved that height as dead space between
           the heading and the table (Romit's catch, 2026-08-19, x2: the
           first fix filled the space with a count label, but the count
           already lives on the heading's own Badge — two counts for one
           number was the next thing flagged). showQueryControls collapses
           the bar to its slim min-h-0 variant instead (threaded through as a
           new opt-in prop on DataTable/DataTablePaginated — additive, every
           other table's default behavior is unchanged). */
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
    </section>
  )
}

/** Everything NOT on the kanban, as two separately-headed tables: "Past
 *  terms" (every Last-window term beyond the one shown as a kanban card) and
 *  "Future terms" (every term 30d+ out that hasn't entered the Upcoming
 *  window yet). Previously one merged table under a single "Past terms"
 *  label — split Aug 19 2026 so each population gets its own heading and its
 *  own Actions verb instead of a `row.position` ternary inside one table.
 *  Always visible, no collapse toggle (Romit's second catch, same day) — a
 *  disclosure gate hid real history/roadmap rows by default for no reason
 *  once the tables carry actual data. */
function TermHistorySection({
  ce, terms, positions, shownLastId,
}: {
  ce: PceSurvey[]
  terms: ProgramTerm[]
  positions: Map<string, TermWindowPosition>
  shownLastId: string | null
}) {
  const pastRows = useMemo(
    () => termRowsFor(terms, ce, positions, 'past', shownLastId),
    [terms, ce, positions, shownLastId],
  )
  const futureRows = useMemo(
    () => termRowsFor(terms, ce, positions, 'future', shownLastId),
    [terms, ce, positions, shownLastId],
  )

  return (
    <>
      <TermHistoryTable
        label="Past terms"
        rows={pastRows}
        mode="past"
        emptyTitle="No past terms yet"
        emptyBody="Completed terms will appear here as history."
      />
      <TermHistoryTable
        label="Future terms"
        rows={futureRows}
        mode="future"
        emptyTitle="No future terms yet"
        emptyBody="Terms starting more than 30 days out will appear here until they enter the Upcoming window."
      />
    </>
  )
}

/* ── page ─────────────────────────────────────────────────────────────────── */

function DashboardHomeInner() {
  const { surveys, programTerms, templates } = usePce()
  const [addTermOpen, setAddTermOpen] = useState(false)

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
   * not yet dated/populated still gets its own card, not the empty state. */
  const firstRun = programTerms.length === 0

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
              <Button variant="outline" size="default" onClick={() => setAddTermOpen(true)}>
                Set up term
              </Button>
              <Button variant="default" size="default" asChild>
                <Link href="/surveys/push">Set up Evaluations</Link>
              </Button>
            </div>
          )
        }
      />

      <div className="flex-1 px-7 py-4">
        {firstRun ? (
          <FirstRun onAdd={() => setAddTermOpen(true)} />
        ) : (
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
              <NoActiveTermNotice onAdd={() => setAddTermOpen(true)} />
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
                      <UpcomingCard key={s.term.id} snap={s} breakdown={breakdownForSnap(s)} />
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
                        <UpcomingCard key={s.term.id} snap={s} breakdown={breakdownForSnap(s)} />
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
        )}
      </div>

      <AddTermDrawer open={addTermOpen} onOpenChange={setAddTermOpen} />
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

function FirstRun({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex min-h-[min(420px,60vh)] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/25 px-6">
      <i className="fa-light fa-calendar-plus text-3xl text-muted-foreground" aria-hidden="true" />
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-sm font-medium text-foreground">No term set up yet</h2>
        <p className="text-sm text-muted-foreground" style={{ maxWidth: 340, textAlign: 'center' }}>
          Configure a term calendar to discover its course offerings and start
          driving evaluation response rates.
        </p>
      </div>
      <Button variant="default" size="sm" onClick={onAdd}>
        Set up term
      </Button>
    </div>
  )
}
