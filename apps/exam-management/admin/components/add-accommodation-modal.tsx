'use client'

/**
 * ADD ACCOMMODATION MODAL — admin-only · 3-step flow.
 *
 * Story:
 *   1. Find the student (search + select)
 *   2. Pick the type (selection tile grid) + detail + notes
 *   3. Set scope (all enrolled courses OR specific) + expiry
 *
 * Submitting persists via `useStudentAccommodations`. The "all enrolled"
 * scope creates one row per enrolled course (so the schema stays consistent
 * with seed data). Caller is responsible for showing the success banner.
 */

import { useMemo, useState } from 'react'
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input, InputGroup, InputGroupAddon, InputGroupInput,
  Field, FieldGroup, FieldLabel, FieldDescription, FieldError,
  Label,
  Textarea,
  RadioGroup, RadioGroupItem,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  LocalBanner,
} from '@exxatdesignux/ui'
import { EmptyState } from '@/components/empty-state'
import { useStudentAccommodations } from '@/lib/student-accommodation-store'
import { facultyStudents, facultyAccommodations, type AccommodationType, type Student } from '@/lib/faculty-mock-data'
import { mockCourses } from '@/lib/qb-mock-data'

interface AddAccommodationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Approver name auto-stamped on submit (current admin's display name). */
  approverName: string
  /** Fired after a successful submit so the caller can show a banner.
   *  `undoIds` is the list of created record IDs so caller can wire undo. */
  onCreated?: (args: { undoIds: string[]; studentName: string; typeLabel: string }) => void
}

const TYPE_OPTIONS: Array<{ value: AccommodationType; label: string; icon: string }> = [
  { value: 'extended-time',   label: 'Extended time',   icon: 'fa-clock' },
  { value: 'separate-room',   label: 'Separate room',   icon: 'fa-door-open' },
  { value: 'extended-breaks', label: 'Extended breaks', icon: 'fa-mug-hot' },
  { value: 'screen-reader',   label: 'Screen reader',   icon: 'fa-display-code' },
  { value: 'quiet-room',      label: 'Quiet room',      icon: 'fa-volume-off' },
]

const DEFAULT_DETAIL: Record<AccommodationType, string> = {
  'extended-time':   '1.5x time multiplier',
  'separate-room':   'Private testing room',
  'extended-breaks': 'Additional 5-min breaks',
  'screen-reader':   'NVDA screen-reader required',
  'quiet-room':      'Reduced-distraction room',
}

type ScopeMode = 'all-enrolled' | 'specific-course'

export function AddAccommodationModal({
  open, onOpenChange, approverName, onCreated,
}: AddAccommodationModalProps) {
  const { addAccommodations } = useStudentAccommodations()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [query, setQuery] = useState('')
  const [studentId, setStudentId] = useState<string | null>(null)
  const [type, setType] = useState<AccommodationType>('extended-time')
  const [detail, setDetail] = useState(DEFAULT_DETAIL['extended-time'])
  const [notes, setNotes] = useState('')
  const [scope, setScope] = useState<ScopeMode>('all-enrolled')
  const [specificCourseId, setSpecificCourseId] = useState<string>('')
  const [expiryEnabled, setExpiryEnabled] = useState(false)
  const [expiryDate, setExpiryDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Validation surfacing (mirrors PCE students/page.tsx pattern).
  const [errors, setErrors] = useState<Record<string, string>>({})

  const reset = () => {
    setStep(1)
    setQuery('')
    setStudentId(null)
    setType('extended-time')
    setDetail(DEFAULT_DETAIL['extended-time'])
    setNotes('')
    setScope('all-enrolled')
    setSpecificCourseId('')
    setExpiryEnabled(false)
    setExpiryDate('')
    setSubmitting(false)
    setErrors({})
  }

  const handleClose = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  // ─── Step 1 helpers ────────────────────────────────────────────────────
  const matched: Student[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 1) return []
    return facultyStudents.filter(s => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase()
      return fullName.includes(q) || s.studentId.toLowerCase().includes(q)
    }).slice(0, 8)
  }, [query])

  const selectedStudent = studentId ? facultyStudents.find(s => s.id === studentId) : null
  const existingForSelected = useMemo(() => {
    if (!selectedStudent) return 0
    return facultyAccommodations.filter(a => a.studentId === selectedStudent.id).length
  }, [selectedStudent])

  // ─── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const stepErrors = { ...validateStep2(), ...validateStep3() }
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length > 0) return
    if (!selectedStudent) return
    setSubmitting(true)

    const approvedDate = new Date().toISOString()
    const expiry = expiryEnabled && expiryDate ? new Date(expiryDate).toISOString() : undefined

    const courseIds = scope === 'all-enrolled'
      ? selectedStudent.enrolledCourseIds
      : (specificCourseId ? [specificCourseId] : [])

    if (courseIds.length === 0) {
      setSubmitting(false)
      return
    }

    const created = addAccommodations(
      courseIds.map(cid => ({
        studentId: selectedStudent.id,
        courseId: cid,
        type,
        detail: detail.trim(),
        approvedBy: approverName,
        approvedDate,
        expiryDate: expiry,
        notes: notes.trim() || undefined,
      }))
    )

    const typeLabel = TYPE_OPTIONS.find(t => t.value === type)?.label ?? type
    onCreated?.({
      undoIds: created.map(c => c.id),
      studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
      typeLabel,
    })

    reset()
    onOpenChange(false)
  }

  // ─── Validation per step ───────────────────────────────────────────────
  const canAdvanceStep1 = !!studentId
  const validateStep2 = (): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!detail.trim()) next.detail = 'Detail is required.'
    return next
  }
  const validateStep3 = (): Record<string, string> => {
    const next: Record<string, string> = {}
    if (scope === 'specific-course' && !specificCourseId) {
      next.scope = 'Pick a course.'
    }
    if (expiryEnabled && !expiryDate) {
      next.expiryDate = 'Set an expiry date or choose Never expires.'
    }
    return next
  }

  const handleNext = () => {
    if (step === 2) {
      const stepErrors = validateStep2()
      setErrors(stepErrors)
      if (Object.keys(stepErrors).length > 0) return
    }
    setStep((step + 1) as 1 | 2 | 3)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle>Add accommodation</DialogTitle>
          <Stepper step={step} />
        </DialogHeader>

        <div className="px-5 py-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <>
              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                Step 1 of 3 · Find the student
              </p>

              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  autoFocus
                  type="search"
                  placeholder="Search by name or student ID…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </InputGroup>

              {query.trim() === '' && (
                <p className="text-xs text-muted-foreground italic">
                  Start typing to find a student.
                </p>
              )}

              {query.trim() !== '' && matched.length === 0 && (
                <EmptyState
                  icon="fa-magnifying-glass"
                  title="No students match"
                  description="Try a different name or ID. Roster syncs from PRISM."
                  align="center"
                />
              )}

              {matched.length > 0 && (
                <ul className="flex flex-col divide-y divide-border rounded-lg border border-border overflow-hidden">
                  {matched.map(s => {
                    const existing = facultyAccommodations.filter(a => a.studentId === s.id).length
                    const isSelected = studentId === s.id
                    return (
                      <li key={s.id}>
                        <Button
                          variant="ghost"
                          onClick={() => setStudentId(s.id)}
                          className={`w-full flex items-center justify-start h-auto gap-3 px-3 py-2.5 text-start whitespace-normal rounded-none ${
                            isSelected ? 'bg-muted' : ''
                          }`}
                        >
                          <div
                            className="flex size-7 items-center justify-center rounded-full shrink-0 text-[10px] font-bold"
                            style={{
                              background: 'color-mix(in oklch, var(--foreground) 8%, var(--background))',
                              color: 'color-mix(in oklch, var(--foreground) 70%, var(--background))',
                            }}
                          >
                            {s.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{s.firstName} {s.lastName}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.studentId} · {s.cohort}
                            </p>
                          </div>
                          {existing > 0 && (
                            <span
                              className="text-[10px] uppercase tracking-wider font-semibold rounded px-1.5 py-0.5"
                              style={{
                                backgroundColor: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))',
                                color: 'color-mix(in oklch, var(--chart-4) 80%, var(--foreground))',
                              }}
                            >
                              ⚠ {existing} existing
                            </span>
                          )}
                          {isSelected && (
                            <i className="fa-solid fa-check text-chart-2" aria-hidden="true" />
                          )}
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          )}

          {step === 2 && selectedStudent && (
            <>
              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                Step 2 of 3 · Type and detail
              </p>

              <p className="text-xs text-muted-foreground">
                For: <span className="text-foreground font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</span> · {selectedStudent.studentId}
                {existingForSelected > 0 && (
                  <span> · ⚠ {existingForSelected} existing accommodation{existingForSelected === 1 ? '' : 's'}</span>
                )}
              </p>

              <div className="flex flex-col gap-1.5">
                <Label>Accommodation type *</Label>
                <div className="grid grid-cols-5 gap-2">
                  {TYPE_OPTIONS.map(opt => {
                    const active = type === opt.value
                    return (
                      <Button
                        key={opt.value}
                        variant="ghost"
                        onClick={() => {
                          setType(opt.value)
                          if (detail === '' || Object.values(DEFAULT_DETAIL).includes(detail)) {
                            setDetail(DEFAULT_DETAIL[opt.value])
                          }
                        }}
                        aria-pressed={active}
                        className={`flex flex-col items-center justify-center gap-1.5 h-auto rounded-lg border p-3 whitespace-normal ${
                          active
                            ? 'border-foreground bg-muted'
                            : 'border-border hover:bg-muted/40'
                        }`}
                      >
                        <i className={`fa-light ${opt.icon} text-base`} aria-hidden="true" />
                        <span className="text-[10px] font-medium text-foreground text-center leading-tight">
                          {opt.label}
                        </span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              <FieldGroup>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="accomm-detail">Detail *</FieldLabel>
                  <Input
                    id="accomm-detail"
                    value={detail}
                    onChange={(e) => {
                      setDetail(e.target.value)
                      if (errors.detail) setErrors({ ...errors, detail: '' })
                    }}
                    placeholder="e.g. 1.5x time multiplier"
                    aria-required="true"
                    aria-invalid={!!errors.detail}
                    aria-describedby={errors.detail ? 'accomm-detail-error' : 'accomm-detail-desc'}
                  />
                  {errors.detail
                    ? <FieldError id="accomm-detail-error">{errors.detail}</FieldError>
                    : <FieldDescription id="accomm-detail-desc">Examples: &ldquo;1.5x&rdquo;, &ldquo;double time&rdquo;, &ldquo;+30 min&rdquo;</FieldDescription>
                  }
                </Field>

                <Field orientation="vertical">
                  <FieldLabel htmlFor="accomm-notes">Notes</FieldLabel>
                  <Textarea
                    id="accomm-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any context the proctor team should know…"
                    aria-describedby="accomm-notes-desc"
                  />
                  <FieldDescription id="accomm-notes-desc">Optional · shown to the proctor on briefing.</FieldDescription>
                </Field>
              </FieldGroup>
            </>
          )}

          {step === 3 && selectedStudent && (
            <>
              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                Step 3 of 3 · Where it applies
              </p>

              <LocalBanner
                variant="info"
                icon="fa-clipboard-check"
                title={`${selectedStudent.firstName} ${selectedStudent.lastName} · ${TYPE_OPTIONS.find(t => t.value === type)?.label}`}
              >
                {detail}
              </LocalBanner>

              <div className="flex flex-col gap-2">
                <Label>Applies to</Label>
                <RadioGroup
                  value={scope}
                  onValueChange={(v) => setScope(v as ScopeMode)}
                  className="flex flex-col gap-2"
                >
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <RadioGroupItem value="all-enrolled" id="scope-all" className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        All enrolled courses ({selectedStudent.enrolledCourseIds.length})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Recommended — accommodation follows the student wherever they go.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <RadioGroupItem value="specific-course" id="scope-specific" className="mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Specific course only</p>
                      {scope === 'specific-course' && (
                        <>
                          <Select value={specificCourseId} onValueChange={(v) => { setSpecificCourseId(v); if (errors.scope) setErrors({ ...errors, scope: '' }) }}>
                            <SelectTrigger
                              className="mt-1.5 w-full"
                              aria-invalid={!!errors.scope}
                              aria-describedby={errors.scope ? 'accomm-scope-error' : undefined}
                            >
                              <SelectValue placeholder="Select a course…" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedStudent.enrolledCourseIds.map(cid => {
                                const c = mockCourses.find(c => c.id === cid)
                                if (!c) return null
                                return <SelectItem key={cid} value={cid}>{c.code} · {c.name}</SelectItem>
                              })}
                            </SelectContent>
                          </Select>
                          {errors.scope && <FieldError id="accomm-scope-error">{errors.scope}</FieldError>}
                        </>
                      )}
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <Field orientation="vertical">
                <FieldLabel>Expiry</FieldLabel>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!expiryEnabled}
                    onChange={(e) => setExpiryEnabled(!e.target.checked)}
                  />
                  <span className="text-sm text-foreground">Never expires</span>
                </label>
                {expiryEnabled && (
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => {
                      setExpiryDate(e.target.value)
                      if (errors.expiryDate) setErrors({ ...errors, expiryDate: '' })
                    }}
                    aria-label="Expiry date"
                    aria-invalid={!!errors.expiryDate}
                    aria-describedby={errors.expiryDate ? 'accomm-expiry-error' : undefined}
                  />
                )}
                {errors.expiryDate && <FieldError id="accomm-expiry-error">{errors.expiryDate}</FieldError>}
              </Field>

              <p className="text-xs text-muted-foreground">
                Approver: <span className="text-foreground font-medium">{approverName}</span> · auto-stamped at submit
              </p>
            </>
          )}
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border flex-row justify-between sm:justify-between">
          {step > 1 ? (
            <Button variant="outline" size="sm" onClick={() => setStep((step - 1) as 1 | 2 | 3)}>
              ← Back
            </Button>
          ) : (
            <span aria-hidden="true" />
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleClose(false)}>Cancel</Button>
            {step < 3 ? (
              <Button
                variant="default"
                size="sm"
                disabled={step === 1 && !canAdvanceStep1}
                onClick={handleNext}
              >
                Next →
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Adding…' : 'Add'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const labels = ['Student', 'Accommodation', 'Scope']
  return (
    <div className="flex items-center gap-1.5 mt-2 text-[10px] uppercase tracking-wider font-semibold">
      {labels.map((label, i) => {
        const idx = (i + 1) as 1 | 2 | 3
        const active = idx === step
        const done = idx < step
        return (
          <span
            key={label}
            className="flex items-center gap-1.5"
          >
            <span
              className={`flex size-4 items-center justify-center rounded-full text-[9px] ${
                done   ? 'bg-chart-2 text-primary-foreground'
                : active ? 'bg-primary text-primary-foreground'
                :          'bg-muted text-muted-foreground'
              }`}
            >
              {done ? '✓' : idx}
            </span>
            <span className={active ? 'text-foreground' : 'text-muted-foreground'}>
              {label}
            </span>
            {i < labels.length - 1 && <span className="text-muted-foreground/50 mx-1">─</span>}
          </span>
        )
      })}
    </div>
  )
}
