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

export const DEFAULT_SETUP_EMAIL_SUBJECT =
  'Your course evaluation for {{course_name}} is now open'

export const DEFAULT_SETUP_EMAIL_BODY = `Hi {{student_first_name}},

Your evaluation for {{course_name}} is open until {{close_date}}. Your responses are anonymous — your name will never be attached to your answers.

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

export interface PushWizardConfig {
  surveyType: SurveyType
  termId: string
  academicYear: string
  programId: string
  courseOfferingIds: string[]
  templateAssignments: Record<string, string>  // offeringId → templateId
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

  // ── Wizard action ─────────────────────────────────────────────────────────

  const pushSurveyBatch = useCallback((config: PushWizardConfig) => {
    const { courseOfferingIds, templateAssignments, openDate, closeDate, surveyType, termId, academicYear, programId } = config
    const today = new Date().toISOString().split('T')[0]
    const status: SurveyStatus = openDate > today ? 'scheduled' : 'collecting'

    const term = MOCK_PROGRAM_TERMS.find(t => t.id === termId)

    setSurveys(ss => {
      const newSurveys: PceSurvey[] = courseOfferingIds.map(offeringId => {
        const offering = MOCK_COURSE_OFFERINGS.find(o => o.id === offeringId)
        const masterCourse = offering ? MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId) : null
        const faculty = offering ? MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId) : null
        const templateId = templateAssignments[offeringId] ?? ''

        return {
          id: `s${Date.now()}-${offeringId}`,
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
  }, [])

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
      releaseSurvey, closeSurvey, createSurvey,
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
