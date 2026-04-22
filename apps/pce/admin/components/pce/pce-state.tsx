'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { PceUser, PceSurvey, PceTemplate, SurveyStatus } from '@/lib/pce-mock-data'
import { MOCK_CURRENT_USER, MOCK_SURVEYS, MOCK_TEMPLATES } from '@/lib/pce-mock-data'

interface PceState {
  user: PceUser
  surveys: PceSurvey[]
  templates: PceTemplate[]
  toggleRole: () => void
  releaseSurvey: (id: string) => void
  closeSurvey: (id: string) => void
  createSurvey: (survey: Omit<PceSurvey, 'id' | 'createdAt' | 'responseRate' | 'responseCount'>) => void
  deleteTemplate: (id: string) => void
  createTemplate: (tmpl: Omit<PceTemplate, 'id' | 'lastModified' | 'usedBySurveyCount'>) => void
  updateTemplate: (id: string, update: Partial<PceTemplate>) => void
  addGuestInstructor: (surveyId: string, instructor: { id: string; name: string; initials: string }) => void
  removeInstructor: (surveyId: string, instructorId: string) => void
}

const PceContext = createContext<PceState | null>(null)

export function PceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PceUser>(MOCK_CURRENT_USER)
  const [surveys, setSurveys] = useState<PceSurvey[]>(MOCK_SURVEYS)
  const [templates, setTemplates] = useState<PceTemplate[]>(MOCK_TEMPLATES)

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
      { ...tmpl, id: `t${Date.now()}`, lastModified: 'Apr 22, 2026', usedBySurveyCount: 0 },
    ])
  }, [])

  const updateTemplate = useCallback((id: string, update: Partial<PceTemplate>) => {
    setTemplates(ts => ts.map(t => t.id === id ? { ...t, ...update } : t))
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

  return (
    <PceContext.Provider value={{
      user, surveys, templates, toggleRole,
      releaseSurvey, closeSurvey, createSurvey,
      deleteTemplate, createTemplate, updateTemplate,
      addGuestInstructor, removeInstructor,
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
