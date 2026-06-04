'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Button, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  ToggleGroup, ToggleGroupItem,
  LocalBanner, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { KeyMetrics } from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { TrendSparkline } from '@/components/pce/trend-sparkline'
import { AiInsightCard } from '@/components/pce/ai-insight-card'
import { MOCK_RESPONSES, MOCK_TEMPLATES, MOCK_TERMS, MOCK_COHORTS, SECTION_LABELS } from '@/lib/pce-mock-data'

/* ScoreLandscape — horizontal bar chart, sorted by score, brand-color bars +
   tier dots (green ≥4.3, brand 3.7-4.3, amber <3.7). Pattern from
   apps/pce/prototype/pce-evaluation.html chartScoreLandscape (~line 1317).
   Rows are keyboard-navigable and drill into offering detail.
   Brand presence per DS-018: bars use --brand-color. */
interface ScoreLandscapeProps {
  courses: { survey: { id: string; courseCode: string; courseName: string }; avg: number; isReleased: boolean }[]
  onDrill: (surveyId: string, isReleased: boolean) => void
}
function ScoreLandscape({ courses, onDrill }: ScoreLandscapeProps) {
  const rowH = 32
  const padTop = 6
  const trackW = 280  // bar track width in arbitrary SVG units
  const labelW = 132
  const valW = 36
  const totalW = labelW + trackW + valW + 14
  const totalH = padTop + courses.length * rowH + 4
  const tierColor = (a: number) =>
    a >= 4.3 ? 'var(--chart-2)' :
    a >= 3.7 ? 'var(--brand-color)' :
                'var(--chart-4)'
  return (
    <figure role="figure" aria-label={`Score landscape: ${courses.length} courses sorted by average`}>
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {courses.map((c, i) => {
          const y = padTop + i * rowH
          const barW = (c.avg / 5) * trackW
          return (
            <g
              key={c.survey.id}
              tabIndex={0}
              role="button"
              aria-label={`${c.survey.courseCode}, ${c.survey.courseName}, ${c.avg.toFixed(2)} of 5. Press Enter to drill in.`}
              style={{ cursor: 'pointer', outline: 'none' }}
              onClick={() => onDrill(c.survey.id, c.isReleased)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onDrill(c.survey.id, c.isReleased)
                }
              }}
            >
              <rect x={0} y={y - 2} width={totalW} height={rowH - 2} fill="transparent" />
              <circle cx={9} cy={y + rowH / 2 - 2} r={3} fill={tierColor(c.avg)} />
              <text x={20} y={y + rowH / 2 + 2} fontSize={12} fontWeight={600} fill="var(--foreground)" fontFamily="Inter">
                {c.survey.courseCode}
              </text>
              <text x={20} y={y + rowH / 2 + 14} fontSize={10} fill="var(--muted-foreground)" fontFamily="Inter">
                {c.survey.courseName.length > 22 ? `${c.survey.courseName.slice(0, 22)}…` : c.survey.courseName}
              </text>
              <rect x={labelW} y={y + rowH / 2 - 4} width={trackW} height={8} fill="var(--muted)" rx={4} />
              <rect x={labelW} y={y + rowH / 2 - 4} width={barW} height={8} fill="var(--brand-color)" rx={4} />
              <text
                x={labelW + trackW + 6}
                y={y + rowH / 2 + 4}
                fontSize={13}
                fontWeight={700}
                fill="var(--foreground)"
                fontFamily="Inter"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {c.avg.toFixed(2)}
              </text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        style={{
          height: 6,
          width: 80,
          borderRadius: 3,
          backgroundColor: 'var(--muted)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(score / max) * 100}%`,
            borderRadius: 3,
            backgroundColor: 'var(--brand-color)',
          }}
        />
      </div>
      <span className="tabular-nums text-sm font-semibold">{score}</span>
    </div>
  )
}

type Axis = 'term' | 'cohort'
type CourseTypeFilter = 'all' | 'didactic' | 'clinical'

export default function AnalyticsPage() {
  const { surveys } = usePce()
  const router = useRouter()
  // Per Aarti 2026-05-08 16:09 D4: two top-level axes — Term + Cohort.
  const [axis, setAxis] = useState<Axis>('term')
  const [term, setTerm] = useState('Spring 2026')
  const [cohort, setCohort] = useState('Class of 2026')
  // Per Aarti 2026-05-08 16:09 design task C5: clinical/didactic split on Cohort view.
  const [courseTypeFilter, setCourseTypeFilter] = useState<CourseTypeFilter>('all')

  const scopedSurveys = useMemo(() => {
    let filtered = axis === 'term'
      ? surveys.filter(s => s.term === term)
      : surveys.filter(s => s.cohort === cohort)

    // Course-type filter applies on Cohort view only (per audit C5)
    if (axis === 'cohort' && courseTypeFilter !== 'all') {
      filtered = filtered.filter(s => s.courseType === courseTypeFilter)
    }
    return filtered
  }, [surveys, axis, term, cohort, courseTypeFilter])

  const releasedSurveys = scopedSurveys.filter(s => s.status === 'released' || s.status === 'closed')

  const totalRate = scopedSurveys.length > 0
    ? Math.round(scopedSurveys.reduce((acc, s) => acc + s.responseRate, 0) / scopedSurveys.length)
    : 0

  const completedCount = releasedSurveys.length

  // Aggregate section scores across responses in scope
  const scopedResponses = MOCK_RESPONSES.filter(r =>
    scopedSurveys.some(s => s.id === r.surveyId)
  )

  const sectionAvgs: Record<string, number[]> = {}
  scopedResponses.forEach(r => {
    r.sectionScores.forEach(s => {
      if (!sectionAvgs[s.section]) sectionAvgs[s.section] = []
      sectionAvgs[s.section].push(s.avg)
    })
  })

  const sectionSummary = Object.entries(sectionAvgs).map(([section, avgs]) => ({
    section,
    avg: Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10,
  }))

  /* Released-course scores for landscape + at-risk computations.
     courseAvg = mean of all section averages for that survey. */
  const releasedScoreList = useMemo(() => {
    return releasedSurveys
      .map(survey => {
        const resp = MOCK_RESPONSES.find(r => r.surveyId === survey.id)
        const avgs = resp?.sectionScores.map(s => s.avg) ?? []
        const courseAvg = avgs.length > 0
          ? avgs.reduce((a, b) => a + b, 0) / avgs.length
          : 0
        return { survey, avg: courseAvg, isReleased: true }
      })
      .filter(c => c.avg > 0)
      .sort((a, b) => b.avg - a.avg)
  }, [releasedSurveys])

  /* Program-level rollup */
  const programAvg = releasedScoreList.length > 0
    ? releasedScoreList.reduce((sum, c) => sum + c.avg, 0) / releasedScoreList.length
    : null

  /* At-risk: released courses below 3.7 (prototype threshold) */
  const atRiskCourses = releasedScoreList.filter(c => c.avg < 3.7)

  /* Pending review: surveys in pending_review or closed (awaiting release) */
  const pendingReviewCount = scopedSurveys.filter(s => s.status === 'pending_review' || s.status === 'closed').length

  /* Reflection rate — stub: assume 1/3 of released faculty have submitted reflection */
  const reflectedCount = Math.round(releasedSurveys.length * 0.6)
  const reflectionRate = releasedSurveys.length > 0
    ? Math.round((reflectedCount / releasedSurveys.length) * 100)
    : 0

  /*
    KPI strip — fed to canonical KeyMetrics (vendored 2026-05-11 from
    @exxatdesignux/ui (vendored from DS web app key-metrics.tsx) per audit at
    docs/governance/component-depth-audits/key-metrics.md).

    Trend semantics: all four KPIs render as `neutral` because they describe
    *state*, not period-over-period change (no historical anchor for "vs last
    week"). Neutral renders a muted minus chip; the descriptive context lives
    in `delta`. Per memory feedback_aarti_no_red.md, we avoid `trend: "down"`
    here (would render --destructive red) even on at-risk count > 0 — the
    at-risk panel below already carries the colour signal.

    The `delta` string carries the descriptor that was previously the
    KpiButton `meta` prop. Each KPI deep-links via `href` to the relevant
    drill surface (same routes as before).
  */
  const kpiMetrics: MetricItem[] = [
    {
      id: 'program-avg',
      label: 'Program avg',
      value: programAvg ? `${programAvg.toFixed(2)}/5` : '—',
      delta: `${releasedSurveys.length} of ${scopedSurveys.length} released`,
      trend: 'neutral',
      href: '#score-landscape',
    },
    {
      id: 'at-risk',
      label: 'At-risk courses',
      value: atRiskCourses.length,
      delta: 'Released, below 3.7',
      trend: 'neutral',
      href: '#at-risk',
    },
    {
      id: 'pending-review',
      label: 'Pending review',
      value: pendingReviewCount,
      delta: 'Awaiting moderation',
      trend: 'neutral',
      href: '/surveys',
    },
    {
      id: 'reflection-rate',
      label: 'Reflection rate',
      value: `${reflectionRate}%`,
      delta: `${reflectedCount} of ${releasedSurveys.length} faculty`,
      trend: 'neutral',
    },
  ]

  /* Program trend — last 4 terms hardcoded as historical baseline; current is programAvg */
  const programTrendHistory: { label: string; value: number }[] = [
    { label: 'Sp 24', value: 3.95 },
    { label: 'Fa 24', value: 4.00 },
    { label: 'Sp 25', value: 4.02 },
    { label: 'Fa 25', value: 4.05 },
  ]

  /* Per-course breakdown — flattened so canonical DataTable's sortKey can index
     real properties on the row. Section averages, instructor name, etc. are
     precomputed here so `sortable: true` works without custom accessors. */
  const courseBreakdown = scopedSurveys.map(survey => {
    const resp = MOCK_RESPONSES.find(r => r.surveyId === survey.id)
    const scores = resp?.sectionScores ?? []
    return {
      id: survey.id,
      survey,
      scores,
      courseCode: survey.courseCode,
      instructorName: survey.instructors.find(i => i.role === 'primary')?.name ?? '',
      courseType: survey.courseType ?? '',
      rate: survey.responseRate,
      ccAvg: scores.find(s => s.section === 'course_content')?.avg ?? null,
      fpAvg: scores.find(s => s.section === 'faculty_performance')?.avg ?? null,
      cdAvg: scores.find(s => s.section === 'course_director')?.avg ?? null,
      isReleased: survey.status === 'released' || survey.status === 'closed',
    }
  })

  type CourseRow = typeof courseBreakdown[number]

  /* Canonical DataTable ColumnDef — sort uses sortKey to index TData; cell
     handles alignment via className since canonical doesn't expose `align`. */
  const courseColumns: ColumnDef<CourseRow>[] = [
    {
      key: 'courseCode',
      label: 'Course',
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{row.survey.courseCode}</span>
          <span className="text-xs truncate max-w-32 text-muted-foreground">
            {row.survey.courseName}
          </span>
        </div>
      ),
    },
    {
      key: 'instructorName',
      label: 'Instructor',
      sortable: true,
      cell: (row) => (
        <span className="text-sm font-medium">{row.instructorName || '—'}</span>
      ),
    },
    {
      key: 'courseType',
      label: 'Type',
      sortable: true,
      cell: (row) => row.courseType ? (
        <span className="text-xs capitalize text-muted-foreground">{row.courseType}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    },
    {
      key: 'rate',
      label: 'Rate',
      sortable: true,
      header: () => <span className="block text-right">Rate</span>,
      cell: (row) => (
        <div className="text-right tabular-nums text-sm font-semibold">{row.rate}%</div>
      ),
    },
    {
      key: 'ccAvg',
      label: 'CC',
      sortable: true,
      header: () => <span className="block text-right">CC</span>,
      cell: (row) => row.ccAvg != null
        ? <div className="text-right tabular-nums text-sm font-semibold">{row.ccAvg}</div>
        : <div className="text-right text-muted-foreground">—</div>,
    },
    {
      key: 'fpAvg',
      label: 'FP',
      sortable: true,
      header: () => <span className="block text-right">FP</span>,
      cell: (row) => row.fpAvg != null
        ? <div className="text-right tabular-nums text-sm font-semibold">{row.fpAvg}</div>
        : <div className="text-right text-muted-foreground">—</div>,
    },
    {
      key: 'cdAvg',
      label: 'CD',
      sortable: true,
      header: () => <span className="block text-right">CD</span>,
      cell: (row) => row.cdAvg != null
        ? <div className="text-right tabular-nums text-sm font-semibold">{row.cdAvg}</div>
        : <div className="text-right text-muted-foreground">—</div>,
    },
    {
      key: 'trend',
      label: 'Trend',
      cell: (row) => {
        const history = (row.survey.priorOfferings ?? []).map(po => ({
          label: po.term,
          value: po.courseAvg,
        }))
        return (
          <TrendSparkline
            history={history}
            currentValue={row.ccAvg ?? undefined}
            currentLabel={row.survey.term}
          />
        )
      },
    },
    {
      key: 'drill',
      label: '',
      width: 32,
      cell: (row) => row.isReleased ? (
        <div className="text-center">
          <i className="fa-light fa-chevron-right text-muted-foreground text-xs" aria-hidden="true" />
        </div>
      ) : (
        /* WCAG fix 2026-05-11: aria-label on bare <i> is aria-prohibited-attr.
           Wrap in role="img" span; mark icon aria-hidden. (visual-review caught.) */
        <div className="text-center">
          <span role="img" aria-label="Results pending" className="inline-block">
            <i className="fa-light fa-lock-keyhole text-muted-foreground text-xs" aria-hidden="true" />
          </span>
        </div>
      ),
    },
  ]

  const hasData = scopedSurveys.length > 0
  const scopeLabel = axis === 'term' ? term : cohort

  // C9 — Template-aggregation guard rail. Per Aarti audit: "Show a banner/warning
  // when aggregating across surveys with different templates. Surface
  // scale-consistency status (1–5 matched). Don't silently aggregate
  // incompatible data."
  const templatesInScope = useMemo(() => {
    const ids = new Set(scopedSurveys.map(s => s.templateId))
    return Array.from(ids)
      .map(id => MOCK_TEMPLATES.find(t => t.id === id))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
  }, [scopedSurveys])

  const hasMixedTemplates = templatesInScope.length > 1

  // Identify sections that only appear in some templates (incomplete coverage)
  const incompleteSections = useMemo(() => {
    if (templatesInScope.length < 2) return []
    const allSections = new Set(templatesInScope.flatMap(t => t.sections))
    return Array.from(allSections).filter(section =>
      !templatesInScope.every(t => t.sections.includes(section))
    )
  }, [templatesInScope])

  return (
    <>
      <SiteHeader title="Analytics" />
      <div className="flex items-center gap-3 shrink-0" style={{ padding: '14px 28px 14px' }}>
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>Analytics</h1>

        {/* View axis toggle (D4): Term ↔ Cohort. Faculty is one click down (D5) */}
        <ToggleGroup
          type="single"
          value={axis}
          onValueChange={(v) => v && setAxis(v as Axis)}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="term" aria-label="Term view">Term</ToggleGroupItem>
          <ToggleGroupItem value="cohort" aria-label="Cohort view">Cohort</ToggleGroupItem>
        </ToggleGroup>

        {axis === 'term' ? (
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="h-8 w-36 text-sm" aria-label="Select term">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Select value={cohort} onValueChange={setCohort}>
            <SelectTrigger className="h-8 w-44 text-sm" aria-label="Select cohort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_COHORTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Button variant="outline" size="sm">
          <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
          Export
        </Button>
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <i className="fa-light fa-chart-mixed text-muted-foreground text-4xl" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">No analytics data for {scopeLabel}</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Release surveys to faculty to see aggregated results here.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-4xl">

            {/* C9 — Template-aggregation guard rail */}
            {hasMixedTemplates && (
              <LocalBanner variant="warning" title="Mixed templates in scope">
                These {scopedSurveys.length} courses use {templatesInScope.length} different templates
                ({templatesInScope.map(t => t.name).join(', ')}).
                {incompleteSections.length > 0 && (
                  <>
                    {' '}Sections{' '}
                    <span className="font-medium">
                      {incompleteSections.map(s => SECTION_LABELS[s as keyof typeof SECTION_LABELS] ?? s).join(', ')}
                    </span>
                    {' '}only appear in some templates — section averages may reflect partial coverage.
                  </>
                )}
              </LocalBanner>
            )}

            {/* Course-type filter — Cohort view only (per audit C5) */}
            {axis === 'cohort' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Course type:</span>
                <ToggleGroup
                  type="single"
                  value={courseTypeFilter}
                  onValueChange={(v) => v && setCourseTypeFilter(v as CourseTypeFilter)}
                  size="sm"
                >
                  <ToggleGroupItem value="all" aria-label="All courses">All</ToggleGroupItem>
                  <ToggleGroupItem value="didactic" aria-label="Didactic only">Didactic</ToggleGroupItem>
                  <ToggleGroupItem value="clinical" aria-label="Clinical only">Clinical</ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            {/*
              AI insights — pulled-vs-AI lane affordance per docs/patterns/viz/ai-vs-pulled-lane.md.
              Per Aarti 2026-05-08 16:09 D14: AI summaries surface BEFORE question-level detail.
            */}
            <AiInsightCard
              body={
                axis === 'term'
                  ? `Across ${scopedSurveys.length} courses this term, response rate is ${totalRate}%. ${releasedSurveys.length > 0 ? 'Themes from released surveys cluster on pacing and faculty availability.' : 'No surveys released yet — themes will appear once results are available.'}`
                  : `${cohort} has ${scopedSurveys.length} courses${courseTypeFilter !== 'all' ? ` (${courseTypeFilter})` : ''} in scope. ${releasedSurveys.length > 0 ? 'AI will surface cohort-level themes once enough released-survey data is available.' : 'No released surveys yet for this cohort.'}`
              }
              source={`${scopedResponses.length} response${scopedResponses.length === 1 ? '' : 's'} across ${releasedSurveys.length} released survey${releasedSurveys.length === 1 ? '' : 's'}`}
            />

            {/*
              KPI strip — canonical KeyMetrics organism (vendored from Admin DS,
              2026-05-11). Replaces 4× hand-rolled KpiButton tiles per audit at
              docs/governance/component-depth-audits/key-metrics.md.
              Each metric drills via its `href` — same routes as before.
              `metricsSingleRow` + `showHeader={false}` for an integrated 4-up
              strip; canonical handles a11y (trend `aria-label`, focus rings,
              ≥4.5:1 contrast).
            */}
            <KeyMetrics
              variant="card"
              showHeader={false}
              metricsSingleRow
              metrics={kpiMetrics}
            />

            {/*
              Score Landscape + Program Trend — paired analytics cards per prototype PD dashboard.
              Score Landscape: sorted bar chart with tier dots (≥4.3 strong, 3.7-4.3 solid, <3.7 concern).
              Program Trend: 5-term sparkline using TrendSparkline component (DS-016).
            */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="score-landscape">
              <Card>
                <CardHeader>
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-sm">Score landscape</CardTitle>
                      <CardDescription>
                        Released courses, sorted by avg. Click any bar to drill in.
                      </CardDescription>
                    </div>
                    <div className="hidden md:flex items-center gap-2.5 text-[10px] text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--chart-2)' }} aria-hidden="true" />
                        ≥4.3
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--brand-color)' }} aria-hidden="true" />
                        3.7–4.3
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--chart-4)' }} aria-hidden="true" />
                        &lt;3.7
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {releasedSurveys.length > 0 ? (
                    <ScoreLandscape courses={releasedScoreList} onDrill={(id, released) => {
                      if (released) router.push(`/my-surveys/${id}/results`)
                    }} />
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No released courses yet for {scopeLabel}.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Program trend</CardTitle>
                  <CardDescription>Last 5 terms, current highlighted.</CardDescription>
                </CardHeader>
                <CardContent>
                  <TrendSparkline
                    history={programTrendHistory}
                    currentValue={programAvg ?? undefined}
                    currentLabel={term}
                    width={300}
                    height={80}
                    min={3.0}
                    max={5.0}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {programTrendHistory.length + (programAvg ? 1 : 0)} terms tracked.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/*
              At-risk panel — conditional. Released courses with avg <3.7 surface here per
              prototype. Empty state morphs into "Course health" affirmation when no risk.
              Brand presence: --brand-tint background on count chip; --brand-color-dark border.
            */}
            <Card id="at-risk">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-sm flex items-center gap-2">
                  <i
                    className={atRiskCourses.length > 0 ? 'fa-light fa-triangle-exclamation' : 'fa-light fa-heart-pulse'}
                    style={{ color: atRiskCourses.length > 0 ? 'var(--chart-4)' : 'var(--chart-2)' }}
                    aria-hidden="true"
                  />
                  {atRiskCourses.length > 0 ? 'At-risk courses' : 'Course health'}
                  {atRiskCourses.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="rounded-full text-[10px] ms-1"
                      style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color-dark)' }}
                    >
                      {atRiskCourses.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {atRiskCourses.length > 0
                    ? 'Released courses below 3.7. Click any row to drill in.'
                    : 'All released courses currently at or above 3.7. No CQI actions required this term.'}
                </CardDescription>
              </CardHeader>
              {atRiskCourses.length > 0 && (
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {atRiskCourses.map(({ survey, avg }) => (
                      <li key={survey.id}>
                        <Link
                          href={`/my-surveys/${survey.id}/results`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
                        >
                          <span className="text-sm font-medium">{survey.courseCode}</span>
                          <span className="text-xs text-muted-foreground truncate flex-1">{survey.courseName}</span>
                          <span className="text-sm tabular-nums font-semibold" style={{ color: 'var(--chart-4)' }}>
                            {avg.toFixed(2)}
                          </span>
                          <i className="fa-light fa-arrow-right text-xs text-muted-foreground" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>

            {/*
              By Course — sortable DataTable composite (apps/pce/admin/components/data-table/).
              Subset of the reference at @exxatdesignux/ui (vendored from DS web app data-table/index.tsx) —
              covers column-def-driven rendering + sortable headers + row drill-down +
              disabled-row state. Per Aarti D5: each row drills to /my-surveys/[id]/results.
              Disabled when survey not released (mirrors /my-surveys/page.tsx gate).
            */}
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold">By Course</h2>
              <p className="text-xs text-muted-foreground">
                Click any column header to sort. Click any released row to drill into question-level detail. Rows showing a lock icon are still collecting.
              </p>
              <div className="border border-border rounded-lg overflow-hidden">
                <DataTable<CourseRow>
                  data={courseBreakdown}
                  columns={courseColumns}
                  getRowId={(row) => row.id}
                  selectable={false}
                  searchable={false}
                  onRowClick={(row) => {
                    if (row.isReleased) {
                      router.push(`/my-surveys/${row.survey.id}/results`)
                    }
                  }}
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  )
}
