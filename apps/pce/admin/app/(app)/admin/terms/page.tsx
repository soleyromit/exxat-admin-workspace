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
  InputGroup,
  InputGroupAddon,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Tooltip, TooltipContent, TooltipTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import {
  MOCK_PROGRAM_TERMS, MOCK_LMS_ENABLED,
  type ProgramTerm,
} from '@/lib/pce-mock-data'

export default function TermsPage() {
  const [rows, setRows] = useState<ProgramTerm[]>(MOCK_PROGRAM_TERMS)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', academicYear: '', startDate: '', endDate: '' })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.academicYear.toLowerCase().includes(q)
    )
  }, [rows, search])

  function handleSave() {
    if (!draft.name.trim() || !draft.academicYear.trim() || !draft.startDate || !draft.endDate) return
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
        <span className="text-sm font-semibold flex-1 truncate">Terms</span>
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          <div className="flex items-center gap-2">
            <InputGroup className="flex-1 max-w-sm">
              <Input
                placeholder="Search by name or academic year…"
                aria-label="Search terms"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>

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

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead>Academic year</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
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
                          {search ? `No terms match "${search}"` : 'No terms yet'}
                        </p>
                        {!search && !MOCK_LMS_ENABLED && (
                          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                            <i className="fa-light fa-plus" aria-hidden="true" />
                            Add your first term
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(row => (
                    <TableRow key={row.id}>
                      <TableCell><span className="text-sm font-medium">{row.name}</span></TableCell>
                      <TableCell><span className="text-sm text-muted-foreground">{row.academicYear}</span></TableCell>
                      <TableCell><span className="text-xs tabular-nums text-muted-foreground">{row.startDate}</span></TableCell>
                      <TableCell><span className="text-xs tabular-nums text-muted-foreground">{row.endDate}</span></TableCell>
                      <TableCell>
                        <span className={
                          'text-xs capitalize ' +
                          (row.status === 'active' ? 'text-foreground' : 'text-muted-foreground')
                        }>
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name}`}>
                              <i className="fa-regular fa-ellipsis" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
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
                              onClick={() => handleArchive(row.id)}
                            >
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

          {!MOCK_LMS_ENABLED && (
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
              LMS integration is OFF. Showing manually-managed list. Toggle in Settings (per workspace ADR-002).
            </p>
          )}

        </div>
      </main>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add term</DialogTitle>
            <DialogDescription>
              Per Aarti 2026-05-05: term + academic year are separate fields. A course offering combines a master course with a term to produce a specific instance.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field orientation="vertical">
              <FieldLabel htmlFor="term-name">Term *</FieldLabel>
              <Input
                id="term-name"
                placeholder="e.g., Spring 2027"
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                aria-required="true"
              />
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor="term-year">Academic year *</FieldLabel>
              <Input
                id="term-year"
                placeholder="e.g., 2026–2027"
                value={draft.academicYear}
                onChange={e => setDraft({ ...draft, academicYear: e.target.value })}
                aria-required="true"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field orientation="vertical">
                <FieldLabel htmlFor="term-start">Start date *</FieldLabel>
                <Input
                  id="term-start"
                  type="date"
                  value={draft.startDate}
                  onChange={e => setDraft({ ...draft, startDate: e.target.value })}
                  aria-required="true"
                />
              </Field>
              <Field orientation="vertical">
                <FieldLabel htmlFor="term-end">End date *</FieldLabel>
                <Input
                  id="term-end"
                  type="date"
                  value={draft.endDate}
                  onChange={e => setDraft({ ...draft, endDate: e.target.value })}
                  aria-required="true"
                />
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={!draft.name.trim() || !draft.academicYear.trim() || !draft.startDate || !draft.endDate}
            >
              Add term
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
