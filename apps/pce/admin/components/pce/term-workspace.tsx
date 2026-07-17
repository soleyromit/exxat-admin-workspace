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
import { TermEvaluationsBoard } from '@/components/pce/term-evaluations-board'
import {
  RESPONSE_TARGET, LIVE,
  daysUntil, weightedRate, evalWindow, coverageFor, termsOrdered,
} from '@/lib/pce-term-metrics'
import {
  EVALUATION_TYPE_LABEL,
  EVALUATION_TYPE_ICON,
  type PceSurvey,
  type EvaluationInstance,
} from '@/lib/pce-mock-data'
import { evaluationsFor } from '@/lib/pce-evaluations'
import { withFrom } from '@/lib/pce-nav-origin'

/* One row = one course OFFERING. Its three evaluation types (Course Material /
 * Faculty and other roles / General) render as a compact status glance in the
 * Evaluations cell — all three statuses visible at once, no expanding. */
type OfferingRow = {
  id: string // surveyId
  courseCode: string
  courseName: string
  faculty: string
  /** Most-urgent type's status order + lowest rate — drives needs-attention sort. */
  minStatus: number
  minRate: number
  evals: EvaluationInstance[]
  survey: PceSurvey
} & Record<string, unknown>

function primaryInstructorName(s: PceSurvey): string {
  return (s.instructors.find((i) => i.role === 'primary') ?? s.instructors[0])?.name ?? ''
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
  const tableRows: OfferingRow[] = useMemo(() => {
    const rank = (evals: EvaluationInstance[]) => ({
      minStatus: Math.min(...evals.map((e) => STATUS_ORDER[e.status] ?? 9)),
      minRate: Math.min(...evals.map((e) => e.responseRate)),
    })
    return termSurveys
      .map((s): OfferingRow => {
        const evals = evaluationsFor(s)
        const r = rank(evals)
        return {
          id: s.id,
          courseCode: s.courseCode,
          courseName: s.courseName,
          faculty: primaryInstructorName(s),
          minStatus: r.minStatus,
          minRate: r.minRate,
          evals,
          survey: s,
        }
      })
      .sort((a, b) => a.minStatus - b.minStatus || a.minRate - b.minRate)
  }, [termSurveys])

  /* ── table columns — one row per evaluation TYPE, grouped by offering ── */
  const columns: ColumnDef<OfferingRow>[] = useMemo(() => {
    /* Existing remind contract (surveys/remind reads ?ids + ?from only). Per-type
     * reminder targeting will extend THIS route when the wizard supports it —
     * not a dead param shipped early. */
    const remindHref = (surveyId: string) =>
      `/surveys/remind?ids=${surveyId}${fromOrigin ? `&from=${encodeURIComponent(fromOrigin)}` : ''}`
    /* Canonical results link (pce-nav-origin.withFrom). Offering-level today; a
     * per-type results view would extend /results and this href together. */
    const resultsHref = (surveyId: string) => withFrom(`/results/${surveyId}`, fromOrigin)
    return [
      {
        key: 'courseCode',
        label: 'Course',
        sortable: true,
        width: 230,
        filter: { type: 'text', icon: 'fa-book' },
        cell: (row) => (
          <div className="min-w-0 py-0.5">
            <p className="font-mono text-xs text-muted-foreground">{row.courseCode}</p>
            <p className="max-w-[200px] truncate text-sm font-medium">{row.courseName}</p>
          </div>
        ),
      },
      {
        /* All three evaluation types + their statuses on ONE row — the glance.
         * type label · status badge · response (or lifecycle note). */
        key: 'evaluations',
        label: 'Evaluations',
        sortable: false,
        cell: (row) => (
          <div className="flex flex-col gap-2.5 py-1.5">
            {row.evals.map((e) => {
              const pending = e.status === 'scheduled' || e.status === 'draft'
              return (
                <div key={e.type} className="flex items-center gap-3 whitespace-nowrap text-sm">
                  <span className="flex w-52 shrink-0 items-center gap-2 text-muted-foreground">
                    <i className={`fa-light ${EVALUATION_TYPE_ICON[e.type]} w-4 shrink-0 text-center`} aria-hidden="true" />
                    <span className="truncate">{EVALUATION_TYPE_LABEL[e.type]}</span>
                  </span>
                  <span className="w-24 shrink-0">
                    <SurveyStatusBadgeOS status={e.status} />
                  </span>
                  <span className="w-52 shrink-0 truncate text-xs tabular-nums text-muted-foreground">
                    {pending
                      ? (e.status === 'scheduled'
                          ? (e.deadline ? `opens soon · closes ${e.deadline}` : 'opens soon')
                          : 'not pushed yet')
                      : `${e.responseCount} of ${e.enrollmentCount} responded · ${e.responseRate}%`}
                  </span>
                </div>
              )
            })}
          </div>
        ),
      },
      {
        key: 'actions',
        label: '',
        width: 130,
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="outline" size="sm" asChild>
              <Link
                href={resultsHref(row.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Open ${row.courseCode}`}
              >
                View
              </Link>
            </Button>
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
                <DropdownMenuItem onSelect={() => router.push(resultsHref(row.id))}>
                  View results
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push(`/surveys/${row.id}/preview`)}>
                  Preview form
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push(remindHref(row.id))}>
                  Send reminder
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setModerationId(row.id)}>
                  Review responses
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
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
                <DataTablePaginated<OfferingRow>
                  data={tableRows}
                  columns={columns}
                  getRowId={(row) => row.id}
                  pagination={{ pageSize: 15 }}
                  edgeInset={false}
                  stickyHeader={false}
                  onRowClick={(row) => router.push(withFrom(`/results/${row.id}`, fromOrigin))}
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
