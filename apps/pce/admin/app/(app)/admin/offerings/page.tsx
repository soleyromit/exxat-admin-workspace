'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  KeyMetrics, Button, PageHeader,
} from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import {
  MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_PROGRAM_TERMS,
  MOCK_FACULTY, MOCK_SURVEYS,
  type CourseOffering,
} from '@/lib/pce-mock-data'
import { DataTablePaginated } from '@/components/data-table/pagination'
import { OfferingStatusBadge } from '@/components/pce/pce-badges'
import type { ColumnDef } from '@/components/data-table/types'
import { EvaluationCardSheet } from '@/components/pce/evaluation-card-sheet'

interface OfferingRow extends Record<string, unknown> {
  id: string
  courseCode: string; courseName: string; termName: string
  cohort: string; primaryFacultyName: string
  collaboratorCount: number; enrolledCount: number
  status: CourseOffering['status']
  surveyId?: string
  completion: number | null
}

const PRISM_BASE = 'https://app.exxat.com/prism/dpt/offerings'

/* survey lookup maps (module-level — computed once) */
const _evalSurveys = MOCK_SURVEYS.filter(
  s => s.surveyType === 'course_evaluation' && s.status !== 'draft',
)
const surveyKeyMap = new Map<string, string>(
  _evalSurveys.map(s => [`${s.courseCode}-${s.term}`, s.id]),
)
const surveyRateMap = new Map<string, number>(
  _evalSurveys.map(s => [s.id, s.responseRate]),
)

/* KPI denominators (module-level) */
const _collectingCount = _evalSurveys.filter(s => s.status === 'collecting').length
const _closedCount     = _evalSurveys.filter(s => s.status === 'closed' || s.status === 'pending_review').length
const _ratedSurveys    = _evalSurveys.filter(s => s.responseRate > 0)
const _avgCompletion   = _ratedSurveys.length > 0
  ? +(_ratedSurveys.reduce((a, s) => a + s.responseRate, 0) / _ratedSurveys.length).toFixed(1)
  : null

const completionColor = (pct: number) =>
  pct >= 80 ? 'var(--chart-2)' : pct >= 60 ? 'var(--brand-color)' : 'var(--chart-4)'

export default function CourseOfferingsPage() {
  const router = useRouter()
  const [termFilter, setTermFilter]       = useState('all')
  const [statusFilter, setStatusFilter]   = useState('all')
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)

  const courseById  = useMemo(() => new Map(MOCK_MASTER_COURSES.map(c => [c.id, c])), [])
  const termById    = useMemo(() => new Map(MOCK_PROGRAM_TERMS.map(t => [t.id, t])), [])
  const facultyById = useMemo(() => new Map(MOCK_FACULTY.map(f => [f.id, f])), [])

  const tableRows: OfferingRow[] = useMemo(
    () => MOCK_COURSE_OFFERINGS
      .filter(r => {
        if (termFilter   !== 'all' && r.termId !== termFilter)    return false
        if (statusFilter !== 'all' && r.status !== statusFilter)  return false
        return true
      })
      .map(r => {
        const courseCode = courseById.get(r.masterCourseId)?.code ?? '—'
        const termName   = termById.get(r.termId)?.name ?? '—'
        const surveyId   = surveyKeyMap.get(`${courseCode}-${termName}`)
        const completion = surveyId ? (surveyRateMap.get(surveyId) ?? null) : null
        return {
          id: r.id,
          courseCode,
          courseName:          courseById.get(r.masterCourseId)?.name ?? '—',
          termName,
          cohort:              r.cohort,
          primaryFacultyName:  facultyById.get(r.primaryFacultyId)?.name ?? '—',
          collaboratorCount:   r.collaboratorIds.length,
          enrolledCount:       r.enrolledCount,
          status:              r.status,
          surveyId,
          completion: completion !== null && completion > 0 ? completion : null,
        }
      }),
    [termFilter, statusFilter, courseById, termById, facultyById],
  )

  const activeCount = MOCK_COURSE_OFFERINGS.filter(o => o.status === 'active').length

  const kpis: MetricItem[] = [
    { id: 'total',      label: 'Total offerings', value: MOCK_COURSE_OFFERINGS.length, delta: '', trend: 'neutral' },
    { id: 'collecting', label: 'Collecting',       value: _collectingCount,             delta: '', trend: 'neutral' },
    { id: 'closed',     label: 'Closed/released',  value: _closedCount,                 delta: '', trend: 'neutral' },
    { id: 'completion', label: 'Avg completion',   value: _avgCompletion !== null ? `${_avgCompletion}%` : '—', delta: '', trend: 'neutral' },
  ]

  const columns: ColumnDef<OfferingRow>[] = [
    { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
    {
      key: 'courseCode', label: 'Course', sortable: true, width: 220,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs">{row.courseCode}</span>
          <span className="text-xs text-muted-foreground truncate max-w-44">{row.courseName}</span>
        </div>
      ),
    },
    {
      key: 'termName', label: 'Term', sortable: true, width: 140,
      cell: (row) => <span className="text-sm">{row.termName}</span>,
    },
    {
      key: 'cohort', label: 'Cohort', sortable: true, width: 140,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.cohort}</span>,
    },
    {
      key: 'primaryFacultyName', label: 'Primary faculty', sortable: true, width: 200,
      cell: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{row.primaryFacultyName}</span>
          {row.collaboratorCount > 0 && (
            <span className="text-xs text-muted-foreground">
              +{row.collaboratorCount} collaborator{row.collaboratorCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'enrolledCount', label: 'Enrolled', sortable: true, width: 100,
      header: () => <span className="block text-right">Enrolled</span>,
      cell: (row) => <div className="text-right tabular-nums text-sm">{row.enrolledCount}</div>,
    },
    {
      key: 'completion', label: 'Completion', sortable: true, width: 110,
      header: () => <span className="block text-right">Completion</span>,
      cell: (row) => (
        <div
          className="text-right tabular-nums text-sm font-semibold"
          style={{ color: row.completion !== null ? completionColor(row.completion) : 'var(--muted-foreground)' }}
        >
          {row.completion !== null ? `${row.completion}%` : '—'}
        </div>
      ),
    },
    {
      key: 'status', label: 'Status', sortable: true, width: 120,
      cell: (row) => <OfferingStatusBadge status={row.status} />,
    },
    {
      key: 'analytics', label: '', width: 32,
      cell: (row) => (
        <Link
          href={`/analytics?tab=course&courseCode=${encodeURIComponent(row.courseCode)}`}
          onClick={e => e.stopPropagation()}
          aria-label={`View analytics for ${row.courseCode}`}
        >
          <i className="fa-light fa-chart-mixed text-xs" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
        </Link>
      ),
    },
    {
      key: 'evalOrPrism', label: '', width: 32,
      cell: (row) => row.surveyId ? (
        <i className="fa-light fa-chart-bar text-xs" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
      ) : (
        <i className="fa-light fa-arrow-up-right-from-square text-xs text-muted-foreground" aria-hidden="true" />
      ),
    },
  ]

  return (
    <>
      <SiteHeader title="Course Offerings" breadcrumbs={[{ label: 'Directory', href: '/admin' }]} />
      <PageHeader
        title="Course Offerings"
        subtitle={
          <span className="inline-flex items-center gap-1 flex-wrap">
            {MOCK_COURSE_OFFERINGS.length} offerings · {activeCount} active. Rows with
            <i className="fa-light fa-chart-bar" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
            open the Evaluation Card; others open in Prism.
          </span>
        }
      />
      <EvaluationCardSheet surveyId={selectedSurveyId} onClose={() => setSelectedSurveyId(null)} />

      <div className="shrink-0 px-4 lg:px-6" style={{ paddingBlock: 4 }}>
        <KeyMetrics variant="compact" showHeader={false} metricsSingleRow metrics={kpis} />
      </div>

      <div className="flex-1 overflow-auto" style={{ paddingTop: 16, paddingBottom: 28 }}>
        <div className="max-w-6xl flex flex-col gap-4">

          <DataTablePaginated<OfferingRow>
            data={tableRows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable
            searchable
            defaultGroupBy="termName"
            onRowClick={(row) => {
              if (row.surveyId) {
                setSelectedSurveyId(row.surveyId)
              } else {
                window.open(`${PRISM_BASE}/${row.id}`, '_blank', 'noopener')
              }
            }}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6">
                <i className="fa-light fa-rectangle-list text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm font-medium">
                  {termFilter !== 'all' || statusFilter !== 'all'
                    ? 'No offerings match these filters'
                    : 'No offerings match your search'}
                </p>
              </div>
            }
            toolbarSlot={() => (
              <>
                <Select value={termFilter} onValueChange={setTermFilter}>
                  <SelectTrigger className="h-8 w-40 text-sm" aria-label="Filter by term">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All terms</SelectItem>
                    {MOCK_PROGRAM_TERMS.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              </>
            )}
            bulkActionsSlot={(selected) => (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const ids = Array.from(selected).join(',')
                  router.push(`/surveys/activate?offerings=${ids}`)
                }}
              >
                <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 11 }} />
                Push Survey
              </Button>
            )}
          />

        </div>
      </div>
    </>
  )
}
