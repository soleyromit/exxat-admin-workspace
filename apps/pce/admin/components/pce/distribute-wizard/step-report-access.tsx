'use client'

import { Button, Checkbox } from '@exxatdesignux/ui'

interface StepReportAccessProps {
  instructorAccess: boolean
  coordinatorAccess: boolean
  onInstructorAccessChange: (v: boolean) => void
  onCoordinatorAccessChange: (v: boolean) => void
  onBack: () => void
  onPush: () => void
}

export function StepReportAccess({
  instructorAccess,
  coordinatorAccess,
  onInstructorAccessChange,
  onCoordinatorAccessChange,
  onBack,
  onPush,
}: StepReportAccessProps) {
  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 600 }}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
          Step 5 of 5
        </p>
        <h1 className="text-lg font-semibold">Report access</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Choose who can view results once you release them. You can change this after pushing.
        </p>
      </div>

      {/* Access table */}
      <div
        className="flex flex-col rounded-xl border border-border overflow-hidden"
        style={{ background: 'var(--card)' }}
      >
        {/* Admin — always on */}
        <div
          className="flex items-center gap-3"
          style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}
        >
          <i
            className="fa-solid fa-check text-xs shrink-0"
            aria-hidden="true"
            style={{ color: 'var(--brand-color)', width: 16 }}
          />
          <div className="flex-1">
            <p className="text-sm font-medium">Admin</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Full access to all results and open-text responses
            </p>
          </div>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Always on</span>
        </div>

        {/* Instructors */}
        <label
          className="flex items-center gap-3 cursor-pointer"
          style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}
        >
          <Checkbox
            checked={instructorAccess}
            onCheckedChange={v => onInstructorAccessChange(!!v)}
            aria-label="Allow instructors to view their course results"
          />
          <div className="flex-1">
            <p className="text-sm font-medium">Instructors</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Can view aggregated results for their own courses only
            </p>
          </div>
        </label>

        {/* Coordinators */}
        <label
          className="flex items-center gap-3 cursor-pointer"
          style={{ padding: '12px 16px' }}
        >
          <Checkbox
            checked={coordinatorAccess}
            onCheckedChange={v => onCoordinatorAccessChange(!!v)}
            aria-label="Allow coordinators to view all course results"
          />
          <div className="flex-1">
            <p className="text-sm font-medium">Coordinators</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Can view results across all courses in the program
            </p>
          </div>
        </label>
      </div>

      {/* Note */}
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Results are only visible after you review open-text responses and click "Enable results" in the moderation view.
      </p>

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
