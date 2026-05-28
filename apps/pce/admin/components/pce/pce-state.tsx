'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type {
  PceUser,
  PceSurvey,
  PceTemplate,
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
  instructorAccess: boolean
  coordinatorAccess: boolean
}

interface PceState {
  user: PceUser
  surveys: PceSurvey[]
  templates: PceTemplate[]
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
  addTemplateSection: (templateId: string, section: Omit<PceTemplateSection, 'id' | 'order'>) => void
  removeTemplateSection: (templateId: string, sectionId: string) => void
  updateTemplateSection: (templateId: string, sectionId: string, patch: Partial<Pick<PceTemplateSection, 'title' | 'subjectKey' | 'description'>>) => void
  reorderTemplateSections: (templateId: string, fromIndex: number, toIndex: number) => void
  // Section question actions (for dynamic sections)
  addSectionQuestion: (templateId: string, sectionId: string, text: string, answerType: TemplateQuestion['answerType'], choices?: string[], id?: string) => void
  updateSectionQuestion: (templateId: string, sectionId: string, questionId: string, patch: Partial<Pick<TemplateQuestion, 'text' | 'answerType' | 'choices'>>) => void
  deleteSectionQuestion: (templateId: string, sectionId: string, questionId: string) => void
  reorderSectionQuestions: (templateId: string, sectionId: string, from: number, to: number) => void
  // Wizard actions
  pushSurveyBatch: (config: PushWizardConfig) => void
  // Moderation action
  enableResults: (surveyId: string) => void
  // Survey mode toggle
  surveyMode: 'course_evaluation' | 'general'
  setSurveyMode: (mode: 'course_evaluation' | 'general') => void
}

const PceContext = createContext<PceState | null>(null)

export function PceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PceUser>(MOCK_CURRENT_USER)
  const [surveys, setSurveys] = useState<PceSurvey[]>(MOCK_SURVEYS)
  const [templates, setTemplates] = useState<PceTemplate[]>(MOCK_TEMPLATES)
  const [hiddenComments, setHiddenComments] = useState<Record<string, number[]>>({})
  const [surveyMode, setSurveyMode] = useState<'course_evaluation' | 'general'>('course_evaluation')

  const toggleRole = useCallback(() => {
    setUser(u => ({ ...u, role: u.role === 'admin' ? 'faculty' : 'admin' }))
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
    section: Omit<PceTemplateSection, 'id' | 'order'>
  ) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sections = t.templateSections ?? []
      const newSection: PceTemplateSection = {
        ...section,
        id: `sec-${Date.now()}`,
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
    patch: Partial<Pick<PceTemplateSection, 'title' | 'subjectKey' | 'description'>>
  ) => {
    setTemplates(ts => ts.map(t => {
      if (t.id !== templateId) return t
      const sections = (t.templateSections ?? []).map(s =>
        s.id === sectionId ? { ...s, ...patch } : s
      )
      return { ...t, templateSections: sections, lastModified: 'May 21, 2026' }
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
      addSectionQuestion, updateSectionQuestion, deleteSectionQuestion, reorderSectionQuestions,
      pushSurveyBatch,
      enableResults,
      surveyMode, setSurveyMode,
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
