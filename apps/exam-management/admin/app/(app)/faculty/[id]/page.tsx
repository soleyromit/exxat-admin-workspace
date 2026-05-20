import type { Metadata } from 'next'
import FacultyDetailClient from './faculty-detail-client'
export const metadata: Metadata = { title: 'Faculty — Exam Management' }
export default async function FacultyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FacultyDetailClient facultyId={id} />
}
