'use client'
// Table primitive used directly (not DataTable) — documented hand-roll.
// Role × student access matrix (cross-tab); DataTable has no matrix-column model.
// See docs/governance/ds-adoption.md.

import {
  Button,
  Checkbox,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@exxatdesignux/ui'

export type RoleKey =
  | 'subject_faculty'
  | 'course_director'
  | 'program_admin'
  | 'program_director'
  | 'department_chair'
  | 'dean'

export type ReportAccess = Record<string, Set<RoleKey>>

const REPORT_ROLES: { key: RoleKey; label: string }[] = [
  { key: 'subject_faculty', label: 'Subject Faculty' },
  { key: 'course_director', label: 'Course Director' },
  { key: 'program_admin', label: 'Program Admin' },
  { key: 'program_director', label: 'Program Director' },
  { key: 'department_chair', label: 'Department Chair' },
  { key: 'dean', label: 'Dean' },
]

const SUBJECTS = [
  { key: 'course_instructor', label: 'Instructor' },
  { key: 'course_coordinator', label: 'Course Coordinator' },
]

export const DEFAULT_REPORT_ACCESS: ReportAccess = {
  course_instructor: new Set(['subject_faculty', 'program_director', 'department_chair']),
  course_coordinator: new Set(['subject_faculty', 'program_director', 'department_chair']),
}

interface StepReportAccessProps {
  reportAccess: ReportAccess
  onReportAccessChange: (access: ReportAccess) => void
  onBack: () => void
  onPush: () => void
}

export function StepReportAccess({
  reportAccess,
  onReportAccessChange,
  onBack,
  onPush,
}: StepReportAccessProps) {
  function toggle(subjectKey: string, roleKey: RoleKey) {
    const current = new Set(reportAccess[subjectKey] ?? [])
    if (current.has(roleKey)) current.delete(roleKey)
    else current.add(roleKey)
    onReportAccessChange({ ...reportAccess, [subjectKey]: current })
  }

  function toggleSubject(subjectKey: string) {
    const current = reportAccess[subjectKey] ?? new Set()
    const allOn = REPORT_ROLES.every(r => current.has(r.key))
    onReportAccessChange({
      ...reportAccess,
      [subjectKey]: allOn ? new Set() : new Set(REPORT_ROLES.map(r => r.key) as RoleKey[]),
    })
  }

  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: 600 }}>
      {/* Step header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Report access</h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Choose which roles can view aggregate results for each evaluated subject.
        </p>
      </div>

      {/* Permission matrix — styled to match DS DataTable */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table className="border-separate border-spacing-0">
          <TableHeader>
            {/* Header row — matches DS DataTable: --dt-header-bg, h-9, text-xs font-medium text-muted-foreground tracking-wide */}
            <TableRow
              className="hover:bg-transparent"
              style={{ background: 'var(--dt-header-bg)' }}
            >
              <TableHead
                scope="col"
                className="h-9 px-3 text-xs font-medium border-b border-border"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Role
              </TableHead>
              {SUBJECTS.map(s => (
                <TableHead
                  key={s.key}
                  scope="col"
                  className="h-9 px-3 text-xs font-medium border-b border-border text-center whitespace-normal"
                  style={{ width: 112, color: 'var(--foreground)' }}
                >
                  {s.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* Select all row — same header bg, visually distinct from data rows */}
            <TableRow
              className="hover:bg-transparent"
              style={{ background: 'var(--dt-header-bg)' }}
            >
              <TableCell
                className="h-9 px-3 text-xs font-medium border-b border-border"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Select all
              </TableCell>
              {SUBJECTS.map(s => {
                const allOn = REPORT_ROLES.every(r => (reportAccess[s.key] ?? new Set()).has(r.key))
                return (
                  <TableCell
                    key={s.key}
                    className="h-9 px-3 border-b border-border text-center"
                    style={{ width: 112 }}
                  >
                    <div className="flex justify-center">
                      <Checkbox
                        checked={allOn}
                        onCheckedChange={() => toggleSubject(s.key)}
                        aria-label={`Select all roles for ${s.label}`}
                      />
                    </div>
                  </TableCell>
                )
              })}
            </TableRow>

            {/* Role rows */}
            {REPORT_ROLES.map(role => (
              <TableRow key={role.key}>
                <TableCell className="h-10 px-3 text-sm">
                  {role.label}
                </TableCell>
                {SUBJECTS.map(s => {
                  const on = (reportAccess[s.key] ?? new Set()).has(role.key)
                  return (
                    <TableCell key={s.key} className="h-10 px-3 text-center" style={{ width: 112 }}>
                      <div className="flex justify-center">
                        <Checkbox
                          checked={on}
                          onCheckedChange={() => toggle(s.key, role.key)}
                          aria-label={`Allow ${role.label} to view ${s.label} results`}
                        />
                      </div>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Note */}
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Results are only visible after open-text responses are reviewed and "Enable results" is clicked in the moderation view.
      </p>

      {/* Nav */}
      <div className="border-t border-border pt-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
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
