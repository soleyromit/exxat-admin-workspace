'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  DEMO_ACCOUNTS,
  DEFAULT_ACCOUNT_ID,
  accountById,
  setActiveAccountId,
  type DemoAccount,
} from '@/lib/pce-demo-accounts'
import type {
  PceUser,
  PceSurvey,
  PceSurveyWizardDraft,
  PceTemplate,
  ProgramTerm,
  SurveyStatus,
  TemplateSection,
  TemplateQuestion,
  PceTemplateSection,
  SurveyType,
} from '@/lib/pce-mock-data'
import {
  MOCK_CURRENT_USER,
  MOCK_SURVEYS,
  MOCK_TEMPLATES,
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  MOCK_MASTER_COURSES,
  MOCK_FACULTY,
} from '@/lib/pce-mock-data'
import { CRITERION_GROUP, templateCriteria } from '@/lib/pce-course-readiness'
import { draftOrScheduledMatch } from '@/lib/pce-push-validation'

export const DEFAULT_SETUP_EMAIL_SUBJECT =
  'Your course evaluation for {{course_name}} is now open'

export const DEFAULT_SETUP_EMAIL_BODY = `Hi {{student_first_name}},

Your evaluation for {{course_name}} is open until {{close_date}}. Your responses are anonymous. Your name will never be attached to your answers.

Take the survey: {{survey_link}}`

export interface SetupDefaults {
  initialEmailSubject: string
  initialEmailBody: string
  activeReminderIntervals: number[]
}

const INITIAL_SETUP_DEFAULTS: SetupDefaults = {
  initialEmailSubject: DEFAULT_SETUP_EMAIL_SUBJECT,
  initialEmailBody: DEFAULT_SETUP_EMAIL_BODY,
  activeReminderIntervals: [14, 7, 3],
}

/** One survey to create — the Survey design step's instance grain. */
export interface PushInstance {
  offeringId: string
  scope: 'course' | 'instructor'
  /** Readiness criterion id — stamped onto the flow as evalRole so FUTURE
   *  duplicate checks can match the full offering+role+person key. */
  role?: string
  personName?: string
}

/** ST-02 Phase 3 — one offering's slice of a Save-as-Draft upsert. */
export interface WizardDraftOffering {
  offeringId: string
  /** Effective template for this offering ('' = none assigned yet). */
  templateId: string
  /** The Draft/Scheduled survey being edited (from draftOrScheduledMatch);
   *  absent = first save for this offering, a new draft row is created. */
  existingSurveyId?: string
  /** This offering's slice of the page's UnitSelectionMap (keys start
   *  `${offeringId}|`). */
  unitSelections: Record<string, 'selected' | 'deselected'>
  /** templateCriteria() of `templateId` at save time (Criterion ids as
   *  strings) — resume diffs against the current criteria for the
   *  "template updated since this draft was saved" notice. */
  templateCriteriaSnapshot: string[]
}

/** ST-02 Phase 3 — Save as Draft input: the whole wizard run, persisted as one
 *  draft PceSurvey row PER offering (see PceSurveyWizardDraft in
 *  lib/pce-mock-data.ts for the stored shape). */
export interface SaveWizardDraftInput {
  surveyType: SurveyType
  termId: string
  academicYear: string
  /** Step-wide Auto Update flag — duplicated onto every row in the batch. */
  autoUpdateOn: boolean
  /** Step 3 window/release values (YYYY-MM-DD), duplicated onto every row. */
  openDate?: string
  closeDate?: string
  releaseDate?: string
  offerings: WizardDraftOffering[]
}

export interface PushWizardConfig {
  surveyType: SurveyType
  termId: string
  academicYear: string
  programId: string
  courseOfferingIds: string[]
  templateAssignments: Record<string, string>  // offeringId → templateId
  /** Instance-level plan from the Survey design step (duplicates already
   *  excluded there). When present, one survey is created PER INSTANCE —
   *  split flows — instead of one combined flow per offering. */
  instances?: PushInstance[]
  openDate: string   // YYYY-MM-DD
  closeDate: string  // YYYY-MM-DD
  emailSubject: string
  emailBody: string
  reminderEnabled: boolean
  reminderDaysBefore: number
  reportAccess: Record<string, string[]>
}

interface PceState {
  user: PceUser
  surveys: PceSurvey[]
  templates: PceTemplate[]
  /** Program terms — seeded from the active demo account, grows when term setup finishes. */
  programTerms: ProgramTerm[]
  addProgramTerm: (term: ProgramTerm) => void
  /** Demo account (each is a distinct dashboard term-card scenario). */
  accountId: string
  accounts: DemoAccount[]
  switchAccount: (id: string) => void
  hiddenComments: Record<string, number[]>
  toggleRole: () => void
  releaseSurvey: (id: string) => void
  closeSurvey: (id: string) => void
  /** ST-16 (minimal stub) — cancels a Draft/Scheduled survey before it goes
   *  live. Cancelled surveys are excluded from roleOverlapConflicts() and
   *  draftOrScheduledMatch() (lib/pce-push-validation.ts) — no longer "on
   *  record." The dedicated ST-16 surface (confirmation copy, a row action in
   *  surveys-table.tsx) is out of scope here; this only exists so the ST-02
   *  hard-block message has a real resolution path to point to. */
  cancelSurvey: (id: string) => void
  /** ST-09 (minimal stub) — marks a survey archived. Per the gap-analysis doc
   *  §5, ST-02 lists Archived surveys as STILL blocking role-overlap, so this
   *  action does NOT exempt the survey from future conflict checks — confirm
   *  the intended resolution mechanic with Product (see the ⚠️ comment in
   *  lib/pce-push-validation.ts) before wiring this into Step 2's block UI. */
  archiveSurvey: (id: string) => void
  createSurvey: (survey: Omit<PceSurvey, 'id' | 'createdAt' | 'responseRate' | 'responseCount'>) => void
  deleteTemplate: (id: string) => void
  createTemplate: (tmpl: Omit<PceTemplate, 'id' | 'lastModified' | 'usedBySurveyCount'>) => string
  updateTemplate: (id: string, update: Partial<PceTemplate>) => void
  addQuestion: (templateId: string, section: TemplateSection, text: string, answerType: 'likert' | 'free_text') => void
  updateQuestion: (templateId: string, section: TemplateSection, questionId: string, patch: Pick<TemplateQuestion, 'text' | 'answerType'>) => void
  deleteQuestion: (templateId: string, section: TemplateSection, questionId: string) => void
  reorderQuestions: (templateId: string, section: TemplateSection, fromIndex: number, toIndex: number) => void
  addGuestInstructor: (surveyId: string, instructor: { id: string; name: string; initials: string }) => void
  removeInstructor: (surveyId: string, instructorId: string) => void
  toggleHideComment: (surveyId: string, commentIndex: number) => void
  // Template section actions
  addTemplateSection: (templateId: string, section: Omit<PceTemplateSection, 'id' | 'order'>, id?: string) => void
  removeTemplateSection: (templateId: string, sectionId: string) => void
  updateTemplateSection: (templateId: string, sectionId: string, patch: Partial<Pick<PceTemplateSection, 'title' | 'subjectKey' | 'description' | 'roleSetId'>>) => void
  reorderTemplateSections: (templateId: string, fromIndex: number, toIndex: number) => void
  // Faculty role sets — roles declared outside the section
  addFacultyRoleSet: (templateId: string, id?: string) => void
  removeFacultyRoleSet: (templateId: string, roleSetId: string) => void
  updateFacultyRoleSetRoles: (templateId: string, roleSetId: string, roles: string[]) => void
  // Section question actions (for dynamic sections)
  addSectionQuestion: (templateId: string, sectionId: string, text: string, answerType: TemplateQuestion['answerType'], choices?: string[], id?: string) => void
  updateSectionQuestion: (templateId: string, sectionId: string, questionId: string, patch: Partial<Pick<TemplateQuestion, 'text' | 'answerType' | 'choices'>>) => void
  deleteSectionQuestion: (templateId: string, sectionId: string, questionId: string) => void
  reorderSectionQuestions: (templateId: string, sectionId: string, from: number, to: number) => void
  // Setup defaults (pre-fill values for term activation wizard)
  setupDefaults: SetupDefaults
  saveSetupDefaults: (d: SetupDefaults) => void
  // Wizard actions
  pushSurveyBatch: (config: PushWizardConfig) => void
  /** ST-02 Phase 3 — upserts one `status: 'draft'` PceSurvey per offering
   *  (creates on first save, updates in place when existingSurveyId is set).
   *  A SCHEDULED survey pulled in for editing keeps its scheduled status —
   *  Save as Draft records the working state without demoting a survey that
   *  is already on the calendar. */
  saveDraft: (input: SaveWizardDraftInput) => void
  // Moderation action
  enableResults: (surveyId: string) => void
  // Survey intervention actions (single or bulk — pass one id or many)
  sendSurveyReminder: (surveyIds: string[]) => void
  extendSurveyDeadline: (surveyIds: string[], newCloseDate: string) => void
}

const PceContext = createContext<PceState | null>(null)

export function PceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PceUser>(MOCK_CURRENT_USER)
  const [surveys, setSurveys] = useState<PceSurvey[]>(MOCK_SURVEYS)
  const [templates, setTemplates] = useState<PceTemplate[]>(MOCK_TEMPLATES)
  const [programTerms, setProgramTerms] = useState<ProgramTerm[]>(MOCK_PROGRAM_TERMS)
  const addProgramTerm = useCallback((term: ProgramTerm) => {
    setProgramTerms(ts =>
      ts.some(t => t.id === term.id || t.name === term.name) ? ts : [...ts, term],
    )
  }, [])

  // ── Demo account (dashboard term-card scenarios) ──────────────────────────
  // SSR + first client render use the default account (so the module-level
  // register and the seeded state agree, no hydration mismatch); a persisted
  // choice is applied post-mount below.
  const [accountId, setAccountId] = useState<string>(DEFAULT_ACCOUNT_ID)
  const ACCOUNT_STORAGE_KEY = 'pce.demoAccount'

  const switchAccount = useCallback((id: string) => {
    const acc = accountById(id)
    setActiveAccountId(acc.id)      // module register — feeds the term helpers
    setAccountId(acc.id)
    setSurveys(acc.surveys)
    setTemplates(acc.templates ?? MOCK_TEMPLATES)
    setProgramTerms(acc.terms)
    setHiddenComments({})
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(ACCOUNT_STORAGE_KEY, acc.id) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    let stored: string | null = null
    try { stored = window.localStorage.getItem(ACCOUNT_STORAGE_KEY) } catch { /* ignore */ }
    if (stored && stored !== DEFAULT_ACCOUNT_ID && DEMO_ACCOUNTS.some(a => a.id === stored)) {
      switchAccount(stored)
    }
  }, [switchAccount])
  const [hiddenComments, setHiddenComments] = useState<Record<string, number[]>>({})
  const [setupDefaults, setSetupDefaults] = useState<SetupDefaults>(INITIAL_SETUP_DEFAULTS)
  const saveSetupDefaults = useCallback((d: SetupDefaults) => setSetupDefaults(d), [])
  // ── Role toggle — persisted like the demo account (SSR + first client
  //    render stay on the default admin role so hydration matches; the stored
  //    choice applies post-mount). Without this, any full page load silently
  //    dropped the user back to Admin view. ──
  const ROLE_STORAGE_KEY = 'pce.role'
  const toggleRole = useCallback(() => {
    setUser(u => {
      const role = u.role === 'admin' ? ('faculty' as const) : ('admin' as const)
      if (typeof window !== 'undefined') {
        try { window.localStorage.setItem(ROLE_STORAGE_KEY, role) } catch { /* ignore */ }
      }
      return { ...u, role }
    })
  }, [])
  useEffect(() => {
    let stored: string | null = null
    try { stored = window.localStorage.getItem(ROLE_STORAGE_KEY) } catch { /* ignore */ }
    if (stored === 'faculty' || stored === 'admin') {
      setUser(u => (u.role === stored ? u : { ...u, role: stored }))
    }
  }, [])

  const releaseSurvey = useCallback((id: string) => {
    setSurveys(ss => ss.map(s =>
      s.id === id
        ? { ...s, status: 'released' as SurveyStatus, releasedAt: 'Apr 22, 2026' }
        : s
    ))
  }, [])

  const closeSurvey = useCallback((id: string) => {
    setSurveys(ss => ss.map(s =>
      s.id === id
        ? { ...s, status: 'closed' as SurveyStatus, closedAt: 'Apr 22, 2026' }
        : s
    ))
  }, [])

  const cancelSurvey = useCallback((id: string) => {
    setSurveys(ss => ss.map(s =>
      s.id === id ? { ...s, cancelledAt: 'Apr 22, 2026' } : s
    ))
  }, [])

  const archiveSurvey = useCallback((id: string) => {
    setSurveys(ss => ss.map(s =>
      s.id === id ? { ...s, status: 'archived' as SurveyStatus, archivedAt: 'Apr 22, 2026' } : s
    ))
  }, [])

  const createSurvey = useCallback((
    survey: Omit<PceSurvey, 'id' | 'createdAt' | 'responseRate' | 'responseCount'>
  ) => {
    setSurveys(ss => [
      ...ss,
      { ...survey, id: `s${Date.now()}`, createdAt: 'Apr 22, 2026', responseRate: 0, responseCount: 0 },
    ])
  }, [])

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(ts => ts.filter(t => t.id !== id))
  }, [])

  const createTemplate = useCallback((
    tmpl: Omit<PceTemplate, 'id' | 'lastModified' | 'usedBySurveyCount'>
  ): string => {
    const id = `t${Date.now()}`
    setTemplates(ts => [
      ...ts,
      {
        ...tmpl,
        id,
        lastModified: 'May 26, 2026',
        usedBySurveyCount: 0,
        questions: tmpl.questions ?? { course_content: [], faculty_performance: [], course_director: [] },
        likertPointer: tmpl.likertPointer ?? 5,
      },
    ])
    return id
  }, [])

  const updateTemplate = useCallback((id: string, update: Partial<PceTemplate>) => {
    setTemplates(ts => ts.map(t => t.id === id ? { ...t, ...update } : t))
  }, [])

  const addQuestion = useCallback((
    templateId: string,
    section: TemplateSection,
    text: string,
    answerType: 'likert' | 'free_text'
  ) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sectionQs = t.questions[section]
      const newQ: TemplateQuestion = {
        id: `q${Date.now()}`,
        text,
        answerType,
        order: sectionQs.length,
      }
      const updated = {
        ...t,
        questions: { ...t.questions, [section]: [...sectionQs, newQ] },
      }
      updated.questionCount = Object.values(updated.questions).flat().length
      return updated
    }))
  }, [])

  const updateQuestion = useCallback((
    templateId: string,
    section: TemplateSection,
    questionId: string,
    patch: Pick<TemplateQuestion, 'text' | 'answerType'>
  ) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      return {
        ...t,
        questions: {
          ...t.questions,
          [section]: t.questions[section].map(q =>
            q.id === questionId ? { ...q, ...patch } : q
          ),
        },
      }
    }))
  }, [])

  const deleteQuestion = useCallback((
    templateId: string,
    section: TemplateSection,
    questionId: string
  ) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const filtered = t.questions[section].filter(q => q.id !== questionId)
      const updated = {
        ...t,
        questions: { ...t.questions, [section]: filtered.map((q, i) => ({ ...q, order: i })) },
      }
      updated.questionCount = Object.values(updated.questions).flat().length
      return updated
    }))
  }, [])

  const reorderQuestions = useCallback((
    templateId: string,
    section: TemplateSection,
    fromIndex: number,
    toIndex: number
  ) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const qs = [...t.questions[section]]
      const [moved] = qs.splice(fromIndex, 1)
      qs.splice(toIndex, 0, moved)
      return {
        ...t,
        questions: {
          ...t.questions,
          [section]: qs.map((q, i) => ({ ...q, order: i })),
        },
      }
    }))
  }, [])

  const addGuestInstructor = useCallback((
    surveyId: string,
    instructor: { id: string; name: string; initials: string }
  ) => {
    setSurveys(ss => ss.map(s =>
      s.id === surveyId
        ? { ...s, instructors: [...s.instructors, { ...instructor, role: 'guest' as const }] }
        : s
    ))
  }, [])

  const removeInstructor = useCallback((surveyId: string, instructorId: string) => {
    setSurveys(ss => ss.map(s =>
      s.id === surveyId
        ? { ...s, instructors: s.instructors.filter(i => i.id !== instructorId) }
        : s
    ))
  }, [])

  const toggleHideComment = useCallback((surveyId: string, commentIndex: number) => {
    setHiddenComments(prev => {
      const current = prev[surveyId] ?? []
      const isHidden = current.includes(commentIndex)
      return {
        ...prev,
        [surveyId]: isHidden
          ? current.filter(i => i !== commentIndex)
          : [...current, commentIndex],
      }
    })
  }, [])

  // ── Template section actions ──────────────────────────────────────────────

  const addTemplateSection = useCallback((
    templateId: string,
    section: Omit<PceTemplateSection, 'id' | 'order'>,
    id?: string
  ) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sections = t.templateSections ?? []
      const newSection: PceTemplateSection = {
        ...section,
        id: id ?? `sec-${Date.now()}`,
        order: sections.length,
      }
      return { ...t, templateSections: [...sections, newSection], lastModified: 'May 21, 2026' }
    }))
  }, [])

  const removeTemplateSection = useCallback((templateId: string, sectionId: string) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sections = (t.templateSections ?? []).filter(s => s.id !== sectionId)
      return { ...t, templateSections: sections, lastModified: 'May 21, 2026' }
    }))
  }, [])

  const updateTemplateSection = useCallback((
    templateId: string,
    sectionId: string,
    patch: Partial<Pick<PceTemplateSection, 'title' | 'subjectKey' | 'description' | 'roleSetId'>>
  ) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sections = (t.templateSections ?? []).map(s =>
        s.id === sectionId ? { ...s, ...patch } : s
      )
      return { ...t, templateSections: sections, lastModified: 'May 21, 2026' }
    }))
  }, [])

  // ── Faculty role sets — roles declared outside the section ─────────────────
  const addFacultyRoleSet = useCallback((templateId: string, id?: string) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sets = t.facultyRoleSets ?? []
      const newSet = { id: id ?? `rs-${Date.now()}`, roles: [] as string[] }
      return { ...t, facultyRoleSets: [...sets, newSet], lastModified: 'May 21, 2026' }
    }))
  }, [])

  const removeFacultyRoleSet = useCallback((templateId: string, roleSetId: string) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sets = (t.facultyRoleSets ?? []).filter(rs => rs.id !== roleSetId)
      // Drop the sections that belonged to this set (its questions go with it).
      const sections = (t.templateSections ?? []).filter(s => s.roleSetId !== roleSetId)
      return { ...t, facultyRoleSets: sets, templateSections: sections, lastModified: 'May 21, 2026' }
    }))
  }, [])

  const updateFacultyRoleSetRoles = useCallback((templateId: string, roleSetId: string, roles: string[]) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sets = (t.facultyRoleSets ?? []).map(rs => rs.id === roleSetId ? { ...rs, roles } : rs)
      return { ...t, facultyRoleSets: sets, lastModified: 'May 21, 2026' }
    }))
  }, [])

  const reorderTemplateSections = useCallback((templateId: string, fromIndex: number, toIndex: number) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sections = [...(t.templateSections ?? [])]
      const [moved] = sections.splice(fromIndex, 1)
      sections.splice(toIndex, 0, moved)
      return {
        ...t,
        templateSections: sections.map((s, i) => ({ ...s, order: i })),
        lastModified: 'May 21, 2026',
      }
    }))
  }, [])

  // ── Section question actions ──────────────────────────────────────────────

  const addSectionQuestion = useCallback((
    templateId: string,
    sectionId: string,
    text: string,
    answerType: TemplateQuestion['answerType'],
    choices?: string[],
    id?: string
  ) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sections = (t.templateSections ?? []).map(s => {
        if (s.id !== sectionId) return s
        const newQ: TemplateQuestion = {
          id: id ?? `q-${Date.now()}`,
          text,
          answerType,
          choices,
          order: s.questions.length,
        }
        return { ...s, questions: [...s.questions, newQ] }
      })
      return { ...t, templateSections: sections, lastModified: 'May 21, 2026' }
    }))
  }, [])

  const updateSectionQuestion = useCallback((
    templateId: string,
    sectionId: string,
    questionId: string,
    patch: Partial<Pick<TemplateQuestion, 'text' | 'answerType' | 'choices'>>
  ) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sections = (t.templateSections ?? []).map(s => {
        if (s.id !== sectionId) return s
        return {
          ...s,
          questions: s.questions.map(q => q.id === questionId ? { ...q, ...patch } : q),
        }
      })
      return { ...t, templateSections: sections, lastModified: 'May 21, 2026' }
    }))
  }, [])

  const deleteSectionQuestion = useCallback((
    templateId: string,
    sectionId: string,
    questionId: string
  ) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sections = (t.templateSections ?? []).map(s => {
        if (s.id !== sectionId) return s
        return { ...s, questions: s.questions.filter(q => q.id !== questionId) }
      })
      return { ...t, templateSections: sections, lastModified: 'May 21, 2026' }
    }))
  }, [])

  const reorderSectionQuestions = useCallback((
    templateId: string,
    sectionId: string,
    from: number,
    to: number
  ) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sections = (t.templateSections ?? []).map(s => {
        if (s.id !== sectionId) return s
        const qs = [...s.questions]
        const [moved] = qs.splice(from, 1)
        qs.splice(to, 0, moved)
        return { ...s, questions: qs.map((q, i) => ({ ...q, order: i })) }
      })
      return { ...t, templateSections: sections }
    }))
  }, [])

  // ── Wizard actions ────────────────────────────────────────────────────────

  // ST-02 Phase 3 — Save as Draft. Upserts one `status: 'draft'` PceSurvey per
  // offering: creates on first save, updates in place on subsequent saves (the
  // page passes existingSurveyId from draftOrScheduledMatch). The wizard's
  // working state rides the row's `wizardDraft` field; the resume hydration in
  // app/(app)/surveys/push/page.tsx reads it back.
  const saveDraft = useCallback((input: SaveWizardDraftInput) => {
    const today = new Date().toISOString().split('T')[0]
    const term = MOCK_PROGRAM_TERMS.find(t => t.id === input.termId)
    const stamp = Date.now()
    setSurveys(ss => {
      const next = [...ss]
      for (const entry of input.offerings) {
        const wizardDraft: PceSurveyWizardDraft = {
          unitSelections: entry.unitSelections,
          autoUpdateOn: input.autoUpdateOn,
          templateCriteriaSnapshot: entry.templateCriteriaSnapshot,
          openDate: input.openDate,
          closeDate: input.closeDate,
          releaseDate: input.releaseDate,
          savedAt: today,
        }
        const idx = entry.existingSurveyId
          ? next.findIndex(s => s.id === entry.existingSurveyId)
          : -1
        if (idx >= 0) {
          // Update in place. Status is deliberately NOT touched: a Draft stays
          // a Draft, and a Scheduled survey pulled in for editing stays
          // Scheduled (see the PceState doc comment).
          const s = next[idx]
          next[idx] = {
            ...s,
            templateId: entry.templateId || s.templateId,
            openDate: input.openDate ?? s.openDate,
            deadline: input.closeDate ?? s.deadline,
            wizardDraft,
          }
        } else {
          const offering = MOCK_COURSE_OFFERINGS.find(o => o.id === entry.offeringId)
          const masterCourse = offering
            ? MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
            : null
          next.push({
            id: `d${stamp}-${entry.offeringId}`,
            offeringId: entry.offeringId,
            courseCode: masterCourse?.code ?? entry.offeringId,
            courseName: masterCourse?.name ?? '',
            term: term?.name ?? input.academicYear,
            cohort: offering?.cohort,
            surveyType: input.surveyType,
            academicYear: input.academicYear,
            templateId: entry.templateId,
            status: 'draft',
            instructors: [],
            openDate: input.openDate,
            responseRate: 0,
            responseCount: 0,
            enrollmentCount: offering?.enrolledCount ?? 0,
            deadline: input.closeDate ?? '',
            createdAt: today,
            wizardDraft,
          })
        }
      }
      return next
    })
  }, [])

  const pushSurveyBatch = useCallback((config: PushWizardConfig) => {
    const { courseOfferingIds, templateAssignments, openDate, closeDate, surveyType, termId, academicYear, programId } = config
    const today = new Date().toISOString().split('T')[0]
    const status: SurveyStatus = openDate > today ? 'scheduled' : 'collecting'

    const term = MOCK_PROGRAM_TERMS.find(t => t.id === termId)

    // Instance-level plan (Survey design step): one survey PER INSTANCE —
    // split flows with evalScope + evalRole stamped so later pushes can match
    // the full offering+role+person duplicate key. Duplicates were already
    // excluded upstream; whatever arrives here gets created.
    //
    // ST-02 Phase 3 — an offering that already has a Draft or Scheduled survey
    // on record (draftOrScheduledMatch) was pulled into the wizard for EDITING:
    // final submit updates that record in place — one combined survey covering
    // the pushed instances — never appends a second one. Offerings with no
    // such match keep the create-per-instance path below exactly as before.
    if (config.instances?.length) {
      const stamp = Date.now()
      setSurveys(ss => {
        const byOffering = new Map<string, typeof config.instances>()
        for (const inst of config.instances!) {
          byOffering.set(inst.offeringId, [...(byOffering.get(inst.offeringId) ?? []), inst])
        }
        let next = [...ss]
        let seq = 0
        for (const [offeringId, group] of byOffering) {
          const offering = MOCK_COURSE_OFFERINGS.find(o => o.id === offeringId)
          const masterCourse = offering ? MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId) : null
          const existing = offering ? draftOrScheduledMatch(offering, next) : null
          if (existing && group) {
            // Update-in-place: the Draft/Scheduled record BECOMES the pushed
            // survey. Combined flow (evalScope per what the instances cover);
            // wizardDraft is cleared — the working state is now real.
            const hasCourse = group.some(g => g.scope === 'course')
            const hasFaculty = group.some(g => g.scope === 'instructor')
            const roles = [...new Set(group.filter(g => g.scope === 'instructor' && g.role).map(g => g.role!))]
            const persons = [...new Set(group.filter(g => g.scope === 'instructor' && g.personName).map(g => g.personName!))]
              .map(name => MOCK_FACULTY.find(f => f.name === name))
              .filter((f): f is NonNullable<typeof f> => !!f)
            const evaluations = [
              ...(hasCourse ? [{
                type: 'course_material' as const, status,
                responseRate: 0, responseCount: 0,
                enrollmentCount: offering?.enrolledCount ?? 0, deadline: closeDate,
              }] : []),
              ...(hasFaculty ? [{
                type: 'faculty_roles' as const, status,
                responseRate: 0, responseCount: 0,
                enrollmentCount: offering?.enrolledCount ?? 0, deadline: closeDate,
              }] : []),
            ]
            next = next.map(s => s.id !== existing.id ? s : {
              ...s,
              status,
              surveyType,
              openDate,
              academicYear,
              programId,
              term: term?.name ?? academicYear,
              templateId: templateAssignments[offeringId] ?? s.templateId,
              evalScope: hasCourse && !hasFaculty ? ('course' as const)
                : hasFaculty && !hasCourse ? ('instructor' as const)
                : undefined,
              evalRole: hasFaculty && !hasCourse && roles.length === 1 ? roles[0] : undefined,
              instructors: persons.map(p => ({ id: p.id, name: p.name, initials: p.initials, role: 'primary' as const })),
              evaluations,
              responseRate: 0,
              responseCount: 0,
              enrollmentCount: offering?.enrolledCount ?? s.enrollmentCount,
              deadline: closeDate,
              wizardDraft: undefined,
            })
            continue
          }
          for (const inst of group ?? []) {
            const person = inst.personName ? MOCK_FACULTY.find(f => f.name === inst.personName) : null
            next.push({
              id: `s${stamp}-${inst.offeringId}-${seq++}`,
              offeringId: inst.offeringId,
              evalScope: inst.scope,
              evalRole: inst.role,
              courseCode: masterCourse?.code ?? inst.offeringId,
              courseName: masterCourse?.name ?? '',
              term: term?.name ?? academicYear,
              cohort: offering?.cohort,
              surveyType,
              openDate,
              academicYear,
              programId,
              templateId: templateAssignments[inst.offeringId] ?? '',
              status,
              // Course-scope flows carry NO instructors (seed pf3 convention —
              // a person listed on a course-scope flow ghosts into faculty
              // analytics); instructor-scope flows carry exactly the evaluatee.
              instructors: inst.scope === 'instructor' && person
                ? [{ id: person.id, name: person.name, initials: person.initials, role: 'primary' as const }]
                : [],
              // A split flow IS a single evaluation type — without this override
              // evaluationsFor() derives BOTH types from the roll-up and
              // resurrects the half this flow deliberately excludes.
              evaluations: [{
                type: inst.scope === 'course' ? 'course_material' as const : 'faculty_roles' as const,
                status,
                responseRate: 0,
                responseCount: 0,
                enrollmentCount: offering?.enrolledCount ?? 0,
                deadline: closeDate,
              }],
              responseRate: 0,
              responseCount: 0,
              enrollmentCount: offering?.enrolledCount ?? 0,
              deadline: closeDate,
              createdAt: today,
            })
          }
        }
        return next
      })
      return
    }

    setSurveys(ss => {
      const newSurveys: PceSurvey[] = courseOfferingIds.map(offeringId => {
        const offering = MOCK_COURSE_OFFERINGS.find(o => o.id === offeringId)
        const masterCourse = offering ? MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId) : null
        const faculty = offering ? MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId) : null
        const templateId = templateAssignments[offeringId] ?? ''

        // Scope from what the assigned template evaluates: course-only /
        // faculty-only templates make a single-evaluatee flow; a template that
        // covers both leaves evalScope undefined (a combined flow). offeringId
        // ties every flow to its course so the push wizard's Status column can
        // show what's already out when a LATER flow targets the same course.
        const tmpl = templates.find(t => t.id === templateId)
        const crits = tmpl ? templateCriteria(tmpl) : []
        const hasCourse = crits.some(c => CRITERION_GROUP[c] === 'Course')
        const hasFaculty = crits.some(c => CRITERION_GROUP[c] === 'Faculty')
        const evalScope = hasCourse && !hasFaculty ? ('course' as const)
          : hasFaculty && !hasCourse ? ('instructor' as const)
          : undefined

        return {
          id: `s${Date.now()}-${offeringId}`,
          offeringId,
          evalScope,
          courseCode: masterCourse?.code ?? offeringId,
          courseName: masterCourse?.name ?? '',
          term: term?.name ?? academicYear,
          cohort: offering?.cohort,
          surveyType,
          openDate,
          academicYear,
          programId,
          templateId,
          status,
          instructors: faculty
            ? [{ id: faculty.id, name: faculty.name, initials: faculty.initials, role: 'primary' as const }]
            : [],
          responseRate: 0,
          responseCount: 0,
          enrollmentCount: offering?.enrolledCount ?? 0,
          deadline: closeDate,
          createdAt: today,
        }
      })
      return [...ss, ...newSurveys]
    })
  }, [templates])

  // ── Survey intervention actions ───────────────────────────────────────────

  const sendSurveyReminder = useCallback((surveyIds: string[]) => {
    const today = new Date().toISOString().split('T')[0]
    setSurveys(ss => ss.map(s =>
      surveyIds.includes(s.id) ? { ...s, lastReminderSentAt: today } : s
    ))
  }, [])

  const extendSurveyDeadline = useCallback((surveyIds: string[], newCloseDate: string) => {
    // newCloseDate arrives as YYYY-MM-DD; deadline is stored in display format.
    const [y, m, d] = newCloseDate.split('-').map(Number)
    const display = new Date(y, m - 1, d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
    setSurveys(ss => ss.map(s =>
      surveyIds.includes(s.id)
        ? { ...s, deadline: display, originalDeadline: s.originalDeadline ?? s.deadline }
        : s
    ))
  }, [])

  // ── Moderation action ─────────────────────────────────────────────────────

  const enableResults = useCallback((id: string) => {
    setSurveys(ss => ss.map(s =>
      s.id === id
        ? { ...s, status: 'released' as SurveyStatus, releasedAt: new Date().toISOString().split('T')[0] }
        : s
    ))
  }, [])

  return (
    <PceContext.Provider value={{
      user, surveys, templates, hiddenComments, toggleRole,
      releaseSurvey, closeSurvey, cancelSurvey, archiveSurvey, createSurvey,
      deleteTemplate, createTemplate, updateTemplate,
      addQuestion, updateQuestion, deleteQuestion, reorderQuestions,
      addGuestInstructor, removeInstructor, toggleHideComment,
      addTemplateSection, removeTemplateSection, updateTemplateSection, reorderTemplateSections,
      addFacultyRoleSet, removeFacultyRoleSet, updateFacultyRoleSetRoles,
      addSectionQuestion, updateSectionQuestion, deleteSectionQuestion, reorderSectionQuestions,
      setupDefaults, saveSetupDefaults,
      programTerms, addProgramTerm,
      accountId, accounts: DEMO_ACCOUNTS, switchAccount,
      pushSurveyBatch,
      saveDraft,
      enableResults,
      sendSurveyReminder,
      extendSurveyDeadline,
    }}>
      {children}
    </PceContext.Provider>
  )
}

export function usePce() {
  const ctx = useContext(PceContext)
  if (!ctx) throw new Error('usePce must be used inside PceProvider')
  return ctx
}
