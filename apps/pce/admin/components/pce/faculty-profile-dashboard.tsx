'use client'

import { useMemo, useState } from 'react'
import {
  Avatar, AvatarFallback, Button, Badge,
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
import { FacultyPortfolioCharts } from '@/components/pce/faculty-portfolio-charts'
import { CHART_AXIS_TICK } from '@/lib/chart-typography'
import { EvaluationCardSheet } from '@/components/pce/evaluation-card-sheet'
import { ByFacultyPanel } from '@/components/pce/analytics-panels'
import { MOCK_FACULTY, MOCK_FACULTY_OFFERINGS } from '@/lib/pce-mock-data'

// Shared by the admin "By Faculty" profile (/admin/faculty/[id]) and the faculty
// self-view (/my-dashboard) — which is exactly why `lens` exists: the two differ by more
// than chrome. Peer-comparison content is admin-only (§7.3); everything else is the
// person's own data and is safe on both.

const PRISM_BASE = 'https://app.exxat.com/prism/dpt/faculty'

const TERM_ORDER = [
  'Spring 2022', 'Fall 2022', 'Spring 2023', 'Fall 2023',
  'Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026',
]

/**
 * REMOVED 2026-07-14 — the "Score by section" radar was fabricated.
 *
 * It synthesised five dimensions (Delivery / Preparation / Accessibility / Communication /
 * Fairness) from `avgRating + offsets[(i + seed) % 5]`, seeded off a charCode of the faculty
 * id. None of that is measured:
 *   · `TemplateSection` (pce-mock-data.ts) has THREE values — course_content,
 *     faculty_performance, course_director — not those five.
 *   · `PceResponse.sectionScores` is keyed by `surveyId` only and carries no `facultyId`, so
 *     a per-faculty section breakdown is not derivable at all; co-taught instructors would
 *     be byte-identical anyway (`deriveResultsForSurvey`).
 *
 * Invented numbers with invented labels on a real person's review page is worse than an
 * absent chart, so it is gone rather than restyled. Stories 1/8/17 ("theme breakdown per
 * faculty") need a data-model decision — add `facultyId` to `sectionScores` — before any
 * chart here is honest. Monil also treats themes as conditional ("if we are capturing the
 * theme"), so this is not a blocker to route around, it is a question to answer first.
 */

const trendChartConfig: ChartConfig = {
  range:   { label: 'Faculty range', color: 'var(--border)' },
  median:  { label: 'Median',        color: 'var(--muted-foreground)' },
  faculty: { label: 'This faculty',  color: 'var(--brand-color)' },
}

export function FacultyProfileDashboard({
  facultyId,
  showPrismLink = false,
  lens = 'admin',
}: {
  facultyId: string
  /** Admin view shows an "Open in Prism" affordance; the faculty self-view hides it. */
  showPrismLink?: boolean
  /**
   * Which side of the RBAC boundary this render is on.
   *
   * `course-evaluation.md` §7.3 bans, on the faculty self-view, "any peer-comparison metric
   * ('you're at the 60th percentile' included — that reverse-encodes peer rank)". A
   * dot-on-distribution is exactly that in visual form: you can count the dots to your left.
   * So the peer distribution renders for `admin` only.
   *
   * D2's exact boundary is still unwritten and only Aarti can draw it — the report-access
   * matrix has been P0-assigned since 2026-05-28 and never written. Until it is, this
   * defaults to the conservative side: withhold rather than leak.
   */
  lens?: 'admin' | 'self'
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
      const min = Math.min(...scores)
      const max = Math.max(...scores)
      const sorted = [...scores].sort((a, b) => a - b)
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]
      const facultyThisTerm = offerings.find(o => o.term === term)
      return {
        term: term.replace('Spring ', 'Sp ').replace('Fall ', 'F '),
        min: +min.toFixed(2),
        range: +(max - min).toFixed(2),
        median: +median.toFixed(2),
        faculty: facultyThisTerm ? +facultyThisTerm.avgRating.toFixed(2) : null,
      }
    })
  }, [offerings])

  if (!faculty) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-2">
        <i className="fa-light fa-user-slash text-3xl text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Faculty not found</p>
      </div>
    )
  }

  const lastWithFaculty = [...trendData].reverse().find(d => d.faculty != null) ?? null
  const bandLeo: ChartLeoInsight | null = lastWithFaculty
    ? (() => {
        const diff = +(lastWithFaculty.faculty! - lastWithFaculty.median).toFixed(2)
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
            `${lastWithFaculty.term}: own ${lastWithFaculty.faculty!.toFixed(2)}/5 · median ${lastWithFaculty.median.toFixed(2)}/5.`,
            `Band spans ${lastWithFaculty.min.toFixed(2)}–${(lastWithFaculty.min + lastWithFaculty.range).toFixed(2)} this term.`,
          ],
          anchor: { xValue: lastWithFaculty.term, yDataKeys: ['faculty'] },
        }
      })()
    : null

  // Portfolio charts — the shared portfolio (stories 11/15/16/19), which /analytics?tab=faculty
  // renders too so both doors to a faculty member show the same thing, plus this route's own
  // distribution band.
  const extraCharts = (
    <>
      <FacultyPortfolioCharts facultyId={facultyId} avgRating={avgRating} lens={lens} />

      <ChartCard
        variant="normal"
        title="Rating over time"
        description="Within full faculty distribution · ● this faculty · ─ ─ median"
        leoInsight={bandLeo}
      >
        <ChartFigure
          label="Rating over time"
          summary="This faculty member's rating per term plotted inside the full faculty distribution band, with the median as a dashed line."
          dataLength={trendData.length}
        >
          {(activeIndex) => (
            <>
              <div className="relative w-full">
                <ChartContainer config={trendChartConfig} className="h-52 w-full text-xs">
                  <ComposedChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="term" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis domain={[2.5, 5]} ticks={[3.0, 3.5, 4.0, 4.5, 5.0]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                    <ChartTooltip key={chartTooltipKeyboardSyncProps(activeIndex).key} {...chartTooltipKeyboardSyncProps(activeIndex).props} content={<ChartTooltipContent />} />
                    <Area dataKey="min" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
                    <Area dataKey="range" stackId="band" stroke="none" fill="var(--muted)" fillOpacity={0.5} isAnimationActive={false} />
                    <Line dataKey="median" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
                    <Line dataKey="faculty" stroke="var(--brand-color)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--brand-color)', strokeWidth: 0 }} activeDot={{ r: 5, stroke: 'var(--ring)', strokeWidth: 2 }} connectNulls isAnimationActive={false} />
                  </ComposedChart>
                </ChartContainer>
                <ChartLeoPlotInsightOverlay
                  data={trendData.map(({ term: t, faculty, median }) => ({ term: t, faculty, median }))}
                  xDataKey="term"
                />
              </div>
              <ChartDataTable
                caption="Rating over time"
                headers={['Term', 'This faculty', 'Median']}
                rows={trendData.map(d => [d.term, d.faculty != null ? d.faculty.toFixed(2) : '—', d.median.toFixed(2)])}
              />
            </>
          )}
        </ChartFigure>
      </ChartCard>
    </>
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
