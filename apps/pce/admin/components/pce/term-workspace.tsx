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
//
// 2026-08-13 (Granola 0ef80c33, Vishal, raw transcript: "there are like some
// of the surveys which are yet to be completed... so I would say DPT-611 and
// then what's the response rate to that... not in every case you'll be
// seeing all these different rows, the breakups... it should be just
// available and just directly say point out that this is the response rate
// right now") — ONE row per offering now, not one per evaluation type
// (Course / Faculty used to each get their own row with their own rate).
// The offering-level roll-up already lives on PceSurvey itself
// (status/responseRate/responseCount/enrollmentCount/deadline — see that
// interface's own comment: "the KPIs, board, and results read these and are
// unaffected" by the per-type breakdown), so this reads it directly instead
// of expanding through evaluationsFor()/EvaluationInstance INTO ROWS. That
// function is still called once per row (not to build rows, just to check
// whether course_material is one of this survey's types) — a collapsed row
// only showed faculty avatars at first, silently dropping the fact that
// course content is also being evaluated (caught live, 2026-08-13, on a row
// with zero faculty context otherwise implying it).
// ============================================================================

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Badge, Tip,
  Button,
  KeyMetrics,
  Skeleton,
  ToggleGroup, ToggleGroupItem,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadgeOS } from '@/components/pce/pce-badges'
import { ModerationSheet } from '@/components/pce/moderation-sheet'
import { ResponseProgressCell } from '@/components/pce/response-gauge'
import { FacultyAvatarRow } from '@/components/pce/faculty-avatar-row'
import { TermEvaluationsBoard } from '@/components/pce/term-evaluations-board'
import { EditEndDateDialog } from '@/components/pce/pce-modals'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'
import {
  RESPONSE_TARGET, LIVE, isResumable, resumeHref as resumeHrefFor,
  daysUntil, weightedRate, evalWindow, coverageFor, termsOrdered,
} from '@/lib/pce-term-metrics'
import { evaluationsFor } from '@/lib/pce-evaluations'
import { type PceSurvey, type SurveyStatus } from '@/lib/pce-mock-data'
import { withFrom } from '@/lib/pce-nav-origin'

/* One row = one offering's evaluation, the roll-up across every aspect it
 * covers (course material + every faculty role). */
type EvalRow = {
  id: string // surveyId
  surveyId: string
  courseCode: string
  courseName: string
  status: SurveyStatus
  responseRate: number
  responseCount: number
  enrollmentCount: number
  deadline: string
  /** True when this offering's evaluation types include course_material —
   *  most do (see pce-evaluations.ts derive()), but this reads the real
   *  per-type source rather than assuming, since explicit `survey.evaluations`
   *  setup data could omit it. */
  hasCourseMaterial: boolean
  /** True when this offering's close date is later than the term's own
   *  standard close (evalWindow) — a per-course override, not the norm. */
  extended: boolean
  /** Draft, or a Scheduled survey re-opened for editing — routes back into
   *  the push wizard instead of results (see isResumable in pce-term-
   *  metrics.ts). A draft otherwise has no edit path from this table at
   *  all — caught live, 2026-08-13: its row click went to /results (empty,
   *  nothing collected yet) and its "..." menu only offered View results /
   *  Preview form. */
  resumable: boolean
  survey: PceSurvey
} & Record<string, unknown>

/* Per-evaluation lifecycle predicates (a single instance's status). */
const isLive = (st: SurveyStatus) => st === 'active' || st === 'collecting'
const isFinished = (st: SurveyStatus) =>
  st === 'pending_review' || st === 'closed' || st === 'released'

/* Needs-attention first, then lowest response rate. */
const STATUS_ORDER: Record<string, number> = {
  active: 0, collecting: 0, pending_review: 1, closed: 1, released: 2, scheduled: 3, draft: 4,
}

/* ── page ─────────────────────────────────────────────────────────────────── */
function TermWorkspaceInner() {
  const params = useParams<{ termId: string }>()
  const router = useRouter()
  const { surveys } = usePce()

  const term = termsOrdered.find((t) => t.id === params?.termId)
  /* Canonical results origin (pce-nav-origin) so /results/[id] breadcrumbs back
   * HERE, not the Results hub. Built with withFrom(), same as every other
   * entry link — never a hand-rolled query string. */
  const fromOrigin = term ? `term:${term.id}` : null

  const [moderationId, setModerationId] = useState<string | null>(null)
  const [extendTargets, setExtendTargets] = useState<PceSurvey[]>([])
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
  /* Needed inside tableRows (extension detection) — computed before the
   * `!term` early return below, so guarded for an undefined term here. */
  const evalWin = term ? evalWindow(term) : null

  /* One row per offering, using the survey-level roll-up directly (no more
   * per-type expansion — see file header). Needs-attention first, then
   * lowest response rate. */
  const tableRows: EvalRow[] = useMemo(() => {
    return [...termSurveys]
      .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) || a.responseRate - b.responseRate)
      .map((s): EvalRow => {
        const closeTime = evalWin ? new Date(evalWin.close).getTime() : NaN
        const deadlineTime = s.deadline ? new Date(s.deadline).getTime() : NaN
        const extended = Number.isFinite(closeTime) && Number.isFinite(deadlineTime) && deadlineTime > closeTime
        const hasCourseMaterial = evaluationsFor(s).some((e) => e.type === 'course_material')
        return {
          id: s.id,
          surveyId: s.id,
          courseCode: s.courseCode,
          courseName: s.courseName,
          status: s.status,
          responseRate: s.responseRate,
          responseCount: s.responseCount,
          enrollmentCount: s.enrollmentCount,
          deadline: s.deadline,
          hasCourseMaterial,
          extended,
          resumable: isResumable(s),
          survey: s,
        }
      })
  }, [termSurveys, evalWin])

  /* ── columns — one row per offering, proper columns + independent actions ── */
  const columns: ColumnDef<EvalRow>[] = useMemo(() => {
    /* Existing remind contract (surveys/remind reads ?ids + ?from only). */
    const remindHref = (surveyId: string) =>
      `/surveys/remind?ids=${surveyId}${fromOrigin ? `&from=${encodeURIComponent(fromOrigin)}` : ''}`
    const resultsHref = (surveyId: string) => withFrom(`/results/${surveyId}`, fromOrigin)
    /* term is guaranteed by the time any row actually renders (the `!term`
     * early return below empties tableRows first) — the `?? ''` here only
     * covers columns' own definition, which runs before that check. */
    const editHref = (survey: PceSurvey) => resumeHrefFor(survey, term?.id ?? '')
    return [
      {
        key: 'courseCode',
        label: 'Course',
        sortable: true,
        width: 260,
        filter: { type: 'text', icon: 'fa-book-open' },
        cell: (row) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{row.courseCode} · {row.courseName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {/* Same "Course material" chip vocabulary as Step 2's Evaluates
                  column (EvaluateeChipCluster) — a collapsed row otherwise
                  shows only faculty, silently dropping the fact that course
                  content is evaluated too whenever there's no other visual
                  cue for it. */}
              {row.hasCourseMaterial && (
                <Tip label="Course material is also evaluated" side="top">
                  <Badge
                    tabIndex={0}
                    variant="outline"
                    className="h-6 gap-1 border-border bg-background px-2 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  >
                    <i className="fa-light fa-book-open text-[10px]" aria-hidden="true" />
                    Course
                  </Badge>
                </Tip>
              )}
              <FacultyAvatarRow instructors={row.survey.instructors} />
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        width: 190,
        cell: (row) => <SurveyStatusBadgeOS status={row.status} />,
      },
      {
        key: 'responseRate',
        label: 'Response rate',
        sortable: true,
        width: 210,
        cell: (row) =>
          row.responseCount > 0 || isLive(row.status) ? (
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
        width: 150,
        cell: (row) => {
          const d = row.deadline ? daysUntil(row.deadline) : null
          if (isLive(row.status) && d != null) {
            return (
              <div>
                <p className="flex items-center gap-1.5 text-sm tabular-nums">
                  {row.deadline}
                  {row.extended && (
                    <Tip label={`Extended past the term's standard close (${evalWin?.close})`} side="top">
                      <span tabIndex={0} className="inline-flex shrink-0 items-center outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                        <i className="fa-solid fa-star text-[10px]" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
                        <span className="sr-only"> — extended</span>
                      </span>
                    </Tip>
                  )}
                </p>
                <p className="text-xs tabular-nums" style={{ color: d <= 3 ? 'var(--chip-4)' : 'var(--muted-foreground)' }}>
                  {d <= 0 ? 'closes today' : `${d}d left`}
                </p>
              </div>
            )
          }
          return <span className="text-xs text-muted-foreground">{row.deadline || '—'}</span>
        },
      },
      {
        /* Independent per-offering actions — remind non-responders, extend
         * the close date, review/release this evaluation. */
        key: 'actions',
        label: '',
        width: 210,
        cell: (row) => {
          const atRisk = isLive(row.status) && row.responseRate < AT_RISK_THRESHOLD
          const label = `${row.courseCode} evaluation`
          /* Draft (or a Scheduled survey re-opened for editing) has nothing
             else meaningful here — no results, no reminders, no window to
             extend — so this is the row's ONLY action, not one option among
             several. */
          if (row.resumable) {
            return (
              <div className="flex items-center justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={editHref(row.survey)} onClick={(e) => e.stopPropagation()} aria-label={`Edit the ${label}`}>
                    Edit
                  </Link>
                </Button>
              </div>
            )
          }
          return (
            <div className="flex items-center justify-end gap-1">
              {isLive(row.status) && (
                <Button
                  variant={atRisk ? 'outline' : 'ghost'}
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); router.push(remindHref(row.surveyId)) }}
                  aria-label={`Send a reminder for the ${label}`}
                >
                  Remind
                </Button>
              )}
              {isLive(row.status) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setExtendTargets([row.survey]) }}
                  aria-label={`Extend the close date for the ${label}`}
                >
                  Extend
                </Button>
              )}
              {isFinished(row.status) && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={resultsHref(row.surveyId)} onClick={(e) => e.stopPropagation()} aria-label={`View results for the ${label}`}>
                    View results
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`More actions for the ${label}`} onClick={(e) => e.stopPropagation()}>
                    <i className="fa-light fa-ellipsis" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onSelect={() => router.push(resultsHref(row.surveyId))}>View results</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => router.push(`/surveys/${row.surveyId}/preview`)}>Preview form</DropdownMenuItem>
                  {(row.status === 'pending_review' || row.status === 'closed') && (
                    <DropdownMenuItem onSelect={() => setModerationId(row.surveyId)}>Review responses</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ]
  }, [router, fromOrigin, term?.id])

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
        : `Target ${RESPONSE_TARGET}%`,
    },
    {
      id: 'pending', label: 'Still to respond',
      value: stillToRespond.toLocaleString(),
      delta: '', trend: 'neutral',
      description: 'Students · reminders reach them',
    },
    {
      id: 'coverage', label: 'Courses with evaluations',
      value: coverage ? `${coverage.surveyed} of ${coverage.total}` : '—',
      delta: '', trend: 'neutral',
      description: notSetUp > 0 ? `${notSetUp} not set up yet` : 'Every course is set up',
    },
    {
      id: 'closing', label: 'Closing this week',
      value: closingSoon.length,
      delta: '', trend: 'neutral',
      description: closingSoon.length > 0 ? 'Evaluations end within 7 days' : 'No windows ending soon',
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
            {evalWin?.open} – {evalWin?.close} · AY {term.academicYear}
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
                <TermEvaluationsBoard surveys={termSurveys} termId={term.id} evalClose={evalWin?.close} />
              ) : (
                <DataTablePaginated<EvalRow>
                  data={tableRows}
                  columns={columns}
                  getRowId={(row) => row.id}
                  /* No bulk workflow on this table — checkboxes + the floating
                     "N selected · Export · Delete" bar were noise, and Delete
                     had no real path here (Romit 2026-07-19). */
                  selectable={false}
                  pagination={{ pageSize: 16 }}
                  edgeInset={false}
                  stickyHeader={false}
                  onRowClick={(row) => router.push(
                    row.resumable
                      ? resumeHrefFor(row.survey, term.id)
                      : withFrom(`/results/${row.surveyId}`, fromOrigin),
                  )}
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
