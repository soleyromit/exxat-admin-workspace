'use client'

/**
 * APP SESSION — single global persona drives every surface.
 *
 * Selecting a persona reshapes the entire admin: nav badge, sidebar identity,
 * /courses scope, QB folder access, trust-level affordances, page titles.
 *
 * For Aarti walkthrough (May 7), session is mocked client-side. When auth lands,
 * this provider gets replaced with a real session reader; consumers don't change.
 *
 * Faculty entry points (Aarti):
 *   - Via Prism faculty module tile  → entry='prism'
 *   - Standalone exam-management login → entry='standalone'
 */

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'
import {
  PERSONAS, DEFAULT_PERSONA, findPersona,
  type Persona, type AccessLevel, type PersonaRole as Role,
} from './personas'

export type { Persona, AccessLevel, Role }
export type EntryPoint = 'prism' | 'standalone'

/** Backwards-compatible faculty user shape, derived from currentPersona when role='faculty'. */
export interface FacultyUser {
  id: string
  name: string
  email: string
  title: string
  initials: string
  department: string
  courses: Persona['courses']
}

interface FacultySession {
  /** Active persona — the one source of truth. */
  currentPersona: Persona
  setCurrentPersona: (p: Persona) => void
  /** All personas selectable in the UI. */
  personas: Persona[]

  /** Derived: persona role. Kept for back-compat with role-based call sites. */
  role: Role
  /** Derived: faculty user when role='faculty'; null when admin. Kept for back-compat. */
  faculty: FacultyUser | null
  /** Derived: courseIds the active persona has any access to. */
  facultyCourseIds: string[]
  /** Access level for a given course; 'editor' for admins (full access). */
  accessFor: (courseId: string) => AccessLevel | null
  /** True when the active persona can edit the given course. */
  canEdit: (courseId: string) => boolean

  entry: EntryPoint
  setEntry: (e: EntryPoint) => void
  hydrated: boolean
}

const Ctx = createContext<FacultySession | null>(null)

const STORAGE_KEY_PERSONA = 'exam-mgmt-persona-id'
const STORAGE_KEY_ENTRY   = 'exam-mgmt-entry'

export function FacultySessionProvider({ children }: { children: ReactNode }) {
  const [currentPersona, setCurrentPersonaState] = useState<Persona>(DEFAULT_PERSONA)
  const [entry, setEntryState] = useState<EntryPoint>('prism')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const personaId = localStorage.getItem(STORAGE_KEY_PERSONA)
      const restored  = findPersona(personaId ?? undefined)
      if (restored) setCurrentPersonaState(restored)
      const e = localStorage.getItem(STORAGE_KEY_ENTRY) as EntryPoint | null
      if (e === 'prism' || e === 'standalone') setEntryState(e)
    } catch {}
    setHydrated(true)
  }, [])

  const setCurrentPersona = (p: Persona) => {
    setCurrentPersonaState(p)
    try { localStorage.setItem(STORAGE_KEY_PERSONA, p.id) } catch {}
  }
  const setEntry = (e: EntryPoint) => {
    setEntryState(e)
    try { localStorage.setItem(STORAGE_KEY_ENTRY, e) } catch {}
  }

  const value = useMemo<FacultySession>(() => {
    const role = currentPersona.role
    const faculty: FacultyUser | null =
      role === 'faculty'
        ? {
            id:          currentPersona.id,
            name:        currentPersona.name,
            email:       currentPersona.email,
            title:       currentPersona.title,
            initials:    currentPersona.initials,
            department:  currentPersona.department,
            courses:     currentPersona.courses,
          }
        : null
    const facultyCourseIds = faculty ? faculty.courses.map(c => c.courseId) : []
    const accessFor = (courseId: string): AccessLevel | null => {
      if (role === 'admin') return 'editor'
      const ca = currentPersona.courses.find(c => c.courseId === courseId)
      return ca ? ca.level : null
    }
    const canEdit = (courseId: string) => accessFor(courseId) === 'editor'

    return {
      currentPersona,
      setCurrentPersona,
      personas: PERSONAS,
      role,
      faculty,
      facultyCourseIds,
      accessFor,
      canEdit,
      entry,
      setEntry,
      hydrated,
    }
  }, [currentPersona, entry, hydrated])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useFacultySession(): FacultySession {
  const v = useContext(Ctx)
  if (!v) throw new Error('useFacultySession must be used within FacultySessionProvider')
  return v
}
