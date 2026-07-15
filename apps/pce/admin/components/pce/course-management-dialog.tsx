'use client'

import { useState } from 'react'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DatePickerField,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  InputGroup,
  InputGroupAddon,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@exxatdesignux/ui'
import {
  MOCK_FACULTY,
  MOCK_STUDENTS,
  MOCK_COURSE_ENROLLMENTS,
  MOCK_MASTER_COURSES,
  type CourseOffering,
  type PceInstructor,
} from '@/lib/pce-mock-data'

interface CourseManagementDialogProps {
  offering: CourseOffering | null
  open: boolean
  onOpenChange: (open: boolean) => void
  globalOpenDate?: Date
  globalCloseDate?: Date
  onApplyDatesToAll?: (open: Date | undefined, close: Date | undefined) => void
}

export function CourseManagementDialog({
  offering,
  open,
  onOpenChange,
  globalOpenDate,
  globalCloseDate,
  onApplyDatesToAll,
}: CourseManagementDialogProps) {
  const [facultySearch, setFacultySearch] = useState('')
  const [addedFacultyIds, setAddedFacultyIds] = useState<Set<string>>(new Set())
  const [removedCollaboratorIds, setRemovedCollaboratorIds] = useState<Set<string>>(new Set())
  const [studentSearch, setStudentSearch] = useState('')
  const [excludedStudentIds, setExcludedStudentIds] = useState<Set<string>>(new Set())
  const [courseOpenDate, setCourseOpenDate] = useState<Date | undefined>(globalOpenDate)
  const [courseCloseDate, setCourseCloseDate] = useState<Date | undefined>(globalCloseDate)
  const [applyToAllDone, setApplyToAllDone] = useState(false)

  function handleApplyToAll() {
    onApplyDatesToAll?.(courseOpenDate, courseCloseDate)
    setApplyToAllDone(true)
    setTimeout(() => setApplyToAllDone(false), 2500)
  }

  if (!offering) return null

  const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)

  // ── Faculty ──────────────────────────────────────────────────────────────────
  const primaryFaculty = MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId)

  const collaborators = offering.collaboratorIds
    .filter(id => !removedCollaboratorIds.has(id))
    .map(id => MOCK_FACULTY.find(f => f.id === id))
    .filter(Boolean) as PceInstructor[]

  const addedFaculty = [...addedFacultyIds]
    .map(id => MOCK_FACULTY.find(f => f.id === id))
    .filter(Boolean) as PceInstructor[]

  const assignedFacultyIds = new Set([
    offering.primaryFacultyId,
    ...offering.collaboratorIds.filter(id => !removedCollaboratorIds.has(id)),
    ...addedFacultyIds,
  ])

  const fQ = facultySearch.toLowerCase().trim()
  const facultySearchResults = fQ
    ? MOCK_FACULTY.filter(f => !assignedFacultyIds.has(f.id) && f.name.toLowerCase().includes(fQ))
    : []

  const allFaculty: Array<PceInstructor & { isPrimary: boolean }> = [
    ...(primaryFaculty ? [{ ...primaryFaculty, isPrimary: true }] : []),
    ...collaborators.map(f => ({ ...f, isPrimary: false })),
    ...addedFaculty.map(f => ({ ...f, isPrimary: false })),
  ]

  function removeFaculty(id: string) {
    if (addedFacultyIds.has(id)) {
      setAddedFacultyIds(prev => { const n = new Set(prev); n.delete(id); return n })
    } else {
      setRemovedCollaboratorIds(prev => new Set(prev).add(id))
    }
  }

  // ── Students ─────────────────────────────────────────────────────────────────
  const enrolledIds = MOCK_COURSE_ENROLLMENTS[offering.id] ?? []
  const enrolledStudents = enrolledIds
    .map(id => MOCK_STUDENTS.find(s => s.id === id))
    .filter(Boolean) as typeof MOCK_STUDENTS

  const sQ = studentSearch.toLowerCase().trim()
  const filteredStudents = sQ
    ? enrolledStudents.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(sQ) ||
        s.email.toLowerCase().includes(sQ)
      )
    : enrolledStudents

  const includedCount = enrolledStudents.filter(s => !excludedStudentIds.has(s.id)).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {course ? `${course.code} — ${course.name}` : 'Manage course'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="faculty">
          <TabsList variant="line">
            <TabsTrigger value="faculty" className="gap-1.5">
              Faculty
              <span className="tabular-nums text-xs font-medium rounded" style={{ padding: '1px 5px', background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                {allFaculty.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-1.5">
              Students
              <span className="tabular-nums text-xs font-medium rounded" style={{ padding: '1px 5px', background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                {includedCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="dates">Dates</TabsTrigger>
          </TabsList>

          {/* ── Faculty ────────────────────────────────────────────────────── */}
          <TabsContent value="faculty" className="mt-3 outline-none" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {allFaculty.length === 0 ? (
              <p className="text-sm py-4" style={{ color: 'var(--muted-foreground)' }}>
                No faculty assigned to this course.
              </p>
            ) : (
              allFaculty.map((f, i) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3"
                  style={{
                    paddingBlock: 10,
                    borderBottom: i < allFaculty.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                    <AvatarFallback style={{ fontSize: 11, fontWeight: 600, backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
                      {f.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm flex-1">{f.name}</span>
                  {f.isPrimary ? (
                    <Badge variant="secondary" className="text-xs shrink-0">Coordinator</Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => removeFaculty(f.id)}
                    >
                      <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              ))
            )}

            {/* Add faculty — the search adds any faculty (coordinator, TA, lab
                instructor), so the heading must not name a single role. */}
            <div className="flex flex-col gap-2 mt-4 pb-1">
              <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                Add faculty
              </p>
              <InputGroup>
                <Input
                  placeholder="Search faculty by name…"
                  value={facultySearch}
                  onChange={e => setFacultySearch(e.target.value)}
                  aria-label="Search faculty to add"
                />
                <InputGroupAddon align="inline-end">
                  <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
                </InputGroupAddon>
              </InputGroup>
              {fQ && facultySearchResults.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  No results for "{facultySearch}".
                </p>
              )}
              {facultySearchResults.map((f, i) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3"
                  style={{
                    paddingBlock: 9,
                    borderBottom: i < facultySearchResults.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                    <AvatarFallback style={{ fontSize: 11, fontWeight: 600, backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
                      {f.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm flex-1">{f.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Add ${f.name}`}
                    onClick={() => {
                      setAddedFacultyIds(prev => new Set(prev).add(f.id))
                      setFacultySearch('')
                    }}
                  >
                    <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── Students ───────────────────────────────────────────────────── */}
          <TabsContent value="students" className="mt-3 outline-none" style={{ maxHeight: 300, overflowY: 'auto' }}>
            <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
              {includedCount} of {enrolledStudents.length} enrolled will receive the survey
              {excludedStudentIds.size > 0 && ` · ${excludedStudentIds.size} excluded`}
            </p>
            <InputGroup className="mb-3">
              <Input
                placeholder="Search students…"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                aria-label="Search enrolled students"
              />
              <InputGroupAddon align="inline-end">
                <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
              </InputGroupAddon>
            </InputGroup>
            {filteredStudents.length === 0 && sQ ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--muted-foreground)' }}>
                No students match "{studentSearch}".
              </p>
            ) : (
              filteredStudents.map((student, i) => {
                const isExcluded = excludedStudentIds.has(student.id)
                const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3"
                    style={{
                      paddingBlock: 8,
                      borderBottom: i < filteredStudents.length - 1 ? '1px solid var(--border)' : 'none',
                      opacity: isExcluded ? 0.45 : 1,
                    }}
                  >
                    <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                      <AvatarFallback style={{ fontSize: 11, fontWeight: 600, backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span
                        className="text-sm font-medium"
                        style={{ textDecoration: isExcluded ? 'line-through' : 'none' }}
                      >
                        {student.firstName} {student.lastName}
                      </span>
                      <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                        {student.email}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExcludedStudentIds(prev => {
                          const n = new Set(prev)
                          n.has(student.id) ? n.delete(student.id) : n.add(student.id)
                          return n
                        })
                      }
                      aria-label={isExcluded
                        ? `Include ${student.firstName} ${student.lastName}`
                        : `Exclude ${student.firstName} ${student.lastName}`}
                      style={isExcluded ? { color: 'var(--brand-color)' } : { color: 'var(--muted-foreground)' }}
                    >
                      {isExcluded ? 'Include' : 'Exclude'}
                    </Button>
                  </div>
                )
              })
            )}
          </TabsContent>

          {/* ── Dates ──────────────────────────────────────────────────────── */}
          <TabsContent value="dates" className="mt-3 outline-none">
            <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Override open and close dates for this course only, or apply to all courses in this cycle.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Opens on
                </label>
                <DatePickerField value={courseOpenDate} onChange={setCourseOpenDate} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Closes on
                </label>
                <DatePickerField value={courseCloseDate} onChange={setCourseCloseDate} />
              </div>
              <div className="border-t border-border pt-3 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleApplyToAll}
                  disabled={!courseOpenDate && !courseCloseDate}
                >
                  <i className="fa-light fa-arrow-right-to-bracket" aria-hidden="true" style={{ fontSize: 11 }} />
                  Apply dates to all courses
                </Button>
                {applyToAllDone && (
                  <p className="text-xs text-center" style={{ color: 'var(--chart-2)' }}>
                    <i className="fa-light fa-circle-check mr-1" aria-hidden="true" />
                    Applied to all courses.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
