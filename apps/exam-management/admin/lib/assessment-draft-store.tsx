'use client'

/**
 * ASSESSMENT DRAFT STORE — session-scoped + localStorage persisted.
 *
 * Wraps the assessments a faculty has saved as drafts (from the assessment
 * builder's Save action). Drafts are session-scoped and persisted to
 * localStorage so a refresh keeps them around — useful for the demo since the
 * builder is the only writer in Phase 1.
 *
 * Persistence model: localStorage (`exxat-assessment-drafts` key). Hydration
 * happens after first render to keep SSR-safe.
 *
 * Consumers (read):
 *   - AssessmentsTab — merges drafts with `mockAssessments` so a freshly
 *     saved draft appears under the course's Drafts section.
 *
 * Consumers (write):
 *   - assessment-builder-client.tsx — `addDraft(...)` on Save.
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Assessment, QDiff } from './qb-types'

const STORAGE_KEY = 'exxat-assessment-drafts'

interface DraftStore {
  /** All drafts in insertion order (newest last). */
  drafts: Assessment[]
  /** Drafts for a specific course/offering. */
  draftsForCourse: (courseId: string, offeringId?: string) => Assessment[]
  /** Persist a new draft. Returns the saved Assessment. */
  addDraft: (input: Omit<Assessment, 'id'> & { id?: string }) => Assessment
  /** Remove a draft by id. */
  removeDraft: (id: string) => void
  /** True once the localStorage hydration pass has run. */
  hydrated: boolean
}

const Ctx = createContext<DraftStore | null>(null)

function isAssessment(value: unknown): value is Assessment {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return typeof v.id === 'string'
    && typeof v.courseId === 'string'
    && typeof v.offeringId === 'string'
    && typeof v.title === 'string'
    && typeof v.questionCount === 'number'
    && typeof v.durationMinutes === 'number'
    && typeof v.diffDistribution === 'object'
    && v.diffDistribution !== null
}

export function AssessmentDraftProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Assessment[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage once.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setDrafts(parsed.filter(isAssessment))
        }
      }
    } catch {
      // ignore — corrupt JSON or quota error
    }
    setHydrated(true)
  }, [])

  // Persist on change.
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
    } catch {
      // ignore — quota error
    }
  }, [drafts, hydrated])

  const value = useMemo<DraftStore>(() => ({
    drafts,
    hydrated,
    draftsForCourse: (courseId, offeringId) =>
      drafts.filter(d =>
        d.courseId === courseId
        && (offeringId === undefined || d.offeringId === offeringId),
      ),
    addDraft: (input) => {
      const id = input.id ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const next: Assessment = {
        id,
        courseId:        input.courseId,
        offeringId:      input.offeringId,
        title:           input.title,
        questionCount:   input.questionCount,
        durationMinutes: input.durationMinutes,
        diffDistribution: input.diffDistribution as Record<QDiff, number>,
        collaboratorIds: input.collaboratorIds,
      }
      setDrafts(prev => [...prev, next])
      return next
    },
    removeDraft: (id) => {
      setDrafts(prev => prev.filter(d => d.id !== id))
    },
  }), [drafts, hydrated])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

const EMPTY_STORE: DraftStore = {
  drafts: [],
  hydrated: false,
  draftsForCourse: () => [],
  addDraft: () => { throw new Error('No provider') },
  removeDraft: () => {},
}

export function useAssessmentDrafts(): DraftStore {
  const v = useContext(Ctx)
  return v ?? EMPTY_STORE
}
