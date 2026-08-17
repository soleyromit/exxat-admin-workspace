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
import { ResponseProgressCell } from '@/components/pce/response-gauge'
import { FacultyAvatarRow } from '@/components/pce/faculty-avatar-row'
import { TermEvaluationsBoard } from '@/components/pce/term-evaluations-board'
import { EditEndDateDialog } from '@/components/pce/pce-modals'
import {
  RESPONSE_TARGET, LIVE, isResumable, resumeHref as resumeHrefFor,
  daysUntil, weightedRate, evalWindow, coverageFor, termsOrdered,
} from '@/lib/pce-term-metrics'
import { evaluationsFor } from '@/lib/pce-evaluations'
import {
  type PceSurvey, type SurveyStatus,
  MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_FACULTY,
} from '@/lib/pce-mock-data'
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

/* One row = one term offering with NO evaluation configured yet — same
 * reconciliation term-evaluations-board.tsx's "No survey configured" column
 * already runs (surveyedCodes = courseCode already in this term's surveys).
 * Drafts don't count as unconfigured here, same as the board: a draft
 * already sits in the Scheduled tab, so listing it here too would duplicate
 * the course (board file header, 2026-08-13). */
type SetupRow = { id: string; code: string; name: string; facultyName: string | null } & Record<string, unknown>

/* Per-evaluation lifecycle predicates (a single instance's status). */
const isLive = (st: SurveyStatus) => st === 'active' || st === 'collecting'
const isFinished = (st: SurveyStatus) =>
  st === 'pending_review' || st === 'closed' || st === 'released'
/* Closed but not yet released — the window shut, someone still needs to
 * review before faculty can see it (moderation-sheet.tsx's own release
 * gate). Distinct from `released`, which has nothing left to review. */
const needsReview = (st: SurveyStatus) => st === 'pending_review' || st === 'closed'
/* Extend reaches a survey any time before it's finished — same set
 * EditEndDateDialog's callers already assume elsewhere (surveys-table.tsx). */
const isExtendable = (st: SurveyStatus) => isLive(st) || st === 'scheduled'

/* Needs-attention first, then lowest response rate. */
const STATUS_ORDER: Record<string, number> = {
  active: 0, collecting: 0, pending_review: 1, closed: 1, released: 2, scheduled: 3, draft: 4,
}

/* Status tabs (2026-08-14, Romit) — same four lifecycle groups the board
 * view already columns by (term-evaluations-board.tsx's SURVEY_COLUMN),
 * surfaced as a filter here too so the table can show full row detail one
 * stage at a time instead of only the board's card-sized summary. */
type StatusTab = 'all' | 'not_configured' | 'scheduled' | 'live' | 'closed' | 'published'
function statusTabOf(st: SurveyStatus): Exclude<StatusTab, 'all' | 'not_configured'> {
  if (st === 'draft' || st === 'scheduled') return 'scheduled'
  if (isLive(st)) return 'live'
  if (needsReview(st)) return 'closed'
  return 'published'
}
/* Label matches term-evaluations-board.tsx's column exactly ("No survey
 * configured") — the two views must agree on status vocabulary; a shortened
 * variant here would just recreate the mismatch that column was named to
 * avoid (see term-evaluations-board.tsx file header). */
const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'not_configured', label: 'No survey configured' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'live', label: 'Live' },
  { id: 'closed', label: 'Closed' },
  { id: 'published', label: 'Published' },
]

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

  const [extendTargets, setExtendTargets] = useState<PceSurvey[]>([])
  const [evalView, setEvalView] = useState<'table' | 'board'>('table')
  const [statusTab, setStatusTab] = useState<StatusTab>('all')

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

  /* Offerings in this term with no evaluation configured at all — identical
   * reconciliation to term-evaluations-board.tsx's "No survey configured"
   * column (surveyedCodes set, matched on courseCode via masterCourseId),
   * so the two views count and list the same courses. */
  const setupRows: SetupRow[] = useMemo(() => {
    if (!term) return []
    const surveyedCodes = new Set(termSurveys.map((s) => s.courseCode))
    return MOCK_COURSE_OFFERINGS
      .filter((o) => o.termId === term.id && o.status !== 'archived')
      .flatMap((o) => {
        const course = MOCK_MASTER_COURSES.find((c) => c.id === o.masterCourseId)
        if (!course || surveyedCodes.has(course.code)) return []
        const faculty = MOCK_FACULTY.find((f) => f.id === o.primaryFacultyId)
        return [{ id: o.id, code: course.code, name: course.name, facultyName: faculty?.name ?? null }]
      })
  }, [term, termSurveys])

  /* Status tab counts — computed off the full set so a count never changes
   * just because a different tab happens to be selected. */
  const tabCounts = useMemo(() => {
    const counts: Record<StatusTab, number> = { all: tableRows.length, not_configured: setupRows.length, scheduled: 0, live: 0, closed: 0, published: 0 }
    for (const row of tableRows) counts[statusTabOf(row.status)]++
    return counts
  }, [tableRows, setupRows])
  const visibleRows = useMemo(
    () => statusTab === 'all' ? tableRows : tableRows.filter((row) => statusTabOf(row.status) === statusTab),
    [tableRows, statusTab],
  )

  /* Existing remind contract (surveys/remind reads ?ids + ?from only) —
   * accepts one id or several (bulk) joined the same way surveys-table.tsx's
   * own push link already does. Hoisted out of `columns` below so the
   * bulk-action bar (JSX, not a column) can reuse it too. */
  const remindHref = (surveyIds: string | string[]) =>
    `/surveys/remind?ids=${Array.isArray(surveyIds) ? surveyIds.join(',') : surveyIds}${fromOrigin ? `&from=${encodeURIComponent(fromOrigin)}` : ''}`

  /* ── columns — one row per offering, proper columns + independent actions ── */
  const columns: ColumnDef<EvalRow>[] = useMemo(() => {
    const resultsHref = (surveyId: string) => withFrom(`/results/${surveyId}`, fromOrigin)
    /* term is guaranteed by the time any row actually renders (the `!term`
     * early return below empties tableRows first) — the `?? ''` here only
     * covers columns' own definition, which runs before that check. */
    const editHref = (survey: PceSurvey) => resumeHrefFor(survey, term?.id ?? '')
    return [
      // Leading checkbox column — required for `selectable` to render
      // checkboxes + the bulk-action bar (surveys-table.tsx precedent).
      { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
      {
        key: 'courseCode',
        label: 'Course',
        sortable: true,
        width: 230,
        filter: { type: 'text', icon: 'fa-book-open' },
        cell: (row) => (
          <div className="min-w-0">
            {/* title — narrower column (2026-08-14, to fit the whole table
                without horizontal scroll) truncates a longer name more
                often; without this a keyboard/hover user had no way to
                recover it. */}
            <p className="truncate text-sm font-medium" title={`${row.courseCode} · ${row.courseName}`}>{row.courseCode} · {row.courseName}</p>
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
        // 208 — the widest real label this vocabulary has ("Closed ·
        // Pending review", ~192px rendered) wraps to a tall two-line pill
        // below ~200px (caught live, 2026-08-14); 208 is the narrowest that
        // still measures a full 16px clear on both sides — trimmed this far
        // (not left at 220) specifically to let the whole row fit without
        // horizontal scroll (2026-08-14, next catch).
        width: 208,
        cell: (row) => <SurveyStatusBadgeOS status={row.status} />,
      },
      {
        key: 'responseRate',
        label: 'Response rate',
        sortable: true,
        width: 204,
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
        width: 146,
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
          // text-sm/tabular-nums — matches the Live-row date line above
          // (2026-08-14, Romit's catch: this fallback rendered at text-xs,
          // so the same kind of date read visibly smaller depending only on
          // whether the row happened to be Live).
          return <span className="text-sm tabular-nums text-muted-foreground">{row.deadline || '—'}</span>
        },
      },
      {
        /* Independent per-offering actions — remind non-responders, extend
         * the close date, review/release this evaluation. */
        key: 'actions',
        label: '',
        // 264 — wide enough that every button combination (icons + the
        // longest label, "Review and publish" + "···") clears the cell's
        // own px-3 padding with real breathing room on both sides; at 210
        // the buttons filled the column edge-to-edge and visibly touched
        // the divider lines (caught live, 2026-08-14).
        width: 264,
        cell: (row) => {
          const label = `${row.courseCode} evaluation`
          /* Draft (or a Scheduled survey re-opened for editing) has nothing
             else meaningful here — no results, no reminders, no window to
             extend — so this is the row's ONLY action, not one option among
             several. "Set up evaluation" for a true Draft (2026-08-14,
             Romit) — it's never been through the wizard, so "Edit" implied
             an existing thing to change; a re-opened Scheduled survey IS an
             existing thing, so it keeps "Edit". */
          if (row.resumable) {
            const isDraft = row.status === 'draft'
            // Verb-only for the aria-label template ("Set up the DPT-611
            // evaluation") — the visible button text ("Set up evaluation")
            // already carries its own noun, so reusing it verbatim in
            // `${x} the ${label}` doubled "evaluation" (caught by compliance
            // review, 2026-08-14: "Set up evaluation the DPT-611 evaluation").
            const setupVerb = isDraft ? 'Set up' : 'Edit'
            return (
              <div className="flex items-center justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={editHref(row.survey)} onClick={(e) => e.stopPropagation()} aria-label={`${setupVerb} the ${label}`}>
                    {/* Icons on this row's actions (2026-08-14, Romit) —
                        reuses fa-pen-ruler/fa-pen, the exact icons the
                        status vocabulary + surveys-table.tsx's own Edit
                        item already use for these two verbs. */}
                    <i className={`fa-light ${isDraft ? 'fa-pen-ruler' : 'fa-pen'}`} aria-hidden="true" />
                    {isDraft ? 'Set up evaluation' : 'Edit'}
                  </Link>
                </Button>
              </div>
            )
          }
          return (
            <div className="flex items-center justify-end gap-1">
              {/* One consistent style always (2026-08-14, Romit's catch) —
                  this used to switch to `outline` under the at-risk
                  threshold (AT_RISK_THRESHOLD, pce-at-risk.ts), which read
                  as a random inconsistency rather than a signal: the
                  Response rate bar in the same row already color-codes
                  urgency, on its own 3-tier scale that doesn't line up with
                  this button's single 60% cutoff anyway. `outline`, not
                  `ghost` (2026-08-14, Romit's next catch) — Remind/Extend
                  are actions the admin actually has to take on a Live row,
                  same weight as every other primary action in this column
                  (Set up evaluation, Edit, Review and publish, View
                  results), all of which are already `outline`. */}
              {isLive(row.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); router.push(remindHref(row.surveyId)) }}
                  aria-label={`Send a reminder for the ${label}`}
                >
                  <i className="fa-light fa-bell" aria-hidden="true" />
                  Remind
                </Button>
              )}
              {isLive(row.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setExtendTargets([row.survey]) }}
                  aria-label={`Extend the close date for the ${label}`}
                >
                  <i className="fa-light fa-calendar-pen" aria-hidden="true" />
                  Extend
                </Button>
              )}
              {/* Closed/pending review — nothing is visible to faculty yet
                  (moderation-sheet's own release gate), so the CTA names
                  the actual next step: open the results/details page,
                  review responses, then release. Once released there's
                  nothing left to review — "View results" stays accurate.
                  Visible label shortened to "Review and publish" (2026-08-14,
                  Romit) — "results" was implied and made the pill crowd the
                  column; the aria-label keeps the fuller phrasing. */}
              {isFinished(row.status) && (
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={resultsHref(row.surveyId)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${needsReview(row.status) ? 'Review and publish results for' : 'View results for'} the ${label}`}
                  >
                    <i className={`fa-light ${needsReview(row.status) ? 'fa-share-from-square' : 'fa-chart-mixed'}`} aria-hidden="true" />
                    {needsReview(row.status) ? 'Review and publish' : 'View results'}
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
                  {/* Finished rows (Closed/Pending review/Released) already
                      have a visible button to this exact destination above
                      — "Review & publish results" or "View results" — so
                      repeating it here just duplicated the same action twice
                      in the same row (caught live, 2026-08-14). Live/
                      Scheduled rows have no such button, so it stays their
                      only path to results. */}
                  {!isFinished(row.status) && (
                    <DropdownMenuItem onSelect={() => router.push(resultsHref(row.surveyId))}>
                      <i className="fa-light fa-chart-mixed" aria-hidden="true" />
                      View results
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => router.push(`/surveys/${row.surveyId}/preview`)}>
                    <i className="fa-light fa-file-magnifying-glass" aria-hidden="true" />
                    Preview form
                  </DropdownMenuItem>
                  {/* "Review responses" (moderation-sheet.tsx) removed
                      (2026-08-14, Romit's catch) — it and "Review & publish
                      results" were the same job twice: the results page's
                      own Student comments section already has the identical
                      per-comment hide/show toggle AND calls the same release
                      action (releaseSurvey === enableResults, pce-state.tsx),
                      just with the scores/themes context the sheet lacked. */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ]
  }, [router, fromOrigin, term?.id])

  /* Columns for the "No survey configured" tab — a bare course offering has
   * none of EvalRow's survey fields (status/response rate/deadline), so this
   * is its own small columns array rather than padding EvalRow with
   * optionals nothing else would use. Same CTA target as the board's
   * SetupBoardCard ("Set up survey" → push wizard scoped to the offering). */
  const setupColumns: ColumnDef<SetupRow>[] = useMemo(() => [
    {
      key: 'code',
      label: 'Course',
      sortable: true,
      width: 320,
      filter: { type: 'text', icon: 'fa-book-open' },
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={`${row.code} · ${row.name}`}>{row.code} · {row.name}</p>
          {row.facultyName && <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.facultyName}</p>}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 180,
      cell: (row) => (
        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/surveys/push?term=${term?.id}&offerings=${row.id}`} onClick={(e) => e.stopPropagation()}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Set up survey
            </Link>
          </Button>
        </div>
      ),
    },
  ], [term?.id])

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

  /* Three DISTINCT jobs, each self-explanatory (Romit: "I don't understand
   * this metric" — the old strip said the same fact twice (63% AND 405/641)
   * and used jargon ("courses covered"). Now: how collection is going · what
   * isn't set up · what's about to close.
   *
   * 2026-08-14 (Romit) — "students responded" / "students · reminders reach
   * them" overstated precision: a student enrolled in two courses this term
   * gets two separate evaluations, so the same person can be both counted
   * and, once, still-outstanding more than once. "Feedback requests" names
   * what enrolledTotal/responsesCollected actually sum (one per survey
   * enrollment, not one per distinct student) instead of implying a
   * deduplicated headcount the data was never computing. "Still to respond"
   * also dropped outright — it restated the Response rate KPI's own gap
   * (enrolledTotal − responsesCollected) as a second card with nothing new
   * to act on. */
  const notSetUp = coverage ? coverage.total - coverage.surveyed : 0
  const kpis: MetricItem[] = [
    {
      id: 'rate', label: 'Response rate',
      value: rate != null ? `${rate}%` : '—',
      delta: '', trend: 'neutral', metricVariant: 'hero',
      // Target leads (2026-08-14, Romit: lowercase "target 70%" was buried
      // at the end of a long clause). It's the fixed, short benchmark the
      // big value is read against — the request-completion count is
      // supporting detail, not the headline fact, so it comes second.
      description: enrolledTotal > 0
        ? `Target ${RESPONSE_TARGET}% · ${responsesCollected.toLocaleString()} of ${enrolledTotal.toLocaleString()} feedback requests completed`
        : `Target ${RESPONSE_TARGET}%`,
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
                  {responsesCollected.toLocaleString()} of {enrolledTotal.toLocaleString()} feedback requests completed
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
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Status tabs (2026-08-14) — table-only: the board already
                    groups by these same four stages as its own columns, so
                    repeating the filter there would just narrow a kanban to
                    one column at a time for no reason. */}
                {evalView === 'table' ? (
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    value={statusTab}
                    onValueChange={(v) => v && setStatusTab(v as StatusTab)}
                    aria-label="Filter evaluations by status"
                  >
                    {STATUS_TABS.map((tab) => (
                      <ToggleGroupItem key={tab.id} value={tab.id}>
                        {tab.label}
                        <span className="tabular-nums text-muted-foreground">({tabCounts[tab.id]})</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                ) : <span />}
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
              ) : statusTab === 'not_configured' ? (
                <DataTablePaginated<SetupRow>
                  key={statusTab}
                  data={setupRows}
                  columns={setupColumns}
                  getRowId={(row) => row.id}
                  getRowSelectionLabel={(row) => `${row.code} offering`}
                  pagination={{ pageSize: 16 }}
                  edgeInset={false}
                  stickyHeader={false}
                  onRowClick={(row) => router.push(`/surveys/push?term=${term.id}&offerings=${row.id}`)}
                  emptyState={
                    <div className="flex flex-col items-center gap-2 py-8">
                      <i className="fa-light fa-circle-check text-2xl text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm font-medium">Every course this term has an evaluation set up</p>
                      <p className="text-xs text-muted-foreground">Nothing left to configure for this term.</p>
                    </div>
                  }
                />
              ) : (
                <DataTablePaginated<EvalRow>
                  /* key={statusTab} — forces a full remount on tab switch.
                     useTableState's `selected` Set (components/data-table/
                     use-table-state.ts) never resets on its own when `data`
                     changes size, so without this a selection made on Live
                     survived into Closed: the header "select all" checkbox
                     reads `selected.size === rows.length` (a count compare,
                     not membership — index.tsx ~764) rather than checking
                     which rows are actually selected, so it could render
                     fully checked over zero real matches whenever the two
                     tabs happened to have equal row counts. Remounting also
                     resets pagination to page 1 for the same reason (state-
                     review, 2026-08-14). */
                  key={statusTab}
                  data={visibleRows}
                  columns={columns}
                  getRowId={(row) => row.id}
                  getRowSelectionLabel={(row) => `${row.courseCode} evaluation`}
                  /* 2026-08-14 (Romit) — reinstated for bulk Remind/Extend
                     across Live rows (pce-ui-patterns.md §2: "selectable —
                     always on for list pages"; mirrors surveys-table.tsx).
                     Delete still has no real path here, so the bar only ever
                     offers Remind/Extend, never Export/Delete. */
                  selectable
                  pagination={{ pageSize: 16 }}
                  edgeInset={false}
                  stickyHeader={false}
                  onRowClick={(row) => router.push(
                    row.resumable
                      ? resumeHrefFor(row.survey, term.id)
                      : withFrom(`/results/${row.surveyId}`, fromOrigin),
                  )}
                  bulkActionsSlot={(selected, rows) => {
                    const selectedRows = rows.filter((row) => selected.has(row.id))
                    const remindable = selectedRows.filter((row) => isLive(row.status))
                    const extendable = selectedRows.filter((row) => isExtendable(row.status))
                    return (
                      <>
                        {remindable.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(remindHref(remindable.map((row) => row.surveyId)))}
                          >
                            Send reminders ({remindable.length})
                          </Button>
                        )}
                        {extendable.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExtendTargets(extendable.map((row) => row.survey))}
                          >
                            Edit close dates ({extendable.length})
                          </Button>
                        )}
                      </>
                    )
                  }}
                  emptyState={
                    <div className="flex flex-col items-center gap-2 py-8">
                      <i className="fa-light fa-filter-circle-xmark text-2xl text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm font-medium">
                        {statusTab === 'all' ? 'No evaluations match' : `No ${STATUS_TABS.find((t) => t.id === statusTab)?.label.toLowerCase()} evaluations`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {statusTab === 'all'
                          ? 'Adjust or clear the search and filters above.'
                          : 'Try a different status tab, or adjust the search and filters above.'}
                      </p>
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
