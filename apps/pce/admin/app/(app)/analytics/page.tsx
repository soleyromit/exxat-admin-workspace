'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Button, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  ToggleGroup, ToggleGroupItem,
  KeyMetrics,
  Tabs, TabsList, TabsTrigger, TabsContent,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
} from '@exxatdesignux/ui'
import type { MetricItem, ChartConfig } from '@exxatdesignux/ui'
import {
  BarChart, Bar, XAxis, YAxis, LineChart, Line, CartesianGrid, Cell,
} from 'recharts'
import { SiteHeader } from '@/components/site-header'
import { DashboardMonitor } from '@/components/pce/dashboard-monitor'
import { EvaluationCardSheet } from '@/components/pce/evaluation-card-sheet'
import { DataTable } from '@/components/data-table'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import type { ColumnDef } from '@/components/data-table/types'
import { usePce } from '@/components/pce/pce-state'
import {
  MOCK_SURVEYS, MOCK_TERMS, MOCK_COHORTS, MOCK_FACULTY, MOCK_FACULTY_OFFERINGS,
} from '@/lib/pce-mock-data'
import type { FacultyOfferingRecord, SurveyStatus } from '@/lib/pce-mock-data'

/* Satisfies DataTable's `TData extends Record<string, unknown>` constraint. */
type FacultyOfferingRow = FacultyOfferingRecord & Record<string, unknown>
type CourseTermRow = {
  id: string; courseCode: string; courseName: string
  primaryFaculty: string; enrolled: number; completion: number
  status: string; isReleased: boolean
} & Record<string, unknown>
type CourseOfferingRow = FacultyOfferingRecord & { facultyName: string } & Record<string, unknown>

/* Amber for <3.7, brand for 3.7–4.3, green for ≥4.3. No red per aarti_no_red memory. */
const tierColor = (avg: number) =>
  avg >= 4.3 ? 'var(--chart-2)' : avg >= 3.7 ? 'var(--brand-color)' : 'var(--chart-4)'

type Axis = 'term' | 'cohort'
type AnalyticsTab = 'overview' | 'term' | 'faculty' | 'course'
type NudgeTarget = { id: string; courseCode: string; courseName: string; nonResponders: number }

type FacultyRow = {
  id: string; name: string; initials: string; department: string
  coursesCount: number; avgRating: number; avgCompletion: number
  termsCount: number; offerings: FacultyOfferingRow[]
}

/* Enrollment-weighted average rating. */
function weightedAvg(offerings: FacultyOfferingRecord[]): number {
  const totalEnrolled = offerings.reduce((s, o) => s + o.enrolled, 0)
  if (totalEnrolled === 0) return 0
  return offerings.reduce((s, o) => s + o.avgRating * o.enrolled, 0) / totalEnrolled
}

/* Chronological sort order for term labels. */
const TERM_ORDER = [
  'Spring 2022','Fall 2022','Spring 2023','Fall 2023',
  'Spring 2024','Fall 2024','Spring 2025','Fall 2025','Spring 2026',
]


/* ── By Term columns ── */
function buildTermColumns(
  onNudge: (row: CourseTermRow) => void,
): ColumnDef<CourseTermRow>[] {
  return [
    {
      key: 'courseCode', label: 'Course', sortable: true,
      cell: (row) => (
        <div className="min-w-0">
          <p className="text-sm font-medium">{row.courseCode}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{row.courseName}</p>
        </div>
      ),
    },
    {
      key: 'primaryFaculty', label: 'Faculty', sortable: true,
      cell: (row) => <span className="text-sm">{row.primaryFaculty}</span>,
    },
    {
      key: 'enrolled', label: 'Enrolled', sortable: true,
      header: () => <span className="block text-right">Enrolled</span>,
      cell: (row) => <div className="text-right tabular-nums text-sm">{row.enrolled}</div>,
    },
    {
      key: 'completion', label: 'Completion', sortable: true,
      header: () => <span className="block text-right">Completion</span>,
      cell: (row) => (
        <div className="text-right tabular-nums text-sm">
          {row.completion > 0 ? `${row.completion}%` : '—'}
        </div>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true,
      cell: (row) => <SurveyStatusBadge status={row.status as SurveyStatus} />,
    },
    {
      key: 'action', label: '', width: 96,
      cell: (row) => {
        if (row.status === 'collecting') {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onNudge(row) }}
              aria-label={`Send ad-hoc reminder for ${row.courseCode}`}
            >
              Nudge
            </Button>
          )
        }
        return null
      },
    },
  ]
}

/* ── By Faculty offering columns ── */
const offeringColumns: ColumnDef<FacultyOfferingRow>[] = [
  {
    key: 'courseCode', label: 'Course', sortable: true,
    cell: (row) => (
      <div className="min-w-0">
        <p className="text-sm font-medium">{row.courseCode}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{row.courseName}</p>
      </div>
    ),
  },
  {
    key: 'term', label: 'Term', sortable: true,
    cell: (row) => <span className="text-sm">{row.term}</span>,
  },
  {
    key: 'role', label: 'Role',
    cell: (row) => <span className="text-xs capitalize text-muted-foreground">{row.role}</span>,
  },
  {
    key: 'enrolled', label: 'Enrolled', sortable: true,
    header: () => <span className="block text-right">Enrolled</span>,
    cell: (row) => <div className="text-right tabular-nums text-sm">{row.enrolled}</div>,
  },
  {
    key: 'responseRate', label: 'Completion', sortable: true,
    header: () => <span className="block text-right">Completion</span>,
    cell: (row) => <div className="text-right tabular-nums text-sm">{row.responseRate}%</div>,
  },
  {
    key: 'avgRating', label: 'Rating', sortable: true,
    header: () => <span className="block text-right">Rating</span>,
    cell: (row) => (
      <div
        className="text-right tabular-nums text-sm font-semibold"
        style={{ color: tierColor(row.avgRating) }}
      >
        {row.avgRating.toFixed(1)}
      </div>
    ),
  },
  {
    key: 'drill', label: '', width: 32,
    cell: (row) => row.surveyId ? (
      <div className="text-center">
        <i className="fa-light fa-chevron-right text-muted-foreground text-xs" aria-hidden="true" />
      </div>
    ) : null,
  },
]

/* ── By Course offering columns ── */
const courseOfferingColumns: ColumnDef<CourseOfferingRow>[] = [
  {
    key: 'term', label: 'Term', sortable: true,
    cell: (row) => <span className="text-sm">{row.term}</span>,
  },
  {
    key: 'facultyName', label: 'Faculty', sortable: true,
    cell: (row) => (
      <div className="min-w-0">
        <p className="text-sm">{row.facultyName}</p>
        <p className="text-xs capitalize text-muted-foreground">{row.role}</p>
      </div>
    ),
  },
  {
    key: 'enrolled', label: 'Enrolled', sortable: true,
    header: () => <span className="block text-right">Enrolled</span>,
    cell: (row) => <div className="text-right tabular-nums text-sm">{row.enrolled}</div>,
  },
  {
    key: 'avgRating', label: 'Rating', sortable: true,
    header: () => <span className="block text-right">Rating</span>,
    cell: (row) => (
      <div
        className="text-right tabular-nums text-sm font-semibold"
        style={{ color: tierColor(row.avgRating) }}
      >
        {row.avgRating.toFixed(1)}
      </div>
    ),
  },
  {
    key: 'responseRate', label: 'Completion', sortable: true,
    header: () => <span className="block text-right">Completion</span>,
    cell: (row) => <div className="text-right tabular-nums text-sm">{row.responseRate}%</div>,
  },
  {
    key: 'drill', label: '', width: 32,
    cell: (row) => row.surveyId ? (
      <div className="text-center">
        <i className="fa-light fa-chevron-right text-muted-foreground text-xs" aria-hidden="true" />
      </div>
    ) : null,
  },
]

/* ── Chart configs ── */
const programTrendConfig: ChartConfig = {
  courseAvg:  { label: 'Course avg',  color: 'var(--chart-1)' },
  facultyAvg: { label: 'Faculty avg', color: 'var(--chart-2)' },
}
const courseRankConfig: ChartConfig = {
  avg: { label: 'Avg rating', color: 'var(--chart-1)' },
}
const facultyRankConfig: ChartConfig = {
  avg: { label: 'Avg rating', color: 'var(--chart-2)' },
}

const AxisTick = ({ x, y, payload, textAnchor }: Record<string, any>) => (
  <text x={x} y={y} textAnchor={textAnchor ?? 'middle'} dominantBaseline="central" className="text-xs fill-muted-foreground">
    {payload?.value}
  </text>
)

/* ── Page ── */
function AnalyticsInner() {
  const { surveys } = usePce()
  const searchParams = useSearchParams()

  // Course-evaluation surveys feed the Overview monitor (excludes programmatic).
  const ceSurveysLive = useMemo(() => surveys.filter(s => s.surveyType !== 'programmatic'), [surveys])

  const [activeTab, setActiveTab]                 = useState<AnalyticsTab>(
    (searchParams?.get('tab') as AnalyticsTab) || 'overview'
  )
  const [axis, setAxis]                           = useState<Axis>('term')
  const [term, setTerm]                           = useState('Spring 2026')
  const [cohort, setCohort]                       = useState('Class of 2026')
  const [nudgeTarget, setNudgeTarget]             = useState<NudgeTarget | null>(null)
  const [selectedSurveyId, setSelectedSurveyId]   = useState<string | null>(null)
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(
    searchParams?.get('facultyId') || (MOCK_FACULTY[0]?.id ?? '')
  )
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    searchParams?.get('courseCode') || ''
  )

  /* ── By Term ── */
  // Course Evaluation analytics must exclude programmatic (institutional) surveys.
  const scopedSurveys = useMemo(
    () => axis === 'term'
      ? ceSurveysLive.filter(s => s.term === term)
      : ceSurveysLive.filter(s => s.cohort === cohort),
    [ceSurveysLive, axis, term, cohort],
  )

  const termCourseRows = useMemo((): CourseTermRow[] =>
    scopedSurveys.map(s => ({
      id: s.id,
      courseCode: s.courseCode,
      courseName: s.courseName,
      primaryFaculty: s.instructors.find(i => i.role === 'primary')?.name ?? '—',
      enrolled: s.enrollmentCount,
      completion: s.responseRate,
      status: s.status,
      isReleased: s.status === 'released' || s.status === 'closed',
    })),
    [scopedSurveys],
  )

  const byTermKpis: MetricItem[] = useMemo(() => {
    const totalEnrolled  = termCourseRows.reduce((sum, r) => sum + r.enrolled, 0)
    const totalResponses = termCourseRows.reduce((sum, r) => sum + Math.round(r.enrolled * r.completion / 100), 0)
    const overallPct     = totalEnrolled > 0 ? Math.round((totalResponses / totalEnrolled) * 100) : 0
    const collecting     = termCourseRows.filter(r => r.status === 'collecting' || r.status === 'scheduled').length
    return [
      { id: 'completion', label: 'Overall completion', value: `${overallPct}%`,         delta: '', trend: 'neutral', description: `${termCourseRows.length} courses` },
      { id: 'responses',  label: 'Responses',          value: totalResponses,            delta: '', trend: 'neutral', description: `of ${totalEnrolled} enrolled` },
      { id: 'courses',    label: 'Courses',             value: termCourseRows.length,    delta: '', trend: 'neutral', description: axis === 'term' ? term : cohort },
      { id: 'collecting', label: 'Collecting',          value: collecting,               delta: '', trend: 'neutral', description: 'still open' },
    ]
  }, [termCourseRows, axis, term, cohort])

  const termColumns = useMemo(
    () => buildTermColumns(
      (row) => setNudgeTarget({
        id: row.id,
        courseCode: row.courseCode,
        courseName: row.courseName,
        nonResponders: Math.max(0, row.enrolled - Math.round(row.enrolled * row.completion / 100)),
      }),
    ),
    [],
  )

  /* Dual-line trend: aggregate priorOfferings from CE surveys by term. */
  const programTrendData = useMemo(() => {
    const ceSurveys = MOCK_SURVEYS.filter(s => s.surveyType !== 'programmatic')
    const byTerm: Record<string, { courseAvgs: number[]; facultyAvgs: number[] }> = {}
    ceSurveys.forEach(s => {
      s.priorOfferings?.forEach(po => {
        if (!byTerm[po.term]) byTerm[po.term] = { courseAvgs: [], facultyAvgs: [] }
        byTerm[po.term].courseAvgs.push(po.courseAvg)
        if (po.facultyAvg != null) byTerm[po.term].facultyAvgs.push(po.facultyAvg)
      })
    })
    return TERM_ORDER.filter(t => byTerm[t]).map(t => ({
      term: t.replace('Spring ', 'Sp ').replace('Fall ', 'Fa '),
      courseAvg:  +(byTerm[t].courseAvgs.reduce((s, v) => s + v, 0) / byTerm[t].courseAvgs.length).toFixed(2),
      facultyAvg: byTerm[t].facultyAvgs.length > 0
        ? +(byTerm[t].facultyAvgs.reduce((s, v) => s + v, 0) / byTerm[t].facultyAvgs.length).toFixed(2)
        : null,
    }))
  }, [])

  /* All-time enrollment-weighted course rankings. */
  const courseAllTimeRanked = useMemo(() => {
    const byCode: Record<string, { totalRating: number; totalEnrolled: number }> = {}
    MOCK_FACULTY_OFFERINGS.forEach(o => {
      if (!byCode[o.courseCode]) byCode[o.courseCode] = { totalRating: 0, totalEnrolled: 0 }
      byCode[o.courseCode].totalRating   += o.avgRating * o.enrolled
      byCode[o.courseCode].totalEnrolled += o.enrolled
    })
    return Object.entries(byCode)
      .map(([code, v]) => ({ code, avg: v.totalEnrolled > 0 ? +(v.totalRating / v.totalEnrolled).toFixed(2) : 0 }))
      .filter(c => c.avg > 0)
      .sort((a, b) => b.avg - a.avg)
  }, [])

  /* All-time enrollment-weighted faculty rankings. */
  const facultyAllTimeRanked = useMemo(() => {
    const byFaculty: Record<string, { name: string; totalRating: number; totalEnrolled: number }> = {}
    MOCK_FACULTY_OFFERINGS.forEach(o => {
      const f = MOCK_FACULTY.find(fac => fac.id === o.facultyId)
      if (!f) return
      const last = f.name.split(' ').slice(-1)[0]
      if (!byFaculty[o.facultyId]) byFaculty[o.facultyId] = { name: last, totalRating: 0, totalEnrolled: 0 }
      byFaculty[o.facultyId].totalRating   += o.avgRating * o.enrolled
      byFaculty[o.facultyId].totalEnrolled += o.enrolled
    })
    return Object.values(byFaculty)
      .map(v => ({ name: v.name, avg: v.totalEnrolled > 0 ? +(v.totalRating / v.totalEnrolled).toFixed(2) : 0 }))
      .filter(f => f.avg > 0)
      .sort((a, b) => b.avg - a.avg)
  }, [])

  /* ── By Faculty ── */
  const facultyRows = useMemo((): FacultyRow[] =>
    MOCK_FACULTY.map(f => {
      const offerings     = MOCK_FACULTY_OFFERINGS.filter(o => o.facultyId === f.id) as FacultyOfferingRow[]
      const avgRating     = +(weightedAvg(offerings) * 10 | 0) / 10 || 0
      const avgCompletion = offerings.length > 0
        ? Math.round(offerings.reduce((s, o) => s + o.responseRate, 0) / offerings.length) : 0
      const uniqueTerms   = [...new Set(offerings.map(o => o.term))]
      return {
        id: f.id, name: f.name, initials: f.initials,
        department: f.department ?? '—',
        coursesCount: offerings.length,
        avgRating, avgCompletion, termsCount: uniqueTerms.length,
        offerings,
      }
    }),
    [],
  )

  const selectedFaculty = useMemo(
    () => facultyRows.find(f => f.id === selectedFacultyId) ?? null,
    [facultyRows, selectedFacultyId],
  )

  const facultyKpis: MetricItem[] = useMemo(() => {
    if (!selectedFaculty) return []
    return [
      { id: 'f-courses',    label: 'Courses taught', value: selectedFaculty.coursesCount,                                                    delta: '', trend: 'neutral', description: 'across all terms' },
      { id: 'f-rating',     label: 'Avg rating',     value: selectedFaculty.avgRating > 0 ? `${selectedFaculty.avgRating.toFixed(1)}/5` : '—', delta: '', trend: 'neutral', description: 'enrollment-weighted' },
      { id: 'f-completion', label: 'Avg completion', value: selectedFaculty.avgCompletion > 0 ? `${selectedFaculty.avgCompletion}%` : '—',    delta: '', trend: 'neutral', description: 'all offerings' },
      { id: 'f-terms',      label: 'Terms active',   value: selectedFaculty.termsCount,                                                      delta: '', trend: 'neutral', description: 'term appearances' },
    ]
  }, [selectedFaculty])

  /* Comparative bars: own vs dept avg vs school avg (enrollment-weighted). */
  const compareData = useMemo(() => {
    if (!selectedFaculty) return []
    const ownOfferings  = MOCK_FACULTY_OFFERINGS.filter(o => o.facultyId === selectedFaculty.id)
    const deptIds       = MOCK_FACULTY.filter(f => f.department === selectedFaculty.department).map(f => f.id)
    const deptOfferings = MOCK_FACULTY_OFFERINGS.filter(o => deptIds.includes(o.facultyId))
    return [
      { label: 'School avg',  rating: +weightedAvg(MOCK_FACULTY_OFFERINGS).toFixed(2) },
      { label: 'Dept avg',    rating: +weightedAvg(deptOfferings).toFixed(2) },
      { label: selectedFaculty.name.split(' ').slice(-1)[0], rating: +weightedAvg(ownOfferings).toFixed(2) },
    ]
  }, [selectedFaculty])

  /* ── By Course ── */
  const distinctCourses = useMemo(() => {
    const seen = new Set<string>()
    const list: { code: string; name: string }[] = []
    MOCK_FACULTY_OFFERINGS.forEach(o => {
      if (!seen.has(o.courseCode)) {
        seen.add(o.courseCode)
        list.push({ code: o.courseCode, name: o.courseName })
      }
    })
    return list.sort((a, b) => a.code.localeCompare(b.code))
  }, [])

  const effectiveCourseCode = selectedCourseCode || distinctCourses[0]?.code || ''

  const courseOfferings = useMemo((): CourseOfferingRow[] => {
    if (!effectiveCourseCode) return []
    return MOCK_FACULTY_OFFERINGS
      .filter(o => o.courseCode === effectiveCourseCode)
      .map(o => ({
        ...o,
        facultyName: MOCK_FACULTY.find(f => f.id === o.facultyId)?.name ?? '—',
      }) as CourseOfferingRow)
      .sort((a, b) => b.term.localeCompare(a.term))
  }, [effectiveCourseCode])

  const courseKpis: MetricItem[] = useMemo(() => {
    if (!courseOfferings.length) return []
    const avgRating     = +weightedAvg(courseOfferings).toFixed(1)
    const avgCompletion = Math.round(courseOfferings.reduce((s, o) => s + o.responseRate, 0) / courseOfferings.length)
    const sorted        = [...courseOfferings].sort((a, b) => a.term.localeCompare(b.term))
    const trendDir      = sorted.length >= 2
      ? (sorted[sorted.length - 1].avgRating >= sorted[sorted.length - 2].avgRating ? '↗' : '↘')
      : '—'
    return [
      { id: 'c-count',      label: 'Times offered',  value: courseOfferings.length,  delta: '', trend: 'neutral', description: 'all terms' },
      { id: 'c-rating',     label: 'Avg rating',     value: `${avgRating}/5`,        delta: '', trend: 'neutral', description: 'enrollment-weighted' },
      { id: 'c-completion', label: 'Avg completion', value: `${avgCompletion}%`,     delta: '', trend: 'neutral', description: 'all offerings' },
      { id: 'c-trend',      label: 'Trend',          value: trendDir,                delta: '', trend: 'neutral', description: 'vs prior term' },
    ]
  }, [courseOfferings])

  /* Rating trend for selected course (enrollment-weighted per term). */
  const courseTrendData = useMemo(() => {
    if (!courseOfferings.length) return []
    const byTerm: Record<string, { total: number; enrolled: number }> = {}
    courseOfferings.forEach(o => {
      if (!byTerm[o.term]) byTerm[o.term] = { total: 0, enrolled: 0 }
      byTerm[o.term].total   += o.avgRating * o.enrolled
      byTerm[o.term].enrolled += o.enrolled
    })
    return TERM_ORDER.filter(t => byTerm[t]).map(t => ({
      term:   t.replace('Spring ', 'Sp ').replace('Fall ', 'Fa '),
      rating: +(byTerm[t].total / byTerm[t].enrolled).toFixed(2),
    }))
  }, [courseOfferings])

  const scopeLabel = axis === 'term' ? term : cohort

  return (
    <>
      <SiteHeader title="Dashboard" />

      <div className="flex items-center gap-3 shrink-0" style={{ padding: '14px 28px 0' }}>
        <h1 className="flex-1 text-[22px] font-normal" style={{ fontFamily: 'var(--font-heading)' }}>Dashboard</h1>
        <Button variant="outline" size="sm">
          <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
          Export
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as AnalyticsTab)}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="border-b border-border shrink-0" style={{ padding: '0 28px' }}>
          <TabsList variant="line">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="term">By Term</TabsTrigger>
            <TabsTrigger value="faculty">By Faculty</TabsTrigger>
            <TabsTrigger value="course">By Course</TabsTrigger>
          </TabsList>
        </div>

        {/* ───── Overview (monitoring) ───── */}
        <TabsContent value="overview" className="flex-1 overflow-auto m-0" style={{ padding: '20px 28px 28px' }}>
          <DashboardMonitor surveys={ceSurveysLive} onNudge={setNudgeTarget} />
        </TabsContent>

        {/* ───── By Term ───── */}
        <TabsContent value="term" className="flex-1 overflow-auto m-0" style={{ padding: '20px 28px 28px' }}>
          <div className="flex flex-col gap-6 max-w-4xl">

            <div className="flex items-center gap-3">
              <ToggleGroup
                type="single"
                value={axis}
                onValueChange={(v) => v && setAxis(v as Axis)}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="term"   aria-label="View by term">Term</ToggleGroupItem>
                <ToggleGroupItem value="cohort" aria-label="View by cohort">Cohort</ToggleGroupItem>
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
            </div>

            {termCourseRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
                <i className="fa-light fa-chart-mixed text-muted-foreground text-4xl" aria-hidden="true" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">No courses for {scopeLabel}</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Activate a term to see surveys here.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <KeyMetrics variant="compact" metricsSingleRow metrics={byTermKpis} />

                {/* Program-level trend (full width) */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Program trend</CardTitle>
                    <CardDescription>Course rating vs. faculty rating across terms.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={programTrendConfig}
                      className="w-full"
                      style={{ height: 168 }}
                      role="img"
                      aria-label="Program trend: course avg vs faculty avg across historical terms"
                    >
                      <LineChart data={programTrendData} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis
                          dataKey="term"
                          tick={{ fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          domain={[3.4, 4.8]}
                          tickFormatter={(v: number) => v.toFixed(1)}
                          tick={{ fill: 'var(--muted-foreground)' }}
                          tickLine={false}
                          axisLine={false}
                          width={28}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent formatter={(v: unknown) => [`${(v as number).toFixed(2)}/5`, '']} />
                          }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="courseAvg"  stroke="var(--color-courseAvg)"  strokeWidth={2} dot={{ r: 3, fill: 'var(--color-courseAvg)'  }} activeDot={{ r: 4 }} isAnimationActive={false} />
                        <Line type="monotone" dataKey="facultyAvg" stroke="var(--color-facultyAvg)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-facultyAvg)' }} activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Leaderboards: course rankings + faculty rankings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* All-time course rankings */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Course rankings</CardTitle>
                      <CardDescription>Enrollment-weighted avg, all time. Color = tier.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={courseRankConfig}
                        style={{ height: `${courseAllTimeRanked.length * 24 + 8}px` }}
                        className="w-full"
                        role="img"
                        aria-label="Course rankings by enrollment-weighted average rating"
                      >
                        <BarChart
                          layout="vertical"
                          data={courseAllTimeRanked}
                          margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
                        >
                          <XAxis type="number" domain={[0, 5]} hide />
                          <YAxis
                            type="category"
                            dataKey="code"
                            width={68}
                            tick={{ fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Bar dataKey="avg" radius={[0, 3, 3, 0]} maxBarSize={14} background={{ fill: 'var(--muted)' }}>
                            {courseAllTimeRanked.map((c) => (
                              <Cell key={c.code} fill={tierColor(c.avg)} />
                            ))}
                          </Bar>
                          <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent formatter={(v: unknown) => [`${(v as number).toFixed(2)}/5`, 'Avg rating']} />
                            }
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* All-time faculty rankings */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Faculty rankings</CardTitle>
                      <CardDescription>Enrollment-weighted avg, all time. Color = tier.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={facultyRankConfig}
                        style={{ height: `${facultyAllTimeRanked.length * 24 + 8}px` }}
                        className="w-full"
                        role="img"
                        aria-label="Faculty rankings by enrollment-weighted average rating"
                      >
                        <BarChart
                          layout="vertical"
                          data={facultyAllTimeRanked}
                          margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
                        >
                          <XAxis type="number" domain={[0, 5]} hide />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={68}
                            tick={{ fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Bar dataKey="avg" radius={[0, 3, 3, 0]} maxBarSize={14} background={{ fill: 'var(--muted)' }}>
                            {facultyAllTimeRanked.map((f) => (
                              <Cell key={f.name} fill={tierColor(f.avg)} />
                            ))}
                          </Bar>
                          <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent formatter={(v: unknown) => [`${(v as number).toFixed(2)}/5`, 'Avg rating']} />
                            }
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-sm font-semibold">Courses in {scopeLabel}</h2>
                  <p className="text-xs text-muted-foreground">
                    Click a released row to open its Evaluation Card. Use Nudge to send an ad-hoc reminder to non-responders.
                  </p>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <DataTable<CourseTermRow>
                      data={termCourseRows}
                      columns={termColumns}
                      getRowId={(row) => row.id}
                      selectable={false}
                      searchable={false}
                      onRowClick={(row) => setSelectedSurveyId(row.id)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ───── By Faculty ───── */}
        <TabsContent value="faculty" className="flex-1 overflow-auto m-0" style={{ padding: '20px 28px 28px' }}>
          <div className="flex flex-col gap-6 max-w-4xl">

            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground shrink-0" htmlFor="faculty-select">
                Faculty
              </label>
              <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                <SelectTrigger id="faculty-select" className="h-8 w-56 text-sm" aria-label="Select faculty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_FACULTY.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFaculty ? (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color-dark)' }}
                    aria-hidden="true"
                  >
                    {selectedFaculty.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{selectedFaculty.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedFaculty.department}</p>
                  </div>
                </div>

                <KeyMetrics variant="compact" metricsSingleRow metrics={facultyKpis} />

                {/* Comparative context: own vs dept avg vs school avg */}
                {compareData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Comparative context</CardTitle>
                      <CardDescription>
                        Enrollment-weighted avg vs. {selectedFaculty.department} dept and program average.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-3">
                        {compareData.map((d, i) => {
                          const isOwn = i === compareData.length - 1
                          return (
                            <div key={d.label} className="flex items-center gap-3">
                              <span className="text-xs w-24 shrink-0 truncate" style={{ color: isOwn ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{d.label}</span>
                              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                                <div className="h-3 rounded-full" style={{ width: `${(d.rating / 5) * 100}%`, background: isOwn ? 'var(--brand-color)' : 'var(--muted-foreground)', opacity: isOwn ? 1 : 0.45 }} />
                              </div>
                              <span className="text-sm font-semibold tabular-nums w-10 text-right" style={{ color: isOwn ? 'var(--brand-color)' : 'var(--muted-foreground)' }}>{d.rating.toFixed(1)}<span className="text-muted-foreground font-normal text-xs">/5</span></span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex flex-col gap-2">
                  <h2 className="text-sm font-semibold">
                    Offerings by {selectedFaculty.name.split(' ').slice(1).join(' ') || selectedFaculty.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Rows with <i className="fa-light fa-chevron-right" aria-hidden="true" /> have evaluation data — click to open the card.
                  </p>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <DataTable<FacultyOfferingRow>
                      data={selectedFaculty.offerings}
                      columns={offeringColumns}
                      getRowId={(row) => `${row.facultyId}-${row.term}-${row.courseCode}`}
                      selectable={false}
                      searchable={false}
                      onRowClick={(row) => { if (row.surveyId) setSelectedSurveyId(row.surveyId) }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
                <i className="fa-light fa-user-tie text-4xl" aria-hidden="true" />
                <p className="text-sm">Select a faculty member above to view their offerings.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ───── By Course ───── */}
        <TabsContent value="course" className="flex-1 overflow-auto m-0" style={{ padding: '20px 28px 28px' }}>
          <div className="flex flex-col gap-6 max-w-4xl">

            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground shrink-0" htmlFor="course-select">
                Course
              </label>
              <Select value={effectiveCourseCode} onValueChange={setSelectedCourseCode}>
                <SelectTrigger id="course-select" className="h-8 w-64 text-sm" aria-label="Select course">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {distinctCourses.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {courseOfferings.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
                <i className="fa-light fa-chart-line text-4xl" aria-hidden="true" />
                <p className="text-sm">Select a course above to view its cross-term history.</p>
              </div>
            ) : (
              <>
                <KeyMetrics variant="compact" metricsSingleRow metrics={courseKpis} />

                {/* Rating trend for this course */}
                {courseTrendData.length >= 2 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Rating trend — {effectiveCourseCode}</CardTitle>
                      <CardDescription>Enrollment-weighted avg rating per term.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Inline SVG line — reliable in tabs (recharts ResponsiveContainer
                          measures 0 height when mounted inside an inactive Radix tab). */}
                      {(() => {
                        const data = courseTrendData
                        const MIN = 3, MAX = 5
                        const n = data.length
                        const X = (i: number) => n <= 1 ? 50 : (i / (n - 1)) * 100
                        const Y = (r: number) => 6 + (1 - (Math.max(MIN, Math.min(MAX, r)) - MIN) / (MAX - MIN)) * 88
                        const pts = data.map((d, i) => `${X(i)},${Y(d.rating)}`).join(' ')
                        return (
                          <div className="flex flex-col" style={{ height: 140 }} role="img" aria-label={`Rating trend for ${effectiveCourseCode}: ${data.map(d => `${d.term} ${d.rating}`).join(', ')}`}>
                            <div className="flex flex-1 gap-1">
                              {/* y-axis gutter */}
                              <div className="relative w-7 shrink-0">
                                {[5, 4, 3].map(v => (
                                  <span key={v} className="absolute right-1 text-[10px] text-muted-foreground tabular-nums -translate-y-1/2" style={{ top: `${Y(v)}%` }}>{v.toFixed(1)}</span>
                                ))}
                              </div>
                              {/* plot area — single 0–100% coordinate space for grid, line and dots */}
                              <div className="relative flex-1">
                                {[5, 4, 3].map(v => (
                                  <div key={v} className="absolute inset-x-0 border-t border-border" style={{ top: `${Y(v)}%` }} />
                                ))}
                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                                  <polyline points={pts} fill="none" stroke="var(--brand-color)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                                </svg>
                                {data.map((d, i) => (
                                  <div key={i} className="absolute size-2 rounded-full -translate-x-1/2 -translate-y-1/2" style={{ left: `${X(i)}%`, top: `${Y(d.rating)}%`, background: 'var(--brand-color)' }} title={`${d.term}: ${d.rating}/5`} />
                                ))}
                              </div>
                            </div>
                            {/* x-axis labels aligned under the plot area */}
                            <div className="flex gap-1">
                              <div className="w-7 shrink-0" />
                              <div className="flex-1 flex justify-between mt-1">
                                {data.map((d, i) => (
                                  <span key={i} className="text-[10px] text-muted-foreground">{d.term}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                )}

                <div className="flex flex-col gap-2">
                  <h2 className="text-sm font-semibold">Offerings of {effectiveCourseCode}</h2>
                  <p className="text-xs text-muted-foreground">
                    Click any row to open the Evaluation Card for that term.
                  </p>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <DataTable<CourseOfferingRow>
                      data={courseOfferings}
                      columns={courseOfferingColumns}
                      getRowId={(row) => `${row.courseCode}-${row.term}-${row.facultyId}`}
                      selectable={false}
                      searchable={false}
                      onRowClick={(row) => { if (row.surveyId) setSelectedSurveyId(row.surveyId) }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ───── Evaluation Card ───── */}
      <EvaluationCardSheet
        surveyId={selectedSurveyId}
        onClose={() => setSelectedSurveyId(null)}
      />

      {/* ───── Nudge confirmation ───── */}
      <AlertDialog open={!!nudgeTarget} onOpenChange={(open) => !open && setNudgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send ad-hoc reminder</AlertDialogTitle>
            <AlertDialogDescription>
              {nudgeTarget && (
                <>
                  Send an immediate reminder to{' '}
                  <strong>
                    {nudgeTarget.nonResponders} non-responder{nudgeTarget.nonResponders !== 1 ? 's' : ''}
                  </strong>{' '}
                  in <strong>{nudgeTarget.courseCode} — {nudgeTarget.courseName}</strong>.
                  This is an out-of-schedule nudge.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Send reminder</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense>
      <AnalyticsInner />
    </Suspense>
  )
}
