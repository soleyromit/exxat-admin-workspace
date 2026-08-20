'use client'

// ============================================================================
// COMPARE VARIANT D — "priority-first" term-card triptych (throwaway; lives
// beside the other /compare/* explorations until a direction is picked).
//
// THESIS
// Production's cards lead with computed facts (a response-rate bar, a coverage
// %, then status-bucket rows each carrying their own action). This variant
// adds ONE thing above them: a single prioritized "most important thing on this
// card" callout, so the card answers "what should I do first" before it answers
// "what are the numbers". The facts and their per-row actions stay exactly as
// operable as production's.
//
// NOT AI — AND IT NO LONGER CLAIMS TO BE (review correction, Aug 19).
// The first cut of this file rendered the callout through `AiInsightCard` with
// the fa-sparkles + `var(--brand-color)` affordance and the literal label
// "AI insight". Nothing in this file calls a model. The callout is plain
// deterministic threshold logic over helpers that already existed in
// `pce-term-metrics.ts` (`liveAtRiskCodes`, `coveragePercent`,
// `RESPONSE_TARGET`, `AT_RISK_THRESHOLD`, `auditTerm`) — an ordered candidate
// list of real conditions, top one promoted to the headline, second demoted to
// a muted "Then" line. Branding that as AI told the reader a model had looked
// at their term when nothing had. It now renders as a plain callout labelled
// for what it is ("Needs attention" / "Recommended" / "Status"), tinted with
// the app's own reserved `LIST_HUB_STATUS_TINT_WARNING` status family rather
// than an AI/brand tint. The "Based on …" citation line is KEPT — showing the
// inputs a conclusion was computed from is honest regardless of what computed
// it, and it is the only thing that makes the headline auditable.
//
// EVERY BUCKET ROW STAYS OPERABLE (review correction, Aug 19).
// The first cut also stripped per-row actions ("the AI lane owns every verb").
// That read as unfinished, not minimal: an admin needs to Remind one specific
// live bucket, Extend one specific scheduled bucket, set up one specific draft
// bucket, or review one specific closed bucket independently of whatever the
// headline happens to point at. Rows are now the real production
// `BreakdownRow` + `RowAction` from `components/pce/term-breakdown.tsx` — same
// DS `Button variant="ghost" size="sm"` with the same icon vocabulary — so the
// variant differs from production in HIERARCHY only, which is the thing
// actually being compared.
//   - The response-rate bar is kept (it is the product's #1 goal metric per
//     Vishal, transcript 7a175890) but sits under the callout, as evidence.
//   - Rows deliberately do NOT take `BreakdownRow`'s `urgent` wash here: the
//     callout above already carries this card's one warning tint, and two
//     stacked washes would flatten the hierarchy this variant exists to test.
//   - No red anywhere (aarti_no_red): at-risk / behind-pace states use the
//     reserved `LIST_HUB_STATUS_TINT_WARNING` amber family, same as production.
// ============================================================================

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  StatusBadge,
  Tip,
} from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { BreakdownRow, RowAction } from '@/components/pce/term-breakdown'
import { AddTermDatesDrawer } from '@/components/pce/add-term-drawer'
import { ResponseProgressCell } from '@/components/pce/response-gauge'
import {
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
  LIST_HUB_STATUS_TINT_PLANNED,
} from '@/lib/list-status-badges'
import { auditTerm } from '@/lib/pce-term-readiness'
import { prismCoursesHref } from '@/lib/pce-course-readiness'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'
import {
  RESPONSE_TARGET,
  classifyTermWindow,
  snapshot,
  breakdownFor,
  evalWindow,
  parseDate,
  coveragePercent,
  coverageLead,
  coverageCodes,
  scheduledLead,
  scheduledCountdown,
  liveLead,
  liveCountdown,
  liveAtRiskCodes,
  weightedRate,
  type TermSnapshot,
  type CourseBreakdown,
  type TermWindowPosition,
} from '@/lib/pce-term-metrics'
import type { ProgramTerm } from '@/lib/pce-mock-data'

/* ── shared vocabulary (mirrors dashboard-home.tsx so the triptych reads the
      same at a glance — only the card INTERIOR is the variant) ────────────── */

type TermPosition = Exclude<TermWindowPosition, 'future'>

const POSITION_BADGE: Record<TermPosition, { label: string; tone: StatusBadgeTone }> = {
  current: { label: 'Current', tone: 'success' },
  last: { label: 'Last term', tone: 'neutral' },
  upcoming: { label: 'Upcoming', tone: 'info' },
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const fmtDate = (d: string) =>
  parseDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const fmtRange = (a: string, b: string) => {
  const sameYear = parseDate(a).getFullYear() === parseDate(b).getFullYear()
  const start = sameYear ? fmtDate(a).replace(/, \d{4}$/, '') : fmtDate(a)
  return `${start} – ${fmtDate(b)}`
}

/* ── the recommendation model ──────────────────────────────────────────────
   A `Rec` is never authored — it is assembled from a real condition that is
   already true in the data by plain `if` logic (no model, no inference).
   `short` is the same fact compressed to one clause so a demoted candidate can
   appear as the "Then" line without rewording. */

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
   *  Kept from the first cut: the headline is only auditable because this line
   *  names the numbers it came from. */
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

/** Small labelled figure. Deliberately compact — in this variant the numbers
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
          className="rounded-full px-2 py-0 text-[11px] font-medium"
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
          <span tabIndex={0} className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Badge
              variant="outline"
              className="cursor-default rounded-full border-dashed px-2 py-0 text-[11px] font-medium"
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
 *  term-breakdown.tsx (module-private there, and this variant may not modify a
 *  production file) so a countdown reads identically on both surfaces. */
function CountdownChip({ label, urgent = false }: { label: string; urgent?: boolean }) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium tabular-nums"
      style={{ color: urgent ? LIST_HUB_STATUS_TINT_WARNING.fg : 'var(--muted-foreground)' }}
    >
      <i className="fa-light fa-clock" aria-hidden="true" style={{ fontSize: 10 }} />
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
 *  `RowAction primary`, exactly as production's rows do. term-breakdown.tsx's
 *  own `RowActionMenu` is module-private and this variant is not allowed to
 *  edit that file, so the anatomy (ghost `icon-sm` trigger, fa-ellipsis,
 *  `DropdownMenuItem asChild` → `Link`) is reproduced verbatim rather than
 *  re-designed — if that component is ever exported, delete this and import
 *  it. */
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
      <CardFooter className="mt-auto">{footer}</CardFooter>
    </Card>
  )
}

/** Footer link. The destination and the label are BOTH per-column: a finished
 *  term's real next step is reading results (analytics), not re-entering the
 *  operational workspace, and Upcoming vs Current shouldn't read as the same
 *  link twice — three identical "View details" links across the triptych was a
 *  review finding, not a simplification. */
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
           data lane below (that one includes closed courses). Two unlabelled
           percentages on one card is the exact "conflicting content" failure
           the production card's ninth-pass audit had to unwind. */
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

function CurrentTermCardAi({
  snap,
  breakdown,
  noTemplates,
  className,
}: {
  snap: TermSnapshot
  breakdown: CourseBreakdown | null
  noTemplates: boolean
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
  const closedRate = weightedRate(b.closed)

  /* 1 — the one genuinely wrong state for a finished term: courses that ended
         without ever collecting. Everything else here is informational. */
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

  /* 2 — results exist and nobody has been pointed at them. */
  if (b.closed.length > 0) {
    recs.push({
      headline:
        closedRate != null
          ? `The term closed at ${closedRate}% average response${closedRate >= RESPONSE_TARGET ? ', at or above target' : `, below the ${RESPONSE_TARGET}% target`}. Review results and share them with faculty.`
          : 'Collection has finished. Review the results and share them with faculty.',
      basis: `${b.closed.length} of ${plural(b.totalCourses, 'course')} closed${closedRate != null ? ` · ${closedRate}% weighted response` : ''}`,
      short: closedRate != null ? `Closed at ${closedRate}% average response.` : 'Results are ready to review.',
      action: {
        label: 'View analytics',
        href: `/analytics?tab=term&term=${encodeURIComponent(term.name)}`,
      },
      emphasis: false,
    })
  }

  if (recs.length > 0) return recs
  return [
    calmRec(
      'Nothing left to chase for this term.',
      `${plural(b.totalCourses, 'course')} · ended ${fmtDate(term.endDate)}`,
      'Nothing outstanding.',
    ),
  ]
}

function LastTermCardAi({
  snap,
  breakdown,
}: {
  snap: TermSnapshot
  breakdown: CourseBreakdown | null
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
                {setupCount > 0 && (
                  <BreakdownRow
                    icon="fa-list-check"
                    tint={LIST_HUB_STATUS_TINT_WARNING}
                    title={coverageLead(b.notConfiguredCount, b.draft.length) ?? ''}
                    meta={<RowMeta codes={coverageCodes(b.notConfiguredCodes, b.draft)} />}
                    actions={
                      <RowAction href={workspaceHref('active')} primary icon="fa-pen-ruler">
                        Manage
                      </RowAction>
                    }
                  />
                )}
                {b.scheduled.length > 0 && (
                  <BreakdownRow
                    icon="fa-calendar-xmark"
                    tint={LIST_HUB_STATUS_TINT_WARNING}
                    title={`${plural(b.scheduled.length, 'course')} never opened`}
                    meta={<RowMeta codes={b.scheduled.map((s) => s.courseCode)} />}
                    actions={
                      <RowAction href={workspaceHref('active')} primary icon="fa-pen-ruler">
                        Manage
                      </RowAction>
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

function UpcomingCardAi({
  snap,
  breakdown,
}: {
  snap: TermSnapshot
  breakdown: CourseBreakdown | null
}) {
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

/* ── the triptych ─────────────────────────────────────────────────────────── */

export default function VariantAiForward() {
  const { surveys, programTerms, templates } = usePce()

  const ordered = useMemo(
    () => [...programTerms].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [programTerms],
  )
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const ce = useMemo(
    () => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'),
    [surveys],
  )

  /* Term selection mirrors dashboard-home.tsx EXACTLY — this variant
     redesigns the card, not which term lands in which slot. Last is capped to
     the single most recently ended term (Vishal, transcript 7a175890: "last
     should be the first card" — singular). */
  const currentTerms = useMemo(
    () => ordered.filter((t) => classifyTermWindow(t, today) === 'current'),
    [ordered, today],
  )
  const lastTerms = useMemo(() => {
    const candidates = ordered.filter((t) => classifyTermWindow(t, today) === 'last')
    const mostRecent = [...candidates].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
    return mostRecent ? [mostRecent] : []
  }, [ordered, today])
  const upcomingTerms = useMemo(
    () => ordered.filter((t) => classifyTermWindow(t, today) === 'upcoming'),
    [ordered, today],
  )

  const currentSnaps = useMemo(() => currentTerms.map((t) => snapshot(t, ce)), [currentTerms, ce])
  const lastSnaps = useMemo(() => lastTerms.map((t) => snapshot(t, ce)), [lastTerms, ce])
  const upcomingSnaps = useMemo(() => upcomingTerms.map((t) => snapshot(t, ce)), [upcomingTerms, ce])

  const breakdownForSnap = (snap: TermSnapshot) => breakdownFor(snap.term, ce)

  if (currentSnaps.length === 0 && lastSnaps.length === 0 && upcomingSnaps.length === 0) {
    return (
      <Card className="bg-muted/30 shadow-none">
        <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-2 p-4">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <i className="fa-light fa-calendar-xmark text-muted-foreground" aria-hidden="true" />
            No term is in the last, current, or upcoming window
          </span>
          <span className="text-sm text-muted-foreground">
            Switch demo accounts, or set up a term on the dashboard, to populate this variant.
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1fr_1.35fr_1fr]">
      {lastSnaps.length > 0 && (
        <div className="flex flex-col gap-4 lg:[grid-column:1]">
          {lastSnaps.map((s) => (
            <LastTermCardAi key={s.term.id} snap={s} breakdown={breakdownForSnap(s)} />
          ))}
        </div>
      )}
      {currentSnaps.length > 0 && (
        <div className="flex flex-col gap-4 lg:[grid-column:2]">
          {currentSnaps.map((s) => (
            <CurrentTermCardAi
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
            <UpcomingCardAi key={s.term.id} snap={s} breakdown={breakdownForSnap(s)} />
          ))}
        </div>
      )}
    </div>
  )
}
