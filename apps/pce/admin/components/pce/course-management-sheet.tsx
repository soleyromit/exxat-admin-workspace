'use client'

import { useState } from 'react'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@exxat/ds/packages/ui/src'
import {
  MOCK_FACULTY,
  MOCK_STUDENTS,
  MOCK_COURSE_ENROLLMENTS,
  MOCK_MASTER_COURSES,
  type CourseOffering,
  type PceInstructor,
  type PceTemplate,
} from '@/lib/pce-mock-data'

interface CourseManagementSheetProps {
  offering: CourseOffering | null
  open: boolean
  onOpenChange: (open: boolean) => void
  publishedTemplates?: PceTemplate[]
  templateAssignments?: Record<string, string>
  onTemplateChange?: (offeringId: string, tmplId: string) => void
}

const STATUS_LABELS: Record<string, string> = {
  enrolled: 'Enrolled',
  'on-leave': 'On leave',
  withdrawn: 'Withdrawn',
  graduated: 'Graduated',
}

export function CourseManagementSheet({
  offering,
  open,
  onOpenChange,
  publishedTemplates = [],
  templateAssignments = {},
  onTemplateChange,
}: CourseManagementSheetProps) {
  const [facultySearch, setFacultySearch] = useState('')
  const [addedFacultyIds, setAddedFacultyIds] = useState<Set<string>>(new Set())
  const [removedCollaboratorIds, setRemovedCollaboratorIds] = useState<Set<string>>(new Set())

  const [studentSearch, setStudentSearch] = useState('')
  const [excludedStudentIds, setExcludedStudentIds] = useState<Set<string>>(new Set())
  const [addedStudentIds, setAddedStudentIds] = useState<Set<string>>(new Set())

  if (!offering) return null

  const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)

  // ── Faculty ───────────────────────────────────────────────────────────────
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

  function toggleFacultyAdd(id: string) {
    setAddedFacultyIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function removeFaculty(id: string) {
    if (addedFacultyIds.has(id)) {
      setAddedFacultyIds(prev => { const n = new Set(prev); n.delete(id); return n })
    } else {
      setRemovedCollaboratorIds(prev => new Set(prev).add(id))
    }
  }

  // ── Students ──────────────────────────────────────────────────────────────
  const enrolledIds = MOCK_COURSE_ENROLLMENTS[offering.id] ?? []
  const enrolledStudents = enrolledIds
    .map(id => MOCK_STUDENTS.find(s => s.id === id))
    .filter(Boolean) as typeof MOCK_STUDENTS

  const unenrolledSearchable = MOCK_STUDENTS.filter(
    s => !enrolledIds.includes(s.id) && s.enrollmentStatus !== 'withdrawn'
  )

  const sQ = studentSearch.toLowerCase().trim()
  const filteredEnrolled = sQ
    ? enrolledStudents.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(sQ) ||
        s.email.toLowerCase().includes(sQ)
      )
    : enrolledStudents
  const filteredUnenrolled = sQ
    ? unenrolledSearchable.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(sQ) ||
        s.email.toLowerCase().includes(sQ)
      )
    : []

  const includedStudentCount =
    enrolledStudents.filter(s => !excludedStudentIds.has(s.id)).length + addedStudentIds.size

  function toggleStudentExclude(id: string) {
    setExcludedStudentIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleStudentAdd(id: string) {
    setAddedStudentIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Template ──────────────────────────────────────────────────────────────
  const assignedTemplateId = templateAssignments[offering.id] ?? ''
  const totalAssigned = 1 + collaborators.length + addedFaculty.length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent style={{ width: 480, maxWidth: '100vw' }}>
        <SheetHeader>
          <SheetTitle>
            {course ? `${course.code} — ${course.name}` : 'Manage course'}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
          <Tabs defaultValue="faculty">
            <TabsList className="w-full">
              <TabsTrigger value="faculty" className="flex-1 gap-1.5">
                Faculty
                <span
                  className="rounded-full text-xs font-medium tabular-nums"
                  style={{ padding: '1px 6px', background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                >
                  {totalAssigned}
                </span>
              </TabsTrigger>
              <TabsTrigger value="students" className="flex-1 gap-1.5">
                Students
                <span
                  className="rounded-full text-xs font-medium tabular-nums"
                  style={{ padding: '1px 6px', background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                >
                  {includedStudentCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="template" className="flex-1 gap-1.5">
                Template
                {!assignedTemplateId && publishedTemplates.length > 0 && (
                  <i
                    className="fa-solid fa-triangle-exclamation text-xs"
                    aria-label="No template assigned"
                    style={{ color: 'var(--chart-4)' }}
                  />
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Faculty tab ─────────────────────────────────────────────── */}
            <TabsContent value="faculty" className="flex flex-col gap-4 pt-4">
              <div
                className="flex flex-col rounded-xl border border-border overflow-hidden"
                style={{ background: 'var(--card)' }}
              >
                {/* Primary coordinator — cannot be removed */}
                {primaryFaculty && (
                  <div
                    className="flex items-center gap-3"
                    style={{
                      padding: '10px 14px',
                      borderBottom: totalAssigned > 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <Avatar style={{ width: 32, height: 32, flexShrink: 0 }}>
                      <AvatarFallback
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: 'var(--avatar-initials-bg)',
                          color: 'var(--avatar-initials-fg)',
                        }}
                      >
                        {primaryFaculty.initials}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm flex-1">{primaryFaculty.name}</p>
                    <Badge variant="secondary" className="text-xs shrink-0">Coordinator</Badge>
                  </div>
                )}

                {/* Collaborators */}
                {[...collaborators, ...addedFaculty].map((f, i, arr) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3"
                    style={{
                      padding: '10px 14px',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <Avatar style={{ width: 32, height: 32, flexShrink: 0 }}>
                      <AvatarFallback
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: addedFaculty.includes(f) ? 'var(--brand-tint)' : 'var(--avatar-initials-bg)',
                          color: addedFaculty.includes(f) ? 'var(--brand-color)' : 'var(--avatar-initials-fg)',
                        }}
                      >
                        {f.initials}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm flex-1">{f.name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => removeFaculty(f.id)}
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 12 }} />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Search to add */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Add instructor
                </p>
                <div
                  className="flex items-center gap-2 rounded-md"
                  style={{
                    padding: '6px 10px',
                    border: '1px solid var(--border-control-35)',
                    background: 'var(--card)',
                  }}
                >
                  <i className="fa-light fa-magnifying-glass text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
                  <input
                    type="text"
                    placeholder="Search faculty by name…"
                    value={facultySearch}
                    onChange={e => setFacultySearch(e.target.value)}
                    className="bg-transparent text-sm outline-none flex-1"
                    style={{ color: 'var(--foreground)' }}
                    aria-label="Search faculty to add"
                  />
                </div>

                {fQ && facultySearchResults.length === 0 && (
                  <p className="text-xs py-2" style={{ color: 'var(--muted-foreground)' }}>
                    No faculty found for "{facultySearch}".
                  </p>
                )}

                {facultySearchResults.length > 0 && (
                  <div
                    className="flex flex-col rounded-xl border border-border overflow-hidden"
                    style={{ background: 'var(--card)' }}
                  >
                    {facultySearchResults.map((f, i) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-3"
                        style={{
                          padding: '9px 14px',
                          borderBottom: i < facultySearchResults.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                          <AvatarFallback
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              backgroundColor: 'var(--avatar-initials-bg)',
                              color: 'var(--avatar-initials-fg)',
                            }}
                          >
                            {f.initials}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-sm flex-1">{f.name}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Add ${f.name}`}
                          onClick={() => { toggleFacultyAdd(f.id); setFacultySearch('') }}
                        >
                          <i className="fa-light fa-user-plus" aria-hidden="true" style={{ fontSize: 12 }} />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Students tab ────────────────────────────────────────────── */}
            <TabsContent value="students" className="flex flex-col gap-4 pt-4">
              <div
                className="flex items-center gap-2 rounded-lg"
                style={{ padding: '10px 14px', background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <i className="fa-light fa-users" aria-hidden="true" style={{ fontSize: 14, color: 'var(--brand-color)' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{includedStudentCount} will receive the survey</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {offering.enrolledCount} enrolled
                    {excludedStudentIds.size > 0 ? ` · ${excludedStudentIds.size} excluded` : ' · all included'}
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-2 rounded-md"
                style={{ padding: '6px 10px', border: '1px solid var(--border-control-35)', background: 'var(--card)' }}
              >
                <i className="fa-light fa-magnifying-glass text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search to filter or add students…"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none flex-1"
                  style={{ color: 'var(--foreground)' }}
                  aria-label="Search students"
                />
              </div>

              {filteredEnrolled.length > 0 && (
                <div className="flex flex-col">
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
                    Enrolled students
                  </p>
                  <div
                    className="flex flex-col rounded-xl border border-border overflow-hidden"
                    style={{ background: 'var(--card)' }}
                  >
                    {filteredEnrolled.map((student, i) => {
                      const isExcluded = excludedStudentIds.has(student.id)
                      return (
                        <div
                          key={student.id}
                          className="flex items-center gap-3"
                          style={{
                            padding: '10px 14px',
                            borderBottom: i < filteredEnrolled.length - 1 ? '1px solid var(--border)' : 'none',
                            background: isExcluded ? 'var(--muted)' : 'var(--card)',
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
                          {student.enrollmentStatus !== 'enrolled' && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {STATUS_LABELS[student.enrollmentStatus] ?? student.enrollmentStatus}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={
                              isExcluded
                                ? `Include ${student.firstName} ${student.lastName}`
                                : `Exclude ${student.firstName} ${student.lastName}`
                            }
                            onClick={() => toggleStudentExclude(student.id)}
                            style={isExcluded ? { color: 'var(--chart-4)' } : {}}
                          >
                            <i
                              className={`fa-light fa-${isExcluded ? 'user-plus' : 'user-minus'}`}
                              aria-hidden="true"
                              style={{ fontSize: 12 }}
                            />
                            {isExcluded ? 'Include' : 'Exclude'}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {sQ && filteredUnenrolled.length > 0 && (
                <div className="flex flex-col">
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
                    Add from directory
                  </p>
                  <div
                    className="flex flex-col rounded-xl border border-border overflow-hidden"
                    style={{ background: 'var(--card)' }}
                  >
                    {filteredUnenrolled.map((student, i) => {
                      const isAdded = addedStudentIds.has(student.id)
                      return (
                        <div
                          key={student.id}
                          className="flex items-center gap-3"
                          style={{
                            padding: '10px 14px',
                            borderBottom: i < filteredUnenrolled.length - 1 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-medium">
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                              {student.cohort} · {student.email}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {STATUS_LABELS[student.enrollmentStatus] ?? student.enrollmentStatus}
                          </Badge>
                          <Button
                            variant={isAdded ? 'outline' : 'ghost'}
                            size="sm"
                            aria-label={
                              isAdded
                                ? `Remove ${student.firstName} ${student.lastName}`
                                : `Add ${student.firstName} ${student.lastName}`
                            }
                            onClick={() => toggleStudentAdd(student.id)}
                            style={isAdded ? { color: 'var(--chart-2)', borderColor: 'var(--chart-2)' } : {}}
                          >
                            <i
                              className={`fa-light fa-${isAdded ? 'check' : 'user-plus'}`}
                              aria-hidden="true"
                              style={{ fontSize: 12 }}
                            />
                            {isAdded ? 'Added' : 'Add'}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {sQ && filteredEnrolled.length === 0 && filteredUnenrolled.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                  No students found matching "{studentSearch}".
                </p>
              )}
            </TabsContent>

            {/* ── Template tab ─────────────────────────────────────────────── */}
            <TabsContent value="template" className="flex flex-col gap-4 pt-4">
              {publishedTemplates.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <i
                    className="fa-light fa-file-lines text-2xl"
                    aria-hidden="true"
                    style={{ color: 'var(--muted-foreground)' }}
                  />
                  <p className="text-sm font-medium">No published templates</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Publish a template first to assign it here.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/templates" target="_blank" rel="noreferrer" aria-label="Go to templates (opens in new tab)">
                      Go to templates
                      <i className="fa-light fa-arrow-up-right-from-square ml-1.5 text-xs" aria-hidden="true" />
                    </a>
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {assignedTemplateId
                      ? 'Assigned — select another to change'
                      : 'Select a template for this course'}
                  </p>
                  <div
                    className="flex flex-col rounded-xl border border-border overflow-hidden"
                    role="radiogroup"
                    aria-label="Select template"
                    style={{ background: 'var(--card)' }}
                  >
                    {publishedTemplates.map((tmpl, i) => {
                      const isSelected = assignedTemplateId === tmpl.id
                      return (
                        <div
                          key={tmpl.id}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => onTemplateChange?.(offering.id, tmpl.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              onTemplateChange?.(offering.id, tmpl.id)
                            }
                          }}
                          className="flex items-center gap-3 cursor-pointer"
                          style={{
                            padding: '12px 14px',
                            borderBottom: i < publishedTemplates.length - 1 ? '1px solid var(--border)' : 'none',
                            background: isSelected ? 'var(--brand-tint)' : 'var(--card)',
                            borderLeft: isSelected ? '3px solid var(--brand-color)' : '3px solid transparent',
                          }}
                        >
                          <span
                            className="shrink-0 rounded-full flex items-center justify-center"
                            style={{
                              width: 16,
                              height: 16,
                              border: isSelected
                                ? '2px solid var(--brand-color)'
                                : '2px solid var(--border-control-35)',
                            }}
                          >
                            {isSelected && (
                              <span
                                className="rounded-full"
                                style={{ width: 6, height: 6, background: 'var(--brand-color)' }}
                              />
                            )}
                          </span>
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-sm font-medium">{tmpl.name}</span>
                            <span className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                              {tmpl.questionCount} question{tmpl.questionCount !== 1 ? 's' : ''}
                              {tmpl.courseType ? ` · ${tmpl.courseType}` : ''}
                            </span>
                          </div>
                          {isSelected && (
                            <i
                              className="fa-solid fa-check text-xs shrink-0"
                              aria-hidden="true"
                              style={{ color: 'var(--brand-color)' }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="border-t border-border pt-4 mt-4 flex justify-end">
            <Button variant="default" size="sm" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
