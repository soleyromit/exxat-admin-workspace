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

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input, InputGroup, InputGroupAddon,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldDescription,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { MOCK_ACCOMMODATIONS, type MasterAccommodation } from '@/lib/pce-mock-data'

const CATEGORIES: Array<MasterAccommodation['category']> = ['time', 'environment', 'assistive-tech', 'format', 'breaks', 'other']
const CATEGORY_LABELS: Record<MasterAccommodation['category'], string> = {
  time:             'Time',
  environment:      'Environment',
  'assistive-tech': 'Assistive technology',
  format:           'Format',
  breaks:           'Breaks',
  other:            'Other',
}

export default function AccommodationsPage() {
  const [rows, setRows] = useState<MasterAccommodation[]>(MOCK_ACCOMMODATIONS)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showCustomOnly, setShowCustomOnly] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState<{ code: string; name: string; description: string; category: MasterAccommodation['category'] }>({
    code: '', name: '', description: '', category: 'time',
  })

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      if (showCustomOnly && !r.isCustom) return false
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      )
    })
  }, [rows, search, categoryFilter, showCustomOnly])

  const standardCount = rows.filter(r => !r.isCustom && r.status === 'active').length
  const customCount = rows.filter(r => r.isCustom && r.status === 'active').length

  function handleSave() {
    if (!draft.code.trim() || !draft.name.trim()) return
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
    setAddOpen(false)
  }

  function handleArchive(id: string) {
    setRows(rows.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'archived' : 'active' } : r))
  }

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold flex-1 truncate">Accommodations</span>
        <Badge variant="outline" className="text-[10px]">Cross-product · ADR-006</Badge>
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground max-w-2xl">
              Master catalog. {standardCount} standard + {customCount} custom. Per workspace ADR-006, this list is shared across modules — Exam Mgmt, PCE, and future products consume the same catalog. Faculty consume a read-only filtered view per course; never CRUD.
            </p>
            <Link href="/admin/students" className="text-xs text-muted-foreground underline shrink-0">
              View per-student assignments →
            </Link>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <InputGroup className="flex-1 max-w-sm min-w-[180px]">
              <Input
                placeholder="Search by code, name, or description…"
                aria-label="Search accommodations"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>

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

            <Button variant="default" onClick={() => setAddOpen(true)}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add custom
            </Button>
          </div>

          {/* Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <p className="text-sm font-medium">
                          {search || categoryFilter !== 'all' || showCustomOnly
                            ? 'No accommodations match these filters'
                            : 'No accommodations yet'}
                        </p>
                        {!search && categoryFilter === 'all' && !showCustomOnly && (
                          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                            <i className="fa-light fa-plus" aria-hidden="true" />
                            Add your first custom accommodation
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(row => (
                    <TableRow key={row.id}>
                      <TableCell><span className="font-mono text-xs font-semibold">{row.code}</span></TableCell>
                      <TableCell><span className="text-sm font-medium">{row.name}</span></TableCell>
                      <TableCell><span className="text-xs text-muted-foreground capitalize">{CATEGORY_LABELS[row.category]}</span></TableCell>
                      <TableCell><span className="text-xs text-muted-foreground truncate max-w-md block">{row.description}</span></TableCell>
                      <TableCell>
                        <Badge variant={row.isCustom ? 'secondary' : 'outline'} className="text-[10px]">
                          {row.isCustom ? 'Custom' : 'Standard'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'active' ? 'secondary' : 'outline'} className="capitalize">
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name}`}>
                              <i className="fa-regular fa-ellipsis" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem disabled={!row.isCustom}>
                              <i className="fa-light fa-pen" aria-hidden="true" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <i className="fa-light fa-users" aria-hidden="true" />
                              View students assigned
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => handleArchive(row.id)}>
                              <i className="fa-light fa-box-archive" aria-hidden="true" />
                              {row.status === 'active' ? 'Archive' : 'Reactivate'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
            Standard accommodations cannot be edited (only archived). Custom accommodations are school-defined and editable. Per ADR-006, this catalog is consumed by Exam Mgmt + PCE today; Patient Log + Skills Checklist + Learning Contracts will inherit it.
          </p>

        </div>
      </main>

      {/* Add custom accommodation dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add custom accommodation</DialogTitle>
            <DialogDescription>
              Custom accommodations are school-defined and only available to your program. Standards (e.g., +10% time, Reader) ship with the catalog and can't be edited.
            </DialogDescription>
          </DialogHeader>

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
                />
                <FieldDescription>2-6 chars; shown as a badge on rosters.</FieldDescription>
              </Field>
              <Field orientation="vertical" className="col-span-2">
                <FieldLabel htmlFor="ac-name">Name *</FieldLabel>
                <Input
                  id="ac-name"
                  placeholder="e.g., Custom — service animal"
                  value={draft.name}
                  onChange={e => setDraft({ ...draft, name: e.target.value })}
                  aria-required="true"
                />
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
            <Button
              variant="default"
              onClick={handleSave}
              disabled={!draft.code.trim() || !draft.name.trim()}
            >
              Add custom accommodation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
