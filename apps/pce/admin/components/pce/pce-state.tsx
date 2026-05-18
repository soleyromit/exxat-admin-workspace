'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { PceUser, PceSurvey, PceTemplate, SurveyStatus, TemplateSection, TemplateQuestion } from '@/lib/pce-mock-data'
import { MOCK_CURRENT_USER, MOCK_SURVEYS, MOCK_TEMPLATES } from '@/lib/pce-mock-data'

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
  createTemplate: (tmpl: Omit<PceTemplate, 'id' | 'lastModified' | 'usedBySurveyCount'>) => void
  updateTemplate: (id: string, update: Partial<PceTemplate>) => void
  addQuestion: (templateId: string, section: TemplateSection, text: string, answerType: 'likert' | 'free_text') => void
  updateQuestion: (templateId: string, section: TemplateSection, questionId: string, patch: Pick<TemplateQuestion, 'text' | 'answerType'>) => void
  deleteQuestion: (templateId: string, section: TemplateSection, questionId: string) => void
  reorderQuestions: (templateId: string, section: TemplateSection, fromIndex: number, toIndex: number) => void
  addGuestInstructor: (surveyId: string, instructor: { id: string; name: string; initials: string }) => void
  removeInstructor: (surveyId: string, instructorId: string) => void
  toggleHideComment: (surveyId: string, commentIndex: number) => void
}

const PceContext = createContext<PceState | null>(null)

export function PceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PceUser>(MOCK_CURRENT_USER)
  const [surveys, setSurveys] = useState<PceSurvey[]>(MOCK_SURVEYS)
  const [templates, setTemplates] = useState<PceTemplate[]>(MOCK_TEMPLATES)
  const [hiddenComments, setHiddenComments] = useState<Record<string, number[]>>({})

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
  ) => {
    setTemplates(ts => [
      ...ts,
      {
        ...tmpl,
        id: `t${Date.now()}`,
        lastModified: 'May 17, 2026',
        usedBySurveyCount: 0,
        questions: tmpl.questions ?? { course_content: [], faculty_performance: [], course_director: [] },
        likertPointer: tmpl.likertPointer ?? 5,
      },
    ])
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

  return (
    <PceContext.Provider value={{
      user, surveys, templates, hiddenComments, toggleRole,
      releaseSurvey, closeSurvey, createSurvey,
      deleteTemplate, createTemplate, updateTemplate,
      addQuestion, updateQuestion, deleteQuestion, reorderQuestions,
      addGuestInstructor, removeInstructor, toggleHideComment,
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
