'use client'

import {
  Button,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@exxat/ds/packages/ui/src'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_PROGRAMS,
  type SurveyType,
} from '@/lib/pce-mock-data'

interface StepPropertiesProps {
  surveyType: SurveyType
  termId: string
  programId: string
  onSurveyTypeChange: (v: SurveyType) => void
  onTermChange: (v: string) => void
  onProgramChange: (v: string) => void
  onNext: () => void
}

const SURVEY_TYPE_OPTIONS: Array<{
  value: SurveyType
  title: string
  description: string
}> = [
  {
    value: 'course_evaluation',
    title: 'Course Evaluation',
    description: 'Evaluates faculty and course content. Anonymous. Accreditation compliant.',
  },
  {
    value: 'programmatic',
    title: 'Programmatic Survey',
    description: 'Annual or recurring institutional surveys (alumni, preceptor, etc.)',
  },
]

export function StepProperties({
  surveyType,
  termId,
  programId,
  onSurveyTypeChange,
  onTermChange,
  onProgramChange,
  onNext,
}: StepPropertiesProps) {
  const allTerms = MOCK_PROGRAM_TERMS
  const selectedTerm = allTerms.find(t => t.id === termId) ?? null
  const academicYear = selectedTerm?.academicYear ?? ''
  const canContinue = !!termId && !!programId

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 600 }}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
          Step 1 of 5
        </p>
        <h2 className="text-lg font-semibold">Properties</h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Define the scope of this survey cycle.
        </p>
      </div>

      {/* Survey type */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          Survey type <span style={{ color: 'var(--destructive)' }}>*</span>
        </label>
        <div
          className="flex flex-col rounded-xl overflow-hidden"
          role="radiogroup"
          aria-label="Survey type"
          style={{ border: '1px solid var(--border)' }}
        >
          {SURVEY_TYPE_OPTIONS.map((opt, i) => {
            const isSelected = surveyType === opt.value
            const isLast = i === SURVEY_TYPE_OPTIONS.length - 1
            return (
              <div
                key={opt.value}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => onSurveyTypeChange(opt.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSurveyTypeChange(opt.value)
                  }
                }}
                className="flex items-start gap-3 cursor-pointer"
                style={{
                  padding: '14px 16px',
                  background: isSelected ? 'var(--brand-tint)' : 'var(--card)',
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  borderLeft: isSelected
                    ? '3px solid var(--brand-color)'
                    : '3px solid transparent',
                }}
              >
                {/* Radio dot */}
                <span
                  className="shrink-0 rounded-full flex items-center justify-center mt-0.5"
                  style={{
                    width: 16,
                    height: 16,
                    border: isSelected
                      ? '2px solid var(--brand-color)'
                      : '2px solid var(--border-control-35)',
                    background: 'transparent',
                  }}
                >
                  {isSelected && (
                    <span
                      className="rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        background: 'var(--brand-color)',
                      }}
                    />
                  )}
                </span>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
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

      {/* Term + Program row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            Term <span style={{ color: 'var(--destructive)' }}>*</span>
          </label>
          <Select value={termId} onValueChange={onTermChange}>
            <SelectTrigger aria-label="Select term">
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

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            Program <span style={{ color: 'var(--destructive)' }}>*</span>
          </label>
          <Select value={programId} onValueChange={onProgramChange}>
            <SelectTrigger aria-label="Select program">
              <SelectValue placeholder="Choose a program…" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_PROGRAMS.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Academic year (derived, read-only) */}
      {academicYear && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            Academic year
          </p>
          <p className="text-sm">{academicYear}</p>
        </div>
      )}

      {/* Divider + actions */}
      <div className="border-t border-border pt-4 flex items-center justify-end">
        <Button
          variant="default"
          size="sm"
          disabled={!canContinue}
          onClick={onNext}
        >
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>
    </div>
  )
}
