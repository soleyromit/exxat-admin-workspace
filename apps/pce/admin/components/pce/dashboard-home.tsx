'use client'

// ============================================================================
// Course Evaluation — Dashboard home, v8 (Aug 19 2026).
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
  StatusBadge,
  Card, CardContent, CardFooter, CardHeader, CardTitle,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Tip,
} from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { AddTermDrawer, AddTermDatesDrawer } from '@/components/pce/add-term-drawer'

import { ResponseProgressCell } from '@/components/pce/response-gauge'
import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'
import {
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_PLANNED,
} from '@/lib/list-status-badges'
import { auditTerm } from '@/lib/pce-term-readiness'
import { prismCoursesHref } from '@/lib/pce-course-readiness'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'
import { BreakdownRow, RowAction } from '@/components/pce/term-breakdown'
import {
  RESPONSE_TARGET,
  classifyTermWindow, snapshot, evalWindow, parseDate, breakdownFor, coveragePercent,
  coverageLead, coverageCodes, scheduledLead, scheduledCountdown, liveLead, liveCountdown,
  liveAtRiskCodes, weightedRate,
  type TermSnapshot, type TermWindowPosition, type CourseBreakdown,
} from '@/lib/pce-term-metrics'
import type { PceSurvey, ProgramTerm } from '@/lib/pce-mock-data'

/* ── shared bits ──────────────────────────────────────────────────────────── */

/** The three window positions that render a kanban card — 'future' terms
 * (starting 30+ days out) never get a badge, they only surface in the
 * history tables below until they enter the Upcoming window. */
type TermPosition = Exclude<TermWindowPosition, 'future'>

const POSITION_BADGE: Record<TermPosition, { label: string; tone: StatusBadgeTone }> = {
  current:  { label: 'Current',   tone: 'success' },
  last:     { label: 'Last term', tone: 'neutral' },
  upcoming: { label: 'Upcoming',  tone: 'info' },
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

/* ── the recommendation model ──────────────────────────────────────────────
   Ported from the reviewed compare variant (variant-d-ai-forward.tsx). A
   `Rec` is never authored — it is assembled from a real condition that is
   already true in the data by plain `if` logic (no model, no inference).
   `short` is the same fact compressed to one clause so a demoted candidate
   can appear as the "Then" line without rewording. */

interface RecAction {
  label: string
  href?: string
  /** Prism lives outside this app — opens in a new tab, like production's
   *  "Add courses" CTA does. */
  external?: boolean
  onClick?: () => void
}

interface Rec {
  /** The instruction. Verb-first where there is a verb to give. */
  headline: string
  /** Rendered as "Based on {basis}" — the show-your-work line. Always the real
   *  inputs the condition was evaluated against, never a confidence adjective.
   *  The headline is only auditable because this line names the numbers it
   *  came from. */
  basis: string
  /** One clause, for the "Then" line when this candidate is second. */
  short: string
  action?: RecAction
  /** Actionable + time-bound → the callout takes the reserved warning tint.
   *  Calm recommendations stay on the plain card surface so the tint keeps
   *  meaning. */
  emphasis?: boolean
}

/** The card's single prioritized headline. NOT an AI surface — no sparkle, no
 *  brand tint, no "insight" wording; it is threshold logic and says so. The
 *  label states which of three honest registers this callout is in:
 *    "Needs attention" — a time-bound condition is genuinely wrong,
 *    "Recommended"     — there is useful work, nothing is at risk,
 *    "Status"          — nothing to do; the card refuses to invent a task.
 *  Tint comes from `LIST_HUB_STATUS_TINT_WARNING`, the same reserved status
 *  family `BreakdownRow` uses for its urgent wash — this card's ONE warning
 *  surface, which is why the rows below never take theirs. */
function PriorityCallout({ recs, termName }: { recs: Rec[]; termName: string }) {
  const primary = recs[0]
  const next = recs[1]
  if (!primary) return null
  const label = primary.emphasis ? 'Needs attention' : primary.action ? 'Recommended' : 'Status'
  const tinted = !!primary.emphasis
  return (
    <Card
      role="region"
      aria-label={`${label} — ${termName}`}
      className="shadow-none"
      style={
        tinted
          ? {
              background: LIST_HUB_STATUS_TINT_WARNING.bg,
              borderColor: LIST_HUB_STATUS_TINT_WARNING.border,
            }
          : undefined
      }
    >
      <CardContent className="p-4">
        <p
          className="mb-2 flex items-center gap-1.5 text-xs font-medium"
          style={{ color: tinted ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--muted-foreground)' }}
        >
          {tinted && <i className="fa-light fa-triangle-exclamation" aria-hidden="true" />}
          {label}
        </p>

        <div className="mb-2 flex flex-col gap-2">
          <p className="text-sm text-foreground">{primary.headline}</p>
          {next && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Then</span> · {next.short}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">Based on {primary.basis}</p>

        {primary.action && (
          <div className="mt-3 flex flex-wrap gap-2">
            <RecActionButton action={primary.action} termName={termName} emphasis={tinted} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Text-only DS Button — no icon on an action CTA (feedback_no_icons_action_buttons).
 *  `default` only for an emphasised (actionable + time-bound) recommendation so
 *  three filled buttons never shout across the triptych at once. */
function RecActionButton({
  action,
  termName,
  emphasis,
}: {
  action: RecAction
  termName: string
  emphasis: boolean
}) {
  const variant = emphasis ? 'default' : 'outline'
  if (action.onClick) {
    return (
      <Button variant={variant} size="sm" onClick={action.onClick}>
        {action.label}
      </Button>
    )
  }
  if (action.external && action.href) {
    return (
      <Button variant={variant} size="sm" asChild>
        <a href={action.href} target="_blank" rel="noopener noreferrer">
          {action.label}
        </a>
      </Button>
    )
  }
  return (
    <Button variant={variant} size="sm" asChild>
      <Link href={action.href ?? '#'} aria-label={`${action.label} for ${termName}`}>
        {action.label}
      </Link>
    </Button>
  )
}

/* ── pulled-data lane (facts + their own per-row actions) ──────────────────── */

function DataLaneLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-muted-foreground">{children}</p>
}

/** Small labelled figure. Deliberately compact — in this design the numbers
 *  are the evidence, not the headline. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums leading-none text-foreground">{value}</dd>
    </div>
  )
}

function FactStrip({ facts }: { facts: { label: string; value: string }[] }) {
  if (facts.length === 0) return null
  return (
    <dl className="grid grid-cols-3 gap-3">
      {facts.map((f) => (
        <Fact key={f.label} label={f.label} value={f.value} />
      ))}
    </dl>
  )
}

/** Course codes behind a bucket count — names them rather than leaving "3
 *  courses" unidentifiable. Overflow collapses into one Tip-disclosed chip so
 *  an 11-course bucket stays exactly as tall as a 1-course one. */
function Chips({
  codes,
  atRisk,
  max = 3,
}: {
  codes: string[]
  atRisk?: Set<string>
  max?: number
}) {
  if (codes.length === 0) return null
  const shown = codes.slice(0, max)
  const hidden = codes.slice(max)
  return (
    <span className="flex flex-wrap items-center gap-1">
      {shown.map((code) => (
        <Badge
          key={code}
          variant="outline"
          className="rounded-full px-2 py-0 text-xs font-medium"
          style={
            atRisk?.has(code)
              ? {
                  color: LIST_HUB_STATUS_TINT_WARNING.fg,
                  background: LIST_HUB_STATUS_TINT_WARNING.bg,
                  borderColor: LIST_HUB_STATUS_TINT_WARNING.border,
                }
              : undefined
          }
        >
          {code}
        </Badge>
      ))}
      {hidden.length > 0 && (
        <Tip label={hidden.join(', ')} side="top">
          <span tabIndex={0} className="inline-flex outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Badge
              variant="outline"
              className="cursor-default rounded-full border-dashed px-2 py-0 text-xs font-medium"
              style={{ color: 'var(--primary)' }}
            >
              +{hidden.length} more
            </Badge>
          </span>
        </Tip>
      )}
    </span>
  )
}

/** Date fact as its own small chip. Mirrors `RowCountdown` in
 *  term-breakdown.tsx (module-private there) so a countdown reads
 *  identically on both surfaces. */
function CountdownChip({ label, urgent = false }: { label: string; urgent?: boolean }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium tabular-nums"
      style={{ color: urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--muted-foreground)' }}
    >
      <i className="fa-light fa-clock" aria-hidden="true" />
      {label}
    </span>
  )
}

/** `BreakdownRow.meta` payload — course chips plus an optional countdown. */
function RowMeta({
  codes,
  atRisk,
  countdown,
  countdownUrgent,
}: {
  codes: string[]
  atRisk?: Set<string>
  countdown?: string | null
  countdownUrgent?: boolean
}) {
  if (codes.length === 0 && !countdown) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chips codes={codes} atRisk={atRisk} />
      {countdown && <CountdownChip label={countdown} urgent={countdownUrgent} />}
    </div>
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
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="More actions"
          className="size-5 shrink-0 text-muted-foreground"
        >
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

/** Wrapper for a run of `BreakdownRow`s — the rows draw their own hairlines. */
function Ledger({ rows }: { rows: React.ReactNode }) {
  return <div className="flex flex-col">{rows}</div>
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
  const badge = POSITION_BADGE[position]
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <CardTitle className="min-w-0 truncate text-base font-semibold">
            <Link
              href={`/course-evaluation/term/${term.id}`}
              aria-label={`Open ${term.name} workspace`}
              className="rounded-sm text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {term.name}
            </Link>
          </CardTitle>
          <StatusBadge label={badge.label} tone={badge.tone} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          AY {term.academicYear.replace(/–20(\d\d)$/, '–$1')}
          {metaTrailing ? ` · ${metaTrailing}` : ''}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
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

/** The hairline that separates the prioritized headline from the pulled data
 *  it was computed from. */
function LaneDivider({ label }: { label: string }) {
  return (
    <div className="mt-1 flex items-center gap-2 border-t border-border pt-3">
      <DataLaneLabel>{label}</DataLaneLabel>
    </div>
  )
}

/* ── shared candidate builders ────────────────────────────────────────────── */

/** The two empty states every column shares, expressed as recommendations.
 *  Returns [] when neither applies. */
function emptyStateRecs(snap: TermSnapshot): Rec[] {
  const offerings = snap.coverage?.total ?? 0
  if (offerings === 0) {
    return [
      {
        headline:
          'No course offerings have synced for this term yet. Add them in Prism before evaluations can be scheduled.',
        basis: `0 offerings found for ${snap.term.name}`,
        short: 'No course offerings found.',
        action: { label: 'Add courses', href: prismCoursesHref(), external: true },
        emphasis: true,
      },
    ]
  }
  if (snap.total === 0) {
    return [
      {
        headline: `${plural(offerings, 'course')} ${offerings === 1 ? 'is' : 'are'} ready to be evaluated. Schedule evaluations to start collecting responses.`,
        basis: `${plural(offerings, 'offering')} · 0 evaluations created`,
        short: `${plural(offerings, 'course')} still ${offerings === 1 ? 'has' : 'have'} no evaluation.`,
        action: { label: 'Schedule evaluations', href: `/surveys/push?term=${snap.term.id}` },
        emphasis: true,
      },
    ]
  }
  return []
}

const calmRec = (headline: string, basis: string, short: string): Rec => ({
  headline,
  basis,
  short,
  emphasis: false,
})

/* ── CURRENT TERM — active monitoring, the hero ───────────────────────────── */

function currentRecs(
  snap: TermSnapshot,
  b: CourseBreakdown | null,
  noTemplates: boolean,
): Rec[] {
  const { term } = snap
  if (noTemplates) {
    return [
      {
        headline:
          'No survey template exists yet, so nothing can go out. Create one to unblock every course in this term.',
        basis: `0 templates · ${plural(snap.coverage?.total ?? 0, 'course')} waiting`,
        short: 'No survey template exists yet.',
        action: { label: 'Create template', href: '/templates/new' },
        emphasis: true,
      },
    ]
  }
  const empty = emptyStateRecs(snap)
  if (empty.length > 0) return empty
  if (!b) return [calmRec('Nothing needs attention right now.', 'this term’s evaluation records', 'Nothing outstanding.')]

  const recs: Rec[] = []
  const atRisk = liveAtRiskCodes(b.live)
  const liveRate = weightedRate(b.live)
  const closing = liveCountdown(b.live)
  const setupCount = b.notConfiguredCount + b.draft.length
  const cov = coveragePercent(b)

  /* 1 — live courses behind the at-risk floor. This IS the recommendation:
         `liveAtRiskCodes` being non-empty is a real, computed condition. */
  if (atRisk.size > 0) {
    recs.push({
      headline: `${atRisk.size} of ${plural(b.live.length, 'live course')} ${atRisk.size === 1 ? 'is' : 'are'} behind pace. Send a reminder before ${b.live.length === 1 ? 'it closes' : 'they close'}.`,
      basis: [
        `${plural(b.live.length, 'live evaluation')}`,
        /* Qualified deliberately: this is the LIVE-only weighted rate, which
           is a different number from the term-wide `snap.rate` printed in the
           data lane below (that one includes closed courses). */
        liveRate != null ? `${liveRate}% average across live courses` : null,
        `${AT_RISK_THRESHOLD}% at-risk floor`,
        closing ? closing.toLowerCase() : null,
      ]
        .filter(Boolean)
        .join(' · '),
      short: `${atRisk.size} behind pace: ${[...atRisk].join(', ')}.`,
      action: { label: 'Send reminders', href: `/surveys/remind?from=term:${term.id}` },
      emphasis: true,
    })
  } else if (b.live.length > 0 && snap.rate != null && snap.rate < RESPONSE_TARGET) {
    /* 2 — nothing individually at risk, but the term average is short of the
           product's #1 goal metric. A reminder is still the fastest lift. */
    recs.push({
      headline: `Response rate is ${snap.rate}%, ${RESPONSE_TARGET - snap.rate} points short of the ${RESPONSE_TARGET}% target. A reminder across live courses is the fastest lift.`,
      basis: [
        `${plural(b.live.length, 'live evaluation')}`,
        `${RESPONSE_TARGET}% target`,
        closing ? closing.toLowerCase() : null,
      ]
        .filter(Boolean)
        .join(' · '),
      short: `Average is ${snap.rate}%, below the ${RESPONSE_TARGET}% target.`,
      action: { label: 'Send reminders', href: `/surveys/remind?from=term:${term.id}` },
      emphasis: true,
    })
  }

  /* 3 — the window is open and courses still have no evaluation. */
  if (setupCount > 0) {
    recs.push({
      headline: `${plural(setupCount, 'course')} still need${setupCount === 1 ? 's' : ''} an evaluation set up while the window is open.`,
      basis: `${cov}% coverage · ${plural(b.totalCourses, 'course')} in term`,
      short: `${plural(setupCount, 'course')} still need${setupCount === 1 ? 's' : ''} setup.`,
      action: { label: 'Set up evaluations', href: `/surveys/push?term=${term.id}` },
      emphasis: true,
    })
  }

  /* 4 — collection has finished somewhere; results are waiting to be read. */
  if (b.closed.length > 0) {
    recs.push({
      headline: `Collection has finished for ${plural(b.closed.length, 'course')}. Review the feedback while the term is still fresh.`,
      basis: `${b.closed.length} of ${plural(b.totalCourses, 'course')} closed`,
      short: `${plural(b.closed.length, 'course')} finished collecting.`,
      action: { label: 'Review feedback', href: `/course-evaluation/term/${term.id}?tab=finished` },
      emphasis: false,
    })
  }

  if (recs.length > 0) return recs

  /* Honest calm state — do not manufacture an insight to fill the lane. */
  return [
    calmRec(
      snap.rate != null
        ? `Collection is on track. Nothing needs attention right now.`
        : 'Nothing needs attention right now.',
      [
        `${plural(b.live.length, 'live evaluation')}`,
        snap.rate != null ? `${snap.rate}% average, at or above the ${RESPONSE_TARGET}% target` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      'Nothing outstanding.',
    ),
  ]
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
  const recs = currentRecs(snap, b, noTemplates)
  const win = evalWindow(term)
  const atRisk = b ? liveAtRiskCodes(b.live) : new Set<string>()
  const setupCount = b ? b.notConfiguredCount + b.draft.length : 0
  const workspaceHref = (tab: 'active' | 'finished') =>
    `/course-evaluation/term/${term.id}?tab=${tab}`

  const facts: { label: string; value: string }[] = []
  if (snap.rate != null) facts.push({ label: 'Avg response', value: `${snap.rate}%` })
  if (b) facts.push({ label: 'Coverage', value: `${coveragePercent(b)}%` })
  if (snap.daysLeft != null) facts.push({ label: 'Window closes in', value: plural(snap.daysLeft, 'day') })

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
      <PriorityCallout recs={recs} termName={term.name} />

      {b && (
        <>
          <LaneDivider label="Term data" />
          <FactStrip facts={facts} />
          {snap.rate != null && (
            <div className="flex flex-col gap-1">
              <ResponseProgressCell
                rate={snap.rate}
                responseCount={0}
                enrollmentCount={0}
                target={RESPONSE_TARGET}
                detail="none"
                className="w-full max-w-none"
              />
              <span className="sr-only">
                {snap.rate < RESPONSE_TARGET
                  ? `Average response rate ${snap.rate} percent, below the ${RESPONSE_TARGET} percent target`
                  : `Average response rate ${snap.rate} percent, at or above the ${RESPONSE_TARGET} percent target`}
              </span>
            </div>
          )}
          {/* Every bucket keeps its own verb — Set up / Manage / Remind /
              Review feedback — so an admin can act on a specific bucket
              regardless of which one the callout above happens to name. */}
          <Ledger
            rows={
              <>
                {setupCount > 0 && (
                  <BreakdownRow
                    icon="fa-list-check"
                    tint={null}
                    title={coverageLead(b.notConfiguredCount, b.draft.length) ?? ''}
                    meta={<RowMeta codes={coverageCodes(b.notConfiguredCodes, b.draft)} />}
                    actions={
                      <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">
                        {setupCount === 1 ? 'Set up evaluation' : 'Set up evaluations'}
                      </RowAction>
                    }
                  />
                )}
                {b.scheduled.length > 0 && (
                  <BreakdownRow
                    icon="fa-calendar"
                    tint={LIST_HUB_STATUS_TINT_PLANNED}
                    title={scheduledLead(b.scheduled) ?? ''}
                    meta={
                      <RowMeta
                        codes={b.scheduled.map((s) => s.courseCode)}
                        countdown={scheduledCountdown(b.scheduled)}
                      />
                    }
                    actions={
                      <>
                        <RowAction href={workspaceHref('active')} primary icon="fa-pen-ruler">
                          Manage
                        </RowAction>
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
                  <BreakdownRow
                    icon="fa-circle-dot"
                    tint={LIST_HUB_STATUS_TINT_SUCCESS}
                    title={liveLead(b.live) ?? ''}
                    meta={
                      <RowMeta
                        codes={b.live.map((s) => s.courseCode)}
                        atRisk={atRisk}
                        countdown={liveCountdown(b.live)}
                        countdownUrgent={atRisk.size > 0}
                      />
                    }
                    actions={
                      <>
                        <RowAction href={`/surveys/remind?from=term:${term.id}`} primary icon="fa-bell">
                          Remind
                        </RowAction>
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
                  <BreakdownRow
                    icon="fa-flag-checkered"
                    tint={LIST_HUB_STATUS_TINT_WARNING}
                    title={`${b.closed.length} of ${b.totalCourses} closed`}
                    meta={<RowMeta codes={b.closed.map((s) => s.courseCode)} />}
                    actions={
                      <RowAction href={workspaceHref('finished')} primary icon="fa-share-from-square">
                        Review feedback
                      </RowAction>
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

function lastRecs(snap: TermSnapshot, b: CourseBreakdown | null): Rec[] {
  const { term } = snap
  const empty = emptyStateRecs(snap)
  if (empty.length > 0) return empty
  if (!b) return [calmRec('Nothing left to chase for this term.', 'this term’s evaluation records', 'Nothing outstanding.')]

  const recs: Rec[] = []
  const stragglers = b.notConfiguredCount + b.draft.length + b.scheduled.length

  /* The ONLY genuinely wrong state for a finished term: courses that ended
     without ever collecting. A healthy closed term (everything collected,
     nothing outstanding) gets NO callout at all — the "closed at X%, review
     results" and "nothing left to chase" recs used to render here too, but
     both were pure restatement: the footer's own "View analytics" link
     already goes to the exact same destination, and Term data below already
     shows the same closed-count/response-rate numbers. A card-sized callout
     that says nothing the rest of the card doesn't is exactly the "hypothetical
     use case" clutter Romit flagged (2026-08-20: "remove this card" — the
     healthy Fall 2025 card was showing "Recommended: review results" for a
     term with zero real issues). `PriorityCallout` already renders nothing
     when `recs` is empty, so simply not pushing a rec here is the fix. */
  if (stragglers > 0) {
    const codes = [
      ...b.notConfiguredCodes,
      ...b.draft.map((s) => s.courseCode),
      ...b.scheduled.map((s) => s.courseCode),
    ].sort()
    recs.push({
      headline: `The term ended with ${plural(stragglers, 'course')} that never collected. Close ${stragglers === 1 ? 'it' : 'them'} out or drop ${stragglers === 1 ? 'it' : 'them'} from the cycle.`,
      basis: `ended ${fmtDate(term.endDate)} · ${stragglers} of ${plural(b.totalCourses, 'course')} unresolved · ${codes.join(', ')}`,
      short: `${plural(stragglers, 'course')} never collected.`,
      action: { label: 'Open term workspace', href: `/course-evaluation/term/${term.id}?tab=active` },
      emphasis: true,
    })
  }

  return recs
}

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
  const recs = lastRecs(snap, b)
  const closedRate = b ? weightedRate(b.closed) : null
  const setupCount = b ? b.notConfiguredCount + b.draft.length : 0
  const workspaceHref = (tab: 'active' | 'finished') =>
    `/course-evaluation/term/${term.id}?tab=${tab}`

  const facts: { label: string; value: string }[] = []
  if (b) {
    facts.push({ label: 'Avg response', value: closedRate != null ? `${closedRate}%` : '—' })
    facts.push({ label: 'Coverage', value: `${coveragePercent(b)}%` })
    facts.push({ label: 'Closed', value: `${b.closed.length} of ${b.totalCourses}` })
  }

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
      <PriorityCallout recs={recs} termName={term.name} />

      {b && (
        <>
          <LaneDivider label="Term data" />
          <FactStrip facts={facts} />
          <Ledger
            rows={
              <>
                {/* Setup/draft/scheduled stragglers are NOT their own rows here
                    (unlike Current/Upcoming) — the term already ended, so
                    "need setup" + a "Manage" action would imply ongoing
                    configurability that doesn't exist for a closed window.
                    The PriorityCallout above already names this exact
                    population with closure-appropriate language ("the term
                    ended with N courses that never collected — close them out
                    or drop them") and a read-only "Open term workspace"
                    action. Repeating it here as an actionable bucket both
                    duplicated the callout AND contradicted it (Romit's catch,
                    2026-08-19: "since the term is done why would there be a
                    warning and again need a setup?"). */}
                {b.live.length > 0 && (
                  <BreakdownRow
                    icon="fa-circle-dot"
                    tint={LIST_HUB_STATUS_TINT_SUCCESS}
                    title={liveLead(b.live) ?? ''}
                    meta={
                      <RowMeta
                        codes={b.live.map((s) => s.courseCode)}
                        countdown={liveCountdown(b.live)}
                      />
                    }
                    actions={
                      <>
                        <RowAction href={`/surveys/remind?from=term:${term.id}`} primary icon="fa-bell">
                          Remind
                        </RowAction>
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
                  <BreakdownRow
                    icon="fa-flag-checkered"
                    tint={LIST_HUB_STATUS_TINT_SUCCESS}
                    title={`${b.closed.length} of ${b.totalCourses} closed`}
                    meta={<RowMeta codes={b.closed.map((s) => s.courseCode)} />}
                    actions={
                      <RowAction href={workspaceHref('finished')} primary icon="fa-share-from-square">
                        Review feedback
                      </RowAction>
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

  const recs: Rec[] = useMemo(() => {
    if (!dated) {
      return [
        {
          headline: 'This term has no dates yet, so no evaluation window can open. Add start and end dates to unblock scheduling.',
          basis: `${plural(readiness.total, 'course offering')} · no term dates set`,
          short: 'Term dates are not set.',
          action: { label: 'Add term dates', onClick: () => setDatesOpen(true) },
          emphasis: true,
        },
      ]
    }
    const empty = emptyStateRecs(snap)
    if (empty.length > 0) return empty

    const out: Rec[] = []

    /* 1 — rosters missing. Evaluations physically cannot be delivered without
           faculty/student data, so this outranks coverage. */
    if (readiness.needsData > 0) {
      out.push({
        headline: `${plural(readiness.needsData, 'course')} ${readiness.needsData === 1 ? 'is' : 'are'} missing faculty or student rosters. Fill those in before the term starts${startsIn != null ? ` in ${plural(startsIn, 'day')}` : ''}.`,
        basis: `${plural(readiness.total, 'offering')} audited · ${readiness.needsData} with gaps`,
        short: `${plural(readiness.needsData, 'course')} missing roster data.`,
        action: { label: 'Add missing info', href: '/course-evaluation/term-setup?phase=readiness' },
        emphasis: startsIn != null && startsIn <= 14,
      })
    }

    /* 2 — imminent start with low coverage. */
    if (setupUrgent && setupCount > 0) {
      out.push({
        headline: `The term starts in ${plural(startsIn!, 'day')} with only ${cov}% coverage. Set up the remaining ${plural(setupCount, 'evaluation')} now.`,
        basis: `${cov}% coverage · starts ${fmtDate(term.startDate)}`,
        short: `Only ${cov}% covered with ${plural(startsIn!, 'day')} to go.`,
        action: { label: 'Set up evaluations', href: `/surveys/push?term=${term.id}` },
        emphasis: true,
      })
    } else if (setupCount > 0) {
      /* 3 — work remains, but nothing is time-pressured yet. Say so plainly
             rather than dressing prep work up as urgency. */
      out.push({
        headline: `${plural(setupCount, 'course')} still need${setupCount === 1 ? 's' : ''} an evaluation. Nothing is blocking — set ${setupCount === 1 ? 'it' : 'them'} up any time before ${win.open}.`,
        basis: `${cov}% coverage${startsIn != null ? ` · starts in ${plural(startsIn, 'day')}` : ''}`,
        short: `${plural(setupCount, 'course')} still need${setupCount === 1 ? 's' : ''} setup.`,
        action: { label: 'Set up evaluations', href: `/surveys/push?term=${term.id}` },
        emphasis: false,
      })
    }

    /* 4 — advance work already done: everything scheduled ahead of the term. */
    if (b && setupCount === 0 && b.scheduled.length > 0) {
      const countdown = scheduledCountdown(b.scheduled)
      out.push({
        headline: `Ready. All ${plural(b.totalCourses, 'course')} ${b.totalCourses === 1 ? 'has' : 'have'} an evaluation scheduled${countdown ? `, ${countdown.toLowerCase()}` : ''}.`,
        basis: `${cov}% coverage · ${plural(b.scheduled.length, 'evaluation')} scheduled ahead of the term`,
        short: 'Every course is already scheduled.',
        emphasis: false,
      })
    }

    if (out.length > 0) return out
    return [
      calmRec(
        'Nothing needs attention right now.',
        `${plural(readiness.total, 'course offering')}${startsIn != null ? ` · starts in ${plural(startsIn, 'day')}` : ''}`,
        'Nothing outstanding.',
      ),
    ]
  }, [b, cov, dated, readiness.needsData, readiness.total, setupCount, setupUrgent, snap, startsIn, term.id, term.startDate, win.open])

  const facts: { label: string; value: string }[] = []
  if (cov != null) facts.push({ label: 'Coverage', value: `${cov}%` })
  facts.push({ label: 'Course offerings', value: `${snap.coverage?.total ?? readiness.total}` })
  facts.push({ label: 'Starts in', value: startsIn != null ? plural(startsIn, 'day') : 'Not set yet' })

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
      <PriorityCallout recs={recs} termName={term.name} />

      <LaneDivider label="Readiness data" />
      <FactStrip facts={facts} />
      <Ledger
        rows={
          <>
            {readiness.needsData > 0 && (
              <BreakdownRow
                icon="fa-triangle-exclamation"
                tint={LIST_HUB_STATUS_TINT_WARNING}
                title={`${plural(readiness.needsData, 'course')} missing roster data`}
                meta={
                  <RowMeta
                    codes={readiness.offerings
                      .filter((o) => o.gaps.length > 0)
                      .map((o) => o.courseCode)}
                  />
                }
                actions={
                  <RowAction
                    href="/course-evaluation/term-setup?phase=readiness"
                    primary
                    icon="fa-circle-plus"
                  >
                    Add missing info
                  </RowAction>
                }
              />
            )}
            {b && setupCount > 0 && (
              <BreakdownRow
                icon="fa-list-check"
                tint={null}
                title={coverageLead(b.notConfiguredCount, b.draft.length) ?? ''}
                meta={<RowMeta codes={coverageCodes(b.notConfiguredCodes, b.draft)} />}
                actions={
                  <RowAction href={`/surveys/push?term=${term.id}`} primary icon="fa-plus">
                    {setupCount === 1 ? 'Set up evaluation' : 'Set up evaluations'}
                  </RowAction>
                }
              />
            )}
            {b && b.scheduled.length > 0 && (
              <BreakdownRow
                icon="fa-calendar"
                tint={LIST_HUB_STATUS_TINT_PLANNED}
                title={scheduledLead(b.scheduled) ?? ''}
                meta={
                  <RowMeta
                    codes={b.scheduled.map((s) => s.courseCode)}
                    countdown={scheduledCountdown(b.scheduled)}
                  />
                }
                actions={
                  <>
                    <RowAction
                      href={`/course-evaluation/term/${term.id}?tab=active`}
                      primary
                      icon="fa-pen-ruler"
                    >
                      Manage
                    </RowAction>
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
  today: string,
  position: 'last' | 'future',
  shownLastId: string | null,
): TermRow[] {
  return [...terms]
    .reverse()
    .filter((t) => {
      const pos = classifyTermWindow(t, today)
      return position === 'last' ? pos === 'last' && t.id !== shownLastId : pos === 'future'
    })
    .map((t) => {
      const snap = snapshot(t, ce)
      return {
        id: t.id,
        name: t.name,
        position: classifyTermWindow(t, today),
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
  ce, today, terms, shownLastId,
}: {
  ce: PceSurvey[]
  today: string
  terms: ProgramTerm[]
  shownLastId: string | null
}) {
  const pastRows = useMemo(
    () => termRowsFor(terms, ce, today, 'last', shownLastId),
    [terms, ce, today, shownLastId],
  )
  const futureRows = useMemo(
    () => termRowsFor(terms, ce, today, 'future', shownLastId),
    [terms, ce, today, shownLastId],
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

  /* Any of Current/Last/Upcoming can now hold more than one term (Aug 19 2026
   * feedback) — no more picking a single "the" current term. Terms starting
   * 30+ days out ('future') deliberately aren't in any of these three; they
   * live in the history table below until they enter the Upcoming window. */
  const currentTerms = useMemo(
    () => ordered.filter((t) => classifyTermWindow(t, today) === 'current'),
    [ordered, today],
  )
  /* Last is capped to ONE card (Vishal, transcript 7a175890: "last should be
   * the first card" — singular, unlike Current/Upcoming which can genuinely
   * have several concurrent programs). Every other Last-window term falls
   * into the history table via TermHistorySection's `shownLastId` exclusion
   * instead of stacking a second card here. */
  const lastCandidates = useMemo(
    () => ordered.filter((t) => classifyTermWindow(t, today) === 'last'),
    [ordered, today],
  )
  const lastTerms = useMemo(() => {
    const mostRecent = [...lastCandidates].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
    return mostRecent ? [mostRecent] : []
  }, [lastCandidates])
  const upcomingTerms = useMemo(
    () => ordered.filter((t) => classifyTermWindow(t, today) === 'upcoming'),
    [ordered, today],
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

            {/* ── Term history — Past terms + Future terms, separately headed ── */}
            <TermHistorySection
              ce={ce}
              today={today}
              terms={ordered}
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
