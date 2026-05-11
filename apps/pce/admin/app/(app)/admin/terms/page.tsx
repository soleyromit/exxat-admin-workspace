'use client'

/**
 * Admin · Terms (UC-19, workspace ADR-001 entity #2).
 *
 * Per Aarti 2026-05-05: term + academic year are SEPARATE Prism fields,
 * not "semester". Course offering = master course × term × cohort × faculty.
 *
 * Per docs/patterns/admin/master-list-admin.md — uniform list shape.
 * Per workspace ADR-002: Add disabled when LMS-on.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button,
  Input,
  Tooltip, TooltipContent, TooltipTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldDescription, FieldError,
  LocalBanner,
  SidebarTrigger, Separator,
  DatePickerField,
} from '@exxat/ds/packages/ui/src'

/** YYYY-MM-DD string ↔ Date helpers. Keeps mock data shape stable while DatePickerField
 *  works with native Date. Strings preserve lexicographic == chronological order for sort. */
function ymdToDate(ymd: string): Date | undefined {
  if (!ymd) return undefined
  // Parse as local date (avoid TZ shifting an interactive picker selection).
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}
function dateToYmd(d: Date | undefined): string {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
import {
  MOCK_PROGRAM_TERMS, MOCK_LMS_ENABLED,
  type ProgramTerm,
} from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { RowActions } from '@/components/data-table/row-actions'

interface TermRow extends Record<string, unknown> {
  id: string
  name: string
  academicYear: string
  startDate: string
  endDate: string
  status: ProgramTerm['status']
}

export default function TermsPage() {
  const [rows, setRows] = useState<ProgramTerm[]>(MOCK_PROGRAM_TERMS)
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', academicYear: '', startDate: '', endDate: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const tableRows: TermRow[] = useMemo(
    () => rows.map(r => ({
      id: r.id,
      name: r.name,
      academicYear: r.academicYear,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
    })),
    [rows]
  )

  // Group by academic year — most-recent first.
  const groupOrder = useMemo(
    () => Array.from(new Set(rows.map(r => r.academicYear))).sort().reverse(),
    [rows]
  )
  const groupLabels = useMemo(
    () => Object.fromEntries(groupOrder.map(y => [y, y])),
    [groupOrder]
  )

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    if (!draft.name.trim()) next.name = 'Term name is required.'
    if (!draft.academicYear.trim()) next.academicYear = 'Academic year is required.'
    else if (!/^\d{4}\s*[–-]\s*\d{4}$/.test(draft.academicYear.trim())) {
      next.academicYear = 'Use the format YYYY–YYYY (e.g., 2026–2027).'
    }
    if (!draft.startDate) next.startDate = 'Start date is required.'
    if (!draft.endDate) next.endDate = 'End date is required.'
    if (draft.startDate && draft.endDate && draft.startDate >= draft.endDate) {
      next.endDate = 'End date must come after start date.'
    }
    return next
  }

  function handleSave() {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    const newRow: ProgramTerm = {
      id: `pt${Date.now()}`,
      name: draft.name.trim(),
      academicYear: draft.academicYear.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      status: 'active',
    }
    setRows([newRow, ...rows])
    setDraft({ name: '', academicYear: '', startDate: '', endDate: '' })
    setErrors({})
    setAddOpen(false)
  }

  function handleAddOpenChange(open: boolean) {
    setAddOpen(open)
    if (!open) setErrors({})
  }

  function handleArchive(id: string) {
    setRows(rows.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'archived' : 'active' } : r))
  }

  const columns: ColumnDef<TermRow>[] = [
    {
      key: 'name',
      label: 'Term',
      sortable: true,
      width: 200,
      cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
    },
    {
      key: 'academicYear',
      label: 'Academic year',
      sortable: true,
      width: 160,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.academicYear}</span>,
    },
    {
      key: 'startDate',
      label: 'Start',
      sortable: true,
      width: 140,
      cell: (row) => <span className="text-xs tabular-nums text-muted-foreground">{row.startDate}</span>,
    },
    {
      key: 'endDate',
      label: 'End',
      sortable: true,
      width: 140,
      cell: (row) => <span className="text-xs tabular-nums text-muted-foreground">{row.endDate}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 120,
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
      key: 'actions',
      label: '',
      width: 44,
      cell: (row) => (
        <RowActions
          row={row}
          label={row.name}
          actions={[
            { label: 'Edit',         icon: 'fa-pen',               disabled: MOCK_LMS_ENABLED },
            { label: 'View history', icon: 'fa-clock-rotate-left' },
            {
              label: row.status === 'active' ? 'Archive' : 'Reactivate',
              icon: 'fa-box-archive',
              variant: 'destructive',
              divider: true,
              onClick: () => handleArchive(row.id),
            },
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
        <h1 className="text-sm font-semibold flex-1 truncate">Terms</h1>
      </header>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          {/* Toolbar: Add + Import. Search is provided by DataTable. */}
          <div className="flex items-center gap-2 justify-end">
            {MOCK_LMS_ENABLED ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" disabled aria-disabled="true">
                    <i className="fa-light fa-plus" aria-hidden="true" />
                    Add term
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Managed by your LMS</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="default" onClick={() => setAddOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add term
              </Button>
            )}

            <Button variant="outline">
              <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
              Import CSV
            </Button>
          </div>

          <DataTable<TermRow>
            data={tableRows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable
            searchable
            defaultGroupBy="academicYear"
            groupLabels={groupLabels}
            groupOrder={groupOrder}
          />

          {!MOCK_LMS_ENABLED && (
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
              LMS integration is OFF. Showing manually-managed list. Toggle in Settings (per workspace ADR-002).
            </p>
          )}

        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add term</DialogTitle>
            <DialogDescription>
              Per Aarti 2026-05-05: term + academic year are separate fields. A course offering combines a master course with a term to produce a specific instance.
            </DialogDescription>
          </DialogHeader>

          {Object.keys(errors).length > 1 && (
            <LocalBanner variant="error" title="Fix the following before saving">
              {Object.keys(errors).length} fields need attention.
            </LocalBanner>
          )}

          <FieldGroup>
            <Field orientation="vertical">
              <FieldLabel htmlFor="term-name">Term *</FieldLabel>
              <Input
                id="term-name"
                placeholder="e.g., Spring 2027"
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'term-name-error' : undefined}
              />
              {errors.name && <FieldError id="term-name-error">{errors.name}</FieldError>}
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor="term-year">Academic year *</FieldLabel>
              <Input
                id="term-year"
                placeholder="e.g., 2026–2027"
                value={draft.academicYear}
                onChange={e => setDraft({ ...draft, academicYear: e.target.value })}
                aria-required="true"
                aria-invalid={!!errors.academicYear}
                aria-describedby={errors.academicYear ? 'term-year-error' : 'term-year-desc'}
              />
              {errors.academicYear ? (
                <FieldError id="term-year-error">{errors.academicYear}</FieldError>
              ) : (
                <FieldDescription id="term-year-desc">Format: YYYY–YYYY (e.g., 2026–2027).</FieldDescription>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field orientation="vertical">
                <FieldLabel htmlFor="term-start">Start date *</FieldLabel>
                <DatePickerField
                  id="term-start"
                  value={ymdToDate(draft.startDate)}
                  onChange={d => setDraft({ ...draft, startDate: dateToYmd(d) })}
                />
                {errors.startDate && <FieldError id="term-start-error">{errors.startDate}</FieldError>}
              </Field>
              <Field orientation="vertical">
                <FieldLabel htmlFor="term-end">End date *</FieldLabel>
                <DatePickerField
                  id="term-end"
                  value={ymdToDate(draft.endDate)}
                  onChange={d => setDraft({ ...draft, endDate: dateToYmd(d) })}
                />
                {errors.endDate && <FieldError id="term-end-error">{errors.endDate}</FieldError>}
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="default" onClick={handleSave}>
              Add term
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

