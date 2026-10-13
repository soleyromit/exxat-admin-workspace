"use client"

import * as React from "react"
import { useRouter, useSelectedLayoutSegment } from "next/navigation"
import { reviewEvaluation } from "@/lib/store"
import { useActions, useDb } from "@/lib/store/react"
import { ReviewView, type DecisionInput } from "./review-view"

/**
 * Connected S-11. Mounted by the review layout so the result banner survives a deep link returning to /review. A link to
 * /review/{submissionId} marks that evaluation's card current; once a decision is saved the URL returns to /review.
 */
export function ReviewClient() {
  const segment = useSelectedLayoutSegment()
  const router = useRouter()
  const db = useDb()
  const { run } = useActions()
  const onDecide = React.useCallback((input: DecisionInput) => run((d, ctx) => reviewEvaluation(d, input, ctx)), [run])
  return <ReviewView db={db} currentSubmissionId={segment} onDecide={onDecide} onSettled={() => segment && router.replace("/review", { scroll: false })} />
}
