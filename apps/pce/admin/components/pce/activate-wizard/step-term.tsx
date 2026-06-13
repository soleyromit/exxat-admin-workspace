'use client'

import { useMemo } from 'react'
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@exxatdesignux/ui'
import { MOCK_COURSE_OFFERINGS, MOCK_PROGRAM_TERMS } from '@/lib/pce-mock-data'

interface StepTermProps {
  termId: string
  onTermChange: (termId: string) => void
  onNext: () => void
}

function dateFromYmd(s: string) {
  return new Date(s + 'T00:00:00')
}

function fmt(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function StepTerm({ termId, onTermChange, onNext }: StepTermProps) {
  const selectedTerm = MOCK_PROGRAM_TERMS.find(t => t.id === termId) ?? null

  const offeringsForTerm = useMemo(
    () => termId ? MOCK_COURSE_OFFERINGS.filter(o => o.termId === termId && o.status !== 'archived') : [],
    [termId]
  )

  const didacticCount = offeringsForTerm.filter(o => o.courseType === 'didactic').length
  const clinicalCount = offeringsForTerm.filter(o => o.courseType === 'clinical').length

  const window = useMemo(() => {
    if (!selectedTerm) return null
    const end = dateFromYmd(selectedTerm.endDate)
    return {
      open:  new Date(end.getTime() - 7  * 86400_000),
      close: new Date(end.getTime() + 14 * 86400_000),
    }
  }, [selectedTerm])

  const canContinue = !!termId && offeringsForTerm.length > 0

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 480 }}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          Select term
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Choose the term to activate course evaluations for.
        </p>
      </div>

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
            {MOCK_PROGRAM_TERMS.map(t => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} · {t.academicYear}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTerm && offeringsForTerm.length > 0 && window && (
        <div
          className="flex flex-col gap-3 rounded-lg border border-border"
          style={{ padding: '14px 16px', background: 'var(--card)' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{selectedTerm.name}</span>
            <Badge variant="secondary">{offeringsForTerm.length} courses</Badge>
            {didacticCount > 0 && <Badge variant="outline">{didacticCount} Didactic</Badge>}
            {clinicalCount > 0 && <Badge variant="outline">{clinicalCount} Clinical</Badge>}
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Suggested window · term ends {fmt(dateFromYmd(selectedTerm.endDate))}
            </p>
            <p className="text-sm">
              {fmt(window.open)} — {fmt(window.close)}
            </p>
          </div>
        </div>
      )}

      {selectedTerm && offeringsForTerm.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          No active course offerings found for {selectedTerm.name}.
        </p>
      )}

      <div className="border-t border-border pt-4 flex justify-end">
        <Button variant="default" size="sm" disabled={!canContinue} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>
    </div>
  )
}
