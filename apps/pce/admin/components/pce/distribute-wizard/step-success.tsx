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
      style={{ maxWidth: 560, marginInline: 'auto' }}
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
            ? `Opens ${openLabel}. Invitation emails will be sent to configured recipients on that date.`
            : 'Invitation emails will be sent to configured recipients on the open date.'}
        </p>
      </div>

      {/* Course table */}
      <div
        className="w-full rounded-md"
        style={{ border: '1px solid var(--border)', maxHeight: 220, overflowY: 'auto', overflowX: 'hidden' }}
      >
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
              <th className="text-left font-medium px-3 py-2" style={{ color: 'var(--muted-foreground)', width: '20%', whiteSpace: 'nowrap' }}>Code</th>
              <th className="text-left font-medium px-3 py-2" style={{ color: 'var(--muted-foreground)' }}>Course name</th>
            </tr>
          </thead>
          <tbody>
            {selectedOfferings.map((offering, i) => {
              const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
              return (
                <tr
                  key={offering.id}
                  style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}
                >
                  <td className="text-left px-3 py-2 font-medium" style={{ whiteSpace: 'nowrap' }}>{course?.code ?? offering.id}</td>
                  <td className="text-left px-3 py-2" style={{ color: 'var(--muted-foreground)' }}>{course?.name ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
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
