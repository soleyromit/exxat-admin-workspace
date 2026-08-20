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
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  Badge, Tip,
  Button,
  KeyMetrics,
  Skeleton,
  ToggleGroup, ToggleGroupItem,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
  Tabs, TabsList, TabsTrigger, TabsCountBadge,
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
import { EditEndDateDialog, ArchiveSurveyDialog } from '@/components/pce/pce-modals'
import {
  RESPONSE_TARGET, LIVE, isResumable, resumeHref as resumeHrefFor,
  daysUntil, weightedRate, evalWindow, coverageFor, termsOrdered,
} from '@/lib/pce-term-metrics'
import { evaluationsFor } from '@/lib/pce-evaluations'
import {
  type PceSurvey, type SurveyStatus, type PceInstructor,
  MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_FACULTY,
} from '@/lib/pce-mock-data'
import { withFrom } from '@/lib/pce-nav-origin'

/** Raw row status — every real SurveyStatus, plus a synthetic value for a
 *  term offering with no survey at all (2026-08-17). Not a SurveyStatus
 *  itself (no PceSurvey exists for these rows) so it's kept as a sibling
 *  literal rather than widening the real enum everywhere else in the app
 *  reads it. */
type RowStatus = SurveyStatus | 'not_configured'

/* One row = one offering's evaluation, the roll-up across every aspect it
 * covers (course material + every faculty role) — OR an offering with no
 * survey configured at all (status: 'not_configured'), folded into the same
 * table so the DataTable's own Status filter can include it (2026-08-17,
 * Romit: a 6th tab read as crowded and duplicated the KPI's own count; a
 * separate table/banner broke the "click a tab/filter to narrow by status"
 * mental model the other 5 states already establish). */
type EvalRow = {
  id: string // surveyId, or `offering-${offeringId}` for a not_configured row
  surveyId: string
  courseCode: string
  courseName: string
  status: RowStatus
  responseRate: number
  responseCount: number
  enrollmentCount: number
  deadline: string
  /** True when this offering's evaluation types include course_material —
   *  most do (see pce-evaluations.ts derive()), but this reads the real
   *  per-type source rather than assuming, since explicit `survey.evaluations`
   *  setup data could omit it. Always false for a not_configured row. */
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
  /** Faculty shown in the Course cell — was `row.survey.instructors`, but a
   *  not_configured row has no PceSurvey, only CourseOffering.primaryFacultyId. */
  instructors: PceInstructor[]
  /** Only set on a not_configured row — target for "Set up survey". */
  offeringId?: string
  survey?: PceSurvey
} & Record<string, unknown>

/* Per-evaluation lifecycle predicates (a single instance's status). Every
 * comparison is against a real SurveyStatus value, so 'not_configured' just
 * falls through false everywhere — no explicit guard needed at call sites. */
const isLive = (st: RowStatus) => st === 'active' || st === 'collecting'
const isFinished = (st: RowStatus) =>
  st === 'pending_review' || st === 'closed' || st === 'released'
/* Closed but not yet released — the window shut, someone still needs to
 * review before faculty can see it (moderation-sheet.tsx's own release
 * gate). Distinct from `released`, which has nothing left to review. */
const needsReview = (st: RowStatus) => st === 'pending_review' || st === 'closed'
/* Extend reaches a survey any time before it's finished — same set
 * EditEndDateDialog's callers already assume elsewhere (surveys-table.tsx). */
const isExtendable = (st: RowStatus) => isLive(st) || st === 'scheduled'

/* Needs-attention first, then lowest response rate. not_configured sorts
 * first — nothing has started at all, the most actionable state on the
 * page (feedback_no_bare_count_action_surfaces: surface the work, not just
 * a count). */
const STATUS_ORDER: Record<string, number> = {
  not_configured: -1, active: 0, collecting: 0, pending_review: 1, closed: 1, released: 2, scheduled: 3, draft: 4, archived: 5,
}

/* Status column filter (2026-08-17) — the ONLY status-narrowing mechanism
 * on this page now; the earlier 5-tab strip was fully redundant with this
 * (every tab it offered is reachable here as a checkbox) so it's gone, not
 * left standing alongside. Base labels mirror surveys-table.tsx's
 * STATUS_FILTER_OPTIONS exactly (raw per-value labels, e.g. "Active" and
 * "Collecting Responses" stay distinct rather than both reading "Live") so
 * two differently-worded status vocabularies don't exist side by side in
 * the product. Order is the survey lifecycle itself (not_configured → draft
 * → scheduled → live → closed/pending review → released) — live counts are
 * appended in the component (statusFilterOptions below) but the ORDER here
 * is fixed, not count-driven (2026-08-17, Romit: "logically ordered" after
 * an ascending-by-count pass read as arbitrary). */
const STATUS_LABELS: { value: string; label: string }[] = [
  { value: 'not_configured', label: 'No survey configured' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'collecting', label: 'Collecting Responses' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'closed', label: 'Closed' },
  { value: 'released', label: 'Results Released' },
  { value: 'archived', label: 'Archived' },
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
  const [archiveTarget, setArchiveTarget] = useState<PceSurvey | null>(null)
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
    const surveyRows: EvalRow[] = termSurveys.map((s): EvalRow => {
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
        instructors: s.instructors,
        survey: s,
      }
    })
    /* Offerings in this term with no evaluation configured at all — identical
     * reconciliation to term-evaluations-board.tsx's "No survey configured"
     * column (surveyedCodes set, matched on courseCode via masterCourseId),
     * so the two views list the same courses. Folded into tableRows directly
     * (2026-08-17) rather than a parallel array/table, so the Status column's
     * own filter can include it like any other value. */
    const setupRows: EvalRow[] = term
      ? (() => {
          const surveyedCodes = new Set(termSurveys.map((s) => s.courseCode))
          return MOCK_COURSE_OFFERINGS
            .filter((o) => o.termId === term.id && o.status !== 'archived')
            .flatMap((o): EvalRow[] => {
              const course = MOCK_MASTER_COURSES.find((c) => c.id === o.masterCourseId)
              if (!course || surveyedCodes.has(course.code)) return []
              const faculty = MOCK_FACULTY.find((f) => f.id === o.primaryFacultyId)
              return [{
                id: `offering-${o.id}`,
                surveyId: '',
                courseCode: course.code,
                courseName: course.name,
                status: 'not_configured',
                responseRate: 0,
                responseCount: 0,
                enrollmentCount: o.enrolledCount,
                deadline: '',
                hasCourseMaterial: false,
                extended: false,
                resumable: false,
                instructors: faculty ? [faculty] : [],
                offeringId: o.id,
              }]
            })
        })()
      : []
    return [...setupRows, ...surveyRows]
      .sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9) || a.responseRate - b.responseRate)
  }, [termSurveys, evalWin, term])

  /* Status filter counts — kept separate from the option label itself
   * (2026-08-17, Romit: render the count as a Badge component in the
   * dropdown row, not baked into the label string) so `label` stays plain
   * text for the collapsed chip + search-within-filter matching
   * (index.tsx:135, o.label.toLowerCase().includes(...)), while the count
   * renders through renderFilterOptionValue below. */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const row of tableRows) counts[row.status] = (counts[row.status] ?? 0) + 1
    return counts
  }, [tableRows])

  /* Aug 18 ask (Granola 421b0a20, Vishal: "under all tab, we don't provide
   * any multi-selection, but under scheduled or live tab, we give multi
   * selection... which means you're saying we need to have tabs") —
   * grouped tabs, not one per raw status: "no survey configured, draft can
   * be one [tab]" is Romit's own grouping call (2026-08-18). needsSetup and
   * finished are mutually exclusive and exhaustive with isExtendable
   * (scheduled/active/collecting), so every RowStatus lands in exactly one
   * non-"all" tab — nothing can silently fall through unrepresented. */
  const isNeedsSetup = (st: RowStatus) => st === 'not_configured' || st === 'draft'
  const TAB_GROUPS: { key: 'all' | 'needs_setup' | 'active' | 'finished'; label: string; match: (st: RowStatus) => boolean }[] = [
    { key: 'all', label: 'All', match: () => true },
    { key: 'needs_setup', label: 'Needs setup', match: isNeedsSetup },
    { key: 'active', label: 'Active', match: isExtendable },
    { key: 'finished', label: 'Closed & results', match: (st) => !isNeedsSetup(st) && !isExtendable(st) },
  ]
  const searchParams = useSearchParams()
  /* Dashboard Breakdown Mode row actions (Aug 19 2026 feedback) deep-link
   * here with `?tab=` so "Review feedback" lands on Closed & results
   * instead of All — read once on mount, same as the tab itself: an admin
   * switching tabs afterward shouldn't get yanked back by a stale param. */
  const [activeTab, setActiveTab] = useState<'all' | 'needs_setup' | 'active' | 'finished'>(
    () => {
      const t = searchParams?.get('tab')
      return t === 'needs_setup' || t === 'active' || t === 'finished' ? t : 'all'
    },
  )
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const group of TAB_GROUPS) counts[group.key] = tableRows.filter((row) => group.match(row.status)).length
    return counts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableRows])
  const visibleRows = useMemo(() => {
    const group = TAB_GROUPS.find((g) => g.key === activeTab)!
    return tableRows.filter((row) => group.match(row.status))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableRows, activeTab])

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
        // Aug 18 ask (Granola 421b0a20, Vishal) — course code split into its
        // own column instead of prefixing the Course cell, same fix as
        // step-survey-instances.tsx's Course assignments table.
        key: 'courseCode',
        label: 'Code',
        sortable: true,
        width: 90,
        filter: { type: 'text', icon: 'fa-book-open' },
        cell: (row) => <span className="text-sm font-medium tabular-nums">{row.courseCode}</span>,
      },
      {
        key: 'courseName',
        label: 'Course',
        sortable: true,
        width: 200,
        cell: (row) => (
          // title — narrower column (2026-08-14, to fit the whole table
          // without horizontal scroll) truncates a longer name more often;
          // without this a keyboard/hover user had no way to recover it.
          <p className="truncate text-sm font-medium" title={row.courseName}>{row.courseName}</p>
        ),
      },
      {
        // Aug 18 ask (Romit) — Evaluatees split into its own column instead
        // of a sub-row under Course, same fix/reasoning as the Code split
        // above: two distinct facts (what course, who/what is evaluated)
        // sharing one cell hid the second under the first's width budget.
        // Matches Step 2's Evaluatees column (courses-evaluatees/
        // step-survey-instances.tsx) in name and position.
        key: 'evaluatees',
        label: 'Evaluatees',
        width: 180,
        cell: (row) => (
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Same "Course material" chip vocabulary as Step 2's Evaluatees
                column (EvaluateeChipCluster) — this column otherwise showed
                only faculty, silently dropping the fact that course content
                is evaluated too whenever there's no other visual cue for it. */}
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
            <FacultyAvatarRow instructors={row.instructors} />
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
        filter: { type: 'select', icon: 'fa-circle-dot', options: STATUS_LABELS },
        cell: (row) => row.status === 'not_configured' ? (
          <Badge variant="outline" className="h-6 gap-1 border-border bg-background px-2 text-xs font-medium">
            <i className="fa-light fa-circle-dashed text-[10px]" aria-hidden="true" />
            No survey configured
          </Badge>
        ) : <SurveyStatusBadgeOS status={row.status} />,
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
          /* No survey exists yet — the offering's ONLY possible action is
             starting one (2026-08-17). Checked before `resumable` since a
             not_configured row is never resumable but shares nothing else
             with the Draft branch below (no editHref target — there's no
             survey to resume into). */
          if (row.status === 'not_configured') {
            return (
              <div className="flex items-center justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/surveys/push?term=${term?.id}&offerings=${row.offeringId}`}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Set up an evaluation for the ${label}`}
                  >
                    <i className="fa-light fa-plus" aria-hidden="true" />
                    {/* "Set up evaluation" — matches the Draft row's button
                        below (Romit's catch, 2026-08-18: same next step —
                        open the wizard for this course — read as two
                        different actions under the "never surveys" page
                        rule (this file's own header comment) just because
                        one row happens to have no PceSurvey yet. */}
                    Set up evaluation
                  </Link>
                </Button>
              </div>
            )
          }
          /* Draft (or a Scheduled survey re-opened for editing) has one
             PRIMARY action — no results, no reminders, no window to extend
             — but it's still a real, savable PceSurvey (row.survey is
             guaranteed here), so it keeps the same escape hatch every other
             non-finished row has: Archive, for a setup started by mistake
             (Romit's catch, 2026-08-18 — surveys-table.tsx already treats
             Draft as archivable; this row silently couldn't be undone at
             all, the one status on this page with no way out). "Set up
             evaluation" for a true Draft (2026-08-14, Romit) — it's never
             been through the wizard, so "Edit" implied an existing thing to
             change; a re-opened Scheduled survey IS an existing thing, so it
             keeps "Edit". */
          if (row.resumable) {
            const isDraft = row.status === 'draft'
            // Verb-only for the aria-label template ("Set up the DPT-611
            // evaluation") — the visible button text ("Set up evaluation")
            // already carries its own noun, so reusing it verbatim in
            // `${x} the ${label}` doubled "evaluation" (caught by compliance
            // review, 2026-08-14: "Set up evaluation the DPT-611 evaluation").
            const setupVerb = isDraft ? 'Set up' : 'Edit'
            return (
              <div className="flex items-center justify-end gap-1">
                <Button variant="outline" size="sm" asChild>
                  <Link href={editHref(row.survey!)} onClick={(e) => e.stopPropagation()} aria-label={`${setupVerb} the ${label}`}>
                    {/* Icons on this row's actions (2026-08-14, Romit) —
                        reuses fa-pen-ruler/fa-pen, the exact icons the
                        status vocabulary + surveys-table.tsx's own Edit
                        item already use for these two verbs. */}
                    <i className={`fa-light ${isDraft ? 'fa-pen-ruler' : 'fa-pen'}`} aria-hidden="true" />
                    {isDraft ? 'Set up evaluation' : 'Edit'}
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`More actions for the ${label}`} onClick={(e) => e.stopPropagation()}>
                      <i className="fa-light fa-ellipsis" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setArchiveTarget(row.survey!)}
                    >
                      <i className="fa-light fa-box-archive" aria-hidden="true" />
                      Archive evaluation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
              {isExtendable(row.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  // row.survey is guaranteed here — not_configured returned
                  // above, and isExtendable only ever matches a real status.
                  onClick={(e) => { e.stopPropagation(); setExtendTargets([row.survey!]) }}
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
                      in the same row (caught live, 2026-08-14). Live rows have
                      no such button, so it stays their only path to (partial,
                      in-progress) results. Scoped to isLive, not merely
                      !isFinished (Romit's catch) — a Draft or Scheduled survey
                      hasn't opened yet, so there is no response data to view;
                      offering the item there was a dead end, not a shortcut. */}
                  {isLive(row.status) && (
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
                  {/* Archive — Aug 12 ask (Granola 0ef80c33, Aarti): an
                      "undo a mistake" path for a survey that should never
                      have gone out. Scoped to rows that haven't reached
                      review/results yet (row.survey is guaranteed here, same
                      as Extend above). A not_configured row already returned
                      above this point (see the top of this cell), so TS
                      narrows it out here — only the archived exclusion needs
                      an explicit check (nothing left to undo). */}
                  {row.status !== 'archived' && !isFinished(row.status) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setArchiveTarget(row.survey!)}
                      >
                        <i className="fa-light fa-box-archive" aria-hidden="true" />
                        Archive evaluation
                      </DropdownMenuItem>
                    </>
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
                {/* Status tab strip reinstated (2026-08-18, Granola 421b0a20,
                    Vishal) — the 2026-08-17 removal called a per-status tab
                    strip "fully redundant" with the Status filter's own
                    checkboxes. This isn't that: it's GROUPED tabs (needs
                    setup / active / closed & results), which the filter
                    checkboxes can't express as a single click, and it's what
                    scopes bulk-select to a coherent set of rows (only Active
                    ever has a meaningful multi-select bar) instead of one
                    long list where selection eligibility varies row to row.
                    Table-view only (Romit's catch, 2026-08-18) — Board
                    reads termSurveys directly into its own status columns
                    (no_survey/scheduled/live/closed_review/released, all
                    visible side by side already), so the tab filter never
                    touched it: it sat there looking clickable and doing
                    nothing, a dead control on the one view where every
                    status is already on screen at once.
                    `invisible`, not a conditional unmount (Romit's second
                    catch, 2026-08-18) — removing it from the DOM in Board
                    view shrank this row's total content width, which could
                    tip `flex-wrap` into wrapping the Table/Board toggle
                    differently between the two views: a visible jump on
                    every switch. `invisible` keeps the reserved width
                    identical in both views (and drops out of the tab order
                    same as an unmount, unlike opacity-0) — just the pixels
                    are hidden, not the layout. */}
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                  className={evalView !== 'table' ? 'invisible' : undefined}
                >
                  <TabsList>
                    {TAB_GROUPS.map((group) => (
                      <TabsTrigger key={group.key} value={group.key}>
                        {group.label}
                        <TabsCountBadge count={tabCounts[group.key] ?? 0} />
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
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
                  /* No external key/remount hack here (had one keyed to the
                     removed status tab, 2026-08-17) — Status narrowing now
                     goes entirely through the DataTable's own built-in filter
                     state, which owns its own selection/pagination reset on
                     filter change; `data` itself no longer changes shape from
                     an outside prop the way the old external tab did. */
                  data={visibleRows}
                  columns={columns}
                  /* Status filter dropdown rows — label + a neutral count
                     Badge (2026-08-17, Romit: badge component, not text in
                     parens). NEUTRAL_COUNT_BADGE precedent from
                     term-evaluations-board.tsx's column chips: the option
                     text already names the status, so a colored badge would
                     just re-encode it. */
                  renderFilterOptionValue={(fieldKey, value) => {
                    if (fieldKey !== 'status') return undefined
                    const label = STATUS_LABELS.find((o) => o.value === value)?.label ?? value
                    return (
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="text-foreground">{label}</span>
                        <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums">
                          {statusCounts[value] ?? 0}
                        </Badge>
                      </span>
                    )
                  }}
                  getRowId={(row) => row.id}
                  getRowSelectionLabel={(row) => `${row.courseCode} evaluation`}
                  /* 2026-08-14 (Romit) — reinstated for bulk Remind/Extend
                     across Live rows (pce-ui-patterns.md §2: "selectable —
                     always on for list pages"; mirrors surveys-table.tsx).
                     Delete still has no real path here, so the bar only ever
                     offers Remind/Extend, never Export/Delete. */
                  selectable
                  /* Aug 18 ask (Granola 421b0a20, Vishal), same fix as
                     surveys-table.tsx — a row whose status can't produce
                     either bulk action (not_configured/draft/finished) has
                     no reason to be checkbox-selectable; isExtendable is a
                     superset of isLive, so it exactly covers "eligible for
                     at least one bulk action" here. */
                  isRowSelectable={(row) => isExtendable(row.status)}
                  pagination={{ pageSize: 16 }}
                  edgeInset={false}
                  stickyHeader={false}
                  onRowClick={(row) => router.push(
                    row.status === 'not_configured'
                      ? `/surveys/push?term=${term.id}&offerings=${row.offeringId}`
                      : row.resumable
                        ? resumeHrefFor(row.survey!, term.id)
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
                            // isExtendable is always false for a not_configured
                            // row, so every row here has row.survey set.
                            onClick={() => setExtendTargets(extendable.map((row) => row.survey!))}
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
      <ArchiveSurveyDialog
        open={!!archiveTarget}
        onOpenChange={(v) => !v && setArchiveTarget(null)}
        survey={archiveTarget}
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
