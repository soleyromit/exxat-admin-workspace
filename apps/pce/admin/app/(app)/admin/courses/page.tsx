'use client'

/**
 * Admin · Master Courses (UC-19, workspace ADR-001 entity #1).
 *
 * Per docs/patterns/admin/master-list-admin.md — uniform list shape:
 * Search · Add · Import · Table · Per-row dropdown · LMS sync footer.
 *
 * Per workspace ADR-002 (LMS-first default): Add disabled when LMS-on.
 * Mock data uses MOCK_LMS_ENABLED = false so manual CRUD is exercisable.
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
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import {
  MOCK_MASTER_COURSES, MOCK_LMS_ENABLED,
  type MasterCourse,
} from '@/lib/pce-mock-data'

const DEPARTMENTS = ['Biological Sciences', 'Nursing', 'Medicine', 'Foundations', 'Pharmacy']

export default function MasterCoursesPage() {
  // Local-state CRUD; no backend persistence — fine for prototype/Phase 1.
  const [rows, setRows] = useState<MasterCourse[]>(MOCK_MASTER_COURSES)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({ code: '', name: '', department: DEPARTMENTS[0] })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      r.code.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
    )
  }, [rows, search])

  function handleSave() {
    if (!draft.code.trim() || !draft.name.trim()) return
    const today = new Date().toISOString().slice(0, 10)
    const newRow: MasterCourse = {
      id: `mc${Date.now()}`,
      code: draft.code.trim(),
      name: draft.name.trim(),
      department: draft.department,
      status: 'active',
      lastEdited: today,
      editedBy: 'You (current user)',
    }
    setRows([newRow, ...rows])
    setDraft({ code: '', name: '', department: DEPARTMENTS[0] })
    setAddOpen(false)
  }

  function handleArchive(id: string) {
    setRows(rows.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r))
  }

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold flex-1 truncate">Master Courses</span>
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-5xl flex flex-col gap-4">

          {/* Toolbar — search + Add + Import */}
          <div className="flex items-center gap-2">
            <InputGroup className="flex-1 max-w-sm">
              <Input
                placeholder="Search by code, name, or department…"
                aria-label="Search master courses"
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
                    Add course
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Managed by your LMS</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="default" onClick={() => setAddOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add course
              </Button>
            )}

            <Button variant="outline">
              <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
              Import CSV
            </Button>
          </div>

          {/* Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last edited</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <p className="text-sm font-medium">
                          {search ? `No courses match "${search}"` : 'No master courses yet'}
                        </p>
                        {!search && !MOCK_LMS_ENABLED && (
                          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                            <i className="fa-light fa-plus" aria-hidden="true" />
                            Add your first course
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(row => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.code}</TableCell>
                      <TableCell><span className="text-sm font-medium">{row.name}</span></TableCell>
                      <TableCell><span className="text-sm text-muted-foreground">{row.department}</span></TableCell>
                      <TableCell>
                        <span className={
                          'text-xs capitalize ' +
                          (row.status === 'active' ? 'text-foreground' : 'text-muted-foreground')
                        }>
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {row.lastEdited} · {row.editedBy}
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

          {/* LMS sync indicator (footer) */}
          {MOCK_LMS_ENABLED && (
            <p className="text-xs text-muted-foreground text-right">
              Last synced 4m ago <span style={{ color: 'var(--chart-2)' }}>●</span>
            </p>
          )}
          {!MOCK_LMS_ENABLED && (
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
              LMS integration is OFF. Showing manually-managed list. Toggle in Settings (per workspace ADR-002).
            </p>
          )}

        </div>
      </main>

      {/* Add course dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add master course</DialogTitle>
            <DialogDescription>
              Master courses live at program level and are reused across terms via course offerings.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field orientation="vertical">
              <FieldLabel htmlFor="course-code">Course code *</FieldLabel>
              <Input
                id="course-code"
                placeholder="e.g., BIO 401"
                value={draft.code}
                onChange={e => setDraft({ ...draft, code: e.target.value })}
                aria-required="true"
              />
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor="course-name">Course name *</FieldLabel>
              <Input
                id="course-name"
                placeholder="e.g., Advanced Cellular Biology"
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                aria-required="true"
              />
            </Field>
            <Field orientation="vertical">
              <FieldLabel htmlFor="course-dept">Department</FieldLabel>
              <Select value={draft.department} onValueChange={v => setDraft({ ...draft, department: v })}>
                <SelectTrigger id="course-dept" aria-label="Department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
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
              Add course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
