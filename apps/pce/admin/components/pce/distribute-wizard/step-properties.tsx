'use client'

import {
  Button,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Textarea,
} from '@exxatdesignux/ui'
import { MOCK_PROGRAM_TERMS } from '@/lib/pce-mock-data'

export type SurveyVisibility = 'program' | 'admin_only'

interface StepPropertiesProps {
  surveyMode: 'course_evaluation' | 'general'
  termId: string
  description: string
  visibility: SurveyVisibility
  onTermChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onVisibilityChange: (v: SurveyVisibility) => void
  onNext: () => void
}

const VISIBILITY_OPTIONS: Array<{
  value: SurveyVisibility
  title: string
  description: string
  icon: string
}> = [
  {
    value: 'program',
    title: 'Share with my program',
    description: 'Visible to instructors and coordinators in their dashboard.',
    icon: 'fa-users',
  },
  {
    value: 'admin_only',
    title: 'Admin only',
    description: 'Only you can see and manage this survey cycle.',
    icon: 'fa-lock',
  },
]

export function StepProperties({
  surveyMode,
  termId,
  description,
  visibility,
  onTermChange,
  onDescriptionChange,
  onVisibilityChange,
  onNext,
}: StepPropertiesProps) {
  const allTerms = MOCK_PROGRAM_TERMS
  const selectedTerm = allTerms.find(t => t.id === termId) ?? null
  const academicYear = selectedTerm?.academicYear ?? ''
  const isCE = surveyMode === 'course_evaluation'
  const canContinue = isCE ? !!termId : true

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 600 }}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
          Step 1 of 5
        </p>
        <h2 className="text-lg font-semibold">Properties</h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isCE
            ? 'Define the term and scope for this course evaluation cycle.'
            : 'Define the scope for this survey.'}
        </p>
      </div>

      {/* Term — CE only */}
      {isCE && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="term-select" className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            Term <span style={{ color: 'var(--destructive)' }}>*</span>
          </label>
          <Select value={termId} onValueChange={onTermChange}>
            <SelectTrigger id="term-select" aria-label="Select term">
              <SelectValue placeholder="Choose a term…" />
            </SelectTrigger>
            <SelectContent>
              {allTerms.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} · {t.academicYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Academic year (derived, read-only) — CE only */}
      {isCE && academicYear && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            Academic year
          </p>
          <p className="text-sm">{academicYear}</p>
        </div>
      )}

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="survey-description" className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          Description{' '}
          <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>(optional)</span>
        </label>
        <Textarea
          id="survey-description"
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={3}
          placeholder="Describe the purpose or context of this survey cycle…"
          className="text-sm resize-none"
          aria-label="Survey description"
          maxLength={500}
        />
        <p className="text-xs text-right" style={{ color: 'var(--muted-foreground)' }}>
          {description.length}/500
        </p>
      </div>

      {/* Survey visibility */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          Visibility
        </p>
        <div
          className="flex gap-3"
          role="radiogroup"
          aria-label="Survey visibility"
        >
          {VISIBILITY_OPTIONS.map(opt => {
            const isSelected = visibility === opt.value
            return (
              <div
                key={opt.value}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => onVisibilityChange(opt.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onVisibilityChange(opt.value)
                  }
                }}
                className="flex items-start gap-3 cursor-pointer rounded-xl flex-1"
                style={{
                  padding: isSelected ? '14px 16px' : '15px 17px',
                  border: isSelected
                    ? '2px solid var(--brand-color)'
                    : '1px solid var(--border)',
                  background: 'var(--card)',
                  outline: 'none',
                }}
              >
                <i
                  className={`fa-light ${opt.icon} text-sm shrink-0 mt-0.5`}
                  aria-hidden="true"
                  style={{ color: 'var(--muted-foreground)' }}
                />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-sm font-semibold">{opt.title}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {opt.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Divider + actions */}
      <div className="border-t border-border pt-4 flex items-center justify-end">
        <Button variant="default" size="sm" disabled={!canContinue} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>
    </div>
  )
}
