'use client'

/**
 * Admin · Students (UC-19, workspace ADR-001 entity #4).
 *
 * Per workspace ADR-002: students are typically LMS-synced. When LMS-on:
 * the page is read-only with a sync indicator. When LMS-off (this prototype's
 * MOCK_LMS_ENABLED state): full CRUD via Add modal + Import CSV.
 *
 * Bulk-action affordance is deferred to a Phase 2 follow-up — first ship the
 * uniform shape that matches Faculty / Courses / etc.
 *
 * Per workspace ADR-006: accommodations are admin-applied at student level
 * but maintained in a SHARED cross-product module — link out, don't manage
 * here.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Button, Input, InputGroup, InputGroupAddon,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
  Tooltip, TooltipContent, TooltipTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Field, FieldLabel, FieldGroup, FieldDescription,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, Avatar, AvatarFallback,
  SidebarTrigger, Separator,
} from '@exxat/ds/packages/ui/src'
import {
  MOCK_STUDENTS, MOCK_COHORTS, MOCK_LMS_ENABLED,
  type Student,
} from '@/lib/pce-mock-data'

const STATUSES = ['enrolled', 'graduated', 'withdrawn', 'on-leave'] as const

function statusBadgeVariant(s: Student['enrollmentStatus']): 'secondary' | 'outline' | 'destructive' {
  if (s === 'enrolled') return 'secondary'
  if (s === 'graduated') return 'outline'
  if (s === 'on-leave') return 'outline'
  // 'withdrawn' uses outline (NOT destructive — DS-005 / no-red-in-status per VIZ-004 spirit)
  return 'outline'
}

function initials(first: string, last: string): string {
  return (first.charAt(0) + last.charAt(0)).toUpperCase()
}

export default function StudentsPage() {
  const [rows, setRows] = useState<Student[]>(MOCK_STUDENTS)
  const [search, setSearch] = useState('')
  const [cohortFilter, setCohortFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    cohort: MOCK_COHORTS[0],
  })

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (cohortFilter !== 'all' && r.cohort !== cohortFilter) return false
      if (statusFilter !== 'all' && r.enrollmentStatus !== statusFilter) return false
      const q = search.trim().toLowerCase()
      if (!q) return true
      return (
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.studentId.toLowerCase().includes(q)
      )
    })
  }, [rows, search, cohortFilter, statusFilter])

  function handleSave() {
    if (!draft.studentId.trim() || !draft.firstName.trim() || !draft.lastName.trim() || !draft.email.trim()) return
    const today = new Date().toISOString().slice(0, 10)
    const newRow: Student = {
      id: `st${Date.now()}`,
      studentId: draft.studentId.trim(),
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim(),
      cohort: draft.cohort,
      enrollmentStatus: 'enrolled',
      enrolledAt: today,
    }
    setRows([newRow, ...rows])
    setDraft({ studentId: '', firstName: '', lastName: '', email: '', cohort: MOCK_COHORTS[0] })
    setAddOpen(false)
  }

  function handleStatusChange(id: string, next: Student['enrollmentStatus']) {
    setRows(rows.map(r => r.id === id ? { ...r, enrollmentStatus: next } : r))
  }

  // Counts for the LMS-state header line
  const enrolledCount = rows.filter(r => r.enrollmentStatus === 'enrolled').length
  const accommodationsCount = rows.filter(r => r.hasAccommodations).length

  return (
    <>
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/admin" className="text-sm text-muted-foreground">Admin</Link>
        <i className="fa-light fa-chevron-right text-xs text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-semibold flex-1 truncate">Students</span>
      </header>

      <main className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
        <div className="max-w-6xl flex flex-col gap-4">

          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground max-w-2xl">
              {enrolledCount} enrolled · {rows.length} total · {accommodationsCount} with accommodations.
              Per workspace ADR-002, students are typically LMS-synced; this prototype runs LMS-{MOCK_LMS_ENABLED ? 'on' : 'off'}.
            </p>
            <Link href="#" className="text-xs text-muted-foreground underline">
              Manage accommodations (cross-product) →
            </Link>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <InputGroup className="flex-1 max-w-sm min-w-[200px]">
              <Input
                placeholder="Search by name, email, or student ID…"
                aria-label="Search students"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>

            <Select value={cohortFilter} onValueChange={setCohortFilter}>
              <SelectTrigger className="h-8 w-44 text-sm" aria-label="Filter by cohort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cohorts</SelectItem>
                {MOCK_COHORTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                <SelectItem value="Class of 2025">Class of 2025</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>

            {MOCK_LMS_ENABLED ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" disabled aria-disabled="true">
                    <i className="fa-light fa-plus" aria-hidden="true" />
                    Add student
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Managed by your LMS — students sync automatically</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="default" onClick={() => setAddOpen(true)}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add student
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
                  <TableHead>Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cohort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Accommodations</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <p className="text-sm font-medium">
                          {search || cohortFilter !== 'all' || statusFilter !== 'all'
                            ? 'No students match these filters'
                            : 'No students yet'}
                        </p>
                        {!search && cohortFilter === 'all' && statusFilter === 'all' && !MOCK_LMS_ENABLED && (
                          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                            <i className="fa-light fa-plus" aria-hidden="true" />
                            Add your first student
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(row => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 rounded-full shrink-0">
                            <AvatarFallback
                              className="rounded-full text-xs font-semibold"
                              style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
                            >
                              {initials(row.firstName, row.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{row.firstName} {row.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className="font-mono text-xs">{row.studentId}</span></TableCell>
                      <TableCell><span className="text-xs text-muted-foreground truncate max-w-44 block">{row.email}</span></TableCell>
                      <TableCell><span className="text-sm text-muted-foreground">{row.cohort}</span></TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(row.enrollmentStatus)} className="capitalize">
                          {row.enrollmentStatus.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.hasAccommodations ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="inline-flex items-center gap-1 text-xs"
                                style={{ color: 'var(--brand-color-dark)' }}
                              >
                                <i className="fa-light fa-universal-access text-xs" aria-hidden="true" />
                                Yes
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Managed in cross-product Accommodations module (workspace ADR-006)</TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.firstName} ${row.lastName}`}>
                              <i className="fa-regular fa-ellipsis" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem disabled={MOCK_LMS_ENABLED}>
                              <i className="fa-light fa-pen" aria-hidden="true" />
                              Edit profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <i className="fa-light fa-rectangle-list" aria-hidden="true" />
                              View course offerings
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <i className="fa-light fa-universal-access" aria-hidden="true" />
                              View accommodations
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {row.enrollmentStatus === 'enrolled' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'on-leave')}>
                                <i className="fa-light fa-pause" aria-hidden="true" />
                                Mark on leave
                              </DropdownMenuItem>
                            )}
                            {row.enrollmentStatus === 'on-leave' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(row.id, 'enrolled')}>
                                <i className="fa-light fa-play" aria-hidden="true" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            {(row.enrollmentStatus === 'enrolled' || row.enrollmentStatus === 'on-leave') && (
                              <DropdownMenuItem variant="destructive" onClick={() => handleStatusChange(row.id, 'withdrawn')}>
                                <i className="fa-light fa-user-xmark" aria-hidden="true" />
                                Withdraw
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {MOCK_LMS_ENABLED ? (
            <p className="text-xs text-muted-foreground text-right">
              Last synced 4m ago <span style={{ color: 'var(--chart-2)' }}>●</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-circle-info text-xs me-1" aria-hidden="true" />
              LMS integration is OFF. Showing manually-managed roster. Toggle in Settings (per workspace ADR-002).
            </p>
          )}

        </div>
      </main>

      {/* Add student dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add student</DialogTitle>
            <DialogDescription>
              When LMS integration is on, students sync automatically. This manual flow is for off-LMS schools or one-off additions (per workspace ADR-002).
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field orientation="vertical">
              <FieldLabel htmlFor="stu-id">Student ID *</FieldLabel>
              <Input
                id="stu-id"
                placeholder="e.g., 01234582"
                value={draft.studentId}
                onChange={e => setDraft({ ...draft, studentId: e.target.value })}
                aria-required="true"
              />
              <FieldDescription>Institution-issued ID. Must be unique.</FieldDescription>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field orientation="vertical">
                <FieldLabel htmlFor="stu-first">First name *</FieldLabel>
                <Input
                  id="stu-first"
                  value={draft.firstName}
                  onChange={e => setDraft({ ...draft, firstName: e.target.value })}
                  aria-required="true"
                />
              </Field>
              <Field orientation="vertical">
                <FieldLabel htmlFor="stu-last">Last name *</FieldLabel>
                <Input
                  id="stu-last"
                  value={draft.lastName}
                  onChange={e => setDraft({ ...draft, lastName: e.target.value })}
                  aria-required="true"
                />
              </Field>
            </div>

            <Field orientation="vertical">
              <FieldLabel htmlFor="stu-email">Email *</FieldLabel>
              <Input
                id="stu-email"
                type="email"
                value={draft.email}
                onChange={e => setDraft({ ...draft, email: e.target.value })}
                aria-required="true"
              />
            </Field>

            <Field orientation="vertical">
              <FieldLabel htmlFor="stu-cohort">Cohort *</FieldLabel>
              <Select value={draft.cohort} onValueChange={v => setDraft({ ...draft, cohort: v })}>
                <SelectTrigger id="stu-cohort" aria-label="Cohort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_COHORTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <FieldDescription>
                Accommodations for this student are managed in the cross-product Accommodations module (workspace ADR-006), not here.
              </FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={!draft.studentId.trim() || !draft.firstName.trim() || !draft.lastName.trim() || !draft.email.trim()}
            >
              Add student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
