import { Suspense } from 'react'
import NewAssessmentWizard from './new-assessment-wizard'

export default function CreateAssessmentPage() {
  return (
    <Suspense>
      <NewAssessmentWizard />
    </Suspense>
  )
}
