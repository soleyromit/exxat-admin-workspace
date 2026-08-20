'use client'

// ============================================================================
// Set up term — wizard (Jul 10 2026, v2 per Romit):
//
//   1. Term details      — name + academic year + dates (evaluation window is
//                          DERIVED from term end ±7d, not asked).
//   2. Courses & Survey design — the SAME merged Courses DataTable the push
//                          wizard uses (StepCoursesEvaluatees, scope locked to
//                          the step-1 term): course selection, per-row template
//                          assignment, and template-driven validation in one step.
//   3–4. Communication → Review — the exact send-evaluation steps, reused as
//        components but instantiated HERE with independent state. This route
//        never shares state with /surveys/push: same steps, separate wizard,
//        no field or interaction overrides between the two.
//
// Entry: /course-evaluation/term-setup (?phase=readiness jumps to step 2 —
// the dashboard's "Add missing info" path).
// ============================================================================

import { Suspense, useMemo, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Button,
  Calendar,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Skeleton,
  Field,
  FieldLabel,
  FieldError,
  localDateToYmd,
  ymdToLocalDate,
  formatYmdForDisplay,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { WizardNav } from '@/components/pce/wizard-nav'
import { usePce } from '@/components/pce/pce-state'
import { StepCoursesEvaluatees } from '@/components/pce/courses-evaluatees/step-courses-evaluatees'
import { StepCommunication, type Reminder, type EmailContact } from '@/components/pce/distribute-wizard/step-communication'
import { StepReview } from '@/components/pce/distribute-wizard/step-review'
import { StepSuccess } from '@/components/pce/distribute-wizard/step-success'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  MOCK_COURSE_ENROLLMENTS,
  MOCK_MASTER_COURSES,
  EVAL_DATE_RULES,
  EVAL_EMAIL_TEMPLATES,
  type TermSeason,
} from '@/lib/pce-mock-data'
import { resolveTerm, cohortOptions, offeringsForScope, TERM_SEASONS } from '@/lib/pce-course-scope'
import { type Criterion, ALL_CRITERIA, CRITERION_TOGGLE_LABEL, templateCriteria } from '@/lib/pce-course-readiness'
import { subjectDataIssues, windowIssues } from '@/lib/pce-push-validation'

type WizardStep = 1 | 2 | 3 | 4 | 'success' | 'saved'

// Course readiness + Survey design merged into one step (Jul 2026): course
// selection, per-row template assignment, template-driven validation.
const STEPS = [
  { n: 1, label: 'Term details' },
  { n: 2, label: 'Courses & Survey Design' },
  { n: 3, label: 'Communication' },
  { n: 4, label: 'Review' },
]

// Evaluation window opens 7d before term end, closes 7d after (REQ-07).
const EVAL_WINDOW_OFFSET_DAYS = 7

// The upcoming term Prism already has offerings for — pre-filled so the term
// the admin configures matches the offerings audited in step 2.
const SEED_TERM = MOCK_PROGRAM_TERMS.find((t) => t.id === 'pt5')!

const FIRST_INVITATION_TEMPLATE = EVAL_EMAIL_TEMPLATES.find(t => t.type === 'invitation') ?? null
const FIRST_REMINDER_TEMPLATE = EVAL_EMAIL_TEMPLATES.find(t => t.type === 'reminder') ?? null

function addDaysYmd(ymd: string, days: number): string {
  const d = ymdToLocalDate(ymd)
  if (!d) return ymd
  d.setDate(d.getDate() + days)
  return localDateToYmd(d)
}
const formatYmd = (ymd: string): string => formatYmdForDisplay(ymd)

function dateToYmd(d: Date | undefined): string {
  if (!d) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Current + future calendar years (live reference dropdown: 2026…2029). */
function yearChoicesList(): string[] {
  const y = new Date().getFullYear()
  return Array.from({ length: 4 }, (_, i) => `${y + i}`)
}

/** AY range from the term's season + calendar year — Spring sits in its AY's
 *  second year (Spring 2027 → 2026–2027); Fall/Summer in the first. */
function deriveAcademicYear(season: TermSeason | '', year: string): string {
  if (!season || !year) return ''
  const n = Number(year)
  return season === 'Spring' ? `${n - 1}–${n}` : `${n}–${n + 1}`
}

/** Communication window derived from the step-1 END date + Settings offsets. */
function windowFromEnd(endYmd: string | undefined): { open?: Date; close?: Date; release?: Date } {
  if (!endYmd) return {}
  const end = ymdToLocalDate(endYmd)
  if (!end) return {}
  const shift = (days: number) => { const n = new Date(end); n.setDate(n.getDate() + days); return n }
  return {
    open: shift(EVAL_DATE_RULES.opensOffset),
    close: shift(EVAL_DATE_RULES.closesOffset),
    release: shift(EVAL_DATE_RULES.releaseOffset),
  }
}

function TermSetupInner() {
  const params = useSearchParams()
  const { templates, pushSurveyBatch, setupDefaults, addProgramTerm } = usePce()

  const publishedTemplates = templates.filter(
    t => t.status === 'active' && (!t.surveyType || t.surveyType === 'course_evaluation'),
  )

  /* ?phase=readiness — the dashboard's "Add missing info" enters at step 2
   * (Course readiness). The term already exists, so Term details is dropped
   * from the flow entirely rather than shown as a completed step behind us. */
  const enteredAtReadiness = params?.get('phase') === 'readiness'
  const [step, setStep] = useState<WizardStep>(enteredAtReadiness ? 2 : 1)

  // ── Step 1 — term details (seeded from the discovered upcoming term).
  //    Term + Academic year are DROPDOWNS (live reference: pce-three
  //    Configure Term Calendar — season Spring/Summer/Fall + current/future
  //    year); the term name is derived, never typed. ──
  const [season, setSeason] = useState<TermSeason | ''>(SEED_TERM.season)
  /* Calendar year of the term (live reference: plain years, current + future). */
  const [year, setYear] = useState(SEED_TERM.startDate.slice(0, 4))
  const [startYmd, setStartYmd] = useState<string | undefined>(SEED_TERM.startDate)
  const [endYmd, setEndYmd] = useState<string | undefined>(SEED_TERM.endDate)

  const yearChoices = useMemo(() => {
    const generated = yearChoicesList()
    const seedYear = SEED_TERM.startDate.slice(0, 4)
    return generated.includes(seedYear) ? generated : [seedYear, ...generated]
  }, [])

  const academicYear = deriveAcademicYear(season, year)
  const name = season && year ? `${season} ${year}` : ''
  const endsAfterStart = !!startYmd && !!endYmd && endYmd > startYmd
  const dateError = !!startYmd && !!endYmd && !endsAfterStart
  const configValid = !!season && !!year && !!startYmd && endsAfterStart

  const derivedWindow =
    endYmd != null && endsAfterStart
      ? { open: addDaysYmd(endYmd, -EVAL_WINDOW_OFFSET_DAYS), close: addDaysYmd(endYmd, EVAL_WINDOW_OFFSET_DAYS) }
      : null

  // ── Step 2 — Courses & Survey design (scope LOCKED to the step-1 term) ────
  const ceSeason = season
  const [ceCohorts, setCeCohorts] = useState<string[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())

  const ceScopeTerm = useMemo(() => resolveTerm(ceSeason, academicYear), [ceSeason, academicYear])
  const ceCohortOpts = useMemo(() => cohortOptions(ceScopeTerm), [ceScopeTerm])
  const ceScoped = useMemo(
    () => offeringsForScope(ceSeason, academicYear, ceCohorts),
    [ceSeason, academicYear, ceCohorts],
  )

  const selectedOfferings = useMemo(
    () => MOCK_COURSE_OFFERINGS.filter(o => selectedCourseIds.has(o.id)),
    [selectedCourseIds],
  )

  // Template per course — lives IN step 2 now. Defaults cover every SCOPED
  // course (not just selected) so deselected rows keep a sensible default.
  const [templateAssignments, setTemplateAssignments] = useState<Record<string, string>>({})
  const defaultAssignments = useMemo(() => {
    const result: Record<string, string> = {}
    if (publishedTemplates.length === 0) return result
    const single = publishedTemplates.length === 1 ? publishedTemplates[0] : null
    for (const o of ceScoped) {
      if (single) { result[o.id] = single.id; continue }
      const matched = o.courseType ? publishedTemplates.find(t => t.courseType === o.courseType) : undefined
      result[o.id] = (matched ?? publishedTemplates[0]).id
    }
    return result
  }, [ceScoped, publishedTemplates])

  // ── Step 4 — communication (window follows the step-1 END date) ───────────
  const initialWindow = useMemo(() => windowFromEnd(SEED_TERM.endDate), [])
  const [openDate, setOpenDate] = useState<Date | undefined>(initialWindow.open)
  const [closeDate, setCloseDate] = useState<Date | undefined>(initialWindow.close)
  const [releaseDate, setReleaseDate] = useState<Date | undefined>(initialWindow.release)
  const [senderName, setSenderName] = useState('Exxat Surveys')
  const [emailTemplateId, setEmailTemplateId] = useState(FIRST_INVITATION_TEMPLATE?.id ?? '')
  const [emailSubject, setEmailSubject] = useState(FIRST_INVITATION_TEMPLATE?.subject ?? setupDefaults.initialEmailSubject)
  const [emailBody, setEmailBody] = useState(FIRST_INVITATION_TEMPLATE?.body ?? setupDefaults.initialEmailBody)
  const [reminders, setReminders] = useState<Reminder[]>(() =>
    [...setupDefaults.activeReminderIntervals].sort((a, b) => b - a).map(d => ({ id: `r-${d}`, daysBefore: d })),
  )
  const [emailContacts, setEmailContacts] = useState<EmailContact[]>([])
  const [reminderSameAsInvite, setReminderSameAsInvite] = useState(false)
  const [reminderTemplateId, setReminderTemplateId] = useState(FIRST_REMINDER_TEMPLATE?.id ?? '')
  const [reminderSubject, setReminderSubject] = useState(FIRST_REMINDER_TEMPLATE?.subject ?? '')
  const [reminderBody, setReminderBody] = useState(FIRST_REMINDER_TEMPLATE?.body ?? '')

  // Recompute the window when the admin edits the step-1 end date.
  const windowMounted = useRef(false)
  useEffect(() => {
    if (!windowMounted.current) { windowMounted.current = true; return }
    const w = windowFromEnd(endYmd)
    setOpenDate(w.open); setCloseDate(w.close); setReleaseDate(w.release)
  }, [endYmd])

  // ── Review derivations (same shapes the push wizard feeds StepReview) ─────
  const selectedInvitationTemplate = EVAL_EMAIL_TEMPLATES.find(t => t.id === emailTemplateId) ?? null
  const isEmailEdited = !!selectedInvitationTemplate &&
    (emailSubject !== selectedInvitationTemplate.subject || emailBody !== selectedInvitationTemplate.body)

  const prismStudentCount = useMemo(() => {
    const seen = new Set<string>()
    for (const o of selectedOfferings) for (const sid of MOCK_COURSE_ENROLLMENTS[o.id] ?? []) seen.add(sid)
    return seen.size
  }, [selectedOfferings])

  const reviewCourseGroups = useMemo(() => {
    const byTid = new Map<string, { templateTitle: string; codes: string[] }>()
    for (const o of selectedOfferings) {
      const tid = templateAssignments[o.id] || 'none'
      const title = publishedTemplates.find(t => t.id === tid)?.name ?? 'No template assigned'
      const code = MOCK_MASTER_COURSES.find(c => c.id === o.masterCourseId)?.code ?? o.id
      if (!byTid.has(tid)) byTid.set(tid, { templateTitle: title, codes: [] })
      byTid.get(tid)!.codes.push(code)
    }
    return [...byTid.values()].sort((a, b) => b.codes.length - a.codes.length)
  }, [selectedOfferings, templateAssignments, publishedTemplates])

  const reviewSubjectIssues = useMemo(() => subjectDataIssues(selectedOfferings), [selectedOfferings])
  const reviewWindowIssues = useMemo(() => windowIssues(selectedOfferings, openDate), [selectedOfferings, openDate])
  const cohortSummary = ceCohorts.join(' · ')
  // What's evaluated = the union of what the selected courses' templates evaluate.
  const evaluateSummary = useMemo(() => {
    const found = new Set<Criterion>()
    for (const o of selectedOfferings) {
      const tid = templateAssignments[o.id] ?? defaultAssignments[o.id]
      const t = publishedTemplates.find(x => x.id === tid)
      if (t) for (const c of templateCriteria(t)) found.add(c)
    }
    return ALL_CRITERIA.filter(c => found.has(c)).map(c => CRITERION_TOGGLE_LABEL[c]).join(', ')
  }, [selectedOfferings, templateAssignments, defaultAssignments, publishedTemplates])

  // ── Handlers ───────────────────────────────────────────────────────────────
  function goToReadiness() {
    setStep(2)
  }

  /* A NEW term (no existing ProgramTerm for this season+year) joins the
   * program calendar so the dashboard shows its card immediately. */
  function registerTermIfNew() {
    if (!ceScopeTerm && season && startYmd && endYmd) {
      addProgramTerm({
        id: `pt-${season.toLowerCase()}-${year}`,
        name,
        season,
        academicYear,
        startDate: startYmd,
        endDate: endYmd,
        status: 'active',
        enabledForEval: true,
      })
    }
  }

  /* No Prism offerings yet — the term can still join the calendar; readiness
   * and evaluations happen once Prism loads its courses. */
  function saveTermOnly() {
    registerTermIfNew()
    setStep('saved')
  }

  function handlePush() {
    registerTermIfNew()
    pushSurveyBatch({
      surveyType: 'course_evaluation',
      termId: ceScopeTerm?.id ?? SEED_TERM.id,
      academicYear,
      programId: '',
      courseOfferingIds: selectedOfferings.map(o => o.id),
      templateAssignments,
      openDate: dateToYmd(openDate),
      closeDate: dateToYmd(closeDate),
      emailSubject,
      emailBody,
      reminderEnabled: reminders.length > 0,
      reminderDaysBefore: reminders[0]?.daysBefore ?? 3,
      reportAccess: {},
    })
    setStep('success')
  }

  const currentStepNum = step === 'success' || step === 'saved' ? 5 : step
  const completedUpTo = step === 'success' || step === 'saved' ? 4 : (step as number) - 1

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader
        breadcrumbs={[{ label: 'Dashboard', href: '/course-evaluation/dashboard' }]}
        title="Set up term"
      />
      <h1 className="sr-only">Set up term</h1>

      {step !== 'success' && step !== 'saved' && (
        <WizardNav
          currentStep={currentStepNum}
          completedUpTo={completedUpTo}
          onStepClick={(n) => n < currentStepNum && setStep(n as WizardStep)}
          steps={enteredAtReadiness ? STEPS.filter((s) => s.n !== 1) : STEPS}
        />
      )}

      <div className="flex-1 overflow-auto flex flex-col" style={{ padding: '32px 40px 0' }}>
        <div className="flex flex-col gap-6 flex-1">
          {/* ── Step 1 · Term details ── */}
          {step === 1 && (
            <>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  Term details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Name the term and set its dates. The evaluation window is derived from the term end date.
                </p>
              </div>

              <div className="flex flex-col gap-5" style={{ maxWidth: 560 }}>
                <div className="flex items-start gap-2 text-xs text-muted-foreground" role="note">
                  <i
                    className="fa-light fa-wand-magic-sparkles mt-0.5 shrink-0 text-foreground"
                    aria-hidden="true"
                  />
                  <span>
                    Detected from your academic calendar — review and confirm. Terms
                    roll forward each cycle, so the next one is pre-filled.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="term-season">Term</FieldLabel>
                    <Select value={season} onValueChange={(v) => setSeason(v as TermSeason)}>
                      <SelectTrigger id="term-season" className="w-full" aria-required="true">
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        {TERM_SEASONS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="term-year">Academic year</FieldLabel>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger id="term-year" className="w-full" aria-required="true">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearChoices.map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DateField label="Start date" valueYmd={startYmd} onChange={setStartYmd} />
                  <DateField
                    label="End date"
                    valueYmd={endYmd}
                    onChange={setEndYmd}
                    errorMessage={dateError ? 'End date must be after the start date.' : undefined}
                  />
                </div>

                {derivedWindow && (
                  <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                    <p className="text-xs font-medium text-foreground">
                      {name ? `${name} — evaluation window (derived)` : 'Evaluation window (derived)'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Opens {formatYmd(derivedWindow.open)} · closes{' '}
                      {formatYmd(derivedWindow.close)} — {EVAL_WINDOW_OFFSET_DAYS} days
                      around the term end. Change the rule in Settings.
                    </p>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/course-evaluation/dashboard">Cancel</Link>
                </Button>
                <Button variant="default" size="sm" disabled={!configValid} onClick={goToReadiness}>
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* ── Step 2 · Courses & Survey design — the same merged Courses
                 DataTable as the push wizard, term locked to step 1 ── */}
          {step === 2 && (
            <>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  Courses &amp; survey design
                </h2>
                <p className="text-sm text-muted-foreground">
                  {name || 'The new term'}&rsquo;s course offerings, loaded live from Prism.
                  Assign a template to each course — every row validates against what its template evaluates.
                </p>
              </div>

              {ceScoped.length === 0 ? (
                /* A brand-new term has no Prism offerings yet — saving the
                 * term is still valid; evaluations come later. */
                <>
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/25 px-6 py-12" style={{ maxWidth: 760 }}>
                    <i className="fa-light fa-calendar-plus text-3xl text-muted-foreground" aria-hidden="true" />
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-sm font-medium text-foreground">No course offerings in Prism yet</p>
                      <p className="text-sm text-muted-foreground" style={{ maxWidth: 380, textAlign: 'center' }}>
                        {name || 'This term'} can join the calendar now — courses appear here
                        once Prism loads them, and you can run readiness then.
                      </p>
                    </div>
                  </div>
                  <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
                    {enteredAtReadiness ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/course-evaluation/dashboard">Cancel</Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setStep(1)}>Back</Button>
                    )}
                    <Button variant="default" size="sm" onClick={saveTermOnly}>Save term</Button>
                  </div>
                </>
              ) : (
              <StepCoursesEvaluatees
                scopeLocked
                season={ceSeason}
                academicYear={academicYear}
                cohorts={ceCohorts}
                cohortOptions={ceCohortOpts}
                scoped={ceScoped}
                publishedTemplates={publishedTemplates}
                templateAssignments={templateAssignments}
                defaultAssignments={defaultAssignments}
                onTemplateChange={(offeringId, tmplId) =>
                  setTemplateAssignments(p => ({ ...p, [offeringId]: tmplId }))
                }
                onResetDefaults={() =>
                  setTemplateAssignments(prev => ({ ...prev, ...defaultAssignments }))
                }
                onSeasonChange={() => {}}
                onAcademicYearChange={() => {}}
                onToggleCohort={(c) =>
                  setCeCohorts(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]))
                }
                onSelectionChange={setSelectedCourseIds}
                onContinue={() => {
                  setTemplateAssignments(prev => {
                    const next = { ...prev }
                    for (const o of selectedOfferings) if (!next[o.id]) next[o.id] = defaultAssignments[o.id]
                    return next
                  })
                  setStep(3)
                }}
              />
              )}
            </>
          )}

          {/* ── Steps 3–4 · the send-evaluation steps, independent instance ── */}
          {step === 3 && (
            <StepCommunication
              selectedOfferings={selectedOfferings}
              openDate={openDate}
              closeDate={closeDate}
              releaseDate={releaseDate}
              senderName={senderName}
              emailTemplateId={emailTemplateId}
              emailSubject={emailSubject}
              emailBody={emailBody}
              reminders={reminders}
              emailContacts={emailContacts}
              reminderSameAsInvite={reminderSameAsInvite}
              reminderTemplateId={reminderTemplateId}
              reminderSubject={reminderSubject}
              reminderBody={reminderBody}
              onReminderSameAsInviteChange={setReminderSameAsInvite}
              onReminderTemplateChange={setReminderTemplateId}
              onReminderSubjectChange={setReminderSubject}
              onReminderBodyChange={setReminderBody}
              onOpenDateChange={setOpenDate}
              onCloseDateChange={setCloseDate}
              onReleaseDateChange={setReleaseDate}
              onSenderNameChange={setSenderName}
              onEmailTemplateChange={setEmailTemplateId}
              onEmailSubjectChange={setEmailSubject}
              onEmailBodyChange={setEmailBody}
              onRemindersChange={setReminders}
              onEmailContactsChange={setEmailContacts}
              title="Communication"
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}

          {step === 4 && (
            <StepReview
              surveyMode="course_evaluation"
              surveyTitle={name.trim() ? `${name} Course Evaluations` : ''}
              surveyDescription=""
              termName={name}
              academicYear={academicYear}
              offeringCount={selectedOfferings.length}
              courseGroups={reviewCourseGroups}
              openDate={openDate}
              closeDate={closeDate}
              releaseDate={releaseDate}
              studentCount={prismStudentCount}
              emailContacts={emailContacts}
              senderName={senderName}
              templateName={selectedInvitationTemplate?.name ?? 'Custom email'}
              emailSubject={emailSubject}
              emailBody={emailBody}
              isEmailEdited={isEmailEdited}
              reminders={reminders}
              reminderSameAsInvite={reminderSameAsInvite}
              reminderTemplateName={EVAL_EMAIL_TEMPLATES.find(t => t.id === reminderTemplateId)?.name ?? 'Reminder'}
              reminderSubject={reminderSubject}
              reminderBody={reminderBody}
              onEdit={(n) => setStep((n >= 3 ? 3 : 2) as WizardStep)}
              onBack={() => setStep(3)}
              onPush={handlePush}
              cohortSummary={cohortSummary}
              evaluateSummary={evaluateSummary}
              subjectIssues={reviewSubjectIssues}
              windowIssues={reviewWindowIssues}
            />
          )}

          {step === 'success' && ceScopeTerm && (
            <StepSuccess
              selectedOfferings={selectedOfferings}
              selectedTerm={ceScopeTerm}
              openDate={openDate}
              onReset={() => setStep(1)}
            />
          )}

          {step === 'saved' && (
            <div className="flex min-h-[min(360px,50vh)] flex-col items-center justify-center gap-3">
              <i
                className="fa-light fa-circle-check text-3xl"
                aria-hidden="true"
                style={{ color: 'var(--pce-status-released-fg)' }}
              />
              <div className="flex flex-col items-center gap-1">
                <h2 className="text-sm font-medium text-foreground">{name || 'Term'} is on the calendar</h2>
                <p className="text-sm text-muted-foreground" style={{ maxWidth: 400, textAlign: 'center' }}>
                  You&rsquo;ll see it on the Dashboard as an upcoming term. Set up
                  evaluations once Prism loads its course offerings.
                </p>
              </div>
              <Button variant="default" size="sm" asChild>
                <Link href="/course-evaluation/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DateField({
  label,
  valueYmd,
  onChange,
  errorMessage,
}: {
  label: string
  valueYmd: string | undefined
  onChange: (ymd: string | undefined) => void
  errorMessage?: string
}) {
  const [open, setOpen] = useState(false)
  const invalid = !!errorMessage
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            aria-label={valueYmd ? `${label}: ${formatYmd(valueYmd)}` : `${label}: choose a date`}
            aria-invalid={invalid || undefined}
            className="justify-start font-normal"
          >
            <i className="fa-light fa-calendar text-muted-foreground" aria-hidden="true" />
            <span className={valueYmd ? '' : 'text-muted-foreground'}>
              {valueYmd ? formatYmd(valueYmd) : 'Choose a date'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={valueYmd ? ymdToLocalDate(valueYmd) : undefined}
            onSelect={(d) => {
              onChange(d ? localDateToYmd(d) : undefined)
              setOpen(false)
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
    </Field>
  )
}

export default function TermSetupPage() {
  return (
    <Suspense
      fallback={
        <div aria-busy="true" aria-label="Loading term setup" className="flex flex-col flex-1 gap-6" style={{ padding: '32px 40px' }}>
          <h1 className="sr-only">Set up term</h1>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" style={{ maxWidth: 560 }} />
        </div>
      }
    >
      <TermSetupInner />
    </Suspense>
  )
}
