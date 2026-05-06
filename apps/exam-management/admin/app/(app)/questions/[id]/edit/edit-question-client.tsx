'use client'

/**
 * /questions/[id]/edit — full-page edit of a saved QB question.
 *
 * Loads the QB question, projects its grid metadata back into a `QuestionDraft`
 * for the editor, and lets faculty change type, payload, tagging. On save, the
 * draft is projected back through `toQuestion()` (real backend would PATCH).
 */

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'
import { courseObjectives } from '@/lib/faculty-mock-data'
import { useFacultySession } from '@/lib/faculty-session'
import {
  createDraft, defaultPayload,
  type QuestionDraft, type EditorQType, type SaveDestination,
} from '@/lib/question-editor-types'
import { QuestionEditor } from '@/components/question-editor/question-editor'

const QB_TO_EDITOR_TYPE: Record<string, EditorQType> = {
  'MCQ':        'mcq',
  'Fill blank': 'fill-blank',
  'Hotspot':    'hotspot',
  'Ordering':   'ordering',
  'Matching':   'matching',
}

export function EditQuestionClient({ questionId }: { questionId: string }) {
  const router = useRouter()
  const { currentPersona } = useFacultySession()
  const question = useMemo(
    () => MOCK_QB_QUESTIONS.find(q => q.id === questionId),
    [questionId]
  )

  const objectives = useMemo(() => {
    if (currentPersona.role === 'admin') return courseObjectives
    const editorIds = currentPersona.courses.filter(c => c.level === 'editor').map(c => c.courseId)
    return courseObjectives.filter(o => editorIds.includes(o.courseId))
  }, [currentPersona])

  const [draft, setDraft] = useState<QuestionDraft>(() => {
    if (!question) {
      return createDraft({ authorPersonaId: currentPersona.id })
    }
    const editorType: EditorQType = QB_TO_EDITOR_TYPE[question.type] ?? 'mcq'
    return {
      id:               question.id,
      code:             question.code,
      type:             editorType,
      stem:             question.title,
      explanation:      '',
      difficulty:       question.difficulty,
      blooms:           question.blooms,
      objectiveId:      null,
      folderId:         question.folder,
      tags:             question.tags,
      state:            question.status === 'Saved' ? 'saved' : 'draft',
      confidence:       null,
      payload:          defaultPayload(editorType),
      aiOriginated:     false,
      authorPersonaId:  currentPersona.id,
    }
  })

  function handleSave(d: QuestionDraft, dest: SaveDestination) {
    setDraft({ ...d, state: dest === 'draft' ? 'draft' : 'saved' })
    if (dest === 'draft') return
    router.push(`/questions/${questionId}`)
  }

  function handleCancel() {
    router.push(`/questions/${questionId}`)
  }

  if (!question) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Question not found.</div>
    )
  }

  return (
    <QuestionEditor
      draft={draft}
      onChange={setDraft}
      objectives={objectives}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  )
}
