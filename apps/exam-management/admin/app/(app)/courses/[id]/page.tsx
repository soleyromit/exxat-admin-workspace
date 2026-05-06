import type { Metadata } from 'next'
import CourseDetailClient from './course-detail-client'

export const metadata: Metadata = { title: 'Course — Exam Management' }

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CourseDetailClient courseId={id} />
}
