'use client'

/**
 * Student detail — base entity page for Exam Management.
 *
 * Tabs per Aarti (May 13) + Vishaka (May 14) raw transcripts:
 *   Overview     — academic standing, active interventions (only if any),
 *                  annotations/notes, documents
 *   Courses      — registered courses with completion status
 *                  Grade shown with "From LMS" attribution (Vishaka: course grades
 *                  are not saved in exam management — they live in LMS)
 *   Assessments  — # courses, # exams, completion status, competency strengths/weaknesses
 *   Accommodations — per course, admin/coordinator only (Vishaka: differentiator vs ExamSoft)
 *
 * Excluded (stays in LMS or Prism): GPA detail, patient logs, timesheets,
 * compliance, full communication history, preceptor bio.
 * "View full profile in Prism" link provided as fallback — opens in new tab.
 * Aarti: "it will open in a new tab."
 *
 * Tab variations for other products: see docs/BASE-ENTITIES.md
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEntryPoint } from '@/lib/use-entry-point'
import { recordView } from '@/lib/recently-viewed'
import {
  Button, Badge, Avatar, AvatarFallback,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Separator,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Label,
} from '@exxat/ds/packages/ui/src'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { SiteHeader } from '@/components/site-header'
import { StubButton } from '@/components/stub-button'
import { allStudents, type ExtendedStudent, type StudentIntervention } from '@/lib/student-mock-data'
import { courseOfferingRows } from '@/lib/course-mock-data'
import { facultyAccommodations } from '@/lib/faculty-mock-data'

// ── Shared standing badge (same colours as list page) ─────────────────────────

function StandingBadge({ status, label }: { status: string; label: string }) {
  const style =
    status === 'good-standing'   ? { bg: 'var(--qb-status-saved-bg)',  fg: 'var(--qb-status-saved-fg)' } :
    status === 'needs-attention' ? { bg: 'var(--standing-warning-bg)', fg: 'var(--standing-warning-fg)' } :
                                   { bg: 'color-mix(in oklch, var(--destructive) 10%, var(--background))', fg: 'var(--destructive)' }
  return (
    <Badge
      variant="secondary"
      className="rounded-full text-xs font-semibold px-3 py-1"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      {label}
    </Badge>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ student, isPrism }: { student: ExtendedStudent; isPrism: boolean }) {
  const activeInterventions = student.interventions.filter(i => i.isActive)
  const intervTypeLabel: Record<StudentIntervention['type'], string> = {
    advising: 'Advising', 'early-alert': 'Early Alert',
    'academic-support': 'Academic Support', tutoring: 'Tutoring', referral: 'Referral',
  }
  const standingIcon =
    student.academicStanding.status === 'good-standing'   ? 'fa-circle-check' :
    student.academicStanding.status === 'needs-attention' ? 'fa-triangle-exclamation' :
                                                            'fa-circle-xmark'
  const standingBg =
    student.academicStanding.status === 'good-standing'   ? 'var(--qb-status-saved-bg)' :
    student.academicStanding.status === 'needs-attention' ? 'var(--standing-warning-bg)' :
                                                            'color-mix(in oklch, var(--destructive) 10%, var(--background))'
  const standingFg =
    student.academicStanding.status === 'good-standing'   ? 'var(--qb-status-saved-fg)' :
    student.academicStanding.status === 'needs-attention' ? 'var(--standing-warning-fg)' :
                                                            'var(--destructive)'

  // Exam activity aggregates — Vishaka May 14: "# courses, # exams, completion status"
  const coursesCount    = student.courseEnrollments.length
  const examsCompleted  = student.courseEnrollments.reduce((s, c) => s + c.completedAssessments, 0)
  const examsInProgress = student.courseEnrollments.filter(c => c.status === 'in-progress').length

  // Show up to 4 courses in the compact list; full list lives in Courses tab
  const previewCourses = student.courseEnrollments.slice(0, 4)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-5">

        {/* Section 1 — Registered Courses (Aarti May 13: "the courses that the student
            is registered on" must be visible on first screen) */}
        <section aria-labelledby="courses-overview-heading" className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <h2 id="courses-overview-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Registered Courses
            </h2>
            {coursesCount > 0 && (
              <Badge variant="secondary" className="rounded-full text-[10px] px-1.5 py-0 min-w-[18px] text-center">
                {coursesCount}
              </Badge>
            )}
          </div>
          {coursesCount === 0 ? (
            <p className="text-sm text-muted-foreground">No courses registered yet.</p>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {previewCourses.map(enr => {
                  const cfg = COURSE_STATUS_CONFIG[enr.status as keyof typeof COURSE_STATUS_CONFIG]
                  return (
                    <div key={enr.courseId} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{enr.courseName}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{enr.term}</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="rounded-full text-[10px] font-semibold gap-1 px-2 shrink-0"
                        style={{ backgroundColor: cfg.bg, color: cfg.fg }}
                      >
                        <i className={`fa-light ${cfg.icon}`} aria-hidden="true" style={{ fontSize: 9 }} />
                        {cfg.label}
                      </Badge>
                      {enr.status === 'in-progress' && (
                        <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                          {enr.completedAssessments}/{enr.assessmentCount} exams
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              {/* "View all" stub — prototype; tab switching wired via Tabs component above */}
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 px-0 h-auto text-xs text-muted-foreground gap-1 hover:text-foreground hover:bg-transparent"
              >
                View all {coursesCount} courses
                <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 10 }} />
              </Button>
            </>
          )}
        </section>

        {/* Section 2 — Exam Activity (Vishaka May 14: "this student was part of N courses
            and N exams, and across all of them, this is how the student has performed") */}
        <section aria-labelledby="exam-activity-heading" className="rounded-xl border border-border bg-card p-5">
          <h2 id="exam-activity-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3">
            Exam Activity
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: 'Courses',        value: coursesCount,    icon: 'fa-graduation-cap' },
              { label: 'Exams completed', value: examsCompleted, icon: 'fa-circle-check' },
              { label: 'In progress',    value: examsInProgress, icon: 'fa-clock-rotate-left' },
            ] as const).map(m => (
              <div
                key={m.label}
                className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-3"
                style={{ backgroundColor: 'var(--muted)' }}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: 'var(--background)' }}>
                  <i className={`fa-light ${m.icon}`} aria-hidden="true"
                    style={{ fontSize: 13, color: 'var(--muted-foreground)' }} />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground leading-none tabular-nums">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{m.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 — Active Interventions (Aarti: "only call it out if there is an active one") */}
        {activeInterventions.length > 0 && (
          <section aria-labelledby="interventions-heading" className="rounded-xl border border-border bg-card p-5">
            <h2 id="interventions-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3">Active Interventions</h2>
            <div className="flex flex-col gap-3">
              {activeInterventions.map(iv => (
                <div key={iv.id} className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    style={{ backgroundColor: 'color-mix(in oklch, var(--chart-4) 12%, var(--background))' }}>
                    <i className="fa-light fa-flag" aria-hidden="true" style={{ fontSize: 13, color: 'var(--chart-4)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded text-[10px]">{intervTypeLabel[iv.type]}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(iv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-1">{iv.notes}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {iv.staffMember}
                      {iv.followUpDate && ` · Follow-up ${new Date(iv.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 4 — Academic Standing (demoted — Vishaka May 14: "not even GPA is
            important in exam management; that should stay with the student profile") */}
        <section aria-labelledby="standing-heading" className="rounded-xl border border-border bg-card p-5">
          <h2 id="standing-heading" className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3">Academic Standing</h2>
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: standingBg }}>
              <i className={`fa-light ${standingIcon}`} aria-hidden="true" style={{ fontSize: 18, color: standingFg }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{student.academicStanding.label}</p>
              {student.academicStanding.detail && (
                <p className="text-sm text-muted-foreground mt-0.5">{student.academicStanding.detail}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Since {new Date(student.academicStanding.since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 — Annotations / notes (always rendered — Aarti: "notes" are a core
            detail field; empty state shows add affordance rather than hiding the section) */}
        <section aria-labelledby="annotations-heading" className="rounded-xl border border-border bg-card p-5">
          <h2 id="annotations-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3">Annotations &amp; Notes</h2>
          {student.annotations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <i className="fa-light fa-note-sticky text-muted-foreground" aria-hidden="true" style={{ fontSize: 20 }} />
              <p className="text-sm text-muted-foreground">No notes yet</p>
              <StubButton variant="outline" size="sm" className="gap-1.5 text-xs mt-1">
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add note
              </StubButton>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {student.annotations.map(ann => (
                <div key={ann.id} className="flex items-start gap-2">
                  <i className={`fa-light ${ann.type === 'tag' ? 'fa-tag' : 'fa-note-sticky'} mt-0.5`}
                    aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{ann.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {ann.addedBy} · {new Date(ann.addedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Right column — documents + prism link (unchanged) */}
      <div className="flex flex-col gap-5">
        <section aria-labelledby="documents-heading" className="rounded-xl border border-border bg-card p-5">
          <h2 id="documents-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3">Documents</h2>
          {student.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {student.documents.map(doc => (
                <div key={doc.id} className="flex items-start gap-2">
                  <i className="fa-light fa-file-lines mt-0.5" aria-hidden="true"
                    style={{ fontSize: 13, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{doc.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(doc.uploadedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{doc.uploadedBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5 text-xs">
            <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
            Upload document
          </Button>
        </section>

        {/* Full Prism profile fallback — Aarti: "put a link, open in a new tab" */}
        {isPrism && (
          <div className="rounded-xl border border-border p-4 flex items-start gap-3"
            style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 4%, var(--background))' }}>
            <i className="fa-light fa-arrow-up-right-from-square mt-0.5" aria-hidden="true"
              style={{ fontSize: 13, color: 'var(--brand-color)', flexShrink: 0 }} />
            <div>
              <p className="text-sm font-medium text-foreground">Full student profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                GPA, compliance history, communications, and PCE data live in Prism.
              </p>
              {/* Opens in new tab — Aarti May 13: "it will open in a new tab" */}
              <a
                href="#prism-student-profile"
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
        )}
      </div>
    </div>
  )
}

// ── Courses tab ───────────────────────────────────────────────────────────────

const COURSE_STATUS_CONFIG = {
  completed:     { label: 'Completed',   icon: 'fa-circle-check', bg: 'var(--qb-status-saved-bg)',  fg: 'var(--qb-status-saved-fg)' },
  'in-progress': { label: 'In Progress', icon: 'fa-spinner',      bg: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', fg: 'var(--brand-color)' },
  upcoming:      { label: 'Upcoming',    icon: 'fa-clock',        bg: 'var(--muted)',               fg: 'var(--muted-foreground)' },
}

interface CourseEnrollmentRow extends Record<string, unknown> {
  id: string
  courseName: string
  courseCode: string
  term: string
  status: keyof typeof COURSE_STATUS_CONFIG
  grade: string | null
  completedAssessments: number
  assessmentCount: number
}

const COURSE_COLUMNS: ColumnDef<CourseEnrollmentRow>[] = [
  {
    key: 'courseName',
    label: 'Course',
    sortable: true,
    width: 240,
    cell: (row) => (
      <div>
        <Link href={`/courses/${row.id as string}`}
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--brand-color)' }}>
          {row.courseName as string}
        </Link>
        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{row.courseCode as string}</p>
      </div>
    ),
  },
  {
    key: 'term',
    label: 'Term',
    sortable: true,
    width: 120,
    cell: (row) => <span className="text-sm text-muted-foreground whitespace-nowrap">{row.term}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    width: 140,
    cell: (row) => {
      const cfg = COURSE_STATUS_CONFIG[row.status]
      return (
        <Badge variant="secondary" className="rounded-full text-[10px] font-semibold gap-1 px-2"
          style={{ backgroundColor: cfg.bg, color: cfg.fg }}>
          <i className={`fa-light ${cfg.icon}`} aria-hidden="true" style={{ fontSize: 9 }} />
          {cfg.label}
        </Badge>
      )
    },
  },
  {
    key: 'grade',
    label: 'Grade',
    sortable: false,
    width: 110,
    // Grade is from LMS — Vishaka: course grades are NOT saved in exam management
    cell: (row) => (
      <span className="text-sm font-medium text-foreground">
        {row.grade ?? '—'}
        <span className="ml-1 text-[9px] font-normal text-muted-foreground">(LMS)</span>
      </span>
    ),
  },
  {
    key: 'assessmentCount',
    label: 'Assessments',
    sortable: false,
    width: 140,
    cell: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.completedAssessments}/{row.assessmentCount} completed
      </span>
    ),
  },
]

function CoursesTab({ student }: { student: ExtendedStudent }) {
  const router = useRouter()
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [selectedOfferingId, setSelectedOfferingId] = useState('')
  const [enrolled, setEnrolled] = useState(false)

  // Only show ongoing/upcoming offerings not already enrolled
  const enrolledIds = new Set(student.courseEnrollments.map(e => e.courseId))
  const availableOfferings = courseOfferingRows.filter(
    o => (o.status === 'ongoing' || o.status === 'upcoming') && !enrolledIds.has(o.id)
  )

  function handleEnroll() {
    if (!selectedOfferingId) return
    setEnrolled(true)
    setTimeout(() => { setEnrolled(false); setEnrollOpen(false); setSelectedOfferingId('') }, 1200)
  }

  const rows: CourseEnrollmentRow[] = student.courseEnrollments.map(enr => ({
    id: enr.courseId,
    courseName: enr.courseName,
    courseCode: enr.courseCode,
    term: enr.term,
    status: enr.status as keyof typeof COURSE_STATUS_CONFIG,
    grade: enr.grade ?? null,
    completedAssessments: enr.completedAssessments,
    assessmentCount: enr.assessmentCount,
  }))

  return (
    <>
      <DataTable<CourseEnrollmentRow>
        data={rows}
        columns={COURSE_COLUMNS}
        getRowId={(row) => row.id}
        selectable={false}
        searchable={false}
        showQueryControls={false}
        onRowClick={(row) => router.push(`/courses/offerings/${row.id as string}`)}
        toolbarSlot={() => (
          <>
            <span className="text-xs text-muted-foreground">
              {rows.length} course{rows.length !== 1 ? 's' : ''} enrolled
            </span>
            <Button size="sm" onClick={() => setEnrollOpen(true)}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Enroll in Course
            </Button>
          </>
        )}
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <i className="fa-light fa-graduation-cap text-muted-foreground text-xl" aria-hidden="true" />
            </div>
            <p className="font-semibold text-foreground">No course registrations</p>
            <p className="text-sm text-muted-foreground mt-1">This student hasn&apos;t been registered in any courses yet.</p>
            <Button size="sm" className="mt-3" onClick={() => setEnrollOpen(true)}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Enroll in Course
            </Button>
          </div>
        }
      />

      {/* Enroll in Course sheet */}
      <Sheet open={enrollOpen} onOpenChange={setEnrollOpen}>
        <SheetContent showOverlay={false} showCloseButton={false} side="right" style={{ width: 420 }}>
          <SheetHeader>
            <SheetTitle>Enroll in Course</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4">
            <p className="text-sm text-muted-foreground">
              Select an active or upcoming course offering to enroll <strong>{student.firstName} {student.lastName}</strong>.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="course-offering-select">
                Course Offering <span className="text-destructive" aria-hidden="true">*</span>
              </Label>
              <Select value={selectedOfferingId} onValueChange={setSelectedOfferingId}>
                <SelectTrigger id="course-offering-select" aria-label="Course Offering">
                  <SelectValue placeholder="Select a course offering" />
                </SelectTrigger>
                <SelectContent>
                  {availableOfferings.map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.courseName} — {o.term}
                    </SelectItem>
                  ))}
                  {availableOfferings.length === 0 && (
                    <SelectItem value="__none" disabled>No available offerings</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => { setEnrollOpen(false); setSelectedOfferingId('') }}>Cancel</Button>
            <Button onClick={handleEnroll} disabled={!selectedOfferingId || enrolled}>
              {enrolled ? (
                <><i className="fa-light fa-check" aria-hidden="true" /> Enrolled</>
              ) : 'Enroll Student'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

// ── Assessments tab ───────────────────────────────────────────────────────────

function AssessmentsTab({ student }: { student: ExtendedStudent }) {
  // Aggregate across ALL enrolled courses — Vishaka: "this student was part of
  // five courses and 10 exams. And across all of them, this is how the student has performed."
  const totalExams = student.courseEnrollments.reduce((n, e) => n + e.assessmentCount, 0)
  const completed  = student.courseEnrollments.reduce((n, e) => n + e.completedAssessments, 0)
  const allScores  = student.enrolledCourseIds.map(id => student.avgScore[id]).filter(Boolean)
  const avgScore   = allScores.length > 0
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length
    : 0

  return (
    <div className="flex flex-col gap-5">
      {/* Summary strip — Vishaka: "# courses, # exams, completion status" */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Courses enrolled',  value: student.enrolledCourseIds.length, icon: 'fa-graduation-cap' },
          { label: 'Exams completed',   value: `${completed}/${totalExams}`,      icon: 'fa-file-check' },
          { label: 'Average score',     value: `${avgScore.toFixed(0)}%`,         icon: 'fa-chart-simple' },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-border bg-card px-4 py-4 flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))' }}>
              <i className={`fa-light ${m.icon}`} aria-hidden="true" style={{ fontSize: 15, color: 'var(--brand-color)' }} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Competency performance — Vishaka: "competency-based strengths/weaknesses" */}
      {student.competencyPerformance.length > 0 && (
        <section aria-labelledby="competency-heading" className="rounded-xl border border-border bg-card p-5">
          <h2 id="competency-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-4">
            Competency Performance
          </h2>
          <div className="flex flex-col gap-4">
            {student.competencyPerformance.map(cp => {
              const fgColor =
                cp.avgScore >= 80 ? 'var(--qb-status-saved-fg)' :
                cp.avgScore < 65  ? 'var(--destructive)' :
                                    'var(--standing-warning-fg)'
              const trendIcon =
                cp.trend === 'improving' ? 'fa-arrow-trend-up' :
                cp.trend === 'declining' ? 'fa-arrow-trend-down' : 'fa-minus'

              return (
                <div key={cp.area} className="flex items-center gap-3">
                  <span className="text-sm text-foreground w-52 shrink-0 truncate" id={`comp-${cp.area.replace(/\s/g, '-')}`}>
                    {cp.area}
                  </span>
                  {/* Accessible progress bar — role + aria values */}
                  <div
                    role="progressbar"
                    aria-valuenow={cp.avgScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-labelledby={`comp-${cp.area.replace(/\s/g, '-')}`}
                    className="flex-1 rounded-full bg-muted h-1.5 overflow-hidden"
                  >
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${cp.avgScore}%`, backgroundColor: fgColor }} />
                  </div>
                  <span className="text-sm font-medium tabular-nums w-10 text-right" style={{ color: fgColor }}>
                    {cp.avgScore.toFixed(0)}%
                  </span>
                  <i className={`fa-light ${trendIcon}`} aria-label={cp.trend}
                    style={{ fontSize: 11, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

// ── Accommodations tab ────────────────────────────────────────────────────────
// Vishaka: "Having an accommodation view in our assessment tool is a plus —
// I don't know if ExamSoft even caters to that."

const ACC_TYPE_LABEL: Record<string, string> = {
  'extended-time': 'Extended Time', 'separate-room': 'Separate Room',
  'extended-breaks': 'Extended Breaks', 'screen-reader': 'Screen Reader', 'quiet-room': 'Quiet Room',
}

interface AccommodationRow extends Record<string, unknown> {
  id: string
  type: string
  detail: string
  courseCode: string
  approvedBy: string
  approvedDate: string
}

const ACC_COLUMNS: ColumnDef<AccommodationRow>[] = [
  {
    key: 'type', label: 'Type', sortable: true, width: 160,
    cell: (row) => <Badge variant="secondary" className="rounded text-[11px]">{ACC_TYPE_LABEL[row.type] ?? row.type}</Badge>,
  },
  {
    key: 'detail', label: 'Detail', sortable: false, width: 200,
    cell: (row) => <span className="text-sm text-foreground">{row.detail}</span>,
  },
  {
    key: 'courseCode', label: 'Course', sortable: true, width: 120,
    cell: (row) => <span className="text-sm text-muted-foreground font-mono">{row.courseCode}</span>,
  },
  {
    key: 'approvedBy', label: 'Approved by', sortable: true, width: 180,
    cell: (row) => <span className="text-sm text-muted-foreground">{row.approvedBy}</span>,
  },
  {
    key: 'approvedDate', label: 'Date', sortable: true, width: 140,
    cell: (row) => <span className="text-sm text-muted-foreground whitespace-nowrap">{row.approvedDate}</span>,
  },
]

function AccommodationsTab({ student }: { student: ExtendedStudent }) {
  const rows: AccommodationRow[] = facultyAccommodations
    .filter(a => a.studentId === student.id)
    .map(a => ({
      id: a.id,
      type: a.type,
      detail: a.detail,
      courseCode: a.courseId.replace('course-', '').toUpperCase(),
      approvedBy: a.approvedBy,
      approvedDate: new Date(a.approvedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }))

  return (
    <DataTable<AccommodationRow>
      data={rows}
      columns={ACC_COLUMNS}
      getRowId={(row) => row.id}
      selectable={false}
      searchable={false}
      showQueryControls={false}
      toolbarSlot={() => (
        <span className="text-xs text-muted-foreground">
          {rows.length} accommodation{rows.length !== 1 ? 's' : ''}
        </span>
      )}
      emptyState={
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <i className="fa-light fa-universal-access text-muted-foreground text-xl" aria-hidden="true" />
          </div>
          <p className="font-semibold text-foreground">No accommodations on file</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Accommodations are approved by Student Services and appear here once active.
          </p>
        </div>
      }
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudentDetailClient({ studentId }: { studentId: string }) {
  const [activeTab, setActiveTab] = useState('overview')
  const student = allStudents.find(s => s.id === studentId)
  const entryPoint = useEntryPoint()
  const isPrism = entryPoint === 'prism'

  useEffect(() => {
    if (!student) return
    recordView('students', {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      subtitle: `${student.studentId} · ${student.cohort}`,
      href: `/students/${student.id}`,
      icon: 'fa-graduation-cap',
    })
  }, [student?.id])

  if (!student) {
    return (
      <>
        <SiteHeader title="Student not found" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
          <i className="fa-light fa-user-slash text-muted-foreground text-4xl" aria-hidden="true" />
          <p className="font-semibold text-foreground">Student not found</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/students">Back to Students</Link>
          </Button>
        </div>
      </>
    )
  }

  const initials = `${student.firstName[0]}${student.lastName[0]}`
  const accsCount = facultyAccommodations.filter(a => a.studentId === student.id).length

  return (
    <>
      <SiteHeader title={`${student.firstName} ${student.lastName}`} />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none min-h-0">

        {/* ── Header strip ───────────────────────────────────────────────── */}
        <div className="border-b border-border bg-card px-6 py-5">
          {/* Back nav — DS Button asChild wrapping Link (fix: was raw <button>) */}
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground mb-4 px-0 h-auto" asChild>
            <Link href="/students">
              <i className="fa-light fa-chevron-left" aria-hidden="true" style={{ fontSize: 10 }} />
              Students
            </Link>
          </Button>

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
                  {student.firstName} {student.lastName}
                </h1>
                <StandingBadge status={student.academicStanding.status} label={student.academicStanding.label} />
                {isPrism && (
                  <Badge variant="secondary" className="rounded text-[11px] font-semibold px-2 py-0.5"
                    style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color-dark)' }}>
                    <i className="fa-light fa-link" aria-hidden="true" />
                    Prism
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-muted-foreground">
                <span className="font-mono text-xs">{student.studentId}</span>
                <Separator orientation="vertical" style={{ height: 12 }} />
                <span>{student.cohort}</span>
                <Separator orientation="vertical" style={{ height: 12 }} />
                <span>{student.program}</span>
                <Separator orientation="vertical" style={{ height: 12 }} />
                <span>Advisor: {student.advisor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="border-b border-border px-6 bg-card">
              <TabsList variant="line">
                {([
                  { value: 'overview',        label: 'Overview',        icon: 'fa-circle-info' },
                  { value: 'courses',         label: 'Courses',         icon: 'fa-graduation-cap', count: student.courseEnrollments.length },
                  { value: 'assessments',     label: 'Assessments',     icon: 'fa-file-check' },
                  { value: 'accommodations',  label: 'Accommodations',  icon: 'fa-universal-access', count: accsCount },
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
              <TabsContent value="overview"       className="mt-0 outline-none"><OverviewTab       student={student} isPrism={isPrism} /></TabsContent>
              <TabsContent value="courses"        className="mt-0 outline-none"><CoursesTab        student={student} /></TabsContent>
              <TabsContent value="assessments"    className="mt-0 outline-none"><AssessmentsTab    student={student} /></TabsContent>
              <TabsContent value="accommodations" className="mt-0 outline-none"><AccommodationsTab student={student} /></TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  )
}
