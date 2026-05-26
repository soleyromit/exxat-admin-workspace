'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, LocalBanner } from '@exxat/ds/packages/ui/src'
import { useAssessmentDrafts } from '@/lib/assessment-draft-store'
import { mockCourses, mockCourseOfferings } from '@/lib/qb-mock-data'
import type { AssessmentType } from '@/lib/qb-types'

type QuickStart = 'blank' | 'copy' | 'pdf' | 'blueprint'

function getFacultyInitial(fullName: string): string {
  const parts = fullName.trim().split(' ')
  return (parts[parts.length - 1]?.[0] ?? '?').toUpperCase()
}

// Decorative avatar backgrounds — no DS token equivalents for avatar colors.
// oklch(0.57 0.24 342) ≈ var(--brand-color); others are chart-palette hues.
const AVATAR_COLORS = [
  'oklch(0.65 0.18 160)',
  'oklch(0.65 0.18 55)',
  'oklch(0.57 0.24 342)',
  'oklch(0.65 0.18 200)',
  'oklch(0.60 0.20 280)',
]

export default function CreateCanvasClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addDraft } = useAssessmentDrafts()

  const courseId   = searchParams?.get('courseId') ?? ''
  const offeringId = searchParams?.get('offeringId') ?? ''

  const course   = mockCourses.find(c => c.id === courseId)
  const offering = mockCourseOfferings.find(o => o.id === offeringId)

  const [name, setName]                     = useState('')
  const [type, setType]                     = useState<AssessmentType>('Exam')
  const [date, setDate]                     = useState('')
  const [duration, setDuration]             = useState(90)
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([])
  const [prompt, setPrompt]                 = useState('')
  const [nameError, setNameError]           = useState('')

  function handleSubmit(mode: QuickStart = 'blank') {
    if (!name.trim()) {
      setNameError('Assessment name is required.')
      return
    }
    setNameError('')
    const draft = addDraft({
      courseId,
      offeringId: offeringId || (mockCourseOfferings.find(o => o.courseId === courseId)?.id ?? ''),
      title: name.trim(),
      questionCount: 0,
      durationMinutes: duration,
      diffDistribution: { Easy: 0, Medium: 0, Hard: 0 },
      collaboratorIds,
    })
    if (prompt.trim()) {
      try { sessionStorage.setItem(`asmt-creation-prompt-${draft.id}`, prompt.trim()) } catch {}
    }
    const qs = mode !== 'blank' ? `&mode=${mode}` : ''
    router.push(`/assessment-builder?draftId=${draft.id}&courseId=${courseId}${qs}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <CanvasHeader
        course={course}
        offering={offering}
        name={name}
        onNameChange={v => { setName(v); if (nameError) setNameError('') }}
        type={type}
        onTypeChange={setType}
        date={date}
        onDateChange={setDate}
        duration={duration}
        onDurationChange={setDuration}
        collaboratorIds={collaboratorIds}
        onCollaboratorToggle={id => setCollaboratorIds(prev =>
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )}
        onDiscard={() => router.back()}
      />
      {nameError && (
        <div style={{ padding: '8px 16px', flexShrink: 0 }}>
          <LocalBanner variant="error">{nameError}</LocalBanner>
        </div>
      )}
      <CanvasBody
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

// CanvasHeader and CanvasBody will be added in Tasks 5 and 6.
// For now, declare stub types so TypeScript does not error on the JSX references above.

function CanvasHeader(_props: {
  course: ReturnType<typeof mockCourses.find>
  offering: ReturnType<typeof mockCourseOfferings.find>
  name: string
  onNameChange: (v: string) => void
  type: AssessmentType
  onTypeChange: (v: AssessmentType) => void
  date: string
  onDateChange: (v: string) => void
  duration: number
  onDurationChange: (v: number) => void
  collaboratorIds: string[]
  onCollaboratorToggle: (id: string) => void
  onDiscard: () => void
}) {
  return <div style={{ height: 46, borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--card)' }} />
}

function CanvasBody(_props: {
  prompt: string
  onPromptChange: (v: string) => void
  onSubmit: (mode: QuickStart) => void
}) {
  return <div style={{ flex: 1, background: 'var(--brand-tint)' }} />
}
