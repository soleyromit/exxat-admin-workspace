'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Avatar, AvatarFallback,
  Tooltip, TooltipContent, TooltipTrigger,
  Button, KeyMetrics, PageHeader,
} from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import {
  MOCK_STUDENTS, MOCK_COHORTS, MOCK_COURSE_ENROLLMENTS,
  MOCK_COURSE_OFFERINGS, MOCK_MASTER_COURSES, MOCK_PROGRAM_TERMS, MOCK_SURVEYS,
  type Student,
} from '@/lib/pce-mock-data'
import { DataTablePaginated } from '@/components/data-table/pagination'
import { EnrollmentStatusBadge } from '@/components/pce/pce-badges'
import type { ColumnDef } from '@/components/data-table/types'
import { TablePropertiesDrawer } from '@/components/table-properties/drawer'
import type { FilterFieldDef } from '@/components/table-properties/types'

const STATUSES = ['enrolled', 'graduated', 'withdrawn', 'on-leave'] as const

/* Module-level eval context — all constant data, computed once. */
const _courseCodeById = new Map(MOCK_MASTER_COURSES.map(c => [c.id, c.code]))
const _termNameById   = new Map(MOCK_PROGRAM_TERMS.map(t => [t.id, t.name]))
const _surveyByKey    = new Map(
  MOCK_SURVEYS
    .filter(s => s.surveyType === 'course_evaluation')
    .map(s => [`${s.courseCode}-${s.term}`, s]),
)

/* Invert MOCK_COURSE_ENROLLMENTS: studentId → offeringIds */
const _studentOfferingIds: Record<string, string[]> = {}
Object.entries(MOCK_COURSE_ENROLLMENTS).forEach(([coId, sids]) => {
  sids.forEach(sid => {
    if (!_studentOfferingIds[sid]) _studentOfferingIds[sid] = []
    _studentOfferingIds[sid].push(coId)
  })
})

function getEvalStats(studentId: string) {
  const offeringIds = _studentOfferingIds[studentId] ?? []
  let completed = 0, open = 0
  offeringIds.forEach(coId => {
    const co = MOCK_COURSE_OFFERINGS.find(o => o.id === coId)
    if (!co) return
    const survey = _surveyByKey.get(`${_courseCodeById.get(co.masterCourseId)}-${_termNameById.get(co.termId)}`)
    if (!survey) return
    if (['released', 'closed', 'pending_review'].includes(survey.status)) completed++
    else if (['collecting', 'active', 'scheduled'].includes(survey.status)) open++
  })
  return { courses: offeringIds.length, completed, open }
}

function initials(first: string, last: string) {
  return (first.charAt(0) + last.charAt(0)).toUpperCase()
}

interface StudentRow extends Record<string, unknown> {
  id: string
  fullName: string; firstName: string; lastName: string
  studentId: string; email: string; cohort: string
  enrollmentStatus: Student['enrollmentStatus']
  hasAccommodations: boolean
  coursesCount: number
  evalsCompleted: number
  evalsOpen: number
}

const PRISM_BASE = 'https://app.exxat.com/prism/dpt/students'

export default function StudentsPage() {
  const router = useRouter()
  const tableRows: StudentRow[] = useMemo(
    () => MOCK_STUDENTS.map(r => {
      const { courses, completed, open } = getEvalStats(r.id)
      return {
        id: r.id,
        fullName: `${r.firstName} ${r.lastName}`,
        firstName: r.firstName, lastName: r.lastName,
        studentId: r.studentId, email: r.email, cohort: r.cohort,
        enrollmentStatus: r.enrollmentStatus,
        hasAccommodations: !!r.hasAccommodations,
        coursesCount: courses,
        evalsCompleted: completed,
        evalsOpen: open,
      }
    }),
    [],
  )

  const enrolledCount       = MOCK_STUDENTS.filter(r => r.enrollmentStatus === 'enrolled').length
  const accommodationsCount = MOCK_STUDENTS.filter(r => r.hasAccommodations).length

  const kpis: MetricItem[] = [
    { id: 'enrolled',  label: 'Enrolled',       value: enrolledCount,         delta: '', trend: 'neutral' },
    { id: 'total',     label: 'Total students',  value: MOCK_STUDENTS.length,  delta: '', trend: 'neutral' },
    { id: 'accomm',    label: 'Accommodations',  value: accommodationsCount,   delta: '', trend: 'neutral' },
  ]

  const columns: ColumnDef<StudentRow>[] = [
    {
      key: 'fullName', label: 'Name', sortable: true, width: 240,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 rounded-full shrink-0">
            <AvatarFallback
              className="rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
            >
              {initials(row.firstName, row.lastName)}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/admin/students/${row.id}`}
            onClick={e => e.stopPropagation()}
            className="text-sm font-medium hover:text-interactive-hover-foreground hover:underline"
          >
            {row.fullName}
          </Link>
        </div>
      ),
    },
    {
      key: 'studentId', label: 'Student ID', sortable: true, width: 130,
      cell: (row) => <span className="font-mono text-xs">{row.studentId}</span>,
    },
    {
      key: 'email', label: 'Email', sortable: true, width: 220,
      cell: (row) => <span className="text-xs text-muted-foreground truncate max-w-44 block">{row.email}</span>,
    },
    {
      key: 'cohort', label: 'Cohort', sortable: true, width: 160,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.cohort}</span>,
      filter: {
        type: 'select', icon: 'fa-users', operators: ['is', 'is_not'],
        options: MOCK_COHORTS.map(c => ({ value: c, label: c })),
      },
    },
    {
      key: 'enrollmentStatus', label: 'Status', sortable: true, width: 120,
      cell: (row) => <EnrollmentStatusBadge status={row.enrollmentStatus} />,
      filter: {
        type: 'select', icon: 'fa-circle-dot', operators: ['is', 'is_not'],
        options: STATUSES.map(s => ({ value: s, label: s.replace('-', ' ') })),
      },
    },
    {
      key: 'hasAccommodations', label: 'Accommodations', sortable: true, width: 160,
      cell: (row) => row.hasAccommodations ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--brand-color-dark)' }}>
              <i className="fa-light fa-universal-access text-xs" aria-hidden="true" />
              Yes
            </span>
          </TooltipTrigger>
          <TooltipContent>Managed in the Accommodations module</TooltipContent>
        </Tooltip>
      ) : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      key: 'coursesCount', label: 'Courses', sortable: true, width: 90,
      header: () => <span className="block text-right">Courses</span>,
      cell: (row) => (
        <div className="text-right tabular-nums text-sm text-muted-foreground">
          {row.coursesCount > 0 ? row.coursesCount : '—'}
        </div>
      ),
    },
    {
      key: 'evalsCompleted', label: 'Evals', sortable: true, width: 140,
      cell: (row) => {
        const total = row.evalsCompleted + row.evalsOpen
        if (total === 0) return <span className="text-xs text-muted-foreground">—</span>
        const parts: string[] = []
        if (row.evalsCompleted > 0) parts.push(`${row.evalsCompleted} done`)
        if (row.evalsOpen > 0) parts.push(`${row.evalsOpen} open`)
        return (
          <span className="text-xs" style={{ color: row.evalsOpen > 0 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
            {parts.join(' · ')}
          </span>
        )
      },
    },
    {
      key: 'prism', label: '', width: 36,
      cell: (row) => (
        <Button variant="ghost" size="icon" aria-label="Open in Prism"
          onClick={(e) => { e.stopPropagation(); window.open(`${PRISM_BASE}/${row.id}`, '_blank', 'noopener') }}
        >
          <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={`${tableRows.length} student${tableRows.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <i className="fa-light fa-rotate text-xs" aria-hidden="true" />
              Synced from Prism
            </span>
            <Link href="#" className="text-xs text-muted-foreground underline">
              Manage accommodations →
            </Link>
          </div>
        }
      />

      <div className="shrink-0 [&_*]:!border-e-0 px-4 lg:px-6" style={{ paddingBlock: 4 }}>
        <KeyMetrics variant="compact" showHeader={false} metricsSingleRow metrics={kpis} />
      </div>

      <div className="flex-1 overflow-auto" style={{ paddingTop: 16, paddingBottom: 28 }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <DataTablePaginated<StudentRow>
            data={tableRows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable={false}
            searchable
            defaultGroupBy="cohort"
            onRowClick={(row) => router.push(`/admin/students/${row.id}`)}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6">
                <i className="fa-light fa-graduation-cap text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm font-medium">No students match your search</p>
              </div>
            }
            toolbarSlot={(state) => {
              const filterFields: FilterFieldDef[] = columns
                .filter(c => c.filter)
                .map(c => ({
                  key: c.key, label: c.label,
                  icon: c.filter!.icon ?? 'fa-filter',
                  type: c.filter!.type,
                  operators: c.filter!.operators ?? ['is', 'is_not'],
                  options: c.filter!.options,
                }))
              const orderableKeys = columns.filter(c => c.key !== 'prism').map(c => c.key)
              return (
                <>
                  <span className="text-xs text-muted-foreground">
                    {state.rows.length} student{state.rows.length !== 1 ? 's' : ''}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        aria-label="Table properties"
                        aria-expanded={state.sheetOpen}
                        onClick={() => state.setSheetOpen(o => !o)}
                      >
                        <i className="fa-light fa-sliders text-[13px]" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Table properties</TooltipContent>
                  </Tooltip>
                  <TablePropertiesDrawer
                    open={state.sheetOpen}
                    onOpenChange={state.setSheetOpen}
                    activeFilters={state.activeFilters}
                    onAddFilter={state.addFilter}
                    onUpdateFilter={state.updateFilter}
                    onRemoveFilter={state.removeFilter}
                    getFilterConnector={state.getConnector}
                    onToggleFilterConnector={state.toggleConnector}
                    filterFields={filterFields}
                    totalRows={tableRows.length}
                    filteredRows={state.rows.length}
                    sortRules={state.sortRules}
                    onSortRulesChange={state.setSortRules}
                    onAddSortRule={state.addSortRule}
                    onRemoveSortRule={state.removeSortRule}
                    onToggleSortDir={state.toggleSortDir}
                    colOrder={state.colOrder}
                    onColOrderChange={state.setColOrder}
                    hiddenCols={state.hiddenCols}
                    onToggleColVisibility={state.toggleColVisibility}
                    onMoveCol={state.moveCol}
                    resolveColumnLabel={(key) => columns.find(c => c.key === key)?.label ?? key}
                    orderableKeys={orderableKeys}
                  />
                </>
              )
            }}
          />

        </div>
      </div>
    </>
  )
}
