'use client'

/**
 * COMMUNICATION POLICY STORE — institution + per-course chat capability.
 *
 * Per Aarti's email + Vishaka: "Post-results chat between students and faculty
 * should be configurable at the institution OR course level."
 *
 * Resolution rule (most-specific wins):
 *   1. If institution.allowChat = false → chat disabled everywhere (master switch)
 *   2. If course override is set → use that
 *   3. Otherwise fall back to institution default
 *
 * Persistence: in-memory + localStorage (so admin toggles survive a refresh
 * during the demo). On real backend, replace this provider with API calls.
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'exam-mgmt-comms-policy'

interface CourseOverride {
  courseId: string
  allowChat: boolean
}

interface CommsPolicyState {
  /** Master institution-wide switch. When false, no course or assessment can enable chat. */
  institutionAllowChat: boolean
  /** Default chat behavior for new courses (used when no per-course override is set). */
  institutionDefault: 'on' | 'off'
  /** Per-course overrides. Key = courseId. */
  courseOverrides: CourseOverride[]
}

const DEFAULT_STATE: CommsPolicyState = {
  institutionAllowChat: true,
  institutionDefault: 'off',
  courseOverrides: [],
}

interface CommsPolicyStore extends CommsPolicyState {
  setInstitutionAllowChat: (v: boolean) => void
  setInstitutionDefault: (v: 'on' | 'off') => void
  setCourseChatOverride: (courseId: string, enabled: boolean | null) => void
  /** Resolved capability for a course (null courseId = institution-only). */
  isChatEnabledForCourse: (courseId: string | null) => boolean
}

const Ctx = createContext<CommsPolicyStore | null>(null)

export function CommunicationPolicyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CommsPolicyState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on first render (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CommsPolicyState
        setState({ ...DEFAULT_STATE, ...parsed })
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Persist on change
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {}
  }, [state, hydrated])

  const value = useMemo<CommsPolicyStore>(() => {
    const setInstitutionAllowChat = (v: boolean) =>
      setState(prev => ({ ...prev, institutionAllowChat: v }))

    const setInstitutionDefault = (v: 'on' | 'off') =>
      setState(prev => ({ ...prev, institutionDefault: v }))

    const setCourseChatOverride = (courseId: string, enabled: boolean | null) =>
      setState(prev => {
        // null clears the override (revert to institution default)
        const without = prev.courseOverrides.filter(o => o.courseId !== courseId)
        return enabled === null
          ? { ...prev, courseOverrides: without }
          : { ...prev, courseOverrides: [...without, { courseId, allowChat: enabled }] }
      })

    const isChatEnabledForCourse = (courseId: string | null) => {
      if (!state.institutionAllowChat) return false
      if (!courseId) return state.institutionDefault === 'on'
      const override = state.courseOverrides.find(o => o.courseId === courseId)
      if (override) return override.allowChat
      return state.institutionDefault === 'on'
    }

    return {
      ...state,
      setInstitutionAllowChat,
      setInstitutionDefault,
      setCourseChatOverride,
      isChatEnabledForCourse,
    }
  }, [state])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCommunicationPolicy(): CommsPolicyStore {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCommunicationPolicy must be used inside CommunicationPolicyProvider')
  return v
}
