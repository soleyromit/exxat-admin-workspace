'use client'

/**
 * Admin · Students (UC-19, workspace ADR-001 entity #4).
 *
 * Per workspace ADR-002: students are typically LMS-synced. When LMS-on:
 * the page is read-only with a sync indicator. When LMS-off (this prototype's
 * MOCK_LMS_ENABLED state): full CRUD via Add modal + Import CSV.
 *
 * Bulk-action affordance is deferred to a Phase 2 follow-up — first ship the
 * uniform shape that matches Faculty / Courses / etc.
 *
 * Per workspace ADR-006: accommodations are admin-applied at student level
 * but maintained in a SHARED cross-product module — link out, don't manage
 * here.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input,
  Tooltip, TooltipContent, TooltipTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldDescription, FieldError,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, Avatar, AvatarFallback, LocalBanner,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
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

function enrollmentBadgeVariant(s: Student['enrollmentStatus']): 'secondary' | 'outline' | 'destructive' {
  if (s === 'enrolled') return 'secondary'
  if (s === 'graduated') return 'outline'
  if (s === 'on-leave') return 'outline'
  // 'withdrawn' uses outline (NOT destructive — DS-005 / no-red-in-status per VIZ-004 spirit)
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
  const [rows, setRows] = useState<Student[]>(MOCK_STUDENTS)
  const [cohortFilter, setCohortFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    cohort: MOCK_COHORTS[0],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // External hard-filters (cohort, status) applied OUTSIDE the table.
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

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    if (!draft.studentId.trim()) next.studentId = 'Student ID is required.'
    else if (rows.some(r => r.studentId.toLowerCase() === draft.studentId.trim().toLowerCase())) {
      next.studentId = 'A student with this ID already exists.'
    }
    if (!draft.firstName.trim()) next.firstName = 'First name is required.'
    if (!draft.lastName.trim()) next.lastName = 'Last name is required.'
    if (!draft.email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      next.email = 'Enter a valid email address (e.g., name@school.edu).'
    }
    return next
  }

  function handleSave() {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    const today = new Date().toISOString().slice(0, 10)
    const newRow: Student = {
      id: `st${Date.now()}`,
      studentId: draft.studentId.trim(),
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim(),
      cohort: draft.cohort,
      enrollmentStatus: 'enrolled',
      enrolledAt: today,
    }
    setRows([newRow, ...rows])
    setDraft({ studentId: '', firstName: '', lastName: '', email: '', cohort: MOCK_COHORTS[0] })
    setErrors({})
    setAddOpen(false)
  }

  function handleAddOpenChange(open: boolean) {
    setAddOpen(open)
    if (!open) setErrors({})
  }

  function handleStatusChange(id: string, next: Student['enrollmentStatus']) {
    setRows(rows.map(r => r.id === id ? { ...r, enrollmentStatus: next } : r))
  }

  // Counts for the LMS-state header line
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
              className="rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
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
        <Badge variant={enrollmentBadgeVariant(row.enrollmentStatus)} className="capitalize">
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
            <span
              className="inline-flex items-center gap-1 text-xs"
              style={{ color: 'var(--brand-color-dark)' }}
            >
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
            { label: 'Edit profile',          icon: 'fa-pen',             disabled: MOCK_LMS_ENABLED },
            { label: 'View course offerings', icon: 'fa-rectangle-list' },
            { label: 'View accommodations',   icon: 'fa-universal-access' },
            {
              label: 'Mark on leave',
              icon: 'fa-pause',
              divider: true,
              hidden: row.enrollmentStatus !== 'enrolled',
              onClick: () => handleStatusChange(row.id, 'on-leave'),
            },
            {
              label: 'Reactivate',
              icon: 'fa-play',
              divider: true,
              hidden: row.enrollmentStatus !== 'on-leave',
              onClick: () => handleStatusChange(row.id, 'enrolled'),
            },
            {
              label: 'Withdraw',
              icon: 'fa-user-xmark',
              variant: 'destructive',
              hidden: row.enrollmentStatus !== 'enrolled' && row.enrollmentStatus !== 'on-leave',
              onClick: () => handleStatusChange(row.id, 'withdrawn'),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <SiteHeader title="Students" />
      <div className="flex items-center gap-3 shrink-0" style={{ padding: '14px 28px 14px' }}>
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Students</h1>
      </div>

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

          {/* Toolbar — external hard-filters (cohort, status) + actions. Search is provided by DataTable. */}
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

            <div className="flex-1" />

            {MOCK_LMS_ENABLED ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" disabled aria-disabled="true">
                    <i className="fa-light fa-plus" aria-hidden="true" />
                    Add student
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Managed by your LMS — students sync automatically</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="default" onClick={() => setAddOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add student
              </Button>
            )}

            <Button variant="outline">
              <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
              Import CSV
            </Button>
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
                <i className="fa-light fa-graduation-cap text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm font-medium">
                  {rows.length === 0
                    ? 'No students yet'
                    : cohortFilter !== 'all' || statusFilter !== 'all'
                      ? 'No students match these filters'
                      : 'No students match your search'}
                </p>
                <p className="text-xs text-muted-foreground" style={{ maxWidth: 320 }}>
                  {rows.length === 0
                    ? (MOCK_LMS_ENABLED ? 'Students sync from your LMS — none have synced yet.' : 'Add a student manually or import a CSV roster.')
                    : 'Try adjusting your filters or clearing the search.'}
                </p>
              </div>
            }
            toolbarSlot={(state) => {
              // Build the filter-field list from the column filter configs so the
              // drawer's "Add filter" menu mirrors the toolbar.
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
              Last synced 4m ago <span style={{ color: 'var(--chart-2)' }}>●</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
              LMS integration is off. This roster is managed manually.
            </p>
          )}

        </div>
      </div>

      {/* Add student dialog */}
      <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add student</DialogTitle>
            <DialogDescription>
              Add a student manually. When LMS integration is on, students sync automatically.
            </DialogDescription>
          </DialogHeader>

          {Object.keys(errors).length > 1 && (
            <LocalBanner variant="error" title="Fix the following before saving">
              {Object.keys(errors).length} fields need attention.
            </LocalBanner>
          )}

          <FieldGroup>
            <Field orientation="vertical">
              <FieldLabel htmlFor="stu-id">Student ID *</FieldLabel>
              <Input
                id="stu-id"
                placeholder="e.g., 01234582"
                value={draft.studentId}
                onChange={e => setDraft({ ...draft, studentId: e.target.value })}
                aria-required="true"
                aria-invalid={!!errors.studentId}
                aria-describedby={errors.studentId ? 'stu-id-error' : 'stu-id-desc'}
              />
              {errors.studentId ? (
                <FieldError id="stu-id-error">{errors.studentId}</FieldError>
              ) : (
                <FieldDescription id="stu-id-desc">Institution-issued ID. Must be unique.</FieldDescription>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field orientation="vertical">
                <FieldLabel htmlFor="stu-first">First name *</FieldLabel>
                <Input
                  id="stu-first"
                  value={draft.firstName}
                  onChange={e => setDraft({ ...draft, firstName: e.target.value })}
                  aria-required="true"
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? 'stu-first-error' : undefined}
                />
                {errors.firstName && <FieldError id="stu-first-error">{errors.firstName}</FieldError>}
              </Field>
              <Field orientation="vertical">
                <FieldLabel htmlFor="stu-last">Last name *</FieldLabel>
                <Input
                  id="stu-last"
                  value={draft.lastName}
                  onChange={e => setDraft({ ...draft, lastName: e.target.value })}
                  aria-required="true"
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? 'stu-last-error' : undefined}
                />
                {errors.lastName && <FieldError id="stu-last-error">{errors.lastName}</FieldError>}
              </Field>
            </div>

            <Field orientation="vertical">
              <FieldLabel htmlFor="stu-email">Email *</FieldLabel>
              <Input
                id="stu-email"
                type="email"
                value={draft.email}
                onChange={e => setDraft({ ...draft, email: e.target.value })}
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'stu-email-error' : undefined}
              />
              {errors.email && <FieldError id="stu-email-error">{errors.email}</FieldError>}
            </Field>

            <Field orientation="vertical">
              <FieldLabel htmlFor="stu-cohort">Cohort *</FieldLabel>
              <Select value={draft.cohort} onValueChange={v => setDraft({ ...draft, cohort: v })}>
                <SelectTrigger id="stu-cohort" aria-label="Cohort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_COHORTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <FieldDescription>
                Accommodations for this student are managed in the Accommodations module.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="default" onClick={handleSave}>
              Add student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

