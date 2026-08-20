'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePce } from '@/components/pce/pce-state'
import type { SurveyType } from '@/lib/pce-mock-data'

/**
 * Creation is chooser-less: entering "new template" immediately creates a
 * blank draft and lands in the builder. Renders nothing while it does so.
 */
export function CreateBlankTemplate({ onCreated }: {
  /** Called with the new template id instead of navigating to the builder route. */
  onCreated?: (id: string) => void
}) {
  const { createTemplate, user } = usePce()
  const router = useRouter()
  const params = useSearchParams()
  const isGeneral = params?.get('mode') === 'programmatic'
  const created = useRef(false)

  useEffect(() => {
    if (created.current) return
    created.current = true
    const surveyType: SurveyType = isGeneral ? 'programmatic' : 'course_evaluation'
    const id = createTemplate({
      name: 'Untitled template',
      sections: ['course_content'],
      status: 'draft',
      questionCount: 0,
      createdBy: user.name,
      surveyType,
      courseType: 'any',
      questions: { course_content: [], faculty_performance: [], course_director: [] },
      likertPointer: 5,
      templateSections: [],
    })
    if (onCreated) onCreated(id)
    else router.replace(isGeneral ? `/templates/programmatic/${id}` : `/templates/${id}`)
  }, [createTemplate, isGeneral, onCreated, router, user.name])

  return null
}
