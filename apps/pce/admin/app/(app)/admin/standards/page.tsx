'use client'

/**
 * Admin · Standards (UC-19, workspace ADR-001 entity #9).
 *
 * Per Aarti 2026-05-08 + 2026-05-07: program-level accreditation requirements
 * (CAPTE, ARC-PA, ASHA, NCLEX, etc.). Course objectives map TO standards;
 * questions can map either via course objective OR direct-to-standards
 * (per Aarti 16:09 D2 — two mapping pathways supported).
 *
 * Comp Genie-style AI gap analysis (D8) compares assessments against these
 * blueprints WITHOUT requiring customer to upload curriculum. Pre-loaded
 * accreditor blueprints make Phase 1 zero-friction.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldError,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, LocalBanner,
  SidebarTrigger, Separator,
} from '@exxatdesignux/ui'
import { MOCK_STANDARDS, type Standard } from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'

const STANDARD_SOURCES = ['CAPTE', 'ARC-PA', 'ASHA', 'NCLEX', 'NAPLEX', 'COCA', 'LCME', 'Custom']

interface StandardRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  source: string
  description: string
  status: Standard['status']
}

export default function StandardsPage() {
  const [rows, setRows] = useState<Standard[]>(MOCK_STANDARDS)
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', code: '', source: 'CAPTE', description: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Source filter is a hard-filter — kept outside the DataTable.
  const filtered = useMemo(
    () => sourceFilter === 'all' ? rows : rows.filter(r => r.source === sourceFilter),
    [rows, sourceFilter]
  )

  const tableRows: StandardRow[] = useMemo(
    () => filtered.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      source: r.source,
      description: r.description,
      status: r.status,
    })),
    [filtered]
  )

  // Sources represented in the current data, for the filter dropdown
  const sourcesPresent = useMemo(() => Array.from(new Set(rows.map(r => r.source))).sort(), [rows])

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    const trimmedCode = draft.code.trim()
    if (!trimmedCode) next.code = 'Code is required.'
    else if (rows.some(r => r.code.toLowerCase() === trimmedCode.toLowerCase() && r.source === draft.source)) {
      next.code = `A "${draft.source}" standard with this code already exists.`
    }
    if (!draft.name.trim()) next.name = 'Name is required.'
    return next
  }

  function handleSave() {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    const newRow: Standard = {
      id: `st${Date.now()}`,
      name: draft.name.trim(),
      code: draft.code.trim(),
      source: draft.source,
      description: draft.description.trim(),
      status: 'active',
    }
    setRows([newRow, ...rows])
    setDraft({ name: '', code: '', source: 'CAPTE', description: '' })
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

  const columns: ColumnDef<StandardRow>[] = [
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      width: 140,
      cell: (row) => <span className="font-mono text-xs">{row.code}</span>,
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      width: 240,
      cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
    },
    {
      key: 'source',
      label: 'Source',
      sortable: true,
      width: 110,
      cell: (row) => <Badge variant="outline" className="font-mono text-[10px]">{row.source}</Badge>,
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      width: 360,
      cell: (row) => <span className="text-xs text-muted-foreground truncate max-w-md block">{row.description}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 110,
      cell: (row) => <Badge variant={row.status === 'active' ? 'secondary' : 'outline'} className="capitalize">{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      width: 44,
      cell: (row) => <RowActions name={row.name} status={row.status} onArchive={() => handleArchive(row.id)} />,
    },
  ]

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Standards</h1>
      </header>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <p className="text-sm text-muted-foreground max-w-2xl">
            Accreditation requirements (CAPTE, ARC-PA, ASHA, NCLEX, etc.). Pre-loaded blueprints power AI gap analysis without requiring curriculum uploads.
          </p>

          {/* Toolbar: Source hard-filter + actions. Search is provided by DataTable. */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-8 w-32 text-sm" aria-label="Filter by source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {sourcesPresent.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button variant="default" onClick={() => setAddOpen(true)}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add standard
            </Button>
            <Button variant="outline">
              <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
              Import blueprint
            </Button>
          </div>

          <DataTable<StandardRow>
            data={tableRows}
            columns={columns}
            getRowId={(row) => row.id}
            selectable
            searchable
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6">
                <i className="fa-light fa-stamp text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                <p className="text-sm font-medium">
                  {rows.length === 0
                    ? 'No standards yet'
                    : sourceFilter !== 'all'
                      ? `No standards from ${sourceFilter}`
                      : 'No standards match your search'}
                </p>
                <p className="text-xs text-muted-foreground" style={{ maxWidth: 320 }}>
                  {rows.length === 0
                    ? 'Import an accreditation blueprint or add a standard to get started.'
                    : 'Try a different source or clear the search.'}
                </p>
              </div>
            }
            toolbarSlot={(state) => (
              <span className="text-xs text-muted-foreground">
                {state.rows.length} standard{state.rows.length !== 1 ? 's' : ''}
              </span>
            )}
          />

        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add standard</DialogTitle>
            <DialogDescription>Accreditation requirement from a published blueprint or custom-defined.</DialogDescription>
          </DialogHeader>
          {Object.keys(errors).length > 1 && (
            <LocalBanner variant="error" title="Fix the following before saving">
              {Object.keys(errors).length} fields need attention.
            </LocalBanner>
          )}
          <FieldGroup>
            <div className="grid grid-cols-3 gap-3">
              <Field orientation="vertical">
                <FieldLabel htmlFor="st-source">Source *</FieldLabel>
                <Select value={draft.source} onValueChange={v => setDraft({ ...draft, source: v })}>
                  <SelectTrigger id="st-source" aria-label="Source"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STANDARD_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field orientation="vertical" className="col-span-2">
                <FieldLabel htmlFor="st-code">Code *</FieldLabel>
                <Input
                  id="st-code"
                  placeholder="e.g., CAPTE 2C-1"
                  value={draft.code}
                  onChange={e => setDraft({ ...draft, code: e.target.value })}
                  aria-required="true"
                  aria-invalid={!!errors.code}
                  aria-describedby={errors.code ? 'st-code-error' : undefined}
                />
                {errors.code && <FieldError id="st-code-error">{errors.code}</FieldError>}
              </Field>
            </div>
            <Field orientation="vertical">
              <FieldLabel htmlFor="st-name">Name *</FieldLabel>
              <Input
                id="st-name"
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'st-name-error' : undefined}
              />
              {errors.name && <FieldError id="st-name-error">{errors.name}</FieldError>}
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor="st-desc">Description</FieldLabel>
              <Input id="st-desc" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="default" onClick={handleSave}>Add standard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function RowActions({ name, status, onArchive }: { name: string; status: Standard['status']; onArchive: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    // modal={false} — see components/data-table/row-actions.tsx: prevents
    // Radix hideOthers from setting aria-hidden on sidebar-wrapper while
    // row menu is open (axe aria-hidden-focus). Fixed 2026-05-11.
    <DropdownMenu modal={false} onOpenChange={setMenuOpen} open={menuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${name}`}
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
          {status === 'active' ? 'Archive' : 'Reactivate'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
