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
//   2. All terms — collapsed by default ("Show all terms (N)"); expands to a
//      filter-tabbed DataTable (All/Current/Upcoming/Past) so any previous
//      term is one gesture away. Rows navigate to the term workspace.
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
  Tabs, TabsList, TabsTrigger,
  LocalBanner,
} from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { SetupTermSheet } from '@/components/pce/setup-term-sheet'
import { SendReminderDialog } from '@/components/pce/pce-modals'
import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'
import {
  RESPONSE_TARGET, LIVE,
  termsOrdered, currentTermId, snapshot, evalWindow, completionColor,
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

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function daysAgo(dateStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000))
}

/** Filled to the current rate, tick at the response target. */
function RateStrip({ rate }: { rate: number }) {
  return (
    <span
      className="relative block h-1.5 w-full rounded-full bg-muted"
      role="img"
      aria-label={`${rate}% response · target ${RESPONSE_TARGET}%`}
    >
      <span
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: completionColor(rate) }}
      />
      <span
        className="absolute -top-0.5 h-2.5 w-px bg-foreground/40"
        style={{ left: `${RESPONSE_TARGET}%` }}
        aria-hidden="true"
      />
    </span>
  )
}

function TermMetaLine({ term }: { term: ProgramTerm }) {
  const win = evalWindow(term)
  return (
    <p className="text-xs text-muted-foreground">
      AY {term.academicYear} · Eval window {win.open} – {win.close}
    </p>
  )
}

function ViewTermLink({ termId, name }: { termId: string; name: string }) {
  return (
    <Link
      href={`/course-evaluation/term/${termId}`}
      aria-label={`Open ${name} workspace`}
      className="ms-auto rounded-sm text-sm font-medium text-foreground hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      View term →
    </Link>
  )
}

/* ── current term (the hero card) ─────────────────────────────────────────── */

function CurrentTermCard({
  snap, atRisk, onRemind,
}: {
  snap: TermSnapshot
  atRisk: PceSurvey[]
  onRemind: () => void
}) {
  const { term } = snap
  const urgent = snap.daysLeft != null && snap.daysLeft <= 7
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">{term.name}</CardTitle>
        <StatusBadge label={POSITION_BADGE.current.label} tone={POSITION_BADGE.current.tone} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <TermMetaLine term={term} />
        {snap.daysLeft != null && (
          <p
            className="text-xs font-medium"
            style={{ color: urgent ? 'var(--chip-4)' : 'var(--muted-foreground)' }}
          >
            {snap.daysLeft}{snap.daysLeft === 1 ? ' day' : ' days'} left until evaluation closes
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-muted-foreground">Avg response rate</span>
            <span className="text-lg font-semibold tabular-nums leading-none text-foreground">
              {snap.rate != null ? `${snap.rate}%` : '—'}
            </span>
          </div>
          {snap.rate != null && <RateStrip rate={snap.rate} />}
        </div>
        {atRisk.length > 0 && (
          <div className="flex flex-col gap-2 rounded-md border border-border p-3">
            <p className="flex items-start gap-2 text-sm font-medium text-foreground">
              <i className="fa-light fa-triangle-exclamation mt-0.5" aria-hidden="true" style={{ color: 'var(--chip-4)' }} />
              {atRisk.length} of {snap.live} live {snap.live === 1 ? 'course' : 'courses'} below {AT_RISK_THRESHOLD}% response
            </p>
            {term.lastReminderSentAt && (
              <p className="text-xs text-muted-foreground">
                Last reminder sent {daysAgo(term.lastReminderSentAt)} days ago
              </p>
            )}
            <Button variant="outline" size="sm" className="self-start" onClick={onRemind}>
              Send reminders to at-risk ({atRisk.length})
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{snap.live}</span> live ·{' '}
          <span className="font-medium text-foreground">{snap.pending}</span> pending ·{' '}
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
  const rows: { label: string; value: string; emphasis?: boolean }[] = [
    { label: 'Evaluations', value: `${snap.total}` },
    { label: 'Pending review', value: `${snap.pending}`, emphasis: snap.pending > 0 },
    { label: 'Avg response', value: snap.rate != null ? `${snap.rate}%` : '—' },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">{term.name}</CardTitle>
        <StatusBadge label="Last term" tone={POSITION_BADGE.past.tone} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <TermMetaLine term={term} />
        <dl className="flex flex-col">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-1.5 border-t border-border/60 py-1.5">
              <dt className="text-xs text-muted-foreground">{r.label}</dt>
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
  const rows: { label: string; value: string }[] = [
    {
      label: 'Evaluations created',
      value: snap.coverage ? `${snap.coverage.surveyed} of ${snap.coverage.total}` : `${snap.total}`,
    },
    { label: 'Opens', value: fmtDate(term.startDate) },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground">{term.name}</CardTitle>
        <StatusBadge label={POSITION_BADGE.upcoming.label} tone={POSITION_BADGE.upcoming.tone} />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <TermMetaLine term={term} />
        <dl className="flex flex-col">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-1.5 border-t border-border/60 py-1.5">
              <dt className="text-xs text-muted-foreground">{r.label}</dt>
              <dd className="ms-auto text-xs font-medium tabular-nums text-foreground">{r.value}</dd>
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

function NoUpcomingSlot({ onConfigure }: { onConfigure: () => void }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/25 px-6 py-8">
      <i className="fa-light fa-calendar-plus text-2xl text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">No upcoming term yet</p>
      <Button variant="outline" size="sm" onClick={onConfigure}>
        Configure Term Calendar
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

function AllTermsSection({ ce, curId }: { ce: PceSurvey[]; curId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | TermPosition>('all')

  const allRows: TermRow[] = useMemo(
    () =>
      [...termsOrdered].reverse().map((t) => {
        const snap = snapshot(t, ce)
        return {
          id: t.id,
          name: t.name,
          position: positionOf(t, curId),
          academicYear: t.academicYear,
          startDate: t.startDate,
          endDate: t.endDate,
          total: snap.total,
          rate: snap.rate,
        }
      }),
    [ce, curId],
  )

  const counts = useMemo(() => {
    const c: Record<'all' | TermPosition, number> = { all: allRows.length, current: 0, upcoming: 0, past: 0 }
    for (const r of allRows) c[r.position] += 1
    return c
  }, [allRows])

  const rows = filter === 'all' ? allRows : allRows.filter((r) => r.position === filter)

  const columns: ColumnDef<TermRow>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Term',
        cell: (row) => <span className="text-sm font-medium text-foreground">{row.name}</span>,
      },
      {
        key: 'position',
        label: 'Status',
        width: 120,
        cell: (row) => (
          <StatusBadge label={POSITION_BADGE[row.position].label} tone={POSITION_BADGE[row.position].tone} />
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

  return (
    <section className="flex flex-col gap-3" aria-label="All terms">
      <Button
        variant="ghost"
        size="sm"
        className="self-start text-muted-foreground hover:text-foreground"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <i className={`fa-light ${open ? 'fa-chevron-down' : 'fa-chevron-right'} text-xs`} aria-hidden="true" />
        {open ? 'Hide' : 'Show'} all terms ({counts.all})
      </Button>
      {open && (
        <div className="flex flex-col gap-3">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="current">Current ({counts.current})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({counts.upcoming})</TabsTrigger>
              <TabsTrigger value="past">Past ({counts.past})</TabsTrigger>
            </TabsList>
          </Tabs>
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
                <i className="fa-light fa-filter-circle-xmark text-2xl text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">No terms in this group</p>
                <p className="text-xs text-muted-foreground">Switch the filter above to see other terms.</p>
              </div>
            }
          />
        </div>
      )}
    </section>
  )
}

/* ── page ─────────────────────────────────────────────────────────────────── */

function DashboardHomeInner() {
  const { surveys } = usePce()
  const [setupOpen, setSetupOpen] = useState(false)
  const [remindTargets, setRemindTargets] = useState<PceSurvey[]>([])
  const [banner, setBanner] = useState<string | null>(null)

  const curId = currentTermId()
  const curIdx = termsOrdered.findIndex((t) => t.id === curId)

  const ce = useMemo(
    () => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'),
    [surveys],
  )

  const curTerm = termsOrdered[curIdx]
  const lastTerm = termsOrdered[curIdx - 1]
  const upcomingTerm = termsOrdered[curIdx + 1]

  const curSnap = useMemo(() => (curTerm ? snapshot(curTerm, ce) : null), [curTerm, ce])
  const lastSnap = useMemo(() => (lastTerm ? snapshot(lastTerm, ce) : null), [lastTerm, ce])
  const upcomingSnap = useMemo(
    () => (upcomingTerm ? snapshot(upcomingTerm, ce) : null),
    [upcomingTerm, ce],
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
        subtitle="Course evaluations by term — health, access, and interventions"
        actions={
          <div className="flex items-center gap-2" role="group" aria-label="Dashboard actions">
            <Button variant="outline" size="default" onClick={() => setSetupOpen(true)}>
              Configure Term Calendar
            </Button>
            <Button variant="default" size="default" asChild>
              <Link href="/surveys/push">Send Evaluations</Link>
            </Button>
          </div>
        }
      />

      <div className="flex-1 px-7 py-4">
        {firstRun ? (
          <FirstRun onConfigure={() => setSetupOpen(true)} />
        ) : (
          <div className="flex flex-col gap-6">
            {banner && (
              <LocalBanner variant="success" title="Done" dismissible onDismiss={() => setBanner(null)}>
                {banner}
              </LocalBanner>
            )}

            {/* ── Terms triptych — current / last / upcoming ── */}
            <h2 className="sr-only">Terms</h2>
            <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
              {curSnap && (
                <CurrentTermCard
                  snap={curSnap}
                  atRisk={curAtRisk}
                  onRemind={() => setRemindTargets(curAtRisk)}
                />
              )}
              {lastSnap && <LastTermCard snap={lastSnap} />}
              {upcomingSnap ? (
                <UpcomingCard snap={upcomingSnap} />
              ) : (
                <NoUpcomingSlot onConfigure={() => setSetupOpen(true)} />
              )}
            </div>

            {/* ── All terms — history one gesture away ── */}
            <AllTermsSection ce={ce} curId={curId} />
          </div>
        )}
      </div>

      <SetupTermSheet open={setupOpen} onOpenChange={setSetupOpen} />

      <SendReminderDialog
        open={remindTargets.length > 0}
        onOpenChange={(v) => !v && setRemindTargets([])}
        surveys={remindTargets}
        onSent={(codes) => setBanner(`An ad-hoc reminder went out to non-responders in ${codes}.`)}
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

function FirstRun({ onConfigure }: { onConfigure: () => void }) {
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
      <Button variant="default" size="sm" onClick={onConfigure}>
        Configure Term Calendar
      </Button>
    </div>
  )
}
