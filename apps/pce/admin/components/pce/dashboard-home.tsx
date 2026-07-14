'use client'

// ============================================================================
// Course Evaluation — Dashboard home, v7 (Jul 10 2026).
//
// IA: TERM LIFECYCLE MONITOR (Romit, from the live PCE dashboard — IA base per
// pce-design-workflow; visuals mapped to DS, red → amber per aarti_no_red).
//
//   1. Terms triptych — Current / Last term / Upcoming slot. The current-term
//      card carries the story at card scale (no_bare_count_action_surfaces):
//      eval window, days-left urgency, avg rate + strip, an at-risk alert
//      SENTENCE ("N of M live courses below X% · last reminder Nd ago") with
//      a direct Send-reminders CTA, and live/pending/total footer counts.
//   2. Past terms — collapsed by default ("Show past terms (N)"); expands to
//      the HISTORY table (past terms only — the triptych already covers
//      current/last/upcoming, so repeating them here would defeat the label).
//      Rows navigate to the term workspace.
//
// REMOVED from the dashboard (Romit: "too crowded"): KPI band, charts, and
// the cross-term action rail — per-course viz + the full work queue live in
// the term workspace (/course-evaluation/term/[id]); cross-term viz lives in
// Analytics. ONE status vocabulary; this page says "evaluations", never
// "surveys".
// ============================================================================

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Button,
  PageHeader,
  StatusBadge,
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'

import { ResponseProgressCell } from '@/components/pce/response-gauge'
import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'
import { LIST_HUB_STATUS_TINT_WARNING } from '@/lib/list-status-badges'
import { auditTerm } from '@/lib/pce-term-readiness'
import {
  RESPONSE_TARGET, LIVE,
  currentTermId, snapshot, evalWindow,
  type TermSnapshot,
} from '@/lib/pce-term-metrics'
import type { PceSurvey, ProgramTerm } from '@/lib/pce-mock-data'

/* ── shared bits ──────────────────────────────────────────────────────────── */

type TermPosition = 'current' | 'past' | 'upcoming'

const POSITION_BADGE: Record<TermPosition, { label: string; tone: StatusBadgeTone }> = {
  current:  { label: 'Current',  tone: 'success' },
  past:     { label: 'Past',     tone: 'neutral' },
  upcoming: { label: 'Upcoming', tone: 'info' },
}

function positionOf(term: ProgramTerm, curId: string): TermPosition {
  if (term.id === curId) return 'current'
  const today = new Date().toISOString().slice(0, 10)
  return term.startDate > today ? 'upcoming' : 'past'
}

/** Parse a 'YYYY-MM-DD' string as a LOCAL date — plain `new Date(str)` reads
 * it as UTC midnight, which renders as the day before in timezones behind UTC. */
const parseDate = (d: string) => {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, day ?? 1)
}

const fmtDate = (d: string) =>
  parseDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/** Date range — drops the redundant year on the start when both share one. */
const fmtRange = (a: string, b: string) => {
  const sameYear = parseDate(a).getFullYear() === parseDate(b).getFullYear()
  const start = sameYear ? fmtDate(a).replace(/, \d{4}$/, '') : fmtDate(a)
  return `${start} – ${fmtDate(b)}`
}

function daysAgo(dateStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000))
}

/** Target status stays sr-only — the bar fill carries it visually. */
function RateSrStatus({ rate }: { rate: number }) {
  return (
    <span className="sr-only">
      {rate < RESPONSE_TARGET ? `below ${RESPONSE_TARGET}% target` : 'on target'}
    </span>
  )
}

/** Term meta — ONE quiet text line under the title (CardHeader). Card
 * vocabulary (Romit): the tinted StatusBadge is the only pill on a card;
 * metadata is unbordered muted text; countdowns are text + icon. Pills for
 * meta occupied space, wrapped on 1fr cards, and collided with the badge. */
function TermMetaLine({
  term, trailing, windowPending = false, hideWindow = false,
}: {
  term: ProgramTerm
  trailing?: React.ReactNode
  /** True before any evaluation exists — the derived window is a projection. */
  windowPending?: boolean
  /** Suppress the window entirely — used where the dates live in body rows. */
  hideWindow?: boolean
}) {
  const win = evalWindow(term)
  const open = win.open.replace(/, \d{4}$/, '')
  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
      AY {term.academicYear.replace(/–20(\d\d)$/, '–$1')}
      {!hideWindow && (
        <>
          {' · '}
          {windowPending ? (
            <>Eval window not set</>
          ) : (
            <>
              <span className="sr-only">Evaluation window </span>
              {open} – {win.close}
            </>
          )}
        </>
      )}
      {trailing}
    </p>
  )
}

/** Countdown — plain text + clock, NOT a badge (it's a fact, not a status). */
function DaysLeftIndicator({ daysLeft, urgent }: { daysLeft: number; urgent: boolean }) {
  return (
    <span
      className="flex shrink-0 items-center gap-1.5 text-xs font-medium tabular-nums"
      style={{ color: urgent ? 'var(--chip-4)' : 'var(--muted-foreground)' }}
    >
      <i className="fa-light fa-clock" aria-hidden="true" />
      {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
    </span>
  )
}


/** Title row — term name left, status badge pinned to the right edge. The
 * name links to the term workspace so the label itself is the affordance. */
function TermTitleRow({ name, termId, badge }: { name: string; termId: string; badge: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <CardTitle className="min-w-0 truncate text-base font-semibold">
        <Link
          href={`/course-evaluation/term/${termId}`}
          aria-label={`Open ${name} workspace`}
          className="rounded-sm text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {name}
        </Link>
      </CardTitle>
      {badge}
    </div>
  )
}

function ViewTermLink({ termId, name }: { termId: string; name: string }) {
  return (
    <Link
      href={`/course-evaluation/term/${termId}`}
      aria-label={`Open ${name} workspace`}
      className="ms-auto flex items-center gap-1.5 rounded-sm text-sm font-medium text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      View term
      <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
    </Link>
  )
}

/* ── current term (the hero card) ─────────────────────────────────────────── */

function CurrentTermCard({
  snap, atRisk,
}: {
  snap: TermSnapshot
  atRisk: PceSurvey[]
}) {
  const { term } = snap
  const urgent = snap.daysLeft != null && snap.daysLeft <= 7
  /* The reminder audience — students in at-risk courses who haven't responded. */
  const pendingAtRisk = atRisk.reduce(
    (n, s) => n + Math.max(0, s.enrollmentCount - s.responseCount), 0,
  )
  return (
    <Card>
      <CardHeader>
        <TermTitleRow
          name={term.name}
          termId={term.id}
          badge={<StatusBadge label={POSITION_BADGE.current.label} tone={POSITION_BADGE.current.tone} />}
        />
        <TermMetaLine
          term={term}
          /* Days-left rides in the reminder block when it exists; otherwise
           * it joins the meta line so the countdown never disappears. */
          trailing={
            atRisk.length === 0 && snap.daysLeft != null ? (
              /* Separator wraps WITH its unit — never a dangling dot. */
              <span className="flex items-center gap-1 whitespace-nowrap">
                {'· '}
                <DaysLeftIndicator daysLeft={snap.daysLeft} urgent={urgent} />
              </span>
            ) : undefined
          }
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* HubSpot-goals anatomy: label/value row → full-width bar → status words. */}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-muted-foreground">Avg response rate</span>
            <span className="text-lg font-semibold tabular-nums leading-none text-foreground">
              {snap.rate != null ? `${snap.rate}%` : '—'}
            </span>
          </div>
          {snap.rate != null && (
            <>
              <ResponseProgressCell
                rate={snap.rate}
                responseCount={0}
                enrollmentCount={0}
                target={RESPONSE_TARGET}
                detail="none"
                className="w-full max-w-none"
              />
              <RateSrStatus rate={snap.rate} />
            </>
          )}
        </div>
        {atRisk.length > 0 && (
          /* Student-first framing (Romit: the goal is students filling the
           * evaluation — lead with who still needs to act, not course rates).
           * The icon medallion is the visual anchor that says "act here". */
          <div className="flex items-start gap-3 rounded-md border border-border p-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: LIST_HUB_STATUS_TINT_WARNING.bg }}
              aria-hidden="true"
            >
              <i
                className="fa-light fa-bell"
                style={{ color: LIST_HUB_STATUS_TINT_WARNING.fg, fontSize: 16 }}
              />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground">
                  {pendingAtRisk} student{pendingAtRisk !== 1 ? 's' : ''} still need{pendingAtRisk === 1 ? 's' : ''} to respond
                </p>
                <p className="text-xs text-muted-foreground">
                  {atRisk.length} {atRisk.length === 1 ? 'course' : 'courses'} below {AT_RISK_THRESHOLD}%
                  {term.lastReminderSentAt ? ` · last reminded ${daysAgo(term.lastReminderSentAt)}d ago` : ''}
                </p>
              </div>
              {/* Batch action + countdown share the bottom row — identical to
                  the upcoming card's needs-info block so the two read the same;
                  the countdown wraps below the button on the narrow card rather
                  than squeezing the heading. (multi-course batch → wizard.) */}
              <div className="flex flex-col items-start gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/surveys/remind?from=term:${term.id}`}>Send reminders</Link>
                </Button>
                {snap.daysLeft != null && (
                  <DaysLeftIndicator daysLeft={snap.daysLeft} urgent={urgent} />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {/* mt-auto pins the footer to the card bottom like its siblings — the
          grid stretches all cards to the tallest, and an unpinned footer
          floats mid-card with a void beneath it. */}
      <CardFooter className="mt-auto gap-2">
        {/* "in review" not "pending" — the at-risk block above uses pending
            for STUDENTS; one word must not mean two things on one card. */}
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{snap.live}</span> live ·{' '}
          <span className="font-medium text-foreground">{snap.pending}</span> in review ·{' '}
          <span className="font-medium text-foreground">{snap.total}</span> total
        </p>
        <ViewTermLink termId={term.id} name={term.name} />
      </CardFooter>
    </Card>
  )
}

/* ── last term ────────────────────────────────────────────────────────────── */

function LastTermCard({ snap }: { snap: TermSnapshot }) {
  const { term } = snap
  const rows: { label: string; value: string; icon: string; emphasis?: boolean }[] = [
    { label: 'Evaluations', value: `${snap.total}`, icon: 'fa-square-poll-vertical' },
    { label: 'Pending review', value: `${snap.pending}`, icon: 'fa-shield-check', emphasis: snap.pending > 0 },
    { label: 'Released to faculty', value: `${snap.released} of ${snap.total}`, icon: 'fa-circle-check' },
    { label: 'Avg response', value: snap.rate != null ? `${snap.rate}%` : '—', icon: 'fa-chart-mixed' },
  ]
  return (
    <Card>
      <CardHeader>
        <TermTitleRow
          name={term.name}
          termId={term.id}
          badge={<StatusBadge label="Last term" tone={POSITION_BADGE.past.tone} />}
        />
        <TermMetaLine term={term} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="flex flex-col">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-1.5 border-t border-border/60 py-1.5">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <i className={`fa-light ${r.icon}`} aria-hidden="true" />
                {r.label}
              </dt>
              <dd
                className="ms-auto text-xs font-medium tabular-nums"
                style={{ color: r.emphasis ? 'var(--chip-4)' : 'var(--foreground)' }}
              >
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
      <CardFooter className="mt-auto">
        <ViewTermLink termId={term.id} name={term.name} />
      </CardFooter>
    </Card>
  )
}

/* ── upcoming slot ────────────────────────────────────────────────────────── */

function UpcomingCard({ snap }: { snap: TermSnapshot }) {
  const { term } = snap
  /* The card is an ACTION surface when setup is incomplete — the remaining
   * offerings are work, not just a count (reference: live PCE upcoming card:
   * offerings found · starts-in countdown · needs-attention → Fix Data). */
  const remaining = snap.coverage ? snap.coverage.total - snap.coverage.surveyed : 0
  const noSetup = (snap.coverage?.surveyed ?? snap.total) === 0
  const readiness = auditTerm(term.id)
  const startsIn = Math.max(
    0,
    Math.ceil((new Date(term.startDate).getTime() - Date.now()) / 86_400_000),
  )
  const win = evalWindow(term)
  const rows: { label: string; value: string; icon: string }[] = [
    {
      label: 'Course offerings found',
      value: `${snap.coverage?.total ?? readiness.total}`,
      icon: 'fa-layer-group',
    },
    {
      label: 'Evaluations created',
      value: snap.coverage ? `${snap.coverage.surveyed} of ${snap.coverage.total}` : `${snap.total}`,
      icon: 'fa-square-poll-vertical',
    },
    { label: 'Term dates', value: fmtRange(term.startDate, term.endDate), icon: 'fa-calendar' },
    {
      /* Survey window is a projection until evaluations are set up — say so
         rather than printing a derived range as a committed fact. */
      label: 'Survey dates',
      value: noSetup ? 'Not set yet' : `${win.open.replace(/, \d{4}$/, '')} – ${win.close}`,
      icon: 'fa-calendar-check',
    },
  ]
  return (
    <Card>
      <CardHeader>
        <TermTitleRow
          name={term.name}
          termId={term.id}
          badge={<StatusBadge label={POSITION_BADGE.upcoming.label} tone={POSITION_BADGE.upcoming.tone} />}
        />
        <TermMetaLine
          term={term}
          /* Dates live in the body rows (Term dates / Survey dates); the meta
             line stays to the AY + countdown so it never reads "window not
             set · starts in Nd", which conflated two facts. */
          hideWindow
          /* The countdown rides inside the needs-info block (like the current
             card's "N days left" rides its reminder block); only when there's
             no such block does it fall back to the meta line. */
          trailing={
            readiness.needsData > 0
              ? undefined
              : <span className="whitespace-nowrap tabular-nums">· starts in {startsIn}d</span>
          }
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <dl className="flex flex-col">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-1.5 border-t border-border/60 py-1.5">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <i className={`fa-light ${r.icon}`} aria-hidden="true" />
                {r.label}
              </dt>
              <dd className="ms-auto text-xs font-medium tabular-nums text-foreground">{r.value}</dd>
            </div>
          ))}
        </dl>
        {readiness.needsData > 0 ? (
          /* Same needs-attention anatomy as the current card's reminder block. */
          <div className="flex items-start gap-3 rounded-md border border-border p-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: LIST_HUB_STATUS_TINT_WARNING.bg }}
              aria-hidden="true"
            >
              <i
                className="fa-light fa-triangle-exclamation"
                style={{ color: LIST_HUB_STATUS_TINT_WARNING.fg, fontSize: 16 }}
              />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground">
                  {readiness.needsData} course{readiness.needsData !== 1 ? 's' : ''} need{readiness.needsData === 1 ? 's' : ''} more info
                </p>
                <p className="text-xs text-muted-foreground">
                  Missing faculty or student rosters
                </p>
              </div>
              {/* Action + countdown share the bottom row so neither squeezes
                  the heading; on a narrow card the countdown wraps below the
                  button instead of forcing the heading onto 3–4 lines. */}
              <div className="flex flex-col items-start gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/course-evaluation/term-setup?phase=readiness">Add missing info</Link>
                </Button>
                <DaysLeftIndicator daysLeft={startsIn} urgent={startsIn <= 7} />
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="mt-auto">
        {/* Upcoming term's job is setup — footer leads there; the clickable
            title already opens the workspace. Falls back to View term once
            every offering has an evaluation. */}
        {remaining > 0 ? (
          <Link
            href={`/surveys/push?term=${term.id}`}
            aria-label={`Set up evaluations for ${term.name}`}
            className="ms-auto flex items-center gap-1.5 rounded-sm text-sm font-medium text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Set up evaluations
            <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
          </Link>
        ) : (
          <ViewTermLink termId={term.id} name={term.name} />
        )}
      </CardFooter>
    </Card>
  )
}

function NoUpcomingSlot() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/25 px-6 py-8">
      <i className="fa-light fa-calendar-plus text-2xl text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">No upcoming term yet</p>
      <Button variant="outline" size="sm" asChild>
        <Link href="/course-evaluation/term-setup">Set up term</Link>
      </Button>
    </div>
  )
}

/* ── all terms (collapsed history) ────────────────────────────────────────── */

type TermRow = {
  id: string
  name: string
  position: TermPosition
  academicYear: string
  startDate: string
  endDate: string
  total: number
  rate: number | null
} & Record<string, unknown>

/** Past terms only — the triptych above already shows current/last/upcoming,
 * so this is the HISTORY archive, not a repeat of the same list (Romit). */
function PastTermsSection({ ce, curId, terms }: { ce: PceSurvey[]; curId: string; terms: ProgramTerm[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const rows: TermRow[] = useMemo(
    () =>
      [...terms]
        .reverse()
        .filter((t) => positionOf(t, curId) === 'past')
        .map((t) => {
          const snap = snapshot(t, ce)
          return {
            id: t.id,
            name: t.name,
            position: 'past' as TermPosition,
            academicYear: t.academicYear,
            startDate: t.startDate,
            endDate: t.endDate,
            total: snap.total,
            rate: snap.rate,
          }
        }),
    [ce, curId, terms],
  )

  const columns: ColumnDef<TermRow>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Term',
        cell: (row) => (
          <Link
            href={`/course-evaluation/term/${row.id}`}
            onClick={(e) => e.stopPropagation()}
            className="rounded-sm text-sm font-medium text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {row.name}
          </Link>
        ),
      },
      { key: 'academicYear', label: 'Academic year', width: 130 },
      { key: 'startDate', label: 'Start date', width: 130, cell: (row) => fmtDate(row.startDate) },
      { key: 'endDate', label: 'End date', width: 130, cell: (row) => fmtDate(row.endDate) },
      {
        key: 'total',
        label: 'Evaluations',
        width: 110,
        cell: (row) => <span className="tabular-nums">{row.total}</span>,
      },
      {
        key: 'rate',
        label: 'Avg response rate',
        width: 150,
        cell: (row) => (
          <span className="tabular-nums">{row.rate != null ? `${row.rate}%` : '—'}</span>
        ),
      },
    ],
    [],
  )

  if (rows.length === 0) return null

  return (
    <section className="flex flex-col gap-3" aria-label="Past terms">
      <Button
        variant="ghost"
        size="sm"
        className="self-start text-muted-foreground hover:text-foreground"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <i className={`fa-light ${open ? 'fa-chevron-down' : 'fa-chevron-right'} text-xs`} aria-hidden="true" />
        {open ? 'Hide' : 'Show'} past terms ({rows.length})
      </Button>
      {open && (
        <DataTablePaginated<TermRow>
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          pagination={{ pageSize: 10 }}
          edgeInset={false}
          stickyHeader={false}
          onRowClick={(row) => router.push(`/course-evaluation/term/${row.id}`)}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-8">
              <i className="fa-light fa-calendar-xmark text-2xl text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">No past terms yet</p>
              <p className="text-xs text-muted-foreground">Completed terms will appear here as history.</p>
            </div>
          }
        />
      )}
    </section>
  )
}

/* ── page ─────────────────────────────────────────────────────────────────── */

function DashboardHomeInner() {
  const { surveys, programTerms } = usePce()

  /* Terms come from STATE (not the static mock) so a term finished in the
   * setup wizard appears here as a card immediately. */
  const ordered = useMemo(
    () => [...programTerms].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [programTerms],
  )
  const curId = currentTermId()
  const curIdx = ordered.findIndex((t) => t.id === curId)

  const ce = useMemo(
    () => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'),
    [surveys],
  )

  const curTerm = ordered[curIdx]
  const lastTerm = ordered[curIdx - 1]
  /* ALL upcoming terms — a newly introduced term must appear here even when
   * another already occupies the slot (the past-terms table is history-only,
   * so this stack is an upcoming term's ONLY dashboard presence). */
  const upcomingTerms = useMemo(() => ordered.slice(curIdx + 1), [ordered, curIdx])

  const curSnap = useMemo(() => (curTerm ? snapshot(curTerm, ce) : null), [curTerm, ce])
  const lastSnap = useMemo(() => (lastTerm ? snapshot(lastTerm, ce) : null), [lastTerm, ce])
  const upcomingSnaps = useMemo(
    () => upcomingTerms.map((t) => snapshot(t, ce)),
    [upcomingTerms, ce],
  )

  const curAtRisk = useMemo(
    () =>
      curTerm
        ? ce
            .filter((s) => s.term === curTerm.name && LIVE(s) && s.responseRate < AT_RISK_THRESHOLD)
            .sort((a, b) => a.responseRate - b.responseRate)
        : [],
    [ce, curTerm],
  )

  const firstRun = ce.length === 0

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader title="Dashboard" />
      <PageHeader
        title="Dashboard"
        subtitle="Track response collection and act where students haven’t responded"
        actions={
          <div className="flex items-center gap-2" role="group" aria-label="Dashboard actions">
            <Button variant="outline" size="default" asChild>
              <Link href="/course-evaluation/term-setup">Set up term</Link>
            </Button>
            <Button variant="default" size="default" asChild>
              <Link href="/surveys/push">Set up Evaluations</Link>
            </Button>
          </div>
        }
      />

      <div className="flex-1 px-7 py-4">
        {firstRun ? (
          <FirstRun />
        ) : (
          <div className="flex flex-col gap-6">
            {/* ── Terms triptych — current / last / upcoming. The current term
                 is the working surface, so it takes double width; the other
                 two are reference cards (visual priority = usage priority). ── */}
            <h2 className="sr-only">Terms</h2>
            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[2fr_1fr_1fr]">
              {curSnap && (
                <CurrentTermCard snap={curSnap} atRisk={curAtRisk} />
              )}
              {lastSnap && <LastTermCard snap={lastSnap} />}
              {upcomingSnaps.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {upcomingSnaps.map((s) => (
                    <UpcomingCard key={s.term.id} snap={s} />
                  ))}
                </div>
              ) : (
                <NoUpcomingSlot />
              )}
            </div>

            {/* ── All terms — history one gesture away ── */}
            <PastTermsSection ce={ce} curId={curId} terms={ordered} />
          </div>
        )}
      </div>

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

function FirstRun() {
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
      <Button variant="default" size="sm" asChild>
        <Link href="/course-evaluation/term-setup">Set up term</Link>
      </Button>
    </div>
  )
}
