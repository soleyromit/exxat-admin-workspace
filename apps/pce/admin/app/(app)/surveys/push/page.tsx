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
import {
  StepCommunication, type Reminder, type EmailContact, type ExistingCommStream, type CourseWindowOverride,
  DEFAULT_SURVEY_TITLE_TEMPLATE, DEFAULT_SURVEY_INSTRUCTIONS,
} from '@/components/pce/distribute-wizard/step-communication'
import { commRulesOfSurvey, commCadenceOfSurvey, commUntilOfSurvey } from '@/components/pce/existing-comm-rules'
import { StepReview } from '@/components/pce/distribute-wizard/step-review'
import { StepSuccess } from '@/components/pce/distribute-wizard/step-success'
// Two-step split (Jul 2026): step 1 scopes courses + students, step 2 designs
// the survey instances (template per course, duplicates auto-skipped at the
// offering+role+person grain). The merged step lives on in the term-setup
// wizard (step-courses-evaluatees.tsx) until it adopts the same split.
import { StepScopeCourses } from '@/components/pce/courses-evaluatees/step-scope-courses'
import { StepSurveyInstances, type TemplateDriftNotice } from '@/components/pce/courses-evaluatees/step-survey-instances'
import { StepSurveyDesignGeneral } from '@/components/pce/distribute-wizard/step-survey-design-general'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  MOCK_COURSE_ENROLLMENTS,
  MOCK_MASTER_COURSES,
  EVAL_DATE_RULES,
  EVAL_EMAIL_TEMPLATES,
  EVAL_REMINDER_CADENCE,
  COURSE_TYPE_FULL_LABEL,
  deliveryModeOf,
  type SurveyType,
  type PceTemplate,
  type PceSurvey,
  type TermSeason,
  type ReminderAnchor,
  type ReminderFrequency,
} from '@/lib/pce-mock-data'
import { resolveTerm, cohortOptions, offeringsForScope } from '@/lib/pce-course-scope'
import { type Criterion, ALL_CRITERIA, CRITERION_TOGGLE_LABEL, templateCriteria } from '@/lib/pce-course-readiness'
import {
  subjectDataIssues, windowIssues, expandInstances, existingFlowSummary,
  reconcileUnitsOnRefresh, draftOrScheduledMatch, templateStoryStatusOf, storyStatusOf,
  type UnitSelectionMap, type CourseIssue, type SurveyInstance,
} from '@/lib/pce-push-validation'
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

/** One extra template assigned to an offering, beyond its primary. All three
 *  entry points that could ever CREATE one are retired now (2026-08-12, the
 *  reviewer's "one template, one course" rule) — S2's Override-vs-Create-new
 *  dialog ("Keep both"), the general "+ Add another template" affordance
 *  (removed 2026-08-11), and the person-grain late-added-co-instructor
 *  exception (removed 2026-08-12, same pass as this dialog). The type/state
 *  stays for any entry a resumed Draft already carries. `scopePersonNames`
 *  absent = the whole role/aspect gets this template (the 2026-08-04 "Keep
 *  both" behavior and the general add-another-template case). Present
 *  (2026-08-05, person-grain exception) = this template covers ONLY these
 *  named people. `secondaryTemplateAssignments` holds an ARRAY per offering
 *  now — see the 2026-08-06 comment where it's declared. */
type SecondaryTemplateAssignment = { templateId: string; scopePersonNames?: string[] }

// The type default for one course type (ST-02 auto-assign / Reset to defaults).
// Tie-break per implementation-plan decision #2 (2026-08-03 — a DOCUMENTED
// decision, not an assumption): when more than one published template shares a
// course type, the one flagged isDefaultForType wins; "first found" applies
// only when none is flagged. Exactly one match for the type keeps today's
// behavior — auto-assign it regardless of the flag. No match at all keeps the
// legacy first-published fallback.
function pickTemplateForType(
  courseType: string | undefined,
  publishedTemplates: PceTemplate[],
): PceTemplate {
  // A template with no courseType (or the explicit 'any') applies to every
  // course type — omitting this wildcard means a real type match never
  // fires against the fixture's own tmpl1/tmpl2 (both courseType: 'any'),
  // silently falling back to publishedTemplates[0] regardless of type.
  const matches = courseType
    ? publishedTemplates.filter(t => !t.courseType || t.courseType === 'any' || t.courseType === courseType)
    : []
  if (matches.length === 0) return publishedTemplates[0]
  if (matches.length === 1) return matches[0]
  return matches.find(t => t.isDefaultForType) ?? matches[0]
}

// Pre-assign a default template to every (non-archived) offering in a term, so
// the merged "Scope and design" step shows assignments immediately. One template
// → all courses; otherwise the type default via pickTemplateForType.
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
    result[offering.id] = (single ?? pickTemplateForType(offering.courseType, publishedTemplates)).id
  }
  return result
}

/** Drop every unit-selection entry belonging to the given offerings. Keys are
 *  `offeringId|…` (see SurveyInstance.key), so the prefix up to the first pipe
 *  IS the offering id. Used by the ST-02 template-change reset ("no prior
 *  selection carries forward") and by course deselection on Step 2. */
function withoutOfferings(map: UnitSelectionMap, offeringIds: ReadonlySet<string>): UnitSelectionMap {
  const next: UnitSelectionMap = {}
  for (const [k, v] of Object.entries(map)) {
    if (!offeringIds.has(k.slice(0, k.indexOf('|')))) next[k] = v
  }
  return next
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
  const { templates, surveys, pushSurveyBatch, saveDraft, setupDefaults } = usePce()
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
  // S2 (2026-08-04 scenario redesign) — "Create new survey" instead of
  // "Override" on a template reassignment produces a SECOND, independent
  // survey for the same offering. Originally scoped to one extra slot per
  // offering; 2026-08-06 Romit generalized this — "per course I should be
  // allowed to add more templates" — into a real N-per-offering array,
  // reachable both from the S2 conflict dialog and a standalone "+ Add
  // another template" affordance in Step 2 (validated at
  // /compare/push-step2-template-hierarchy). Push-time creation of these
  // extra surveys (pushSurveyBatch still only accepts one templateId per
  // offering) remains open engineering scope — same boundary this feature
  // already had pre-generalization, just not yet closed.
  const [secondaryTemplateAssignments, setSecondaryTemplateAssignments] = useState<Record<string, SecondaryTemplateAssignment[]>>({})
  // The Override-vs-Create-new decision, pending the admin's answer. Set by
  // the primary Select's onChange when it detects a conflicting existing
  // Draft/Scheduled survey; resolved by the AlertDialog rendered inside
  // StepSurveyInstances (co-located with the row, same convention as its
  // other dialogs — see resetOpen/previewTemplate there).
  const [pendingReassign, setPendingReassign] = useState<
    { offeringId: string; newTemplateId: string; existingTemplateId: string; existingStatus: 'draft' | 'scheduled' } | null
  >(null)
  const [generalTemplateId, setGeneralTemplateId] = useState<string>('')
  // Programmatic surveys pick courses directly (across terms) in step 1.
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  // Audit fix (2026-08-05): course ids StepScopeCourses has ever computed a
  // default selection for. That component's own default-selection effect is
  // keyed off a component-LOCAL ref, which forgets everything on unmount —
  // so every Step 2 → Step 1 round trip re-applied "select every ready
  // course" over whatever the Admin had actually chosen (including
  // deselections made via Step 2's own shared checkbox), violating "Untouched
  // rows never reset as a side effect." Page-owned so it survives step
  // navigation like hydratedResumeIds below; passed down so StepScopeCourses
  // can tell "never seen before" (apply the type default) from "seen before,
  // deliberately left out" (keep it out).
  const seenCourseIdsRef = useRef<Set<string>>(new Set())

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
  // CE-only survey title formula (merge fields resolve per course at creation)
  // + plain-text instructions — 2026-08-11, Monil (Course Eval sync up).
  const [surveyTitleTemplate, setSurveyTitleTemplate] = useState(DEFAULT_SURVEY_TITLE_TEMPLATE)
  const [surveyInstructions, setSurveyInstructions] = useState(DEFAULT_SURVEY_INSTRUCTIONS)
  // Per-course survey window override — absence of an offering's id means
  // "uses the global survey window" (2026-06-30 decision, restated 2026-08-11).
  const [courseWindowOverrides, setCourseWindowOverrides] = useState<Record<string, CourseWindowOverride>>({})
  const setCourseWindowOverride = (offeringId: string, next: CourseWindowOverride) =>
    setCourseWindowOverrides(p => ({ ...p, [offeringId]: next }))
  const clearCourseWindowOverride = (offeringId: string) =>
    setCourseWindowOverrides(p => {
      const { [offeringId]: _removed, ...rest } = p
      return rest
    })
  const [emailTemplateId, setEmailTemplateId] = useState(FIRST_INVITATION_TEMPLATE_ID)
  // Seed subject/body from the default template so the invitation card doesn't
  // read as "edited" before the user has touched anything.
  const [emailSubject, setEmailSubject] = useState(FIRST_INVITATION_TEMPLATE?.subject ?? setupDefaults.initialEmailSubject)
  const [emailBody, setEmailBody] = useState(FIRST_INVITATION_TEMPLATE?.body ?? setupDefaults.initialEmailBody)
  const [reminders, setReminders] = useState<Reminder[]>(
    () => remindersFromSettings(setupDefaults.activeReminderIntervals)
  )
  // Cadence facts (anchor + frequency) — lifted so Review can state the real
  // choice instead of assuming "before close" (2026-08-12 gap: Review always
  // said "before close" even after the admin picked Term/Course End Date).
  const [reminderAnchor, setReminderAnchor] = useState<ReminderAnchor>(EVAL_REMINDER_CADENCE.anchor)
  const [reminderFrequency, setReminderFrequency] = useState<ReminderFrequency>(EVAL_REMINDER_CADENCE.frequency)
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
  // The REAL per-course headcount (same o.enrolledCount + addedHere sum Step
  // 1's own footer shows — step-scope-courses.tsx selectedStudents) vs.
  // prismStudentCount's DEDUPED ROSTER-ID count above. These two diverge
  // hugely on this fixture: MOCK_COURSE_ENROLLMENTS only names ~20 student
  // IDs total (reused across courses) while enrolledCount runs into the
  // hundreds — exactly the documented gap in pce-mock-data.ts's own comment
  // above MOCK_COURSE_ENROLLMENTS ("shown as 'X of N enrolled in demo'"),
  // which was never actually wired to a label until now. Review's own
  // headline was silently using the roster-ID count with no caveat — "13
  // courses selected · 476 students" on Step 1, "reaching 15 people" on
  // Review, no indication the second number is a demo-data artifact.
  const realEnrolledTotal = useMemo(() => {
    let n = 0
    for (const o of selectedOfferings) n += o.enrolledCount + (addedStudents[o.id]?.length ?? 0)
    return n
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
      // Tie-break per implementation-plan decision #2 — see pickTemplateForType.
      result[o.id] = (single ?? pickTemplateForType(o.courseType, publishedTemplates)).id
    }
    return result
  }, [defaultAssignmentBase, publishedTemplates])
  function handleResetTemplateDefaults() {
    // ST-02's template-change reset applies here too: any course whose
    // EFFECTIVE template changes loses its unit selections (the seeding
    // effect re-populates the new template's units with first-sight
    // defaults). Courses already on their default are untouched.
    const changed = new Set<string>()
    for (const [oid, tid] of Object.entries(defaultAssignments)) {
      if ((templateAssignments[oid] ?? tid) !== tid) changed.add(oid)
    }
    setTemplateAssignments(prev => ({ ...prev, ...defaultAssignments }))
    if (changed.size > 0) setUnitSelections(prev => withoutOfferings(prev, changed))
  }

  // ── ST-01 existing-survey lookup (Step 1's status preview) ─────────────────
  // Surveys already on record, keyed by their offeringId FK — the same shape
  // as the merged step's flowsByOffering (step-courses-evaluatees.tsx), owned
  // here so the step stays presentation-only. Offerings are term-scoped, so
  // offeringId IS the course+term key ST-02 previews on. Informational input
  // to Step 1 ONLY — enforcement stays in Step 2's role-overlap engine.
  const existingSurveysByOffering = useMemo(() => {
    const m = new Map<string, PceSurvey[]>()
    for (const s of surveys) {
      if (!s.offeringId) continue
      m.set(s.offeringId, [...(m.get(s.offeringId) ?? []), s])
    }
    for (const list of m.values()) {
      list.sort((a, b) => (a.openDate ?? '').localeCompare(b.openDate ?? ''))
    }
    return m
  }, [surveys])

  // Person-scoped secondary assignments (2026-08-05 person-grain exception)
  // pull their named people OUT of the primary plan — the primary and
  // secondary rosters share unitSelections keys (offeringId|criterion|person,
  // not template-qualified, see the S2 comment on onSecondaryTemplateChange
  // below), so a person appearing in both plans at once would let toggling
  // their checkbox in one row silently affect the other.
  const personScopedNamesByOffering = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const [offeringId, entries] of Object.entries(secondaryTemplateAssignments)) {
      const names = entries.flatMap(e => e.scopePersonNames ?? [])
      if (names.length > 0) m.set(offeringId, new Set(names))
    }
    return m
  }, [secondaryTemplateAssignments])

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
      // Full `templates` (not just published) so a combined existing survey's
      // ORIGINAL template can still be looked up for role-coverage even if
      // it's since been unpublished/archived (roleOverlapConflicts fallback).
      const expanded = expandInstances(o, byId.get(raw) ?? null, surveys, templates)
      const scoped = personScopedNamesByOffering.get(o.id)
      return scoped ? expanded.filter(i => !i.personName || !scoped.has(i.personName)) : expanded
    })
  }, [surveyMode, selectedOfferings, templateAssignments, defaultAssignments, publishedTemplates, surveys, templates, personScopedNamesByOffering])

  // S2 / general "+ Add another template" — every extra template's instance
  // plan, same expansion as the primary but scoped to offerings with
  // secondaryTemplateAssignments entries. Reuses expandInstances/
  // roleOverlapConflicts as-is against PERSISTED surveys — that check
  // correctly flags an aspect an already-scheduled/live survey covers, no
  // matter which template (primary or extra) newly claims it.
  //
  // That check has no visibility into what THIS wizard session's OTHER
  // template assignments claim, though (nothing's persisted yet) — so two
  // in-progress templates on the same offering that both list, say,
  // Instructor would otherwise each resolve to 'new' and create two
  // overlapping survey instances for the same person. `claimed` tracks
  // criteria in add-order (primary first, then each extra template in the
  // order it was added) and drops a later template's rows for a criterion
  // an earlier one already has — same "first template wins" rule validated
  // at /compare/push-step2-template-hierarchy. Person-scoped entries
  // (scopePersonNames set) are exempt: they exist specifically to cover a
  // named person's role differently from an already-claiming template, so
  // they're neither filtered by `claimed` nor added to it.
  // Grouped by offering, then by the entry's position in that offering's
  // secondaryTemplateAssignments array — NOT flattened, since two entries
  // can legitimately share a templateId (a person-grain override can pick
  // the same template a general "+ Add another template" entry already
  // added) and a flat list would have no way to tell their instances back
  // apart for per-row rendering/gating.
  const secondaryInstancesByOffering = useMemo(() => {
    const byId = new Map(publishedTemplates.map(t => [t.id, t]))
    const out: Record<string, SurveyInstance[][]> = {}
    const dedupedLabels: Record<string, string[][]> = {}
    for (const o of selectedOfferings) {
      const entries = secondaryTemplateAssignments[o.id]
      if (!entries?.length) continue
      const primaryId = templateAssignments[o.id] ?? defaultAssignments[o.id] ?? ''
      const primaryTemplate = byId.get(primaryId)
      const claimed = new Set<Criterion>(primaryTemplate ? templateCriteria(primaryTemplate) : [])
      const dedupedForOffering: string[][] = []
      out[o.id] = entries.map(entry => {
        const t = byId.get(entry.templateId)
        if (!t) { dedupedForOffering.push([]); return [] }
        let expanded = expandInstances(o, t, surveys, templates)
        if (entry.scopePersonNames?.length) {
          const scoped = new Set(entry.scopePersonNames)
          expanded = expanded
            .filter(i => i.scope === 'instructor' && i.personName && scoped.has(i.personName))
            // The person-grain decision is already made BY VIRTUE of this
            // entry existing — expandInstances still computes
            // lateAddedRelativeTo from the general role-overlap check (it
            // has no notion of "this entry was created FOR this person"),
            // which would otherwise show the "Review {name}'s template"
            // callout again on the row that IS the resolved answer.
            .map(i => ({ ...i, lateAddedRelativeTo: null }))
          dedupedForOffering.push([])
        } else {
          // Every real published template in this fixture shares MOST of
          // its criteria with the default primary (End-of-Term Evaluation
          // covers course material + instructor; Faculty Midterm Check-In
          // is a strict subset of that) — so full-overlap dedup isn't a
          // rare edge case here, it's the common case. Track WHICH criteria
          // got dropped so the row can say so instead of rendering a bare
          // "–" with no explanation (found live-testing against
          // /compare/push-step2-template-hierarchy, 2026-08-06).
          const droppedLabels = templateCriteria(t)
            .filter(c => claimed.has(c))
            .map(c => CRITERION_TOGGLE_LABEL[c])
          dedupedForOffering.push(droppedLabels)
          expanded = expanded.filter(i => !claimed.has(i.criterion))
          for (const c of templateCriteria(t)) claimed.add(c)
        }
        return expanded
      })
      dedupedLabels[o.id] = dedupedForOffering
    }
    return { instances: out, dedupedLabels }
  }, [secondaryTemplateAssignments, selectedOfferings, templateAssignments, defaultAssignments, publishedTemplates, surveys, templates])
  // Flat projection — the shape push-time wiring (still open engineering
  // scope, see secondaryTemplateAssignments' declaration) and any future
  // Review-step total would want.
  const secondaryInstancePlan = useMemo(
    () => Object.values(secondaryInstancesByOffering.instances).flat(2),
    [secondaryInstancesByOffering],
  )

  // ── ST-02 sticky per-unit selection (Phase 2) ──────────────────────────────
  // Page-owned (replacing the step's old reset-on-planSig `included` Set) so
  // the template-change reset happens where assignments live and Phase 3 can
  // persist it in Save-as-Draft alongside templateAssignments + autoUpdateOn.
  // Keyed by SurveyInstance.key; absence = untouched. First sight of a
  // brand-new unit seeds its default below — 'selected' (full template
  // coverage; ST-02 says this is unaffected by the Auto Update flag, which
  // governs REFRESH-time arrivals only) except gaps and role-overlap
  // duplicates, which seed 'deselected'. Gaps match shipped behavior;
  // duplicates deliberately deviate from the Phase-2 brief's "selected unless
  // gap" wording — seeding them 'selected' would flip the settled UC4
  // "skipped by default" default and push re-evaluations silently, the
  // opposite of ST-02's hard block, while the Evaluate-again toggle still
  // renders (Phase 4 replaces it with the hard-block UI).
  // An existing key is NEVER overwritten here — only the template-change
  // reset, course deselection, or reconcileUnitsOnRefresh may change it.
  const [unitSelections, setUnitSelections] = useState<UnitSelectionMap>({})
  // ST-02 Auto Update — one flag for the whole step, defaults OFF on a
  // brand-new wizard. Flipping it does nothing by itself; it only decides how
  // units the rows haven't seen before arrive on the next manual Refresh.
  // NOTE for Phase 3: persist + restore BOTH pieces (unitSelections and
  // autoUpdateOn) as part of the wizard Draft state.
  const [autoUpdateOn, setAutoUpdateOn] = useState(false)

  useEffect(() => {
    setUnitSelections(prev => {
      let changed = false
      const next = { ...prev }
      for (const i of instancePlan) {
        if (next[i.key] !== undefined) continue
        next[i.key] = i.status === 'new' ? 'selected' : 'deselected'
        changed = true
      }
      return changed ? next : prev
    })
  }, [instancePlan])

  // ── ST-02 Phase 3 — Draft/Scheduled resume ("pull in for editing") ─────────
  // A selected course+term that already has a Draft or Scheduled survey on
  // record (draftOrScheduledMatch) is pulled into the wizard for editing:
  // Step 2 (template assignment, unit selections, Auto Update) and Step 3
  // (window/release dates) hydrate from that survey's stored config instead
  // of computing fresh defaults, and final submit updates that record in
  // place (pushSurveyBatch). Hydration is ONE-SHOT per offering — once
  // applied, the admin's live edits own the state; deselecting and
  // re-selecting the course deliberately does NOT re-hydrate ("no restored
  // prior state" on re-selection, per ST-02).
  const hydratedResumeIds = useRef<Set<string>>(new Set())
  // Step-wide pieces (Auto Update flag, window dates) hydrate once, from the
  // first matched survey that carries them — they were duplicated onto every
  // row of the saved batch.
  const resumeStepwideApplied = useRef(false)
  const warnedStrandedDraftIds = useRef<Set<string>>(new Set())
  const [templateDriftNotices, setTemplateDriftNotices] = useState<TemplateDriftNotice[]>([])
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)

  useEffect(() => {
    if (surveyMode === 'general') return

    // OPEN ITEM (gap-analysis doc §1 Open items — Product decision pending):
    // a saved Draft whose course has since been deleted/descoped from Prism.
    // Options A (drop + notify) / B (keep visible, block) / C (fail resume)
    // were offered; none chosen. Until Product decides, fail loudly — warn
    // once per stranded draft rather than silently dropping or guessing.
    for (const s of surveys) {
      if (!s.wizardDraft || s.cancelledAt || !s.offeringId) continue
      if (warnedStrandedDraftIds.current.has(s.id)) continue
      if (!MOCK_COURSE_OFFERINGS.some(o => o.id === s.offeringId)) {
        warnedStrandedDraftIds.current.add(s.id)
        console.warn(
          `[push wizard] Draft survey ${s.id} (${s.courseCode}) references offering ${s.offeringId}, which no longer exists in Prism. ` +
          'Resume behavior for deleted/descoped courses is undecided (gap-analysis doc §1 Open items — Product decision pending); the draft is left untouched and unresumed.',
        )
      }
    }

    const YMD = /^\d{4}-\d{2}-\d{2}$/
    const labelOf = (c: string) => (CRITERION_TOGGLE_LABEL as Record<string, string>)[c] ?? c
    const assignPatch: Record<string, string> = {}
    const selectionPatch: UnitSelectionMap = {}
    const wipedOfferings = new Set<string>()
    const notices: TemplateDriftNotice[] = []

    for (const o of selectedOfferings) {
      if (hydratedResumeIds.current.has(o.id)) continue
      const match = draftOrScheduledMatch(o, surveys)
      if (!match) continue
      hydratedResumeIds.current.add(o.id)

      // OPEN ITEM (gap-analysis doc §1 Open items — Product decision pending):
      // the resume validity check covers only the TEMPLATE's publish status.
      // Whether the course's own TYPE changing since the Draft was saved
      // (reclassified in Prism) should also invalidate the Draft is
      // unspecified — nothing is snapshotted for it here, deliberately.

      const draft = match.wizardDraft
      const savedTemplate = templates.find(t => t.id === match.templateId) ?? null

      if (!savedTemplate || templateStoryStatusOf(savedTemplate) !== 'published') {
        // Saved template since unpublished/archived/deleted → the row is
        // treated as "no template assigned" (ST-02): '' suppresses the
        // type-default fallback, the row shows the Assign-template control
        // (which lists only published templates), and Continue stays blocked
        // via the step's missingTemplate gate until one is chosen.
        assignPatch[o.id] = ''
        notices.push({
          offeringId: o.id,
          courseCode: match.courseCode,
          // '' = the template record itself is gone (deleted) — the banner
          // falls back to "The template saved with this draft".
          templateName: savedTemplate?.name ?? '',
          kind: 'unpublished',
          addedRoleLabels: [],
          removedRoleLabels: [],
        })
      } else {
        assignPatch[o.id] = match.templateId
        // Template edited since the Draft was saved (pre-Live only — this
        // path only ever sees Draft/Scheduled surveys; template content
        // freezes at Live per the Freeze & Sync Policy): keep the template,
        // let coverage recompute against its current definition, and raise
        // the "template updated since this draft was saved" notice.
        if (draft && draft.templateCriteriaSnapshot.length > 0) {
          const current: string[] = templateCriteria(savedTemplate)
          const snap = new Set(draft.templateCriteriaSnapshot)
          const cur = new Set(current)
          const added = current.filter(c => !snap.has(c))
          const removed = draft.templateCriteriaSnapshot.filter(c => !cur.has(c))
          if (added.length > 0 || removed.length > 0) {
            notices.push({
              offeringId: o.id,
              courseCode: match.courseCode,
              templateName: savedTemplate.name,
              kind: 'updated',
              addedRoleLabels: added.map(labelOf),
              removedRoleLabels: removed.map(labelOf),
            })
          }
        }
        if (draft) {
          // Replace any first-render seeds for this offering with the saved
          // selections; units the template gained since the save are absent
          // from the slice and get first-sight seeds from the seeding effect.
          wipedOfferings.add(o.id)
          Object.assign(selectionPatch, draft.unitSelections)
        }
      }

      if (!resumeStepwideApplied.current) {
        resumeStepwideApplied.current = true
        if (draft) setAutoUpdateOn(draft.autoUpdateOn)
        // Step 3 window/release: prefer the saved wizard state; a Scheduled
        // survey without wizardDraft (pre-Phase 3 record) still restores its
        // own open/close dates when they parse as YYYY-MM-DD.
        const openYmd = draft?.openDate ?? (match.openDate && YMD.test(match.openDate) ? match.openDate : undefined)
        const closeYmd = draft?.closeDate ?? (YMD.test(match.deadline) ? match.deadline : undefined)
        if (openYmd) setOpenDate(isoToDate(openYmd))
        if (closeYmd) setCloseDate(isoToDate(closeYmd))
        if (draft?.releaseDate) setReleaseDate(isoToDate(draft.releaseDate))
      }
    }

    if (Object.keys(assignPatch).length > 0) {
      setTemplateAssignments(prev => ({ ...prev, ...assignPatch }))
    }
    if (wipedOfferings.size > 0 || Object.keys(selectionPatch).length > 0) {
      setUnitSelections(prev => ({ ...withoutOfferings(prev, wipedOfferings), ...selectionPatch }))
    }
    if (notices.length > 0) {
      setTemplateDriftNotices(prev => [...prev, ...notices])
    }
  }, [surveyMode, selectedOfferings, surveys, templates])

  // OPEN ITEM (gap-analysis doc §1 Open items — Owner: Engineering): entering
  // a step past Courses & students with an empty course set (deep-link or
  // refresh) — redirect vs empty state is undecided. Step 2 currently shows
  // its EmptyHint; warn loudly so the state is never mistaken for handled.
  useEffect(() => {
    if (surveyMode !== 'general' && typeof step === 'number' && step >= 2 && selectedOfferings.length === 0) {
      console.warn(
        `[push wizard] Step ${step} reached with an empty course set. Redirect/empty-state behavior is undecided (gap-analysis doc §1 Open items — Product decision pending); showing the step's empty state.`,
      )
    }
  }, [surveyMode, step, selectedOfferings.length])

  // Downstream consumers (push, Review ledger) read the derived included set —
  // same shape the old state had, now a projection of the sticky map.
  const includedInstanceKeys = useMemo(
    () => new Set(Object.entries(unitSelections).filter(([, v]) => v === 'selected').map(([k]) => k)),
    [unitSelections],
  )

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
        courseCode: s.courseCode,
        courseName: s.courseName,
        // Same course can carry several flows — the evaluatee tells them apart.
        evaluatee: s.evalScope === 'instructor'
          ? { scope: 'person' as const, personName: s.instructors[0]?.name }
          : { scope: 'course' as const },
        status: s.status,
        openDate: s.openDate,
        untilLabel: commUntilOfSurvey(s),
        cadence: commCadenceOfSurvey(s),
        rules: commRulesOfSurvey(s),
      }))
  }, [surveys, selectedOfferings])

  const selectedInvitationTemplate = EVAL_EMAIL_TEMPLATES.find(t => t.id === emailTemplateId) ?? null
  const isEmailEdited = !!selectedInvitationTemplate &&
    (emailSubject !== selectedInvitationTemplate.subject || emailBody !== selectedInvitationTemplate.body)

  // One row per selected course offering — 2026-08-11, Monil: the previous
  // template-grouped summary "does not give a right summary to the admin...
  // it has to be a list view instead of a summary." Template is deliberately
  // OMITTED per the same call ("template visualization is not important for
  // admin — admin just wants to make sure I have all the courses... and
  // right roles are getting evaluated"). Roles are the UNION of primary +
  // every secondary-template entry's criteria (mirrors the claimed-criteria
  // union secondaryInstancesByOffering already computes for instance
  // dedup), spelled out per Monil's exact wording, not a bare count.
  const reviewCourseRows = useMemo(() => {
    if (surveyMode === 'general') return []
    const byId = new Map(publishedTemplates.map(t => [t.id, t]))
    return selectedOfferings.map(o => {
      const course = MOCK_MASTER_COURSES.find(c => c.id === o.masterCourseId)
      const override = courseWindowOverrides[o.id]
      const primaryId = templateAssignments[o.id] ?? defaultAssignments[o.id] ?? ''
      const primaryTemplate = byId.get(primaryId)
      const evaluatedCriteria = new Set<Criterion>(primaryTemplate ? templateCriteria(primaryTemplate) : [])
      for (const entry of secondaryTemplateAssignments[o.id] ?? []) {
        const t = byId.get(entry.templateId)
        if (t) for (const c of templateCriteria(t)) evaluatedCriteria.add(c)
      }
      return {
        offeringId: o.id,
        code: course?.code ?? o.id,
        name: course?.name ?? '',
        // Plain text, not a tinted pill — mirrors step-survey-instances.tsx's
        // 2026-08-05 call (Romit): a pill here competes for attention with the
        // roles-evaluated content beside it; type is reference info, not status.
        courseTypeLabel: COURSE_TYPE_FULL_LABEL[deliveryModeOf(o)],
        openDate: override?.openDate ?? openDate,
        closeDate: override?.closeDate ?? closeDate,
        hasCustomWindow: !!override,
        studentCount: o.enrolledCount,
        evaluatedRoleLabels: ALL_CRITERIA.filter(c => evaluatedCriteria.has(c)).map(c => CRITERION_TOGGLE_LABEL[c]),
      }
    })
  }, [surveyMode, selectedOfferings, courseWindowOverrides, templateAssignments, defaultAssignments, publishedTemplates, secondaryTemplateAssignments, openDate, closeDate])

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
  // Unions primary + every secondary-template entry's criteria — must match
  // reviewCourseRows' per-course union below, or a role a secondary template
  // adds to one course's row would be missing from this headline aggregate
  // (caught in verification review, 2026-08-11).
  const evaluateSummary = useMemo(() => {
    if (surveyMode === 'general') return undefined
    const found = new Set<Criterion>()
    for (const o of selectedOfferings) {
      const tid = templateAssignments[o.id] ?? defaultAssignments[o.id]
      const t = publishedTemplates.find(x => x.id === tid)
      if (t) for (const c of templateCriteria(t)) found.add(c)
      for (const entry of secondaryTemplateAssignments[o.id] ?? []) {
        const st = publishedTemplates.find(x => x.id === entry.templateId)
        if (st) for (const c of templateCriteria(st)) found.add(c)
      }
    }
    return ALL_CRITERIA.filter(c => found.has(c)).map(c => CRITERION_TOGGLE_LABEL[c]).join(', ')
  }, [surveyMode, selectedOfferings, templateAssignments, defaultAssignments, publishedTemplates, secondaryTemplateAssignments])

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

  function handleRefreshUnits() {
    // ST-02 manual refresh — the ONLY Prism fetch trigger. In this mock app
    // the "fresh" unit resolution IS instancePlan (expandInstances re-runs
    // reactively off current data); in production this is where the Prism
    // re-fetch goes before reconciling. Unseen units arrive per the Auto
    // Update flag; units gone from Prism drop out; every state the admin
    // already set is left untouched (reconcileUnitsOnRefresh).
    setUnitSelections(prev => reconcileUnitsOnRefresh(prev, instancePlan, autoUpdateOn))
  }

  function handleCourseSelectedChange(offeringId: string, selected: boolean) {
    // Step 2 carries Step 1's course checkbox (ST-02): it writes the SAME
    // selectedCourseIds Step 1 reports into, so unchecking here is
    // indistinguishable from unchecking on Step 1 for every downstream
    // consumer. The course's unit selections are wiped too, so a later
    // re-selection re-seeds first-sight defaults ("no restored prior state").
    setSelectedCourseIds(prev => {
      const next = new Set(prev)
      if (selected) next.add(offeringId)
      else next.delete(offeringId)
      return next
    })
    if (!selected) setUnitSelections(prev => withoutOfferings(prev, new Set([offeringId])))
  }

  function handleSaveDraft() {
    // ST-02 Phase 3 — persist the whole in-progress wizard as one draft
    // PceSurvey per offering (see SaveWizardDraftInput, pce-state.tsx).
    // Upsert: an offering already carrying a Draft/Scheduled survey (the one
    // this wizard is editing) updates that record in place.
    saveDraft({
      surveyType,
      termId,
      academicYear,
      autoUpdateOn,
      openDate: dateToYmd(openDate) || undefined,
      closeDate: dateToYmd(closeDate) || undefined,
      releaseDate: dateToYmd(releaseDate) || undefined,
      offerings: selectedOfferings.map(o => {
        const tid = templateAssignments[o.id] ?? defaultAssignments[o.id] ?? ''
        const t = templates.find(x => x.id === tid) ?? null
        const prefix = `${o.id}|`
        const slice: Record<string, 'selected' | 'deselected'> = {}
        for (const [k, v] of Object.entries(unitSelections)) {
          if (k.startsWith(prefix)) slice[k] = v
        }
        return {
          offeringId: o.id,
          templateId: tid,
          existingSurveyId: draftOrScheduledMatch(o, surveys)?.id,
          unitSelections: slice,
          templateCriteriaSnapshot: t ? templateCriteria(t) : [],
        }
      }),
    })
    // The rows just saved must not re-hydrate over live wizard state when the
    // surveys array updates — mark them consumed for this session.
    for (const o of selectedOfferings) hydratedResumeIds.current.add(o.id)
    resumeStepwideApplied.current = true
    setDraftSavedAt(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
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
    setSecondaryTemplateAssignments({})
    setSelectedCourseIds(new Set())
    setAddedStudents({})
    setUnitSelections({})
    setAutoUpdateOn(false)
    // Phase 3 resume/draft state — a fresh wizard hydrates from scratch.
    hydratedResumeIds.current = new Set()
    resumeStepwideApplied.current = false
    setTemplateDriftNotices([])
    setDraftSavedAt(null)
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

      {/* Horizontal step bar — hidden on success step. Save as Draft lives
          in its endSlot (2026-08-12): persists the WHOLE in-progress
          wizard, whatever step is showing, so ONE position serves all of
          them — the last tab (Review) is always rightmost, so this reads
          as "beside Review" throughout, instead of the three different
          spots it rendered in before (step 2's own header actions, step
          3's footer, a step-4-only shell row). CE mode only, from Survey
          design on (step 1 has nothing draftable beyond scope, and general
          mode has no draft path). */}
      {step !== 'success' && (
        <WizardNav
          currentStep={currentStepNum}
          completedUpTo={completedUpTo}
          onStepClick={handleStepNavClick}
          mode={surveyMode}
          endSlot={surveyMode !== 'general' && typeof step === 'number' && step >= 2 ? (
            <>
              {draftSavedAt && (
                <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                  Draft saved at {draftSavedAt}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={selectedOfferings.length === 0}
                onClick={handleSaveDraft}
              >
                Save as draft
              </Button>
            </>
          ) : undefined}
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
                <h2 className="text-xl font-semibold">
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
                <h3 className="text-base font-semibold">
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
                <h2 className="text-xl font-semibold">
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
                selectedIds={selectedCourseIds}
                seenIdsRef={seenCourseIdsRef}
                addedStudents={addedStudents}
                existingSurveysByOffering={existingSurveysByOffering}
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
                onTemplateChange={(offeringId, tmplId) => {
                  // S2 — before committing, check whether this offering
                  // already has a Draft/Scheduled survey under a DIFFERENT
                  // template. If so, this isn't a plain reassignment — ask
                  // Override vs. Create-new instead of silently replacing.
                  const offering = selectedOfferings.find(o => o.id === offeringId)
                  const existing = offering ? draftOrScheduledMatch(offering, surveys) : null
                  if (existing?.templateId && existing.templateId !== tmplId) {
                    setPendingReassign({
                      offeringId, newTemplateId: tmplId, existingTemplateId: existing.templateId,
                      existingStatus: storyStatusOf(existing) as 'draft' | 'scheduled',
                    })
                    return
                  }
                  setTemplateAssignments(p => ({ ...p, [offeringId]: tmplId }))
                  // ST-02: changing a course's template resets its evaluatee
                  // selection entirely — no prior selection carries forward,
                  // even for roles/people the old and new template share. The
                  // seeding effect re-populates the new template's units with
                  // first-sight defaults on the next plan recompute.
                  setUnitSelections(prev => withoutOfferings(prev, new Set([offeringId])))
                }}
                pendingReassign={pendingReassign}
                // Replace is the only outcome now (2026-08-12 — see
                // step-survey-instances.tsx's dialog comment); the former
                // "create-new" branch wrote into secondaryTemplateAssignments,
                // the exact "two templates, one course" shape the reviewer
                // killed.
                onResolveReassign={() => {
                  if (!pendingReassign) return
                  const { offeringId, newTemplateId } = pendingReassign
                  setTemplateAssignments(p => ({ ...p, [offeringId]: newTemplateId }))
                  setUnitSelections(prev => withoutOfferings(prev, new Set([offeringId])))
                  setPendingReassign(null)
                }}
                onCancelReassign={() => setPendingReassign(null)}
                secondaryTemplateAssignments={secondaryTemplateAssignments}
                secondaryInstances={secondaryInstancesByOffering.instances}
                secondaryDedupedLabels={secondaryInstancesByOffering.dedupedLabels}
                onSecondaryTemplateChange={(offeringId, index, tmplId) => {
                  // Deliberately does NOT clear unitSelections for the whole
                  // offering the way the primary onTemplateChange does —
                  // unitSelections keys aren't template-qualified, so that
                  // clear would also wipe the PRIMARY survey's (or another
                  // extra template's) already-made selections. A
                  // newly-introduced criterion is simply unseen and gets
                  // first-sight defaults from the existing seeding effect; a
                  // no-longer-relevant one is just unused. Preserves the
                  // entry's existing scopePersonNames — this handler is also
                  // how the person-scoped card's own TemplateControl reports
                  // a pick (see onAssignPersonTemplate below), so a
                  // person-scoped entry changing its template stays scoped.
                  setSecondaryTemplateAssignments(p => ({
                    ...p,
                    [offeringId]: (p[offeringId] ?? []).map((e, i) =>
                      i === index ? { templateId: tmplId, scopePersonNames: e.scopePersonNames } : e),
                  }))
                }}
                onAssignPersonTemplate={(offeringId, personName, templateId) => {
                  // The person-grain exception's own entry point (2026-08-05)
                  // — a late-added co-instructor gets a new extra-template
                  // entry scoped to just them, distinct from the general
                  // "Keep both"/"+ Add another template" flows above which
                  // leave scopePersonNames unset and cover the whole role.
                  // Reuses an existing entry already scoped to exactly this
                  // person (picking a different template for them twice)
                  // instead of piling up a second one.
                  setSecondaryTemplateAssignments(p => {
                    const entries = p[offeringId] ?? []
                    const idx = entries.findIndex(
                      e => e.scopePersonNames?.length === 1 && e.scopePersonNames[0] === personName,
                    )
                    const next = idx >= 0
                      ? entries.map((e, i) => (i === idx ? { ...e, templateId } : e))
                      : [...entries, { templateId, scopePersonNames: [personName] }]
                    return { ...p, [offeringId]: next }
                  })
                }}
                onRemoveSecondary={(offeringId, index) => {
                  setSecondaryTemplateAssignments(p => {
                    const next = (p[offeringId] ?? []).filter((_, i) => i !== index)
                    const out = { ...p }
                    if (next.length > 0) out[offeringId] = next
                    else delete out[offeringId]
                    return out
                  })
                }}
                onResetDefaults={handleResetTemplateDefaults}
                unitSelections={unitSelections}
                onUnitSelectionChange={(keys, state) =>
                  setUnitSelections(prev => {
                    const next = { ...prev }
                    for (const k of keys) next[k] = state
                    return next
                  })
                }
                autoUpdateOn={autoUpdateOn}
                onAutoUpdateChange={setAutoUpdateOn}
                onRefreshUnits={handleRefreshUnits}
                onCourseSelectedChange={handleCourseSelectedChange}
                templateDriftNotices={templateDriftNotices}
                onDismissTemplateDrift={() => setTemplateDriftNotices([])}
                academicYear={academicYear}
                surveyTitleTemplate={surveyTitleTemplate}
                onSurveyTitleTemplateChange={setSurveyTitleTemplate}
                surveyInstructions={surveyInstructions}
                onSurveyInstructionsChange={setSurveyInstructions}
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
              academicYear={academicYear}
              courseWindowOverrides={courseWindowOverrides}
              onSetCourseWindowOverride={setCourseWindowOverride}
              onClearCourseWindowOverride={clearCourseWindowOverride}
              existingStreams={existingStreams}
              openDate={openDate}
              closeDate={closeDate}
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
              reminderAnchor={reminderAnchor}
              onReminderAnchorChange={setReminderAnchor}
              reminderFrequency={reminderFrequency}
              onReminderFrequencyChange={setReminderFrequency}
              onReminderSameAsInviteChange={setReminderSameAsInvite}
              onReminderTemplateChange={setReminderTemplateId}
              onReminderSubjectChange={setReminderSubject}
              onReminderBodyChange={setReminderBody}
              onOpenDateChange={setOpenDate}
              onCloseDateChange={setCloseDate}
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
              courseRows={reviewCourseRows}
              openDate={openDate}
              closeDate={closeDate}
              studentCount={prismStudentCount}
              realStudentCount={surveyMode === 'course_evaluation' ? realEnrolledTotal : undefined}
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
              reminderAnchor={reminderAnchor}
              reminderFrequency={reminderFrequency}
              surveyTitleTemplate={surveyMode === 'course_evaluation' ? surveyTitleTemplate : undefined}
              surveyInstructions={surveyMode === 'course_evaluation' ? surveyInstructions : undefined}
              onEdit={(n) => setStep((surveyMode === 'general' && n === 2 ? 1 : n) as WizardStep)}
              onBack={() => setStep(3)}
              onPush={handlePush}
              cohortSummary={cohortSummary}
              evaluateSummary={evaluateSummary}
              subjectIssues={reviewSubjectIssues}
              windowIssues={reviewWindowIssues}
              duplicateIssues={acceptedDuplicateIssues}
              duplicateTitle={(() => {
                const n = acceptedDuplicateIssues.reduce((sum, c) => sum + c.reasons.length, 0)
                return n === 1
                  ? '1 accepted re-evaluation will run over an existing survey'
                  : `${n} accepted re-evaluations will each run over an existing survey`
              })()}
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
