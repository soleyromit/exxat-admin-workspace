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

import Link from 'next/link'
import {
  Button, Badge, Avatar, AvatarFallback,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Separator,
} from '@exxat/ds/packages/ui/src'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { SiteHeader } from '@/components/site-header'
import { StubButton } from '@/components/stub-button'
import { allStudents, type ExtendedStudent, type StudentIntervention } from '@/lib/student-mock-data'
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

function OverviewTab({ student }: { student: ExtendedStudent }) {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-5">

        {/* Academic standing */}
        <section aria-labelledby="standing-heading" className="rounded-xl border border-border bg-card p-5">
          <h2 id="standing-heading" className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-3">Academic Standing</h2>
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

        {/* Active interventions — Aarti: "only call it out if there is an active one" */}
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

        {/* Annotations / notes — always rendered per Aarti: "notes" are a core
            detail field. Empty state shows add affordance rather than hiding the section. */}
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

      {/* Right column — documents + prism link */}
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
        <p className="text-sm font-medium text-foreground">{row.courseName}</p>
        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{row.courseCode}</p>
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
    <DataTable<CourseEnrollmentRow>
      data={rows}
      columns={COURSE_COLUMNS}
      getRowId={(row) => row.id}
      selectable={false}
      searchable={false}
      emptyState={
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <i className="fa-light fa-graduation-cap text-muted-foreground text-3xl mb-3" aria-hidden="true" />
          <p className="font-semibold text-foreground">No course registrations</p>
          <p className="text-sm text-muted-foreground mt-1">This student hasn&apos;t been registered in any courses yet.</p>
        </div>
      }
    />
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

function AccommodationsTab({ student }: { student: ExtendedStudent }) {
  const accs = facultyAccommodations.filter(a => a.studentId === student.id)
  const typeLabel: Record<string, string> = {
    'extended-time': 'Extended Time', 'separate-room': 'Separate Room',
    'extended-breaks': 'Extended Breaks', 'screen-reader': 'Screen Reader', 'quiet-room': 'Quiet Room',
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {accs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <i className="fa-light fa-universal-access text-muted-foreground text-3xl mb-3" aria-hidden="true" />
          <p className="font-semibold text-foreground">No accommodations on file</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Accommodations are approved by Student Services and appear here once active.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead scope="col" className="pl-4 pr-3 text-[11px] font-semibold uppercase tracking-[0.08em]">Type</TableHead>
              <TableHead scope="col" className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em]">Detail</TableHead>
              <TableHead scope="col" className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em]">Course</TableHead>
              <TableHead scope="col" className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em]">Approved by</TableHead>
              <TableHead scope="col" className="px-3 pr-4 text-[11px] font-semibold uppercase tracking-[0.08em]">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accs.map(a => (
              <TableRow key={a.id} className="">
                <TableCell className="py-3 pl-4 pr-3">
                  <Badge variant="secondary" className="rounded text-[11px]">{typeLabel[a.type] ?? a.type}</Badge>
                </TableCell>
                <TableCell className="py-3 px-3 text-sm text-foreground">{a.detail}</TableCell>
                <TableCell className="py-3 px-3 text-sm text-muted-foreground font-mono">
                  {a.courseId.replace('course-', '').toUpperCase()}
                </TableCell>
                <TableCell className="py-3 px-3 text-sm text-muted-foreground">{a.approvedBy}</TableCell>
                <TableCell className="py-3 px-3 pr-4 text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(a.approvedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudentDetailClient({ studentId }: { studentId: string }) {
  const student = allStudents.find(s => s.id === studentId)

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
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none overflow-auto">

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
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-muted-foreground">
                <span className="font-mono text-xs">{student.studentId}</span>
                <Separator orientation="vertical" style={{ height: 12 }} />
                <span>{student.cohort}</span>
                <Separator orientation="vertical" style={{ height: 12 }} />
                <span>{student.program}</span>
                <Separator orientation="vertical" style={{ height: 12 }} />
                <span>Adviser: {student.adviser}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="overview" className="flex flex-col h-full">
            <div className="border-b border-border px-6 bg-card">
              <TabsList className="h-auto bg-transparent p-0 gap-0">
                {([
                  { value: 'overview',        label: 'Overview',        icon: 'fa-house' },
                  { value: 'courses',         label: 'Courses',         icon: 'fa-graduation-cap', count: student.courseEnrollments.length },
                  { value: 'assessments',     label: 'Assessments',     icon: 'fa-file-check' },
                  { value: 'accommodations',  label: 'Accommodations',  icon: 'fa-universal-access', count: accsCount },
                ] as const).map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-[--brand-color] data-[state=active]:text-foreground text-muted-foreground px-4 py-3 text-sm font-medium h-auto bg-transparent hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
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

            <div className="flex-1 overflow-auto p-6">
              <TabsContent value="overview"       className="mt-0 outline-none"><OverviewTab       student={student} /></TabsContent>
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
