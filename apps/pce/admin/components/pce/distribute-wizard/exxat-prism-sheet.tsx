'use client'

import { useState, useEffect } from 'react'
import {
  Button,
  Badge,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import { useTableState } from '@/components/data-table/use-table-state'
import type { ColumnDef } from '@/components/data-table/types'
import { cn } from '@/lib/utils'
import {
  MOCK_STUDENTS,
  MOCK_FACULTY,
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  MOCK_MASTER_COURSES,
  MOCK_COURSE_ENROLLMENTS,
} from '@/lib/pce-mock-data'

export interface PrismRecipient {
  id: string
  name: string
  email: string
  source: 'prism'
  subtitle?: string
  personaType?: 'student' | 'faculty' | 'personnel'
}

type Persona = 'student' | 'faculty' | 'personnel'

// ── Filter option lists (built once from mock data) ─────────────────────────

const ACADEMIC_YEAR_OPTIONS = Array.from(
  new Set(MOCK_PROGRAM_TERMS.map(t => t.academicYear))
).sort().reverse().map(y => ({ value: y, label: y }))

const TERM_OPTIONS = MOCK_PROGRAM_TERMS.map(t => ({ value: t.name, label: t.name }))

const OFFERING_OPTIONS = MOCK_COURSE_OFFERINGS.map(o => {
  const course = MOCK_MASTER_COURSES.find(c => c.id === o.masterCourseId)
  const term   = MOCK_PROGRAM_TERMS.find(t => t.id === o.termId)
  return {
    value: `${course?.code ?? o.id}`,
    label: `${course?.code} — ${course?.name} (${term?.name ?? ''})`,
  }
})

// ── Row types ───────────────────────────────────────────────────────────────

type StudentRow = {
  id: string
  name: string
  email: string
  cohort: string
  group: string
  status: string
  _enrollmentStatus: string
  // hidden filter fields
  academicYear: string
  termName: string
  offeringCode: string
  [key: string]: unknown
}

type FacultyRow = {
  id: string
  name: string
  status: string
  email: string
  profileTypes: string
  position: string
  courseRole: string
  // hidden filter fields
  academicYear: string
  termName: string
  offeringCode: string
  [key: string]: unknown
}

// ── Build rows — each row carries every offering it belongs to ──────────────
// For filtering to work correctly, we expand so that a student who appears in
// 3 offerings gets 3 rows. De-dup by id when committing.

function buildStudentRows(): StudentRow[] {
  const rows: StudentRow[] = []
  for (const [offeringId, studentIds] of Object.entries(MOCK_COURSE_ENROLLMENTS)) {
    const offering = MOCK_COURSE_OFFERINGS.find(o => o.id === offeringId)
    if (!offering) continue
    const course  = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
    const term    = MOCK_PROGRAM_TERMS.find(t => t.id === offering.termId)
    for (const sid of studentIds) {
      const s = MOCK_STUDENTS.find(st => st.id === sid)
      if (!s) continue
      rows.push({
        id: `${sid}__${offeringId}`,          // unique per student+offering
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
        academicYear: term?.academicYear ?? '',
        termName:     term?.name ?? '',
        offeringCode: course?.code ?? '',
      })
    }
  }
  // Students not in any offering — still shown with blank context fields
  const seenBaseIds = new Set(rows.map(r => r.id.split('__')[0]))
  for (const s of MOCK_STUDENTS) {
    if (!seenBaseIds.has(s.id)) {
      rows.push({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        email: s.email,
        cohort: s.cohort,
        group: 'N/A',
        status: s.enrollmentStatus === 'enrolled' ? 'Active'
              : s.enrollmentStatus === 'withdrawn' ? 'Withdrawn'
              : s.enrollmentStatus === 'graduated' ? 'Graduated'
              : s.enrollmentStatus === 'on-leave'  ? 'On Leave' : 'N/A',
        _enrollmentStatus: s.enrollmentStatus,
        academicYear: '',
        termName: '',
        offeringCode: '',
      })
    }
  }
  return rows
}

function buildFacultyRows(): FacultyRow[] {
  const rows: FacultyRow[] = []
  for (const offering of MOCK_COURSE_OFFERINGS) {
    const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
    const term   = MOCK_PROGRAM_TERMS.find(t => t.id === offering.termId)
    const allIds = [offering.primaryFacultyId, ...offering.collaboratorIds].filter(Boolean)
    for (const fid of allIds) {
      const f = MOCK_FACULTY.find(fc => fc.id === fid)
      if (!f) continue
      const idx = MOCK_FACULTY.indexOf(f)
      const isPrimary = fid === offering.primaryFacultyId
      rows.push({
        id: `${fid}__${offering.id}`,
        name: f.name,
        email: `${f.name.toLowerCase().replace(/[\s.]/g, '.')}@example.com`,
        status: idx % 5 === 0 ? 'N/A' : 'Active',
        profileTypes: idx % 4 === 0 ? 'N/A' : 'Faculty',
        position: ['Dean', 'Associate Dean', 'Full Professor', 'Assistant Professor', 'Director of Clinical Education', 'Department Chair'][idx % 6],
        courseRole: isPrimary ? 'Primary Faculty' : 'Additional Staff',
        academicYear: term?.academicYear ?? '',
        termName:     term?.name ?? '',
        offeringCode: course?.code ?? '',
      })
    }
  }
  // Faculty not in any offering
  const seenBaseIds = new Set(rows.map(r => r.id.split('__')[0]))
  MOCK_FACULTY.forEach((f, idx) => {
    if (!seenBaseIds.has(f.id)) {
      rows.push({
        id: f.id,
        name: f.name,
        email: `${f.name.toLowerCase().replace(/[\s.]/g, '.')}@example.com`,
        status: idx % 5 === 0 ? 'N/A' : 'Active',
        profileTypes: idx % 4 === 0 ? 'N/A' : 'Faculty',
        position: ['Dean', 'Associate Dean', 'Full Professor', 'Assistant Professor', 'Director of Clinical Education', 'Department Chair'][idx % 6],
        courseRole: '',
        academicYear: '',
        termName: '',
        offeringCode: '',
      })
    }
  })
  return rows
}

const ALL_STUDENT_ROWS = buildStudentRows()
const ALL_FACULTY_ROWS  = buildFacultyRows()
const STUDENT_COHORTS   = Array.from(new Set(MOCK_STUDENTS.map(s => s.cohort))).sort()

// ── Column definitions ──────────────────────────────────────────────────────

const CONTEXT_FILTER_COLUMNS_STUDENT: ColumnDef<StudentRow>[] = [
  {
    key: 'academicYear',
    label: 'Academic Year',
    hidden: true,
    filter: {
      type: 'select',
      icon: 'fa-calendar',
      options: ACADEMIC_YEAR_OPTIONS,
    },
  },
  {
    key: 'termName',
    label: 'Term',
    hidden: true,
    filter: {
      type: 'select',
      icon: 'fa-calendar-days',
      options: TERM_OPTIONS,
    },
  },
  {
    key: 'offeringCode',
    label: 'Course Offering',
    hidden: true,
    filter: {
      type: 'select',
      icon: 'fa-book',
      options: OFFERING_OPTIONS,
    },
  },
]

const STUDENT_COLUMNS: ColumnDef<StudentRow>[] = [
  { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
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
  ...CONTEXT_FILTER_COLUMNS_STUDENT,
]

const CONTEXT_FILTER_COLUMNS_FACULTY: ColumnDef<FacultyRow>[] = [
  {
    key: 'academicYear',
    label: 'Academic Year',
    hidden: true,
    filter: {
      type: 'select',
      icon: 'fa-calendar',
      options: ACADEMIC_YEAR_OPTIONS,
    },
  },
  {
    key: 'termName',
    label: 'Term',
    hidden: true,
    filter: {
      type: 'select',
      icon: 'fa-calendar-days',
      options: TERM_OPTIONS,
    },
  },
  {
    key: 'offeringCode',
    label: 'Course Offering',
    hidden: true,
    filter: {
      type: 'select',
      icon: 'fa-book',
      options: OFFERING_OPTIONS,
    },
  },
]

const FACULTY_COLUMNS: ColumnDef<FacultyRow>[] = [
  { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
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
  {
    key: 'courseRole',
    label: 'Course Role',
    width: 160,
    cell: (row) => <CourseRoleBadge role={row.courseRole} />,
  },
  ...CONTEXT_FILTER_COLUMNS_FACULTY,
]

// ── Component ───────────────────────────────────────────────────────────────

interface ExxatPrismSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: Set<string>
  onCommit: (recipients: PrismRecipient[]) => void
}

export function ExxatPrismSheet({ open, onOpenChange, selectedIds: initialIds, onCommit }: ExxatPrismSheetProps) {
  const [tab, setTab] = useState<Persona>('student')

  const studentState = useTableState<StudentRow>(ALL_STUDENT_ROWS, STUDENT_COLUMNS)
  const facultyState = useTableState<FacultyRow>(ALL_FACULTY_ROWS,  FACULTY_COLUMNS)

  // Reset on open
  useEffect(() => {
    if (open) {
      // Map base student IDs to row IDs (rows are id__offeringId combos)
      const studentRowIds = new Set(
        ALL_STUDENT_ROWS.filter(r => initialIds.has(r.id.split('__')[0])).map(r => r.id)
      )
      const facultyRowIds = new Set(
        ALL_FACULTY_ROWS.filter(r => initialIds.has(r.id.split('__')[0])).map(r => r.id)
      )
      studentState.setSelected(studentRowIds)
      facultyState.setSelected(facultyRowIds)
      studentState.setSearch('')
      facultyState.setSearch('')
      studentState.setActiveFilters([])
      facultyState.setActiveFilters([])
      setTab('student')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Count by unique base ID
  const selectedStudentCount = new Set([...studentState.selected].map(id => String(id).split('__')[0])).size
  const selectedFacultyCount = new Set([...facultyState.selected].map(id => String(id).split('__')[0])).size
  const selectedCount = selectedStudentCount + selectedFacultyCount

  function handleCommit() {
    const recipients: PrismRecipient[] = []
    const seenStudents = new Set<string>()
    ALL_STUDENT_ROWS.filter(r => studentState.selected.has(r.id)).forEach(r => {
      const baseId = r.id.split('__')[0]
      if (seenStudents.has(baseId)) return
      seenStudents.add(baseId)
      const s = MOCK_STUDENTS.find(st => st.id === baseId)
      if (s) recipients.push({ id: baseId, name: r.name, email: r.email, source: 'prism', subtitle: r.cohort, personaType: 'student' })
    })
    const seenFaculty = new Set<string>()
    ALL_FACULTY_ROWS.filter(r => facultyState.selected.has(r.id)).forEach(r => {
      const baseId = r.id.split('__')[0]
      if (seenFaculty.has(baseId)) return
      seenFaculty.add(baseId)
      recipients.push({ id: baseId, name: r.name, email: r.email, source: 'prism', subtitle: r.position, personaType: 'faculty' })
    })
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
          className="shrink-0 flex border-b border-border"
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
              {t === 'student' && selectedStudentCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 rounded-full" style={{ fontSize: 11, paddingInline: 6 }}>
                  {selectedStudentCount}
                </Badge>
              )}
              {t === 'faculty' && selectedFacultyCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 rounded-full" style={{ fontSize: 11, paddingInline: 6 }}>
                  {selectedFacultyCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {tab === 'student' && (
            <DataTable<StudentRow>
              data={ALL_STUDENT_ROWS}
              columns={STUDENT_COLUMNS}
              getRowId={row => row.id}
              getRowSelectionLabel={row => row.name}
              selectable
              searchable
              hideBulkActions
              state={studentState}
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
              data={ALL_FACULTY_ROWS}
              columns={FACULTY_COLUMNS}
              getRowId={row => row.id}
              getRowSelectionLabel={row => row.name}
              selectable
              searchable
              hideBulkActions
              state={facultyState}
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

function CourseRoleBadge({ role }: { role: string }) {
  if (!role) return <span className="text-sm text-muted-foreground">—</span>
  return (
    <Badge
      variant={role === 'Primary Faculty' ? 'default' : 'outline'}
      className="rounded text-xs"
      style={{ paddingInline: 8 }}
    >
      {role}
    </Badge>
  )
}
