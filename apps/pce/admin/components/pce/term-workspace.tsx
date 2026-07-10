'use client'

// ============================================================================
// Term workspace — the dedicated page a term card opens to (Jul 10 2026).
//
// IA: breadcrumb Dashboard → {Term}. One term, one job: read the cycle's health,
// then intervene. Order = ACTION before ANALYSIS before DETAIL:
//   1. Action widgets  — derived from the datatable; only non-zero cards render.
//   2. Data viz        — vendored ChartCard (completion landscape + cycle funnel),
//                        the charts that were pulled off the dashboard on Jul 9.
//   3. Evaluation table — the canonical course-evaluation worklist, term-scoped,
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
  Card, CardContent, CardFooter, CardHeader, CardTitle,
  KeyMetrics,
  PersonIdentityCell,
  LocalBanner,
  ChartContainer, ChartTooltip, ChartTooltipContent,
  chartTooltipKeyboardSyncProps,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@exxatdesignux/ui'
import type { MetricItem, ChartConfig } from '@exxatdesignux/ui'
import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts'
import { SiteHeader } from '@/components/site-header'
import {
  ChartCard, ChartFigure, ChartDataTable,
  type ChartLeoInsight,
} from '@/components/charts-overview'
import { CHART_AXIS_TICK } from '@/lib/chart-typography'
import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadgeOS } from '@/components/pce/pce-badges'
import { EditEndDateDialog, SendReminderDialog, ReleaseBulkDialog } from '@/components/pce/pce-modals'
import { ModerationSheet } from '@/components/pce/moderation-sheet'
import { rateColor } from '@/lib/pce-results'
import { AT_RISK_THRESHOLD } from '@/lib/pce-at-risk'
import {
  RESPONSE_TARGET, LIVE, IN_REVIEW, FINISHED,
  daysUntil, weightedRate, evalWindow, coverageFor, termsOrdered, completionColor,
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

const STATUS_FILTER_OPTIONS = [
  { value: 'draft',          label: 'Draft' },
  { value: 'scheduled',      label: 'Scheduled' },
  { value: 'collecting',     label: 'Collecting Responses' },
  { value: 'active',         label: 'Active' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'released',       label: 'Results Released' },
  { value: 'closed',         label: 'Closed' },
]

const completionConfig: ChartConfig = { rate: { label: 'Response rate', color: 'var(--brand-color)' } }
const cycleConfig: ChartConfig = { count: { label: 'Evaluations', color: 'var(--brand-color)' } }

/* ── action widget (DS Card) ──────────────────────────────────────────────── */
function ActionWidget({
  icon, label, count, caption, tone, cta,
}: {
  icon: string
  label: string
  count: number
  caption: string
  tone: 'risk' | 'neutral'
  cta: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <i
            className={`fa-light ${icon}`}
            aria-hidden="true"
            style={{ color: tone === 'risk' ? 'var(--chip-4)' : 'var(--muted-foreground)' }}
          />
          {label}
        </div>
      </CardHeader>
      <CardContent className="flex items-baseline gap-2">
        <span
          className="text-2xl font-semibold tabular-nums leading-none"
          style={{ color: tone === 'risk' ? 'var(--chip-4)' : 'var(--foreground)' }}
        >
          {count}
        </span>
        <span className="text-xs text-muted-foreground">{caption}</span>
      </CardContent>
      <CardFooter>{cta}</CardFooter>
    </Card>
  )
}

/* ── page ─────────────────────────────────────────────────────────────────── */
function TermWorkspaceInner() {
  const params = useParams<{ termId: string }>()
  const router = useRouter()
  const { surveys, releaseSurvey } = usePce()

  const term = termsOrdered.find((t) => t.id === params?.termId)
  /* Origin param so /results/[id] breadcrumbs back HERE, not the Results hub. */
  const fromQ = term ? `?from=${encodeURIComponent(`term:${term.id}`)}` : ''

  const [remindTargets, setRemindTargets] = useState<PceSurvey[]>([])
  const [extendTargets, setExtendTargets] = useState<PceSurvey[]>([])
  const [releaseTargets, setReleaseTargets] = useState<string[]>([])
  const [moderationId, setModerationId] = useState<string | null>(null)
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set())
  const [banner, setBanner] = useState<string | null>(null)

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
  const atRisk = live.filter((s) => s.responseRate < AT_RISK_THRESHOLD)
  const closingSoon = live.filter((s) => {
    const d = s.deadline ? daysUntil(s.deadline) : null
    return d != null && d >= 0 && d <= 7
  })
  const pending = termSurveys.filter(IN_REVIEW)
  const coverage = term ? coverageFor(term.id, termSurveys) : null
  const coverageGap = coverage ? coverage.total - coverage.surveyed : 0
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

  /* ── viz data ── */
  const completionData = useMemo(
    () =>
      [...termSurveys]
        .filter((s) => s.responseCount > 0 || LIVE(s))
        .sort((a, b) => a.responseRate - b.responseRate)
        .map((s) => ({ code: s.courseCode, rate: s.responseRate, fill: completionColor(s.responseRate) })),
    [termSurveys],
  )

  const cycleData = useMemo(() => {
    const draft     = termSurveys.filter((s) => s.status === 'draft').length
    const scheduled = termSurveys.filter((s) => s.status === 'scheduled').length
    const liveN     = live.length
    const review    = pending.length
    const released  = termSurveys.filter((s) => s.status === 'released').length
    return [
      { stage: 'Draft',     count: draft },
      { stage: 'Scheduled', count: scheduled },
      { stage: 'Live',      count: liveN },
      { stage: 'In review', count: review },
      { stage: 'Released',  count: released },
    ]
  }, [termSurveys, live.length, pending.length])

  const completionLeo: ChartLeoInsight | null = useMemo(() => {
    if (completionData.length === 0) return null
    const lagging = completionData.filter((d) => d.rate < RESPONSE_TARGET)
    const lowest = completionData[0]
    return {
      headline: lagging.length > 0
        ? `${lagging.length} ${lagging.length === 1 ? 'course is' : 'courses are'} below the ${RESPONSE_TARGET}% target`
        : `Every course is at or above the ${RESPONSE_TARGET}% target`,
      explanation: lagging.length > 0
        ? `${lowest.code} is lowest at ${lowest.rate}%. Reminders to non-responders typically lift a lagging course 10–20 points while the window is open.`
        : 'Collection is healthy across the term — no course needs a nudge right now.',
      kind: lagging.length > 0 ? 'anomaly' : 'trend',
      anchor: { xValue: lowest.code, yDataKeys: ['rate'] },
    }
  }, [completionData])

  const cycleLeo: ChartLeoInsight | null = useMemo(() => {
    const total = termSurveys.length
    if (total === 0) return null
    const released = cycleData.find((d) => d.stage === 'Released')?.count ?? 0
    return {
      headline: `${released} of ${total} evaluations released`,
      explanation: pending.length > 0
        ? `${pending.length} ${pending.length === 1 ? 'evaluation is' : 'evaluations are'} closed and waiting on your review before results reach faculty.`
        : 'Nothing is waiting on review — the cycle is moving cleanly through its stages.',
      kind: 'trend',
      anchor: { xValue: 'In review', yDataKeys: ['count'] },
    }
  }, [cycleData, termSurveys.length, pending.length])

  /* ── table columns (canonical course-evaluation worklist) ── */
  const columns: ColumnDef<SurveyRow>[] = useMemo(
    () => [
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
                  onClick={(e) => { e.stopPropagation(); setRemindTargets([row]) }}
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
                <Button variant="ghost" size="sm" asChild className="px-1 text-muted-foreground hover:text-foreground">
                  <Link href={`/results/${row.id}${fromQ}`} onClick={(e) => e.stopPropagation()}>
                    Results
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
    [router, remindedIds, facultyOptions, fromQ],
  )

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
  const kpis: MetricItem[] = [
    { id: 'rate', label: 'Response rate', value: rate != null ? `${rate}%` : '—', delta: '', trend: 'neutral', description: `target ${RESPONSE_TARGET}%`, metricVariant: 'hero' },
    { id: 'responses', label: 'Responses', value: enrolledTotal > 0 ? `${responsesCollected.toLocaleString()}/${enrolledTotal.toLocaleString()}` : '—', delta: '', trend: 'neutral', description: 'students responded' },
    { id: 'coverage', label: 'Courses covered', value: coverage ? `${coverage.surveyed}/${coverage.total}` : '—', delta: '', trend: 'neutral', description: 'have an evaluation' },
    { id: 'closing', label: 'Closing this week', value: closingSoon.length, delta: '', trend: 'neutral', description: closingSoon.length > 0 ? 'act before they close' : 'nothing urgent' },
  ]

  const firstRun = termSurveys.length === 0
  const anyAction = atRisk.length > 0 || closingSoon.length > 0 || pending.length > 0 || coverageGap > 0

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
        <Button variant="default" size="default" asChild>
          <Link href={`/surveys/push?term=${term.id}`}>Send Evaluations</Link>
        </Button>
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
            {banner && (
              <LocalBanner variant="success" title="Done" dismissible onDismiss={() => setBanner(null)}>
                {banner}
              </LocalBanner>
            )}

            {/* KPI strip */}
            <KeyMetrics variant="compact" metricsSingleRow metrics={kpis} />

            {/* ── Action widgets (top band, non-zero only) ── */}
            {anyAction && (
              <section className="flex flex-col gap-2" aria-label="Needs your action">
                <h2 className="text-sm font-semibold text-foreground">Needs your action</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {atRisk.length > 0 && (
                    <ActionWidget
                      icon="fa-triangle-exclamation" label="At risk" count={atRisk.length} tone="risk"
                      caption={`below ${AT_RISK_THRESHOLD}% response`}
                      cta={
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => setRemindTargets(atRisk)}>Remind all</Button>
                          <Button variant="ghost" size="sm" onClick={() => setExtendTargets(atRisk)}>Extend</Button>
                        </div>
                      }
                    />
                  )}
                  {closingSoon.length > 0 && (
                    <ActionWidget
                      icon="fa-clock" label="Closing this week" count={closingSoon.length} tone="neutral"
                      caption="window closing soon"
                      cta={<Button variant="outline" size="sm" onClick={() => setRemindTargets(closingSoon)}>Send reminders</Button>}
                    />
                  )}
                  {pending.length > 0 && (
                    <ActionWidget
                      icon="fa-shield-check" label="Pending review" count={pending.length} tone="neutral"
                      caption="closed, awaiting release"
                      cta={<Button variant="outline" size="sm" onClick={() => setReleaseTargets(pending.map((s) => s.id))}>Review &amp; release</Button>}
                    />
                  )}
                  {coverageGap > 0 && (
                    <ActionWidget
                      icon="fa-calendar-plus" label="Not yet evaluated" count={coverageGap} tone="neutral"
                      caption="course offerings"
                      cta={
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/surveys/push?term=${term.id}`}>Set up</Link>
                        </Button>
                      }
                    />
                  )}
                </div>
              </section>
            )}

            {/* ── Data viz (vendored ChartCard) ── */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <ChartCard
                title="Response rate by course"
                description="Lowest first — where a reminder helps most"
                leoInsight={completionLeo}
              >
                {completionData.length > 0 ? (
                  <ChartFigure
                    label="Response rate by course"
                    summary={`${completionData.length} courses, lowest response rate first`}
                    dataLength={completionData.length}
                    leoInsight={completionLeo}
                  >
                    {(activeIndex) => (
                      <>
                        <ChartContainer
                          config={completionConfig}
                          className="w-full"
                          style={{ height: `${completionData.length * 26 + 8}px` }}
                        >
                          <BarChart accessibilityLayer data={completionData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                            <XAxis type="number" domain={[0, 100]} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} unit="%" />
                            <YAxis type="category" dataKey="code" width={72} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                            <ChartTooltip
                              key={chartTooltipKeyboardSyncProps(activeIndex).key}
                              {...chartTooltipKeyboardSyncProps(activeIndex).props}
                              cursor={false}
                              content={<ChartTooltipContent formatter={(v: unknown) => [`${v as number}%`, 'Response rate']} />}
                            />
                            <Bar dataKey="rate" radius={3} isAnimationActive={false}>
                              {completionData.map((d) => <Cell key={d.code} fill={d.fill} />)}
                            </Bar>
                          </BarChart>
                        </ChartContainer>
                        <ChartDataTable
                          caption="Response rate by course"
                          headers={['Course', 'Response rate']}
                          rows={completionData.map((d) => [d.code, `${d.rate}%`])}
                        />
                      </>
                    )}
                  </ChartFigure>
                ) : (
                  <EmptyChart message="No responses collected yet." />
                )}
              </ChartCard>

              <ChartCard
                title="Cycle progress"
                description="Where this term’s evaluations sit in their lifecycle"
                leoInsight={cycleLeo}
              >
                <ChartFigure
                  label="Cycle progress"
                  summary="Evaluation counts by lifecycle stage"
                  dataLength={cycleData.length}
                  leoInsight={cycleLeo}
                >
                  {(activeIndex) => (
                    <>
                      <ChartContainer config={cycleConfig} className="w-full" style={{ height: 180 }}>
                        <BarChart accessibilityLayer data={cycleData} margin={{ left: 8, right: 8, top: 8, bottom: 4 }}>
                          <XAxis dataKey="stage" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} interval={0} />
                          <YAxis allowDecimals={false} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} width={28} />
                          <ChartTooltip
                            key={chartTooltipKeyboardSyncProps(activeIndex).key}
                            {...chartTooltipKeyboardSyncProps(activeIndex).props}
                            cursor={false}
                            content={<ChartTooltipContent formatter={(v: unknown) => [`${v as number}`, 'Evaluations']} />}
                          />
                          <Bar dataKey="count" radius={3} isAnimationActive={false}>
                            {cycleData.map((d) => (
                              <Cell key={d.stage} fill={d.stage === 'In review' && pending.length > 0 ? 'var(--chip-4)' : 'var(--brand-color)'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                      <ChartDataTable
                        caption="Cycle progress by stage"
                        headers={['Stage', 'Evaluations']}
                        rows={cycleData.map((d) => [d.stage, d.count])}
                      />
                    </>
                  )}
                </ChartFigure>
              </ChartCard>
            </div>

            {/* ── Evaluation datatable ── */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Evaluations</h2>
                <Button variant="ghost" size="sm" asChild className="px-0 text-muted-foreground hover:text-foreground">
                  <Link href="/surveys">
                    Open Evaluations hub
                  </Link>
                </Button>
              </div>
              <DataTablePaginated<SurveyRow>
                data={tableRows}
                columns={columns}
                getRowId={(row) => row.id}
                selectable
                pagination={{ pageSize: 10 }}
                edgeInset={false}
                stickyHeader={false}
                toolbarSlot={() => (
                  <span className="text-xs text-muted-foreground">
                    {tableRows.length} {tableRows.length === 1 ? 'evaluation' : 'evaluations'}
                  </span>
                )}
                onRowClick={(row) => router.push(`/results/${row.id}${fromQ}`)}
                emptyState={
                  <div className="flex flex-col items-center gap-2 py-8">
                    <i className="fa-light fa-filter-circle-xmark text-2xl text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm font-medium">No evaluations match</p>
                    <p className="text-xs text-muted-foreground">Adjust or clear the search and filters above.</p>
                  </div>
                }
              />
            </section>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <SendReminderDialog
        open={remindTargets.length > 0}
        onOpenChange={(v) => !v && setRemindTargets([])}
        surveys={remindTargets}
        onSent={(codes) => {
          setBanner(`An ad-hoc reminder went out to non-responders in ${codes}.`)
          setRemindedIds((prev) => {
            const next = new Set(prev)
            remindTargets.forEach((t) => next.add(t.id))
            return next
          })
        }}
      />
      <EditEndDateDialog
        open={extendTargets.length > 0}
        onOpenChange={(v) => !v && setExtendTargets([])}
        surveys={extendTargets}
      />
      <ReleaseBulkDialog
        open={releaseTargets.length > 0}
        onOpenChange={(v) => !v && setReleaseTargets([])}
        surveyIds={releaseTargets}
        onConfirm={() => {
          releaseTargets.forEach((id) => releaseSurvey(id))
          setBanner(`${releaseTargets.length} ${releaseTargets.length === 1 ? 'evaluation' : 'evaluations'} released — faculty can now view results.`)
        }}
      />
      <ModerationSheet surveyId={moderationId} onClose={() => setModerationId(null)} />
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10">
      <i className="fa-light fa-chart-simple text-2xl text-muted-foreground" aria-hidden="true" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  )
}

export function TermWorkspace() {
  return (
    <Suspense>
      <TermWorkspaceInner />
    </Suspense>
  )
}
