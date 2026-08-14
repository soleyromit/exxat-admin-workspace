'use client'

/**
 * FacultyTab — assigned faculty for a course offering.
 *
 * Initialized from allFaculty filtered to those whose courses array
 * contains the given courseId. First matched faculty gets role
 * "Course Coordinator"; the rest get "Instructor".
 *
 * Actions:
 *   - Add Faculty: opens a right-side Sheet drawer with search +
 *     unassigned faculty list; each row has a role selector + Add button.
 *   - Edit role: icon button in Actions column — cycles the role.
 *   - Remove: destructive ghost icon button; optimistic removal.
 */

import { useState, useMemo } from 'react'
import {
  Button, Badge, Avatar, AvatarFallback,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  SheetFooter,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Separator,
  InputGroup, InputGroupAddon, InputGroupInput,
} from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { allFaculty, type ExtendedFaculty } from '@/lib/faculty-mock-data'

// ── Types ─────────────────────────────────────────────────────────────────────

type FacultyRole = 'Course Coordinator' | 'Instructor'

type AssignedFaculty = {
  id: string
  fullName: string
  email: string
  adminPosition: string
  rank: string
  role: FacultyRole
  status: 'active' | 'inactive'
}

interface AssignedFacultyRow extends Record<string, unknown> {
  id: string
  fullName: string
  email: string
  adminPosition: string
  rank: string
  role: FacultyRole
  status: 'active' | 'inactive'
}

// ── Status configs ────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<FacultyRole, { bg: string; fg: string }> = {
  'Course Coordinator': {
    bg: 'var(--brand-tint)',
    fg: 'var(--brand-color)',
  },
  Instructor: {
    bg: 'var(--muted)',
    fg: 'var(--muted-foreground)',
  },
}

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    bg: 'var(--qb-status-saved-bg)',
    fg: 'var(--qb-status-saved-fg)',
  },
  inactive: {
    label: 'Inactive',
    bg: 'var(--muted)',
    fg: 'var(--muted-foreground)',
  },
}

// ── Column definitions ────────────────────────────────────────────────────────

function buildColumns(
  onEditRole: (id: string) => void,
  onRemove: (id: string) => void,
): ColumnDef<AssignedFacultyRow>[] {
  return [
    {
      key: 'faculty',
      label: 'Faculty',
      sortable: true,
      sortKey: 'fullName',
      width: 260,
      cell: (row) => {
        const initials = (row.fullName as string)
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
        return (
          <div className="flex items-center gap-3">
            <Avatar style={{ width: 32, height: 32, flexShrink: 0 }} aria-hidden="true">
              <AvatarFallback
                className="text-xs font-bold"
                style={{
                  backgroundColor: 'var(--brand-tint)',
                  color: 'var(--brand-color)',
                }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{row.fullName as string}</p>
              <p className="text-xs text-muted-foreground truncate">
                {row.adminPosition as string} · {row.rank as string}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      width: 180,
      cell: (row) => {
        const cfg = ROLE_CONFIG[row.role as FacultyRole]
        return (
          <Badge
            variant="secondary"
            className="rounded text-xs font-semibold px-2"
            style={{ backgroundColor: cfg.bg, color: cfg.fg }}
          >
            {row.role as string}
          </Badge>
        )
      },
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      width: 240,
      cell: (row) => (
        <a
          href={`mailto:${row.email as string}`}
          className="text-sm hover:underline truncate block max-w-[220px]"
          style={{ color: 'var(--brand-color)' }}
        >
          {row.email as string}
        </a>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 120,
      cell: (row) => {
        const cfg = STATUS_CONFIG[row.status as 'active' | 'inactive']
        return (
          <Badge
            variant="secondary"
            className="rounded-full text-xs font-semibold px-2"
            style={{ backgroundColor: cfg.bg, color: cfg.fg }}
          >
            {cfg.label}
          </Badge>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      width: 80,
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.stopPropagation(); onEditRole(row.id as string) }}
            aria-label={`Change role for ${row.fullName as string}`}
          >
            <i className="fa-light fa-pen" aria-hidden="true" style={{ fontSize: 12 }} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.stopPropagation(); onRemove(row.id as string) }}
            aria-label={`Remove ${row.fullName as string} from course`}
            style={{ color: 'var(--destructive)' }}
          >
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 12 }} />
          </Button>
        </div>
      ),
    },
  ]
}

// ── Add Faculty Sheet ─────────────────────────────────────────────────────────

interface AddFacultySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignedIds: string[]
  onAdd: (faculty: AssignedFaculty) => void
}

function AddFacultySheet({ open, onOpenChange, assignedIds, onAdd }: AddFacultySheetProps) {
  const [search, setSearch] = useState('')
  const [pendingRoles, setPendingRoles] = useState<Record<string, FacultyRole>>({})

  const available = useMemo(
    () => allFaculty.filter((f) => !assignedIds.includes(f.id) && f.status === 'active'),
    [assignedIds]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return available
    return available.filter(
      (f) =>
        f.fullName.toLowerCase().includes(q) ||
        f.adminPosition.toLowerCase().includes(q) ||
        f.rank.toLowerCase().includes(q)
    )
  }, [available, search])

  function getRole(id: string): FacultyRole {
    return pendingRoles[id] ?? 'Instructor'
  }

  function handleAdd(f: ExtendedFaculty) {
    onAdd({
      id: f.id,
      fullName: f.fullName,
      email: f.email,
      adminPosition: f.adminPosition,
      rank: f.rank,
      role: getRole(f.id),
      status: f.status,
    })
    // Reset pending role for this faculty member
    setPendingRoles((prev) => {
      const next = { ...prev }
      delete next[f.id]
      return next
    })
  }

  function handleClose() {
    onOpenChange(false)
    setSearch('')
    setPendingRoles({})
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        showOverlay={false}
        showCloseButton={true}
        style={{ width: 480, maxWidth: '100vw', display: 'flex', flexDirection: 'column' }}
      >
        <SheetHeader>
          <SheetTitle>Add Faculty</SheetTitle>
          <SheetDescription>
            Select faculty members to assign to this course. Set their role before adding.
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="px-6 pt-4 pb-3 shrink-0">
          <InputGroup className="w-full max-w-sm">
            <InputGroupAddon align="inline-start">
              <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search faculty…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search faculty to add"
            />
          </InputGroup>
        </div>

        <Separator />

        {/* Faculty list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <i
                className="fa-light fa-user-slash text-muted-foreground text-2xl mb-3"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-foreground">No faculty available</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? 'No results for your search.' : 'All active faculty are already assigned.'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1" role="list">
              {filtered.map((f) => {
                const initials = f.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                const role = getRole(f.id)
                return (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar style={{ width: 36, height: 36, flexShrink: 0 }} aria-hidden="true">
                      <AvatarFallback
                        className="text-xs font-bold"
                        style={{
                          backgroundColor: 'var(--brand-tint)',
                          color: 'var(--brand-color)',
                        }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{f.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {f.adminPosition} · {f.rank}
                      </p>
                    </div>
                    <Select
                      value={role}
                      onValueChange={(v) =>
                        setPendingRoles((prev) => ({ ...prev, [f.id]: v as FacultyRole }))
                      }
                    >
                      <SelectTrigger
                        className="w-[150px] h-8 text-xs shrink-0"
                        aria-label={`Role for ${f.fullName}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Course Coordinator">Course Coordinator</SelectItem>
                        <SelectItem value="Instructor">Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 text-xs"
                      onClick={() => handleAdd(f)}
                    >
                      Add
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function FacultyTab({ courseId }: { courseId: string }) {
  // Initialize from allFaculty: any faculty whose courses contain this courseId
  const initial = useMemo<AssignedFaculty[]>(() => {
    const matched = allFaculty.filter((f) => f.courses.some((c) => c.id === courseId))
    return matched.map((f, i) => ({
      id: f.id,
      fullName: f.fullName,
      email: f.email,
      adminPosition: f.adminPosition,
      rank: f.rank,
      role: i === 0 ? 'Course Coordinator' : 'Instructor',
      status: f.status,
    }))
  }, [courseId])

  const [assignedFaculty, setAssignedFaculty] = useState<AssignedFaculty[]>(initial)
  const [sheetOpen, setSheetOpen] = useState(false)

  function handleEditRole(id: string) {
    setAssignedFaculty((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, role: f.role === 'Course Coordinator' ? 'Instructor' : 'Course Coordinator' }
          : f
      )
    )
  }

  function handleRemove(id: string) {
    setAssignedFaculty((prev) => prev.filter((f) => f.id !== id))
  }

  function handleAdd(faculty: AssignedFaculty) {
    setAssignedFaculty((prev) => {
      // Guard against double-add if user clicks quickly
      if (prev.some((f) => f.id === faculty.id)) return prev
      return [...prev, faculty]
    })
  }

  const assignedIds = useMemo(() => assignedFaculty.map((f) => f.id), [assignedFaculty])

  const columns = useMemo(
    () => buildColumns(handleEditRole, handleRemove),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const rows: AssignedFacultyRow[] = assignedFaculty.map((f) => ({ ...f }))

  return (
    <>
      <DataTable<AssignedFacultyRow>
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        selectable={false}
        searchable={false}
        showQueryControls={false}
        toolbarSlot={() => (
          <>
            <span className="text-xs text-muted-foreground">
              {assignedFaculty.length === 0
                ? 'No faculty assigned to this course yet.'
                : `${assignedFaculty.length} faculty member${assignedFaculty.length === 1 ? '' : 's'} assigned`}
            </span>
            <Button size="sm" className="gap-2" onClick={() => setSheetOpen(true)}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add Faculty
            </Button>
          </>
        )}
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <i
              className="fa-light fa-chalkboard-user text-muted-foreground text-3xl mb-3"
              aria-hidden="true"
            />
            <p className="font-semibold text-foreground">No faculty assigned</p>
            <p className="text-sm text-muted-foreground mt-1">
              Use &ldquo;Add Faculty&rdquo; to assign instructors to this course.
            </p>
          </div>
        }
      />

      <AddFacultySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        assignedIds={assignedIds}
        onAdd={handleAdd}
      />
    </>
  )
}
