'use client'

import { useEffect, useState } from 'react'

interface GeneratingStepsProps {
  source: 'ai' | 'pdf'
  prompt?: string
  fileName?: string
  /** Called when all steps are complete */
  onComplete: () => void
}

const STEP_DELAY_MS = 900

function getStepLabels(source: 'ai' | 'pdf', prompt: string, fileName: string): string[] {
  if (source === 'ai') {
    const excerpt = prompt.length > 40 ? prompt.slice(0, 40) + '…' : prompt
    return [
      `Read prompt — "${excerpt}"`,
      'Scanned curriculum map — 3 LOs found',
      'Calibrated — 6 MCQs, 3 medium · 2 hard · 1 easy',
      'Writing 6 questions…',
    ]
  }
  return [
    `Read PDF — "${fileName}", 24 pages`,
    'Identified question candidates — 8 found in slides',
    'Formatting & calibrating 8 questions',
  ]
}

export function GeneratingSteps({
  source,
  prompt = '',
  fileName = 'document.pdf',
  onComplete,
}: GeneratingStepsProps) {
  const labels = getStepLabels(source, prompt, fileName)
  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    if (completedCount >= labels.length) {
      const id = setTimeout(onComplete, 600)
      return () => clearTimeout(id)
    }
    const id = setTimeout(
      () => setCompletedCount(c => c + 1),
      STEP_DELAY_MS
    )
    return () => clearTimeout(id)
  }, [completedCount, labels.length, onComplete])

  return (
    <div className="px-4 py-4 border-b border-[var(--border)] space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-[var(--foreground)]">
          {source === 'ai' ? 'Generating questions' : 'Extracting questions'}
        </span>
        <span className="flex gap-0.5 items-center">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--brand-color)]"
              style={{
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.6,
              }}
            />
          ))}
        </span>
      </div>

      <div className="space-y-2">
        {labels.map((label, i) => {
          const done = i < completedCount
          const active = i === completedCount

          return (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              {done ? (
                <i
                  className="fa-regular fa-check text-green-600 w-3.5 shrink-0"
                  aria-hidden="true"
                />
              ) : active ? (
                <i
                  className="fa-regular fa-sparkles w-3.5 shrink-0"
                  style={{ color: 'var(--brand-color)', animation: 'pulse 1s ease-in-out infinite' }}
                  aria-hidden="true"
                />
              ) : (
                <span className="w-3.5 shrink-0" aria-hidden="true" />
              )}
              <span
                className={
                  done
                    ? 'text-[var(--foreground)]'
                    : active
                    ? 'text-[var(--foreground)] font-medium'
                    : 'text-[var(--muted-foreground)]'
                }
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
