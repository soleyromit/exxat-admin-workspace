'use client'

import {
  Button,
  Checkbox,
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
  surveyTitle: string
  keepAnonymous: boolean
  termId: string
  description: string
  visibility: SurveyVisibility
  onSurveyTitleChange: (v: string) => void
  onKeepAnonymousChange: (v: boolean) => void
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
  surveyTitle,
  keepAnonymous,
  termId,
  description,
  visibility,
  onSurveyTitleChange,
  onKeepAnonymousChange,
  onTermChange,
  onDescriptionChange,
  onVisibilityChange,
  onNext,
}: StepPropertiesProps) {
  const allTerms = MOCK_PROGRAM_TERMS
  const selectedTerm = allTerms.find(t => t.id === termId) ?? null
  const academicYear = selectedTerm?.academicYear ?? ''
  const isCE = surveyMode === 'course_evaluation'
  const canContinue = isCE ? !!surveyTitle.trim() && !!termId : !!surveyTitle.trim()

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 600 }}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Properties</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {isCE
            ? 'Define the term and scope for this course evaluation cycle.'
            : 'Define the scope for this survey.'}
        </p>
      </div>

      {/* Survey title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="survey-title" className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          Survey title <span style={{ color: 'var(--destructive)' }}>*</span>
        </label>
        <input
          id="survey-title"
          type="text"
          value={surveyTitle}
          onChange={e => onSurveyTitleChange(e.target.value)}
          placeholder="e.g. Fall 2026 Course Evaluations"
          className="w-full rounded-md text-sm"
          style={{
            padding: '7px 10px',
            border: '1px solid var(--border-control-35)',
            background: 'var(--card)',
            color: 'var(--foreground)',
            outline: 'none',
          }}
          aria-label="Survey title"
          maxLength={120}
        />
      </div>

      {/* Term — CE only */}
      {isCE && (
        <>
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

          {academicYear && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                Academic year
              </p>
              <p className="text-sm">{academicYear}</p>
            </div>
          )}
        </>
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

      {/* Keep responses anonymous */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          Response settings
        </p>
        <label
          className="flex items-start gap-3 cursor-pointer rounded-xl border border-border"
          style={{ padding: '14px 16px', background: 'var(--card)' }}
        >
          <Checkbox
            checked={keepAnonymous}
            onCheckedChange={v => onKeepAnonymousChange(!!v)}
            aria-label="Keep responses anonymous"
            className="mt-0.5"
          />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold">Keep responses anonymous</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Respondent identities will never be linked to their answers. Instructors see aggregate results only.
            </p>
          </div>
        </label>
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
