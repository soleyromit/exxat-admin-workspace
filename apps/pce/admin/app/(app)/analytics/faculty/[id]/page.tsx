'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Avatar, AvatarFallback, KeyMetrics, Button, Badge,
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from '@exxatdesignux/ui'
import type { MetricItem, ChartConfig } from '@exxatdesignux/ui'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts'
import { SiteHeader } from '@/components/site-header'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { MOCK_FACULTY, MOCK_FACULTY_OFFERINGS } from '@/lib/pce-mock-data'

const PRISM_BASE = 'https://app.exxat.com/prism/dpt/faculty'

const TERM_ORDER = [
  'Spring 2022','Fall 2022','Spring 2023','Fall 2023',
  'Spring 2024','Fall 2024','Spring 2025','Fall 2025','Spring 2026',
]

const tierColor = (avg: number) =>
  avg >= 4.3 ? 'var(--chart-2)' : avg >= 3.7 ? 'var(--brand-color)' : 'var(--chart-4)'

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

type OfferingRow = {
  id: string; courseCode: string; courseName: string
  term: string; role: string; enrolled: number
  responseRate: number; avgRating: number
} & Record<string, unknown>

const offeringColumns: ColumnDef<OfferingRow>[] = [
  {
    key: 'courseCode', label: 'Course', sortable: true,
    cell: (row) => (
      <div>
        <p className="text-sm font-medium">{row.courseCode}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{row.courseName}</p>
      </div>
    ),
  },
  {
    key: 'term', label: 'Term', sortable: true, width: 140,
    cell: (row) => <span className="text-sm text-muted-foreground">{row.term}</span>,
  },
  {
    key: 'role', label: 'Role', width: 110,
    cell: (row) => (
      <span className="text-xs capitalize" style={{ color: 'var(--muted-foreground)' }}>{row.role}</span>
    ),
  },
  {
    key: 'enrolled', label: 'Students', sortable: true, width: 90,
    header: () => <span className="block text-right">Students</span>,
    cell: (row) => <div className="text-right text-sm tabular-nums">{row.enrolled}</div>,
  },
  {
    key: 'responseRate', label: 'Completion', sortable: true, width: 110,
    header: () => <span className="block text-right">Completion</span>,
    cell: (row) => (
      <div className="text-right text-sm tabular-nums font-semibold"
        style={{ color: row.responseRate >= 70 ? 'var(--chart-2)' : row.responseRate >= 50 ? 'var(--brand-color)' : 'var(--chart-4)' }}>
        {row.responseRate}%
      </div>
    ),
  },
  {
    key: 'avgRating', label: 'Rating', sortable: true, width: 90,
    header: () => <span className="block text-right">Rating</span>,
    cell: (row) => (
      <div className="text-right text-sm tabular-nums font-semibold"
        style={{ color: tierColor(row.avgRating) }}>
        {row.avgRating.toFixed(1)}
      </div>
    ),
  },
]

const trendChartConfig: ChartConfig = {
  range:   { label: 'Faculty range', color: 'var(--border)' },
  median:  { label: 'Median',        color: 'var(--muted-foreground)' },
  faculty: { label: 'This faculty',  color: 'var(--brand-color)' },
}

const radarChartConfig: ChartConfig = {
  score: { label: 'Score', color: 'var(--brand-color)' },
}

export default function FacultyAnalyticsProfile() {
  const params   = useParams<{ id: string }>()
  const search   = useSearchParams()
  const fromDir  = search?.get('from') === 'directory'
  const facultyId = params?.id ?? ''

  const faculty = MOCK_FACULTY.find(f => f.id === facultyId)
  const offerings = MOCK_FACULTY_OFFERINGS.filter(o => o.facultyId === facultyId)

  const totalEnrolled = offerings.reduce((s, o) => s + o.enrolled, 0)
  const avgRating = totalEnrolled > 0
    ? +(offerings.reduce((s, o) => s + o.avgRating * o.enrolled, 0) / totalEnrolled).toFixed(2)
    : null
  const avgCompletion = totalEnrolled > 0
    ? +(offerings.reduce((s, o) => s + o.responseRate * o.enrolled, 0) / totalEnrolled).toFixed(1)
    : null
  const uniqueCourses = new Set(offerings.map(o => o.courseCode)).size
  const uniqueTerms   = new Set(offerings.map(o => o.term)).size

  // Distribution band data: per term, all faculty min/max/median + this faculty
  const trendData = useMemo(() => {
    const termsWithData = TERM_ORDER.filter(t =>
      MOCK_FACULTY_OFFERINGS.some(o => o.term === t)
    )
    return termsWithData.map(term => {
      const allThisTerm = MOCK_FACULTY_OFFERINGS.filter(o => o.term === term)
      const scores = allThisTerm.map(o => o.avgRating)
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

  const radarData = useMemo(() =>
    avgRating !== null ? sectionScores(facultyId, avgRating) : [],
  [facultyId, avgRating])

  // Peer rank: how many faculty have a lower avg rating
  const peerRank = useMemo(() => {
    if (avgRating === null) return null
    const allAvgs = MOCK_FACULTY.map(f => {
      const os = MOCK_FACULTY_OFFERINGS.filter(o => o.facultyId === f.id)
      const te = os.reduce((s, o) => s + o.enrolled, 0)
      return te > 0 ? os.reduce((s, o) => s + o.avgRating * o.enrolled, 0) / te : null
    }).filter((v): v is number => v !== null)
    const better = allAvgs.filter(v => v < avgRating).length
    const pct = Math.round((better / allAvgs.length) * 100)
    return `Top ${100 - pct}%`
  }, [avgRating, facultyId])

  const kpis: MetricItem[] = [
    { id: 'rating',     label: 'Avg rating',    value: avgRating     !== null ? `${avgRating}/5` : '—', delta: '', trend: 'neutral' },
    { id: 'completion', label: 'Completion',     value: avgCompletion !== null ? `${avgCompletion}%` : '—', delta: '', trend: 'neutral' },
    { id: 'courses',    label: 'Courses taught', value: uniqueCourses,  delta: '', trend: 'neutral' },
    { id: 'terms',      label: 'Terms active',   value: uniqueTerms,    delta: '', trend: 'neutral' },
    { id: 'students',   label: 'Students taught', value: totalEnrolled.toLocaleString(), delta: '', trend: 'neutral' },
    { id: 'rank',       label: 'Peer rank',      value: peerRank ?? '—', delta: '', trend: 'neutral' },
  ]

  const offeringRows: OfferingRow[] = [...offerings]
    .sort((a, b) => TERM_ORDER.indexOf(b.term) - TERM_ORDER.indexOf(a.term))
    .map((o, i) => ({ ...o, id: `${o.facultyId}-${o.courseCode}-${o.term}-${i}` }))

  if (!faculty) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-2">
        <i className="fa-light fa-user-slash text-muted-foreground" aria-hidden="true" style={{ fontSize: 32 }} />
        <p className="text-sm text-muted-foreground">Faculty not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/analytics">Back to Analytics</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <SiteHeader
        breadcrumbs={fromDir
          ? [{ label: 'Faculty Directory', href: '/admin/faculty' }]
          : [{ label: 'Analytics', href: '/analytics' }]
        }
        title={faculty.name}
      />

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
        <Button variant="outline" size="sm" asChild>
          <a href={`${PRISM_BASE}/${faculty.id}`} target="_blank" rel="noopener noreferrer">
            <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 11 }} />
            Open in Prism
          </a>
        </Button>
      </div>

      {/* KPI strip */}
      <div className="shrink-0 [&_*]:!border-e-0 px-4 lg:px-6" style={{ paddingBlock: 4 }}>
        <KeyMetrics variant="compact" showHeader={false} metricsSingleRow metrics={kpis} />
      </div>

      {/* Charts row */}
      <div className="shrink-0 grid grid-cols-2 gap-4 px-4 lg:px-6" style={{ paddingTop: 20, paddingBottom: 4 }}>

        {/* Radar — score by section */}
        <div className="rounded-xl border border-border" style={{ padding: '20px 24px', background: 'var(--card)' }}>
          <p className="text-sm font-semibold mb-1">Score by section</p>
          <p className="text-xs text-muted-foreground mb-4">Survey dimension breakdown</p>
          <ChartContainer config={radarChartConfig} className="h-52 w-full">
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              />
              <Radar
                dataKey="score"
                stroke="var(--brand-color)"
                fill="var(--brand-color)"
                fillOpacity={0.15}
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--brand-color)' }}
              />
            </RadarChart>
          </ChartContainer>
        </div>

        {/* Distribution band — rating over time */}
        <div className="rounded-xl border border-border" style={{ padding: '20px 24px', background: 'var(--card)' }}>
          <p className="text-sm font-semibold mb-1">Rating over time</p>
          <p className="text-xs text-muted-foreground mb-4">
            Within full faculty distribution &nbsp;·&nbsp; ● this faculty &nbsp;·&nbsp; ─ ─ median
          </p>
          <ChartContainer config={trendChartConfig} className="h-52 w-full">
            <ComposedChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="term"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[2.5, 5]}
                ticks={[3.0, 3.5, 4.0, 4.5, 5.0]}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              {/* Range band: stacked area min + range */}
              <Area
                dataKey="min"
                stackId="band"
                stroke="none"
                fill="transparent"
                isAnimationActive={false}
              />
              <Area
                dataKey="range"
                stackId="band"
                stroke="none"
                fill="var(--muted)"
                fillOpacity={0.5}
                isAnimationActive={false}
              />
              {/* Median dashed line */}
              <Line
                dataKey="median"
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                isAnimationActive={false}
              />
              {/* This faculty's line */}
              <Line
                dataKey="faculty"
                stroke="var(--brand-color)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: 'var(--brand-color)', strokeWidth: 0 }}
                connectNulls
                isAnimationActive={false}
              />
            </ComposedChart>
          </ChartContainer>
        </div>
      </div>

      {/* Courses table */}
      <div className="flex-1 overflow-auto" style={{ padding: '20px 16px 28px' }}>
        <div className="max-w-4xl">
          <p className="text-sm font-semibold px-2 lg:px-4 mb-3">
            All courses &nbsp;<span className="text-muted-foreground font-normal">({offeringRows.length})</span>
          </p>
          <DataTable<OfferingRow>
            data={offeringRows}
            columns={offeringColumns}
            getRowId={(row) => row.id}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-8">
                <i className="fa-light fa-book text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm text-muted-foreground">No courses found</p>
              </div>
            }
          />
        </div>
      </div>
    </>
  )
}
