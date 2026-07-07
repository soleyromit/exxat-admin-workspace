'use client'

import { Suspense } from 'react'
import { NewTemplateFlow } from '@/components/pce/new-template-flow'

export default function NewTemplatePage() {
  return (
    <Suspense>
      <NewTemplateFlow />
    </Suspense>
  )
}
