import type { Metadata } from 'next'
import AssessmentReviewClient from './assessment-review-client'

export const metadata: Metadata = { title: 'Chair review — Exam Management' }

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AssessmentReviewClient assessmentId={id} />
}
