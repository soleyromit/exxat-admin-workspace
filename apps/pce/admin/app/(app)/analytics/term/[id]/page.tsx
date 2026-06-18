'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Button, Badge,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { DashboardMonitor, type MonitorNudgeTarget } from '@/components/pce/dashboard-monitor'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { MOCK_SURVEYS, MOCK_PROGRAM_TERMS } from '@/lib/pce-mock-data'
import type { SurveyStatus } from '@/lib/pce-mock-data'

const completionColor = (pct: number) =>
  pct >= 70 ? 'var(--chart-2)' : pct >= 60 ? 'var(--brand-color)' : 'var(--chip-4)'

function fmt(ymd: string) {
  const d = new Date(ymd + 'T00:00:00')
  return Number.isFinite(d.getTime())
    ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : ymd
}

type CourseRow = {
  id: string; courseCode: string; courseName: string; faculty: string
  enrolled: number; completion: number; status: SurveyStatus
} & Record<string, unknown>

const columns: ColumnDef<CourseRow>[] = [
  {
    key: 'courseCode', label: 'Course', sortable: true,
    cell: (row) => (
      <div>
        <p className="text-sm font-medium">{row.courseCode}</p>
        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{row.courseName}</p>
      </div>
    ),
  },
  {
    key: 'faculty', label: 'Faculty', sortable: true,
    cell: (row) => <span className="text-sm">{row.faculty}</span>,
  },
  {
    key: 'enrolled', label: 'Students', sortable: true, width: 90,
    header: () => <span className="block text-right">Students</span>,
    cell: (row) => <div className="text-right text-sm tabular-nums">{row.enrolled}</div>,
  },
  {
    key: 'completion', label: 'Completion', sortable: true, width: 110,
    header: () => <span className="block text-right">Completion</span>,
    cell: (row) => (
      <div className="text-right text-sm tabular-nums font-semibold" style={{ color: completionColor(row.completion) }}>
        {row.completion}%
      </div>
    ),
  },
  {
    key: 'status', label: 'Status', width: 140,
    cell: (row) => <SurveyStatusBadge status={row.status} />,
  },
]

export default function TermAnalyticsProfile() {
  const params  = useParams<{ id: string }>()
  const search  = useSearchParams()
  const fromDir = search?.get('from') === 'directory'
  const termId  = params?.id ?? ''

  const term = MOCK_PROGRAM_TERMS.find(t => t.id === termId)
  const [nudgeTarget, setNudgeTarget] = useState<MonitorNudgeTarget | null>(null)

  const ceSurveys = useMemo(() => MOCK_SURVEYS.filter(s => s.surveyType !== 'programmatic'), [])
  const termSurveys = useMemo(
    () => term ? ceSurveys.filter(s => s.term === term.name) : [],
    [ceSurveys, term],
  )

  const courseRows: CourseRow[] = termSurveys.map(s => ({
    id: s.id,
    courseCode: s.courseCode,
    courseName: s.courseName,
    faculty: s.instructors.find(i => i.role === 'primary')?.name ?? s.instructors[0]?.name ?? '—',
    enrolled: s.enrollmentCount,
    completion: s.responseRate,
    status: s.status,
  }))

  if (!term) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-2">
        <i className="fa-light fa-calendar-xmark text-muted-foreground" aria-hidden="true" style={{ fontSize: 32 }} />
        <p className="text-sm text-muted-foreground">Term not found</p>
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
          ? [{ label: 'Terms', href: '/admin/terms' }]
          : [{ label: 'Analytics', href: '/analytics' }]
        }
        title={term.name}
      />

      {/* Term header */}
      <div className="shrink-0 flex items-center gap-4" style={{ padding: '20px 28px 16px' }}>
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 48, height: 48, background: 'var(--brand-tint)' }}
        >
          <i className="fa-light fa-calendar text-base" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold leading-tight">{term.name}</h1>
          <p className="text-sm text-muted-foreground">
            {term.academicYear} &nbsp;·&nbsp; {fmt(term.startDate)} – {fmt(term.endDate)}
          </p>
        </div>
        {term.enabledForEval
          ? <Badge variant="secondary">Enabled for evaluation</Badge>
          : <Badge variant="outline">Not enabled</Badge>}
      </div>

      {/* Monitor (term-scoped) + courses table */}
      <div className="flex-1 overflow-auto" style={{ padding: '4px 28px 28px' }}>
        {termSurveys.length === 0 ? (
          <div className="flex flex-col items-center gap-2" style={{ padding: '48px 0' }}>
            <i className="fa-light fa-chart-mixed text-muted-foreground" aria-hidden="true" style={{ fontSize: 28 }} />
            <p className="text-sm font-medium">No evaluations this term</p>
            <p className="text-sm text-muted-foreground">Activate this term to schedule course evaluations.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-5xl">
            <DashboardMonitor surveys={ceSurveys} term={term.name} onNudge={setNudgeTarget} />

            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">
                Courses this term &nbsp;<span className="text-muted-foreground font-normal">({courseRows.length})</span>
              </p>
              <DataTable<CourseRow>
                data={courseRows}
                columns={columns}
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
        )}
      </div>

      <AlertDialog open={!!nudgeTarget} onOpenChange={(open) => !open && setNudgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send ad-hoc reminder</AlertDialogTitle>
            <AlertDialogDescription>
              {nudgeTarget && (
                <>
                  Send an immediate reminder to{' '}
                  <strong>{nudgeTarget.nonResponders} non-responder{nudgeTarget.nonResponders !== 1 ? 's' : ''}</strong>{' '}
                  in <strong>{nudgeTarget.courseCode} — {nudgeTarget.courseName}</strong>. This is an out-of-schedule nudge.
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
