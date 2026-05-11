'use client'

/**
 * LIVE EXAM MONITOR — Aarti's during-exam differentiator.
 *
 * From Granola: "Live exam monitoring: completion rates, student progress
 * tracking, performance analytics during exam."
 *
 * Layout:
 *   1. Header — assessment title, breadcrumb, time-remaining (live ticking)
 *   2. Hero KPIs — completion %, in-progress count, submitted, flagged comments
 *   3. Two-column: Student status board + Per-question response distribution
 *   4. Faculty-flagged-comments queue (real-time)
 *
 * Mock data ticks every 4s to simulate a live feed; real implementation will
 * subscribe to a backend stream. UI shape is the source of truth either way.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Avatar, AvatarFallback,
  Button, Badge,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Tip,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
  Textarea,
  FieldError,
} from '@exxat/ds/packages/ui/src'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { KeyMetrics, type MetricItem } from '@/components/key-metrics'
import { StatusPill } from '@/components/faculty-ui-kit'
import { mockAssessments, mockCourses } from '@/lib/qb-mock-data'
import { facultyExtraAssessments, facultyStudents, type LiveMonitorStudent } from '@/lib/faculty-mock-data'
import { useFacultySession } from '@/lib/faculty-session'

const ALL_ASSESSMENTS = [...mockAssessments, ...facultyExtraAssessments]

export default function LiveMonitorClient({ assessmentId }: { assessmentId: string }) {
  const router = useRouter()
  const { role, accessFor, hydrated } = useFacultySession()
  const assessment = ALL_ASSESSMENTS.find(a => a.id === assessmentId)
  const course = assessment ? mockCourses.find(c => c.id === assessment.courseId) : null

  // Per Vishaka: live monitoring is for course coordinators only.
  // - Admin: always allowed
  // - Faculty (Editor / Course Coordinator) on this course: allowed
  // - Faculty (Viewer / Course Instructor) on this course: blocked with explanation
  // - Anyone with no access: redirect/blocked
  const accessLevel = course ? accessFor(course.id) : null
  const isAuthorized = role === 'admin' || accessLevel === 'editor'

  // Build mock student snapshots based on the course roster + assessment
  const courseStudents = useMemo(() => {
    if (!assessment) return []
    return facultyStudents.filter(s => s.enrolledCourseIds.includes(assessment.courseId))
  }, [assessment])

  // Flag triage state — key is `${studentId}-${questionOrder}`
  const [flagStatuses, setFlagStatuses] = useState<Record<string, 'acknowledged' | 'dismissed'>>({})

  // Snapshot state — ticks every 4s to simulate live feed
  const [tick, setTick] = useState(0)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertText, setAlertText] = useState('')
  // Validation surface (modal-deep-study §2). Fires on submit attempt
  // with no message; clears on text input.
  const [alertError, setAlertError] = useState<string | null>(null)
  const [alertSent, setAlertSent] = useState<string | null>(null)
  const [pauseOpen, setPauseOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 4000)
    return () => clearInterval(t)
  }, [])

  const snapshot = useMemo(() => {
    if (!assessment) return null
    return buildSnapshot(courseStudents, assessment.questionCount, assessment.durationMinutes, tick)
  }, [assessment, courseStudents, tick])

  if (!assessment || !course || !snapshot) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="font-semibold text-foreground">Assessment not found</p>
        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => router.push('/courses')}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" />
          Back to courses
        </Button>
      </div>
    )
  }

  // Role gate (after data is resolved so we can show course context in the
  // forbidden message). Only show after hydration to avoid flash.
  if (hydrated && !isAuthorized) {
    return (
      <>
        <SiteHeader title="Live monitor" />
        <div className="flex flex-1 items-center justify-center p-8">
          <Card className="max-w-md w-full">
            <CardHeader className="items-center text-center">
              <span
                className="flex size-12 items-center justify-center rounded-full mx-auto"
                style={{
                  background: 'color-mix(in oklch, var(--chart-4) 12%, var(--background))',
                  color: 'var(--chart-4)',
                }}
                aria-hidden="true"
              >
                <i className="fa-light fa-shield-keyhole" style={{ fontSize: 22 }} />
              </span>
              <CardTitle className="font-heading text-base font-semibold text-foreground">
                Course Coordinators only
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Live exam monitoring is restricted to the Course Coordinator for{' '}
                <strong className="text-foreground">{course.name}</strong>. As a Course Instructor,
                you have read-only access to the course but can&apos;t monitor a live exam.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push(`/courses/${course.id}`)}>
                <i className="fa-light fa-arrow-left" aria-hidden="true" />
                Back to {course.name}
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  const inProgress = snapshot.students.filter(s => s.status === 'in-progress').length
  const submitted = snapshot.students.filter(s => s.status === 'submitted').length
  const notStarted = snapshot.students.filter(s => s.status === 'not-started').length
  const flaggedCount = snapshot.flaggedComments.length

  const breadcrumbs = [
    { label: 'Courses', href: '/courses' },
    { label: course.name, href: `/courses/${course.id}` },
    { label: 'Live monitor' },
  ]

  const sendAlert = () => {
    if (!alertText.trim()) {
      setAlertError('Type a message before sending the alert.')
      return
    }
    setAlertSent(alertText.trim())
    setAlertText('')
    setAlertError(null)
    setAlertOpen(false)
    window.setTimeout(() => setAlertSent(null), 4000)
  }

  function handleAlertOpenChange(v: boolean) {
    setAlertOpen(v)
    if (!v) setAlertError(null)
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <StatusPill
        tone={paused ? 'warning' : 'info'}
        icon={paused ? 'fa-pause' : 'fa-circle'}
        pulse={!paused}
        label={paused ? 'Paused' : 'Ongoing'}
        uppercase
      />
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAlertOpen(true)}>
        <i className="fa-light fa-bell" aria-hidden="true" />
        Alert all students
      </Button>
      <Button
        variant={paused ? 'default' : 'outline'}
        size="sm"
        className="gap-1.5"
        onClick={() => setPauseOpen(true)}
      >
        <i className={`fa-light ${paused ? 'fa-play' : 'fa-pause'}`} aria-hidden="true" />
        {paused ? 'Resume exam' : 'Pause exam'}
      </Button>
    </div>
  )

  // KPI order: Not Started → In Progress → Submitted (scan-band per Aarti May 8).
  // Completion % removed — redundant once donut is gone.
  const totalStudents = snapshot.students.length
  const heroMetrics: MetricItem[] = [
    { id: 'not-started', label: 'Not started',       value: notStarted,   delta: totalStudents > 0 ? `of ${totalStudents}` : '—',         trend: 'neutral' },
    { id: 'in-progress', label: 'In progress',       value: inProgress,   delta: totalStudents > 0 ? `of ${totalStudents}` : '—',         trend: 'neutral' },
    { id: 'submitted',   label: 'Submitted',         value: submitted,    delta: totalStudents > 0 ? `of ${totalStudents}` : '—',         trend: 'neutral' },
    { id: 'flagged',     label: 'Flagged questions', value: flaggedCount, delta: flaggedCount > 0 ? 'Needs review' : 'None flagged',      trend: flaggedCount > 0 ? 'down' : 'neutral' },
  ]

  return (
    <>
      <SiteHeader title={`${assessment.title} — Live`} breadcrumbs={breadcrumbs} />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none overflow-hidden">
        <PageHeader
          title={assessment.title}
          subtitle={`${course.name} · monitoring ${snapshot.students.length} students`}
          actions={headerActions}
        />

        <div className="flex-1 overflow-auto p-6">
          <div className="flex flex-col gap-5">
            {/* KPIs: Not Started → In Progress → Submitted → Flagged (scan-band).
                No completion donut — Aarti: "you need the chart OR the numbers, not both."
                Canonical KeyMetrics organism (vendored 2026-05-11). */}
            <KeyMetrics variant="card" showHeader={false} metricsSingleRow metrics={heroMetrics} />

            {/* Flagged comments at top — Aarti: "put it at the top."
                Visible during the exam so coordinator can acknowledge post-exam. */}
            {flaggedCount > 0 && (
              <FlaggedCommentsQueue
                snapshot={snapshot}
                students={courseStudents}
                flagStatuses={flagStatuses}
                onStatusChange={(key, status) =>
                  setFlagStatuses(prev => ({ ...prev, [key]: status }))
                }
              />
            )}

            {/* Student board — full width during the exam.
                Per-question analysis is post-exam only (Aarti: "while the exam is on,
                who cares about question 9?"). */}
            <StudentBoard students={snapshot.students} />
          </div>
        </div>
      </div>

      {/* Alert all dialog */}
      <Dialog open={alertOpen} onOpenChange={handleAlertOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alert all students</DialogTitle>
            <DialogDescription>
              This sends a banner notification to every student currently taking the exam.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Textarea
              placeholder="e.g. Question 7 has a typo — please skip and we'll exclude it from grading."
              value={alertText}
              onChange={e => { setAlertText(e.target.value); if (e.target.value.trim()) setAlertError(null) }}
              className="min-h-24"
              aria-invalid={!!alertError}
              aria-describedby={alertError ? 'alert-text-error' : 'alert-text-help'}
            />
            {alertError ? (
              <FieldError id="alert-text-error">{alertError}</FieldError>
            ) : (
              <p id="alert-text-help" className="text-[11px] text-muted-foreground">
                Sending to {snapshot.students.length} students · message logged in the audit trail.
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" onClick={sendAlert} className="gap-1.5">
              <i className="fa-light fa-paper-plane" aria-hidden="true" />
              Send alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause / resume dialog */}
      <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{paused ? 'Resume the exam?' : 'Pause the exam?'}</DialogTitle>
            <DialogDescription>
              {paused
                ? 'All in-progress students will be allowed to continue from where they paused. The clock resumes.'
                : 'All in-progress students will see a pause overlay and the timer will freeze. Use this for emergencies only.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              size="sm"
              variant={paused ? 'default' : 'destructive'}
              onClick={() => { setPaused(p => !p); setPauseOpen(false) }}
              className="gap-1.5"
            >
              <i className={`fa-light ${paused ? 'fa-play' : 'fa-pause'}`} aria-hidden="true" />
              {paused ? 'Resume now' : 'Pause now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert-sent inline toast — auto-dismisses after 4s */}
      {alertSent && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg border border-border bg-card shadow-lg px-4 py-3 flex items-start gap-3 max-w-md animate-in slide-in-from-bottom-3"
        >
          <i className="fa-solid fa-circle-check text-chart-2 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Alert sent</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{alertSent}</p>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Snapshot builder ────────────────────────────────────────────────────────
function buildSnapshot(students: { id: string; initials: string; studentId: string }[], totalQuestions: number, durationMinutes: number, tick: number) {
  const now = Date.now()
  const startedAt = new Date(now - 35 * 60_000).toISOString() // started 35 min ago
  const elapsed = 35 * 60 // seconds
  const totalSec = durationMinutes * 60
  const remaining = Math.max(0, totalSec - elapsed)

  const studentSnapshots: LiveMonitorStudent[] = students.map((s, i) => {
    // Distribute statuses: ~35% submitted, ~50% in-progress, ~15% not-started
    const r = (i * 13 + tick * 2) % 100
    let status: LiveMonitorStudent['status']
    if (r < 35) status = 'submitted'
    else if (r < 85) status = 'in-progress'
    else status = 'not-started'

    // Questions answered scales with status
    let answered = 0
    if (status === 'submitted') answered = totalQuestions
    else if (status === 'in-progress') {
      const progress = ((i * 7 + tick) % 90) / 100 + 0.1
      answered = Math.floor(totalQuestions * progress)
    }
    // Time remaining (accommodation may extend it for some)
    const accommodationMul = i % 6 === 0 ? 1.5 : 1
    const timeRemainingSec = Math.max(0, Math.floor(remaining * accommodationMul) - (i * 30) % 600)

    const flaggedCount = (i % 11 === 0 && status === 'in-progress') ? 1 : 0
    return {
      studentId: s.id,
      initials: s.initials,
      status,
      questionsAnswered: answered,
      totalQuestions,
      timeRemainingSec,
      flaggedCount,
      lastActivity: new Date(now - ((i * 17 + tick * 3) % 600) * 1000).toISOString(),
    }
  })

  // Per-question response distribution
  const responseDistribution = Array.from({ length: totalQuestions }).map((_, qIdx) => {
    const seedQ = (qIdx + 1) * 13
    const submittedCount = studentSnapshots.filter(s => s.status === 'submitted').length
    const inProgressAtQ = studentSnapshots.filter(s => s.status === 'in-progress' && s.questionsAnswered > qIdx).length
    const answered = submittedCount + inProgressAtQ
    const correct = Math.floor(answered * (0.55 + ((seedQ * 17) % 35) / 100))
    const opt0 = correct / Math.max(1, answered)
    const remaining = 1 - opt0
    const opt1 = remaining * 0.45
    const opt2 = remaining * 0.32
    const opt3 = 1 - opt0 - opt1 - opt2
    return {
      questionId: `q-${qIdx}`,
      answered,
      correct,
      chosenOption: [opt0, opt1, opt2, Math.max(0, opt3)],
    }
  })

  // Flagged comments — synthesized
  const flaggedComments = students
    .filter((_, i) => i % 11 === 0 && i < 6)
    .slice(0, 3)
    .map((s, idx) => ({
      studentId: s.id,
      questionOrder: (idx + 1) * 5,
      text: [
        'Options C and D look identical to me — am I missing something?',
        'The image is rotated, hard to identify the structure.',
        'I think this question has a typo in the second sentence.',
      ][idx],
      submittedAt: new Date(now - (idx * 4 + tick) * 60_000).toISOString(),
    }))

  return {
    assessmentId: 'mock',
    startedAt,
    totalQuestions,
    durationMinutes,
    students: studentSnapshots,
    responseDistribution,
    flaggedComments,
  }
}

// ─── Student board ───────────────────────────────────────────────────────────
function StudentBoard({ students }: { students: LiveMonitorStudent[] }) {
  // Sort: in-progress first, then not-started, then submitted; within in-progress, by time-remaining ascending
  const sorted = [...students].sort((a, b) => {
    const order = { 'in-progress': 0, 'not-started': 1, 'paused': 2, 'submitted': 3 }
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
    if (a.status === 'in-progress') return a.timeRemainingSec - b.timeRemainingSec
    return 0
  })

  return (
    <Card className="gap-0 py-0">
      <header
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <h2 className="font-semibold text-foreground" style={{ fontSize: 14 }}>
          Student status
        </h2>
        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
          {students.length} total
        </span>
      </header>
      <div
        className="max-h-[min(420px,60vh)] overflow-auto"
        tabIndex={0}
        role="region"
        aria-label="Student status list"
      >
        {sorted.map(s => <StudentRow key={s.studentId} s={s} />)}
      </div>
    </Card>
  )
}

function StudentRow({ s }: { s: LiveMonitorStudent }) {
  const minRemaining = Math.floor(s.timeRemainingSec / 60)
  const isLowTime = s.status === 'in-progress' && s.timeRemainingSec < 5 * 60
  const isStalled = s.status === 'in-progress' && (Date.now() - new Date(s.lastActivity).getTime()) > 4 * 60_000

  return (
    <div
      className="grid items-center gap-3 px-4 py-2.5 border-b last:border-b-0 text-sm hover:bg-muted/30 transition-colors"
      style={{ gridTemplateColumns: '32px 1fr 90px 110px', borderColor: 'var(--border)' }}
    >
      <Avatar className="h-7 w-7 rounded-full">
        <AvatarFallback
          className="rounded-full text-[10px] font-bold"
          style={{
            background: STATUS_PALETTE[s.status].bg,
            color: STATUS_PALETTE[s.status].fg,
          }}
        >
          {s.initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground truncate">{s.initials} · {s.studentId}</span>
          <StatusDot status={s.status} />
          {isStalled && (
            <Tip label="No activity in last 4 minutes">
              <i className="fa-solid fa-circle-exclamation cursor-help" aria-hidden="true" style={{ fontSize: 11, color: 'var(--chart-4)' }} />
            </Tip>
          )}
          {s.flaggedCount > 0 && (
            <Tip label={`${s.flaggedCount} flagged comment${s.flaggedCount === 1 ? '' : 's'}`}>
              <span
                className="inline-flex items-center gap-1 cursor-help"
                style={{ color: 'var(--chart-4)', fontSize: 11 }}
              >
                <i className="fa-solid fa-flag" aria-hidden="true" style={{ fontSize: 9 }} />
                {s.flaggedCount}
              </span>
            </Tip>
          )}
        </div>
        {s.status === 'in-progress' && (
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1 w-32 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(s.questionsAnswered / s.totalQuestions) * 100}%`,
                  background: 'var(--chart-1)',
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {s.questionsAnswered}/{s.totalQuestions}
            </span>
          </div>
        )}
      </div>
      <div className="text-xs">
        {s.status === 'in-progress' ? (
          <span
            className="font-mono font-semibold"
            style={{ color: isLowTime ? 'var(--chart-4)' : 'var(--foreground)' }}
          >
            {minRemaining}m left
          </span>
        ) : s.status === 'submitted' ? (
          <span className="text-muted-foreground">Done</span>
        ) : (
          <span className="text-muted-foreground italic">—</span>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground text-end">
        {relativeSeconds(s.lastActivity)}
      </div>
    </div>
  )
}

// Foreground tokens deepened via color-mix into --foreground so AA contrast holds
// against the 14% color-mix backgrounds. Raw --chart-1/2/4 are tuned for chart
// bodies and fail color-contrast at small text sizes — see visual-check axe
// output on /assessments/<id>/monitor.
const STATUS_PALETTE: Record<LiveMonitorStudent['status'], { bg: string; fg: string }> = {
  'in-progress': { bg: 'color-mix(in oklch, var(--chart-1) 14%, var(--background))', fg: 'color-mix(in oklch, var(--chart-1) 50%, var(--foreground))' },
  'submitted':   { bg: 'color-mix(in oklch, var(--chart-2) 14%, var(--background))', fg: 'color-mix(in oklch, var(--chart-2) 50%, var(--foreground))' },
  'not-started': { bg: 'var(--muted)', fg: 'var(--foreground)' },
  'paused':      { bg: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))', fg: 'color-mix(in oklch, var(--chart-4) 55%, var(--foreground))' },
}

function StatusDot({ status }: { status: LiveMonitorStudent['status'] }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5"
      style={{
        background: STATUS_PALETTE[status].bg,
        color: STATUS_PALETTE[status].fg,
      }}
    >
      <span
        className="h-1 w-1 rounded-full"
        style={{
          background: STATUS_PALETTE[status].fg,
          animation: status === 'in-progress' ? 'pulse-soft 1.6s ease-in-out infinite' : undefined,
        }}
      />
      {status === 'in-progress' ? 'Active' : status === 'submitted' ? 'Done' : status === 'paused' ? 'Paused' : 'Not started'}
    </span>
  )
}

// ─── Flagged comments queue ──────────────────────────────────────────────────
function FlaggedCommentsQueue({
  snapshot, students, flagStatuses, onStatusChange,
}: {
  snapshot: ReturnType<typeof buildSnapshot> & object
  students: { id: string; initials: string; firstName: string; lastName: string }[]
  flagStatuses: Record<string, 'acknowledged' | 'dismissed'>
  onStatusChange: (key: string, status: 'acknowledged' | 'dismissed') => void
}) {
  const sMap = new Map(students.map(s => [s.id, s]))
  const total = snapshot.flaggedComments.length
  const actionedCount = Object.keys(flagStatuses).length
  const unactionedCount = total - actionedCount

  return (
    <Card className="gap-0 py-0">
      <header
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-flag" aria-hidden="true" style={{ fontSize: 12, color: 'var(--chart-4)' }} />
          <h2 className="font-semibold text-foreground" style={{ fontSize: 14 }}>
            Flagged questions
          </h2>
          {unactionedCount > 0 ? (
            <Badge variant="secondary" className="rounded text-[10px]" style={{ background: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))', color: 'var(--chart-4)' }}>
              {unactionedCount}
            </Badge>
          ) : (
            <Badge variant="secondary" className="rounded text-[10px]">
              {total}
            </Badge>
          )}
          {actionedCount > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {actionedCount} of {total} reviewed
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground italic">Read-only during exam</span>
      </header>
      <div>
        {snapshot.flaggedComments.map((c, idx) => {
          const s = sMap.get(c.studentId)
          const key = `${c.studentId}-${c.questionOrder}`
          const status = flagStatuses[key]
          return (
            <div
              key={idx}
              className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0 transition-opacity"
              style={{ borderColor: 'var(--border)', opacity: status ? 0.6 : 1 }}
            >
              <Avatar className="h-7 w-7 rounded-full shrink-0">
                <AvatarFallback
                  className="rounded-full text-[10px] font-bold"
                  style={{
                    background: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))',
                    color: 'color-mix(in oklch, var(--chart-4) 55%, var(--foreground))',
                  }}
                >
                  {s?.initials ?? '??'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {s ? `${s.firstName} ${s.lastName}` : 'Student'}
                  </span>
                  <Badge variant="secondary" className="rounded text-[10px] font-mono" style={{ background: 'var(--muted)' }}>
                    Q{c.questionOrder}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{relativeSeconds(c.submittedAt)}</span>
                </div>
                <p className="text-sm text-foreground italic">&ldquo;{c.text}&rdquo;</p>
              </div>
              <div className="shrink-0 flex items-center gap-1">
                {status ? (
                  <Badge
                    variant="secondary"
                    className="rounded"
                    style={
                      status === 'acknowledged'
                        ? { backgroundColor: 'color-mix(in oklch, var(--chart-1) 14%, var(--background))', color: 'var(--chart-1)' }
                        : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }
                    }
                  >
                    {status === 'acknowledged' ? 'Acknowledged' : 'Dismissed'}
                  </Badge>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => onStatusChange(key, 'acknowledged')}
                    >
                      <i className="fa-light fa-check" aria-hidden="true" />
                      Acknowledge
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => onStatusChange(key, 'dismissed')}
                    >
                      <i className="fa-light fa-xmark" aria-hidden="true" />
                      Dismiss
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function relativeSeconds(iso: string): string {
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`
  return `${Math.round(sec / 3600)}h ago`
}
