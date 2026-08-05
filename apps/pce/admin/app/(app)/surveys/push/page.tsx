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
  type SurveyType,
  type PceTemplate,
  type PceSurvey,
  type TermSeason,
} from '@/lib/pce-mock-data'
import { resolveTerm, cohortOptions, offeringsForScope } from '@/lib/pce-course-scope'
import { type Criterion, ALL_CRITERIA, CRITERION_TOGGLE_LABEL, templateCriteria } from '@/lib/pce-course-readiness'
import {
  subjectDataIssues, windowIssues, expandInstances, existingFlowSummary,
  reconcileUnitsOnRefresh, draftOrScheduledMatch, templateStoryStatusOf, storyStatusOf,
  type UnitSelectionMap, type CourseIssue,
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

/** S2's one secondary-template slot (see secondaryTemplateAssignments below).
 *  `scopePersonNames` absent = the original 2026-08-04 "Keep both" behavior,
 *  the whole role/aspect gets the second template. Present (2026-08-05,
 *  person-grain exception) = the second template covers ONLY these named
 *  people — the late-added-co-instructor case, reusing this same one-extra-
 *  slot mechanism instead of a general per-offering array. */
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
  const matches = courseType
    ? publishedTemplates.filter(t => t.courseType === courseType)
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
  // survey for the same offering. Scoped intentionally to one extra slot
  // (not a general array) — this is the one-more-template case the design
  // review needs; a fully general N-templates-per-offering model is real
  // engineering scope, tracked separately (spec doc §3, S2).
  const [secondaryTemplateAssignments, setSecondaryTemplateAssignments] = useState<Record<string, SecondaryTemplateAssignment>>({})
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
    for (const [offeringId, entry] of Object.entries(secondaryTemplateAssignments)) {
      if (!entry.scopePersonNames?.length) continue
      m.set(offeringId, new Set(entry.scopePersonNames))
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

  // S2 — the secondary survey's instance plan, same expansion as above but
  // scoped to offerings with a secondaryTemplateAssignments entry. Reuses
  // expandInstances/roleOverlapConflicts as-is: the overlap check already
  // scans ALL persisted surveys for the offering, so it correctly flags the
  // aspect the PRIMARY survey already covers as a duplicate here — no new
  // conflict logic needed, just a second call with the second template.
  // Person-scoped entries (scopePersonNames set) additionally restrict the
  // result to ONLY those named people's instructor-scope instances — the
  // whole point of the person-grain exception is that this second survey
  // covers just the late-added person, not the whole role.
  const secondaryInstancePlan = useMemo(() => {
    const byId = new Map(publishedTemplates.map(t => [t.id, t]))
    return Object.entries(secondaryTemplateAssignments).flatMap(([offeringId, entry]) => {
      const o = selectedOfferings.find(x => x.id === offeringId)
      if (!o) return []
      const expanded = expandInstances(o, byId.get(entry.templateId) ?? null, surveys, templates)
      if (!entry.scopePersonNames?.length) return expanded
      const scoped = new Set(entry.scopePersonNames)
      return expanded
        .filter(i => i.scope === 'instructor' && i.personName && scoped.has(i.personName))
        // The person-grain decision is already made BY VIRTUE of this
        // secondary existing — expandInstances still computes
        // lateAddedRelativeTo from the general role-overlap check (it has
        // no notion of "this secondary was created FOR this person"), which
        // would otherwise show the "Review {name}'s template" callout again
        // on the row that IS the resolved answer. Cleared here, not in
        // expandInstances, since that function is shared with the primary
        // plan where the signal is still exactly what's needed.
        .map(i => ({ ...i, lateAddedRelativeTo: null }))
    })
  }, [secondaryTemplateAssignments, selectedOfferings, publishedTemplates, surveys, templates])

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

      {/* Horizontal step bar — hidden on success step */}
      {step !== 'success' && (
        <WizardNav
          currentStep={currentStepNum}
          completedUpTo={completedUpTo}
          onStepClick={handleStepNavClick}
          mode={surveyMode}
        />
      )}

      {/* ST-02 Phase 3 — Save as Draft. Shell-owned (not a step footer): it
          persists the WHOLE in-progress wizard, whatever step is showing.
          CE mode only, from Survey design on (step 1 has nothing draftable
          beyond scope, and general mode has no draft path). Step 2 renders
          its OWN copy of this button grouped with its Reset to defaults/New
          template actions (2026-08-05, Romit's call) — skipped here so it
          isn't shown twice. */}
      {surveyMode !== 'general' && typeof step === 'number' && step >= 2 && step !== 2 && (
        <div className="flex items-center justify-end gap-3" style={{ padding: '12px 40px 0' }}>
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
        </div>
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
                onResolveReassign={(choice) => {
                  if (!pendingReassign) return
                  const { offeringId, newTemplateId } = pendingReassign
                  if (choice === 'override') {
                    setTemplateAssignments(p => ({ ...p, [offeringId]: newTemplateId }))
                    setUnitSelections(prev => withoutOfferings(prev, new Set([offeringId])))
                  } else if (choice === 'create-new') {
                    setSecondaryTemplateAssignments(p => ({ ...p, [offeringId]: { templateId: newTemplateId } }))
                  }
                  setPendingReassign(null)
                }}
                onCancelReassign={() => setPendingReassign(null)}
                secondaryTemplateAssignments={secondaryTemplateAssignments}
                secondaryInstances={secondaryInstancePlan}
                onSecondaryTemplateChange={(offeringId, tmplId) => {
                  // Deliberately does NOT clear unitSelections for the whole
                  // offering the way the primary onTemplateChange does —
                  // unitSelections keys aren't template-qualified, so that
                  // clear would also wipe the PRIMARY survey's already-made
                  // selections. A newly-introduced criterion is simply
                  // unseen and gets first-sight defaults from the existing
                  // seeding effect; a no-longer-relevant one is just unused.
                  // Preserves an existing scopePersonNames — this handler is
                  // also how the person-scoped card's own TemplateControl
                  // reports a pick (see onAssignPersonTemplate below), so a
                  // person-scoped slot changing its template stays scoped.
                  setSecondaryTemplateAssignments(p => ({
                    ...p,
                    [offeringId]: { templateId: tmplId, scopePersonNames: p[offeringId]?.scopePersonNames },
                  }))
                }}
                onAssignPersonTemplate={(offeringId, personName, templateId) => {
                  // The person-grain exception's own entry point (2026-08-05)
                  // — a late-added co-instructor gets the one extra
                  // secondary slot scoped to just them, distinct from the
                  // general "Keep both" flow above which leaves
                  // scopePersonNames unset and covers the whole role.
                  setSecondaryTemplateAssignments(p => ({
                    ...p,
                    [offeringId]: { templateId, scopePersonNames: [personName] },
                  }))
                }}
                onRemoveSecondary={(offeringId) => {
                  setSecondaryTemplateAssignments(p => {
                    const next = { ...p }
                    delete next[offeringId]
                    return next
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
                onSaveDraft={selectedOfferings.length > 0 ? handleSaveDraft : undefined}
                draftSavedAt={draftSavedAt}
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
