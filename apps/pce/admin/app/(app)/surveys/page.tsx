'use client'

import { Suspense } from 'react'
import { SurveysHub } from '@/components/pce/surveys-hub'

export default function SurveysPage() {
  // Suspense: SurveysHub reads ?status= via useSearchParams (dashboard ring deep-links).
  return (
    <Suspense>
      <SurveysHub mode="course_evaluation" />
    </Suspense>
  )
}
