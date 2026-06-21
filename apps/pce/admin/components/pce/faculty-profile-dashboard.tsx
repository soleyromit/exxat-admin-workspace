'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Avatar, AvatarFallback, Button, Badge,
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@exxatdesignux/ui'
import type { ChartConfig } from '@exxatdesignux/ui'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { EvaluationCardSheet } from '@/components/pce/evaluation-card-sheet'
import { ByFacultyPanel } from '@/components/pce/analytics-panels'
import { MOCK_FACULTY, MOCK_FACULTY_OFFERINGS } from '@/lib/pce-mock-data'

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

const trendChartConfig: ChartConfig = {
  range:   { label: 'Faculty range', color: 'var(--border)' },
  median:  { label: 'Median',        color: 'var(--muted-foreground)' },
  faculty: { label: 'This faculty',  color: 'var(--brand-color)' },
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

  // Radar + distribution band — profile-specific viz, rendered above the By Faculty panel.
  const extraCharts = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Radar — score by section */}
      <div className="rounded-xl border border-border" style={{ padding: '20px 24px', background: 'var(--card)' }}>
        <p className="text-sm font-semibold mb-1">Score by section</p>
        <p className="text-xs text-muted-foreground mb-4">Survey dimension breakdown</p>
        <ChartContainer config={radarChartConfig} className="h-52 w-full text-xs">
          <RadarChart data={radarData} outerRadius="75%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)' }} />
            <Radar dataKey="score" stroke="var(--brand-color)" fill="var(--brand-color)" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: 'var(--brand-color)' }} />
          </RadarChart>
        </ChartContainer>
      </div>

      {/* Distribution band — rating over time */}
      <div className="rounded-xl border border-border" style={{ padding: '20px 24px', background: 'var(--card)' }}>
        <p className="text-sm font-semibold mb-1">Rating over time</p>
        <p className="text-xs text-muted-foreground mb-4">
          Within full faculty distribution &nbsp;·&nbsp; ● this faculty &nbsp;·&nbsp; ─ ─ median
        </p>
        <ChartContainer config={trendChartConfig} className="h-52 w-full text-xs">
          <ComposedChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="term" tick={{ fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[2.5, 5]} ticks={[3.0, 3.5, 4.0, 4.5, 5.0]} tick={{ fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="min" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
            <Area dataKey="range" stackId="band" stroke="none" fill="var(--muted)" fillOpacity={0.5} isAnimationActive={false} />
            <Line dataKey="median" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
            <Line dataKey="faculty" stroke="var(--brand-color)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--brand-color)', strokeWidth: 0 }} connectNulls isAnimationActive={false} />
          </ComposedChart>
        </ChartContainer>
      </div>
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
