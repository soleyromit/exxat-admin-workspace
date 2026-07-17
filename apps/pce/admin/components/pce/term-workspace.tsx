'use client'

// ============================================================================
// Term workspace — the dedicated page a term card opens to (Jul 10 2026).
//
// IA: breadcrumb Dashboard → {Term}. One term, one job: read the cycle's health,
// then intervene:
//   1. KPI strip        — response rate / responses / coverage / closing soon.
//   2. Evaluation table — the canonical course-evaluation worklist, term-scoped,
//                        with Remind / Extend inline on at-risk rows.
//
// No red (aarti_no_red): teal --chart-2 good · amber --chart-4/--chip-4 risk.
// This page says "evaluations", never "surveys".
// ============================================================================

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Badge,
  Button,
  KeyMetrics,
  PersonIdentityCell,
  Skeleton,
  ToggleGroup, ToggleGroupItem,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Tooltip, TooltipTrigger, TooltipContent,
} from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { TruncatedText } from '@/components/truncated-text'
import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadgeOS } from '@/components/pce/pce-badges'
import { EditEndDateDialog } from '@/components/pce/pce-modals'
import { ModerationSheet } from '@/components/pce/moderation-sheet'
import { ResponseProgressCell } from '@/components/pce/response-gauge'
import { TermEvaluationsBoard } from '@/components/pce/term-evaluations-board'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'
import {
  RESPONSE_TARGET, LIVE, FINISHED,
  daysUntil, weightedRate, evalWindow, coverageFor, termsOrdered,
} from '@/lib/pce-term-metrics'
import type { PceSurvey } from '@/lib/pce-mock-data'

type SurveyRow = PceSurvey & Record<string, unknown>


function primaryInstructorName(s: PceSurvey): string {
  return (s.instructors.find((i) => i.role === 'primary') ?? s.instructors[0])?.name ?? ''
}

/* Needs-attention first, then lowest response rate. */
const STATUS_ORDER: Record<string, number> = {
  active: 0, collecting: 0, pending_review: 1, closed: 1, released: 2, scheduled: 3, draft: 4,
}

/* Legacy survey courseType → display label (matches the push wizard's
 * Courses & Evaluatees type vocabulary). */
const COURSE_TYPE_LABEL: Record<string, string> = {
  didactic: 'Classroom based',
  clinical: 'Practice based',
}

const COURSE_TYPE_FILTER_OPTIONS = [
  { value: 'didactic', label: 'Classroom based' },
  { value: 'clinical', label: 'Practice based' },
]

const STATUS_FILTER_OPTIONS = [
  { value: 'draft',          label: 'Draft' },
  { value: 'scheduled',      label: 'Scheduled' },
  { value: 'collecting',     label: 'Collecting Responses' },
  { value: 'active',         label: 'Active' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'released',       label: 'Results Released' },
  { value: 'closed',         label: 'Closed' },
]

/* ── page ─────────────────────────────────────────────────────────────────── */
function TermWorkspaceInner() {
  const params = useParams<{ termId: string }>()
  const router = useRouter()
  const { surveys } = usePce()

  const term = termsOrdered.find((t) => t.id === params?.termId)
  /* Origin param so /results/[id] breadcrumbs back HERE, not the Results hub. */
  const fromQ = term ? `?from=${encodeURIComponent(`term:${term.id}`)}` : ''

  const [extendTargets, setExtendTargets] = useState<PceSurvey[]>([])
  const [moderationId, setModerationId] = useState<string | null>(null)
  const [evalView, setEvalView] = useState<'table' | 'board'>('table')

  const ce = useMemo(
    () => surveys.filter((s) => !s.surveyType || s.surveyType === 'course_evaluation'),
    [surveys],
  )
  const termSurveys = useMemo(
    () => (term ? ce.filter((s) => s.term === term.name) : []),
    [ce, term],
  )

  /* ── derived facts (computed defensively against an undefined term) ── */
  const live = termSurveys.filter(LIVE)
  const closingSoon = live.filter((s) => {
    const d = s.deadline ? daysUntil(s.deadline) : null
    return d != null && d >= 0 && d <= 7
  })
  const coverage = term ? coverageFor(term.id, termSurveys) : null
  const rate = weightedRate(termSurveys)
  const responsesCollected = termSurveys.reduce((s, x) => s + x.responseCount, 0)
  const enrolledTotal = termSurveys.reduce((s, x) => s + x.enrollmentCount, 0)

  const tableRows: SurveyRow[] = useMemo(
    () =>
      [...termSurveys]
        .sort(
          (a, b) =>
            (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) ||
            a.responseRate - b.responseRate,
        )
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

  /* ── table columns (canonical course-evaluation worklist) ── */
  const columns: ColumnDef<SurveyRow>[] = useMemo(() => {
    /* Remind opens the send-reminders wizard (all live courses listed, this row
     * pre-checked), carrying the origin so it routes back here. */
    const remindHref = (ids: string) =>
      `/surveys/remind?ids=${ids}${fromQ ? `&${fromQ.slice(1)}` : ''}`
    return [
      {
        key: 'courseCode',
        label: 'Course',
        sortable: true,
        filter: { type: 'text', icon: 'fa-book' },
        cell: (row) => (
          <Link
            href={`/results/${row.id}${fromQ}`}
            onClick={(e) => e.stopPropagation()}
            className="block min-w-0 hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-sm"
          >
            <p className="text-sm font-medium">
              {row.courseCode}
              {row.evalScope && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  · {row.evalScope === 'course' ? 'Course' : 'Instructor'}
                </span>
              )}
            </p>
            <TruncatedText className="text-xs text-muted-foreground max-w-[220px]">{row.courseName}</TruncatedText>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 min-w-0 w-fit">
                  <PersonIdentityCell name={primary.name} initials={primary.initials} />
                  {extra > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0">+{extra}</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-col gap-0.5">
                  {row.instructors.map((i) => (
                    <span key={i.id} className="text-xs">{i.name} ({i.role})</span>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )
        },
      },
      {
        key: 'courseType',
        label: 'Type',
        sortable: true,
        width: 150,
        filter: { type: 'select', icon: 'fa-shapes', options: COURSE_TYPE_FILTER_OPTIONS },
        cell: (row) =>
          row.courseType ? (
            <Badge variant="outline" className="font-normal whitespace-nowrap">
              {COURSE_TYPE_LABEL[row.courseType] ?? row.courseType}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
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
        width: 200,
        cell: (row) =>
          row.responseCount > 0 || LIVE(row) ? (
            /* Pending-first stat (Romit pick, Jul 10 — no bar): the actionable
             * number leads; the rate line names the target status in words. */
            <ResponseProgressCell
              rate={row.responseRate}
              responseCount={row.responseCount}
              enrollmentCount={row.enrollmentCount}
              target={RESPONSE_TARGET}
            />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
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
        /* Fits the widest inline case — Remind + Extend + ⋯ (~166px of buttons
         * + 24px cell padding) — without the ~70px of dead reserved space that
         * was forcing horizontal scroll on the course list. */
        width: 196,
        cell: (row) => {
          const isAtRisk = LIVE(row) && row.responseRate < AT_RISK_THRESHOLD
          return (
            <div className="flex items-center justify-end gap-1">
              {isAtRisk && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); router.push(remindHref(row.id)) }}
                  aria-label={`Send a reminder for ${row.courseCode}`}
                >
                  Remind
                </Button>
              )}
              {isAtRisk && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setExtendTargets([row]) }}
                  aria-label={`Extend the evaluation window for ${row.courseCode}`}
                >
                  Extend
                </Button>
              )}
              {FINISHED(row) && (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/results/${row.id}${fromQ}`}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`View results for ${row.courseCode}`}
                  >
                    View results
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
                  <DropdownMenuItem onSelect={() => router.push(`/results/${row.id}${fromQ}`)}>
                    View results
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push(`/surveys/${row.id}/preview`)}>
                    Preview form
                  </DropdownMenuItem>
                  {row.status === 'pending_review' && (
                    <DropdownMenuItem onSelect={() => setModerationId(row.id)}>
                      Review responses
                    </DropdownMenuItem>
                  )}
                  {LIVE(row) && !isAtRisk && (
                    <DropdownMenuItem onSelect={() => router.push(remindHref(row.id))}>
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
    ]
  }, [router, facultyOptions, fromQ])

  if (!term) {
    return (
      <div className="flex flex-col flex-1">
        <SiteHeader breadcrumbs={[{ label: 'Dashboard', href: '/course-evaluation/dashboard' }]} title="Term not found" />
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <i className="fa-light fa-calendar-xmark text-3xl text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">That term doesn’t exist.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/course-evaluation/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    )
  }

  const evalWin = evalWindow(term)
  /* Four DISTINCT jobs, each self-explanatory (Romit: "I don't understand
   * this metric" — the old strip said the same fact twice (63% AND 405/641)
   * and used jargon ("courses covered"). Now: how collection is going · who
   * still needs to act · what isn't set up · what's about to close. */
  const stillToRespond = Math.max(0, enrolledTotal - responsesCollected)
  const notSetUp = coverage ? coverage.total - coverage.surveyed : 0
  const kpis: MetricItem[] = [
    {
      id: 'rate', label: 'Response rate',
      value: rate != null ? `${rate}%` : '—',
      delta: '', trend: 'neutral', metricVariant: 'hero',
      description: enrolledTotal > 0
        ? `${responsesCollected.toLocaleString()} of ${enrolledTotal.toLocaleString()} students · target ${RESPONSE_TARGET}%`
        : `target ${RESPONSE_TARGET}%`,
    },
    {
      id: 'pending', label: 'Still to respond',
      value: stillToRespond.toLocaleString(),
      delta: '', trend: 'neutral',
      description: 'students — reminders reach them',
    },
    {
      id: 'coverage', label: 'Courses with evaluations',
      value: coverage ? `${coverage.surveyed} of ${coverage.total}` : '—',
      delta: '', trend: 'neutral',
      description: notSetUp > 0 ? `${notSetUp} not set up yet` : 'every course is set up',
    },
    {
      id: 'closing', label: 'Closing this week',
      value: closingSoon.length,
      delta: '', trend: 'neutral',
      description: closingSoon.length > 0 ? 'evaluations end within 7 days' : 'no windows ending soon',
    },
  ]

  const firstRun = termSurveys.length === 0

  return (
    <div className="flex flex-col flex-1">
      <SiteHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/course-evaluation/dashboard' }]}
        title={term.name}
      />

      {/* Term header */}
      <div className="shrink-0 flex flex-wrap items-end justify-between gap-3 px-7 pt-5 pb-1">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-[22px] font-normal text-foreground">{term.name}</h1>
          <p className="text-xs text-muted-foreground tabular-nums">
            {enrolledTotal > 0 ? (
              <>
                <span className="font-medium text-foreground">
                  {responsesCollected.toLocaleString()} of {enrolledTotal.toLocaleString()} students responded
                </span>
                {' · '}
              </>
            ) : null}
            {evalWin.open} – {evalWin.close} · AY {term.academicYear}
          </p>
        </div>
      </div>

      <div className="flex-1 px-7 py-4">
        {firstRun ? (
          <div className="flex min-h-[min(360px,50vh)] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/25 px-6">
            <i className="fa-light fa-calendar-plus text-3xl text-muted-foreground" aria-hidden="true" />
            <div className="flex flex-col items-center gap-1">
              <h2 className="text-sm font-medium text-foreground">No evaluations in {term.name} yet</h2>
              <p className="text-sm text-muted-foreground" style={{ maxWidth: 340, textAlign: 'center' }}>
                Send evaluations to this term’s course offerings to start collecting responses.
              </p>
            </div>
            <Button variant="default" size="sm" asChild>
              <Link href={`/surveys/push?term=${term.id}`}>Set up {term.name} evaluations</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* KPI strip */}
            <KeyMetrics variant="compact" metricsSingleRow metrics={kpis} />

            {/* ── Evaluations — table ⇄ kanban ── */}
            <section className="flex flex-col gap-2" aria-label="Evaluations">
              <div className="flex items-center justify-end">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  value={evalView}
                  onValueChange={(v) => v && setEvalView(v as 'table' | 'board')}
                  aria-label="Evaluations view"
                >
                  <ToggleGroupItem value="table" aria-label="Table view">
                    <i className="fa-light fa-table-list" aria-hidden="true" />
                    Table
                  </ToggleGroupItem>
                  <ToggleGroupItem value="board" aria-label="Board view">
                    <i className="fa-light fa-square-kanban" aria-hidden="true" />
                    Board
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {evalView === 'board' ? (
                <TermEvaluationsBoard surveys={termSurveys} termId={term.id} />
              ) : (
                <DataTablePaginated<SurveyRow>
                  data={tableRows}
                  columns={columns}
                  getRowId={(row) => row.id}
                  selectable
                  pagination={{ pageSize: 10 }}
                  edgeInset={false}
                  stickyHeader={false}
                  onRowClick={(row) => router.push(`/results/${row.id}${fromQ}`)}
                  emptyState={
                    <div className="flex flex-col items-center gap-2 py-8">
                      <i className="fa-light fa-filter-circle-xmark text-2xl text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm font-medium">No evaluations match</p>
                      <p className="text-xs text-muted-foreground">Adjust or clear the search and filters above.</p>
                    </div>
                  }
                />
              )}
            </section>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <EditEndDateDialog
        open={extendTargets.length > 0}
        onOpenChange={(v) => !v && setExtendTargets([])}
        surveys={extendTargets}
      />
      <ModerationSheet surveyId={moderationId} onClose={() => setModerationId(null)} />
    </div>
  )
}

export function TermWorkspace() {
  return (
    <Suspense
      fallback={
        <div aria-busy="true" aria-label="Loading term workspace" className="flex flex-col flex-1 gap-6 px-7 py-5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <TermWorkspaceInner />
    </Suspense>
  )
}
