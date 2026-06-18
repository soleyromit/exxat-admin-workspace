'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button,
  Input,
  Tooltip, TooltipContent, TooltipTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldDescription, FieldError,
  LocalBanner,
  DatePickerField,
  ToggleSwitch,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'

function ymdToDate(ymd: string): Date | undefined {
  if (!ymd) return undefined
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
  enabledForEval: boolean
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
      enabledForEval: r.enabledForEval,
    })),
    [rows]
  )

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
      enabledForEval: false,
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

  function handleToggleEval(id: string) {
    setRows(rows.map(r => r.id === id ? { ...r, enabledForEval: !r.enabledForEval } : r))
  }

  const enabledCount = rows.filter(r => r.enabledForEval).length

  const columns: ColumnDef<TermRow>[] = [
    {
      key: 'name',
      label: 'Term',
      sortable: true,
      width: 180,
      cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
    },
    {
      key: 'academicYear',
      label: 'Academic year',
      sortable: true,
      width: 150,
      cell: (row) => <span className="text-sm text-muted-foreground">{row.academicYear}</span>,
    },
    {
      key: 'startDate',
      label: 'Start',
      sortable: true,
      width: 130,
      cell: (row) => <span className="text-xs tabular-nums text-muted-foreground">{row.startDate}</span>,
    },
    {
      key: 'endDate',
      label: 'End',
      sortable: true,
      width: 130,
      cell: (row) => <span className="text-xs tabular-nums text-muted-foreground">{row.endDate}</span>,
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
      key: 'enabledForEval',
      label: 'Enable for evaluation',
      sortable: false,
      width: 180,
      header: () => (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1 cursor-help">
              Enable for evaluation
              <i className="fa-light fa-circle-info text-xs text-muted-foreground" aria-hidden="true" />
            </span>
          </TooltipTrigger>
          <TooltipContent style={{ maxWidth: 240 }}>
            Only enabled terms appear in the Activation wizard and analytics dropdowns.
            Set end dates before enabling — reminders anchor to the term end date.
          </TooltipContent>
        </Tooltip>
      ),
      cell: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <ToggleSwitch
            id={`eval-toggle-${row.id}`}
            checked={row.enabledForEval}
            onChange={() => handleToggleEval(row.id)}
          />
        </div>
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
      <SiteHeader title="Terms" />
      <div className="flex items-center gap-3 shrink-0" style={{ padding: '14px 28px 14px' }}>
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Terms</h1>
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <div className="flex items-center gap-2 justify-between flex-wrap">
            <p className="text-sm text-muted-foreground">
              {rows.length} term{rows.length !== 1 ? 's' : ''} · {enabledCount} enabled for evaluation.
              Enable a term so it appears in the Activation wizard — reminders anchor to its end date.
            </p>
            <div className="flex items-center gap-2">
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
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6">
                <i className="fa-light fa-calendar-days text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm font-medium">
                  {rows.length === 0 ? 'No terms yet' : 'No terms match your search'}
                </p>
                <p className="text-xs text-muted-foreground" style={{ maxWidth: 320 }}>
                  {rows.length === 0
                    ? (MOCK_LMS_ENABLED ? 'Terms sync from your LMS — none have synced yet.' : 'Add a term to anchor course offerings to an academic calendar.')
                    : 'Try a different name or clear the search.'}
                </p>
              </div>
            }
            toolbarSlot={() => null}
          />

          {!MOCK_LMS_ENABLED && (
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
              LMS integration is off. This list is managed manually.
            </p>
          )}

        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add term</DialogTitle>
            <DialogDescription>
              Set start and end dates — the end date anchors all reminder schedules for this term.
              Toggle "Enable for evaluation" after saving to include it in the Activation wizard.
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
