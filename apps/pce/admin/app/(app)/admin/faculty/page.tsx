'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, KeyMetrics } from '@exxatdesignux/ui'
import type { MetricItem } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import {
  MOCK_FACULTY, MOCK_FACULTY_OFFERINGS,
  type PceInstructor,
} from '@/lib/pce-mock-data'
import { DataTablePaginated } from '@/components/data-table/pagination'
import type { ColumnDef } from '@/components/data-table/types'

interface FacultyRow extends Record<string, unknown> {
  id: string
  faculty: PceInstructor
  name: string; initials: string; department: string
  offeringCount: number
  avgRating: number | null
  avgCompletion: number | null
}

const PRISM_BASE = 'https://app.exxat.com/prism/dpt/faculty'

const tierColor = (avg: number) =>
  avg >= 4.3 ? 'var(--chart-2)' : avg >= 3.7 ? 'var(--brand-color)' : 'var(--chart-4)'

const completionColor = (pct: number) =>
  pct >= 80 ? 'var(--chart-2)' : pct >= 60 ? 'var(--brand-color)' : 'var(--chart-4)'

export default function FacultyPage() {
  const rows: FacultyRow[] = useMemo(() => {
    return MOCK_FACULTY.map(f => {
      const offerings = MOCK_FACULTY_OFFERINGS.filter(o => o.facultyId === f.id)
      const totalEnrolled = offerings.reduce((s, o) => s + o.enrolled, 0)
      const avgRating = totalEnrolled > 0
        ? +(offerings.reduce((s, o) => s + o.avgRating * o.enrolled, 0) / totalEnrolled).toFixed(2)
        : null
      const avgCompletion = totalEnrolled > 0
        ? +(offerings.reduce((s, o) => s + o.responseRate * o.enrolled, 0) / totalEnrolled).toFixed(1)
        : null
      return {
        id: f.id, faculty: f,
        name: f.name, initials: f.initials,
        department: f.department ?? '—',
        offeringCount: offerings.length,
        avgRating, avgCompletion,
      }
    })
  }, [])

  const departments  = [...new Set(MOCK_FACULTY.map(f => f.department).filter(Boolean))].length
  const programAvg   = (() => {
    const totalE = MOCK_FACULTY_OFFERINGS.reduce((s, o) => s + o.enrolled, 0)
    if (totalE === 0) return null
    return +(MOCK_FACULTY_OFFERINGS.reduce((s, o) => s + o.avgRating * o.enrolled, 0) / totalE).toFixed(1)
  })()
  const programCompletion = (() => {
    const totalE = MOCK_FACULTY_OFFERINGS.reduce((s, o) => s + o.enrolled, 0)
    if (totalE === 0) return null
    return +(MOCK_FACULTY_OFFERINGS.reduce((s, o) => s + o.responseRate * o.enrolled, 0) / totalE).toFixed(1)
  })()

  const kpis: MetricItem[] = [
    { id: 'faculty',    label: 'Faculty',         value: MOCK_FACULTY.length,                                       delta: '', trend: 'neutral' },
    { id: 'dept',       label: 'Departments',      value: departments,                                               delta: '', trend: 'neutral' },
    { id: 'rating',     label: 'Avg rating',       value: programAvg !== null ? `${programAvg}/5` : '—',            delta: '', trend: 'neutral' },
    { id: 'completion', label: 'Avg completion',   value: programCompletion !== null ? `${programCompletion}%` : '—', delta: '', trend: 'neutral' },
  ]

  const columns: ColumnDef<FacultyRow>[] = [
    {
      key: 'name', label: 'Name', sortable: true, width: 260,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 rounded-full shrink-0">
            <AvatarFallback
              className="rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
            >
              {row.initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'department', label: 'Department', sortable: true, width: 200,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.department}</span>,
    },
    {
      key: 'offeringCount', label: 'Offerings', sortable: true, width: 110,
      header: () => <span className="block text-right">Offerings</span>,
      cell: (row) => (
        <div className="text-right tabular-nums text-sm">
          {row.offeringCount > 0 ? row.offeringCount : <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      key: 'avgCompletion', label: 'Completion', sortable: true, width: 120,
      header: () => <span className="block text-right">Completion</span>,
      cell: (row) => (
        <div
          className="text-right tabular-nums text-sm font-semibold"
          style={{ color: row.avgCompletion !== null ? completionColor(row.avgCompletion) : 'var(--muted-foreground)' }}
        >
          {row.avgCompletion !== null ? `${row.avgCompletion}%` : '—'}
        </div>
      ),
    },
    {
      key: 'avgRating', label: 'Avg rating', sortable: true, width: 120,
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
      key: 'analytics', label: '', width: 32,
      cell: (row) => (
        <Link
          href={`/analytics?tab=faculty&facultyId=${row.id}`}
          onClick={e => e.stopPropagation()}
          title="View in Analytics"
        >
          <i className="fa-light fa-chart-mixed text-xs" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
        </Link>
      ),
    },
    {
      key: 'prism', label: '', width: 32,
      cell: () => (
        <i
          className="fa-light fa-arrow-up-right-from-square text-xs text-muted-foreground"
          aria-hidden="true"
        />
      ),
    },
  ]

  return (
    <>
      <SiteHeader title="Faculty" />
      <div className="flex items-center gap-3 shrink-0" style={{ padding: '14px 28px 14px' }}>
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Faculty</h1>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <i className="fa-light fa-rotate text-xs" aria-hidden="true" />
          Synced from Prism
        </span>
      </div>

      <div className="shrink-0 [&_*]:!border-e-0 px-4 lg:px-6" style={{ paddingBlock: 4 }}>
        <KeyMetrics variant="compact" showHeader={false} metricsSingleRow metrics={kpis} />
      </div>

      <div className="flex-1 overflow-auto" style={{ paddingTop: 16, paddingBottom: 28 }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <p className="text-sm text-muted-foreground px-4 lg:px-6">
            {MOCK_FACULTY.length} faculty · {departments} department{departments !== 1 ? 's' : ''}.
            Click any row to open the faculty profile in Prism.
          </p>

          <DataTablePaginated<FacultyRow>
            data={rows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable={false}
            searchable
            onRowClick={(row) => window.open(`${PRISM_BASE}/${row.id}`, '_blank', 'noopener')}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6">
                <i className="fa-light fa-users text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm font-medium">No faculty match your search</p>
              </div>
            }
            toolbarSlot={() => null}
          />

        </div>
      </div>
    </>
  )
}
