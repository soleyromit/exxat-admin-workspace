'use client'

/**
 * Faculty detail — base entity page for Exam Management.
 *
 * Tabs per BASE-ENTITIES.md (Exam Management faculty variation):
 *   Profile     — department, phone, bio, join date
 *   Teaching    — table of courses assigned (code, name, term, students, status)
 *   Assessments — table of assessments managed (title, course, status, date)
 *
 * "View full profile in Prism" link mirrors the Student detail pattern —
 * secondary context (HR data, full teaching history, etc.) lives in Prism.
 *
 * Tab variations for other products: see docs/BASE-ENTITIES.md
 */

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEntryPoint } from '@/lib/use-entry-point'
import { recordView } from '@/lib/recently-viewed'
import {
  Button, Badge, Avatar, AvatarFallback,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Separator,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  SheetFooter,
} from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { RowActions } from '@/components/data-table/row-actions'
import { SiteHeader } from '@/components/site-header'
import { allFaculty, type ExtendedFaculty, type FacultyCourse, type FacultyAssessment } from '@/lib/faculty-mock-data'
import { courseOfferingRows, type CourseOfferingRow } from '@/lib/course-mock-data'

// ── Mock QB folders owned by faculty — production derives from QB folder ownership ──

const MOCK_QB_FOLDERS_BY_FACULTY: Record<string, { id: string; name: string; course: string; questionCount: number }[]> = {
  'fac-001': [
    { id: 'f1', name: 'Pharmacology I', course: 'PHAR 101', questionCount: 48 },
    { id: 'f2', name: 'Drug Interactions', course: 'PHAR 101', questionCount: 22 },
  ],
  'fac-002': [
    { id: 'f3', name: 'Cardiology', course: 'BIOL 201', questionCount: 31 },
  ],
}

// ── Mock pending reviews — assessments this faculty has been asked to review ──

const MOCK_PENDING_REVIEWS_BY_FACULTY: Record<string, { id: string; title: string; course: string; requestedBy: string; requestedAt: string }[]> = {
  'fac-001': [
    { id: 'r1', title: 'Midterm 1 — Spring 2026', course: 'PHAR 101', requestedBy: 'Dr. Chen', requestedAt: '2026-05-18' },
  ],
}

// ── Status configs ────────────────────────────────────────────────────────────

const COURSE_STATUS_CONFIG = {
  active:    { label: 'Active',    icon: 'fa-circle-dot',   bg: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', fg: 'var(--brand-color)' },
  completed: { label: 'Completed', icon: 'fa-circle-check', bg: 'var(--qb-status-saved-bg)',  fg: 'var(--qb-status-saved-fg)' },
  upcoming:  { label: 'Upcoming',  icon: 'fa-clock',        bg: 'var(--muted)',               fg: 'var(--muted-foreground)' },
}

const ASSESSMENT_STATUS_CONFIG: Record<string, { bg: string; fg: string }> = {
  'Draft':            { bg: 'var(--muted)',               fg: 'var(--muted-foreground)' },
  'Pending Review':   { bg: 'color-mix(in oklch, var(--chart-4) 12%, var(--background))', fg: 'var(--chart-4)' },
  'Changes Requested':{ bg: 'color-mix(in oklch, var(--destructive) 10%, var(--background))', fg: 'var(--destructive)' },
  'Approved':         { bg: 'var(--qb-status-saved-bg)',  fg: 'var(--qb-status-saved-fg)' },
  'In Progress':      { bg: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', fg: 'var(--brand-color)' },
  'Results Published':{ bg: 'color-mix(in oklch, var(--chart-2) 12%, var(--background))', fg: 'var(--chart-2)' },
}

function assessmentStatusStyle(status: string): { bg: string; fg: string } {
  return ASSESSMENT_STATUS_CONFIG[status] ?? { bg: 'var(--muted)', fg: 'var(--muted-foreground)' }
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab({ faculty, isPrism }: { faculty: ExtendedFaculty; isPrism: boolean }) {
  const pendingReviewCount = (MOCK_PENDING_REVIEWS_BY_FACULTY[faculty.id] ?? []).length
  const qbFolderCount = (MOCK_QB_FOLDERS_BY_FACULTY[faculty.id] ?? []).length

  return (
    <div className="flex flex-col gap-5">

      {/* Quick outcome stats — blended with identity so Profile feels active, not just static */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: 'fa-graduation-cap',  label: 'Courses',         value: faculty.courses.length },
          { icon: 'fa-clipboard-list',  label: 'Assessments',     value: faculty.assessmentsManaged.length },
          { icon: 'fa-clock',           label: 'Pending reviews', value: pendingReviewCount },
          { icon: 'fa-folder',          label: 'QB folders',      value: qbFolderCount },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card px-4 py-4 flex items-center gap-3"
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))' }}
            >
              <i
                className={`fa-light ${stat.icon}`}
                aria-hidden="true"
                style={{ fontSize: 15, color: 'var(--brand-color)' }}
              />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-5">

        {/* Core details */}
        <section aria-labelledby="profile-heading" className="rounded-xl border border-border bg-card p-5">
          <h2 id="profile-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Profile
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-0.5">Department</dt>
              <dd className="text-sm text-foreground">{faculty.department}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-0.5">Administrative Position</dt>
              <dd className="text-sm text-foreground">{faculty.adminPosition}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-0.5">Faculty Rank</dt>
              <dd className="text-sm text-foreground">{faculty.rank}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-0.5">Date Joined</dt>
              <dd className="text-sm text-foreground">
                {new Date(faculty.joinDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </dd>
            </div>
            {faculty.phone && (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-0.5">Phone</dt>
                <dd className="text-sm text-foreground font-mono">{faculty.phone}</dd>
              </div>
            )}
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-0.5">Email</dt>
              <dd className="text-sm text-foreground">
                <a
                  href={`mailto:${faculty.email}`}
                  className="hover:underline"
                  style={{ color: 'var(--brand-color)' }}
                >
                  {faculty.email}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        {/* Bio — only if present */}
        {faculty.bio && (
          <section aria-labelledby="bio-heading" className="rounded-xl border border-border bg-card p-5">
            <h2 id="bio-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3">Bio</h2>
            <p className="text-sm text-foreground leading-relaxed">{faculty.bio}</p>
          </section>
        )}
      </div>

      {/* Right column — Prism link */}
      {isPrism && (
        <div className="flex flex-col gap-5">
          <div
            className="rounded-xl border border-border p-4 flex items-start gap-3"
            style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 4%, var(--background))' }}
          >
            <i
              className="fa-light fa-arrow-up-right-from-square mt-0.5"
              aria-hidden="true"
              style={{ fontSize: 13, color: 'var(--brand-color)', flexShrink: 0 }}
            />
            <div>
              <p className="text-sm font-medium text-foreground">Full faculty profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                HR records, tenure history, communications, and payroll data live in Prism.
              </p>
              <a
                href="#prism-faculty-profile"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-xs font-medium mt-2 no-underline hover:underline"
                style={{ color: 'var(--brand-color)' }}
              >
                View in Prism
                <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 10 }} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

// ── Teaching tab ──────────────────────────────────────────────────────────────

interface CourseRow extends Record<string, unknown> {
  id: string
  code: string
  name: string
  term: string
  students: number
  status: keyof typeof COURSE_STATUS_CONFIG
}

function buildCourseColumns(onRemove: (id: string) => void): ColumnDef<CourseRow>[] {
  return [
    {
      key: 'courseName',
      label: 'Course',
      sortable: true,
      width: 280,
      cell: (row) => (
        <div>
          <Link href={`/courses/${row.id as string}`}
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--brand-color)' }}>
            {row.name as string}
          </Link>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{row.code as string}</p>
        </div>
      ),
    },
    {
      key: 'term',
      label: 'Term',
      sortable: true,
      width: 140,
      cell: (row) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">{row.term as string}</span>
      ),
    },
    {
      key: 'students',
      label: 'Students',
      sortable: true,
      width: 100,
      cell: (row) => (
        <span className="text-sm text-foreground tabular-nums">{row.students as number}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: 140,
      cell: (row) => {
        const cfg = COURSE_STATUS_CONFIG[row.status as keyof typeof COURSE_STATUS_CONFIG]
        return (
          <Badge
            variant="secondary"
            className="rounded-full text-xs font-semibold gap-1 px-2"
            style={{ backgroundColor: cfg.bg, color: cfg.fg }}
          >
            <i className={`fa-light ${cfg.icon}`} aria-hidden="true" style={{ fontSize: 9 }} />
            {cfg.label}
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
              label: 'View Course',
              icon: 'fa-arrow-right',
              onClick: (r) => { window.location.href = `/courses/${r.id as string}` },
            },
            {
              label: 'Remove Course',
              icon: 'fa-minus-circle',
              variant: 'destructive',
              divider: true,
              onClick: (r) => onRemove(r.id as string),
            },
          ]}
        />
      ),
    },
  ]
}

// ── Add Course Sheet ──────────────────────────────────────────────────────────

const OFFERING_STATUS_CONFIG = {
  ongoing:   { label: 'Ongoing',   bg: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', fg: 'var(--brand-color)' },
  completed: { label: 'Completed', bg: 'var(--qb-status-saved-bg)', fg: 'var(--qb-status-saved-fg)' },
  upcoming:  { label: 'Upcoming',  bg: 'var(--muted)',               fg: 'var(--muted-foreground)' },
}

interface AddCourseSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignedCodes: string[]
  onAdd: (course: FacultyCourse) => void
}

function AddCourseSheet({ open, onOpenChange, assignedCodes, onAdd }: AddCourseSheetProps) {
  const [search, setSearch] = useState('')

  // Normalize course number for comparison (remove spaces)
  function normalize(code: string): string {
    return code.replace(/\s+/g, '').toUpperCase()
  }

  const available = useMemo<CourseOfferingRow[]>(
    () =>
      courseOfferingRows.filter(
        (co) => !assignedCodes.some((ac) => normalize(ac) === normalize(co.courseNumber))
      ),
    [assignedCodes]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return available
    return available.filter(
      (co) =>
        co.courseNumber.toLowerCase().includes(q) ||
        co.courseName.toLowerCase().includes(q) ||
        co.term.toLowerCase().includes(q) ||
        co.cohort.toLowerCase().includes(q)
    )
  }, [available, search])

  function handleAdd(co: CourseOfferingRow) {
    const course: FacultyCourse = {
      id: co.id,
      code: co.courseNumber,
      name: co.courseName,
      term: co.term,
      students: co.registeredStudents,
      status: co.status === 'ongoing' ? 'active' : co.status === 'completed' ? 'completed' : 'upcoming',
    }
    onAdd(course)
  }

  function handleClose() {
    onOpenChange(false)
    setSearch('')
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
          <SheetTitle>Add Course</SheetTitle>
          <SheetDescription>
            Select a course offering to add to this faculty member&apos;s teaching assignments.
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="px-6 pt-4 pb-3 shrink-0">
          <div
            className="flex items-center gap-2 rounded-md border px-3"
            style={{ borderColor: 'var(--border-control-35)', height: 36 }}
          >
            <i
              className="fa-light fa-magnifying-glass text-muted-foreground shrink-0"
              aria-hidden="true"
              style={{ fontSize: 13 }}
            />
            <input
              type="search"
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search course offerings to add"
            />
          </div>
        </div>

        <Separator />

        {/* Course list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <i
                className="fa-light fa-chalkboard-user text-muted-foreground text-2xl mb-3"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-foreground">No courses available</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? 'No results for your search.' : 'All course offerings are already assigned.'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1" role="list">
              {filtered.map((co) => {
                const cfg = OFFERING_STATUS_CONFIG[co.status]
                return (
                  <li
                    key={co.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{co.courseNumber}</span>
                        <Badge
                          variant="secondary"
                          className="rounded text-xs font-semibold px-1.5"
                          style={{ backgroundColor: cfg.bg, color: cfg.fg }}
                        >
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground mt-0.5 truncate">{co.courseName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {co.term} · {co.cohort} · {co.registeredStudents} students
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 text-xs"
                      onClick={() => handleAdd(co)}
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

// ── TeachingTab (now interactive) ─────────────────────────────────────────────

interface TeachingTabProps {
  courses: FacultyCourse[]
  /** Original faculty.courses array — used for level lookup even after dynamic add/remove. */
  facultyCourses: FacultyCourse[]
  onAdd: (course: FacultyCourse) => void
  onRemove: (id: string) => void
}

function TeachingTab({ courses, facultyCourses, onAdd, onRemove }: TeachingTabProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)

  const rows: CourseRow[] = courses.map((c: FacultyCourse) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    term: c.term,
    students: c.students,
    status: c.status as keyof typeof COURSE_STATUS_CONFIG,
  }))

  const assignedCodes = courses.map((c) => c.code)

  // Split courses by role — Aarti May 13: "Courses I'm managing" vs "Courses I'm contributing to"
  // Level comes from the original facultyCourses array (which carries the level field).
  // Dynamically added courses (via AddCourseSheet) default to 'viewer'.
  const coordinatorCourses = rows.filter((r: CourseRow) => {
    const fc = facultyCourses.find((c) => c.id === r.id) ?? courses.find((c) => c.id === r.id)
    return fc?.level === 'editor'
  })
  const contributorCourses = rows.filter((r: CourseRow) => {
    const fc = facultyCourses.find((c) => c.id === r.id) ?? courses.find((c) => c.id === r.id)
    return fc?.level !== 'editor'
  })

  return (
    <>
      {/* Toolbar for Add Course — sits above the split sections */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <span className="text-xs text-muted-foreground">
          {rows.length} course{rows.length !== 1 ? 's' : ''} assigned
        </span>
        <Button size="sm" className="gap-2" onClick={() => setSheetOpen(true)}>
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add Course
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <i className="fa-light fa-chalkboard text-muted-foreground text-xl" aria-hidden="true" />
          </div>
          <p className="font-semibold text-foreground">No courses assigned</p>
          <p className="text-sm text-muted-foreground mt-1">
            Use &ldquo;Add Course&rdquo; to assign course offerings.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 pt-4">
          {/* Coordinator courses */}
          <section aria-labelledby="coordinator-heading">
            <div className="flex items-center gap-2 mb-3 px-6">
              <h2 id="coordinator-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Courses I Coordinate
              </h2>
              {coordinatorCourses.length > 0 && (
                <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
                  {coordinatorCourses.length}
                </Badge>
              )}
            </div>
            {coordinatorCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6">No courses as coordinator.</p>
            ) : (
              <DataTable<CourseRow>
                data={coordinatorCourses}
                columns={buildCourseColumns(onRemove)}
                getRowId={(row) => row.id}
                selectable={false}
                searchable={false}
                showQueryControls={false}
                onRowClick={(row) => router.push(`/courses/${row.id as string}`)}
                toolbarSlot={() => (
                  <span className="text-xs text-muted-foreground">
                    {coordinatorCourses.length} course{coordinatorCourses.length !== 1 ? 's' : ''}
                  </span>
                )}
              />
            )}
          </section>

          {/* Contributor courses */}
          <section aria-labelledby="contributor-heading">
            <div className="flex items-center gap-2 mb-3 px-6">
              <h2 id="contributor-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Courses I Contribute To
              </h2>
              {contributorCourses.length > 0 && (
                <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
                  {contributorCourses.length}
                </Badge>
              )}
            </div>
            {contributorCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6">No courses as contributor.</p>
            ) : (
              <DataTable<CourseRow>
                data={contributorCourses}
                columns={buildCourseColumns(() => {})}
                getRowId={(row) => row.id}
                selectable={false}
                searchable={false}
                showQueryControls={false}
                onRowClick={(row) => router.push(`/courses/${row.id as string}`)}
                toolbarSlot={() => (
                  <span className="text-xs text-muted-foreground">
                    {contributorCourses.length} course{contributorCourses.length !== 1 ? 's' : ''}
                  </span>
                )}
              />
            )}
          </section>
        </div>
      )}

      <AddCourseSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        assignedCodes={assignedCodes}
        onAdd={(course) => {
          onAdd(course)
        }}
      />
    </>
  )
}

// ── Assessments tab ───────────────────────────────────────────────────────────

interface AssessmentRow extends Record<string, unknown> {
  id: string
  title: string
  course: string
  status: string
  date: string
}

const ASSESSMENT_COLUMNS: ColumnDef<AssessmentRow>[] = [
  {
    key: 'title',
    label: 'Assessment',
    sortable: true,
    width: 280,
    cell: (row) => (
      <span className="text-sm font-medium text-foreground">{row.title as string}</span>
    ),
  },
  {
    key: 'course',
    label: 'Course',
    sortable: true,
    width: 160,
    cell: (row) => (
      <span className="text-sm text-muted-foreground font-mono">{row.course as string}</span>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    width: 160,
    cell: (row) => {
      const style = assessmentStatusStyle(row.status as string)
      return (
        <Badge
          variant="secondary"
          className="rounded text-[10px] font-semibold px-2"
          style={{ backgroundColor: style.bg, color: style.fg }}
        >
          {row.status as string}
        </Badge>
      )
    },
  },
  {
    key: 'date',
    label: 'Date',
    sortable: true,
    width: 140,
    cell: (row) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {new Date(row.date as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    ),
  },
]

function AssessmentsTab({ faculty }: { faculty: ExtendedFaculty }) {
  const rows: AssessmentRow[] = faculty.assessmentsManaged.map((a: FacultyAssessment) => ({
    id: a.id,
    title: a.title,
    course: a.course,
    status: a.status,
    date: a.date,
  }))

  const pendingReviews = MOCK_PENDING_REVIEWS_BY_FACULTY[faculty.id] ?? []
  const qbFolders = MOCK_QB_FOLDERS_BY_FACULTY[faculty.id] ?? []

  return (
    <div className="flex flex-col">
      {/* Pending Reviews — Aarti May 19: "which reviews are they pending" */}
      {pendingReviews.length > 0 && (
        <section
          aria-labelledby="pending-reviews-heading"
          className="rounded-xl border border-border bg-card p-5 mb-4"
          style={{ borderLeft: '3px solid var(--chart-4)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <h2 id="pending-reviews-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Pending Reviews
            </h2>
            <Badge
              variant="secondary"
              className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center"
              style={{
                backgroundColor: 'color-mix(in oklch, var(--chart-4) 12%, var(--background))',
                color: 'var(--chart-4)',
              }}
            >
              {pendingReviews.length}
            </Badge>
          </div>
          <div className="flex flex-col gap-3">
            {pendingReviews.map(review => (
              <div key={review.id} className="flex items-start gap-3">
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                  style={{ backgroundColor: 'color-mix(in oklch, var(--chart-4) 12%, var(--background))' }}
                >
                  <i className="fa-light fa-clipboard-check" aria-hidden="true" style={{ fontSize: 13, color: 'var(--chart-4)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{review.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {review.course} · Requested by {review.requestedBy} ·{' '}
                    {new Date(review.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 text-xs">
                  Review
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Assessments DataTable */}
      <DataTable<AssessmentRow>
        data={rows}
        columns={ASSESSMENT_COLUMNS}
        getRowId={(row) => row.id}
        selectable={false}
        searchable={false}
        showQueryControls={false}
        toolbarSlot={() => (
          <span className="text-xs text-muted-foreground">
            {rows.length} assessment{rows.length !== 1 ? 's' : ''}
          </span>
        )}
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <i className="fa-light fa-file-check text-muted-foreground text-xl" aria-hidden="true" />
            </div>
            <p className="font-semibold text-foreground">No assessments managed</p>
            <p className="text-sm text-muted-foreground mt-1">This faculty member hasn&apos;t managed any assessments yet.</p>
          </div>
        }
      />

      {/* QB Folders owned — Aarti May 19: "which banks do they own" */}
      <section aria-labelledby="qb-folders-heading" className="rounded-xl border border-border bg-card p-5 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <h2 id="qb-folders-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
            Question Bank Folders
          </h2>
          {qbFolders.length > 0 && (
            <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
              {qbFolders.length}
            </Badge>
          )}
        </div>
        {qbFolders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No QB folders owned.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {qbFolders.map(folder => (
              <Link
                key={folder.id}
                href="/question-bank"
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 -mx-2 hover:bg-muted/60 transition-colors no-underline group"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))' }}
                >
                  <i className="fa-light fa-folder" aria-hidden="true" style={{ fontSize: 13, color: 'var(--brand-color)' }} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:underline underline-offset-2">
                    {folder.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {folder.course} · {folder.questionCount} questions
                  </p>
                </div>
                <i className="fa-light fa-arrow-up-right-from-square text-muted-foreground shrink-0" aria-hidden="true" style={{ fontSize: 10 }} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ── Status badge (header) ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  const style = status === 'active'
    ? { bg: 'var(--qb-status-saved-bg)', fg: 'var(--qb-status-saved-fg)', label: 'Active' }
    : { bg: 'var(--muted)', fg: 'var(--muted-foreground)', label: 'Inactive' }
  return (
    <Badge
      variant="secondary"
      className="rounded-full text-xs font-semibold px-3 py-1"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {style.label}
    </Badge>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FacultyDetailClient({ facultyId }: { facultyId: string }) {
  const faculty = allFaculty.find(f => f.id === facultyId)

  const [activeTab, setActiveTab] = useState('profile')
  const entryPoint = useEntryPoint()
  const isPrism = entryPoint === 'prism'

  useEffect(() => {
    if (!faculty) return
    recordView('faculty', {
      id: faculty.id,
      name: faculty.fullName,
      subtitle: faculty.adminPosition,
      href: `/faculty/${faculty.id}`,
      icon: 'fa-chalkboard-user',
    })
  }, [faculty?.id])

  // Lift courses to state so TeachingTab can add/remove interactively
  const [assignedCourses, setAssignedCourses] = useState<FacultyCourse[]>(
    faculty?.courses ?? []
  )

  function handleAddCourse(course: FacultyCourse) {
    setAssignedCourses((prev) => {
      if (prev.some((c) => c.id === course.id)) return prev
      return [...prev, course]
    })
  }

  function handleRemoveCourse(id: string) {
    setAssignedCourses((prev) => prev.filter((c) => c.id !== id))
  }

  if (!faculty) {
    return (
      <>
        <SiteHeader title="Faculty not found" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
          <i className="fa-light fa-user-slash text-muted-foreground text-4xl" aria-hidden="true" />
          <p className="font-semibold text-foreground">Faculty member not found</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/faculty">Back to Faculty</Link>
          </Button>
        </div>
      </>
    )
  }

  const initials = faculty.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)

  return (
    <>
      <SiteHeader
        title={faculty.fullName}
        breadcrumbs={[
          { label: 'Faculty', href: '/faculty' },
          { label: faculty.fullName },
        ]}
      />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none min-h-0">

        {/* ── Header strip ───────────────────────────────────────────────── */}
        <div className="border-b border-border bg-card px-6 py-5">
          <div className="flex items-start gap-4 flex-wrap">
            {/* Decorative avatar — aria-hidden; name is in the h1 */}
            <Avatar style={{ width: 52, height: 52, flexShrink: 0 }} aria-hidden="true">
              <AvatarFallback
                className="text-base font-bold"
                style={{
                  backgroundColor: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))',
                  color: 'var(--brand-color)',
                }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className="text-xl font-bold text-foreground"
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
                >
                  {faculty.fullName}
                </h1>
                <StatusBadge status={faculty.status} />
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-muted-foreground">
                <span className="font-mono text-xs">{faculty.facultyId}</span>
                <Separator orientation="vertical" style={{ height: 12 }} />
                <span>{faculty.adminPosition}</span>
                <Separator orientation="vertical" style={{ height: 12 }} />
                <span>{faculty.rank}</span>
              </div>
            </div>

            {/* "View full profile in Prism" action — Prism mode only */}
            {isPrism && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs shrink-0" asChild>
                <a href="#prism-faculty-profile" target="_blank" rel="noreferrer noopener">
                  View full profile in Prism
                  <i className="fa-light fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: 10 }} />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="border-b border-border px-6 bg-card">
              <TabsList variant="line">
                {([
                  { value: 'profile',     label: 'Profile',     icon: 'fa-circle-info' },
                  { value: 'teaching',    label: 'Teaching',    icon: 'fa-chalkboard', count: assignedCourses.length },
                  { value: 'assessments', label: 'Assessments', icon: 'fa-file-check', count: faculty.assessmentsManaged.length },
                ] as const).map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                  >
                    <i className={`fa-light ${tab.icon}`} aria-hidden="true" style={{ fontSize: 13 }} />
                    {tab.label}
                    {'count' in tab && tab.count !== undefined && tab.count > 0 && (
                      <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
                        {tab.count}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto pt-2 px-6 pb-6">
              <TabsContent value="profile"     className="mt-0 outline-none"><ProfileTab     faculty={faculty} isPrism={isPrism} /></TabsContent>
              <TabsContent value="teaching"    className="mt-0 outline-none"><TeachingTab    courses={assignedCourses} facultyCourses={faculty.courses} onAdd={handleAddCourse} onRemove={handleRemoveCourse} /></TabsContent>
              <TabsContent value="assessments" className="mt-0 outline-none"><AssessmentsTab faculty={faculty} /></TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  )
}
