'use client'

import Link from 'next/link'
import { Button } from '@exxatdesignux/ui'
import {
  MOCK_MASTER_COURSES,
  type CourseOffering,
  type ProgramTerm,
} from '@/lib/pce-mock-data'

interface StepSuccessProps {
  selectedOfferings: CourseOffering[]
  selectedTerm: ProgramTerm
  openDate: Date | undefined
  onReset: () => void
}

export function StepSuccess({
  selectedOfferings,
  selectedTerm,
  openDate,
  onReset,
}: StepSuccessProps) {
  const openLabel = openDate
    ? openDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-8 py-16 text-center"
      style={{ maxWidth: 480, marginInline: 'auto' }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 64, height: 64, background: 'var(--brand-tint)' }}
      >
        <i
          className="fa-light fa-circle-check"
          aria-hidden="true"
          style={{ fontSize: 32, color: 'var(--brand-color)' }}
        />
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">
          {selectedOfferings.length} survey{selectedOfferings.length !== 1 ? 's' : ''} pushed
          {' '}for {selectedTerm.name}
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {openLabel
            ? `Opens ${openLabel}. Students will receive an invitation email on that date.`
            : 'Students will receive an invitation email on the open date.'}
        </p>
      </div>

      {/* Course code pills */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {selectedOfferings.map(offering => {
          const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
          return (
            <span
              key={offering.id}
              className="rounded-full text-xs font-medium"
              style={{
                padding: '3px 10px',
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
              }}
            >
              {course?.code ?? offering.id}
            </span>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onReset}>
          Push another
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link href="/surveys">
            View surveys
            <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
          </Link>
        </Button>
      </div>
    </div>
  )
}
