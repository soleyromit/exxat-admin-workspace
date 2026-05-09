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
  Button, Input, InputGroup, InputGroupAddon,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldDescription,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import { MOCK_STANDARDS, type Standard } from '@/lib/pce-mock-data'

const STANDARD_SOURCES = ['CAPTE', 'ARC-PA', 'ASHA', 'NCLEX', 'NAPLEX', 'COCA', 'LCME', 'Custom']

export default function StandardsPage() {
  const [rows, setRows] = useState<Standard[]>(MOCK_STANDARDS)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', code: '', source: 'CAPTE', description: '' })

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      )
    })
  }, [rows, search, sourceFilter])

  // Sources represented in the current data, for the filter dropdown
  const sourcesPresent = useMemo(() => Array.from(new Set(rows.map(r => r.source))).sort(), [rows])

  function handleSave() {
    if (!draft.name.trim() || !draft.code.trim()) return
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
        <span className="text-sm font-semibold flex-1 truncate">Standards</span>
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <p className="text-sm text-muted-foreground max-w-2xl">
            Accreditation requirements (CAPTE, ARC-PA, ASHA, NCLEX, etc.). Pre-loaded blueprints power Comp Genie-style AI gap analysis (Aarti 16:09 D8) — works without curriculum uploads.
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <InputGroup className="flex-1 max-w-sm min-w-[180px]">
              <Input
                placeholder="Search by name, code, description…"
                aria-label="Search standards"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-8 w-32 text-sm" aria-label="Filter by source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {sourcesPresent.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="default" onClick={() => setAddOpen(true)}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add standard
            </Button>
            <Button variant="outline">
              <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
              Import blueprint
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <p className="text-sm font-medium">
                          {search || sourceFilter !== 'all' ? 'No standards match these filters' : 'No standards yet'}
                        </p>
                        {!search && sourceFilter === 'all' && (
                          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                            <i className="fa-light fa-plus" aria-hidden="true" />
                            Add your first standard
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(row => (
                    <TableRow key={row.id}>
                      <TableCell><span className="font-mono text-xs">{row.code}</span></TableCell>
                      <TableCell><span className="text-sm font-medium">{row.name}</span></TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-[10px]">{row.source}</Badge></TableCell>
                      <TableCell><span className="text-xs text-muted-foreground truncate max-w-md block">{row.description}</span></TableCell>
                      <TableCell><Badge variant={row.status === 'active' ? 'secondary' : 'outline'} className="capitalize">{row.status}</Badge></TableCell>
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

        </div>
      </main>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add standard</DialogTitle>
            <DialogDescription>Accreditation requirement from a published blueprint or custom-defined.</DialogDescription>
          </DialogHeader>
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
                <Input id="st-code" placeholder="e.g., CAPTE 2C-1" value={draft.code} onChange={e => setDraft({ ...draft, code: e.target.value })} aria-required="true" />
              </Field>
            </div>
            <Field orientation="vertical">
              <FieldLabel htmlFor="st-name">Name *</FieldLabel>
              <Input id="st-name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} aria-required="true" />
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor="st-desc">Description</FieldLabel>
              <Input id="st-desc" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="default" onClick={handleSave} disabled={!draft.name.trim() || !draft.code.trim()}>Add standard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
