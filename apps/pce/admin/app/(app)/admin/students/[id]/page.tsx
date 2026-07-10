'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Avatar, AvatarFallback, KeyMetrics, Button, Badge } from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { EnrollmentStatusBadge, SurveyStatusBadge } from '@/components/pce/pce-badges'
import {
  MOCK_STUDENTS, MOCK_COURSE_ENROLLMENTS, MOCK_COURSE_OFFERINGS,
  MOCK_MASTER_COURSES, MOCK_PROGRAM_TERMS, MOCK_SURVEYS,
} from '@/lib/pce-mock-data'
import type { SurveyStatus } from '@/lib/pce-mock-data'

const courseCodeById = new Map(MOCK_MASTER_COURSES.map(c => [c.id, c.code]))
const courseNameById = new Map(MOCK_MASTER_COURSES.map(c => [c.id, c.name]))
const termNameById   = new Map(MOCK_PROGRAM_TERMS.map(t => [t.id, t.name]))
const surveyByKey    = new Map(MOCK_SURVEYS.filter(s => s.surveyType !== 'programmatic').map(s => [`${s.courseCode}-${s.term}`, s]))

const studentOfferingIds: Record<string, string[]> = {}
Object.entries(MOCK_COURSE_ENROLLMENTS).forEach(([coId, sids]) => {
  (sids as string[]).forEach(sid => {
    (studentOfferingIds[sid] ??= []).push(coId)
  })
})

type EvalRow = {
  id: string; courseCode: string; courseName: string; term: string
  status: SurveyStatus | 'not_scheduled'
} & Record<string, unknown>

const columns: ColumnDef<EvalRow>[] = [
  {
    key: 'courseCode', label: 'Course', sortable: true,
    cell: (row) => (
      <div>
        <p className="text-sm font-medium">{row.courseCode}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[220px]">{row.courseName}</p>
      </div>
    ),
  },
  {
    key: 'term', label: 'Term', sortable: true, width: 150,
    cell: (row) => <span className="text-sm text-muted-foreground">{row.term}</span>,
  },
  {
    key: 'status', label: 'Evaluation', width: 220,
    cell: (row) => row.status === 'not_scheduled'
      ? <span className="text-xs text-muted-foreground">Not scheduled</span>
      : <SurveyStatusBadge status={row.status} />,
  },
]

export default function StudentProfile() {
  const params = useParams<{ id: string }>()
  const studentId = params?.id ?? ''
  const student = MOCK_STUDENTS.find(s => s.id === studentId)

  const evalRows: EvalRow[] = useMemo(() => {
    if (!student) return []
    const offeringIds = studentOfferingIds[student.id] ?? []
    return offeringIds.map((coId, i) => {
      const co = MOCK_COURSE_OFFERINGS.find(o => o.id === coId)
      const code = co ? (courseCodeById.get(co.masterCourseId) ?? '—') : '—'
      const term = co ? (termNameById.get(co.termId) ?? '—') : '—'
      const survey = surveyByKey.get(`${code}-${term}`)
      return {
        id: `${coId}-${i}`,
        courseCode: code,
        courseName: co ? (courseNameById.get(co.masterCourseId) ?? '') : '',
        term,
        status: survey ? survey.status : 'not_scheduled',
      }
    })
  }, [student])

  if (!student) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-2">
        <i className="fa-light fa-user-slash text-muted-foreground" aria-hidden="true" style={{ fontSize: 32 }} />
        <p className="text-sm text-muted-foreground">Student not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/students">Back to Students</Link>
        </Button>
      </div>
    )
  }

  const completed = evalRows.filter(r => r.status !== 'not_scheduled' && ['released', 'closed', 'pending_review'].includes(r.status)).length
  const open = evalRows.filter(r => r.status === 'collecting' || r.status === 'active' || r.status === 'scheduled').length
  const participation = completed + open > 0 ? Math.round((completed / (completed + open)) * 100) : null

  const kpis: MetricItem[] = [
    { id: 'courses', label: 'Courses enrolled', value: evalRows.length, delta: '', trend: 'neutral' },
    { id: 'done',    label: 'Evals completed',  value: completed,        delta: '', trend: 'neutral' },
    { id: 'open',    label: 'Evals open',       value: open,             delta: '', trend: 'neutral' },
    { id: 'rate',    label: 'Participation',     value: participation != null ? `${participation}%` : '—', delta: '', trend: 'neutral', description: 'of in-flight evals' },
  ]

  return (
    <>
      <SiteHeader breadcrumbs={[{ label: 'Students', href: '/admin/students' }]} title={`${student.firstName} ${student.lastName}`} />

      {/* Profile details */}
      <div className="shrink-0 flex items-center gap-4" style={{ padding: '20px 28px 8px' }}>
        <Avatar className="h-12 w-12 rounded-full shrink-0">
          <AvatarFallback className="rounded-full text-base font-semibold" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
            {(student.firstName[0] + student.lastName[0]).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-semibold leading-tight">{student.firstName} {student.lastName}</h1>
            <EnrollmentStatusBadge status={student.enrollmentStatus} />
            {student.hasAccommodations && (
              <Badge variant="outline" className="text-xs"><i className="fa-light fa-universal-access mr-1" aria-hidden="true" />Accommodations</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{student.studentId}</span> · {student.cohort} ·{' '}
            <a href={`mailto:${student.email}`} className="hover:text-foreground">{student.email}</a>
          </p>
        </div>
      </div>

      <div className="shrink-0 [&_*]:!border-e-0 px-4 lg:px-6" style={{ paddingBlock: 4 }}>
        <KeyMetrics variant="compact" showHeader={false} metricsSingleRow metrics={kpis} />
      </div>

      {/* Evaluations (participation only — FERPA: no individual responses/scores) */}
      <div className="flex-1 overflow-auto" style={{ padding: '16px 16px 28px' }}>
        <div className="max-w-3xl flex flex-col gap-3 px-2 lg:px-4">
          <div>
            <p className="text-sm font-semibold">Evaluations <span className="text-muted-foreground font-normal">({evalRows.length})</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">
              <i className="fa-light fa-lock text-xs mr-1" aria-hidden="true" />
              Individual responses are anonymous — participation status only.
            </p>
          </div>
          {/* -mx cancels the DataTable's own mx-4/6 so its border aligns flush with the heading */}
          <div className="-mx-4 lg:-mx-6">
            <DataTable<EvalRow>
              data={evalRows}
              columns={columns}
              getRowId={(row) => row.id}
              emptyState={
                <div className="flex flex-col items-center gap-2 py-8">
                  <i className="fa-light fa-clipboard-list text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                  <p className="text-sm text-muted-foreground">No course enrolments</p>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </>
  )
}
