'use client'

import { useState, useMemo, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { WizardNav } from '@/components/pce/wizard-nav'
import { StepProperties } from '@/components/pce/distribute-wizard/step-properties'
import { StepDistribution } from '@/components/pce/distribute-wizard/step-distribution'
import { StepSurveyDesign } from '@/components/pce/distribute-wizard/step-survey-design'
import { StepCommunication, type Reminder, type EmailContact, type ExistingCommStream } from '@/components/pce/distribute-wizard/step-communication'
import { StepReview } from '@/components/pce/distribute-wizard/step-review'
import { StepSuccess } from '@/components/pce/distribute-wizard/step-success'
// Two-step split (Jul 2026): step 1 scopes courses + students, step 2 designs
// the survey instances (template per course, duplicates auto-skipped at the
// offering+role+person grain). The merged step lives on in the term-setup
// wizard (step-courses-evaluatees.tsx) until it adopts the same split.
import { StepScopeCourses } from '@/components/pce/courses-evaluatees/step-scope-courses'
import { StepSurveyInstances } from '@/components/pce/courses-evaluatees/step-survey-instances'
import { StepSurveyDesignGeneral } from '@/components/pce/distribute-wizard/step-survey-design-general'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  MOCK_COURSE_ENROLLMENTS,
  MOCK_MASTER_COURSES,
  EVAL_DATE_RULES,
  EVAL_EMAIL_TEMPLATES,
  EVAL_REMINDER_CADENCE,
  type SurveyType,
  type PceTemplate,
  type TermSeason,
} from '@/lib/pce-mock-data'
import { resolveTerm, cohortOptions, offeringsForScope } from '@/lib/pce-course-scope'
import { type Criterion, ALL_CRITERIA, CRITERION_TOGGLE_LABEL, templateCriteria } from '@/lib/pce-course-readiness'
import { subjectDataIssues, windowIssues, expandInstances, existingFlowSummary, type CourseIssue } from '@/lib/pce-push-validation'
import { courseLabelOf } from '@/lib/pce-course-readiness'

const FIRST_INVITATION_TEMPLATE = EVAL_EMAIL_TEMPLATES.find(t => t.type === 'invitation') ?? null
const FIRST_INVITATION_TEMPLATE_ID = FIRST_INVITATION_TEMPLATE?.id ?? ''
const FIRST_REMINDER_TEMPLATE = EVAL_EMAIL_TEMPLATES.find(t => t.type === 'reminder') ?? null

// Recipients are the selected courses' students; external contacts were removed
// with the Recipients card, so none are seeded.
const INITIAL_EMAIL_CONTACTS: EmailContact[] = []

const LATEST_TERM_ID = [...MOCK_PROGRAM_TERMS]
  .sort((a, b) => b.startDate.localeCompare(a.startDate))[0]?.id ?? ''

// Two-step split (Jul 2026, reversing the earlier merge on Romit's directive):
// 1 = Courses & students (scope + roster), 2 = Survey design (instances +
// duplicate skip), 3 = Communication, 4 = Review. Sequential again for the CE
// flow; the programmatic flow still skips 2 (1 → 3 → 4).
type WizardStep = 1 | 2 | 3 | 4 | 'success'

// Pre-assign a default template to every (non-archived) offering in a term, so
// the merged "Scope and design" step shows assignments immediately. One template
// → all courses; otherwise match by courseType, falling back to the first.
function autoAssignTemplates(
  termId: string,
  publishedTemplates: PceTemplate[],
): Record<string, string> {
  const result: Record<string, string> = {}
  if (publishedTemplates.length === 0) return result
  const offerings = MOCK_COURSE_OFFERINGS.filter(
    o => o.termId === termId && o.status !== 'archived',
  )
  const single = publishedTemplates.length === 1 ? publishedTemplates[0] : null
  for (const offering of offerings) {
    if (single) {
      result[offering.id] = single.id
    } else {
      const matched = offering.courseType
        ? publishedTemplates.find(t => t.courseType === offering.courseType)
        : undefined
      result[offering.id] = (matched ?? publishedTemplates[0]).id
    }
  }
  return result
}

function dateToYmd(d: Date | undefined): string {
  if (!d) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Pre-fill from Central Settings (§4: minimum-click goal) ───────────────────
function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function shiftDate(base: Date, days: number): Date {
  const n = new Date(base); n.setDate(n.getDate() + days); return n
}
/** Survey window derived from the term's end date + the Settings anchor offsets. */
function windowFromSettings(termId: string): { open?: Date; close?: Date; release?: Date } {
  const term = MOCK_PROGRAM_TERMS.find(t => t.id === termId)
  if (!term) return {}
  const end = isoToDate(term.endDate)
  return {
    open:    shiftDate(end, EVAL_DATE_RULES.opensOffset),
    close:   shiftDate(end, EVAL_DATE_RULES.closesOffset),
    release: shiftDate(end, EVAL_DATE_RULES.releaseOffset),
  }
}
/** Reminder cadence from the single Settings source (days before survey close). */
function remindersFromSettings(intervals: number[]): Reminder[] {
  return [...intervals].sort((a, b) => b - a).map(d => ({ id: `r-${d}`, daysBefore: d }))
}

function PushSurveyInner() {
  const { templates, surveys, pushSurveyBatch, setupDefaults } = usePce()
  const params = useSearchParams()
  const pathname = usePathname()
  const surveyMode: 'course_evaluation' | 'general' =
    pathname?.startsWith('/surveys/programmatic') || params?.get('mode') === 'programmatic'
      ? 'general' : 'course_evaluation'
  const publishedTemplates = templates.filter(t =>
    t.status === 'active' && (
      surveyMode === 'general'
        ? t.surveyType === 'programmatic'
        : (!t.surveyType || t.surveyType === 'course_evaluation')
    )
  )

  // Scoped entry from the retired Activate wizard: ?offerings=id,id pre-selects a
  // subset; ?term= pre-selects a whole term. Else default to the latest term.
  const scopedOfferingIds = useMemo(() => {
    const raw = params?.get('offerings')
    return raw ? new Set(raw.split(',').filter(Boolean)) : null
  }, [params])

  const initialTermId = useMemo(() => {
    const byTerm = MOCK_PROGRAM_TERMS.find(t => t.id === params?.get('term'))?.id
    if (byTerm) return byTerm
    if (scopedOfferingIds) {
      const first = MOCK_COURSE_OFFERINGS.find(o => scopedOfferingIds.has(o.id))
      if (first) return first.termId
    }
    return LATEST_TERM_ID
  }, [params, scopedOfferingIds])

  const [step, setStep] = useState<WizardStep>(1)

  // Step 1 — Properties
  const [surveyType, setSurveyType] = useState<SurveyType>(
    surveyMode === 'general' ? 'programmatic' : 'course_evaluation'
  )
  const [surveyTitle, setSurveyTitle] = useState('')
  const [termId, setTermId] = useState(initialTermId)
  const [surveyDescription, setSurveyDescription] = useState('')

  // Step 1 — Design (templates) + Distribution scope.
  // When scoped (?offerings=), pre-exclude everything in the term except the selection.
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => {
    if (!scopedOfferingIds) return new Set()
    return new Set(
      MOCK_COURSE_OFFERINGS
        .filter(o => o.termId === initialTermId && o.status !== 'archived' && !scopedOfferingIds.has(o.id))
        .map(o => o.id),
    )
  })
  const [templateAssignments, setTemplateAssignments] = useState<Record<string, string>>(
    () => surveyMode !== 'general' ? autoAssignTemplates(initialTermId, publishedTemplates) : {}
  )
  const [generalTemplateId, setGeneralTemplateId] = useState<string>('')
  // Programmatic surveys pick courses directly (across terms) in step 1.
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())

  // CE step 1 (Courses & Evaluatees) scope — Term (season) + Academic Year are independent.
  const initialTerm = MOCK_PROGRAM_TERMS.find(t => t.id === initialTermId)
  const [ceSeason, setCeSeason] = useState<TermSeason | ''>(
    surveyMode === 'general' ? '' : initialTerm?.season ?? ''
  )
  const [ceAcademicYear, setCeAcademicYear] = useState(
    surveyMode === 'general' ? '' : initialTerm?.academicYear ?? ''
  )
  const [ceCohorts, setCeCohorts] = useState<string[]>([])
  // Students added per offering in THIS wizard run (Courses & students step's
  // in-app roster fix) — page-owned so steps 2/Review count the same reach.
  const [addedStudents, setAddedStudents] = useState<Record<string, string[]>>({})

  // Step 4 — Communication — defaults pre-filled from Central Settings
  const settingsWindow = useMemo(() => windowFromSettings(initialTermId), [initialTermId])
  const [openDate, setOpenDate] = useState<Date | undefined>(settingsWindow.open)
  const [closeDate, setCloseDate] = useState<Date | undefined>(settingsWindow.close)
  const [releaseDate, setReleaseDate] = useState<Date | undefined>(settingsWindow.release)
  const [senderName, setSenderName] = useState('Exxat Surveys')
  const [emailTemplateId, setEmailTemplateId] = useState(FIRST_INVITATION_TEMPLATE_ID)
  // Seed subject/body from the default template so the invitation card doesn't
  // read as "edited" before the user has touched anything.
  const [emailSubject, setEmailSubject] = useState(FIRST_INVITATION_TEMPLATE?.subject ?? setupDefaults.initialEmailSubject)
  const [emailBody, setEmailBody] = useState(FIRST_INVITATION_TEMPLATE?.body ?? setupDefaults.initialEmailBody)
  const [reminders, setReminders] = useState<Reminder[]>(
    () => remindersFromSettings(setupDefaults.activeReminderIntervals)
  )
  const [emailContacts, setEmailContacts] = useState<EmailContact[]>(INITIAL_EMAIL_CONTACTS)
  // Reminder email — lifted here so the Review step reflects the actual choice.
  const [reminderSameAsInvite, setReminderSameAsInvite] = useState(false)
  const [reminderTemplateId, setReminderTemplateId] = useState(FIRST_REMINDER_TEMPLATE?.id ?? '')
  const [reminderSubject, setReminderSubject] = useState(FIRST_REMINDER_TEMPLATE?.subject ?? '')
  const [reminderBody, setReminderBody] = useState(FIRST_REMINDER_TEMPLATE?.body ?? '')

  // Window follows the selected term (recompute from Settings offsets on term change)
  const termWindowMounted = useRef(false)
  useEffect(() => {
    if (!termWindowMounted.current) { termWindowMounted.current = true; return }
    const w = windowFromSettings(termId)
    setOpenDate(w.open); setCloseDate(w.close); setReleaseDate(w.release)
  }, [termId])

  // ── Derived values ─────────────────────────────────────────────────────────

  const selectedTerm = MOCK_PROGRAM_TERMS.find(t => t.id === termId) ?? null
  const academicYear = selectedTerm?.academicYear ?? ''

  const offeringsForTerm = useMemo(
    () =>
      termId
        ? MOCK_COURSE_OFFERINGS.filter(o => o.termId === termId && o.status !== 'archived')
        : [],
    [termId]
  )

  const selectedOfferings = surveyMode === 'general'
    ? offeringsForTerm.filter(o => !excludedIds.has(o.id))
    : MOCK_COURSE_OFFERINGS.filter(o => selectedCourseIds.has(o.id))

  // ── CE scope derivations + sync (Courses & Evaluatees step 1) ────────────────
  const ceScopeTerm = useMemo(() => resolveTerm(ceSeason, ceAcademicYear), [ceSeason, ceAcademicYear])
  const ceCohortOpts = useMemo(() => cohortOptions(ceScopeTerm), [ceScopeTerm])
  const ceScoped = useMemo(
    () => offeringsForScope(ceSeason, ceAcademicYear, ceCohorts),
    [ceSeason, ceAcademicYear, ceCohorts],
  )
  // Keep the wizard's termId (drives Communication date windows) in sync with the scope term.
  useEffect(() => {
    if (surveyMode === 'general' || !ceScopeTerm) return
    setTermId(ceScopeTerm.id)
  }, [ceScopeTerm, surveyMode])
  // Cohort options differ per term → clear cohorts when the term changes.
  const lastCeTermId = useRef<string | undefined>(ceScopeTerm?.id)
  useEffect(() => {
    if (surveyMode === 'general') return
    if (lastCeTermId.current === ceScopeTerm?.id) return
    lastCeTermId.current = ceScopeTerm?.id
    setCeCohorts([])
  }, [ceScopeTerm, surveyMode])
  // Selection is owned by the readiness DataTable inside StepCoursesEvaluatees and
  // reported up via onSelectionChange (default all-on, reset on scope change there).

  // Prism auto-recipients (students enrolled in the selected offerings) — mirrors
  // StepCommunication's default so Review shows the same reach.
  const prismStudentCount = useMemo(() => {
    const seen = new Set<string>()
    for (const o of selectedOfferings) {
      for (const sid of MOCK_COURSE_ENROLLMENTS[o.id] ?? []) seen.add(sid)
      for (const sid of addedStudents[o.id] ?? []) seen.add(sid)
    }
    return seen.size
  }, [selectedOfferings, addedStudents])
  // Default template per course (by type) — for the Template column's "Default"
  // chips + Reset to defaults. CE covers every SCOPED course (not just selected):
  // a deselected row keeps a sensible default in its Template cell.
  const defaultAssignmentBase = surveyMode === 'general' ? selectedOfferings : ceScoped
  const defaultAssignments = useMemo(() => {
    const result: Record<string, string> = {}
    if (publishedTemplates.length === 0) return result
    const single = publishedTemplates.length === 1 ? publishedTemplates[0] : null
    for (const o of defaultAssignmentBase) {
      if (single) { result[o.id] = single.id; continue }
      const matched = o.courseType ? publishedTemplates.find(t => t.courseType === o.courseType) : undefined
      result[o.id] = (matched ?? publishedTemplates[0]).id
    }
    return result
  }, [defaultAssignmentBase, publishedTemplates])
  function handleResetTemplateDefaults() {
    setTemplateAssignments(prev => ({ ...prev, ...defaultAssignments }))
  }

  // ── Survey-instance plan (Survey design step + push) ───────────────────────
  // Each selected offering × its effective template expands into the survey
  // instances a push would create, checked per offering+role+person against
  // the existing flows. The SAME list renders step 2 and drives handlePush,
  // so what the admin reviewed is exactly what gets created.
  const instancePlan = useMemo(() => {
    if (surveyMode === 'general') return []
    const byId = new Map(publishedTemplates.map(t => [t.id, t]))
    return selectedOfferings.flatMap(o => {
      const raw = templateAssignments[o.id] ?? defaultAssignments[o.id] ?? ''
      return expandInstances(o, byId.get(raw) ?? null, surveys)
    })
  }, [surveyMode, selectedOfferings, templateAssignments, defaultAssignments, publishedTemplates, surveys])

  // Instance keys the admin checked in the Survey design step (UC4 soft
  // warning): new instances arrive checked, duplicates unchecked; a checked
  // duplicate is an explicit re-evaluation and re-surfaces as a Review ack.
  const [includedInstanceKeys, setIncludedInstanceKeys] = useState<Set<string>>(new Set())

  const pushInstances = useMemo(
    () => instancePlan.filter(i => i.status !== 'gap' && includedInstanceKeys.has(i.key)),
    [instancePlan, includedInstanceKeys],
  )
  // Accepted duplicates → explicit re-consent at Review (UC5), grouped per
  // course with the exact person · role · existing-flow line from step 2.
  const acceptedDuplicateIssues = useMemo<CourseIssue[]>(() => {
    const byOffering = new Map<string, CourseIssue>()
    for (const i of instancePlan) {
      if (i.status !== 'duplicate' || !includedInstanceKeys.has(i.key)) continue
      const offering = selectedOfferings.find(o => o.id === i.offeringId)
      if (!byOffering.has(i.offeringId)) {
        byOffering.set(i.offeringId, {
          id: i.offeringId,
          courseLabel: offering ? courseLabelOf(offering) : i.offeringId,
          reasons: [],
        })
      }
      const flow = i.existing ? existingFlowSummary(i.existing) : 'Open'
      byOffering.get(i.offeringId)!.reasons.push(
        i.scope === 'course'
          ? `Course material · running again over an existing survey (${flow})`
          : `${i.personName} · ${i.roleLabel} · re-evaluating over an existing survey (${flow})`,
      )
    }
    return [...byOffering.values()]
  }, [instancePlan, includedInstanceKeys, selectedOfferings])

  const skippedDuplicateCount = useMemo(
    () => instancePlan.filter(i => i.status === 'duplicate' && !includedInstanceKeys.has(i.key)).length,
    [instancePlan, includedInstanceKeys],
  )
  // Step-2 outcome counts restated on Review — the ledger, never re-decided.
  const reEvalCount = useMemo(
    () => instancePlan.filter(i => i.status === 'duplicate' && includedInstanceKeys.has(i.key)).length,
    [instancePlan, includedInstanceKeys],
  )
  const pendingGapCount = useMemo(
    () => instancePlan.filter(i => i.status === 'gap' && includedInstanceKeys.has(i.key)).length,
    [instancePlan, includedInstanceKeys],
  )

  // Open surveys already messaging students in the selected courses — the
  // Communication step renders them as a read-only rail (per-survey rules are
  // legal; the rail is visibility, never unification). Mock flows were pushed
  // under the program default cadence, so that is the cadence they report.
  const existingStreams = useMemo<ExistingCommStream[]>(() => {
    const openSet = new Set(['scheduled', 'active', 'collecting', 'pending_review'])
    const offeringIds = new Set(selectedOfferings.map(o => o.id))
    return surveys
      .filter(s => s.offeringId && offeringIds.has(s.offeringId) && openSet.has(s.status))
      .map(s => ({
        id: s.id,
        // Same course can carry several flows — the evaluatee tells them apart.
        label: `${s.courseCode} · ${
          s.evalScope === 'instructor' ? (s.instructors[0]?.name ?? 'Faculty') : 'Course material'
        }`,
        status: s.status,
        openDate: s.openDate,
        // deadline is already a display string ("Apr 30, 2026") — drop the year.
        untilLabel: s.deadline ? `until ${s.deadline.replace(/, \d{4}$/, '')}` : undefined,
        cadence: EVAL_REMINDER_CADENCE,
      }))
  }, [surveys, selectedOfferings])

  const selectedInvitationTemplate = EVAL_EMAIL_TEMPLATES.find(t => t.id === emailTemplateId) ?? null
  const isEmailEdited = !!selectedInvitationTemplate &&
    (emailSubject !== selectedInvitationTemplate.subject || emailBody !== selectedInvitationTemplate.body)

  // Group the selected offerings by their assigned survey template, with course
  // codes — gives the Review real "what did I pick" context (biggest → smallest).
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

  // CE Review — two pre-flight validation categories surfaced as acknowledgement
  // gates: (A) courses missing subject data (no faculty / no students), and
  // (B) courses whose survey window opens after the course has already ended.
  // Student-data problems only: faculty gaps are resolved consciously in the
  // Survey design gap lane (queue or leave out), and Review never re-asks a
  // decision the admin already made there (UC5).
  const reviewSubjectIssues = useMemo(
    () => (surveyMode === 'general'
      ? []
      : subjectDataIssues(selectedOfferings)
          .map(iss => ({ ...iss, reasons: iss.reasons.filter(r => r.includes('student')) }))
          .filter(iss => iss.reasons.length > 0)),
    [selectedOfferings, surveyMode],
  )
  const reviewWindowIssues = useMemo(
    () => (surveyMode === 'general' ? [] : windowIssues(selectedOfferings, openDate)),
    [selectedOfferings, openDate, surveyMode],
  )
  // (C) duplicates are RESOLVED in the Survey design step now — instances that
  // match an open flow's offering+role+person key are skipped at insert, so
  // Review only states the skip count (no acknowledgement to extract).

  // CE Review identity line: cohort + evaluate summaries (CE mode only).
  // What's evaluated is no longer picked directly — it's the union of what the
  // selected courses' assigned templates evaluate.
  const cohortSummary = surveyMode !== 'general' ? ceCohorts.join(' · ') : undefined
  const evaluateSummary = useMemo(() => {
    if (surveyMode === 'general') return undefined
    const found = new Set<Criterion>()
    for (const o of selectedOfferings) {
      const tid = templateAssignments[o.id] ?? defaultAssignments[o.id]
      const t = publishedTemplates.find(x => x.id === tid)
      if (t) for (const c of templateCriteria(t)) found.add(c)
    }
    return ALL_CRITERIA.filter(c => found.has(c)).map(c => CRITERION_TOGGLE_LABEL[c]).join(', ')
  }, [surveyMode, selectedOfferings, templateAssignments, defaultAssignments, publishedTemplates])

  // Step 1 ("Scope and design") gating — scope fields + a template for every course.
  const scopeValid = surveyMode === 'general'
    ? !!surveyTitle.trim()
    : (!!surveyTitle.trim() && !!termId)
  const designValid = surveyMode === 'general'
    ? !!generalTemplateId
    : (selectedOfferings.length > 0 && selectedOfferings.every(o => !!templateAssignments[o.id]))
  const canContinueStep1 = scopeValid && designValid

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleTermChange(v: string) {
    setTermId(v)
    setExcludedIds(new Set())
    setTemplateAssignments(
      surveyMode !== 'general' ? autoAssignTemplates(v, publishedTemplates) : {}
    )
  }

  function handleToggleOffering(id: string) {
    setExcludedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSelectAll() {
    setExcludedIds(new Set())
  }

  function handleDeselectAll() {
    setExcludedIds(new Set(offeringsForTerm.map(o => o.id)))
  }

  function handleBulkAssignByType(
    courseType: 'didactic' | 'clinical' | 'any',
    tmplId: string
  ) {
    // NOTE (P0 boundary — courses-evaluatees-audit spec §10.1): matches on LEGACY `courseType`,
    // not CB/LB/PB `deliveryMode`. LB offerings (courseType:'didactic') are included by a
    // 'didactic' bulk-assign. Intentional in P0; deliveryMode-aware assignment is a later phase.
    const next = { ...templateAssignments }
    selectedOfferings.forEach(o => {
      if (courseType === 'any' || o.courseType === courseType) {
        next[o.id] = tmplId
      }
    })
    setTemplateAssignments(next)
  }

  function handlePush() {
    const openYmd = dateToYmd(openDate)
    const closeYmd = dateToYmd(closeDate)
    pushSurveyBatch({
      surveyType,
      termId,
      academicYear,
      programId: '',
      courseOfferingIds: selectedOfferings.map(o => o.id),
      templateAssignments,
      // Exactly the instances the admin left CHECKED in Survey design —
      // new ones plus any explicitly accepted re-evaluations (UC4). General
      // mode keeps the legacy one-flow-per-offering path.
      instances: surveyMode === 'general' ? undefined : pushInstances
        .map(i => ({
          offeringId: i.offeringId,
          scope: i.scope,
          role: i.criterion,
          personName: i.personName ?? undefined,
        })),
      openDate: openYmd,
      closeDate: closeYmd,
      emailSubject,
      emailBody,
      reminderEnabled: reminders.length > 0,
      reminderDaysBefore: reminders[0]?.daysBefore ?? 3,
      reportAccess: {},
    })
    setStep('success')
  }

  function handleReset() {
    setStep(1)
    setSurveyType(surveyMode === 'general' ? 'programmatic' : 'course_evaluation')
    setSurveyTitle('')
    setTermId(LATEST_TERM_ID)
    setSurveyDescription('')
    setExcludedIds(new Set())
    setTemplateAssignments(
      surveyMode !== 'general' ? autoAssignTemplates(LATEST_TERM_ID, publishedTemplates) : {}
    )
    setGeneralTemplateId('')
    setSelectedCourseIds(new Set())
    setAddedStudents({})
    setIncludedInstanceKeys(new Set())
    const w = windowFromSettings(LATEST_TERM_ID)
    setOpenDate(w.open)
    setCloseDate(w.close)
    setReleaseDate(w.release)
    setSenderName('Exxat Surveys')
    setEmailTemplateId(FIRST_INVITATION_TEMPLATE_ID)
    setEmailSubject(FIRST_INVITATION_TEMPLATE?.subject ?? setupDefaults.initialEmailSubject)
    setEmailBody(FIRST_INVITATION_TEMPLATE?.body ?? setupDefaults.initialEmailBody)
    setReminders(remindersFromSettings(setupDefaults.activeReminderIntervals))
    setEmailContacts(INITIAL_EMAIL_CONTACTS)
  }

  function handleStepNavClick(n: number) {
    // Only allow navigating to completed steps (< current step)
    if (typeof step === 'number' && n < step) {
      setStep(n as WizardStep)
    }
  }

  const currentStepNum = step === 'success' ? 5 : (step as number)
  const completedUpTo = step === 'success' ? 4 : (step as number) - 1

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader
        breadcrumbs={[{
          label: surveyMode === 'general' ? 'Surveys' : 'Dashboard',
          href:  surveyMode === 'general' ? '/surveys/programmatic' : '/course-evaluation/dashboard',
        }]}
        title={surveyMode === 'general' ? 'Push survey' : 'Set up Evaluations'}
      />
      <h1 className="sr-only">{surveyMode === 'general' ? 'Push survey' : 'Set up Evaluations'}</h1>

      {/* Horizontal step bar — hidden on success step */}
      {step !== 'success' && (
        <WizardNav
          currentStep={currentStepNum}
          completedUpTo={completedUpTo}
          onStepClick={handleStepNavClick}
          mode={surveyMode}
        />
      )}

      {/* Full-width content — flex column so steps can fill the height and
          anchor their footers to a fixed bottom position (mt-auto). */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto flex flex-col" style={{ padding: '32px 40px 0' }}>
          {step === 1 && (surveyMode === 'general' ? (
            <div className="flex flex-col gap-6 flex-1" style={{ maxWidth: 680 }}>
              {/* Step header */}
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold font-heading">
                  Basic Details
                </h2>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Define the scope for this survey and choose its template.
                </p>
              </div>

              {/* Scope */}
              <StepProperties
                asSection
                surveyMode={surveyMode}
                surveyTitle={surveyTitle}
                termId={termId}
                description={surveyDescription}
                onSurveyTitleChange={setSurveyTitle}
                onTermChange={handleTermChange}
                onDescriptionChange={setSurveyDescription}
              />

              {/* Design */}
              <div className="border-t border-border pt-6 flex flex-col gap-1">
                <h3 className="text-base font-semibold font-heading">
                  Design
                </h3>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Set a template for this survey.
                </p>
              </div>

              <StepSurveyDesignGeneral
                asSection
                publishedTemplates={publishedTemplates}
                selectedTemplateId={generalTemplateId}
                onTemplateChange={setGeneralTemplateId}
              />

              {/* Footer */}
              <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-end">
                <Button
                  variant="default"
                  size="sm"
                  disabled={!canContinueStep1}
                  onClick={() => setStep(3)}
                >
                  Continue
                  <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 flex-1">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold font-heading">
                  Courses &amp; students
                </h2>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Choose the term and the courses to evaluate. Courses load live from Prism; a course needs students on its roster before a survey can reach anyone.
                </p>
              </div>

              <StepScopeCourses
                season={ceSeason}
                academicYear={ceAcademicYear}
                cohorts={ceCohorts}
                cohortOptions={ceCohortOpts}
                scoped={ceScoped}
                addedStudents={addedStudents}
                onAddStudents={(offeringId, studentIds) =>
                  setAddedStudents(prev => ({
                    ...prev,
                    [offeringId]: [...(prev[offeringId] ?? []), ...studentIds],
                  }))
                }
                onSeasonChange={setCeSeason}
                onAcademicYearChange={setCeAcademicYear}
                onToggleCohort={(c) =>
                  setCeCohorts(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]))
                }
                onSelectionChange={setSelectedCourseIds}
                onContinue={() => {
                  if (!surveyTitle.trim() && ceScopeTerm) setSurveyTitle(`${ceScopeTerm.name} Course Evaluations`)
                  setStep(2)
                }}
              />
            </div>
          ))}

          {step === 2 && surveyMode !== 'general' && (
            <div className="flex flex-col gap-6 flex-1">
              {/* No separate step header — the Briefing's lead sentence IS the
                  headline (the stepper above already names the step). A second
                  serif title + explainer double-headlined the page (Jul 27). */}
              <StepSurveyInstances
                selectedOfferings={selectedOfferings}
                instances={instancePlan}
                publishedTemplates={publishedTemplates}
                templateAssignments={templateAssignments}
                defaultAssignments={defaultAssignments}
                onTemplateChange={(offeringId, tmplId) =>
                  setTemplateAssignments(p => ({ ...p, [offeringId]: tmplId }))
                }
                onResetDefaults={handleResetTemplateDefaults}
                onIncludedChange={setIncludedInstanceKeys}
                onBack={() => setStep(1)}
                onContinue={() => {
                  // Materialize type-defaults into explicit assignments so the
                  // push (which reads templateAssignments) creates exactly what
                  // this step previewed.
                  setTemplateAssignments(prev => {
                    const next = { ...prev }
                    for (const o of selectedOfferings) if (!next[o.id]) next[o.id] = defaultAssignments[o.id]
                    return next
                  })
                  setStep(3)
                }}
              />
            </div>
          )}

          {step === 3 && (
            <StepCommunication
              selectedOfferings={selectedOfferings}
              existingStreams={existingStreams}
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
              title={surveyMode === 'general' ? 'Distribution' : 'Communication'}
              onBack={() => setStep(surveyMode === 'general' ? 1 : 2)}
              onNext={() => setStep(4)}
            />
          )}

          {step === 4 && (
            <StepReview
              surveyMode={surveyMode}
              surveyTitle={surveyTitle}
              surveyDescription={surveyDescription}
              termName={selectedTerm?.name ?? ''}
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
              onEdit={(n) => setStep((surveyMode === 'general' && n === 2 ? 1 : n) as WizardStep)}
              onBack={() => setStep(3)}
              onPush={handlePush}
              cohortSummary={cohortSummary}
              evaluateSummary={evaluateSummary}
              subjectIssues={reviewSubjectIssues}
              windowIssues={reviewWindowIssues}
              duplicateIssues={acceptedDuplicateIssues}
              duplicateTitle={`${acceptedDuplicateIssues.reduce((n, c) => n + c.reasons.length, 0)} accepted re-evaluation${acceptedDuplicateIssues.reduce((n, c) => n + c.reasons.length, 0) !== 1 ? 's' : ''} will run over an existing survey`}
              skippedDuplicateCount={skippedDuplicateCount}
              instanceCount={pushInstances.length}
              reEvalCount={reEvalCount}
              pendingGapCount={pendingGapCount}
            />
          )}

          {step === 'success' && selectedTerm && (
            <StepSuccess
              selectedOfferings={selectedOfferings}
              selectedTerm={selectedTerm}
              openDate={openDate}
              onReset={handleReset}
            />
          )}

        </div>
      </div>
    </div>
  )
}

export default function PushSurveyPage() {
  return (
    <Suspense fallback={<h1 className="sr-only">Set up Evaluations</h1>}>
      <PushSurveyInner />
    </Suspense>
  )
}
