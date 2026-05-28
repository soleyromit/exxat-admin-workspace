'use client'

import { useState } from 'react'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Input,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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

interface CourseManagementSheetProps {
  offering: CourseOffering | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CourseManagementSheet({
  offering,
  open,
  onOpenChange,
}: CourseManagementSheetProps) {
  const [facultySearch, setFacultySearch] = useState('')
  const [addedFacultyIds, setAddedFacultyIds] = useState<Set<string>>(new Set())
  const [removedCollaboratorIds, setRemovedCollaboratorIds] = useState<Set<string>>(new Set())
  const [studentSearch, setStudentSearch] = useState('')
  const [excludedStudentIds, setExcludedStudentIds] = useState<Set<string>>(new Set())

  if (!offering) return null

  const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)

  // ── Faculty ────────────────────────────────────────────────────────────────
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

  const allFaculty: Array<PceInstructor & { isPrimary: boolean; isAdded: boolean }> = [
    ...(primaryFaculty ? [{ ...primaryFaculty, isPrimary: true, isAdded: false }] : []),
    ...collaborators.map(f => ({ ...f, isPrimary: false, isAdded: false })),
    ...addedFaculty.map(f => ({ ...f, isPrimary: false, isAdded: true })),
  ]

  function removeFaculty(id: string) {
    if (addedFacultyIds.has(id)) {
      setAddedFacultyIds(prev => { const n = new Set(prev); n.delete(id); return n })
    } else {
      setRemovedCollaboratorIds(prev => new Set(prev).add(id))
    }
  }

  // ── Students ───────────────────────────────────────────────────────────────
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

  // ── Count chips ────────────────────────────────────────────────────────────
  const countChip = (n: number) => (
    <span
      className="tabular-nums text-xs font-medium rounded"
      style={{ padding: '1px 5px', background: 'var(--muted)', color: 'var(--muted-foreground)' }}
    >
      {n}
    </span>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        style={{ width: 460, maxWidth: '100vw', display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        <SheetHeader style={{ padding: '20px 20px 0' }}>
          <SheetTitle className="text-base">
            {course ? `${course.code} — ${course.name}` : 'Manage course'}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="faculty" className="flex flex-col flex-1 overflow-hidden mt-4">
          {/* Compact left-aligned tabs — no w-full, no flex-1 */}
          <TabsList style={{ marginInline: 20, justifyContent: 'flex-start' }}>
            <TabsTrigger value="faculty" className="gap-1.5">
              Faculty {countChip(allFaculty.length)}
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-1.5">
              Students {countChip(includedCount)}
            </TabsTrigger>
          </TabsList>

          {/* ── Faculty tab ─────────────────────────────────────────────────── */}
          <TabsContent value="faculty" className="flex-1 overflow-y-auto" style={{ padding: '16px 20px 0' }}>

            {/* Assigned faculty — flat border-b rows, no container card */}
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

            {/* Add instructor */}
            <div className="flex flex-col gap-2 mt-5 pb-4">
              <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                Add instructor
              </p>
              <Input
                placeholder="Search faculty by name…"
                value={facultySearch}
                onChange={e => setFacultySearch(e.target.value)}
                aria-label="Search faculty to add"
              />

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

          {/* ── Students tab ────────────────────────────────────────────────── */}
          <TabsContent value="students" className="flex-1 overflow-y-auto" style={{ padding: '16px 20px 0' }}>

            {/* Plain count line — no card, no icon, no muted box */}
            <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
              {includedCount} of {enrolledStudents.length} enrolled will receive the survey
              {excludedStudentIds.size > 0 && ` · ${excludedStudentIds.size} excluded`}
            </p>

            <div className="mb-4">
              <Input
                placeholder="Search students…"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                aria-label="Search enrolled students"
              />
            </div>

            {filteredStudents.length === 0 && sQ ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--muted-foreground)' }}>
                No students match "{studentSearch}".
              </p>
            ) : (
              filteredStudents.map((student, i) => {
                const isExcluded = excludedStudentIds.has(student.id)
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3"
                    style={{
                      paddingBlock: 9,
                      borderBottom: i < filteredStudents.length - 1 ? '1px solid var(--border)' : 'none',
                      opacity: isExcluded ? 0.45 : 1,
                    }}
                  >
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

            {/* Padding at scroll bottom */}
            <div style={{ height: 16 }} />
          </TabsContent>
        </Tabs>

        {/* Sticky footer */}
        <div
          className="shrink-0 border-t border-border flex justify-end"
          style={{ padding: '12px 20px' }}
        >
          <Button variant="default" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
