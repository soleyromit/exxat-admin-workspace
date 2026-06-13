'use client'

import {
  Button,
  DatePickerField,
  LocalBanner,
} from '@exxatdesignux/ui'

interface StepDatesProps {
  termEndDate: string
  openDate: Date | undefined
  closeDate: Date | undefined
  releaseDate: Date | undefined
  onOpenDateChange: (d: Date | undefined) => void
  onCloseDateChange: (d: Date | undefined) => void
  onReleaseDateChange: (d: Date | undefined) => void
  onBack: () => void
  onNext: () => void
}

export function StepDates({
  termEndDate,
  openDate,
  closeDate,
  releaseDate,
  onOpenDateChange,
  onCloseDateChange,
  onReleaseDateChange,
  onBack,
  onNext,
}: StepDatesProps) {
  const dateOrderError =
    openDate && closeDate && closeDate <= openDate
      ? 'Close date must be after open date.'
      : null
  const releaseError =
    releaseDate && closeDate && releaseDate < closeDate
      ? 'Results date must be on or after the close date.'
      : null

  const canContinue = !!openDate && !!closeDate && !!releaseDate && !dateOrderError && !releaseError

  const termEndFmt = new Date(termEndDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 560 }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          Review dates
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Dates are pre-set from the term end date ({termEndFmt}). Adjust only if needed.
        </p>
      </div>

      {dateOrderError && <LocalBanner variant="error">{dateOrderError}</LocalBanner>}
      {releaseError   && <LocalBanner variant="error">{releaseError}</LocalBanner>}

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="flex flex-col gap-1.5">
          <p id="label-opens" className="text-sm font-medium">
            Survey opens <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
            <span className="sr-only">(required)</span>
          </p>
          <DatePickerField value={openDate} onChange={onOpenDateChange} aria-labelledby="label-opens" aria-required="true" />
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>7 days before term end</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <p id="label-closes" className="text-sm font-medium">
            Survey closes <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
            <span className="sr-only">(required)</span>
          </p>
          <DatePickerField value={closeDate} onChange={onCloseDateChange} aria-labelledby="label-closes" aria-required="true" />
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>14 days after term end</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <p id="label-release" className="text-sm font-medium">
            Results visible <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>*</span>
            <span className="sr-only">(required)</span>
          </p>
          <DatePickerField value={releaseDate} onChange={onReleaseDateChange} aria-labelledby="label-release" aria-required="true" />
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Day after close</p>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        These dates apply to all courses in this term. Per-course adjustments are available in survey details after activation.
      </p>

      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" disabled={!canContinue} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>
    </div>
  )
}
