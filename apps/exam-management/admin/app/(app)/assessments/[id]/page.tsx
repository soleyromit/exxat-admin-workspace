import type { Metadata } from 'next'
import AssessmentLandingClient from './assessment-landing-client'

export const metadata: Metadata = { title: 'Assessment — Exam Management' }

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AssessmentLandingClient assessmentId={id} />
}
