'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Button,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  SidebarTrigger, Separator,
  Sheet, SheetContent, SheetHeader, SheetTitle,
  Tabs, TabsList, TabsTrigger, TabsContent,
  DatePickerField,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  MOCK_MASTER_COURSES,
  MOCK_PROGRAMS,
  MOCK_FACULTY,
  type CourseOffering,
} from '@/lib/pce-mock-data'

// ── Types ────────────────────────────────────────────────────────────────────

type RunPhase = 'pre_audit' | 'scanning' | 'window_proposed' | 'course_list' | 'success'

// ── Leo mock messages ────────────────────────────────────────────────────────

const LEO_MESSAGES = [
  'Scanning Spring 2026 courses for Doctor of Physical Therapy…',
  'Found 14 courses — 11 Didactic, 3 Clinical.',
  'All courses have enrolled students.',
  '1 course has no faculty assigned: MED 410. The Instructor section will be suppressed.',
  'Term dates found: Spring 2026 ends May 30, 2026.',
  'Suggested survey window: Opens May 23 · Closes Jun 13.',
]

// ── Helper: get master course for offering ───────────────────────────────────

function getMasterCourse(offering: CourseOffering) {
  return MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
}

function getFaculty(offering: CourseOffering) {
  return MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId)
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function RunEvaluationPage() {
  const { surveys, templates, pushSurveyBatch } = usePce()

  // Pre-populate to active term and first program
  const activeTerm = MOCK_PROGRAM_TERMS.find(t => t.status === 'active') ?? MOCK_PROGRAM_TERMS[0]

  const [phase, setPhase] = useState<RunPhase>('pre_audit')
  const [termId, setTermId] = useState(activeTerm.id)
  const [programId, setProgramId] = useState(MOCK_PROGRAMS[0].id)
  const [messages, setMessages] = useState<string[]>([])
  const [editingDates, setEditingDates] = useState(false)
  const [openDate, setOpenDate] = useState<Date>(new Date('2026-05-23'))
  const [closeDate, setCloseDate] = useState<Date>(new Date('2026-06-13'))
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())
  const [fixOffering, setFixOffering] = useState<CourseOffering | null>(null)
  const [fixTab, setFixTab] = useState<'faculty' | 'students' | 'template'>('faculty')

  // Offerings for selected term
  const termOfferings = MOCK_COURSE_OFFERINGS.filter(o => o.termId === termId)

  // All courses ready when all are resolved or have faculty
  const allReady = termOfferings.every(o => {
    const hasFaculty = !!getFaculty(o)
    return hasFaculty || resolvedIds.has(o.id)
  })

  // Active template for template assignments
  const activeTemplate = templates.find(t => t.status === 'active') ?? null

  // ── Scanning: append messages one by one ────────────────────────────────────

  const scanTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  function startScan() {
    setPhase('scanning')
    setMessages([])
    // Clear any lingering timers
    scanTimersRef.current.forEach(clearTimeout)
    scanTimersRef.current = []

    LEO_MESSAGES.forEach((msg, i) => {
      const t = setTimeout(() => {
        setMessages(prev => [...prev, msg])
        if (i === LEO_MESSAGES.length - 1) {
          // After last message, advance to window_proposed
          const t2 = setTimeout(() => setPhase('window_proposed'), 400)
          scanTimersRef.current.push(t2)
        }
      }, (i + 1) * 800)
      scanTimersRef.current.push(t)
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => scanTimersRef.current.forEach(clearTimeout)
  }, [])

  // ── Push surveys ─────────────────────────────────────────────────────────────

  function handlePush() {
    const term = MOCK_PROGRAM_TERMS.find(t => t.id === termId)
    const templateAssignments: Record<string, string> = {}
    termOfferings.forEach(o => {
      templateAssignments[o.id] = activeTemplate?.id ?? ''
    })

    pushSurveyBatch({
      surveyType: 'course_evaluation',
      termId,
      academicYear: term?.academicYear ?? '2025–2026',
      programId,
      courseOfferingIds: termOfferings.map(o => o.id),
      templateAssignments,
      openDate: openDate.toISOString().split('T')[0],
      closeDate: closeDate.toISOString().split('T')[0],
      emailSubject: 'Your course evaluation for {{course_name}} is now open',
      emailBody: 'Dear Student, your evaluation is now available. Please complete it before the deadline.',
      reminderEnabled: false,
      reminderDaysBefore: 3,
      instructorAccess: true,
      coordinatorAccess: true,
    })
    setPhase('success')
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function formatDate(d: Date) {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  function formatDateShort(d: Date) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function isOfferingReady(o: CourseOffering) {
    return !!getFaculty(o) || resolvedIds.has(o.id)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <header
        className="flex items-center gap-2 border-b border-border shrink-0"
        style={{ padding: '18px 28px 14px' }}
      >
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <Link
            href="/surveys"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Surveys
          </Link>
          <i className="fa-light fa-chevron-right" aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted-foreground)' }} />
          <span className="font-medium" style={{ color: 'var(--foreground)' }}>Run Evaluation</span>
        </nav>
      </header>

      <div
        className="flex-1 overflow-auto"
        style={{ paddingBlock: 28, paddingInline: 28 }}
      >
        <div style={{ maxWidth: 720 }}>

          {/* ── Phase: pre_audit ── */}
          {(phase === 'pre_audit' || phase === 'scanning' || phase === 'window_proposed' || phase === 'course_list') && (
            <div className="flex flex-col gap-6">

              {/* Selectors row */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Term selector */}
                <Select value={termId} onValueChange={setTermId} disabled={phase !== 'pre_audit'}>
                  <SelectTrigger className="h-9 w-40 text-sm" aria-label="Select term">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_PROGRAM_TERMS.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Academic year — derived from term */}
                <Select
                  value={MOCK_PROGRAM_TERMS.find(t => t.id === termId)?.academicYear ?? ''}
                  disabled
                >
                  <SelectTrigger className="h-9 w-36 text-sm" aria-label="Academic year">
                    <SelectValue placeholder="Academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MOCK_PROGRAM_TERMS.find(t => t.id === termId)?.academicYear ?? ''}>
                      {MOCK_PROGRAM_TERMS.find(t => t.id === termId)?.academicYear ?? ''}
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Program selector */}
                <Select value={programId} onValueChange={setProgramId} disabled={phase !== 'pre_audit'}>
                  <SelectTrigger className="h-9 w-56 text-sm" aria-label="Select program">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_PROGRAMS.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {phase === 'pre_audit' && (
                  <Button variant="default" size="sm" onClick={startScan}>
                    <i className="fa-light fa-sparkles" aria-hidden="true" style={{ fontSize: 12 }} />
                    Run Audit
                  </Button>
                )}
              </div>

              {/* ── Leo panel (scanning + window_proposed + course_list) ── */}
              {(phase === 'scanning' || phase === 'window_proposed' || phase === 'course_list') && (
                <div
                  className="flex flex-col gap-4 rounded-xl border border-border"
                  style={{ padding: '18px 20px', background: 'var(--muted)' }}
                >
                  {/* Leo header */}
                  <div className="flex items-center gap-2">
                    <div
                      className="shrink-0 rounded-full animate-pulse"
                      style={{
                        width: 8,
                        height: 8,
                        background: phase === 'scanning' ? 'var(--brand-color)' : 'var(--muted-foreground)',
                        animationPlayState: phase === 'scanning' ? 'running' : 'paused',
                      }}
                    />
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                      Leo
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="flex flex-col gap-2">
                    {messages.map((msg, i) => (
                      <p key={i} className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {msg}
                      </p>
                    ))}
                    {phase === 'scanning' && messages.length === 0 && (
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        Analyzing your program data…
                      </p>
                    )}
                  </div>

                  {/* Window proposal */}
                  {(phase === 'window_proposed' || phase === 'course_list') && (
                    <div
                      className="flex flex-col gap-4 rounded-lg border border-border"
                      style={{ padding: '14px 16px', background: 'var(--card)' }}
                    >
                      {!editingDates ? (
                        <>
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                              Suggested survey window
                            </p>
                            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                              Opens {formatDateShort(openDate)}, {openDate.getFullYear()} · Closes {formatDateShort(closeDate)}, {closeDate.getFullYear()}
                            </p>
                          </div>
                          {phase === 'window_proposed' && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setPhase('course_list')}
                              >
                                <i className="fa-light fa-check" aria-hidden="true" style={{ fontSize: 12 }} />
                                Looks right
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingDates(true)}
                              >
                                Edit dates
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                            Edit survey window
                          </p>
                          <div className="flex flex-wrap gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                                Opens
                              </label>
                              <DatePickerField value={openDate} onChange={(d) => { if (d) setOpenDate(d) }} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                                Closes
                              </label>
                              <DatePickerField value={closeDate} onChange={(d) => { if (d) setCloseDate(d) }} />
                            </div>
                          </div>
                          <div>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setEditingDates(false)
                                setPhase('course_list')
                              }}
                            >
                              Confirm dates
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Course list ── */}
              {phase === 'course_list' && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {termOfferings.length} courses · {MOCK_PROGRAM_TERMS.find(t => t.id === termId)?.name}
                  </p>

                  <div className="flex flex-col gap-2">
                    {termOfferings.map(offering => {
                      const course = getMasterCourse(offering)
                      const faculty = getFaculty(offering)
                      const ready = isOfferingReady(offering)
                      const noFaculty = !faculty && !resolvedIds.has(offering.id)

                      return (
                        <div
                          key={offering.id}
                          className="flex items-center gap-4 rounded-xl border border-border"
                          style={{ padding: '14px 18px', background: 'var(--card)' }}
                        >
                          {/* Course info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                                {course?.code ?? offering.id}
                              </span>
                              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                                {course?.name}
                              </span>
                              {offering.courseType && (
                                <span
                                  className="text-xs rounded-full"
                                  style={{
                                    padding: '2px 8px',
                                    background: 'var(--muted)',
                                    color: 'var(--muted-foreground)',
                                    border: '1px solid var(--border)',
                                  }}
                                >
                                  {offering.courseType === 'didactic' ? 'Didactic' : 'Clinical'}
                                </span>
                              )}
                              {noFaculty && (
                                <i
                                  className="fa-light fa-triangle-exclamation"
                                  aria-hidden="true"
                                  style={{ fontSize: 12, color: 'var(--chart-4)' }}
                                />
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                              {faculty ? faculty.name : 'Unassigned'} · {offering.enrolledCount} students
                            </p>
                          </div>

                          {/* Status badge */}
                          {ready ? (
                            <span
                              className="text-xs font-medium rounded-full shrink-0"
                              style={{
                                padding: '4px 10px',
                                background: 'var(--brand-tint)',
                                color: 'var(--brand-color)',
                              }}
                            >
                              ● Ready
                            </span>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full h-auto shrink-0"
                              style={{
                                padding: '4px 10px',
                                fontSize: 12,
                                background: 'color-mix(in oklch, var(--chart-4) 15%, var(--background))',
                                color: 'var(--chart-4)',
                              }}
                              onClick={() => {
                                setFixOffering(offering)
                                setFixTab('faculty')
                              }}
                            >
                              ⚠ Fix →
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Push button */}
                  <div className="pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      disabled={!allReady}
                      onClick={handlePush}
                    >
                      <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 12 }} />
                      Push Surveys
                    </Button>
                    {!allReady && (
                      <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                        Resolve all issues before pushing.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Phase: success ── */}
          {phase === 'success' && (
            <SuccessState
              offeringCount={termOfferings.length}
              termName={MOCK_PROGRAM_TERMS.find(t => t.id === termId)?.name ?? ''}
              offerings={termOfferings}
              openDate={openDate}
              onReset={() => {
                setPhase('pre_audit')
                setMessages([])
                setResolvedIds(new Set())
                setEditingDates(false)
              }}
            />
          )}
        </div>
      </div>

      {/* ── Fix Drawer ── */}
      <Sheet open={!!fixOffering} onOpenChange={v => { if (!v) setFixOffering(null) }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0" style={{ width: 480, maxWidth: '90vw' }}>
          <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
            <SheetTitle className="text-base">
              {getMasterCourse(fixOffering!)?.code ?? ''} — {getMasterCourse(fixOffering!)?.name ?? ''}
            </SheetTitle>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Fix before pushing
            </p>
          </SheetHeader>

          {fixOffering && (
            <div className="flex-1 overflow-auto px-6 py-5">
              <Tabs value={fixTab} onValueChange={v => setFixTab(v as 'faculty' | 'students' | 'template')}>
                <TabsList>
                  <TabsTrigger value="faculty">Faculty</TabsTrigger>
                  <TabsTrigger value="students">Students</TabsTrigger>
                  <TabsTrigger value="template">Template</TabsTrigger>
                </TabsList>

                {/* Faculty tab */}
                <TabsContent value="faculty" className="pt-4">
                  <FixFacultyTab
                    offering={fixOffering}
                    onResolve={() => {
                      setResolvedIds(prev => new Set([...prev, fixOffering.id]))
                      setFixOffering(null)
                    }}
                  />
                </TabsContent>

                {/* Students tab */}
                <TabsContent value="students" className="pt-4">
                  <FixStudentsTab offering={fixOffering} />
                </TabsContent>

                {/* Template tab */}
                <TabsContent value="template" className="pt-4">
                  <FixTemplateTab activeTemplateName={activeTemplate?.name ?? null} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

// ── Success state ─────────────────────────────────────────────────────────────

function SuccessState({
  offeringCount,
  termName,
  offerings,
  openDate,
  onReset,
}: {
  offeringCount: number
  termName: string
  offerings: CourseOffering[]
  openDate: Date
  onReset: () => void
}) {
  const openLabel = openDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <div
      className="flex flex-col items-center gap-8 py-16 text-center"
      style={{ maxWidth: 480, marginInline: 'auto' }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 64, height: 64, background: 'var(--brand-tint)' }}
      >
        <i
          className="fa-light fa-circle-check"
          aria-hidden="true"
          style={{ fontSize: 32, color: 'var(--brand-color)' }}
        />
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">
          {offeringCount} survey{offeringCount !== 1 ? 's' : ''} pushed for {termName}
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Opens {openLabel}. Students will receive an invitation email on that date.
        </p>
      </div>

      {/* Course code pills */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {offerings.map(offering => {
          const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
          return (
            <span
              key={offering.id}
              className="rounded-full text-xs font-medium"
              style={{
                padding: '3px 10px',
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
              }}
            >
              {course?.code ?? offering.id}
            </span>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onReset}>
          Run another
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link href="/surveys">
            View surveys
            <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
          </Link>
        </Button>
      </div>
    </div>
  )
}

// ── Fix drawer tab: Faculty ───────────────────────────────────────────────────

function FixFacultyTab({
  offering,
  onResolve,
}: {
  offering: CourseOffering
  onResolve: () => void
}) {
  const faculty = getFaculty(offering)

  if (faculty) {
    return (
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-full text-sm font-semibold shrink-0"
          style={{
            width: 36,
            height: 36,
            background: 'var(--muted)',
            color: 'var(--muted-foreground)',
          }}
        >
          {faculty.initials}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{faculty.name}</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Primary faculty</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-lg border border-border p-4 flex flex-col gap-2"
        style={{ background: 'color-mix(in oklch, var(--chart-4) 8%, var(--card))' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          No faculty assigned to this course offering.
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Without a faculty assignment, students will not see the Instructor section in their survey.
          You can still push the survey — the Instructor section will be suppressed automatically.
        </p>
      </div>
      <Button variant="default" size="sm" onClick={onResolve}>
        <i className="fa-light fa-check" aria-hidden="true" style={{ fontSize: 12 }} />
        Mark as resolved
      </Button>
    </div>
  )
}

// ── Fix drawer tab: Students ──────────────────────────────────────────────────

function FixStudentsTab({ offering }: { offering: CourseOffering }) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex items-center gap-3 rounded-lg border border-border"
        style={{ padding: '12px 14px', background: 'var(--card)' }}
      >
        <i
          className="fa-light fa-users"
          aria-hidden="true"
          style={{ fontSize: 18, color: 'var(--brand-color)' }}
        />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {offering.enrolledCount} students enrolled
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            All enrolled students will receive the survey on the open date.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Fix drawer tab: Template ──────────────────────────────────────────────────

function FixTemplateTab({ activeTemplateName }: { activeTemplateName: string | null }) {
  if (activeTemplateName) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Auto-assigned template</p>
        <div
          className="flex items-center gap-2 rounded-lg border border-border"
          style={{ padding: '10px 14px', background: 'var(--card)' }}
        >
          <i
            className="fa-light fa-file-lines"
            aria-hidden="true"
            style={{ fontSize: 14, color: 'var(--brand-color)' }}
          />
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {activeTemplateName}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        No active templates found.
      </p>
      <Button variant="outline" size="sm" asChild>
        <Link href="/templates">
          Go to Templates
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Link>
      </Button>
    </div>
  )
}
