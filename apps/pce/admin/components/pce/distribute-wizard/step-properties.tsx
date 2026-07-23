'use client'

import {
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Textarea,
} from '@exxatdesignux/ui'
import { MOCK_PROGRAM_TERMS } from '@/lib/pce-mock-data'

interface StepPropertiesProps {
  surveyMode: 'course_evaluation' | 'general'
  surveyTitle: string
  termId: string
  description: string
  onSurveyTitleChange: (v: string) => void
  onTermChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onNext?: () => void
  /** Render as an embedded section (no own header/footer) inside a larger step. */
  asSection?: boolean
}

export function StepProperties({
  surveyMode,
  surveyTitle,
  termId,
  description,
  onSurveyTitleChange,
  onTermChange,
  onDescriptionChange,
  onNext,
  asSection = false,
}: StepPropertiesProps) {
  const allTerms = MOCK_PROGRAM_TERMS
  const isCE = surveyMode === 'course_evaluation'
  const canContinue = isCE ? !!surveyTitle.trim() && !!termId : !!surveyTitle.trim()

  return (
    <div className="flex flex-col gap-6" style={asSection ? undefined : { maxWidth: 600 }}>
      {/* Header */}
      {!asSection && (
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
            {isCE ? 'Evaluation' : 'Survey'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {isCE
              ? 'Define the term and scope for this course evaluation cycle.'
              : 'Define the scope for this survey.'}
          </p>
        </div>
      )}

      {/* Survey title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="survey-title" className="text-sm font-medium">
          Survey title <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
          <span className="sr-only">(required)</span>
        </label>
        <Input
          id="survey-title"
          value={surveyTitle}
          onChange={e => onSurveyTitleChange(e.target.value)}
          placeholder="e.g. Fall 2026 Course Evaluations"
          aria-required="true"
          maxLength={120}
        />
      </div>

      {/* Term — CE only */}
      {isCE && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="term-select" className="text-sm font-medium">
            Term <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
            <span className="sr-only">(required)</span>
          </label>
          <Select value={termId} onValueChange={onTermChange}>
            <SelectTrigger id="term-select" aria-required="true">
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

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="survey-description" className="text-sm font-medium">
          Description{' '}
          <span className="font-normal text-muted-foreground">(optional)</span>
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

      {/* Anonymous — informational only, not configurable */}
      <div
        className="flex items-start gap-3 rounded-xl border border-border"
        style={{ padding: '14px 16px', background: 'var(--card)' }}
      >
        <i className="fa-light fa-shield-check text-sm shrink-0 mt-0.5" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold">Responses are anonymous</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Respondent identities are never linked to their answers. Instructors see aggregate results only.
          </p>
        </div>
      </div>

      {/* Divider + actions */}
      {!asSection && (
        <div className="border-t border-border pt-4 flex items-center justify-end">
          <Button variant="default" size="sm" disabled={!canContinue} onClick={onNext}>
            Continue
            <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  )
}
