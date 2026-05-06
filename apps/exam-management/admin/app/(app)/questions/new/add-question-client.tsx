'use client'

/**
 * /questions/new — full-page question authoring.
 *
 * Hosts the unified `QuestionEditor`. Pre-selects the folder when the user
 * arrives from a QB folder (`?folder=…`) and pre-selects the course objective
 * when arriving from the curricular-loop "untested" strip (`?objective=…`).
 *
 * Save destinations:
 *   - draft    → stays in the editor, stamps state='draft'
 *   - bank     → projects the draft to a `Question` row and routes back to QB
 *   - review   → not used here; lives on the assessment review screen
 */

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MOCK_QB_FOLDERS } from '@/lib/qb-mock-data'
import { courseObjectives } from '@/lib/faculty-mock-data'
import { useFacultySession } from '@/lib/faculty-session'
import { createDraft, type QuestionDraft, type SaveDestination } from '@/lib/question-editor-types'
import { QuestionEditor, type SaveDestination as _SD } from '@/components/question-editor/question-editor'

function AddQuestionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentPersona } = useFacultySession()

  const folderId = searchParams.get('folder')
  const objectiveId = searchParams.get('objective')

  const objectives = useMemo(() => {
    // Scope to objectives in the persona's editor courses; admins see all.
    if (currentPersona.role === 'admin') return courseObjectives
    const editorIds = currentPersona.courses.filter(c => c.level === 'editor').map(c => c.courseId)
    return courseObjectives.filter(o => editorIds.includes(o.courseId))
  }, [currentPersona])

  const [draft, setDraft] = useState<QuestionDraft>(() =>
    createDraft({
      authorPersonaId: currentPersona.id,
      folderId,
      objectiveId,
    })
  )

  function handleSave(d: QuestionDraft, dest: SaveDestination) {
    // Project to a saved state; in a real backend we'd POST to /api/questions.
    // For the demo, we just route back with a confirmation toast — state lives
    // in the user's session via the assessment review store / QB mock data.
    setDraft({ ...d, state: dest === 'draft' ? 'draft' : 'saved' })
    if (dest === 'draft') return
    const dest_url = folderId ? `/question-bank?folder=${folderId}` : '/question-bank'
    router.push(dest_url)
  }

  function handleCancel() {
    router.push(folderId ? `/question-bank?folder=${folderId}` : '/question-bank')
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

export function AddQuestionClient() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading editor…</div>}>
      <AddQuestionForm />
    </Suspense>
  )
}

// Re-export the type so the page route doesn't need to know about question-editor-types.
export type { _SD as SaveDestination }
// Reference MOCK_QB_FOLDERS so it's importable for future folder selection UX
// without adding a separate import path; not used yet.
void MOCK_QB_FOLDERS
