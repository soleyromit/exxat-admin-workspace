'use client'

/**
 * Admin · Content Areas (UC-19, workspace ADR-001 entity #7).
 *
 * Topic taxonomy at program level. Questions tag 1-to-many to content areas.
 * Reusable shape for Competencies + Standards (entities #8 + #9) — same
 * tree-of-tags pattern, different label.
 *
 * Per Aarti 2026-05-07 (`fb9e76c2`): tagging mechanism is Gmail-style
 * nested labels (workspace tagging architecture decision). Phase 1 supports
 * one level of nesting (parent → child); deeper nesting deferred.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldDescription, FieldError,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { MOCK_CONTENT_AREAS, type ContentArea } from '@/lib/pce-mock-data'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'

interface ContentAreaRow extends Record<string, unknown> {
  id: string
  name: string
  description: string
  parentName: string
  hasParent: boolean
  status: ContentArea['status']
  raw: ContentArea
}

export default function ContentAreasPage() {
  const [rows, setRows] = useState<ContentArea[]>(MOCK_CONTENT_AREAS)
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', description: '', parentId: 'none' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Lookup parent name for child rows
  const byId = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows])

  // Top-level only options for parent selection (no nesting beyond 1 level)
  const topLevel = useMemo(() => rows.filter(r => !r.parentId && r.status === 'active'), [rows])

  const tableRows: ContentAreaRow[] = rows.map(r => {
    const parent = r.parentId ? byId.get(r.parentId) : null
    return {
      id: r.id,
      name: r.name,
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
    else if (rows.some(r => r.name.toLowerCase() === trimmed.toLowerCase())) {
      next.name = 'A content area with this name already exists.'
    }
    return next
  }

  function handleSave() {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    const newRow: ContentArea = {
      id: `ca${Date.now()}`,
      name: draft.name.trim(),
      description: draft.description.trim(),
      parentId: draft.parentId === 'none' ? undefined : draft.parentId,
      status: 'active',
    }
    setRows([newRow, ...rows])
    setDraft({ name: '', description: '', parentId: 'none' })
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

  const columns: ColumnDef<ContentAreaRow>[] = [
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
      key: 'description',
      label: 'Description',
      sortable: true,
      cell: (row) => <span className="text-xs text-muted-foreground">{row.description}</span>,
    },
    {
      key: 'parentName',
      label: 'Parent',
      sortable: true,
      width: 200,
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
        <Badge variant={row.status === 'active' ? 'secondary' : 'outline'} className="capitalize">
          {row.status}
        </Badge>
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
      <SiteHeader title="Content Areas" />
      <div className="flex items-center gap-3 border-b border-border shrink-0" style={{ padding: '14px 28px 14px' }}>
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <h1 className="text-sm font-semibold flex-1 truncate">Content Areas</h1>
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <p className="text-sm text-muted-foreground max-w-2xl">
            Topic taxonomy at program level. Questions can be tagged to one or more content areas; courses map to subsets. Supports one level of nesting (parent → child).
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1" />
            <Button variant="default" onClick={() => setAddOpen(true)}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add content area
            </Button>
            <Button variant="outline">
              <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
              Import CSV
            </Button>
          </div>

          {tableRows.length === 0 ? (
            <div className="border border-border rounded-lg flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-sm font-medium">No content areas yet</p>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add your first content area
              </Button>
            </div>
          ) : (
            <DataTable<ContentAreaRow>
              data={tableRows}
              columns={columns}
              getRowId={(row) => row.id}
              selectable
              searchable
              toolbarSlot={(state) => (
                <span className="text-xs text-muted-foreground">
                  {state.rows.length} content area{state.rows.length !== 1 ? 's' : ''}
                </span>
              )}
            />
          )}

        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={handleAddOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add content area</DialogTitle>
            <DialogDescription>
              Topic taxonomy entry. Questions tag 1-to-many to content areas; courses map to subsets.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field orientation="vertical">
              <FieldLabel htmlFor="ca-name">Name *</FieldLabel>
              <Input
                id="ca-name"
                placeholder="e.g., Pediatric Care"
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'ca-name-error' : undefined}
              />
              {errors.name && <FieldError id="ca-name-error">{errors.name}</FieldError>}
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor="ca-desc">Description</FieldLabel>
              <Input
                id="ca-desc"
                placeholder="One-line description"
                value={draft.description}
                onChange={e => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor="ca-parent">Parent (optional)</FieldLabel>
              <Select value={draft.parentId} onValueChange={v => setDraft({ ...draft, parentId: v })}>
                <SelectTrigger id="ca-parent" aria-label="Parent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level)</SelectItem>
                  {topLevel.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>One level of nesting supported (parent → child).</FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="default" onClick={handleSave}>
              Add content area
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function RowActions({ row, onArchive }: { row: ContentArea; onArchive: () => void }) {
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
