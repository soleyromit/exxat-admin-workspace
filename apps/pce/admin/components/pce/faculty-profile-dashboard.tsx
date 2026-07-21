'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Avatar, AvatarFallback, Button, Badge,
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
import { EvaluationCardSheet } from '@/components/pce/evaluation-card-sheet'
import { ByFacultyPanel } from '@/components/pce/analytics-panels'
import { MOCK_FACULTY, MOCK_FACULTY_OFFERINGS } from '@/lib/pce-mock-data'
import { TrajectoryBoxplot, buildTrajectoryDatum } from '@/components/pce/trajectory-boxplot'

// Shared by the admin "By Faculty" profile (/admin/faculty/[id]) and the faculty
// self-view (/my-dashboard). Same profile header + radar + distribution band +
// ByFacultyPanel; only the surrounding chrome (SiteHeader, Prism link) differs.

const PRISM_BASE = 'https://app.exxat.com/prism/dpt/faculty'

const TERM_ORDER = [
  'Spring 2022', 'Fall 2022', 'Spring 2023', 'Fall 2023',
  'Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026',
]

// Derive section scores from avgRating with deterministic per-section variance
function sectionScores(facultyId: string, avgRating: number) {
  const seed = facultyId.charCodeAt(facultyId.length - 1)
  const offsets = [0.2, -0.1, 0.3, -0.2, 0.1]
  const sections = ['Delivery', 'Preparation', 'Accessibility', 'Communication', 'Fairness']
  return sections.map((name, i) => ({
    name,
    score: Math.min(5, Math.max(1, +(avgRating + offsets[(i + seed) % offsets.length]).toFixed(1))),
    fullMark: 5,
  }))
}

const radarChartConfig: ChartConfig = {
  score: { label: 'Score', color: 'var(--brand-color)' },
}

export function FacultyProfileDashboard({
  facultyId,
  showPrismLink = false,
}: {
  facultyId: string
  /** Admin view shows an "Open in Prism" affordance; the faculty self-view hides it. */
  showPrismLink?: boolean
}) {
  const faculty = MOCK_FACULTY.find(f => f.id === facultyId)
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)

  const offerings = useMemo(() => MOCK_FACULTY_OFFERINGS.filter(o => o.facultyId === facultyId), [facultyId])
  const totalEnrolled = offerings.reduce((s, o) => s + o.enrolled, 0)
  const avgRating = totalEnrolled > 0
    ? +(offerings.reduce((s, o) => s + o.avgRating * o.enrolled, 0) / totalEnrolled).toFixed(2)
    : null

  // Distribution band: per term, all-faculty min/max/median + this faculty
  const trendData = useMemo(() => {
    const termsWithData = TERM_ORDER.filter(t => MOCK_FACULTY_OFFERINGS.some(o => o.term === t))
    return termsWithData.map(term => {
      const scores = MOCK_FACULTY_OFFERINGS.filter(o => o.term === term).map(o => o.avgRating)
      const facultyThisTerm = offerings.find(o => o.term === term)
      return buildTrajectoryDatum(
        term.replace('Spring ', 'Sp ').replace('Fall ', 'F '),
        scores,
        facultyThisTerm ? facultyThisTerm.avgRating : null,
      )
    })
  }, [offerings])

  const radarData = useMemo(
    () => avgRating !== null ? sectionScores(facultyId, avgRating) : [],
    [facultyId, avgRating],
  )

  if (!faculty) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-2">
        <i className="fa-light fa-user-slash text-3xl text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Faculty not found</p>
      </div>
    )
  }

  // ── Leo insights — derived from the profile's own data ──────────────────────
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
            ? `The other dimensions hold up — targeted feedback on ${weakest.name.toLowerCase()} would move the overall rating fastest.`
            : 'All dimensions sit at or above the 3.7 tier — a balanced profile.',
        kind: weakest.score < 3.7 ? 'anomaly' : 'trend',
        delta: { value: (strongest.score - weakest.score).toFixed(1), label: 'spread across dimensions' },
        bullets: radarData.map(d => `${d.name}: ${d.score.toFixed(1)}/5.`),
      }
    : null

  const lastWithFaculty = [...trendData].reverse().find(d => d.value != null) ?? null
  const bandLeo: ChartLeoInsight | null = lastWithFaculty
    ? (() => {
        const diff = +(lastWithFaculty.value! - lastWithFaculty.median).toFixed(2)
        return {
          headline:
            diff < 0
              ? `Rated ${Math.abs(diff).toFixed(2)} below the faculty median in ${lastWithFaculty.term}`
              : diff > 0
                ? `Rated ${diff.toFixed(2)} above the faculty median in ${lastWithFaculty.term}`
                : `Right on the faculty median in ${lastWithFaculty.term}`,
          explanation:
            'The grey band is the full faculty distribution per term — position within the band matters more than the absolute number.',
          kind: diff < 0 ? 'dip' : 'trend',
          delta: { value: `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}`, label: 'vs median' },
          bullets: [
            `${lastWithFaculty.term}: own ${lastWithFaculty.value!.toFixed(2)}/5 · median ${lastWithFaculty.median.toFixed(2)}/5.`,
            `Band spans ${lastWithFaculty.min.toFixed(2)}–${(lastWithFaculty.min + lastWithFaculty.range).toFixed(2)} this term.`,
          ],
        }
      })()
    : null

  // Radar + distribution band — DS OS ChartCards, rendered above the By Faculty panel.
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
              <ChartContainer config={radarChartConfig} className="h-52 w-full text-xs">
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
        description="Faculty boxplot per term — box = middle 50%, line = median, whisker = full range · this faculty\u2019s dot (amber = below median) · click a term for details"
        leoInsight={bandLeo}
      >
        <ChartFigure
          label="Rating over time"
          summary="This faculty member's rating per term shown as a dot inside the full faculty boxplot — box is the middle fifty percent, line the median, whisker the full range."
          dataLength={trendData.length}
        >
          {() => (
            <>
              <TrajectoryBoxplot data={trendData} valueLabel="This faculty" cohortNoun="faculty" />
              <ChartDataTable
                caption="Rating over time"
                headers={['Term', 'This faculty', 'Median', 'Middle 50%', 'Faculty range', 'Faculty evaluated']}
                rows={trendData.map(d => [
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
      {/* Profile header */}
      <div className="shrink-0 flex items-start gap-4" style={{ padding: '20px 28px 16px' }}>
        <Avatar className="h-12 w-12 rounded-full shrink-0">
          <AvatarFallback
            className="rounded-full text-base font-semibold"
            style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
          >
            {faculty.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold leading-tight">{faculty.name}</h1>
            {faculty.employmentStatus && (
              <Badge variant={faculty.employmentStatus === 'inactive' ? 'outline' : 'secondary'} className="text-xs capitalize">
                {faculty.employmentStatus}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {[faculty.rank, faculty.department, faculty.position].filter(Boolean).join(' · ') || 'Faculty'}
          </p>
          {(faculty.email || faculty.phone) && (
            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
              {faculty.email && (
                <a href={`mailto:${faculty.email}`} className="flex items-center gap-1.5 hover:text-foreground">
                  <i className="fa-light fa-envelope" aria-hidden="true" />{faculty.email}
                </a>
              )}
              {faculty.phone && (
                <span className="flex items-center gap-1.5">
                  <i className="fa-light fa-phone" aria-hidden="true" />{faculty.phone}
                </span>
              )}
            </div>
          )}
        </div>
        {showPrismLink && (
          <Button variant="outline" size="sm" asChild>
            <a href={`${PRISM_BASE}/${faculty.id}`} target="_blank" rel="noopener noreferrer">
              <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
              Open in Prism
            </a>
          </Button>
        )}
      </div>

      {/* Analytics — By Faculty design + profile radar + distribution band */}
      <div className="flex-1 overflow-auto" tabIndex={0} style={{ padding: '8px 28px 28px' }}>
        <div className="flex flex-col gap-6 max-w-4xl">
          <ByFacultyPanel facultyId={faculty.id} onOpenSurvey={setSelectedSurveyId} extraCharts={extraCharts} />
        </div>
      </div>

      <EvaluationCardSheet surveyId={selectedSurveyId} onClose={() => setSelectedSurveyId(null)} />
    </>
  )
}
