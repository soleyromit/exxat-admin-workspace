import type { Metadata } from 'next'
import StudentDetailClient from './student-detail-client'
export const metadata: Metadata = { title: 'Student — Exam Management' }
export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <StudentDetailClient studentId={id} />
}
