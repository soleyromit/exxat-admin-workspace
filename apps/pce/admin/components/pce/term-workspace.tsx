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
import { TermEvaluationsBoard } from '@/components/pce/term-evaluations-board'
import { EditEndDateDialog } from '@/components/pce/pce-modals'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'
import {
  RESPONSE_TARGET, LIVE,
  daysUntil, weightedRate, evalWindow, coverageFor, termsOrdered,
} from '@/lib/pce-term-metrics'
import {
  EVALUATION_TYPE_LABEL,
  EVALUATION_TYPE_ICON,
  type PceSurvey,
  type EvaluationType,
  type EvaluationInstance,
  type SurveyStatus,
} from '@/lib/pce-mock-data'
import { evaluationsFor } from '@/lib/pce-evaluations'
import { withFrom } from '@/lib/pce-nav-origin'

/* One row = one evaluation (Course or Faculty) of one offering. Rows group by
 * course, so each offering is a header with its Course + Faculty rows beneath —
 * each row its own status, response, close date, and independent actions. */
type EvalRow = {
  id: string // `${surveyId}:${type}`
  surveyId: string
  courseCode: string
  courseName: string
  evaluationType: EvaluationType
  typeLabel: string
  status: SurveyStatus
  responseRate: number
  responseCount: number
  enrollmentCount: number
  deadline: string
  survey: PceSurvey
} & Record<string, unknown>

/* Per-evaluation lifecycle predicates (a single instance's status). */
const isLive = (st: SurveyStatus) => st === 'active' || st === 'collecting'
const isFinished = (st: SurveyStatus) =>
  st === 'pending_review' || st === 'closed' || st === 'released'

function primaryInstructor(s: PceSurvey) {
  return s.instructors.find((i) => i.role === 'primary') ?? s.instructors[0] ?? null
}

function primaryInstructorName(s: PceSurvey): string {
  return primaryInstructor(s)?.name ?? ''
}

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

  /* Flatten to one row per (offering × evaluation type). Offerings are ordered
   * needs-attention-first by their most-urgent type, then lowest response; the
   * three type rows stay in canonical order within each offering. */
  const tableRows: EvalRow[] = useMemo(() => {
    const rank = (evals: EvaluationInstance[]) => ({
      minStatus: Math.min(...evals.map((e) => STATUS_ORDER[e.status] ?? 9)),
      minRate: Math.min(...evals.map((e) => e.responseRate)),
    })
    return termSurveys
      .map((s) => {
        const evals = evaluationsFor(s)
        return { s, evals, r: rank(evals) }
      })
      .sort((a, b) => a.r.minStatus - b.r.minStatus || a.r.minRate - b.r.minRate)
      .flatMap(({ s, evals }) =>
        evals.map((e): EvalRow => ({
          id: `${s.id}:${e.type}`,
          surveyId: s.id,
          courseCode: s.courseCode,
          courseName: s.courseName,
          evaluationType: e.type,
          typeLabel: EVALUATION_TYPE_LABEL[e.type],
          status: e.status,
          responseRate: e.responseRate,
          responseCount: e.responseCount,
          enrollmentCount: e.enrollmentCount,
          deadline: e.deadline,
          survey: s,
        })),
      )
  }, [termSurveys])

  /* Group header = the offering (shown once); the rows under it are its
   * Course + Faculty evaluations. */
  const groupLabels = useMemo(() => {
    const m: Record<string, string> = {}
    for (const s of termSurveys) m[s.courseCode] = `${s.courseCode} · ${s.courseName}`
    return m
  }, [termSurveys])
  const groupOrder = useMemo(() => {
    const seen: string[] = []
    for (const r of tableRows) if (!seen.includes(r.courseCode)) seen.push(r.courseCode)
    return seen
  }, [tableRows])

  /* ── columns — one row per evaluation, proper columns + independent actions ── */
  const columns: ColumnDef<EvalRow>[] = useMemo(() => {
    /* Existing remind contract (surveys/remind reads ?ids + ?from only). The
     * button is per-evaluation; scoping the wizard to a single type's
     * non-responders is the follow-up (no dead param shipped now). */
    const remindHref = (surveyId: string) =>
      `/surveys/remind?ids=${surveyId}${fromOrigin ? `&from=${encodeURIComponent(fromOrigin)}` : ''}`
    const resultsHref = (surveyId: string) => withFrom(`/results/${surveyId}`, fromOrigin)
    return [
      {
        key: 'typeLabel',
        label: 'Evaluation',
        sortable: false,
        width: 210,
        filter: { type: 'text', icon: 'fa-list-check' },
        cell: (row) => {
          /* Faculty row names who's being evaluated; Course row is course-level. */
          const instr = row.evaluationType === 'faculty_roles' ? primaryInstructor(row.survey) : null
          const extra = row.survey.instructors.length - 1
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <i className={`fa-light ${EVALUATION_TYPE_ICON[row.evaluationType]} w-4 shrink-0 text-center text-muted-foreground`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{row.typeLabel}</p>
                {instr && (
                  <p className="truncate text-xs text-muted-foreground">
                    {instr.name}{extra > 0 ? ` +${extra}` : ''}
                  </p>
                )}
              </div>
            </div>
          )
        },
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        width: 140,
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
        width: 130,
        cell: (row) => {
          const d = row.deadline ? daysUntil(row.deadline) : null
          if (isLive(row.status) && d != null) {
            return (
              <div>
                <p className="text-sm tabular-nums">{row.deadline}</p>
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
        /* Independent per-evaluation actions — remind THIS eval's non-responders,
         * extend THIS eval's close date, review/release THIS eval. */
        key: 'actions',
        label: '',
        width: 210,
        cell: (row) => {
          const atRisk = isLive(row.status) && row.responseRate < AT_RISK_THRESHOLD
          const label = `${row.typeLabel} evaluation · ${row.courseCode}`
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
  }, [router, fromOrigin])

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
                <DataTablePaginated<EvalRow>
                  data={tableRows}
                  columns={columns}
                  getRowId={(row) => row.id}
                  defaultGroupBy="courseCode"
                  groupLabels={groupLabels}
                  groupOrder={groupOrder}
                  pagination={{ pageSize: 16 }}
                  edgeInset={false}
                  stickyHeader={false}
                  onRowClick={(row) => router.push(withFrom(`/results/${row.surveyId}`, fromOrigin))}
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
