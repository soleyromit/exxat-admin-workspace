'use client'

import { Button, Input, Checkbox } from '@exxatdesignux/ui'
import type { AssessmentSettings } from '@/lib/qb-types'

interface GradingSettingsPanelProps {
  settings: AssessmentSettings
  onPatch: (patch: Partial<AssessmentSettings>) => void
}

export function GradingSettingsPanel({ settings, onPatch }: GradingSettingsPanelProps) {
  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--card)',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}
      aria-label="Grading settings"
    >
      {/* Weightage toggle */}
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground shrink-0">Weightage</p>
        <div className="flex gap-1.5" role="group" aria-label="Assessment weightage">
          {(['Graded', 'Ungraded'] as const).map(option => {
            const wantsUngraded = option === 'Ungraded'
            const isDisabled = wantsUngraded && settings.type === 'Exam'
            const isActive = wantsUngraded ? !settings.graded : settings.graded
            return (
              <Button
                key={option}
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { if (!isDisabled) onPatch({ graded: !wantsUngraded }) }}
                aria-pressed={isActive}
                disabled={isDisabled}
                title={isDisabled ? 'Ungraded is only available for Quiz and Assignment' : undefined}
                className="h-7 px-3 text-xs font-medium"
              >
                {option}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Total marks — only when graded */}
      {settings.graded && (
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-muted-foreground shrink-0">Total marks</p>
          <Input
            type="number"
            min={1}
            step={1}
            aria-label="Total marks"
            value={settings.totalMarks}
            onChange={e => {
              const v = parseInt(e.target.value)
              if (!isNaN(v) && v >= 1) onPatch({ totalMarks: v })
            }}
            style={{ width: 64, height: 28, padding: '0 8px', fontSize: 13, textAlign: 'center' }}
          />
          <span className="text-xs text-muted-foreground">pts</span>
        </div>
      )}

      {/* Negative marking — only when graded */}
      {settings.graded && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="neg-marking-panel"
            checked={settings.negativeMarking}
            onCheckedChange={v => onPatch({ negativeMarking: Boolean(v) })}
          />
          <label
            htmlFor="neg-marking-panel"
            className="text-xs text-foreground cursor-pointer select-none"
          >
            Negative marking
          </label>
          {settings.negativeMarking && (
            <>
              <Input
                type="number"
                min={0.01}
                max={1}
                step={0.05}
                aria-label="Negative marking fraction per wrong answer"
                value={settings.negativeMarkingFraction}
                onChange={e => {
                  const v = parseFloat(e.target.value)
                  if (!isNaN(v) && v > 0 && v <= 1) onPatch({ negativeMarkingFraction: v })
                }}
                style={{ width: 52, height: 28, padding: '0 6px', fontSize: 12, textAlign: 'center' }}
              />
              <span className="text-xs text-muted-foreground">pts per wrong</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
