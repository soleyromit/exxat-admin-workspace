import type { Metadata } from 'next'
import { AssessmentCreationApp } from '@/components/assessment-creation/assessment-creation-app'
export const metadata: Metadata = { title: 'Assessment Builder — Exam Management' }
export const dynamic = 'force-dynamic'
export default function AssessmentBuilderPage() { return <AssessmentCreationApp /> }
