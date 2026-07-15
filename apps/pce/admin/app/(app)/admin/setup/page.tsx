'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Card, CardContent, CardHeader, CardTitle,
  Avatar, AvatarFallback,
  Badge,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Button,
  KeyMetrics,
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@exxatdesignux/ui'
import type { ChartConfig, MetricItem } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { TruncatedText } from '@/components/truncated-text'
import { usePce } from '@/components/pce/pce-state'
import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'
import { OfferingStatusBadge, EnrollmentStatusBadge } from '@/components/pce/pce-badges'
import { EvaluationCardSheet } from '@/components/pce/evaluation-card-sheet'
import {
  MOCK_PROGRAM_TERMS, MOCK_SURVEYS, MOCK_FACULTY, MOCK_FACULTY_OFFERINGS,
  MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_STUDENTS, MOCK_COHORTS,
  MOCK_COURSE_ENROLLMENTS,
  type CourseOffering, type Student,
} from '@/lib/pce-mock-data'
import { SetupView } from './_view-setup'
import { CollectingView } from './_view-collecting'
import { CountdownView } from './_view-countdown'
import { ReleaseRoomView } from './_view-release-room'
import { RetrospectiveView } from './_view-retrospective'

const MOCK_TODAY = new Date('2026-05-01')

type OverviewState = 'setup' | 'collecting' | 'countdown' | 'release-room' | 'retrospective'

function getOverviewState(surveys: ReturnType<typeof Array.prototype.filter>): OverviewState {
  const ce = surveys.filter((s: any) => s.surveyType === 'course_evaluation')
  if (ce.length === 0) return 'setup'
  if (ce.every((s: any) => s.status === 'released')) return 'retrospective'
  const collecting = ce.filter((s: any) => s.status === 'collecting')
  if (collecting.length === 0 && ce.some((s: any) => ['pending_review', 'closed'].includes(s.status))) return 'release-room'
  if (collecting.length > 0) {
    const deadlines = collecting.map((s: any) => new Date(s.deadline ?? '2099-01-01'))
    const minDl = deadlines.reduce((a: Date, b: Date) => a < b ? a : b)
    const daysLeft = Math.ceil((minDl.getTime() - MOCK_TODAY.getTime()) / 86_400_000)
    return daysLeft <= 5 ? 'countdown' : 'collecting'
  }
  return 'setup'
}

/* ── Module-level static lookups ────────────────────────────────────────────── */
const _courseById      = new Map(MOCK_MASTER_COURSES.map(c => [c.id, c]))
const _termByIdMap     = new Map(MOCK_PROGRAM_TERMS.map(t => [t.id, t]))
const _facultyByIdMap  = new Map(MOCK_FACULTY.map(f => [f.id, f]))

const _ceSurveyKeyMap = new Map(
  MOCK_SURVEYS.filter(s => s.surveyType === 'course_evaluation' && s.status !== 'draft')
    .map(s => [`${s.courseCode}-${s.term}`, s.id])
)
const _ceSurveyRateMap = new Map(
  MOCK_SURVEYS.filter(s => s.surveyType === 'course_evaluation').map(s => [s.id, s.responseRate])
)

/* Student eval maps */
const _stdCourseCodeById = new Map(MOCK_MASTER_COURSES.map(c => [c.id, c.code]))
const _stdTermNameById   = new Map(MOCK_PROGRAM_TERMS.map(t => [t.id, t.name]))
const _stdSurveyByKey    = new Map(
  MOCK_SURVEYS.filter(s => s.surveyType === 'course_evaluation')
    .map(s => [`${s.courseCode}-${s.term}`, s])
)
const _studentOfferingIds: Record<string, string[]> = {}
Object.entries(MOCK_COURSE_ENROLLMENTS).forEach(([coId, sids]) => {
  sids.forEach(sid => {
    if (!_studentOfferingIds[sid]) _studentOfferingIds[sid] = []
    _studentOfferingIds[sid].push(coId)
  })
})
function getStudentEvalStats(studentId: string) {
  const ids = _studentOfferingIds[studentId] ?? []
  let completed = 0, open = 0
  ids.forEach(coId => {
    const co     = MOCK_COURSE_OFFERINGS.find(o => o.id === coId)
    if (!co) return
    const survey = _stdSurveyByKey.get(
      `${_stdCourseCodeById.get(co.masterCourseId)}-${_stdTermNameById.get(co.termId)}`
    )
    if (!survey) return
    if (['released', 'closed', 'pending_review'].includes(survey.status)) completed++
    else if (['collecting', 'active', 'scheduled'].includes(survey.status)) open++
  })
  return { courses: ids.length, completed, open }
}

/* Course avg ratings */
const _avgRatingByCode = MOCK_FACULTY_OFFERINGS.reduce<Record<string, { sum: number; n: number }>>((acc, fo) => {
  if (!acc[fo.courseCode]) acc[fo.courseCode] = { sum: 0, n: 0 }
  acc[fo.courseCode].sum += fo.avgRating * fo.enrolled
  acc[fo.courseCode].n   += fo.enrolled
  return acc
}, {})

/* Trend chart — chronological (oldest → newest, displayed left → right) */
const CHART_TERM_SEQ = ['Spring 2024', 'Fall 2024', 'Spring 2025', 'Fall 2025', 'Spring 2026']
const CHART_TERM_LABELS: Record<string, string> = {
  'Spring 2024': "Spr '24", 'Fall 2024': "Fal '24",
  'Spring 2025': "Spr '25", 'Fall 2025': "Fal '25", 'Spring 2026': "Spr '26",
}
const trendData = CHART_TERM_SEQ.map(term => {
  const rows = MOCK_FACULTY_OFFERINGS.filter(o => o.term === term)
  if (!rows.length) return null
  const totalE = rows.reduce((s, o) => s + o.enrolled, 0)
  return {
    term: CHART_TERM_LABELS[term] ?? term,
    rate: totalE > 0 ? Math.round(rows.reduce((s, o) => s + o.responseRate * o.enrolled, 0) / totalE) : 0,
    termFull: term,
  }
}).filter(Boolean) as { term: string; rate: number; termFull: string }[]

/* Prior-term name lookup */
function getPriorTermName(termName: string): string | null {
  const idx = CHART_TERM_SEQ.indexOf(termName)
  return idx > 0 ? CHART_TERM_SEQ[idx - 1] : null
}

/* Term display order: newest first */
const TERM_DISPLAY_ORDER = ['Fall 2026', 'Spring 2026', 'Fall 2025', 'Spring 2025', 'Fall 2024']
const sortedTerms = MOCK_PROGRAM_TERMS.slice().sort((a, b) => {
  const ai = TERM_DISPLAY_ORDER.indexOf(a.name)
  const bi = TERM_DISPLAY_ORDER.indexOf(b.name)
  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
})

/* Color helpers */
const tierColor       = (avg: number) => avg >= 4.3 ? 'var(--chart-2)' : avg >= 3.7 ? 'var(--brand-color)' : 'var(--chart-4)'
const completionColor = (pct: number) => pct >= 80 ? 'var(--chart-2)' : pct >= 60 ? 'var(--brand-color)' : 'var(--chart-4)'
function initials(first: string, last: string) { return (first[0] + last[0]).toUpperCase() }

const TYPE_LABELS: Record<string, string> = { didactic: 'Classroom based', clinical: 'Practice based', seminar: 'Lab based' }
const barConfig: ChartConfig = { rate: { label: 'Response rate', color: 'var(--brand-color)' } }
const THRESHOLD = 60
const PRISM_BASE = 'https://app.exxat.com/prism/dpt'

/* ── Row types ──────────────────────────────────────────────────────────────── */
interface OfferingRow extends Record<string, unknown> {
  id: string; courseCode: string; courseName: string; termName: string
  cohort: string; primaryFacultyName: string; enrolledCount: number
  status: CourseOffering['status']; surveyId?: string; completion: number | null
}
interface FacultyRow extends Record<string, unknown> {
  id: string; name: string; initials: string; department: string
  coursesCount: number; avgCompletion: number | null; avgRating: number | null
}
interface CourseRow extends Record<string, unknown> {
  id: string; code: string; name: string; type: string; department: string
  timesOffered: number; avgRating: number | null
}
interface StudentRow extends Record<string, unknown> {
  id: string; fullName: string; firstName: string; lastName: string
  studentId: string; cohort: string; enrollmentStatus: Student['enrollmentStatus']
  coursesCount: number; evalsCompleted: number; evalsOpen: number
}
type NudgeTarget = { id: string; name: string; courses: string[] }

/* ── Tiny shared components ─────────────────────────────────────────────────── */

function ConfigItem({ done, label, sublabel, href }: { done: boolean; label: string; sublabel: string; href: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <i
        className={`fa-light ${done ? 'fa-circle-check' : 'fa-circle-exclamation'} text-xs`}
        aria-hidden="true"
        style={{ color: done ? 'var(--chart-2)' : 'var(--chart-4)', width: 14, textAlign: 'center', flexShrink: 0 }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{label}</p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{sublabel}</p>
      </div>
      <Link href={href} className="text-xs shrink-0 hover:underline" style={{ color: 'var(--brand-color)' }}>
        Edit
      </Link>
    </div>
  )
}


/* ── Page ───────────────────────────────────────────────────────────────────── */
export default function SetupOverviewPage() {
  const { setupDefaults, templates } = usePce()

  /* Context selectors */
  const [selectedTermId, setSelectedTermId] = useState('pt1')  // Spring 2026
  const [selectedCohort, setSelectedCohort] = useState('all')

  /* Tab + dialog state */
  const [activeTab,        setActiveTab]        = useState<'offerings' | 'faculty' | 'courses' | 'students'>('offerings')
  const [offeringTermFilter, setOfferingTermFilter] = useState(selectedTermId)
  const [offeringStatusFilter, setOfferingStatusFilter] = useState('all')
  const [nudgeTarget,      setNudgeTarget]       = useState<NudgeTarget | null>(null)
  const [selectedSurveyId, setSelectedSurveyId]  = useState<string | null>(null)

  /* Selected term context */
  const selectedTerm = useMemo(
    () => MOCK_PROGRAM_TERMS.find(t => t.id === selectedTermId),
    [selectedTermId]
  )
  const selectedTermName  = selectedTerm?.name ?? ''
  const priorTermName     = useMemo(() => getPriorTermName(selectedTermName), [selectedTermName])
  const isTermEnabled     = selectedTerm?.enabledForEval ?? false

  /* Surveys + offerings for selected term */
  const termSurveys = useMemo(
    () => MOCK_SURVEYS.filter(s => s.surveyType === 'course_evaluation' && s.term === selectedTermName),
    [selectedTermName]
  )
  const termFacOffs = useMemo(
    () => MOCK_FACULTY_OFFERINGS.filter(o => o.term === selectedTermName),
    [selectedTermName]
  )
  const priorFacOffs = useMemo(
    () => priorTermName ? MOCK_FACULTY_OFFERINGS.filter(o => o.term === priorTermName) : [],
    [priorTermName]
  )

  /* Completion stats */
  const avgCompletion = useMemo(() => {
    const totalE = termFacOffs.reduce((s, o) => s + o.enrolled, 0)
    return totalE > 0 ? Math.round(termFacOffs.reduce((s, o) => s + o.responseRate * o.enrolled, 0) / totalE) : 0
  }, [termFacOffs])

  const priorAvgCompletion = useMemo(() => {
    const totalE = priorFacOffs.reduce((s, o) => s + o.enrolled, 0)
    return totalE > 0 ? Math.round(priorFacOffs.reduce((s, o) => s + o.responseRate * o.enrolled, 0) / totalE) : null
  }, [priorFacOffs])

  const completionDelta = priorAvgCompletion !== null ? avgCompletion - priorAvgCompletion : null

  /* Status breakdown */
  const statusCounts = useMemo(() => ({
    collecting:    termSurveys.filter(s => s.status === 'collecting').length,
    scheduled:     termSurveys.filter(s => s.status === 'scheduled').length,
    pending:       termSurveys.filter(s => s.status === 'pending_review').length,
    released:      termSurveys.filter(s => s.status === 'released').length,
    closed:        termSurveys.filter(s => s.status === 'closed').length,
  }), [termSurveys])

  /* Faculty for selected term */
  const facultyForTerm = useMemo(() => {
    return MOCK_FACULTY.map(f => {
      const offs = termFacOffs.filter(o => o.facultyId === f.id)
      if (!offs.length) return null
      const totalE = offs.reduce((s, o) => s + o.enrolled, 0)
      const avgC   = totalE > 0 ? Math.round(offs.reduce((s, o) => s + o.responseRate * o.enrolled, 0) / totalE) : 0
      const priorOffs = priorFacOffs.filter(o => o.facultyId === f.id)
      const priorE = priorOffs.reduce((s, o) => s + o.enrolled, 0)
      const priorC = priorE > 0 ? Math.round(priorOffs.reduce((s, o) => s + o.responseRate * o.enrolled, 0) / priorE) : null
      return {
        id: f.id, name: f.name, initials: f.initials,
        avgCompletion: avgC,
        delta: priorC !== null ? avgC - priorC : null,
        courses: offs.map(o => o.courseCode),
        courseOffs: offs.map(o => ({ code: o.courseCode, rate: o.responseRate })),
        needsAttention: avgC < THRESHOLD,
      }
    }).filter(Boolean).sort((a, b) => a!.avgCompletion - b!.avgCompletion) as Array<{
      id: string; name: string; initials: string
      avgCompletion: number; delta: number | null; courses: string[]
      courseOffs: { code: string; rate: number }[]; needsAttention: boolean
    }>
  }, [termFacOffs, priorFacOffs])

  const attentionCount = facultyForTerm.filter(f => f.needsAttention).length

  const overviewState = useMemo(() => getOverviewState(termSurveys), [termSurveys])

  /* CTA logic */
  const hasActiveSurveys = termSurveys.length > 0
  const canActivate      = isTermEnabled && !hasActiveSurveys

  /* Config readiness */
  const termsReady    = MOCK_PROGRAM_TERMS.some(t => t.enabledForEval)
  const emailReady    = setupDefaults.initialEmailBody.includes('{{survey_link}}')
  const reminderReady = setupDefaults.activeReminderIntervals.length > 0
  const templatesReady = templates.some(t => t.status === 'active')
  const enabledTerms   = MOCK_PROGRAM_TERMS.filter(t => t.enabledForEval)
  const activeTemplates = templates.filter(t => t.status === 'active')

  /* Zone A — stepper readiness */
  const stepperNodes = [
    { key: 'terms',     label: 'Terms',    done: termsReady,     href: '/admin/terms' },
    { key: 'templates', label: 'Templates', done: templatesReady, href: '/templates' },
    { key: 'email',     label: 'Email',    done: emailReady,     href: '/admin/email-templates' },
    { key: 'schedule',  label: 'Schedule', done: reminderReady,  href: '/admin/reminder-schedule' },
  ]
  const allReady = stepperNodes.every(s => s.done) && isTermEnabled

  /* Zone B — KeyMetrics */
  const kpis: MetricItem[] = useMemo(() => [
    {
      id: 'evaluations',
      label: 'Evaluations',
      value: String(termSurveys.length),
      delta: termSurveys.length > 0 ? `${statusCounts.collecting} collecting` : 'None this term',
      trend: 'neutral' as const,
    },
    {
      id: 'completion',
      label: 'Avg completion',
      value: termSurveys.length > 0 ? `${avgCompletion}%` : '—',
      delta: completionDelta !== null
        ? `${completionDelta >= 0 ? '+' : ''}${completionDelta}% from ${priorTermName?.replace('Spring', 'Spr').replace('Fall', 'Fal') ?? 'last term'}`
        : 'No prior term data',
      trend: completionDelta !== null ? (completionDelta >= 0 ? 'up' as const : 'down' as const) : 'neutral' as const,
    },
    {
      id: 'attention',
      label: 'Need nudging',
      value: String(attentionCount),
      delta: attentionCount > 0 ? `Below ${THRESHOLD}% threshold` : 'All on track',
      trend: attentionCount > 0 ? 'down' as const : 'up' as const,
    },
  ], [termSurveys.length, statusCounts.collecting, avgCompletion, completionDelta, priorTermName, attentionCount])

  /* Zone C — donut */
  const donutData = useMemo(() => [
    { name: 'Responded', value: avgCompletion },
    { name: 'Remaining', value: Math.max(0, 100 - avgCompletion) },
  ], [avgCompletion])
  const statusRows = [
    { label: 'Collecting',     count: statusCounts.collecting, color: 'var(--brand-color)' },
    { label: 'Scheduled',      count: statusCounts.scheduled,  color: 'var(--chart-1)' },
    { label: 'Pending review', count: statusCounts.pending,    color: 'var(--chart-4)' },
    { label: 'Released',       count: statusCounts.released,   color: 'var(--chart-2)' },
    { label: 'Closed',         count: statusCounts.closed,     color: 'var(--muted-foreground)' },
  ]

  /* ── Entity tab data ── */
  const offeringRows: OfferingRow[] = useMemo(
    () => MOCK_COURSE_OFFERINGS
      .filter(r => {
        if (offeringTermFilter !== 'all' && r.termId !== offeringTermFilter) return false
        if (offeringStatusFilter !== 'all' && r.status !== offeringStatusFilter) return false
        return true
      })
      .map(r => {
        const courseCode = _courseById.get(r.masterCourseId)?.code ?? '—'
        const termName   = _termByIdMap.get(r.termId)?.name ?? '—'
        const surveyId   = _ceSurveyKeyMap.get(`${courseCode}-${termName}`)
        const completion = surveyId ? (_ceSurveyRateMap.get(surveyId) ?? null) : null
        return {
          id: r.id, courseCode,
          courseName: _courseById.get(r.masterCourseId)?.name ?? '—',
          termName, cohort: r.cohort,
          primaryFacultyName: _facultyByIdMap.get(r.primaryFacultyId)?.name ?? '—',
          enrolledCount: r.enrolledCount, status: r.status, surveyId,
          completion: completion !== null && completion > 0 ? completion : null,
        }
      }),
    [offeringTermFilter, offeringStatusFilter],
  )

  const facultyRows: FacultyRow[] = useMemo(
    () => MOCK_FACULTY.map(f => {
      const offs    = MOCK_FACULTY_OFFERINGS.filter(o => o.facultyId === f.id)
      const curOffs = offs.filter(o => o.term === selectedTermName)
      const totalEC = curOffs.reduce((s, o) => s + o.enrolled, 0)
      const avgC    = totalEC > 0 ? Math.round(curOffs.reduce((s, o) => s + o.responseRate * o.enrolled, 0) / totalEC) : null
      const totalER = offs.reduce((s, o) => s + o.enrolled, 0)
      const avgR    = totalER > 0 ? +(offs.reduce((s, o) => s + o.avgRating * o.enrolled, 0) / totalER).toFixed(2) : null
      return {
        id: f.id, name: f.name, initials: f.initials,
        department: (f as unknown as Record<string, unknown>).department as string ?? '—',
        coursesCount: new Set(offs.map(o => o.courseCode)).size,
        avgCompletion: avgC, avgRating: avgR,
      }
    }),
    [selectedTermName],
  )

  const courseRows: CourseRow[] = useMemo(
    () => MOCK_MASTER_COURSES.map(c => {
      const rd = _avgRatingByCode[c.code]
      return {
        id: c.id, code: c.code, name: c.name, type: c.type, department: c.department,
        timesOffered: MOCK_COURSE_OFFERINGS.filter(o => o.masterCourseId === c.id).length,
        avgRating: rd && rd.n > 0 ? +(rd.sum / rd.n).toFixed(2) : null,
      }
    }),
    [],
  )

  const filteredStudents = useMemo(
    () => MOCK_STUDENTS.filter(r => selectedCohort === 'all' || r.cohort === selectedCohort),
    [selectedCohort],
  )
  const studentRows: StudentRow[] = useMemo(
    () => filteredStudents.map(r => {
      const { courses, completed, open } = getStudentEvalStats(r.id)
      return {
        id: r.id, fullName: `${r.firstName} ${r.lastName}`,
        firstName: r.firstName, lastName: r.lastName,
        studentId: r.studentId, cohort: r.cohort,
        enrollmentStatus: r.enrollmentStatus,
        coursesCount: courses, evalsCompleted: completed, evalsOpen: open,
      }
    }),
    [filteredStudents],
  )

  /* Column defs */
  const offeringCols = useMemo((): ColumnDef<OfferingRow>[] => [
    {
      key: 'courseCode', label: 'Course', sortable: true, width: 200,
      cell: (row) => (
        <div>
          <p className="text-sm font-medium">{row.courseCode as string}</p>
          <TruncatedText className="text-xs text-muted-foreground max-w-[140px]">{row.courseName as string}</TruncatedText>
        </div>
      ),
    },
    { key: 'termName', label: 'Term', sortable: true, width: 130, cell: (row) => <span className="text-sm">{row.termName as string}</span> },
    {
      key: 'primaryFacultyName', label: 'Faculty', sortable: true, width: 180,
      cell: (row) => {
        const parts = (row.primaryFacultyName as string).split(' ')
        const ini   = parts.map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarFallback className="text-xs" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>{ini}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">{row.primaryFacultyName as string}</span>
          </div>
        )
      },
    },
    {
      key: 'enrolledCount', label: 'Enrolled', sortable: true, width: 90,
      header: () => <span className="block text-right">Enrolled</span>,
      cell: (row) => <div className="text-right tabular-nums text-sm">{row.enrolledCount as number}</div>,
    },
    {
      key: 'completion', label: 'Completion', sortable: true, width: 110,
      header: () => <span className="block text-right">Completion</span>,
      cell: (row) => row.completion !== null
        ? <div className="text-right tabular-nums text-sm font-medium" style={{ color: completionColor(row.completion as number) }}>{row.completion}%</div>
        : <div className="text-right text-muted-foreground text-sm">—</div>,
    },
    { key: 'status', label: 'Status', sortable: true, width: 120, cell: (row) => <OfferingStatusBadge status={row.status as string} /> },
    {
      key: 'drill', label: '', width: 36,
      cell: (row) => row.surveyId ? (
        <Button
          variant="ghost" size="icon" className="size-7 mx-auto"
          aria-label={`Open eval card for ${row.courseCode}`}
          onClick={(e) => { e.stopPropagation(); setSelectedSurveyId(row.surveyId as string) }}
        >
          <i className="fa-light fa-chevron-right text-muted-foreground text-xs" aria-hidden="true" />
        </Button>
      ) : null,
    },
  ], [])

  const facultyCols = useMemo((): ColumnDef<FacultyRow>[] => [
    {
      key: 'name', label: 'Name', sortable: true, width: 220,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-xs font-semibold" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>{row.initials as string}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{row.name as string}</span>
        </div>
      ),
    },
    { key: 'department', label: 'Department', sortable: true, width: 200, cell: (row) => <span className="text-sm text-muted-foreground">{row.department as string}</span> },
    {
      key: 'coursesCount', label: 'Courses', sortable: true, width: 90,
      header: () => <span className="block text-right">Courses</span>,
      cell: (row) => <div className="text-right tabular-nums text-sm">{row.coursesCount as number}</div>,
    },
    {
      key: 'avgCompletion', label: 'Completion', sortable: true, width: 110,
      header: () => <span className="block text-right">Completion</span>,
      cell: (row) => row.avgCompletion !== null
        ? <div className="text-right tabular-nums text-sm font-medium" style={{ color: completionColor(row.avgCompletion as number) }}>{row.avgCompletion}%</div>
        : <div className="text-right text-sm text-muted-foreground">—</div>,
    },
    {
      key: 'avgRating', label: 'Avg rating', sortable: true, width: 100,
      header: () => <span className="block text-right">Avg rating</span>,
      cell: (row) => row.avgRating !== null
        ? <div className="text-right tabular-nums text-sm font-semibold" style={{ color: tierColor(row.avgRating as number) }}>{(row.avgRating as number).toFixed(1)}/5</div>
        : <div className="text-right text-sm text-muted-foreground">—</div>,
    },
    { key: 'prism', label: '', width: 36, cell: () => <i className="fa-light fa-arrow-up-right-from-square text-xs text-muted-foreground" aria-hidden="true" /> },
  ], [])

  const courseCols = useMemo((): ColumnDef<CourseRow>[] => [
    { key: 'code', label: 'Code', sortable: true, width: 110, cell: (row) => <span className="font-mono text-xs">{row.code as string}</span> },
    { key: 'name', label: 'Name', sortable: true, width: 260, cell: (row) => <span className="text-sm font-medium">{row.name as string}</span> },
    {
      key: 'type', label: 'Type', sortable: true, width: 110,
      cell: (row) => <Badge variant="secondary" className="text-xs">{TYPE_LABELS[row.type as string] ?? row.type}</Badge>,
    },
    { key: 'department', label: 'Department', sortable: true, width: 190, cell: (row) => <span className="text-sm text-muted-foreground">{row.department as string}</span> },
    {
      key: 'timesOffered', label: 'Times offered', sortable: true, width: 130,
      header: () => <span className="block text-right">Times offered</span>,
      cell: (row) => <div className="text-right tabular-nums text-sm text-muted-foreground">{(row.timesOffered as number) > 0 ? row.timesOffered : '—'}</div>,
    },
    {
      key: 'avgRating', label: 'Avg rating', sortable: true, width: 100,
      header: () => <span className="block text-right">Avg rating</span>,
      cell: (row) => row.avgRating !== null
        ? <div className="text-right tabular-nums text-sm font-semibold" style={{ color: tierColor(row.avgRating as number) }}>{(row.avgRating as number).toFixed(1)}/5</div>
        : <div className="text-right text-sm text-muted-foreground">—</div>,
    },
    { key: 'prism', label: '', width: 36, cell: () => <i className="fa-light fa-arrow-up-right-from-square text-xs text-muted-foreground" aria-hidden="true" /> },
  ], [])

  const studentCols = useMemo((): ColumnDef<StudentRow>[] => [
    {
      key: 'fullName', label: 'Name', sortable: true, width: 220,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-xs font-semibold" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>{initials(row.firstName as string, row.lastName as string)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{row.fullName as string}</span>
        </div>
      ),
    },
    { key: 'studentId', label: 'Student ID', sortable: true, width: 130, cell: (row) => <span className="font-mono text-xs">{row.studentId as string}</span> },
    { key: 'cohort', label: 'Cohort', sortable: true, width: 160, cell: (row) => <span className="text-sm text-muted-foreground">{row.cohort as string}</span> },
    { key: 'enrollmentStatus', label: 'Status', sortable: true, width: 120, cell: (row) => <EnrollmentStatusBadge status={row.enrollmentStatus as string} /> },
    {
      key: 'evalsCompleted', label: 'Evals', sortable: true, width: 140,
      cell: (row) => {
        const total = (row.evalsCompleted as number) + (row.evalsOpen as number)
        if (total === 0) return <span className="text-xs text-muted-foreground">—</span>
        const parts: string[] = []
        if ((row.evalsCompleted as number) > 0) parts.push(`${row.evalsCompleted} done`)
        if ((row.evalsOpen as number) > 0) parts.push(`${row.evalsOpen} open`)
        return (
          <span className="text-xs" style={{ color: (row.evalsOpen as number) > 0 ? 'var(--brand-color)' : 'var(--muted-foreground)' }}>
            {parts.join(' · ')}
          </span>
        )
      },
    },
    { key: 'prism', label: '', width: 36, cell: () => <i className="fa-light fa-arrow-up-right-from-square text-xs text-muted-foreground" aria-hidden="true" /> },
  ], [])

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <>
      <SiteHeader title="Overview" />

      {/* ── Context bar: term switcher + cohort + actions ── */}
      <div
        className="shrink-0 border-b flex items-center gap-2 overflow-x-auto px-4 lg:px-6 py-2.5 sticky top-0 z-10"
        style={{ backgroundColor: 'var(--background)' }}
      >
        {/* Term selector — dropdown scales to any number of terms */}
        <Select
          value={selectedTermId}
          onValueChange={(v) => { setSelectedTermId(v); setOfferingTermFilter(v) }}
        >
          <SelectTrigger className="h-7 w-44 text-xs shrink-0" aria-label="Select term">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortedTerms.map(t => {
              const hasSurveys = MOCK_SURVEYS.some(s => s.surveyType === 'course_evaluation' && s.term === t.name)
              return (
                <SelectItem key={t.id} value={t.id}>
                  <span className="flex items-center gap-2">
                    {t.name}
                    {hasSurveys && (
                      <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={{ backgroundColor: 'var(--chart-2)' }} aria-label="has evaluations" />
                    )}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        {/* Cohort filter */}
        <div className="shrink-0 mx-1 h-4 w-px" style={{ backgroundColor: 'var(--border)' }} aria-hidden="true" />
        <Select value={selectedCohort} onValueChange={setSelectedCohort}>
          <SelectTrigger className="h-7 w-36 text-xs shrink-0" aria-label="Filter by cohort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cohorts</SelectItem>
            {MOCK_COHORTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Actions — right side */}
        <div className="ms-auto flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/terms">
              <i className="fa-light fa-gear text-xs me-1.5" aria-hidden="true" />
              Configure
            </Link>
          </Button>

          {hasActiveSurveys && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/surveys">View evaluations</Link>
            </Button>
          )}

          {canActivate && (
            <Button variant="default" size="sm" asChild>
              <Link href="/surveys/push">
                Activate {selectedTermName}
                <i className="fa-light fa-circle-play ms-1.5 text-xs" aria-hidden="true" />
              </Link>
            </Button>
          )}

          {!isTermEnabled && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/terms">Enable term first</Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Zone A: Activation Readiness Stepper ── */}
      <div
        className="shrink-0 border-b flex items-center gap-0 px-4 lg:px-6 py-3 sticky top-[44px] z-10 overflow-x-auto"
        style={{ backgroundColor: 'var(--background)' }}
        aria-label="Activation readiness"
      >
        {stepperNodes.map((node, i) => (
          <div key={node.key} className="flex items-center gap-0">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: node.done ? 'var(--chart-2)' : 'var(--muted)',
                  border: `1.5px solid ${node.done ? 'var(--chart-2)' : 'var(--border)'}`,
                }}
              >
                <i
                  className={`fa-light ${node.done ? 'fa-check' : 'fa-exclamation'} text-[10px]`}
                  aria-hidden="true"
                  style={{ color: node.done ? 'white' : 'var(--muted-foreground)' }}
                />
              </div>
              <Link
                href={node.href}
                className="text-[11px] whitespace-nowrap hover:underline"
                style={{ color: node.done ? 'var(--foreground)' : 'var(--muted-foreground)' }}
              >
                {node.label}
              </Link>
            </div>
            <div className="w-10 lg:w-16 h-px mx-2 shrink-0" style={{ backgroundColor: 'var(--border)' }} aria-hidden="true" />
          </div>
        ))}
        {/* Activate node */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          {allReady ? (
            <Button variant="default" size="sm" className="h-6 text-[11px] px-2.5" asChild>
              <Link href="/surveys/push">Activate</Link>
            </Button>
          ) : (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--muted)', border: '1.5px dashed var(--border)' }}
            >
              <i className="fa-light fa-arrow-right text-[10px]" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
            </div>
          )}
          <span
            className="text-[11px] whitespace-nowrap"
            style={{ color: allReady ? 'var(--brand-color)' : 'var(--muted-foreground)' }}
          >
            Activate
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto" style={{ paddingBottom: 32 }}>

        {/* ── State view ── */}
        <div className="px-4 lg:px-6 pt-5 pb-5 border-b">
          {overviewState === 'setup' && (
            <SetupView
              selectedTermName={selectedTermName}
              termSurveys={termSurveys}
              canActivate={canActivate}
              isTermEnabled={isTermEnabled}
              termsReady={termsReady}
              templatesReady={templatesReady}
              emailReady={emailReady}
              reminderReady={reminderReady}
              enabledTerms={enabledTerms}
              activeTemplates={activeTemplates}
              setupDefaults={setupDefaults}
            />
          )}
          {overviewState === 'collecting' && (
            <CollectingView
              selectedTermName={selectedTermName}
              termSurveys={termSurveys}
              facultyForTerm={facultyForTerm}
              avgCompletion={avgCompletion}
              completionDelta={completionDelta}
              priorTermName={priorTermName}
              statusCounts={statusCounts}
              attentionCount={attentionCount}
              onNudge={setNudgeTarget}
            />
          )}
          {overviewState === 'countdown' && (
            <CountdownView
              selectedTermName={selectedTermName}
              termSurveys={termSurveys}
              facultyForTerm={facultyForTerm}
              avgCompletion={avgCompletion}
              statusCounts={statusCounts}
              onNudge={setNudgeTarget}
            />
          )}
          {overviewState === 'release-room' && (
            <ReleaseRoomView
              selectedTermName={selectedTermName}
              termSurveys={termSurveys}
              onOpenSurvey={setSelectedSurveyId}
            />
          )}
          {overviewState === 'retrospective' && (
            <RetrospectiveView
              selectedTermName={selectedTermName}
              avgCompletion={avgCompletion}
              completionDelta={completionDelta}
              priorTermName={priorTermName}
              statusCounts={statusCounts}
              facultyForTerm={facultyForTerm}
              attentionCount={attentionCount}
              trendData={trendData}
            />
          )}
        </div>

        {/* ── Entity directory ── */}
        <div className="pt-5">
          <div className="px-4 lg:px-6 mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Directory</h2>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              · click any row to open in Prism
            </span>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex flex-col">
            <TabsList className="mx-4 lg:mx-6 mb-2 w-fit">
              <TabsTrigger value="offerings">
                Offerings
                <Badge variant="secondary" className="ms-1.5 text-xs px-1.5">{MOCK_COURSE_OFFERINGS.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="faculty">
                Faculty
                <Badge variant="secondary" className="ms-1.5 text-xs px-1.5">{MOCK_FACULTY.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="courses">
                Courses
                <Badge variant="secondary" className="ms-1.5 text-xs px-1.5">{MOCK_MASTER_COURSES.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="students">
                Students
                <Badge variant="secondary" className="ms-1.5 text-xs px-1.5">{studentRows.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Offerings */}
            <TabsContent value="offerings">
              <div className="flex items-center gap-2 flex-wrap px-4 lg:px-6 mb-2">
                <Select value={offeringTermFilter} onValueChange={setOfferingTermFilter}>
                  <SelectTrigger className="h-8 w-40 text-sm" aria-label="Filter by term">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All terms</SelectItem>
                    {MOCK_PROGRAM_TERMS.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={offeringStatusFilter} onValueChange={setOfferingStatusFilter}>
                  <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DataTablePaginated<OfferingRow>
                data={offeringRows}
                columns={offeringCols}
                getRowId={(row) => row.id}
                selectable={false}
                searchable
                onRowClick={(row) => window.open(`${PRISM_BASE}/offerings/${row.id}`, '_blank', 'noopener')}
                emptyState={
                  <div className="flex flex-col items-center gap-2 py-6">
                    <i className="fa-light fa-layer-group text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                    <p className="text-sm font-medium">No offerings match these filters</p>
                  </div>
                }
                toolbarSlot={() => null}
              />
            </TabsContent>

            {/* Faculty */}
            <TabsContent value="faculty">
              <DataTablePaginated<FacultyRow>
                data={facultyRows}
                columns={facultyCols}
                getRowId={(row) => row.id}
                selectable={false}
                searchable
                onRowClick={(row) => window.open(`${PRISM_BASE}/faculty/${row.id}`, '_blank', 'noopener')}
                emptyState={
                  <div className="flex flex-col items-center gap-2 py-6">
                    <i className="fa-light fa-user-tie text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                    <p className="text-sm font-medium">No faculty match your search</p>
                  </div>
                }
                toolbarSlot={() => null}
              />
            </TabsContent>

            {/* Courses */}
            <TabsContent value="courses">
              <DataTablePaginated<CourseRow>
                data={courseRows}
                columns={courseCols}
                getRowId={(row) => row.id}
                selectable={false}
                searchable
                onRowClick={(row) => window.open(`${PRISM_BASE}/courses/${row.id}`, '_blank', 'noopener')}
                emptyState={
                  <div className="flex flex-col items-center gap-2 py-6">
                    <i className="fa-light fa-book text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                    <p className="text-sm font-medium">No courses match your search</p>
                  </div>
                }
                toolbarSlot={() => null}
              />
            </TabsContent>

            {/* Students */}
            <TabsContent value="students">
              {selectedCohort !== 'all' && (
                <div className="px-4 lg:px-6 mb-2">
                  <Button
                    variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs"
                    onClick={() => setSelectedCohort('all')}
                  >
                    <span style={{ color: 'var(--brand-color)' }}>Cohort: {selectedCohort}</span>
                    <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                  </Button>
                </div>
              )}
              <DataTablePaginated<StudentRow>
                data={studentRows}
                columns={studentCols}
                getRowId={(row) => row.id}
                selectable={false}
                searchable
                defaultGroupBy="cohort"
                onRowClick={(row) => window.open(`${PRISM_BASE}/students/${row.id}`, '_blank', 'noopener')}
                emptyState={
                  <div className="flex flex-col items-center gap-2 py-6">
                    <i className="fa-light fa-graduation-cap text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                    <p className="text-sm font-medium">No students match these filters</p>
                  </div>
                }
                toolbarSlot={() => null}
              />
            </TabsContent>
          </Tabs>
        </div>

      </div>

      {/* Eval card sheet */}
      <EvaluationCardSheet surveyId={selectedSurveyId} onClose={() => setSelectedSurveyId(null)} />

      {/* Nudge confirmation */}
      <AlertDialog open={!!nudgeTarget} onOpenChange={(open) => !open && setNudgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send ad-hoc reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately email all non-responding students for{' '}
              <strong>{nudgeTarget?.name}</strong> in{' '}
              {nudgeTarget?.courses.join(', ')}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setNudgeTarget(null)}>Send nudge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
