'use client'

/**
 * Admin · Accommodations master catalog (UC-19, workspace ADR-001 entity #10).
 *
 * Workspace ADR-006: Accommodations are a SHARED cross-product module. This
 * is the master catalog tier (program admin-defined). The other two tiers:
 *
 *   - Per-student assignments (admin only, with documentation upload) —
 *     follow-up screen
 *   - Course-level read-only inherited view (faculty) — pattern at
 *     docs/patterns/admin/read-only-inherited-filtered-view.md, surfaced
 *     on /admin/students roster column today
 *
 * Per Aarti 2026-05-08: "A faculty cannot decide whether this student gets
 * this accommodation or not. At the higher level, that decision is made."
 * Faculty NEVER CRUD here.
 *
 * NEVER LMS-synced — accommodations are school-policy decisions backed by
 * Student Services documentation, not LMS data.
 */

import { useState } from 'react'
import Link from 'next/link'
import {
  Button, Input,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldDescription, FieldError,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, LocalBanner,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { MOCK_ACCOMMODATIONS, type MasterAccommodation } from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { RowActions } from '@/components/data-table/row-actions'

const CATEGORIES: Array<MasterAccommodation['category']> = ['time', 'environment', 'assistive-tech', 'format', 'breaks', 'other']
const CATEGORY_LABELS: Record<MasterAccommodation['category'], string> = {
  time:             'Time',
  environment:      'Environment',
  'assistive-tech': 'Assistive technology',
  format:           'Format',
  breaks:           'Breaks',
  other:            'Other',
}

/* Flat row — sortable scalars hoisted onto row so DataTable sortKey works. */
interface AccommodationRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  category: MasterAccommodation['category']
  categoryLabel: string
  description: string
  isCustom: boolean
  typeLabel: string
  status: MasterAccommodation['status']
  raw: MasterAccommodation
}

export default function AccommodationsPage() {
  const [rows, setRows] = useState<MasterAccommodation[]>(MOCK_ACCOMMODATIONS)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showCustomOnly, setShowCustomOnly] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState<{ code: string; name: string; description: string; category: MasterAccommodation['category'] }>({
    code: '', name: '', description: '', category: 'time',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // External hard-filters (category, custom-only). Built-in DataTable search
  // handles free-text. We pre-filter rows before passing to DataTable.
  const filteredRows = rows.filter(r => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
    if (showCustomOnly && !r.isCustom) return false
    return true
  })

  const standardCount = rows.filter(r => !r.isCustom && r.status === 'active').length
  const customCount = rows.filter(r => r.isCustom && r.status === 'active').length

  const tableRows: AccommodationRow[] = filteredRows.map(r => ({
    id: r.id,
    code: r.code,
    name: r.name,
    category: r.category,
    categoryLabel: CATEGORY_LABELS[r.category],
    description: r.description,
    isCustom: r.isCustom,
    typeLabel: r.isCustom ? 'Custom' : 'Standard',
    status: r.status,
    raw: r,
  }))

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    const trimmedCode = draft.code.trim().toUpperCase()
    if (!trimmedCode) next.code = 'Code is required.'
    else if (!/^[A-Z0-9]{2,6}$/.test(trimmedCode)) {
      next.code = 'Use 2-6 letters or numbers (e.g., CST or A11Y).'
    } else if (rows.some(r => r.code.toUpperCase() === trimmedCode)) {
      next.code = 'An accommodation with this code already exists.'
    }
    if (!draft.name.trim()) next.name = 'Name is required.'
    return next
  }

  function handleSave() {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    const newRow: MasterAccommodation = {
      id: `ac${Date.now()}`,
      code: draft.code.trim().toUpperCase(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      category: draft.category,
      isCustom: true,  // user-added are always custom
      status: 'active',
    }
    setRows([newRow, ...rows])
    setDraft({ code: '', name: '', description: '', category: 'time' })
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

  const columns: ColumnDef<AccommodationRow>[] = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      width: 100,
      cell: (row) => <span className="font-mono text-xs font-semibold">{row.code}</span>,
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: 220,
      cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
    },
    {
      key: 'categoryLabel',
      label: 'Category',
      sortable: true,
      width: 160,
      cell: (row) => <span className="text-xs text-muted-foreground capitalize">{row.categoryLabel}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      cell: (row) => <span className="text-xs text-muted-foreground truncate max-w-md block">{row.description}</span>,
    },
    {
      key: 'typeLabel',
      label: 'Type',
      sortable: true,
      width: 110,
      cell: (row) => (
        <Badge variant={row.isCustom ? 'secondary' : 'outline'} className="text-[10px]">
          {row.typeLabel}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 110,
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'secondary' : 'outline'} className="capitalize">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 44,
      cell: (row) => (
        <RowActions
          row={row.raw}
          label={row.raw.name}
          actions={[
            { label: 'Edit',                   icon: 'fa-pen',           disabled: !row.raw.isCustom },
            { label: 'View students assigned', icon: 'fa-users'         },
            {
              label: row.raw.status === 'active' ? 'Archive' : 'Reactivate',
              icon: 'fa-box-archive',
              variant: 'destructive',
              divider: true,
              onClick: () => handleArchive(row.raw.id),
            },
          ]}
        />
      ),
    },
  ]

  const hasFilters = categoryFilter !== 'all' || showCustomOnly

  return (
    <>
      <SiteHeader title="Accommodations" />
      <div className="flex items-center gap-3 border-b border-border shrink-0" style={{ padding: '14px 28px 14px' }}>
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Accommodations</h1>
        <Badge variant="outline" className="text-[10px]">Shared across modules</Badge>
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground max-w-2xl">
              Master catalog. {standardCount} standard + {customCount} custom. This list is shared across modules — all products use the same catalog. Faculty have a read-only view per course.
            </p>
            <Link href="/admin/students" className="text-xs text-muted-foreground underline shrink-0">
              View per-student assignments →
            </Link>
          </div>

          {/* External hard-filters live outside the table; DataTable's
              built-in search/properties toolbar renders below. */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-44 text-sm" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
              </SelectContent>
            </Select>

            <Button
              variant={showCustomOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowCustomOnly(!showCustomOnly)}
              aria-pressed={showCustomOnly}
            >
              <i className="fa-light fa-stamp" aria-hidden="true" />
              Custom only
            </Button>

            <div className="flex-1" />

            <Button variant="default" onClick={() => setAddOpen(true)}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add custom
            </Button>
          </div>

          {tableRows.length === 0 ? (
            <div className="border border-border rounded-lg flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-sm font-medium">
                {hasFilters ? 'No accommodations match these filters' : 'No accommodations yet'}
              </p>
              {!hasFilters && (
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                  <i className="fa-light fa-plus" aria-hidden="true" />
                  Add your first custom accommodation
                </Button>
              )}
            </div>
          ) : (
            <DataTable<AccommodationRow>
              data={tableRows}
              columns={columns}
              getRowId={(row) => row.id}
              selectable
              searchable
              toolbarSlot={(state) => (
                <span className="text-xs text-muted-foreground">
                  {state.rows.length} accommodation{state.rows.length !== 1 ? 's' : ''}
                </span>
              )}
            />
          )}

          <p className="text-xs text-muted-foreground">
            <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
            Standard accommodations cannot be edited, only archived. Custom accommodations are school-defined and editable. This catalog is shared across all modules.
          </p>

        </div>
      </div>

      {/* Add custom accommodation dialog */}
      <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add custom accommodation</DialogTitle>
            <DialogDescription>
              Custom accommodations are school-defined and only available to your program. Standards (e.g., +10% time, Reader) ship with the catalog and can&apos;t be edited.
            </DialogDescription>
          </DialogHeader>

          {Object.keys(errors).length > 1 && (
            <LocalBanner variant="error" title="Fix the following before saving">
              {Object.keys(errors).length} fields need attention.
            </LocalBanner>
          )}

          <FieldGroup>
            <div className="grid grid-cols-3 gap-3">
              <Field orientation="vertical">
                <FieldLabel htmlFor="ac-code">Code *</FieldLabel>
                <Input
                  id="ac-code"
                  placeholder="e.g., CST"
                  value={draft.code}
                  onChange={e => setDraft({ ...draft, code: e.target.value })}
                  aria-required="true"
                  maxLength={6}
                  aria-invalid={!!errors.code}
                  aria-describedby={errors.code ? 'ac-code-error' : 'ac-code-desc'}
                />
                {errors.code ? (
                  <FieldError id="ac-code-error">{errors.code}</FieldError>
                ) : (
                  <FieldDescription id="ac-code-desc">2-6 chars; shown as a badge on rosters. Must be unique.</FieldDescription>
                )}
              </Field>
              <Field orientation="vertical" className="col-span-2">
                <FieldLabel htmlFor="ac-name">Name *</FieldLabel>
                <Input
                  id="ac-name"
                  placeholder="e.g., Custom — service animal"
                  value={draft.name}
                  onChange={e => setDraft({ ...draft, name: e.target.value })}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'ac-name-error' : undefined}
                />
                {errors.name && <FieldError id="ac-name-error">{errors.name}</FieldError>}
              </Field>
            </div>

            <Field orientation="vertical">
              <FieldLabel htmlFor="ac-category">Category</FieldLabel>
              <Select
                value={draft.category}
                onValueChange={(v) => setDraft({ ...draft, category: v as MasterAccommodation['category'] })}
              >
                <SelectTrigger id="ac-category" aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <Field orientation="vertical">
              <FieldLabel htmlFor="ac-desc">Description</FieldLabel>
              <Input
                id="ac-desc"
                placeholder="One-line description shown on tooltips"
                value={draft.description}
                onChange={e => setDraft({ ...draft, description: e.target.value })}
              />
              <FieldDescription>Faculty see this on tooltip hover when reviewing student rosters.</FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="default" onClick={handleSave}>
              Add custom accommodation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

