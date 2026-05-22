'use client'

import { Button } from '@exxat/ds/packages/ui/src'
import {
  type CourseOffering,
  type ProgramTerm,
  type PceTemplate,
  MOCK_MASTER_COURSES,
} from '@/lib/pce-mock-data'

interface StepReportAccessProps {
  instructorAccess: boolean
  coordinatorAccess: boolean
  onInstructorAccessChange: (v: boolean) => void
  onCoordinatorAccessChange: (v: boolean) => void
  // Summary data
  selectedOfferings: CourseOffering[]
  selectedTerm: ProgramTerm
  openDate: Date | undefined
  closeDate: Date | undefined
  templateAssignments: Record<string, string>
  publishedTemplates: PceTemplate[]
  onBack: () => void
  onPush: () => void
}

function fmtDate(d: Date | undefined): string {
  if (!d) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface AccessToggleProps {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}

function AccessToggle({ label, description, value, onChange }: AccessToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {description}
      </p>
      <div
        className="flex flex-col rounded-xl overflow-hidden"
        role="radiogroup"
        aria-label={label}
        style={{ border: '1px solid var(--border)' }}
      >
        {[
          { v: true, title: 'Yes', subtitle: 'Can view results for their sections' },
          { v: false, title: 'No', subtitle: 'Only admins can view' },
        ].map((opt, i) => {
          const isSelected = value === opt.v
          const isLast = i === 1
          return (
            <div
              key={String(opt.v)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onChange(opt.v)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onChange(opt.v)
                }
              }}
              className="flex items-center gap-3 cursor-pointer"
              style={{
                padding: '12px 14px',
                background: isSelected ? 'var(--brand-tint)' : 'var(--card)',
                borderBottom: isLast ? 'none' : '1px solid var(--border)',
                borderLeft: isSelected
                  ? '3px solid var(--brand-color)'
                  : '3px solid transparent',
              }}
            >
              {/* Radio dot */}
              <span
                className="shrink-0 rounded-full flex items-center justify-center"
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
                    style={{ width: 6, height: 6, background: 'var(--brand-color)' }}
                  />
                )}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{opt.title}</span>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {opt.subtitle}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StepReportAccess({
  instructorAccess,
  coordinatorAccess,
  onInstructorAccessChange,
  onCoordinatorAccessChange,
  selectedOfferings,
  selectedTerm,
  openDate,
  closeDate,
  templateAssignments,
  publishedTemplates,
  onBack,
  onPush,
}: StepReportAccessProps) {
  const totalStudents = selectedOfferings.reduce((s, o) => s + o.enrolledCount, 0)

  const uniqueTemplateNames = Array.from(new Set(
    selectedOfferings
      .map(o => publishedTemplates.find(t => t.id === templateAssignments[o.id])?.name)
      .filter((n): n is string => !!n)
  ))

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 600 }}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
          Step 5 of 5
        </p>
        <h2 className="text-lg font-semibold">Report access</h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Define who can view results after you enable them.
        </p>
      </div>

      {/* Admin access — always on */}
      <div
        className="flex items-start gap-3 rounded-lg px-3 py-3"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <i
          className="fa-solid fa-check text-xs mt-0.5 shrink-0"
          aria-hidden="true"
          style={{ color: 'var(--brand-color)' }}
        />
        <div>
          <p className="text-sm font-semibold">Admin access</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            You always have full access to all results.
          </p>
        </div>
      </div>

      {/* Instructor access toggle */}
      <AccessToggle
        label="Instructor access"
        description="Allow instructors to view results for their own sections?"
        value={instructorAccess}
        onChange={onInstructorAccessChange}
      />

      {/* Coordinator access toggle */}
      <AccessToggle
        label="Course coordinator access"
        description="Allow coordinators to view results for their sections?"
        value={coordinatorAccess}
        onChange={onCoordinatorAccessChange}
      />

      <div className="border-t border-border" />

      {/* Summary */}
      <div className="flex flex-col gap-3">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Summary
        </p>
        <div
          className="flex flex-col gap-2 rounded-xl border border-border"
          style={{ padding: '14px 16px', background: 'var(--card)' }}
        >
          {/* Courses + students + term */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">
              {selectedOfferings.length} course{selectedOfferings.length !== 1 ? 's' : ''}
            </span>
            <span style={{ color: 'var(--muted-foreground)' }}>·</span>
            <span className="text-sm">{totalStudents} students</span>
            <span style={{ color: 'var(--muted-foreground)' }}>·</span>
            <span className="text-sm">{selectedTerm.name}</span>
          </div>

          {/* Dates */}
          {(openDate || closeDate) && (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Opens {fmtDate(openDate)}
              <span className="mx-1">→</span>
              Closes {fmtDate(closeDate)}
            </p>
          )}

          {/* Templates */}
          {uniqueTemplateNames.length > 0 && (
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {uniqueTemplateNames.length === 1
                ? `Template: ${uniqueTemplateNames[0]}`
                : `Templates: ${uniqueTemplateNames.join(', ')}`}
            </p>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" onClick={onPush}>
          <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 12 }} />
          Push surveys
        </Button>
      </div>
    </div>
  )
}
