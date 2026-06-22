'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button,
  Tooltip, TooltipContent, TooltipTrigger,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, Avatar, AvatarFallback,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import {
  MOCK_STUDENTS, MOCK_COHORTS, MOCK_LMS_ENABLED,
  type Student,
} from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { RowActions } from '@/components/data-table/row-actions'
import { TablePropertiesDrawer } from '@/components/table-properties/drawer'
import type { FilterFieldDef } from '@/components/table-properties/types'

const STATUSES = ['enrolled', 'graduated', 'withdrawn', 'on-leave'] as const

function statusBadgeVariant(s: Student['enrollmentStatus']): 'secondary' | 'outline' | 'destructive' {
  if (s === 'enrolled') return 'secondary'
  if (s === 'graduated') return 'outline'
  if (s === 'on-leave') return 'outline'
  return 'outline'
}

function initials(first: string, last: string): string {
  return (first.charAt(0) + last.charAt(0)).toUpperCase()
}

interface StudentRow extends Record<string, unknown> {
  id: string
  fullName: string
  firstName: string
  lastName: string
  studentId: string
  email: string
  cohort: string
  enrollmentStatus: Student['enrollmentStatus']
  hasAccommodations: boolean
}

export default function StudentsPage() {
  const [rows] = useState<Student[]>(MOCK_STUDENTS)
  const [cohortFilter, setCohortFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (cohortFilter !== 'all' && r.cohort !== cohortFilter) return false
      if (statusFilter !== 'all' && r.enrollmentStatus !== statusFilter) return false
      return true
    })
  }, [rows, cohortFilter, statusFilter])

  const tableRows: StudentRow[] = useMemo(
    () => filtered.map(r => ({
      id: r.id,
      fullName: `${r.firstName} ${r.lastName}`,
      firstName: r.firstName,
      lastName: r.lastName,
      studentId: r.studentId,
      email: r.email,
      cohort: r.cohort,
      enrollmentStatus: r.enrollmentStatus,
      hasAccommodations: !!r.hasAccommodations,
    })),
    [filtered]
  )

  const enrolledCount = rows.filter(r => r.enrollmentStatus === 'enrolled').length
  const accommodationsCount = rows.filter(r => r.hasAccommodations).length

  const columns: ColumnDef<StudentRow>[] = [
    {
      key: 'fullName',
      label: 'Name',
      sortable: true,
      width: 240,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7 rounded-full shrink-0">
            <AvatarFallback
              className="rounded-full text-xs font-semibold bg-[var(--avatar-initials-bg)] text-[var(--avatar-initials-fg)]"
            >
              {initials(row.firstName, row.lastName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{row.fullName}</span>
        </div>
      ),
    },
    {
      key: 'studentId',
      label: 'Student ID',
      sortable: true,
      width: 130,
      cell: (row) => <span className="font-mono text-xs">{row.studentId}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      width: 220,
      cell: (row) => <span className="text-xs text-muted-foreground truncate max-w-44 block">{row.email}</span>,
    },
    {
      key: 'cohort',
      label: 'Cohort',
      sortable: true,
      width: 160,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.cohort}</span>,
      filter: {
        type: 'select',
        icon: 'fa-users',
        operators: ['is', 'is_not'],
        options: MOCK_COHORTS.map(c => ({ value: c, label: c })),
      },
    },
    {
      key: 'enrollmentStatus',
      label: 'Status',
      sortable: true,
      width: 120,
      cell: (row) => (
        <Badge variant={statusBadgeVariant(row.enrollmentStatus)} className="capitalize">
          {row.enrollmentStatus.replace('-', ' ')}
        </Badge>
      ),
      filter: {
        type: 'select',
        icon: 'fa-circle-dot',
        operators: ['is', 'is_not'],
        options: STATUSES.map(s => ({ value: s, label: s.replace('-', ' ') })),
      },
    },
    {
      key: 'hasAccommodations',
      label: 'Accommodations',
      sortable: true,
      width: 160,
      cell: (row) => row.hasAccommodations ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 text-xs text-[var(--brand-color-dark)]">
              <i className="fa-light fa-universal-access text-xs" aria-hidden="true" />
              Yes
            </span>
          </TooltipTrigger>
          <TooltipContent>Managed in the Accommodations module</TooltipContent>
        </Tooltip>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 44,
      cell: (row) => (
        <RowActions
          row={row}
          label={row.fullName}
          contentClassName="w-48"
          actions={[
            { label: 'View course offerings', icon: 'fa-rectangle-list' },
            { label: 'View accommodations',   icon: 'fa-universal-access' },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Students</h1>
      </header>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-6xl flex flex-col gap-4">

          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground max-w-2xl">
              {enrolledCount} enrolled · {rows.length} total · {accommodationsCount} with accommodations.
              {MOCK_LMS_ENABLED ? 'Students sync automatically from your LMS.' : 'LMS integration is off. This roster is managed manually.'}
            </p>
            <Link href="#" className="text-xs text-muted-foreground underline">
              Manage accommodations →
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={cohortFilter} onValueChange={setCohortFilter}>
              <SelectTrigger className="h-8 w-44 text-sm" aria-label="Filter by cohort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cohorts</SelectItem>
                {MOCK_COHORTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                <SelectItem value="Class of 2025">Class of 2025</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <DataTable<StudentRow>
            data={tableRows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable
            searchable
            defaultGroupBy="cohort"
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6">
                <i className="fa-light fa-graduation-cap text-2xl text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">
                  {rows.length === 0
                    ? 'No students yet'
                    : cohortFilter !== 'all' || statusFilter !== 'all'
                      ? 'No students match these filters'
                      : 'No students match your search'}
                </p>
                <p className="text-xs text-muted-foreground" style={{ maxWidth: 320 }}>
                  {rows.length === 0
                    ? (MOCK_LMS_ENABLED ? 'Students sync from your LMS — none have synced yet.' : 'Students are synced from your LMS or managed by your administrator.')
                    : 'Try adjusting your filters or clearing the search.'}
                </p>
              </div>
            }
            toolbarSlot={(state) => {
              const filterFields: FilterFieldDef[] = columns
                .filter(c => c.filter)
                .map(c => ({
                  key: c.key,
                  label: c.label,
                  icon: c.filter!.icon ?? 'fa-filter',
                  type: c.filter!.type,
                  operators: c.filter!.operators ?? (c.filter!.type === 'text' ? ['contains', 'not_contains'] : ['is', 'is_not']),
                  options: c.filter!.options,
                }))
              const orderableKeys = columns
                .filter(c => c.key !== 'select' && c.key !== 'actions')
                .map(c => c.key)
              return (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
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

          {MOCK_LMS_ENABLED ? (
            <p className="text-xs text-muted-foreground text-right">
              Last synced 4m ago <span className="text-[var(--chart-2)]">●</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
              LMS integration is off. This roster is managed manually.
            </p>
          )}

        </div>
      </div>
    </>
  )
}
