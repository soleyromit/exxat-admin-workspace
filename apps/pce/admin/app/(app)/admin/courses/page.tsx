'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, KeyMetrics,
} from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import {
  MOCK_MASTER_COURSES, MOCK_COURSE_OFFERINGS, MOCK_FACULTY_OFFERINGS,
  type MasterCourse,
} from '@/lib/pce-mock-data'
import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'

const TYPE_LABELS: Record<MasterCourse['type'], string> = {
  didactic: 'Didactic',
  clinical: 'Clinical',
  seminar:  'Seminar',
}

const TYPE_BADGE_VARIANT: Record<MasterCourse['type'], 'secondary' | 'outline'> = {
  didactic: 'secondary',
  clinical: 'outline',
  seminar:  'outline',
}

/* Precompute per-course stats from offerings + faculty offering data */
const _offeringsByMCId = MOCK_COURSE_OFFERINGS.reduce<Record<string, number>>((acc, o) => {
  acc[o.masterCourseId] = (acc[o.masterCourseId] ?? 0) + 1
  return acc
}, {})

const _codeById = new Map(MOCK_MASTER_COURSES.map(c => [c.id, c.code]))

const _avgRatingByCode = MOCK_FACULTY_OFFERINGS.reduce<Record<string, { sum: number; n: number }>>((acc, fo) => {
  if (!acc[fo.courseCode]) acc[fo.courseCode] = { sum: 0, n: 0 }
  acc[fo.courseCode].sum += fo.avgRating * fo.enrolled
  acc[fo.courseCode].n   += fo.enrolled
  return acc
}, {})

interface MasterCourseRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  department: string
  type: MasterCourse['type']
  status: MasterCourse['status']
  timesOffered: number
  avgRating: number | null
}

const DEPARTMENTS = [...new Set(MOCK_MASTER_COURSES.map(c => c.department))].sort()
const PRISM_BASE  = 'https://app.exxat.com/prism/dpt/courses'

const tierColor = (avg: number) =>
  avg >= 4.3 ? 'var(--chart-2)' : avg >= 3.7 ? 'var(--brand-color)' : 'var(--chip-4)'

export default function MasterCoursesPage() {
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const tableRows: MasterCourseRow[] = useMemo(
    () => MOCK_MASTER_COURSES
      .filter(r => {
        if (departmentFilter !== 'all' && r.department !== departmentFilter) return false
        if (typeFilter !== 'all' && r.type !== typeFilter) return false
        return true
      })
      .map(r => {
        const ratingData = _avgRatingByCode[r.code]
        return {
          id: r.id, code: r.code, name: r.name,
          department: r.department, type: r.type, status: r.status,
          timesOffered: _offeringsByMCId[r.id] ?? 0,
          avgRating: ratingData && ratingData.n > 0
            ? +(ratingData.sum / ratingData.n).toFixed(2)
            : null,
        }
      }),
    [departmentFilter, typeFilter],
  )

  /* KPI metrics (max 4 per brief) */
  const activeCount    = MOCK_MASTER_COURSES.filter(c => c.status === 'active').length
  const didacticCount  = MOCK_MASTER_COURSES.filter(c => c.type === 'didactic').length
  const clinicalCount  = MOCK_MASTER_COURSES.filter(c => c.type === 'clinical').length
  const allRatings = Object.values(_avgRatingByCode)
  const programAvgRating = allRatings.length > 0
    ? +(allRatings.reduce((s, r) => s + (r.n > 0 ? r.sum / r.n : 0), 0) / allRatings.filter(r => r.n > 0).length).toFixed(1)
    : null

  const kpis: MetricItem[] = [
    { id: 'total',    label: 'Total courses',   value: MOCK_MASTER_COURSES.length, delta: '', trend: 'neutral' },
    { id: 'didactic', label: 'Didactic',         value: didacticCount,              delta: '', trend: 'neutral' },
    { id: 'clinical', label: 'Clinical',          value: clinicalCount,              delta: '', trend: 'neutral' },
    { id: 'rating',   label: 'Avg program rating', value: programAvgRating !== null ? `${programAvgRating}/5` : '—', delta: '', trend: 'neutral' },
  ]

  const columns: ColumnDef<MasterCourseRow>[] = [
    {
      key: 'code', label: 'Code', sortable: true, width: 110,
      cell: (row) => <span className="font-mono text-xs">{row.code}</span>,
    },
    {
      key: 'name', label: 'Name', sortable: true, width: 280,
      cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
    },
    {
      key: 'type', label: 'Type', sortable: true, width: 110,
      cell: (row) => (
        <Badge variant={TYPE_BADGE_VARIANT[row.type]} className="capitalize text-xs">
          {TYPE_LABELS[row.type]}
        </Badge>
      ),
    },
    {
      key: 'department', label: 'Department', sortable: true, width: 190,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.department}</span>,
    },
    {
      key: 'timesOffered', label: 'Times offered', sortable: true, width: 130,
      header: () => <span className="block text-right">Times offered</span>,
      cell: (row) => (
        <div className="text-right tabular-nums text-sm text-muted-foreground">
          {row.timesOffered > 0 ? row.timesOffered : '—'}
        </div>
      ),
    },
    {
      key: 'avgRating', label: 'Avg rating', sortable: true, width: 110,
      header: () => <span className="block text-right">Avg rating</span>,
      cell: (row) => (
        <div
          className="text-right tabular-nums text-sm font-semibold"
          style={{ color: row.avgRating !== null ? tierColor(row.avgRating) : 'var(--muted-foreground)' }}
        >
          {row.avgRating !== null ? `${row.avgRating.toFixed(1)}/5` : '—'}
        </div>
      ),
    },
    {
      key: 'prism', label: '', width: 36,
      cell: () => (
        <i className="fa-light fa-arrow-up-right-from-square text-xs text-muted-foreground" aria-hidden="true" />
      ),
    },
  ]

  return (
    <>
      <SiteHeader title="Master Courses" breadcrumbs={[{ label: 'Directory', href: '/admin' }]} />

      <div className="shrink-0 [&_*]:!border-e-0 px-4 lg:px-6" style={{ paddingBlock: 4 }}>
        <KeyMetrics variant="compact" showHeader={false} metricsSingleRow metrics={kpis} />
      </div>

      <div className="flex-1 overflow-auto" style={{ paddingTop: 16, paddingBottom: 28 }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <div className="flex items-center gap-2 flex-wrap px-4 lg:px-6">
            <p className="text-sm text-muted-foreground flex-1">
              {activeCount} active · {MOCK_MASTER_COURSES.length} total.
              Click any row to open in Prism.
            </p>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="didactic">Didactic</SelectItem>
                <SelectItem value="clinical">Clinical</SelectItem>
                <SelectItem value="seminar">Seminar</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-8 w-52 text-sm" aria-label="Filter by department">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <DataTablePaginated<MasterCourseRow>
            data={tableRows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable={false}
            searchable
            onRowClick={(row) => window.open(`${PRISM_BASE}/${row.id}`, '_blank', 'noopener')}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6">
                <i className="fa-light fa-book text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm font-medium">
                  {departmentFilter !== 'all' || typeFilter !== 'all'
                    ? 'No courses match these filters'
                    : 'No courses match your search'}
                </p>
              </div>
            }
            toolbarSlot={() => null}
          />

        </div>
      </div>
    </>
  )
}
