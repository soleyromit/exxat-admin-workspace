'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Field, FieldLabel, FieldError,
  Input,
  Badge,
} from '@exxatdesignux/ui'
import { useAssessmentDrafts } from '@/lib/assessment-draft-store'
import { mockCourses, mockCourseOfferings } from '@/lib/qb-mock-data'
import type { AssessmentType } from '@/lib/qb-types'

interface CreateAssessmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  offeringId?: string
}

export function CreateAssessmentModal({
  open, onOpenChange, courseId, offeringId,
}: CreateAssessmentModalProps) {
  const router = useRouter()
  const { addDraft } = useAssessmentDrafts()

  const course = mockCourses.find(c => c.id === courseId)
  const offerings = mockCourseOfferings.filter(o => o.courseId === courseId)
  const resolvedOfferingId = offeringId ?? offerings[0]?.id ?? ''

  const [type, setType] = useState<AssessmentType>('Exam')
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setType('Exam')
    setName('')
    setNameError('')
    setSubmitting(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleCreate = () => {
    if (!name.trim()) {
      setNameError('Name is required.')
      return
    }
    if (!course || !resolvedOfferingId) return
    setSubmitting(true)

    const draft = addDraft({
      courseId,
      offeringId: resolvedOfferingId,
      title: name.trim(),
      questionCount: 0,
      durationMinutes: type === 'Exam' ? 90 : 30,
      diffDistribution: { Easy: 0, Medium: 0, Hard: 0 },
    })

    reset()
    onOpenChange(false)
    router.push(`/assessment-builder?draftId=${draft.id}&courseId=${courseId}`)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
          <DialogTitle className="text-base">New assessment</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose a type, then name it — you configure everything else in the builder.
          </p>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* ── Type cards ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <TypeCard
              icon="fa-clipboard-check"
              label="Exam"
              description="Formal, proctored, goes through review before publishing."
              selected={type === 'Exam'}
              onSelect={() => setType('Exam')}
            />
            <TypeCard
              icon="fa-bolt"
              label="Quiz"
              description="Quick, low-stakes, publish directly when ready."
              selected={type === 'Quiz'}
              onSelect={() => setType('Quiz')}
            />
          </div>

          {/* ── Name ───────────────────────────────────────────── */}
          <Field orientation="vertical">
            <FieldLabel htmlFor="asmt-name">Name *</FieldLabel>
            <Input
              id="asmt-name"
              autoFocus
              value={name}
              onChange={e => {
                setName(e.target.value)
                if (nameError) setNameError('')
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
              placeholder={type === 'Exam' ? 'e.g. IM Midterm 2026' : 'e.g. Week 3 Check-in'}
              aria-required="true"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'asmt-name-error' : undefined}
            />
            {nameError && <FieldError id="asmt-name-error">{nameError}</FieldError>}
          </Field>

          {/* ── Course chip (locked) ────────────────────────────── */}
          {course && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Course</span>
              <Badge variant="secondary" className="gap-1 font-normal max-w-full overflow-hidden">
                <span className="font-medium text-foreground shrink-0">{course.code}</span>
                <span className="text-muted-foreground shrink-0">·</span>
                <span className="text-muted-foreground truncate">{course.name}</span>
              </Badge>
              <i
                className="fa-light fa-lock text-[10px] text-muted-foreground shrink-0"
                aria-label="Course is locked to this context"
              />
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={submitting} onClick={handleCreate}>
            {submitting ? 'Creating…' : 'Create draft'}
            {!submitting && <i className="fa-light fa-arrow-right ms-1.5" aria-hidden="true" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── TypeCard ────────────────────────────────────────────────────────────────
// Centered layout: large icon → bold label → one-sentence description.
// Selected: foreground border + muted bg. Unselected: border-border.
function TypeCard({
  icon, label, description, selected, onSelect,
}: {
  icon: string
  label: string
  description: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Button
      variant="ghost"
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={[
        'flex h-auto flex-col items-center text-center gap-2 rounded-lg border p-5 transition-colors',
        selected
          ? 'border-foreground bg-muted'
          : 'border-border hover:border-muted-foreground hover:bg-muted/30',
      ].join(' ')}
    >
      <div className={[
        'flex size-10 items-center justify-center rounded-full',
        selected ? 'bg-foreground' : 'bg-muted',
      ].join(' ')}>
        <i
          className={`fa-light ${icon} text-base`}
          style={{ color: selected ? 'var(--background)' : 'var(--muted-foreground)' }}
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground leading-snug">{description}</span>
      </div>
    </Button>
  )
}
