'use client'

import { Suspense } from 'react'
import { CreateBlankTemplate } from '@/components/pce/create-blank-template'

export default function NewTemplatePage() {
  return (
    <Suspense>
      <CreateBlankTemplate />
    </Suspense>
  )
}
