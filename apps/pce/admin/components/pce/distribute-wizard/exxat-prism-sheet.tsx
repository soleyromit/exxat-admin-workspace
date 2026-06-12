'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Button,
  Badge,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
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

// ── Base data rows ─────────────────────────────────────────────────────────

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
  courseRole: string
  [key: string]: unknown
}

const ALL_STUDENT_ROWS: StudentRow[] = MOCK_STUDENTS.map(s => ({
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
  courseRole: '',
})) satisfies FacultyRow[]

const STUDENT_COHORTS = Array.from(new Set(MOCK_STUDENTS.map(s => s.cohort))).sort()

// ── Column definitions ──────────────────────────────────────────────────────

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
]

function buildFacultyColumns(showCourseRole: boolean): ColumnDef<FacultyRow>[] {
  const cols: ColumnDef<FacultyRow>[] = [
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
  ]

  if (showCourseRole) {
    cols.push({
      key: 'courseRole',
      label: 'Course Role',
      width: 160,
      cell: (row) => <CourseRoleBadge role={row.courseRole} />,
    })
  }

  return cols
}

// ── Derived data helpers ────────────────────────────────────────────────────

function getStudentsForOffering(offeringId: string): StudentRow[] {
  const enrolledIds = new Set(MOCK_COURSE_ENROLLMENTS[offeringId] ?? [])
  return ALL_STUDENT_ROWS.filter(r => enrolledIds.has(r.id))
}

function getFacultyForOffering(offeringId: string): FacultyRow[] {
  const offering = MOCK_COURSE_OFFERINGS.find(o => o.id === offeringId)
  if (!offering) return []
  const result: FacultyRow[] = []
  FACULTY_EXTENDED.forEach(f => {
    if (f.id === offering.primaryFacultyId) {
      result.push({ ...f, courseRole: 'Primary Faculty' })
    } else if (offering.collaboratorIds.includes(f.id)) {
      result.push({ ...f, courseRole: 'Additional Staff' })
    }
  })
  return result
}

// ── Component ───────────────────────────────────────────────────────────────

interface ExxatPrismSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: Set<string>
  onCommit: (recipients: PrismRecipient[]) => void
}

const DEFAULT_TERM_ID = MOCK_PROGRAM_TERMS.find(t => t.status === 'active')?.id ?? MOCK_PROGRAM_TERMS[0]?.id ?? ''

export function ExxatPrismSheet({ open, onOpenChange, selectedIds: initialIds, onCommit }: ExxatPrismSheetProps) {
  const [tab, setTab] = useState<Persona>('student')

  // ── Context filters ────────────────────────────────────────────────────
  const [termId, setTermId] = useState(DEFAULT_TERM_ID)
  const [offeringId, setOfferingId] = useState<string>('all')

  const selectedTerm = useMemo(() => MOCK_PROGRAM_TERMS.find(t => t.id === termId), [termId])

  // Group terms by academic year for the academic year select
  const academicYears = useMemo(
    () => Array.from(new Set(MOCK_PROGRAM_TERMS.map(t => t.academicYear))).sort().reverse(),
    []
  )
  const [academicYear, setAcademicYear] = useState<string>(selectedTerm?.academicYear ?? '')

  // Terms filtered to the selected academic year
  const termsForYear = useMemo(
    () => MOCK_PROGRAM_TERMS.filter(t => t.academicYear === academicYear),
    [academicYear]
  )

  // Sync termId when academic year changes to first term in that year
  useEffect(() => {
    const first = termsForYear[0]
    if (first) setTermId(first.id)
  }, [academicYear]) // eslint-disable-line react-hooks/exhaustive-deps

  // Offerings for the selected term
  const offeringsForTerm = useMemo(
    () => MOCK_COURSE_OFFERINGS.filter(o => o.termId === termId),
    [termId]
  )

  // Reset offering when term changes
  useEffect(() => {
    setOfferingId('all')
  }, [termId])

  // ── Derived rows based on filters ─────────────────────────────────────
  const studentRows = useMemo(
    () => offeringId === 'all' ? ALL_STUDENT_ROWS : getStudentsForOffering(offeringId),
    [offeringId]
  )

  const facultyRows = useMemo(
    () => offeringId === 'all' ? FACULTY_EXTENDED : getFacultyForOffering(offeringId),
    [offeringId]
  )

  const showCourseRole = offeringId !== 'all'
  const facultyColumns = useMemo(() => buildFacultyColumns(showCourseRole), [showCourseRole])

  // ── Table states ───────────────────────────────────────────────────────
  // studentRows/facultyRows are memo values; useTableState re-derives rows each render
  const studentState = useTableState<StudentRow>(studentRows, STUDENT_COLUMNS)
  const facultyState = useTableState<FacultyRow>(facultyRows, facultyColumns)

  // Reset on open
  useEffect(() => {
    if (open) {
      setTermId(DEFAULT_TERM_ID)
      const defaultTerm = MOCK_PROGRAM_TERMS.find(t => t.id === DEFAULT_TERM_ID)
      setAcademicYear(defaultTerm?.academicYear ?? '')
      setOfferingId('all')
      studentState.setSelected(new Set(ALL_STUDENT_ROWS.filter(r => initialIds.has(r.id)).map(r => r.id)))
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
    ALL_STUDENT_ROWS.filter(r => studentState.selected.has(r.id)).forEach(r =>
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

        {/* Context filters */}
        <div
          className="shrink-0 flex items-center gap-2 flex-wrap border-b border-border"
          style={{ padding: '10px 20px' }}
        >
          <i className="fa-light fa-filter text-xs shrink-0" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />

          {/* Academic Year */}
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger className="h-8 text-xs" style={{ minWidth: 130 }} aria-label="Academic year">
              <SelectValue placeholder="Academic year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Term */}
          <Select value={termId} onValueChange={setTermId}>
            <SelectTrigger className="h-8 text-xs" style={{ minWidth: 130 }} aria-label="Term">
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              {termsForYear.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Course Offering */}
          <Select value={offeringId} onValueChange={setOfferingId}>
            <SelectTrigger className="h-8 text-xs" style={{ minWidth: 180 }} aria-label="Course offering">
              <SelectValue placeholder="All course offerings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All course offerings</SelectItem>
              {offeringsForTerm.map(o => {
                const course = MOCK_MASTER_COURSES.find(c => c.id === o.masterCourseId)
                const faculty = MOCK_FACULTY.find(f => f.id === o.primaryFacultyId)
                return (
                  <SelectItem key={o.id} value={o.id}>
                    {course?.code} — {course?.name}
                    {faculty ? ` · ${faculty.name}` : ''}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {offeringId !== 'all' && (
            <button
              type="button"
              className="text-xs hover:underline underline-offset-2"
              style={{ color: 'var(--muted-foreground)' }}
              onClick={() => setOfferingId('all')}
              aria-label="Clear course offering filter"
            >
              Clear
            </button>
          )}
        </div>

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
              {t === 'student' && studentState.selected.size > 0 && (
                <Badge variant="secondary" className="ml-1.5 rounded-full" style={{ fontSize: 11, paddingInline: 6 }}>
                  {studentState.selected.size}
                </Badge>
              )}
              {t === 'faculty' && facultyState.selected.size > 0 && (
                <Badge variant="secondary" className="ml-1.5 rounded-full" style={{ fontSize: 11, paddingInline: 6 }}>
                  {facultyState.selected.size}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {tab === 'student' && (
            <DataTable<StudentRow>
              data={studentRows}
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
                  <p className="text-sm text-muted-foreground">
                    {offeringId !== 'all' ? 'No students enrolled in this course offering' : 'No students match your filters'}
                  </p>
                </div>
              }
            />
          )}

          {tab === 'faculty' && (
            <DataTable<FacultyRow>
              data={facultyRows}
              columns={facultyColumns}
              getRowId={row => row.id}
              getRowSelectionLabel={row => row.name}
              selectable
              searchable
              hideBulkActions
              state={facultyState}
              emptyState={
                <div className="flex flex-col items-center gap-2 py-10">
                  <i className="fa-light fa-chalkboard-user text-muted-foreground text-2xl" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    {offeringId !== 'all' ? 'No faculty assigned to this course offering' : 'No faculty match your filters'}
                  </p>
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
