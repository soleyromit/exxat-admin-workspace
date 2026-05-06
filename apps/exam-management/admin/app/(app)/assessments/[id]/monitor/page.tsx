import type { Metadata } from 'next'
import LiveMonitorClient from './live-monitor-client'

export const metadata: Metadata = { title: 'Live monitor — Exam Management' }

export default async function MonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LiveMonitorClient assessmentId={id} />
}
