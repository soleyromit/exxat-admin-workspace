'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Button,
  Card,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Sheet, SheetContent, SheetHeader, SheetTitle,
  Tabs, TabsList, TabsTrigger, TabsContent,
  DatePickerField,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  MOCK_MASTER_COURSES,
  MOCK_PROGRAMS,
  MOCK_FACULTY,
  MOCK_STUDENTS,
  MOCK_COURSE_ENROLLMENTS,
  type CourseOffering,
  type ProgramTerm,
} from '@/lib/pce-mock-data'
import { CourseManagementSheet } from '@/components/pce/course-management-sheet'

// ── Types ────────────────────────────────────────────────────────────────────

type RunPhase = 'pre_audit' | 'needs_dates' | 'scanning' | 'window_proposed' | 'course_list' | 'success'

// ── Helpers: get related data ────────────────────────────────────────────────

function getMasterCourse(offering: CourseOffering) {
  return MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
}

function getFaculty(offering: CourseOffering) {
  return MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId)
}

// ── Dynamic Leo messages ─────────────────────────────────────────────────────

function buildLeoMessages(
  term: ProgramTerm,
  offerings: CourseOffering[],
  programName: string,
  openDate: Date,
  closeDate: Date,
): string[] {
  const didactic = offerings.filter(o => o.courseType === 'didactic').length
  const clinical = offerings.filter(o => o.courseType === 'clinical').length
  const noFaculty = offerings.filter(o => !getFaculty(o))
  const endLabel = new Date(term.endDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  const openLabel = openDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const closeLabel = closeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return [
    `Scanning ${term.name} courses for ${programName}…`,
    `Found ${offerings.length} course${offerings.length !== 1 ? 's' : ''} — ${didactic} Didactic, ${clinical} Clinical.`,
    `All courses have enrolled students.`,
    noFaculty.length > 0
      ? `${noFaculty.length} course${noFaculty.length > 1 ? 's have' : ' has'} no faculty — Instructor section will be suppressed.`
      : `All courses have faculty assigned.`,
    `Term dates found: ${term.name} ends ${endLabel}.`,
    `Suggested survey window: Opens ${openLabel} · Closes ${closeLabel}.`,
  ]
}

// ── Compute window from term end date ────────────────────────────────────────

function computeWindow(term: ProgramTerm): { openDate: Date; closeDate: Date } {
  const end = new Date(term.endDate + 'T00:00:00')
  return {
    openDate: new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000),
    closeDate: new Date(end.getTime() + 14 * 24 * 60 * 60 * 1000),
  }
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function RunEvaluationPage() {
  const { surveys, templates, pushSurveyBatch } = usePce()

  const activeTerm = MOCK_PROGRAM_TERMS.find(t => t.status === 'active') ?? MOCK_PROGRAM_TERMS[0]
  const initialWindow = computeWindow(activeTerm)

  const [phase, setPhase] = useState<RunPhase>('pre_audit')
  const [termId, setTermId] = useState(activeTerm.id)
  const [programId, setProgramId] = useState(MOCK_PROGRAMS[0].id)
  const [messages, setMessages] = useState<string[]>([])
  const [editingDates, setEditingDates] = useState(false)
  const [openDate, setOpenDate] = useState<Date>(initialWindow.openDate)
  const [closeDate, setCloseDate] = useState<Date>(initialWindow.closeDate)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())
  const [fixOffering, setFixOffering] = useState<CourseOffering | null>(null)
  const [fixTab, setFixTab] = useState<'faculty' | 'students' | 'template'>('faculty')
  // For missing term-dates branch
  const [missingTermOpen, setMissingTermOpen] = useState<Date | undefined>()
  const [missingTermClose, setMissingTermClose] = useState<Date | undefined>()

  const selectedTerm = MOCK_PROGRAM_TERMS.find(t => t.id === termId) ?? activeTerm
  const selectedProgram = MOCK_PROGRAMS.find(p => p.id === programId) ?? null
  const termOfferings = MOCK_COURSE_OFFERINGS.filter(o => o.termId === termId)

  const allReady = termOfferings.every(o => !!getFaculty(o) || resolvedIds.has(o.id))

  const activeTemplate = templates.find(t => t.status === 'active') ?? null

  const scanTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  function startScan() {
    // If term has no end date, collect dates first
    if (!selectedTerm.endDate) {
      setPhase('needs_dates')
      return
    }

    const window = computeWindow(selectedTerm)
    setOpenDate(window.openDate)
    setCloseDate(window.closeDate)

    setPhase('scanning')
    setMessages([])
    scanTimersRef.current.forEach(clearTimeout)
    scanTimersRef.current = []

    const msgs = buildLeoMessages(selectedTerm, termOfferings, selectedProgram?.name ?? 'your program', window.openDate, window.closeDate)

    msgs.forEach((msg, i) => {
      const t = setTimeout(() => {
        setMessages(prev => [...prev, msg])
        if (i === msgs.length - 1) {
          const t2 = setTimeout(() => setPhase('window_proposed'), 400)
          scanTimersRef.current.push(t2)
        }
      }, (i + 1) * 800)
      scanTimersRef.current.push(t)
    })
  }

  function confirmMissingDates() {
    if (!missingTermOpen || !missingTermClose) return
    setOpenDate(missingTermOpen)
    setCloseDate(missingTermClose)
    setPhase('scanning')
    setMessages([])

    const fakeTerm = { ...selectedTerm, endDate: missingTermClose.toISOString().split('T')[0] }
    const msgs = buildLeoMessages(fakeTerm, termOfferings, selectedProgram?.name ?? 'your program', missingTermOpen, missingTermClose)

    msgs.forEach((msg, i) => {
      const t = setTimeout(() => {
        setMessages(prev => [...prev, msg])
        if (i === msgs.length - 1) {
          const t2 = setTimeout(() => setPhase('window_proposed'), 400)
          scanTimersRef.current.push(t2)
        }
      }, (i + 1) * 800)
      scanTimersRef.current.push(t)
    })
  }

  useEffect(() => {
    return () => scanTimersRef.current.forEach(clearTimeout)
  }, [])

  function handlePush() {
    const templateAssignments: Record<string, string> = {}
    termOfferings.forEach(o => {
      templateAssignments[o.id] = activeTemplate?.id ?? ''
    })

    pushSurveyBatch({
      surveyType: 'course_evaluation',
      termId,
      academicYear: selectedTerm.academicYear,
      programId,
      courseOfferingIds: termOfferings.map(o => o.id),
      templateAssignments,
      openDate: openDate.toISOString().split('T')[0],
      closeDate: closeDate.toISOString().split('T')[0],
      emailSubject: 'Your course evaluation for {{course_name}} is now open',
      emailBody: 'Dear Student, your evaluation is now available. Please complete it before the deadline.',
      reminderEnabled: false,
      reminderDaysBefore: 3,
      reportAccess: {
        course_instructor: ['subject_faculty', 'program_director', 'department_chair'],
        course_coordinator: ['subject_faculty', 'program_director', 'department_chair'],
      },
    })
    setPhase('success')
  }

  function formatDateShort(d: Date) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function isOfferingReady(o: CourseOffering) {
    return !!getFaculty(o) || resolvedIds.has(o.id)
  }

  return (
    <>
      {/* Header */}
      <SiteHeader title="Run Evaluation" />
      <h1 className="sr-only">Run Evaluation</h1>
      <div className="flex items-center gap-3 shrink-0" style={{ padding: '14px 28px 14px' }}>
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <Link href="/surveys" className="text-muted-foreground hover:text-foreground transition-colors">
            Surveys
          </Link>
          <i className="fa-light fa-chevron-right" aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted-foreground)' }} />
          <span className="font-medium" style={{ color: 'var(--foreground)' }}>Run Evaluation</span>
        </nav>
      </div>

      <div className="flex-1 overflow-auto" style={{ paddingBlock: 28, paddingInline: 28 }}>
        <div style={{ maxWidth: 720 }}>
          <div className="flex flex-col gap-6">

            {/* ── Cycle banner (pre_audit only) ── */}
            {phase === 'pre_audit' && (
              <div
                className="flex items-start gap-3 rounded-xl px-5 py-4"
                style={{
                  background: 'var(--brand-color-surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <i
                  className="fa-light fa-sparkles shrink-0 mt-0.5"
                  aria-hidden="true"
                  style={{ fontSize: 14, color: 'var(--brand-color)' }}
                />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--brand-color-dark)' }}>
                    {selectedTerm.name} evaluation cycle is ready to launch
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--brand-color-dark)', opacity: 0.75 }}>
                    Select the program, run the audit to review courses, then push evaluations to students.
                  </p>
                </div>
              </div>
            )}

            {/* Selectors row */}
            {(phase === 'pre_audit' || phase === 'needs_dates' || phase === 'scanning' || phase === 'window_proposed' || phase === 'course_list') && (
              <div className="flex flex-wrap items-center gap-3">
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

                <Select value={selectedTerm.academicYear} disabled>
                  <SelectTrigger className="h-9 w-36 text-sm" aria-label="Academic year">
                    <SelectValue placeholder="Academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={selectedTerm.academicYear}>{selectedTerm.academicYear}</SelectItem>
                  </SelectContent>
                </Select>

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
            )}

            {/* ── Missing term dates branch ── */}
            {phase === 'needs_dates' && (
              <div
                className="flex flex-col gap-4 rounded-xl px-5 py-4"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start gap-2">
                  <i className="fa-light fa-triangle-exclamation shrink-0 mt-0.5" aria-hidden="true" style={{ fontSize: 13, color: 'var(--chart-4)' }} />
                  <div>
                    <p className="text-sm font-semibold">Term dates not found for {selectedTerm.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enter the survey open and close dates to continue. These will be saved for future use.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Survey opens</label>
                    <DatePickerField value={missingTermOpen} onChange={d => { if (d) setMissingTermOpen(d) }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Survey closes</label>
                    <DatePickerField value={missingTermClose} onChange={d => { if (d) setMissingTermClose(d) }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!missingTermOpen || !missingTermClose}
                    onClick={confirmMissingDates}
                  >
                    Confirm Dates
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPhase('pre_audit')}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* ── Leo panel — dark gradient (scanning + window_proposed) ── */}
            {(phase === 'scanning' || phase === 'window_proposed') && (
              <div
                className="flex flex-col gap-4 rounded-xl"
                style={{
                  padding: '20px 22px',
                  background: 'linear-gradient(155deg, hsl(246 55% 11%) 0%, hsl(248 48% 17%) 100%)',
                  border: '1px solid hsl(246 40% 25%)',
                }}
              >
                {/* Leo header with animated orb */}
                <div className="flex items-center gap-3">
                  <div
                    className={phase === 'scanning' ? 'animate-pulse' : ''}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: 'radial-gradient(circle at 35% 35%, hsl(258 100% 82%), hsl(246 80% 55%))',
                      boxShadow: phase === 'scanning' ? '0 0 10px 3px hsl(258 70% 60% / 0.5)' : 'none',
                    }}
                  />
                  <span className="text-xs font-semibold" style={{ color: 'hsl(246 60% 78%)' }}>
                    Leo
                  </span>
                </div>

                {/* Messages */}
                <div className="flex flex-col gap-2">
                  {messages.map((msg, i) => (
                    <p key={i} className="text-sm" style={{ color: 'hsl(0 0% 88%)' }}>
                      {msg}
                    </p>
                  ))}
                  {phase === 'scanning' && messages.length === 0 && (
                    <p className="text-sm" style={{ color: 'hsl(246 30% 60%)' }}>
                      Analyzing your program data…
                    </p>
                  )}
                </div>

                {/* Survey window proposal */}
                {phase === 'window_proposed' && (
                  <div
                    className="flex flex-col gap-4 rounded-lg"
                    style={{
                      padding: '14px 16px',
                      background: 'hsl(246 45% 15%)',
                      border: '1px solid hsl(246 38% 27%)',
                    }}
                  >
                    {!editingDates ? (
                      <>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-semibold" style={{ color: 'hsl(0 0% 92%)' }}>
                            Suggested survey window
                          </p>
                          <p className="text-sm" style={{ color: 'hsl(246 30% 65%)' }}>
                            Opens {formatDateShort(openDate)}, {openDate.getFullYear()} · Closes {formatDateShort(closeDate)}, {closeDate.getFullYear()}
                          </p>
                        </div>
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
                            style={{ borderColor: 'hsl(246 38% 35%)', color: 'hsl(0 0% 80%)' }}
                          >
                            Edit dates
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <p className="text-sm font-semibold" style={{ color: 'hsl(0 0% 92%)' }}>
                          Edit survey window
                        </p>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium" style={{ color: 'hsl(246 30% 65%)' }}>
                              Opens
                            </label>
                            <DatePickerField value={openDate} onChange={(d) => { if (d) setOpenDate(d) }} />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium" style={{ color: 'hsl(246 30% 65%)' }}>
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

            {/* ── Leo summary bar (course_list phase) ── */}
            {phase === 'course_list' && (
              <div
                className="flex items-center gap-3 rounded-lg"
                style={{ padding: '10px 14px', background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--brand-color)',
                    flexShrink: 0,
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Leo — Found {termOfferings.length} courses · Survey window {formatDateShort(openDate)}–{formatDateShort(closeDate)}
                </span>
              </div>
            )}

            {/* ── Course list ── */}
            {phase === 'course_list' && (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  {termOfferings.length} courses · {selectedTerm.name}
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
                            {activeTemplate && ` · ${activeTemplate.name}`}
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
                              background: 'var(--muted)',
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

            {/* ── Success ── */}
            {phase === 'success' && (
              <SuccessState
                offeringCount={termOfferings.length}
                termName={selectedTerm.name}
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
      </div>

      {/* ── Fix Drawer ── */}
      <Sheet open={!!fixOffering} onOpenChange={v => { if (!v) setFixOffering(null) }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0" style={{ width: 480, maxWidth: '90vw' }}>
          <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
            <SheetTitle className="text-base">
              {fixOffering ? `${getMasterCourse(fixOffering)?.code ?? ''} — ${getMasterCourse(fixOffering)?.name ?? ''}` : ''}
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

                <TabsContent value="faculty" className="pt-4">
                  <FixFacultyTab
                    offering={fixOffering}
                    onResolve={() => {
                      setResolvedIds(prev => new Set([...prev, fixOffering.id]))
                      setFixOffering(null)
                    }}
                  />
                </TabsContent>

                <TabsContent value="students" className="pt-4">
                  <FixStudentsTab offering={fixOffering} />
                </TabsContent>

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

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">
          {offeringCount} survey{offeringCount !== 1 ? 's' : ''} pushed for {termName}
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Opens {openLabel}. Students will receive an invitation email on that date.
        </p>
      </div>

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

// ── Fix drawer tabs ───────────────────────────────────────────────────────────

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
      <div className="rounded-md bg-muted p-4 flex flex-col gap-2">
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

function FixStudentsTab({ offering }: { offering: CourseOffering }) {
  const [rosterOpen, setRosterOpen] = useState(false)

  const enrolledIds = MOCK_COURSE_ENROLLMENTS[offering.id] ?? []
  const enrolledStudents = enrolledIds
    .map(id => MOCK_STUDENTS.find(s => s.id === id))
    .filter(Boolean) as typeof MOCK_STUDENTS

  return (
    <div className="flex flex-col gap-3">
      {/* Summary row */}
      <Card className="flex items-center gap-3 px-[14px] py-3 shadow-none">
        <i
          className="fa-light fa-users"
          aria-hidden="true"
          style={{ fontSize: 18, color: 'var(--brand-color)' }}
        />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {offering.enrolledCount} students enrolled
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            All enrolled students will receive the survey on the open date.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRosterOpen(true)}>
          <i className="fa-light fa-list-ul" aria-hidden="true" style={{ fontSize: 12 }} />
          Manage roster
        </Button>
      </Card>

      {/* Student preview list */}
      {enrolledStudents.length > 0 && (
        <Card className="flex flex-col overflow-hidden shadow-none">
          {enrolledStudents.map((student, i) => (
            <div
              key={student.id}
              className="flex items-center gap-3"
              style={{
                padding: '8px 14px',
                borderBottom: i < enrolledStudents.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: 26, height: 26,
                  background: 'var(--avatar-initials-bg)',
                  color: 'var(--avatar-initials-fg)',
                  fontSize: 11, fontWeight: 600,
                }}
              >
                {student.firstName[0]}{student.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                  {student.email}
                </p>
              </div>
            </div>
          ))}
          {offering.enrolledCount > enrolledStudents.length && (
            <div
              className="flex items-center justify-center"
              style={{ padding: '8px 14px', borderTop: '1px solid var(--border)' }}
            >
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                +{offering.enrolledCount - enrolledStudents.length} more not shown in demo
              </p>
            </div>
          )}
        </Card>
      )}

      <CourseManagementSheet
        offering={offering}
        open={rosterOpen}
        onOpenChange={setRosterOpen}
      />
    </div>
  )
}

function FixTemplateTab({ activeTemplateName }: { activeTemplateName: string | null }) {
  if (activeTemplateName) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Auto-assigned template</p>
        <Card className="flex items-center gap-2 px-[14px] py-[10px] shadow-none">
          <i
            className="fa-light fa-file-lines"
            aria-hidden="true"
            style={{ fontSize: 14, color: 'var(--brand-color)' }}
          />
          <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {activeTemplateName}
          </span>
        </Card>
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
