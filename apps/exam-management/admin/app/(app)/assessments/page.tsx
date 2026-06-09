import type { Metadata } from 'next'
import AssessmentsListClient from '@/components/assessments/assessments-list-client'

export const metadata: Metadata = { title: 'Assessments — Exam Management' }
export const dynamic = 'force-dynamic'

export default function AssessmentsPage() {
  return <AssessmentsListClient />
}
