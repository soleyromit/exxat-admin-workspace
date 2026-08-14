import { Suspense } from "react"

import { LearningActivitiesClient } from "@/components/learning-activities-client"

/** `/<product>/learning-activities` — course offerings hub with secondary panel. */
export default function LearningActivitiesPage() {
  return (
    <Suspense fallback={null}>
      <LearningActivitiesClient />
    </Suspense>
  )
}
