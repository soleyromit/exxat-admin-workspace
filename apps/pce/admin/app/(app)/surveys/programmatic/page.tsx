'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { SurveysHub } from '@/components/pce/surveys-hub'

export default function ProgrammaticSurveysPage() {
  // Suspense: SurveysHub reads ?status= via useSearchParams.
  return (
    <Suspense>
      <SurveysHub mode="general" />
    </Suspense>
  )
}
