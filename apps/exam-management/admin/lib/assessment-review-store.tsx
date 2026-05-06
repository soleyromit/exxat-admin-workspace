'use client'

/**
 * ASSESSMENT REVIEW STORE — session-scoped, mutable.
 *
 * Wraps the frozen `assessmentReviews` mock array and lets surfaces transition
 * state in-session (chair Approve → state advances to "approved", and every
 * other surface that reads through this hook reflects the change).
 *
 * Persistence model: in-memory (React state). On page refresh, state resets
 * to the seed mock data. That's deliberate for the demo — a real backend
 * replaces this provider but consumers don't change.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  assessmentReviews as SEED_REVIEWS,
  type AssessmentReview, type AssessmentReviewState,
} from './faculty-mock-data'

interface ReviewStore {
  /** All reviews keyed by assessmentId. */
  reviewByAssessment: Map<string, AssessmentReview>
  /** All reviews as an array (preserves seed order). */
  reviews: AssessmentReview[]
  /** Read one review. */
  getReview: (assessmentId: string) => AssessmentReview | null
  /** Apply a partial patch to one review. State changes also stamp `reviewedAt`. */
  updateReview: (assessmentId: string, patch: Partial<AssessmentReview>) => void
  /** Convenience: state transition with optional notes. */
  transition: (
    assessmentId: string,
    state: AssessmentReviewState,
    opts?: { reviewerName?: string; notes?: string }
  ) => void
}

const Ctx = createContext<ReviewStore | null>(null)

export function AssessmentReviewProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<AssessmentReview[]>(SEED_REVIEWS)

  const value = useMemo<ReviewStore>(() => {
    const reviewByAssessment = new Map(reviews.map(r => [r.assessmentId, r]))

    const updateReview = (assessmentId: string, patch: Partial<AssessmentReview>) => {
      setReviews(prev => prev.map(r =>
        r.assessmentId === assessmentId ? { ...r, ...patch } : r
      ))
    }

    const transition: ReviewStore['transition'] = (assessmentId, state, opts) => {
      const now = new Date().toISOString()
      const patch: Partial<AssessmentReview> = { state }

      // Stamp the right timestamp + reviewer on each transition
      if (state === 'pending-chair') patch.submittedAt = now
      if (state === 'approved' || state === 'changes-requested') {
        patch.reviewedAt = now
        if (opts?.reviewerName) patch.reviewerName = opts.reviewerName
      }
      if (state === 'published') patch.publishedAt = now
      if (opts?.notes !== undefined) patch.reviewNotes = opts.notes

      updateReview(assessmentId, patch)
    }

    return {
      reviews,
      reviewByAssessment,
      getReview: (id) => reviewByAssessment.get(id) ?? null,
      updateReview,
      transition,
    }
  }, [reviews])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAssessmentReviews(): ReviewStore {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAssessmentReviews must be used within AssessmentReviewProvider')
  return v
}
