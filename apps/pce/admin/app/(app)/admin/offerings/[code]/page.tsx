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
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  ChartCard, ChartFigure, ChartDataTable,
  ChartLeoPlotInsightOverlay,
  type ChartLeoInsight,
} from '@/components/charts-overview'
import { CHART_AXIS_TICK } from '@/lib/chart-typography'
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

/**
 * REMOVED 2026-07-14 — the "Score by section" radar was fabricated.
 *
 * It synthesised five dimensions (Content / Organization / Workload / Materials /
 * Assessment) from `avgRating + offsets[(i + seed) % 5]`, seeded off a charCode. Same bug
 * class as the faculty version removed from `faculty-profile-dashboard.tsx` — and it does
 * not even agree with it, since that one invented a DIFFERENT five labels from the same
 * seed. Neither set is measured: `TemplateSection` has THREE values (course_content,
 * faculty_performance, course_director), and `PceResponse.sectionScores` is keyed by
 * surveyId with no per-actor attribution.
 *
 * A section breakdown needs a data-model decision first (Romit/Himanshu). Until then an
 * absent chart beats invented numbers on a real course's review page.
 */

const trendChartConfig: ChartConfig = {
  range:  { label: 'Course range', color: 'var(--border)' },
  median: { label: 'Median',       color: 'var(--muted-foreground)' },
  course: { label: 'This course',  color: 'var(--brand-color)' },
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
      const min = Math.min(...courseAvgs)
      const max = Math.max(...courseAvgs)
      const sorted = [...courseAvgs].sort((a, b) => a - b)
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]
      const thisTermOfferings = offerings.filter(o => o.term === term)
      const thisEnrolled = thisTermOfferings.reduce((s, o) => s + o.enrolled, 0)
      const thisAvg = thisEnrolled > 0
        ? thisTermOfferings.reduce((s, o) => s + o.avgRating * o.enrolled, 0) / thisEnrolled
        : null
      return {
        term: term.replace('Spring ', 'Sp ').replace('Fall ', 'F '),
        min: +min.toFixed(2),
        range: +(max - min).toFixed(2),
        median: +median.toFixed(2),
        course: thisAvg !== null ? +thisAvg.toFixed(2) : null,
      }
    }).filter(Boolean)
  }, [offerings])

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
  const trendRows = trendData.filter((d): d is NonNullable<typeof d> => d != null)
  const lastWithCourse = [...trendRows].reverse().find(d => d.course != null) ?? null
  const bandLeo: ChartLeoInsight | null = lastWithCourse
    ? (() => {
        const diff = +(lastWithCourse.course! - lastWithCourse.median).toFixed(2)
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
            `${lastWithCourse.term}: this course ${lastWithCourse.course!.toFixed(2)}/5 · median ${lastWithCourse.median.toFixed(2)}/5.`,
          ],
          anchor: { xValue: lastWithCourse.term, yDataKeys: ['course'] },
        }
      })()
    : null

  // Distribution band — DS OS ChartCard, merged in above the By Course panel.
  // (The fabricated "Score by section" radar was removed 2026-07-14 — see the note above.)
  const extraCharts = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <ChartCard
        variant="normal"
        title="Rating over time"
        description="Within full course distribution · ● this course · ─ ─ median"
        leoInsight={bandLeo}
      >
        <ChartFigure
          label="Rating over time"
          summary="This course's rating per term plotted inside the full course distribution band, with the median as a dashed line."
          dataLength={trendRows.length}
        >
          {(activeIndex) => (
            <>
              <div className="relative w-full">
                <ChartContainer config={trendChartConfig} className="h-52 w-full">
                  <ComposedChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="term" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis domain={[2.5, 5]} ticks={[3.0, 3.5, 4.0, 4.5, 5.0]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                    <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                    <Area dataKey="min" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
                    <Area dataKey="range" stackId="band" stroke="none" fill="var(--muted)" fillOpacity={0.5} isAnimationActive={false} />
                    <Line dataKey="median" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
                    <Line dataKey="course" stroke="var(--brand-color)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--brand-color)', strokeWidth: 0 }} activeDot={{ r: 5, stroke: 'var(--ring)', strokeWidth: 2 }} connectNulls isAnimationActive={false} />
                  </ComposedChart>
                </ChartContainer>
                <ChartLeoPlotInsightOverlay
                  data={trendRows.map(({ term: t, course: c, median }) => ({ term: t, course: c, median }))}
                  xDataKey="term"
                />
              </div>
              <ChartDataTable
                caption="Rating over time"
                headers={['Term', 'This course', 'Median']}
                rows={trendRows.map(d => [d.term, d.course != null ? d.course.toFixed(2) : '—', d.median.toFixed(2)])}
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
