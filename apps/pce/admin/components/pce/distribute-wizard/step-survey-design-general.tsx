'use client'

import { Button } from '@exxatdesignux/ui'
import type { PceTemplate } from '@/lib/pce-mock-data'

interface StepSurveyDesignGeneralProps {
  publishedTemplates: PceTemplate[]
  selectedTemplateId: string
  onTemplateChange: (id: string) => void
  onBack: () => void
  onNext: () => void
}

export function StepSurveyDesignGeneral({
  publishedTemplates,
  selectedTemplateId,
  onTemplateChange,
  onBack,
  onNext,
}: StepSurveyDesignGeneralProps) {
  return (
    <div className="flex flex-col gap-5" style={{ maxWidth: 640 }}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Survey design</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Choose a template for this general survey.
        </p>
      </div>

      {publishedTemplates.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 py-14 text-center rounded-xl border border-dashed"
          style={{ borderColor: 'var(--border)' }}
        >
          <i
            className="fa-light fa-file-lines text-3xl"
            aria-hidden="true"
            style={{ color: 'var(--muted-foreground)' }}
          />
          <div>
            <p className="text-sm font-medium">No general survey templates</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Create and publish a General Survey template to continue.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/templates" target="_blank" rel="noreferrer" aria-label="Go to templates (opens in new tab)">
              Go to templates
              <i className="fa-light fa-arrow-up-right-from-square ml-1.5 text-xs" aria-hidden="true" />
            </a>
          </Button>
        </div>
      ) : (
        <div
          className="flex flex-col rounded-xl border border-border overflow-hidden"
          role="radiogroup"
          aria-label="Select a template"
          style={{ background: 'var(--card)' }}
        >
          {publishedTemplates.map((t, i) => {
            const isSelected = t.id === selectedTemplateId
            const isLast = i === publishedTemplates.length - 1
            return (
              <label
                key={t.id}
                className="flex items-start gap-3 cursor-pointer"
                style={{
                  padding: isSelected ? '13px 15px' : '14px 16px',
                  borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  border: isSelected ? '2px solid var(--brand-color)' : undefined,
                  background: isSelected ? 'var(--card)' : undefined,
                }}
              >
                <input
                  type="radio"
                  name="general-template"
                  value={t.id}
                  checked={isSelected}
                  onChange={() => onTemplateChange(t.id)}
                  className="mt-0.5 shrink-0 accent-[var(--brand-color)]"
                  aria-label={t.name}
                />
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-sm font-semibold">{t.name}</span>
                  {t.questionCount > 0 && (
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {t.questionCount} question{t.questionCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <i
                    className="fa-solid fa-check text-xs shrink-0 mt-0.5"
                    aria-hidden="true"
                    style={{ color: 'var(--brand-color)' }}
                  />
                )}
              </label>
            )
          })}
        </div>
      )}

      {/* Nav */}
      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button
          variant="default"
          size="sm"
          disabled={!selectedTemplateId || publishedTemplates.length === 0}
          onClick={onNext}
        >
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>
    </div>
  )
}
