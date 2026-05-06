import type { Metadata } from 'next'
import AnalyticsClient from './analytics-client'

export const metadata: Metadata = { title: 'Analytics — Exam Management' }

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AnalyticsClient assessmentId={id} />
}
