import type { Metadata } from 'next'
import AssessmentLandingClient from './assessment-landing-client'
import AssessmentStatusClient from '@/components/assessments/assessment-status-client'

export const metadata: Metadata = { title: 'Assessment — Exam Management' }

const DESIGN_IDS = new Set(['a1','a2','a3','a4','a5','a6','a7'])

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (DESIGN_IDS.has(id)) return <AssessmentStatusClient assessmentId={id} />
  return <AssessmentLandingClient assessmentId={id} />
}
