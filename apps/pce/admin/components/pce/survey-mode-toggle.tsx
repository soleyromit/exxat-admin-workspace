'use client'

import { usePce } from '@/components/pce/pce-state'

export function SurveyModeToggle() {
  const { surveyMode, setSurveyMode } = usePce()
  const opts: { value: 'course_evaluation' | 'general'; label: string }[] = [
    { value: 'course_evaluation', label: 'Course Evaluation' },
    { value: 'general', label: 'General Surveys' },
  ]
  return (
    <div
      className="flex rounded-md overflow-hidden shrink-0"
      role="radiogroup"
      aria-label="Survey mode"
      style={{ border: '1px solid var(--border)' }}
    >
      {opts.map((opt, i) => {
        const isSelected = surveyMode === opt.value
        return (
          <div
            key={opt.value}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onClick={() => setSurveyMode(opt.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSurveyMode(opt.value)
              }
            }}
            className="cursor-pointer select-none"
            style={{
              padding: '5px 14px',
              fontSize: 13,
              fontWeight: isSelected ? 600 : 400,
              background: isSelected ? 'var(--brand-color)' : 'var(--card)',
              color: isSelected ? '#fff' : 'var(--muted-foreground)',
              borderRight: i === 0 ? '1px solid var(--border)' : 'none',
            }}
          >
            {opt.label}
          </div>
        )
      })}
    </div>
  )
}
