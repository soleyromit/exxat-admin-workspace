import { notFound } from 'next/navigation'
import { allCourseOfferings } from '@/lib/course-mock-data'
import CourseOfferingDetailClient from './course-offering-detail-client'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const offering = allCourseOfferings.find(o => o.id === id)
  if (!offering) notFound()
  return <CourseOfferingDetailClient offering={offering} />
}
