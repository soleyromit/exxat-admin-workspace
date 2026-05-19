'use client'

/**
 * Admin · Master Courses (UC-19, workspace ADR-001 entity #1).
 *
 * Per docs/patterns/admin/master-list-admin.md — uniform list shape:
 * Search · Add · Import · Table · Per-row dropdown · LMS sync footer.
 *
 * Per workspace ADR-002 (LMS-first default): Add disabled when LMS-on.
 * Mock data uses MOCK_LMS_ENABLED = false so manual CRUD is exercisable.
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  Button,
  Input,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Tooltip, TooltipContent, TooltipTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldError,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  LocalBanner,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import {
  MOCK_MASTER_COURSES, MOCK_LMS_ENABLED,
  type MasterCourse,
} from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'

const DEPARTMENTS = ['Biological Sciences', 'Nursing', 'Medicine', 'Foundations', 'Pharmacy']

interface MasterCourseRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  department: string
  status: MasterCourse['status']
  lastEdited: string
  editedBy: string
  raw: MasterCourse
}

export default function MasterCoursesPage() {
  // Local-state CRUD; no backend persistence — fine for prototype/Phase 1.
  const [rows, setRows] = useState<MasterCourse[]>(MOCK_MASTER_COURSES)
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({ code: '', name: '', department: DEPARTMENTS[0] })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filteredRaw = rows.filter(r => {
    if (departmentFilter !== 'all' && r.department !== departmentFilter) return false
    return true
  })

  const tableRows: MasterCourseRow[] = filteredRaw.map(r => ({
    id: r.id,
    code: r.code,
    name: r.name,
    department: r.department,
    status: r.status,
    lastEdited: r.lastEdited,
    editedBy: r.editedBy,
    raw: r,
  }))

  // Validation pattern: accommodations/page.tsx:96-126.
  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    const trimmedCode = draft.code.trim()
    const trimmedName = draft.name.trim()
    if (!trimmedCode) next.code = 'Course code is required.'
    else if (rows.some(r => r.code.trim().toLowerCase() === trimmedCode.toLowerCase())) {
      next.code = 'A course with this code already exists.'
    }
    if (!trimmedName) next.name = 'Course name is required.'
    return next
  }

  function handleSave() {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    const today = new Date().toISOString().slice(0, 10)
    const newRow: MasterCourse = {
      id: `mc${Date.now()}`,
      code: draft.code.trim(),
      name: draft.name.trim(),
      department: draft.department,
      status: 'active',
      lastEdited: today,
      editedBy: 'You (current user)',
    }
    setRows([newRow, ...rows])
    setDraft({ code: '', name: '', department: DEPARTMENTS[0] })
    setErrors({})
    setAddOpen(false)
  }

  function handleAddOpenChange(open: boolean) {
    setAddOpen(open)
    if (!open) setErrors({})
  }

  function handleArchive(id: string) {
    setRows(rows.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r))
  }

  const columns: ColumnDef<MasterCourseRow>[] = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      width: 120,
      cell: (row) => <span className="font-mono text-xs">{row.code}</span>,
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: 260,
      cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      width: 200,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.department}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 110,
      cell: (row) => (
        <span className={
          'text-xs capitalize ' +
          (row.status === 'active' ? 'text-foreground' : 'text-muted-foreground')
        }>
          {row.status}
        </span>
      ),
    },
    {
      key: 'lastEdited',
      label: 'Last edited',
      sortable: true,
      width: 220,
      cell: (row) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {row.lastEdited} · {row.editedBy}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 44,
      cell: (row) => <RowActions row={row.raw} onArchive={() => handleArchive(row.raw.id)} />,
    },
  ]

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Master Courses</h1>
      </header>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          {/* External hard-filter (department) + Add/Import actions.
              DataTable provides built-in search/properties below. */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="h-8 w-52 text-sm" aria-label="Filter by department">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            {MOCK_LMS_ENABLED ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" disabled aria-disabled="true">
                    <i className="fa-light fa-plus" aria-hidden="true" />
                    Add course
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Managed by your LMS</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="default" onClick={() => setAddOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add course
              </Button>
            )}

            <Button variant="outline">
              <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
              Import CSV
            </Button>
          </div>

          {tableRows.length === 0 ? (
            <div className="border border-border rounded-lg flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-sm font-medium">
                {departmentFilter !== 'all' ? 'No courses match this filter' : 'No master courses yet'}
              </p>
              {departmentFilter === 'all' && !MOCK_LMS_ENABLED && (
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                  <i className="fa-light fa-plus" aria-hidden="true" />
                  Add your first course
                </Button>
              )}
            </div>
          ) : (
            <DataTable<MasterCourseRow>
              data={tableRows}
              columns={columns}
              getRowId={(row) => row.id}
              selectable
              searchable
            />
          )}

          {/* LMS sync indicator (footer) */}
          {MOCK_LMS_ENABLED && (
            <p className="text-xs text-muted-foreground text-right">
              Last synced 4m ago <span style={{ color: 'var(--chart-2)' }}>●</span>
            </p>
          )}
          {!MOCK_LMS_ENABLED && (
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
              LMS integration is off. This list is managed manually.
            </p>
          )}

        </div>
      </div>

      {/* Add course dialog */}
      <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add master course</DialogTitle>
            <DialogDescription>
              Master courses live at program level and are reused across terms via course offerings.
            </DialogDescription>
          </DialogHeader>

          {Object.keys(errors).length >= 2 && (
            <LocalBanner variant="error" title="Fix the following before saving">
              {Object.keys(errors).length} fields need attention.
            </LocalBanner>
          )}

          <FieldGroup>
            <Field orientation="vertical">
              <FieldLabel htmlFor="course-code">Course code *</FieldLabel>
              <Input
                id="course-code"
                placeholder="e.g., BIO 401"
                value={draft.code}
                onChange={e => setDraft({ ...draft, code: e.target.value })}
                aria-required="true"
                aria-invalid={!!errors.code}
                aria-describedby={errors.code ? 'course-code-error' : undefined}
              />
              {errors.code && <FieldError id="course-code-error">{errors.code}</FieldError>}
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor="course-name">Course name *</FieldLabel>
              <Input
                id="course-name"
                placeholder="e.g., Advanced Cellular Biology"
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'course-name-error' : undefined}
              />
              {errors.name && <FieldError id="course-name-error">{errors.name}</FieldError>}
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor="course-dept">Department</FieldLabel>
              <Select value={draft.department} onValueChange={v => setDraft({ ...draft, department: v })}>
                <SelectTrigger id="course-dept" aria-label="Department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="default"
              onClick={handleSave}
            >
              Add course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function RowActions({ row, onArchive }: { row: MasterCourse; onArchive: () => void }) {
  return (
    // modal={false} — axe aria-hidden-focus fix (2026-05-11)
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${row.name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <i className="fa-regular fa-ellipsis" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem disabled={MOCK_LMS_ENABLED}>
          <i className="fa-light fa-pen" aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <i className="fa-light fa-clock-rotate-left" aria-hidden="true" />
          View history
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={onArchive}
        >
          <i className="fa-light fa-box-archive" aria-hidden="true" />
          {row.status === 'active' ? 'Archive' : 'Reactivate'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
