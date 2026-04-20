import type { Metadata } from 'next'
import AssessmentBuilderClient from './assessment-builder-client'
export const metadata: Metadata = { title: 'Assessment Builder — Exam Management' }
export default function AssessmentBuilderPage() { return <AssessmentBuilderClient /> }
