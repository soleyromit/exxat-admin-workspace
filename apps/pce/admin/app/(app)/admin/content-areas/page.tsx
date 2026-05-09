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
  Button, Input, InputGroup, InputGroupAddon,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldDescription,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { MOCK_CONTENT_AREAS, type ContentArea } from '@/lib/pce-mock-data'

export default function ContentAreasPage() {
  const [rows, setRows] = useState<ContentArea[]>(MOCK_CONTENT_AREAS)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', description: '', parentId: 'none' })

  // Lookup parent name for child rows
  const byId = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    )
  }, [rows, search])

  // Top-level only options for parent selection (no nesting beyond 1 level)
  const topLevel = useMemo(() => rows.filter(r => !r.parentId && r.status === 'active'), [rows])

  function handleSave() {
    if (!draft.name.trim()) return
    const newRow: ContentArea = {
      id: `ca${Date.now()}`,
      name: draft.name.trim(),
      description: draft.description.trim(),
      parentId: draft.parentId === 'none' ? undefined : draft.parentId,
      status: 'active',
    }
    setRows([newRow, ...rows])
    setDraft({ name: '', description: '', parentId: 'none' })
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
        <span className="text-sm font-semibold flex-1 truncate">Content Areas</span>
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <p className="text-sm text-muted-foreground max-w-2xl">
            Topic taxonomy at program level. Questions tag 1-to-many; courses map to subsets. Phase 1 supports 1 level of nesting (parent → child) per the workspace tagging architecture. Same shape applies to Competencies (entity #8) and Standards (entity #9).
          </p>

          <div className="flex items-center gap-2">
            <InputGroup className="flex-1 max-w-sm">
              <Input
                placeholder="Search by name or description…"
                aria-label="Search content areas"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>
            <Button variant="default" onClick={() => setAddOpen(true)}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add content area
            </Button>
            <Button variant="outline">
              <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
              Import CSV
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <p className="text-sm font-medium">
                          {search ? `No content areas match "${search}"` : 'No content areas yet'}
                        </p>
                        {!search && (
                          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                            <i className="fa-light fa-plus" aria-hidden="true" />
                            Add your first content area
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(row => {
                    const parent = row.parentId ? byId.get(row.parentId) : null
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {parent && <i className="fa-light fa-arrow-turn-down-right text-xs text-muted-foreground" aria-hidden="true" />}
                            <span className="text-sm font-medium">{row.name}</span>
                          </div>
                        </TableCell>
                        <TableCell><span className="text-xs text-muted-foreground">{row.description}</span></TableCell>
                        <TableCell>
                          {parent ? (
                            <span className="text-xs text-muted-foreground">{parent.name}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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
                                onClick={() => handleArchive(row.id)}
                              >
                                <i className="fa-light fa-box-archive" aria-hidden="true" />
                                {row.status === 'active' ? 'Archive' : 'Reactivate'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

        </div>
      </main>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
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
              />
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
              <FieldDescription>Phase 1 supports 1 level of nesting; deeper hierarchies deferred.</FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="default" onClick={handleSave} disabled={!draft.name.trim()}>
              Add content area
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
