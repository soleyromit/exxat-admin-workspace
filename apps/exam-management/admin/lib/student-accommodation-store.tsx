'use client'

/**
 * STUDENT ACCOMMODATION STORE — session-scoped + localStorage persisted.
 *
 * Holds accommodations created via the "Add accommodation" modal. Merged
 * with the seed `facultyAccommodations` mock data on read so the roster
 * page reflects new entries immediately.
 *
 * Persistence model: localStorage (`exxat-student-accommodations`). Hydrates
 * after first render to keep SSR-safe.
 *
 * Per Aarti: in production, accommodations are managed by Student Services.
 * Faculty cannot modify. This store represents the admin (or, in production,
 * Student Services) side of CRUD — Phase 1 demo scope.
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Accommodation } from './faculty-mock-data'

const STORAGE_KEY = 'exxat-student-accommodations'

interface AccommodationStore {
  /** Local-only accommodations (excludes seed data). */
  localAccommodations: Accommodation[]
  /** Persist a new accommodation. Returns the saved record. */
  addAccommodation: (input: Omit<Accommodation, 'id'> & { id?: string }) => Accommodation
  /** Persist many at once (used for "all enrolled courses" scope). */
  addAccommodations: (inputs: Array<Omit<Accommodation, 'id'> & { id?: string }>) => Accommodation[]
  /** Remove a persisted accommodation by id (used by undo). */
  removeAccommodation: (id: string) => void
  /** True once the localStorage hydration pass has run. */
  hydrated: boolean
}

const Ctx = createContext<AccommodationStore | null>(null)

function isAccommodation(v: unknown): v is Accommodation {
  if (!v || typeof v !== 'object') return false
  const a = v as Record<string, unknown>
  return typeof a.id === 'string'
    && typeof a.studentId === 'string'
    && typeof a.courseId === 'string'
    && typeof a.type === 'string'
    && typeof a.detail === 'string'
    && typeof a.approvedBy === 'string'
    && typeof a.approvedDate === 'string'
}

export function StudentAccommodationProvider({ children }: { children: ReactNode }) {
  const [localAccommodations, setLocal] = useState<Accommodation[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setLocal(parsed.filter(isAccommodation))
      }
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(localAccommodations)) }
    catch { /* ignore */ }
  }, [localAccommodations, hydrated])

  const value = useMemo<AccommodationStore>(() => {
    const newId = () => `accom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    return {
      localAccommodations,
      hydrated,
      addAccommodation: (input) => {
        const next: Accommodation = {
          id: input.id ?? newId(),
          studentId: input.studentId,
          courseId: input.courseId,
          type: input.type,
          detail: input.detail,
          approvedBy: input.approvedBy,
          approvedDate: input.approvedDate,
          expiryDate: input.expiryDate,
          notes: input.notes,
        }
        setLocal(prev => [...prev, next])
        return next
      },
      addAccommodations: (inputs) => {
        const created: Accommodation[] = inputs.map(input => ({
          id: input.id ?? newId(),
          studentId: input.studentId,
          courseId: input.courseId,
          type: input.type,
          detail: input.detail,
          approvedBy: input.approvedBy,
          approvedDate: input.approvedDate,
          expiryDate: input.expiryDate,
          notes: input.notes,
        }))
        setLocal(prev => [...prev, ...created])
        return created
      },
      removeAccommodation: (id) => {
        setLocal(prev => prev.filter(a => a.id !== id))
      },
    }
  }, [localAccommodations, hydrated])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStudentAccommodations(): AccommodationStore {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStudentAccommodations must be used within StudentAccommodationProvider')
  return v
}
