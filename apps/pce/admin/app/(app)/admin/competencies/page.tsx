'use client'

/**
 * Admin · Competencies (UC-19, workspace ADR-001 entity #8).
 *
 * Per Aarti 2026-05-08: program-level outcome capabilities. Questions tag
 * 1-to-many. Same Gmail-style nested-label shape as Content Areas / Standards.
 *
 * Per Aarti 2026-05-08 16:09: PCE/CFE does NOT student-rate competencies
 * (competencies are outcomes, not student-rated) — they're for Exam Mgmt
 * gap analysis only.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldDescription, FieldError,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, LocalBanner,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { MOCK_COMPETENCIES, type Competency } from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'

const COMPETENCY_SOURCES = ['IOM', 'NLN', 'AACN', 'CAPTE', 'NCLEX', 'ARC-PA', 'ASHA', 'Custom']

/* Flat row — parent name + indent flag denormalized so sortKey works. */
interface CompetencyRow extends Record<string, unknown> {
  id: string
  name: string
  source: string
  description: string
  parentName: string
  hasParent: boolean
  status: Competency['status']
  raw: Competency
}

export default function CompetenciesPage() {
  const [rows, setRows] = useState<Competency[]>(MOCK_COMPETENCIES)
  const [sourceFilter, setSourceFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', description: '', source: 'IOM', parentId: 'none' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const byId = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows])

  const filteredRaw = rows.filter(r => {
    if (sourceFilter !== 'all' && r.source !== sourceFilter) return false
    return true
  })

  const topLevel = useMemo(() => rows.filter(r => !r.parentId && r.status === 'active'), [rows])

  const tableRows: CompetencyRow[] = filteredRaw.map(r => {
    const parent = r.parentId ? byId.get(r.parentId) : null
    return {
      id: r.id,
      name: r.name,
      source: r.source ?? '',
      description: r.description,
      parentName: parent?.name ?? '',
      hasParent: !!parent,
      status: r.status,
      raw: r,
    }
  })

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    const trimmed = draft.name.trim()
    if (!trimmed) next.name = 'Name is required.'
    else if (rows.some(r => r.name.toLowerCase() === trimmed.toLowerCase() && r.source === draft.source)) {
      next.name = `A "${draft.source}" competency with this name already exists.`
    }
    return next
  }

  function handleSave() {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    const newRow: Competency = {
      id: `cm${Date.now()}`,
      name: draft.name.trim(),
      description: draft.description.trim(),
      source: draft.source,
      parentId: draft.parentId === 'none' ? undefined : draft.parentId,
      status: 'active',
    }
    setRows([newRow, ...rows])
    setDraft({ name: '', description: '', source: 'IOM', parentId: 'none' })
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

  const columns: ColumnDef<CompetencyRow>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: 240,
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.hasParent && <i className="fa-light fa-arrow-turn-down-right text-xs text-muted-foreground" aria-hidden="true" />}
          <span className="text-sm font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      sortable: true,
      width: 110,
      cell: (row) => row.source ? (
        <Badge variant="outline" className="font-mono text-[10px]">{row.source}</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      cell: (row) => <span className="text-xs text-muted-foreground truncate max-w-md block">{row.description}</span>,
    },
    {
      key: 'parentName',
      label: 'Parent',
      sortable: true,
      width: 180,
      cell: (row) => row.parentName ? (
        <span className="text-xs text-muted-foreground">{row.parentName}</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 110,
      cell: (row) => (
        <Badge variant={row.status === 'active' ? 'secondary' : 'outline'} className="capitalize">{row.status}</Badge>
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
      <SiteHeader title="Competencies" />
      <div className="flex items-center gap-3 border-b border-border shrink-0" style={{ padding: '14px 28px 14px' }}>
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Competencies</h1>
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <p className="text-sm text-muted-foreground max-w-2xl">
            Program-level outcome capabilities. Sourced from accreditation bodies (IOM, NLN, AACN, CAPTE, NCLEX) or custom-defined. Questions tag 1-to-many; courses map to subsets.
          </p>

          {/* External hard-filters + CRUD actions live above the table.
              Built-in search/properties toolbar renders below. */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-8 w-44 text-sm" aria-label="Filter by source">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {COMPETENCY_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <Button variant="default" onClick={() => setAddOpen(true)}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add competency
            </Button>
            <Button variant="outline">
              <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
              Import CSV
            </Button>
          </div>

          {tableRows.length === 0 ? (
            <div className="border border-border rounded-lg flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-sm font-medium">
                {sourceFilter !== 'all' ? 'No competencies match this filter' : 'No competencies yet'}
              </p>
              {sourceFilter === 'all' && (
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                  <i className="fa-light fa-plus" aria-hidden="true" />
                  Add your first competency
                </Button>
              )}
            </div>
          ) : (
            <DataTable<CompetencyRow>
              data={tableRows}
              columns={columns}
              getRowId={(row) => row.id}
              selectable
              searchable
              toolbarSlot={(state) => (
                <span className="text-xs text-muted-foreground">
                  {state.rows.length} competenc{state.rows.length !== 1 ? 'ies' : 'y'}
                </span>
              )}
            />
          )}

        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add competency</DialogTitle>
            <DialogDescription>Outcome capability mapped to questions and courses.</DialogDescription>
          </DialogHeader>
          {Object.keys(errors).length > 1 && (
            <LocalBanner variant="error" title="Fix the following before saving">
              {Object.keys(errors).length} fields need attention.
            </LocalBanner>
          )}
          <FieldGroup>
            <Field orientation="vertical">
              <FieldLabel htmlFor="cm-name">Name *</FieldLabel>
              <Input
                id="cm-name"
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'cm-name-error' : undefined}
              />
              {errors.name && <FieldError id="cm-name-error">{errors.name}</FieldError>}
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor="cm-source">Source</FieldLabel>
              <Select value={draft.source} onValueChange={v => setDraft({ ...draft, source: v })}>
                <SelectTrigger id="cm-source" aria-label="Source"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPETENCY_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <FieldDescription>Accreditation body or &quot;Custom&quot; for school-defined.</FieldDescription>
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor="cm-desc">Description</FieldLabel>
              <Input id="cm-desc" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor="cm-parent">Parent (optional)</FieldLabel>
              <Select value={draft.parentId} onValueChange={v => setDraft({ ...draft, parentId: v })}>
                <SelectTrigger id="cm-parent" aria-label="Parent"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level)</SelectItem>
                  {topLevel.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="default" onClick={handleSave}>Add competency</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function RowActions({ row, onArchive }: { row: Competency; onArchive: () => void }) {
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
        <DropdownMenuItem>
          <i className="fa-light fa-pen" aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <i className="fa-light fa-rectangle-list" aria-hidden="true" />
          View tagged questions
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onArchive}>
          <i className="fa-light fa-box-archive" aria-hidden="true" />
          {row.status === 'active' ? 'Archive' : 'Reactivate'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
