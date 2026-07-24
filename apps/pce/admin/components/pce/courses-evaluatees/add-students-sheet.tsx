'use client'

// Add-students sheet — the Courses & students step's roster fix.
//
// In-app, not a Prism handoff: PCE operates independently (Aarti, Jun 13).
// Anatomy mirrors course-management-sheet.tsx (DS Sheet composition); the
// inner list is checkbox rows, NOT a DataTable — the DataTable's bulk-actions
// bar conflicts with a Sheet's pinned footer CTA (documented hand-roll,
// ds-adoption registry).

import { useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  CheckboxLabel,
  Input,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@exxatdesignux/ui'
import {
  MOCK_COURSE_ENROLLMENTS,
  MOCK_STUDENTS,
  type CourseOffering,
} from '@/lib/pce-mock-data'
import { courseLabelOf } from '@/lib/pce-course-readiness'

interface AddStudentsSheetProps {
  /** The course being staffed — null keeps the sheet mounted but closed. */
  offering: CourseOffering | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Students already added via this wizard run (excluded from candidates). */
  addedIds: string[]
  onApply: (offeringId: string, studentIds: string[]) => void
}

export function AddStudentsSheet({
  offering, open, onOpenChange, addedIds, onApply,
}: AddStudentsSheetProps) {
  const [search, setSearch] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())

  // Candidates: enrolled students who are neither on the Prism roster nor
  // already added in this wizard run. Same-cohort students lead when the
  // vocabularies line up; term cohorts like "Year 2 – Section E" don't map
  // onto student class cohorts, so the full enrolled pool is the fallback
  // (each row shows the student's cohort for the admin to judge).
  const candidates = useMemo(() => {
    if (!offering) return []
    const onRoster = new Set(MOCK_COURSE_ENROLLMENTS[offering.id] ?? [])
    for (const id of addedIds) onRoster.add(id)
    const pool = MOCK_STUDENTS.filter(s =>
      s.enrollmentStatus === 'enrolled' && !onRoster.has(s.id),
    )
    const sameCohort = pool.filter(s => s.cohort === offering.cohort)
    return sameCohort.length > 0 ? sameCohort : pool
  }, [offering, addedIds])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return candidates
    return candidates.filter(s =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.studentId.includes(q),
    )
  }, [candidates, search])

  const toggle = (id: string) =>
    setPicked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const reset = () => { setPicked(new Set()); setSearch('') }

  const apply = () => {
    if (!offering || picked.size === 0) return
    onApply(offering.id, [...picked])
    reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={o => { if (!o) reset(); onOpenChange(o) }}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0" style={{ width: 420, maxWidth: '100vw' }}>
        <SheetHeader style={{ padding: '20px 20px 12px' }}>
          <SheetTitle>Add students{offering ? ` — ${courseLabelOf(offering).split(' – ')[0]}` : ''}</SheetTitle>
          <SheetDescription>
            {offering
              ? <>Students who aren&apos;t on this course&apos;s roster yet. They&apos;ll receive every survey pushed for this course.</>
              : null}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 flex-1 min-h-0" style={{ padding: '0 20px' }}>
          <Input
            type="search"
            placeholder="Search by name or student ID"
            aria-label="Search students"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="flex-1 min-h-0 overflow-y-auto rounded-md border border-border">
            {shown.length === 0 ? (
              <p className="text-sm text-center" style={{ color: 'var(--muted-foreground)', padding: '32px 16px' }}>
                {candidates.length === 0
                  ? 'Every enrolled student in this cohort is already on the roster.'
                  : 'No students match your search.'}
              </p>
            ) : (
              <ul className="flex flex-col">
                {shown.map((s, i) => {
                  const id = `add-student-${s.id}`
                  return (
                    <li
                      key={s.id}
                      className="flex items-center gap-3"
                      style={{
                        padding: '10px 12px',
                        borderBottom: i < shown.length - 1 ? '1px solid var(--border)' : undefined,
                      }}
                    >
                      <Checkbox
                        id={id}
                        checked={picked.has(s.id)}
                        onCheckedChange={() => toggle(s.id)}
                      />
                      <CheckboxLabel htmlFor={id} className="flex flex-col items-start gap-0 min-w-0 font-normal">
                        <span className="text-sm font-medium truncate">{s.firstName} {s.lastName}</span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          <span className="font-mono tabular-nums">{s.studentId}</span> · {s.cohort}
                        </span>
                      </CheckboxLabel>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <SheetFooter className="flex-row items-center justify-end gap-2 border-t border-border" style={{ padding: '12px 20px' }}>
          <Button variant="ghost" size="sm" onClick={() => { reset(); onOpenChange(false) }}>
            Cancel
          </Button>
          <Button variant="default" size="sm" disabled={picked.size === 0} onClick={apply}>
            Add {picked.size > 0 ? `${picked.size} ` : ''}student{picked.size !== 1 ? 's' : ''}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
