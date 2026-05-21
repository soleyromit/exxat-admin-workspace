'use client'

/**
 * Course Offering detail — base entity page.
 *
 * Tabs use controlled state (value + onValueChange) matching all other
 * detail pages in this codebase. Uncontrolled defaultValue caused the
 * active-indicator to not track correctly in the DS line variant.
 *
 * Entity connections (bidirectional, both directions functional):
 *   Students  — Enroll Student sheet (offering → student, entry point B)
 *               entry point A is Student detail → Courses tab
 *   Faculty   — Assign Faculty sheet (offering → faculty, entry point B)
 *               entry point A is Faculty detail → Teaching tab
 *   Accommodations — reads global student accommodations for this offering
 *
 * Canvas/SIS IDs live on the data model but are not surfaced to end users
 * when empty — only shown when Canvas integration is active and values exist.
 */

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEntryPoint } from '@/lib/use-entry-point'
import { recordView } from '@/lib/recently-viewed'
import {
  Button, Badge, Avatar, AvatarFallback,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Separator,
} from '@exxat/ds/packages/ui/src'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { RowActions } from '@/components/data-table/row-actions'
import { facultyStudents, type ExtendedFaculty } from '@/lib/faculty-mock-data'
import { allFaculty } from '@/lib/faculty-mock-data'
import type { ExtendedCourseOffering } from '@/lib/course-mock-data'

const IS_LMS_ACTIVE = false

// ── Types ─────────────────────────────────────────────────────────────────────

type EnrolledStudent = { id: string; name: string; email: string; status: 'enrolled' | 'completed' | 'withdrawn' }
type AssignedFaculty = { id: string; name: string; role: 'Course Coordinator' | 'Instructor' }

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function nameInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
}

// ── Shared badge configs ──────────────────────────────────────────────────────

const OFFERING_STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  ongoing:   { label: 'Ongoing',   bg: 'var(--qb-status-saved-bg)', fg: 'var(--qb-status-saved-fg)' },
  completed: { label: 'Completed', bg: 'var(--muted)',               fg: 'var(--muted-foreground)' },
  upcoming:  { label: 'Upcoming',  bg: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', fg: 'var(--brand-color-dark)' },
}

const ASSESSMENT_STATUS: Record<string, { bg: string; fg: string }> = {
  Published: { bg: 'var(--qb-status-saved-bg)', fg: 'var(--qb-status-saved-fg)' },
  Draft:     { bg: 'var(--muted)',               fg: 'var(--muted-foreground)' },
  Upcoming:  { bg: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', fg: 'var(--brand-color-dark)' },
}

const STUDENT_STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  enrolled:  { label: 'Enrolled',  bg: 'var(--qb-status-saved-bg)', fg: 'var(--qb-status-saved-fg)' },
  completed: { label: 'Completed', bg: 'var(--muted)',               fg: 'var(--muted-foreground)' },
  withdrawn: { label: 'Withdrawn', bg: 'color-mix(in oklch, var(--destructive) 10%, var(--background))', fg: 'var(--destructive)' },
}

// ── Enroll Student Sheet ──────────────────────────────────────────────────────

function EnrollStudentSheet({
  open, onOpenChange, enrolledIds, onEnroll,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrolledIds: Set<string>
  onEnroll: (s: EnrolledStudent) => void
}) {
  const [search, setSearch] = useState('')
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set())

  const available = useMemo(
    () => facultyStudents.filter(s => !enrolledIds.has(s.id)),
    [enrolledIds]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return available
    return available.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.cohort.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    )
  }, [available, search])

  function handleEnroll(s: typeof facultyStudents[0]) {
    onEnroll({ id: s.id, name: `${s.firstName} ${s.lastName}`, email: s.email, status: 'enrolled' })
    setJustAdded(prev => new Set(prev).add(s.id))
  }

  function handleClose() {
    onOpenChange(false)
    setSearch('')
    setJustAdded(new Set())
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" showOverlay={false} showCloseButton
        style={{ width: 480, maxWidth: '100vw', display: 'flex', flexDirection: 'column' }}>
        <SheetHeader>
          <SheetTitle>Enroll Student</SheetTitle>
          <SheetDescription>Search and add students to this course offering.</SheetDescription>
        </SheetHeader>

        <div className="px-6 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-2 rounded-md border px-3"
            style={{ borderColor: 'var(--border-control-35)', height: 36 }}>
            <i className="fa-light fa-magnifying-glass text-muted-foreground shrink-0" aria-hidden="true" style={{ fontSize: 13 }} />
            <input
              type="search"
              placeholder="Search by name, student ID, or cohort…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search students"
              autoFocus
            />
          </div>
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <i className="fa-light fa-user-slash text-muted-foreground text-2xl mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">No students available</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? 'No results match your search.' : 'All students are already enrolled.'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {filtered.map(s => {
                const added = justAdded.has(s.id)
                return (
                  <li key={s.id} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors">
                    <Avatar style={{ width: 36, height: 36, flexShrink: 0 }}>
                      <AvatarFallback className="text-xs font-bold"
                        style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                        {s.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.studentId} · {s.cohort}</p>
                    </div>
                    {added ? (
                      <span className="text-xs font-medium shrink-0 flex items-center gap-1"
                        style={{ color: 'var(--qb-status-saved-fg)' }}>
                        <i className="fa-light fa-circle-check" aria-hidden="true" />
                        Enrolled
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => handleEnroll(s)}>
                        Enroll
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleClose}>Done</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Assign Faculty Sheet ──────────────────────────────────────────────────────

function AssignFacultySheet({
  open, onOpenChange, assignedIds, onAssign,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignedIds: Set<string>
  onAssign: (f: AssignedFaculty) => void
}) {
  const [search, setSearch] = useState('')
  const [pendingRoles, setPendingRoles] = useState<Record<string, 'Course Coordinator' | 'Instructor'>>({})

  const available = useMemo(
    () => allFaculty.filter(f => !assignedIds.has(f.id) && f.status === 'active'),
    [assignedIds]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return available
    return available.filter(f =>
      f.fullName.toLowerCase().includes(q) ||
      f.adminPosition.toLowerCase().includes(q) ||
      f.rank.toLowerCase().includes(q)
    )
  }, [available, search])

  function getRole(id: string): 'Course Coordinator' | 'Instructor' {
    return pendingRoles[id] ?? 'Instructor'
  }

  function handleAssign(f: ExtendedFaculty) {
    onAssign({ id: f.id, name: f.fullName, role: getRole(f.id) })
    setPendingRoles(prev => { const n = { ...prev }; delete n[f.id]; return n })
  }

  function handleClose() {
    onOpenChange(false)
    setSearch('')
    setPendingRoles({})
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" showOverlay={false} showCloseButton
        style={{ width: 480, maxWidth: '100vw', display: 'flex', flexDirection: 'column' }}>
        <SheetHeader>
          <SheetTitle>Assign Faculty</SheetTitle>
          <SheetDescription>Select faculty and set their role for this offering.</SheetDescription>
        </SheetHeader>

        <div className="px-6 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-2 rounded-md border px-3"
            style={{ borderColor: 'var(--border-control-35)', height: 36 }}>
            <i className="fa-light fa-magnifying-glass text-muted-foreground shrink-0" aria-hidden="true" style={{ fontSize: 13 }} />
            <input
              type="search"
              placeholder="Search faculty…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search faculty"
              autoFocus
            />
          </div>
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <i className="fa-light fa-user-slash text-muted-foreground text-2xl mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">No faculty available</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? 'No results match your search.' : 'All active faculty are already assigned.'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {filtered.map(f => {
                const initials = f.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                const role = getRole(f.id)
                return (
                  <li key={f.id} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors">
                    <Avatar style={{ width: 36, height: 36, flexShrink: 0 }}>
                      <AvatarFallback className="text-xs font-bold"
                        style={{
                          backgroundColor: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))',
                          color: 'var(--brand-color)',
                        }}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{f.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.adminPosition} · {f.rank}</p>
                    </div>
                    <Select value={role}
                      onValueChange={v => setPendingRoles(prev => ({ ...prev, [f.id]: v as 'Course Coordinator' | 'Instructor' }))}>
                      <SelectTrigger className="w-[150px] h-8 text-xs shrink-0" aria-label={`Role for ${f.fullName}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Course Coordinator">Course Coordinator</SelectItem>
                        <SelectItem value="Instructor">Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={() => handleAssign(f)}>
                      Assign
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleClose}>Done</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Assessments tab ───────────────────────────────────────────────────────────

type AssessmentRow = ExtendedCourseOffering['assessments'][number] & Record<string, unknown>

function buildAssessmentColumns(onNewAssessment: () => void): ColumnDef<AssessmentRow>[] {
  return [
    {
      key: 'title',
      label: 'Assessment',
      width: 280,
      sortable: true,
      sortKey: 'title',
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))' }}>
            <i className="fa-light fa-clipboard-list" aria-hidden="true"
              style={{ fontSize: 12, color: 'var(--brand-color)' }} />
          </div>
          <span className="text-sm font-medium text-foreground truncate">{row.title as string}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      width: 140,
      sortable: true,
      sortKey: 'type',
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.type as string}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 110,
      sortable: true,
      sortKey: 'status',
      cell: (row) => {
        const s = ASSESSMENT_STATUS[row.status as string] ?? ASSESSMENT_STATUS.Draft
        return (
          <Badge variant="secondary" className="rounded text-[11px] font-medium"
            style={{ backgroundColor: s.bg, color: s.fg }}>
            {row.status as string}
          </Badge>
        )
      },
    },
    {
      key: 'date',
      label: 'Date',
      width: 120,
      sortable: true,
      sortKey: 'date',
      cell: (row) => (
        <span className="text-sm text-muted-foreground tabular-nums">{formatDate(row.date as string)}</span>
      ),
    },
    {
      key: 'students',
      label: 'Students',
      width: 90,
      sortable: true,
      sortKey: 'students',
      cell: (row) => (
        <span className="text-sm text-foreground tabular-nums">{row.students as number}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: 52,
      defaultPin: 'right',
      lockPin: true,
      cell: (row) => (
        <RowActions
          row={row}
          label={row.title as string}
          actions={[
            { label: 'View Assessment', icon: 'fa-arrow-right', onClick: () => {} },
            { label: 'Edit', icon: 'fa-pen', onClick: () => {} },
          ]}
        />
      ),
    },
  ]
}

function AssessmentsTab({ offering, onNewAssessment }: { offering: ExtendedCourseOffering; onNewAssessment: () => void }) {
  const assessmentColumns = useMemo(() => buildAssessmentColumns(onNewAssessment), [onNewAssessment])

  return (
    <DataTable<AssessmentRow>
      data={offering.assessments as AssessmentRow[]}
      columns={assessmentColumns}
      getRowId={(row) => row.id as string}
      selectable={false}
      searchable={false}
      showQueryControls={false}
      toolbarSlot={() => (
        <>
          <span className="text-xs text-muted-foreground">
            {offering.assessments.length} assessment{offering.assessments.length !== 1 ? 's' : ''}
          </span>
          <Button size="sm" onClick={onNewAssessment}>
            <i className="fa-light fa-plus" aria-hidden="true" />
            New Assessment
          </Button>
        </>
      )}
      emptyState={
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <i className="fa-light fa-clipboard-list text-muted-foreground text-xl" aria-hidden="true" />
          </div>
          <p className="font-semibold text-foreground">No assessments yet</p>
          <p className="text-sm text-muted-foreground">Create the first assessment for this course offering.</p>
          <Button size="sm" className="mt-1" onClick={onNewAssessment}>
            <i className="fa-light fa-plus" aria-hidden="true" />
            New Assessment
          </Button>
        </div>
      }
    />
  )
}

// ── Students tab ──────────────────────────────────────────────────────────────

type EnrolledStudentRow = EnrolledStudent & Record<string, unknown>

const enrolledStudentColumns: ColumnDef<EnrolledStudentRow>[] = [
  {
    key: 'student',
    label: 'Student',
    width: 240,
    sortable: true,
    sortKey: 'name',
    cell: (row) => {
      const initials = nameInitials(row.name as string)
      return (
        <div className="flex items-center gap-3">
          <Avatar className="shrink-0" style={{ width: 32, height: 32 }} aria-hidden="true">
            <AvatarFallback className="text-[11px] font-bold"
              style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color-dark)' }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{row.name as string}</p>
            <p className="text-[11px] text-muted-foreground truncate">{row.email as string}</p>
          </div>
        </div>
      )
    },
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    sortable: true,
    sortKey: 'status',
    cell: (row) => {
      const s = STUDENT_STATUS[row.status as string] ?? STUDENT_STATUS.enrolled
      return (
        <Badge variant="secondary" className="rounded text-[11px] font-medium"
          style={{ backgroundColor: s.bg, color: s.fg }}>
          {s.label}
        </Badge>
      )
    },
  },
  {
    key: 'actions',
    label: '',
    width: 52,
    defaultPin: 'right',
    lockPin: true,
    cell: (row) => (
      <RowActions
        row={row}
        label={row.name as string}
        actions={[
          {
            label: 'View Student',
            icon: 'fa-arrow-right',
            onClick: (r) => { window.location.href = `/students/${r.id as string}` },
          },
          {
            label: 'Remove from Course',
            icon: 'fa-user-minus',
            variant: 'destructive',
            divider: true,
            onClick: () => {},
          },
        ]}
      />
    ),
  },
]

function StudentsTab({ localStudents, onOpenEnroll, onNavigateStudent }: {
  localStudents: EnrolledStudent[]
  onOpenEnroll: () => void
  onNavigateStudent: (id: string) => void
}) {
  return (
    <DataTable<EnrolledStudentRow>
      data={localStudents as EnrolledStudentRow[]}
      columns={enrolledStudentColumns}
      getRowId={(row) => row.id as string}
      selectable={false}
      searchable={false}
      showQueryControls={false}
      onRowClick={(row) => onNavigateStudent(row.id as string)}
      toolbarSlot={() => (
        <>
          <span className="text-xs text-muted-foreground">
            {localStudents.length} student{localStudents.length !== 1 ? 's' : ''} enrolled
          </span>
          {IS_LMS_ACTIVE ? (
            <Badge
              variant="secondary"
              className="rounded-full gap-1.5 text-xs"
              style={{
                backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
                color: 'var(--brand-color)',
              }}
            >
              <i className="fa-light fa-link" aria-hidden="true" />
              Managed by Canvas
            </Badge>
          ) : (
            <Button size="sm" onClick={onOpenEnroll}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Enroll Student
            </Button>
          )}
        </>
      )}
      emptyState={
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <i className="fa-light fa-users text-muted-foreground text-xl" aria-hidden="true" />
          </div>
          <p className="font-semibold text-foreground">No students enrolled</p>
          <p className="text-sm text-muted-foreground">Enroll students in this course offering.</p>
          {!IS_LMS_ACTIVE && (
            <Button size="sm" className="mt-1" onClick={onOpenEnroll}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Enroll Student
            </Button>
          )}
        </div>
      }
    />
  )
}

// ── Accommodations tab ────────────────────────────────────────────────────────

function AccommodationsTab({ courseName }: { courseName: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-14 text-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <i className="fa-light fa-universal-access text-muted-foreground text-lg" aria-hidden="true" />
        </div>
        <p className="font-semibold text-foreground">No accommodations for {courseName}</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Students with approved accommodations registered for this offering will appear here.
        </p>
        <Button variant="outline" size="sm" className="mt-1 gap-1.5" asChild>
          <a href="/accommodations">
            Manage all accommodations
            <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 11 }} />
          </a>
        </Button>
      </div>
    </div>
  )
}

// ── Faculty tab ───────────────────────────────────────────────────────────────

type AssignedFacultyRow = AssignedFaculty & Record<string, unknown>

const assignedFacultyColumns: ColumnDef<AssignedFacultyRow>[] = [
  {
    key: 'faculty',
    label: 'Faculty',
    width: 240,
    sortable: true,
    sortKey: 'name',
    cell: (row) => {
      const initials = nameInitials(row.name as string)
      return (
        <div className="flex items-center gap-3">
          <Avatar className="shrink-0" style={{ width: 32, height: 32 }} aria-hidden="true">
            <AvatarFallback className="text-[11px] font-bold"
              style={{
                backgroundColor: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))',
                color: 'var(--brand-color)',
              }}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-medium text-foreground truncate">{row.name as string}</p>
        </div>
      )
    },
  },
  {
    key: 'role',
    label: 'Role',
    width: 180,
    sortable: true,
    sortKey: 'role',
    cell: (row) => (
      <Badge variant="secondary" className="rounded text-[11px] font-medium"
        style={row.role === 'Course Coordinator'
          ? { backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', color: 'var(--brand-color)' }
          : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
        {row.role as string}
      </Badge>
    ),
  },
  {
    key: 'actions',
    label: '',
    width: 52,
    defaultPin: 'right',
    lockPin: true,
    cell: (row) => (
      <RowActions
        row={row}
        label={row.name as string}
        actions={[
          {
            label: 'View Faculty',
            icon: 'fa-arrow-right',
            onClick: (r) => { window.location.href = `/faculty/${r.id as string}` },
          },
          {
            label: 'Remove from Course',
            icon: 'fa-user-minus',
            variant: 'destructive',
            divider: true,
            onClick: () => {},
          },
        ]}
      />
    ),
  },
]

function FacultyTab({ localFaculty, onOpenAssign, onNavigateFaculty }: {
  localFaculty: AssignedFaculty[]
  onOpenAssign: () => void
  onNavigateFaculty: (id: string) => void
}) {
  return (
    <DataTable<AssignedFacultyRow>
      data={localFaculty as AssignedFacultyRow[]}
      columns={assignedFacultyColumns}
      getRowId={(row) => row.id as string}
      selectable={false}
      searchable={false}
      showQueryControls={false}
      onRowClick={(row) => onNavigateFaculty(row.id as string)}
      toolbarSlot={() => (
        <>
          <span className="text-xs text-muted-foreground">
            {localFaculty.length} faculty member{localFaculty.length !== 1 ? 's' : ''} assigned
          </span>
          {IS_LMS_ACTIVE ? (
            <Badge
              variant="secondary"
              className="rounded-full gap-1.5 text-xs"
              style={{
                backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
                color: 'var(--brand-color)',
              }}
            >
              <i className="fa-light fa-link" aria-hidden="true" />
              Managed by Canvas
            </Badge>
          ) : (
            <Button size="sm" onClick={onOpenAssign}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Assign Faculty
            </Button>
          )}
        </>
      )}
      emptyState={
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <i className="fa-light fa-chalkboard-user text-muted-foreground text-xl" aria-hidden="true" />
          </div>
          <p className="font-semibold text-foreground">No faculty assigned</p>
          <p className="text-sm text-muted-foreground">Assign a course coordinator and instructors to this offering.</p>
          {!IS_LMS_ACTIVE && (
            <Button size="sm" className="mt-1" onClick={onOpenAssign}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Assign Faculty
            </Button>
          )}
        </div>
      }
    />
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ offering, isPrism }: { offering: ExtendedCourseOffering; isPrism: boolean }) {
  const status = OFFERING_STATUS[offering.status]
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-5">
        {offering.description && (
          <section className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2">Description</p>
            <p className="text-sm text-foreground leading-relaxed">{offering.description}</p>
          </section>
        )}
        {offering.objectives.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3">Learning Objectives</p>
            <ol className="flex flex-col gap-2.5">
              {offering.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 flex size-5 items-center justify-center rounded-full text-[10px] font-bold mt-0.5"
                    style={{
                      backgroundColor: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))',
                      color: 'var(--brand-color)',
                    }}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground leading-relaxed">{obj}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <section className="rounded-xl border border-border bg-card p-5 flex flex-col gap-0">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3">Quick Reference</p>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <span className="text-xs text-muted-foreground">Status</span>
            <Badge variant="secondary" className="rounded text-[11px] font-medium"
              style={{ backgroundColor: status?.bg, color: status?.fg }}>
              {status?.label ?? offering.status}
            </Badge>
          </div>
          {[
            { label: 'Credits',      value: `${offering.credits} cr` },
            { label: 'Course Type',  value: offering.courseType },
            { label: 'Hours / Week', value: `${offering.hoursPerWeek} hrs` },
            { label: 'Start',        value: formatDate(offering.startDate) },
            { label: 'End',          value: formatDate(offering.endDate) },
            { label: 'Cohort',       value: offering.cohort },
            { label: 'Faculty',      value: offering.facultyAssigned },
            { label: 'Department',   value: offering.department },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
              <span className="text-xs text-muted-foreground shrink-0">{label}</span>
              <span className="text-xs text-foreground text-right truncate">{value}</span>
            </div>
          ))}
        </section>

        <div className="rounded-xl border border-border p-4 flex items-start gap-3"
          style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 4%, var(--background))' }}>
          <i className="fa-light fa-books text-sm mt-0.5 shrink-0" aria-hidden="true"
            style={{ color: 'var(--brand-color)' }} />
          <div>
            <p className="text-sm font-medium text-foreground">Question bank</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              Questions, folders, and drafts for this course.
            </p>
            <a href="/question-bank"
              className="inline-flex items-center gap-1.5 text-xs font-medium mt-2 no-underline hover:underline"
              style={{ color: 'var(--brand-color)' }}>
              Open question bank
              <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
            </a>
          </div>
        </div>

        {isPrism && (
          <div className="rounded-xl border border-border p-4 flex items-start gap-3"
            style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 4%, var(--background))' }}>
            <i className="fa-light fa-arrow-up-right-from-square mt-0.5 shrink-0" aria-hidden="true"
              style={{ fontSize: 13, color: 'var(--brand-color)' }} />
            <div>
              <p className="text-sm font-medium text-foreground">Full course view in Prism</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Syllabus, LMS content, and historical offerings.
              </p>
              <a href="#prism-course-view" target="_blank" rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-xs font-medium mt-2 no-underline hover:underline"
                style={{ color: 'var(--brand-color)' }}>
                View in Prism
                <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 10 }} />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Resources tab ─────────────────────────────────────────────────────────────

function ResourcesTab({ offering }: { offering: ExtendedCourseOffering }) {
  if (offering.resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-14 text-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <i className="fa-light fa-folder-open text-muted-foreground text-lg" aria-hidden="true" />
        </div>
        <p className="font-semibold text-foreground">No resources added</p>
        <p className="text-sm text-muted-foreground">Reading materials, links, and videos will appear here.</p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <ul className="divide-y divide-border">
        {offering.resources.map((res, i) => (
          <li key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
              <i className={`fa-light ${res.type === 'PDF' ? 'fa-file-pdf' : res.type === 'Video' ? 'fa-play' : 'fa-link'}`}
                aria-hidden="true" style={{ fontSize: 13 }} />
            </span>
            <p className="text-sm font-medium text-foreground flex-1 truncate">{res.title}</p>
            <Badge variant="secondary" className="rounded text-[11px] shrink-0"
              style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
              {res.type}
            </Badge>
            {res.url && (
              <Button variant="ghost" size="icon-sm" aria-label={`Open ${res.title}`}
                onClick={() => window.open(res.url, '_blank', 'noopener,noreferrer')}>
                <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 12 }} />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CourseOfferingDetailClient({ offering }: { offering: ExtendedCourseOffering }) {
  const router = useRouter()
  const entryPoint = useEntryPoint()
  const isPrism = entryPoint === 'prism'

  useEffect(() => {
    recordView('courses', {
      id: offering.id,
      name: offering.courseName,
      subtitle: `${offering.courseNumber} · ${offering.term}`,
      href: `/courses/offerings/${offering.id}`,
      icon: 'fa-book',
    })
  }, [offering.id])

  // Controlled tab state — matches all other detail pages in this codebase
  const [activeTab, setActiveTab] = useState('assessments')

  // Enrollment state — initialized from offering data, mutated locally
  const [localStudents, setLocalStudents] = useState<EnrolledStudent[]>(
    offering.students.map(s => ({ id: s.id, name: s.name, email: s.email, status: s.status }))
  )
  const [localFaculty, setLocalFaculty] = useState<AssignedFaculty[]>(
    offering.faculty.map(f => ({ id: f.id, name: f.name, role: f.role }))
  )

  // Sheet open state
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  const enrolledIds = useMemo(() => new Set(localStudents.map(s => s.id)), [localStudents])
  const assignedIds = useMemo(() => new Set(localFaculty.map(f => f.id)), [localFaculty])

  const status = OFFERING_STATUS[offering.status]

  return (
    <>
      <SiteHeader
        title={offering.courseName}
        breadcrumbs={[{ label: 'Courses', href: '/courses' }, { label: offering.courseName }]}
      />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none min-h-0">
        <PageHeader
          title={offering.courseName}
          subtitle={`${offering.courseNumber} · ${offering.term} · ${offering.cohort}`}
          actions={
            status && (
              <Badge variant="secondary" className="rounded-full text-xs font-semibold px-3 py-1"
                style={{ backgroundColor: status.bg, color: status.fg }}>
                {status.label}
              </Badge>
            )
          }
        />

        {/* Controlled tabs — value + onValueChange, matching course-detail-client.tsx */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col min-h-0">
          <div className="px-6 border-b border-border shrink-0">
            <TabsList variant="line">
              <TabsTrigger value="overview">
                <i className="fa-light fa-circle-info text-xs" aria-hidden="true" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="assessments">
                <i className="fa-light fa-clipboard-list text-xs" aria-hidden="true" />
                Assessments
                {offering.assessments.length > 0 && (
                  <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
                    {offering.assessments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="students">
                <i className="fa-light fa-users text-xs" aria-hidden="true" />
                Students
                {localStudents.length > 0 && (
                  <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
                    {localStudents.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="faculty">
                <i className="fa-light fa-chalkboard-user text-xs" aria-hidden="true" />
                Faculty
                {localFaculty.length > 0 && (
                  <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
                    {localFaculty.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resources">
                <i className="fa-light fa-folder-open text-xs" aria-hidden="true" />
                Resources
                {offering.resources.length > 0 && (
                  <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
                    {offering.resources.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto pt-2 px-6 pb-6">
            <TabsContent value="overview" className="m-0">
              <OverviewTab offering={offering} isPrism={isPrism} />
            </TabsContent>
            <TabsContent value="assessments" className="m-0">
              <AssessmentsTab
                offering={offering}
                onNewAssessment={() => router.push(`/assessment-builder?offeringId=${offering.id}`)}
              />
            </TabsContent>
            <TabsContent value="students" className="m-0">
              <StudentsTab
                localStudents={localStudents}
                onOpenEnroll={() => setEnrollOpen(true)}
                onNavigateStudent={(id) => router.push(`/students/${id}`)}
              />
            </TabsContent>
            <TabsContent value="faculty" className="m-0">
              <FacultyTab
                localFaculty={localFaculty}
                onOpenAssign={() => setAssignOpen(true)}
                onNavigateFaculty={(id) => router.push(`/faculty/${id}`)}
              />
            </TabsContent>
            <TabsContent value="resources" className="m-0">
              <ResourcesTab offering={offering} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Sheets live outside tab content so they don't re-mount on tab switch */}
      <EnrollStudentSheet
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        enrolledIds={enrolledIds}
        onEnroll={s => setLocalStudents(prev => prev.some(e => e.id === s.id) ? prev : [...prev, s])}
      />
      <AssignFacultySheet
        open={assignOpen}
        onOpenChange={setAssignOpen}
        assignedIds={assignedIds}
        onAssign={f => setLocalFaculty(prev => prev.some(e => e.id === f.id) ? prev : [...prev, f])}
      />
    </>
  )
}
