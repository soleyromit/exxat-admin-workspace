'use client'

// ============================================================================
// Course Evaluation — Dashboard home, v3 (Jul 8 2026, multi-hat review fixes).
//
// IA: VISIBLE MASTER → SCOPED DETAIL. Terms band cards use the Deel
// Learning-Insights anatomy (hero number + labeled breakdown rows, EVERY count
// a deep-link — no dead text) with stage badges sharing the survey vocabulary.
// Selecting a card scopes the detail zone via ?term=.
//
// Detail zone: the evaluations table IS the page (Romit 2026-07-09: all
// visualizations, charts, and AI insights removed — analysis lives in
// Analytics/Results). Interventions (Remind / Extend) sit inline on at-risk
// rows — there is no separate Needs-attention queue.
//
// ONE status vocabulary: Draft · Scheduled · Live · In review · Released
// (terms add Upcoming/Complete for aggregate-only states). This page says
// "evaluations", never "surveys" (Programmatic Surveys is a different module).
// No red (aarti_no_red): teal --chart-2 good · amber --chart-4/--chip-4 risk.
// ============================================================================

import { Fragment, Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Button,
  PageHeader,
  StatusBadge,
  PersonIdentityCell,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  LocalBanner,
} from '@exxatdesignux/ui'
import type { StatusBadgeTone } from '@exxatdesignux/ui'
import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { SetupTermSheet } from '@/components/pce/setup-term-sheet'
import { EditEndDateDialog, SendReminderDialog } from '@/components/pce/pce-modals'
import { SurveyStatusBadgeOS } from '@/components/pce/pce-badges'
import { rateColor } from '@/lib/pce-results'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  MOCK_MASTER_COURSES,
  type PceSurvey,
  type ProgramTerm,
} from '@/lib/pce-mock-data'

const RESPONSE_TARGET = 70

type SurveyRow = PceSurvey & Record<string, unknown>

/* Same vocabulary as the Evaluations hub (surveys-table.tsx). */
const STATUS_FILTER_OPTIONS = [
  { value: 'draft',          label: 'Draft' },
  { value: 'scheduled',      label: 'Scheduled' },
  { value: 'collecting',     label: 'Collecting Responses' },
  { value: 'active',         label: 'Active' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'released',       label: 'Results Released' },
  { value: 'closed',         label: 'Closed' },
]

function primaryInstructorName(s: PceSurvey): string {
  return (s.instructors.find((i) => i.role === 'primary') ?? s.instructors[0])?.name ?? ''
}

/* ── term helpers ─────────────────────────────────────────────────────────── */

const termsOrdered: ProgramTerm[] = [...MOCK_PROGRAM_TERMS].sort(
  (a, b) => a.startDate.localeCompare(b.startDate),
)

/** Latest term whose start date has passed = the current cycle. */
function currentTermId(): string {
  const today = new Date().toISOString().slice(0, 10)
  const started = termsOrdered.filter((t) => t.startDate <= today)
  return (started.at(-1) ?? termsOrdered[0]).id
}

function evalWindow(term: ProgramTerm): { open: string; close: string } {
  const closeDate = new Date(term.endDate)
  closeDate.setDate(closeDate.getDate() + 7)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return { open: fmt(new Date(term.startDate)), close: fmt(closeDate) }
}

function daysUntilClose(term: ProgramTerm): number | null {
  const close = new Date(term.endDate)
  close.setDate(close.getDate() + 7)
  const diff = Math.ceil((close.getTime() - Date.now()) / 86_400_000)
  return diff > 0 ? diff : null
}

function daysUntil(dateStr: string): number | null {
  const t = new Date(dateStr).getTime()
  return Number.isFinite(t) ? Math.ceil((t - Date.now()) / 86_400_000) : null
}

function weightedRate(surveys: PceSurvey[]): number | null {
  const enrolled = surveys.reduce((s, x) => s + x.enrollmentCount, 0)
  if (enrolled === 0) return null
  return Math.round(surveys.reduce((s, x) => s + x.responseRate * x.enrollmentCount, 0) / enrolled)
}

/** Lifecycle sort for the table: needs-attention first. */
const STATUS_ORDER: Record<string, number> = {
  active: 0, collecting: 0, pending_review: 1, closed: 1, released: 2, scheduled: 3, draft: 4,
}

const LIVE = (s: PceSurvey) => s.status === 'active' || s.status === 'collecting'
const IN_REVIEW = (s: PceSurvey) => s.status === 'pending_review' || s.status === 'closed'
const FINISHED = (s: PceSurvey) => IN_REVIEW(s) || s.status === 'released'

/* ── term stage model (shares the survey vocabulary) ──────────────────────── */

type TermStage = 'upcoming' | 'live' | 'review' | 'complete'

const STAGE_BADGE: Record<TermStage, { label: string; tone: StatusBadgeTone }> = {
  upcoming: { label: 'Upcoming',  tone: 'info' },
  live:     { label: 'Live',      tone: 'success' },
  review:   { label: 'In review', tone: 'warning' },
  complete: { label: 'Complete',  tone: 'neutral' },
}

interface TermSnapshot {
  term: ProgramTerm
  stage: TermStage
  rate: number | null
  total: number
  live: number
  atRisk: number
  pending: number
  released: number
  daysLeft: number | null
  coverage: { surveyed: number; total: number } | null
}

function coverageFor(termId: string, termSurveys: PceSurvey[]) {
  const offerings = MOCK_COURSE_OFFERINGS.filter((o) => o.termId === termId)
  if (offerings.length === 0) return null
  const surveyedCodes = new Set(
    termSurveys.filter((s) => s.status !== 'draft').map((s) => s.courseCode),
  )
  const surveyed = offerings.filter((o) => {
    const code = MOCK_MASTER_COURSES.find((c) => c.id === o.masterCourseId)?.code
    return code ? surveyedCodes.has(code) : false
  }).length
  return { surveyed, total: offerings.length }
}

function snapshot(term: ProgramTerm, ce: PceSurvey[]): TermSnapshot {
  const list = ce.filter((s) => s.term === term.name)
  const today = new Date().toISOString().slice(0, 10)
  const live = list.filter(LIVE)
  const pending = list.filter(IN_REVIEW).length
  const released = list.filter((s) => s.status === 'released').length
  const stage: TermStage =
    term.startDate > today ? 'upcoming'
    : live.length > 0 ? 'live'
    : pending > 0 ? 'review'
    : 'complete'
  return {
    term,
    stage,
    rate: weightedRate(list),
    total: list.length,
    live: live.length,
    atRisk: live.filter((s) => s.responseRate < AT_RISK_THRESHOLD).length,
    pending,
    released,
    daysLeft: stage === 'live' ? daysUntilClose(term) : null,
    coverage: coverageFor(term.id, list),
  }
}

/* ── term card (Deel Learning-Insights anatomy: hero + linked breakdown) ──── */

function CardStatRow({
  label,
  value,
  href,
  emphasis,
}: {
  label: string
  value: string
  href?: string
  emphasis?: boolean
}) {
  const inner = (
    <>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className="ms-auto text-xs font-medium tabular-nums"
        style={{ color: emphasis ? 'var(--chip-4)' : 'var(--foreground)' }}
      >
        {value}
      </span>
      {href && (
        <i className="fa-light fa-chevron-right text-muted-foreground" style={{ fontSize: 10 }} aria-hidden="true" />
      )}
    </>
  )
  if (!href) {
    return <div className="flex items-center gap-1.5 py-1 border-t border-border/60">{inner}</div>
  }
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 py-1 border-t border-border/60 hover:bg-muted/40 -mx-1 px-1 rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {inner}
    </Link>
  )
}

function TermCard({
  snap,
  isSelected,
  isCurrentTerm,
}: {
  snap: TermSnapshot
  isSelected: boolean
  isCurrentTerm: boolean
}) {
  const badge = STAGE_BADGE[snap.stage]
  const rows: { label: string; value: string; href?: string; emphasis?: boolean }[] = []
  if (snap.stage === 'upcoming') {
    rows.push({
      label: 'Evaluations created',
      value: snap.coverage ? `${snap.coverage.surveyed} of ${snap.coverage.total}` : `${snap.total}`,
      href: `/surveys/push?term=${snap.term.id}`,
    })
    rows.push({
      label: 'Opens',
      value: new Date(snap.term.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  }
  if (snap.stage === 'live') {
    rows.push({ label: 'Live', value: `${snap.live}`, href: '/surveys?status=active,collecting' })
    if (snap.atRisk > 0) {
      rows.push({ label: 'At risk', value: `${snap.atRisk}`, href: '/surveys?status=active,collecting', emphasis: true })
    }
    if (snap.coverage && snap.coverage.surveyed < snap.coverage.total) {
      rows.push({
        label: 'Courses covered',
        value: `${snap.coverage.surveyed} of ${snap.coverage.total}`,
        href: `/surveys/push?term=${snap.term.id}`,
      })
    }
    if (snap.daysLeft != null) rows.push({ label: 'Window closes', value: `in ${snap.daysLeft}d` })
  }
  if (snap.stage === 'review') {
    rows.push({ label: 'In review', value: `${snap.pending}`, href: '/surveys?status=pending_review,closed', emphasis: true })
    rows.push({ label: 'Released', value: `${snap.released} of ${snap.total}`, href: '/results' })
  }
  if (snap.stage === 'complete') {
    rows.push({ label: 'Released', value: `${snap.released} of ${snap.total}`, href: '/results' })
  }

  return (
    <div
      className={`relative rounded-lg border bg-card px-4 pb-2 pt-3 ${
        isSelected ? 'border-ring' : 'border-border'
      }`}
    >
      {/* selection accent — a structural cue no hover state uses */}
      {isSelected && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0.5 rounded-t-lg"
          style={{ background: 'var(--brand-color)' }}
        />
      )}
      <Link
        href={`/course-evaluation/dashboard?term=${snap.term.id}`}
        aria-current={isSelected ? 'true' : undefined}
        aria-label={`View ${snap.term.name} on this dashboard`}
        className="group block focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground group-hover:underline underline-offset-2">
            {snap.term.name}
            {isCurrentTerm && (
              <span className="text-xs text-muted-foreground font-normal"> · current</span>
            )}
          </span>
          <StatusBadge label={badge.label} tone={badge.tone} />
        </div>
        <div className="mt-1.5 mb-2 flex items-end gap-2">
          <span className="text-xl font-semibold tabular-nums leading-none text-foreground">
            {snap.rate != null ? `${snap.rate}%` : '—'}
          </span>
          <span className="text-xs text-muted-foreground pb-px">
            response rate · target {RESPONSE_TARGET}%
          </span>
        </div>
      </Link>
      <div className="flex flex-col">
        {rows.map((r) => (
          <CardStatRow key={r.label} {...r} />
        ))}
      </div>
    </div>
  )
}

/* ── page ─────────────────────────────────────────────────────────────────── */

function DashboardHomeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { surveys, sendSurveyReminder } = usePce()
  const [setupOpen, setSetupOpen] = useState(false)
  const [remindTargets, setRemindTargets] = useState<PceSurvey[]>([])
  const [extendTargets, setExtendTargets] = useState<PceSurvey[]>([])
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set())
  const [reminderSentTo, setReminderSentTo] = useState<string | null>(null)

  const curId = currentTermId()
  const requested = searchParams?.get('term')
  const selectedTerm =
    termsOrdered.find((t) => t.id === requested) ??
    termsOrdered.find((t) => t.id === curId) ??
    termsOrdered[0]
  const curIdx = termsOrdered.findIndex((t) => t.id === curId)

  // A confirmation belongs to the term it happened in — never carry it across.
  useEffect(() => {
    setReminderSentTo(null)
  }, [selectedTerm.id])

  const ce = useMemo(
    () => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'),
    [surveys],
  )
  const termSurveys = useMemo(
    () => ce.filter((s) => s.term === selectedTerm.name),
    [ce, selectedTerm.name],
  )

  /* Terms band — last / current / upcoming trio (+ the selected past term) */
  const bandTerms = useMemo(() => {
    const trio = [termsOrdered[curIdx - 1], termsOrdered[curIdx], termsOrdered[curIdx + 1]]
      .filter((t): t is ProgramTerm => !!t)
    if (!trio.some((t) => t.id === selectedTerm.id)) trio.unshift(selectedTerm)
    return trio.map((t) => snapshot(t, ce))
  }, [ce, curIdx, selectedTerm])

  const liveSurveys = termSurveys.filter(LIVE)
  const responsesCollected = termSurveys.reduce((s, x) => s + x.responseCount, 0)
  const enrolledTotal = termSurveys.reduce((s, x) => s + x.enrollmentCount, 0)
  const closingThisWeek = liveSurveys.filter((s) => {
    const d = s.deadline ? daysUntil(s.deadline) : null
    return d != null && d >= 0 && d <= 7
  }).length

  const tableRows: SurveyRow[] = useMemo(
    () =>
      [...termSurveys]
        .sort(
          (a, b) =>
            (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
            a.responseRate - b.responseRate,
        )
        // `faculty` scalar — filters/search/sort match on String(row[key]).
        .map((s) => ({ ...s, faculty: primaryInstructorName(s) }) as SurveyRow),
    [termSurveys],
  )

  const facultyOptions = useMemo(
    () =>
      [...new Set(termSurveys.map(primaryInstructorName).filter(Boolean))]
        .sort()
        .map((n) => ({ value: n, label: n })),
    [termSurveys],
  )

  const columns: ColumnDef<SurveyRow>[] = useMemo(
    () => [
      {
        key: 'courseCode',
        label: 'Course',
        sortable: true,
        filter: { type: 'text', icon: 'fa-book' },
        cell: (row) => (
          <Link
            href={`/results/${row.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block min-w-0 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
          >
            <p className="text-sm font-medium">{row.courseCode}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[220px]">{row.courseName}</p>
          </Link>
        ),
      },
      {
        key: 'faculty',
        label: 'Faculty',
        width: 190,
        sortable: true,
        filter: { type: 'select', icon: 'fa-user', options: facultyOptions },
        cell: (row) => {
          const primary = row.instructors.find((i) => i.role === 'primary') ?? row.instructors[0]
          if (!primary) return <span className="text-sm text-muted-foreground">—</span>
          const extra = row.instructors.length - 1
          return (
            <div className="flex items-center gap-1.5 min-w-0">
              <PersonIdentityCell name={primary.name} initials={primary.initials} />
              {extra > 0 && (
                <span className="text-xs text-muted-foreground shrink-0" title={row.instructors.slice(1).map((i) => i.name).join(', ')}>
                  +{extra}
                </span>
              )}
            </div>
          )
        },
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        width: 140,
        filter: { type: 'select', icon: 'fa-circle-dot', options: STATUS_FILTER_OPTIONS },
        cell: (row) => <SurveyStatusBadgeOS status={row.status} />,
      },
      {
        key: 'responseRate',
        label: 'Response rate',
        sortable: true,
        width: 120,
        header: () => <span className="block text-right">Response rate</span>,
        cell: (row) => (
          <div className="text-right">
            <p className="text-sm tabular-nums font-medium text-foreground flex items-center justify-end gap-1.5">
              {row.responseCount > 0 && (
                <span
                  role="img"
                  aria-label={row.responseRate >= RESPONSE_TARGET ? 'on target' : 'below target'}
                  style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: rateColor(row.responseRate), flexShrink: 0 }}
                />
              )}
              {row.responseCount > 0 ? `${row.responseRate}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {row.responseCount}/{row.enrollmentCount}
            </p>
          </div>
        ),
      },
      {
        key: 'deadline',
        label: 'Closes',
        sortable: true,
        width: 130,
        filter: { type: 'text', icon: 'fa-calendar-day' },
        cell: (row) => {
          const d = row.deadline ? daysUntil(row.deadline) : null
          if (LIVE(row) && d != null) {
            return (
              <div>
                <p className="text-sm tabular-nums">{row.deadline}</p>
                <p
                  className="text-xs tabular-nums"
                  style={{ color: d <= 3 ? 'var(--chip-4)' : 'var(--muted-foreground)' }}
                >
                  {d <= 0 ? 'closes today' : `${d}d left`}
                </p>
              </div>
            )
          }
          return <span className="text-xs text-muted-foreground">{row.deadline || '—'}</span>
        },
      },
      {
        key: 'actions',
        label: '',
        width: 220,
        cell: (row) => {
          const isAtRisk = LIVE(row) && row.responseRate < AT_RISK_THRESHOLD
          const sentThisSession = remindedIds.has(row.id)
          return (
            <div className="flex items-center justify-end gap-1">
              {isAtRisk && sentThisSession && (
                <span className="text-xs text-muted-foreground pe-1">Sent today</span>
              )}
              {isAtRisk && !sentThisSession && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setRemindTargets([row])
                  }}
                  aria-label={`Send ad-hoc reminder for ${row.courseCode}`}
                >
                  Remind
                </Button>
              )}
              {/* Low response rate → offer more collection time inline */}
              {isAtRisk && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExtendTargets([row])
                  }}
                  aria-label={`Extend the evaluation window for ${row.courseCode}`}
                >
                  Extend
                </Button>
              )}
              {FINISHED(row) && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="px-1 text-muted-foreground hover:text-foreground"
                >
                  <Link href={`/results/${row.id}`} onClick={(e) => e.stopPropagation()}>
                    Results
                    <i className="fa-light fa-arrow-right" aria-hidden="true" />
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`More actions for ${row.courseCode}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className="fa-light fa-ellipsis" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {/* "View evaluation" became "View results" (Romit 2026-07-09) —
                      the results page is the viewing surface; /surveys/[id]
                      stays the ops surface reached via row click. */}
                  <DropdownMenuItem onSelect={() => router.push(`/results/${row.id}`)}>
                    View results
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push(`/surveys/${row.id}/preview`)}>
                    Preview form
                  </DropdownMenuItem>
                  {LIVE(row) && !isAtRisk && (
                    <DropdownMenuItem onSelect={() => setRemindTargets([row])}>
                      Send reminder
                    </DropdownMenuItem>
                  )}
                  {LIVE(row) && !isAtRisk && (
                    <DropdownMenuItem onSelect={() => setExtendTargets([row])}>
                      Edit end date
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [router, remindedIds, facultyOptions],
  )

  /* All-terms menu — grouped by academic year (separate axes, never merged
     into one label). Selecting a term scopes the page via ?term=. */
  const termsByYear = useMemo(() => {
    const m = new Map<string, ProgramTerm[]>()
    for (const t of [...termsOrdered].reverse()) {
      m.set(t.academicYear, [...(m.get(t.academicYear) ?? []), t])
    }
    return [...m.entries()]
  }, [])

  const firstRun = ce.length === 0
  const window = evalWindow(selectedTerm)

  return (
    /* No overflow-hidden here: the page scrolls at the window level so the
       sticky SiteHeader pins and the DS table's floating header can dock
       under it ("window scroll breaks sticky under shell overflow" —
       PrimaryPageTemplate). */
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
            {/* ── Terms band — the program overview (visible master) ── */}
            <nav aria-label="Terms" className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Terms</h2>
                  <span className="text-xs text-muted-foreground">
                    Select a term to scope the page
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      All terms
                      <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {termsByYear.map(([year, terms], i) => (
                      <Fragment key={year}>
                        {i > 0 && <DropdownMenuSeparator />}
                        <DropdownMenuLabel>AY {year}</DropdownMenuLabel>
                        {terms.map((t) => (
                          <DropdownMenuItem
                            key={t.id}
                            onSelect={() => router.push(`/course-evaluation/dashboard?term=${t.id}`)}
                          >
                            <span className="flex-1">{t.name}</span>
                            {t.id === curId && (
                              <span className="text-xs text-muted-foreground">current</span>
                            )}
                            {t.id === selectedTerm.id && (
                              <i className="fa-light fa-check" aria-hidden="true" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </Fragment>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className={`grid grid-cols-1 gap-3 ${bandTerms.length > 3 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
                {bandTerms.map((snap) => (
                  <TermCard
                    key={snap.term.id}
                    snap={snap}
                    isSelected={snap.term.id === selectedTerm.id}
                    isCurrentTerm={snap.term.id === curId}
                  />
                ))}
              </div>
            </nav>

            {/* ── Detail zone — scoped to the selected term ── */}
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                {selectedTerm.name}
              </h2>
              <p className="text-xs text-muted-foreground tabular-nums">
                {enrolledTotal > 0 ? (
                  <>
                    <span className="font-medium text-foreground">
                      {responsesCollected.toLocaleString()} of {enrolledTotal.toLocaleString()} students responded
                    </span>
                    {closingThisWeek > 0 ? (
                      <> · <span className="font-medium text-foreground">{closingThisWeek} closing this week</span></>
                    ) : null}
                    {' · '}
                  </>
                ) : null}
                {window.open} – {window.close} · AY {selectedTerm.academicYear}
              </p>
            </div>

            {reminderSentTo && (
              <LocalBanner
                variant="success"
                title="Reminder sent"
                dismissible
                onDismiss={() => setReminderSentTo(null)}
              >
                An ad-hoc reminder went out to non-responders in {reminderSentTo}.
              </LocalBanner>
            )}

            {/* Evaluations — the worklist comes before the analysis. At-risk
                rows carry Remind + Extend inline (the Needs-attention card was
                removed; interventions live on the rows themselves). */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Evaluations ({tableRows.length})
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="px-0 text-muted-foreground hover:text-foreground"
                >
                  <Link href="/surveys">
                    Open Evaluations hub
                    <i className="fa-light fa-arrow-right" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
              <DataTablePaginated<SurveyRow>
                data={tableRows}
                columns={columns}
                getRowId={(row) => row.id}
                pagination={{ pageSize: 10 }}
                edgeInset={false}
                stickyHeader={false}
                onRowClick={(row) => router.push(`/results/${row.id}`)}
                emptyState={
                  tableRows.length > 0 ? (
                    /* Rows exist — this empty state means search/filters excluded them. */
                    <div className="flex flex-col items-center gap-2 py-8">
                      <i className="fa-light fa-filter-circle-xmark text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                      <p className="text-sm font-medium">No evaluations match</p>
                      <p className="text-xs text-muted-foreground">
                        Adjust or clear the search and filters above.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8">
                      <i className="fa-light fa-calendar-plus text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                      <p className="text-sm font-medium">No evaluations in {selectedTerm.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Send evaluations to populate this term.
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/surveys/push?term=${selectedTerm.id}`}>
                          Set up {selectedTerm.name} evaluations
                        </Link>
                      </Button>
                    </div>
                  )
                }
              />
            </section>

          </div>
        )}
      </div>

      <SetupTermSheet open={setupOpen} onOpenChange={setSetupOpen} />

      {/* Extend close date — same dialog the hub uses (PRD: single or bulk) */}
      <EditEndDateDialog
        open={extendTargets.length > 0}
        onOpenChange={(v) => !v && setExtendTargets([])}
        surveys={extendTargets}
      />

      <SendReminderDialog
        open={remindTargets.length > 0}
        onOpenChange={(v) => !v && setRemindTargets([])}
        surveys={remindTargets}
        onSent={(codes) => {
          setReminderSentTo(codes)
          setRemindedIds((prev) => {
            const next = new Set(prev)
            remindTargets.forEach((t) => next.add(t.id))
            return next
          })
        }}
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
      <i
        className="fa-light fa-calendar-plus text-muted-foreground"
        aria-hidden="true"
        style={{ fontSize: 32 }}
      />
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
