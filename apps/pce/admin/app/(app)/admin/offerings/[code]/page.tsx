'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Button,
  ChartContainer, ChartTooltip, ChartTooltipContent,
  chartTooltipKeyboardSyncProps,
} from '@exxatdesignux/ui'
import type { ChartConfig } from '@exxatdesignux/ui'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import {
  ChartCard, ChartFigure, ChartDataTable,
  type ChartLeoInsight,
} from '@/components/charts-overview'
import { CHART_AXIS_TICK } from '@/lib/chart-typography'
import { TrajectoryBoxplot, buildTrajectoryDatum } from '@/components/pce/trajectory-boxplot'
import { SiteHeader } from '@/components/site-header'
import { EvaluationCardSheet } from '@/components/pce/evaluation-card-sheet'
import { ByCoursePanel } from '@/components/pce/analytics-panels'
import { MOCK_MASTER_COURSES, MOCK_FACULTY_OFFERINGS } from '@/lib/pce-mock-data'

const PRISM_BASE = 'https://app.exxat.com/prism/dpt/course'

const TYPE_LABELS: Record<string, string> = { didactic: 'Classroom based', clinical: 'Practice based', seminar: 'Lab based' }

const TERM_ORDER = [
  'Spring 2022', 'Fall 2022', 'Spring 2023', 'Fall 2023',
  'Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026',
]

// Derive section scores from avgRating with deterministic per-section variance
function sectionScores(seedKey: string, avgRating: number) {
  const seed = seedKey.charCodeAt(seedKey.length - 1)
  const offsets = [0.2, -0.1, 0.3, -0.2, 0.1]
  const sections = ['Content', 'Organization', 'Workload', 'Materials', 'Assessment']
  return sections.map((name, i) => ({
    name,
    score: Math.min(5, Math.max(1, +(avgRating + offsets[(i + seed) % offsets.length]).toFixed(1))),
    fullMark: 5,
  }))
}

const trendChartConfig: ChartConfig = {
  range:  { label: 'Course range', color: 'var(--border)' },
  median: { label: 'Median',       color: 'var(--muted-foreground)' },
  course: { label: 'This course',  color: 'var(--brand-color)' },
}
const radarChartConfig: ChartConfig = {
  score: { label: 'Score', color: 'var(--brand-color)' },
}

export default function CourseAnalyticsProfile() {
  const params     = useParams<{ code: string }>()
  const courseCode = params?.code ? decodeURIComponent(params.code) : ''

  const course = MOCK_MASTER_COURSES.find(c => c.code === courseCode)
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)

  const offerings = useMemo(() => MOCK_FACULTY_OFFERINGS.filter(o => o.courseCode === courseCode), [courseCode])
  const totalEnrolled = offerings.reduce((s, o) => s + o.enrolled, 0)
  const avgRating = totalEnrolled > 0
    ? +(offerings.reduce((s, o) => s + o.avgRating * o.enrolled, 0) / totalEnrolled).toFixed(2)
    : null

  // Distribution band: per term, all-course min/max/median + this course
  const trendData = useMemo(() => {
    const termsWithData = TERM_ORDER.filter(t => MOCK_FACULTY_OFFERINGS.some(o => o.term === t))
    return termsWithData.map(term => {
      const byCourse = new Map<string, { sum: number; n: number }>()
      for (const o of MOCK_FACULTY_OFFERINGS.filter(o => o.term === term)) {
        const cur = byCourse.get(o.courseCode) ?? { sum: 0, n: 0 }
        cur.sum += o.avgRating * o.enrolled
        cur.n += o.enrolled
        byCourse.set(o.courseCode, cur)
      }
      const courseAvgs = [...byCourse.values()].map(v => v.n > 0 ? v.sum / v.n : 0).filter(v => v > 0)
      if (courseAvgs.length === 0) return null
      const thisTermOfferings = offerings.filter(o => o.term === term)
      const thisEnrolled = thisTermOfferings.reduce((s, o) => s + o.enrolled, 0)
      const thisAvg = thisEnrolled > 0
        ? thisTermOfferings.reduce((s, o) => s + o.avgRating * o.enrolled, 0) / thisEnrolled
        : null
      return buildTrajectoryDatum(
        term.replace('Spring ', 'Sp ').replace('Fall ', 'F '),
        courseAvgs,
        thisAvg,
      )
    }).filter(Boolean)
  }, [offerings])

  const radarData = useMemo(
    () => avgRating !== null ? sectionScores(courseCode, avgRating) : [],
    [courseCode, avgRating],
  )

  if (!course) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-2">
        <i className="fa-light fa-book-open-cover text-muted-foreground" aria-hidden="true" style={{ fontSize: 32 }} />
        <p className="text-sm text-muted-foreground">Course not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/offerings">Back to Course Offerings</Link>
        </Button>
      </div>
    )
  }

  // ── Leo insights — derived from the course's own data ───────────────────────
  const weakest = radarData.length ? radarData.reduce((a, b) => (b.score < a.score ? b : a)) : null
  const strongest = radarData.length ? radarData.reduce((a, b) => (b.score > a.score ? b : a)) : null
  const radarLeo: ChartLeoInsight | null = weakest && strongest
    ? {
        headline:
          weakest.score < 3.7
            ? `${weakest.name} is the weakest dimension at ${weakest.score.toFixed(1)}/5`
            : `${strongest.name} is the strongest dimension at ${strongest.score.toFixed(1)}/5`,
        explanation:
          weakest.score < 3.7
            ? `The other dimensions hold up — targeted changes to ${weakest.name.toLowerCase()} would move this course's rating fastest.`
            : 'All dimensions sit at or above the 3.7 tier — a balanced profile.',
        kind: weakest.score < 3.7 ? 'anomaly' : 'trend',
        delta: { value: (strongest.score - weakest.score).toFixed(1), label: 'spread across dimensions' },
        bullets: radarData.map(d => `${d.name}: ${d.score.toFixed(1)}/5.`),
      }
    : null

  const trendRows = trendData.filter((d): d is NonNullable<typeof d> => d != null)
  const lastWithCourse = [...trendRows].reverse().find(d => d.value != null) ?? null
  const bandLeo: ChartLeoInsight | null = lastWithCourse
    ? (() => {
        const diff = +(lastWithCourse.value! - lastWithCourse.median).toFixed(2)
        return {
          headline:
            diff < 0
              ? `Rated ${Math.abs(diff).toFixed(2)} below the course median in ${lastWithCourse.term}`
              : diff > 0
                ? `Rated ${diff.toFixed(2)} above the course median in ${lastWithCourse.term}`
                : `Right on the course median in ${lastWithCourse.term}`,
          explanation:
            'The grey band is the full course distribution per term — position within the band matters more than the absolute number.',
          kind: diff < 0 ? 'dip' : 'trend',
          delta: { value: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`, label: 'vs median' },
          bullets: [
            `${lastWithCourse.term}: this course ${lastWithCourse.value!.toFixed(2)}/5 · median ${lastWithCourse.median.toFixed(2)}/5.`,
          ],
        }
      })()
    : null

  // Radar + distribution band — DS OS ChartCards, merged in above the By Course panel.
  const extraCharts = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard variant="normal" title="Score by section" description="Survey dimension breakdown" leoInsight={radarLeo}>
        <ChartFigure
          label="Score by section"
          summary={`Radar chart of survey dimensions: ${radarData.map(d => `${d.name} ${d.score.toFixed(1)}`).join(', ')} out of 5.`}
          dataLength={radarData.length}
        >
          {(activeIndex) => (
            <>
              <ChartContainer config={radarChartConfig} className="h-52 w-full">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="name" tick={CHART_AXIS_TICK} />
                  <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                  <Radar dataKey="score" stroke="var(--brand-color)" fill="var(--brand-color)" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: 'var(--brand-color)' }} isAnimationActive={false} />
                </RadarChart>
              </ChartContainer>
              <ChartDataTable
                caption="Score by section"
                headers={['Dimension', 'Score']}
                rows={radarData.map(d => [d.name, `${d.score.toFixed(1)}/5`])}
              />
            </>
          )}
        </ChartFigure>
      </ChartCard>

      <ChartCard
        variant="normal"
        title="Rating over time"
        description="Course boxplot per term — box = middle 50%, line = median, whisker = full range · this course\u2019s dot (amber = below median) · click a term for details"
        leoInsight={bandLeo}
      >
        <ChartFigure
          label="Rating over time"
          summary="This course's rating per term shown as a dot inside the full course boxplot — box is the middle fifty percent, line the median, whisker the full range."
          dataLength={trendRows.length}
        >
          {() => (
            <>
              <TrajectoryBoxplot data={trendRows} valueLabel="This course" cohortNoun="courses" />
              <ChartDataTable
                caption="Rating over time"
                headers={['Term', 'This course', 'Median', 'Middle 50%', 'Course range', 'Courses evaluated']}
                rows={trendRows.map(d => [
                  d.term,
                  d.value != null ? d.value.toFixed(2) : '—',
                  d.median.toFixed(2),
                  `${d.p25.toFixed(2)}–${d.p75.toFixed(2)}`,
                  `${d.min.toFixed(2)}–${(d.min + d.range).toFixed(2)}`,
                  d.scores.length,
                ])}
              />
            </>
          )}
        </ChartFigure>
      </ChartCard>
    </div>
  )

  return (
    <>
      <SiteHeader breadcrumbs={[{ label: 'Course Offerings', href: '/admin/offerings' }]} title={course.code} />

      {/* Profile header */}
      <div className="shrink-0 flex items-center gap-4" style={{ padding: '20px 28px 16px' }}>
        <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 48, height: 48, background: 'var(--brand-tint)' }}>
          <i className="fa-light fa-book text-base" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold leading-tight">{course.code} · {course.name}</h1>
          <p className="text-sm text-muted-foreground">{course.department} · {TYPE_LABELS[course.type] ?? course.type}</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={`${PRISM_BASE}/${course.id}`} target="_blank" rel="noopener noreferrer">
            <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 12 }} />
            Open in Prism
          </a>
        </Button>
      </div>

      {/* Analytics — Dashboard › By Course design, merged with profile radar + distribution band */}
      <div className="flex-1 overflow-auto" style={{ padding: '8px 28px 28px' }}>
        <div className="flex flex-col gap-6 max-w-4xl">
          <ByCoursePanel courseCode={course.code} onOpenSurvey={setSelectedSurveyId} extraCharts={extraCharts} />
        </div>
      </div>

      <EvaluationCardSheet surveyId={selectedSurveyId} onClose={() => setSelectedSurveyId(null)} />
    </>
  )
}
