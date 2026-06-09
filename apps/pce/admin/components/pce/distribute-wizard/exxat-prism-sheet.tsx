'use client'

import { useState, useEffect } from 'react'
import { Button, Badge, Sheet, SheetContent, SheetHeader, SheetTitle } from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import { useTableState } from '@/components/data-table/use-table-state'
import type { ColumnDef } from '@/components/data-table/types'
import { cn } from '@/lib/utils'
import { MOCK_STUDENTS, MOCK_FACULTY } from '@/lib/pce-mock-data'

export interface PrismRecipient {
  id: string
  name: string
  email: string
  source: 'prism'
  subtitle?: string
  personaType?: 'student' | 'faculty' | 'personnel'
}

type Persona = 'student' | 'faculty' | 'personnel'

// ── Data rows ──────────────────────────────────────────────────────────────

type StudentRow = {
  id: string
  name: string
  email: string
  cohort: string
  group: string
  status: string
  _enrollmentStatus: string
  [key: string]: unknown
}

type FacultyRow = {
  id: string
  name: string
  status: string
  email: string
  profileTypes: string
  position: string
  [key: string]: unknown
}

const STUDENT_ROWS: StudentRow[] = MOCK_STUDENTS.map(s => ({
  id: s.id,
  name: `${s.firstName} ${s.lastName}`,
  email: s.email,
  cohort: s.cohort,
  group: 'N/A',
  status: s.enrollmentStatus === 'enrolled' ? 'Active'
        : s.enrollmentStatus === 'withdrawn' ? 'Withdrawn'
        : s.enrollmentStatus === 'graduated' ? 'Graduated'
        : s.enrollmentStatus === 'on-leave'  ? 'On Leave'
        : 'N/A',
  _enrollmentStatus: s.enrollmentStatus,
}))

const FACULTY_EXTENDED = MOCK_FACULTY.map((f, i) => ({
  id: f.id,
  name: f.name,
  email: `${f.name.toLowerCase().replace(/[\s.]/g, '.')}@example.com`,
  status: i % 5 === 0 ? 'N/A' : 'Active',
  profileTypes: i % 4 === 0 ? 'N/A' : 'Faculty',
  position: ['Dean', 'Associate Dean', 'Full Professor', 'Assistant Professor', 'Director of Clinical Education', 'Department Chair'][i % 6],
})) satisfies FacultyRow[]

const STUDENT_COHORTS = Array.from(new Set(MOCK_STUDENTS.map(s => s.cohort))).sort()

// ── Column definitions ─────────────────────────────────────────────────────

const STUDENT_COLUMNS: ColumnDef<StudentRow>[] = [
  {
    key: 'name',
    label: 'Name',
    width: 200,
    sortable: true,
    cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
  },
  {
    key: 'email',
    label: 'Email',
    width: 240,
    cell: (row) => <span className="text-sm text-muted-foreground">{row.email}</span>,
  },
  {
    key: 'cohort',
    label: 'Cohort',
    width: 160,
    sortable: true,
    filter: {
      type: 'select',
      icon: 'fa-graduation-cap',
      options: STUDENT_COHORTS.map(c => ({ value: c, label: c })),
    },
    cell: (row) => <span className="text-sm">{row.cohort}</span>,
  },
  {
    key: 'group',
    label: 'Group',
    width: 100,
    cell: (row) => <span className="text-sm text-muted-foreground">{row.group}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    filter: {
      type: 'select',
      icon: 'fa-circle-dot',
      options: [
        { value: 'Active',    label: 'Active'    },
        { value: 'Withdrawn', label: 'Withdrawn' },
        { value: 'Graduated', label: 'Graduated' },
        { value: 'On Leave',  label: 'On Leave'  },
      ],
    },
    cell: (row) => <StatusBadge status={row.status} />,
  },
]

const FACULTY_COLUMNS: ColumnDef<FacultyRow>[] = [
  {
    key: 'name',
    label: 'Name',
    width: 200,
    sortable: true,
    cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    width: 120,
    filter: {
      type: 'select',
      icon: 'fa-circle-dot',
      options: [
        { value: 'Active', label: 'Active' },
        { value: 'N/A',    label: 'N/A'    },
      ],
    },
    cell: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'email',
    label: 'Email',
    width: 240,
    cell: (row) => <span className="text-sm text-muted-foreground">{row.email}</span>,
  },
  {
    key: 'profileTypes',
    label: 'Profile Types',
    width: 140,
    cell: (row) => <span className="text-sm">{row.profileTypes}</span>,
  },
  {
    key: 'position',
    label: 'Position',
    width: 200,
    cell: (row) => <span className="text-sm text-muted-foreground">{row.position}</span>,
  },
]

// ── Component ──────────────────────────────────────────────────────────────

interface ExxatPrismSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: Set<string>
  onCommit: (recipients: PrismRecipient[]) => void
}

export function ExxatPrismSheet({ open, onOpenChange, selectedIds: initialIds, onCommit }: ExxatPrismSheetProps) {
  const [tab, setTab] = useState<Persona>('student')

  // External states — one per tab so selection persists across tab switches
  const studentState = useTableState<StudentRow>(STUDENT_ROWS, STUDENT_COLUMNS)
  const facultyState = useTableState<FacultyRow>(FACULTY_EXTENDED, FACULTY_COLUMNS)

  // Sync initial selection + reset filters each time the sheet opens
  useEffect(() => {
    if (open) {
      studentState.setSelected(new Set(STUDENT_ROWS.filter(r => initialIds.has(r.id)).map(r => r.id)))
      facultyState.setSelected(new Set(FACULTY_EXTENDED.filter(r => initialIds.has(r.id)).map(r => r.id)))
      studentState.setSearch('')
      facultyState.setSearch('')
      setTab('student')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const selectedCount = studentState.selected.size + facultyState.selected.size

  function handleCommit() {
    const recipients: PrismRecipient[] = []
    STUDENT_ROWS.filter(r => studentState.selected.has(r.id)).forEach(r =>
      recipients.push({ id: r.id, name: r.name, email: r.email, source: 'prism', subtitle: r.cohort, personaType: 'student' })
    )
    FACULTY_EXTENDED.filter(r => facultyState.selected.has(r.id)).forEach(r =>
      recipients.push({ id: r.id, name: r.name, email: r.email, source: 'prism', subtitle: r.position, personaType: 'faculty' })
    )
    onCommit(recipients)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-5xl">

        {/* Header */}
        <SheetHeader className="flex flex-row items-center gap-3 shrink-0 border-b border-border" style={{ padding: '14px 20px' }}>
          <SheetTitle className="flex-1 text-base font-semibold">Select Recipients</SheetTitle>
          <Button variant="default" size="sm" onClick={handleCommit}>
            {selectedCount > 0
              ? `Add ${selectedCount} recipient${selectedCount !== 1 ? 's' : ''}`
              : 'Add / Update Recipients'}
          </Button>
        </SheetHeader>

        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="Recipient type"
          className="shrink-0 flex"
          style={{ paddingInline: 20 }}
        >
          {(['student', 'faculty', 'personnel'] as Persona[]).map(t => (
            <Button
              key={t}
              variant="ghost"
              size="sm"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-none px-3 py-2.5 text-sm border-b-2 -mb-px transition-colors focus-visible:ring-inset capitalize h-auto',
                tab === t
                  ? 'border-b-foreground text-foreground font-medium'
                  : 'border-b-transparent text-muted-foreground hover:text-foreground hover:bg-transparent'
              )}
            >
              {t === 'student' ? 'Students' : t === 'faculty' ? 'Faculty' : 'Personnel'}
            </Button>
          ))}
        </div>

        {/* Body — flex-1 so DataTable fills remaining height */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {tab === 'student' && (
            <DataTable<StudentRow>
              data={STUDENT_ROWS}
              columns={STUDENT_COLUMNS}
              getRowId={row => row.id}
              getRowSelectionLabel={row => row.name}
              selectable
              searchable
              state={studentState}
              bulkActionsSlot={(sel) => (
                <Button size="sm" variant="default" onClick={handleCommit}>
                  Add {sel.size} recipient{sel.size !== 1 ? 's' : ''}
                </Button>
              )}
              emptyState={
                <div className="flex flex-col items-center gap-2 py-10">
                  <i className="fa-light fa-users text-muted-foreground text-2xl" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">No students match your filters</p>
                </div>
              }
            />
          )}

          {tab === 'faculty' && (
            <DataTable<FacultyRow>
              data={FACULTY_EXTENDED}
              columns={FACULTY_COLUMNS}
              getRowId={row => row.id}
              getRowSelectionLabel={row => row.name}
              selectable
              searchable
              state={facultyState}
              bulkActionsSlot={(sel) => (
                <Button size="sm" variant="default" onClick={handleCommit}>
                  Add {sel.size} recipient{sel.size !== 1 ? 's' : ''}
                </Button>
              )}
              emptyState={
                <div className="flex flex-col items-center gap-2 py-10">
                  <i className="fa-light fa-chalkboard-user text-muted-foreground text-2xl" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">No faculty match your filters</p>
                </div>
              }
            />
          )}

          {tab === 'personnel' && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center h-full">
              <i className="fa-light fa-user-tie text-muted-foreground text-2xl" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Personnel data coming soon</p>
            </div>
          )}
        </div>

      </SheetContent>
    </Sheet>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'N/A') return <span className="text-sm text-muted-foreground">N/A</span>
  return (
    <Badge variant="secondary" className="rounded-full text-xs" style={{ paddingInline: 8, paddingBlock: 2 }}>
      {status}
    </Badge>
  )
}
