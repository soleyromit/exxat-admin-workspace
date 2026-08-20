import { Suspense } from "react"
import { useParams } from "react-router-dom"

import { LearningActivitiesCourseDetailClient } from "@/components/learning-activities-course-detail-client"

/** `/<product>/learning-activities/courses/:offeringId` — single course offering detail. */
export default function LearningActivitiesCourseDetailPage() {
  const { offeringId = "" } = useParams<{ offeringId: string }>()

  return (
    <Suspense fallback={null}>
      <LearningActivitiesCourseDetailClient offeringId={offeringId} />
    </Suspense>
  )
}
