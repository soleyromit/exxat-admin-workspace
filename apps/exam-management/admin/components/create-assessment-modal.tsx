'use client'

/**
 * CREATE ASSESSMENT MODAL — pre-step before the builder.
 *
 * Story:
 *   1. Basics — title, description, quick-start (blank/template/copy)
 *   2. Type & Time — proctored vs self-paced, duration, question target,
 *      results-publication mode
 *   3. Schedule — open/close window, section (deferrable)
 *
 * Submit creates a draft via `useAssessmentDrafts` and routes to
 * /assessment-builder?draftId={id}. The builder reads the param and sets
 * the new draft as activeAsmt.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Input, InputGroup, InputGroupInput, InputGroupAddon, InputGroupText,
  Field, FieldGroup, FieldLabel, FieldDescription, FieldError,
  Label,
  Textarea,
  RadioGroup, RadioGroupItem,
  Checkbox,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  LocalBanner,
} from '@exxat/ds/packages/ui/src'
import { useAssessmentDrafts } from '@/lib/assessment-draft-store'
import { mockCourses, mockCourseOfferings, mockAssessments } from '@/lib/qb-mock-data'

interface CreateAssessmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  /** Optional fixed offering — defaults to the most recent active. */
  offeringId?: string
}

type AssessmentMode = 'proctored' | 'self-paced'
type QuickStart = 'blank' | 'template' | 'copy'

export function CreateAssessmentModal({
  open, onOpenChange, courseId, offeringId,
}: CreateAssessmentModalProps) {
  const router = useRouter()
  const { addDraft } = useAssessmentDrafts()

  const course = mockCourses.find(c => c.id === courseId)
  const offerings = mockCourseOfferings.filter(o => o.courseId === courseId)
  const defaultOffering = offerings.find(o => o.semester.includes('2026')) ?? offerings[0]
  const resolvedOfferingId = offeringId ?? defaultOffering?.id ?? ''

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quickStart, setQuickStart] = useState<QuickStart>('blank')
  const [copyFromId, setCopyFromId] = useState<string>('')
  const [mode, setMode] = useState<AssessmentMode>('proctored')
  const [duration, setDuration] = useState(90)
  const [questionTarget, setQuestionTarget] = useState(80)
  const [holdForReview, setHoldForReview] = useState(true)
  const [scheduleNow, setScheduleNow] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('11:00')
  const [submitting, setSubmitting] = useState(false)
  // Validation surfacing — empty until user attempts Next/Create. Mirrors PCE
  // master-list dialogs (e.g. apps/pce/admin/app/(app)/admin/students/page.tsx).
  const [errors, setErrors] = useState<Record<string, string>>({})

  const reset = () => {
    setStep(1)
    setTitle('')
    setDescription('')
    setQuickStart('blank')
    setCopyFromId('')
    setMode('proctored')
    setDuration(90)
    setQuestionTarget(80)
    setHoldForReview(true)
    setScheduleNow(false)
    setStartDate('')
    setEndDate('')
    setSubmitting(false)
    setErrors({})
  }

  const handleClose = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const courseAssessments = mockAssessments.filter(a => a.courseId === courseId)

  // Per-step validators — only validate the fields the user has touched
  // by reaching that step (mirrors students/page.tsx onSave pattern).
  const validateStep1 = (): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Title is required.'
    return next
  }
  const validateStep2 = (): Record<string, string> => {
    const next: Record<string, string> = {}
    if (duration < 5) next.duration = 'Minimum 5 minutes.'
    if (questionTarget < 1) next.questionTarget = 'At least one question.'
    return next
  }
  const validateStep3 = (): Record<string, string> => {
    const next: Record<string, string> = {}
    if (scheduleNow) {
      if (!startDate) next.startDate = 'Start date is required when scheduling.'
      if (!endDate) next.endDate = 'End date is required when scheduling.'
      if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        next.endDate = 'End date must be on or after start date.'
      }
    }
    return next
  }

  const handleNext = () => {
    const stepErrors = step === 1 ? validateStep1() : step === 2 ? validateStep2() : {}
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length > 0) return
    setStep((step + 1) as 1 | 2 | 3)
  }

  const handleSubmit = () => {
    const allErrors = { ...validateStep1(), ...validateStep2(), ...validateStep3() }
    setErrors(allErrors)
    if (Object.keys(allErrors).length > 0) return
    if (!course || !resolvedOfferingId) return
    setSubmitting(true)

    // Seed difficulty distribution from quickStart copy (if any)
    let diffDistribution: Record<'Easy' | 'Medium' | 'Hard', number> = { Easy: 0, Medium: 0, Hard: 0 }
    if (quickStart === 'copy' && copyFromId) {
      const source = courseAssessments.find(a => a.id === copyFromId)
      if (source) diffDistribution = source.diffDistribution
    }

    const draft = addDraft({
      courseId,
      offeringId: resolvedOfferingId,
      title: title.trim(),
      questionCount: 0,    // populated as faculty adds questions in the builder
      durationMinutes: duration,
      diffDistribution,
    })

    reset()
    onOpenChange(false)
    router.push(`/assessment-builder?draftId=${draft.id}&courseId=${courseId}`)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle>New assessment</DialogTitle>
          <Stepper step={step} />
        </DialogHeader>

        <div className="px-5 py-4 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <>
              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                Step 1 of 3 · Name your assessment
              </p>

              <LocalBanner variant="info" icon="fa-lock">
                Course: <span className="text-foreground font-medium">{course?.name ?? '—'}</span>
                {' · '}
                <span className="font-mono">{course?.code ?? '—'}</span>
                {defaultOffering && (
                  <> · <span>{defaultOffering.semester}</span></>
                )}
                <span className="ms-1">· locked</span>
              </LocalBanner>

              <FieldGroup>
                <Field orientation="vertical">
                  <FieldLabel htmlFor="asmt-title">Title *</FieldLabel>
                  <Input
                    id="asmt-title"
                    autoFocus
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      if (errors.title) setErrors({ ...errors, title: '' })
                    }}
                    placeholder="e.g. IM Midterm 2026"
                    aria-required="true"
                    aria-invalid={!!errors.title}
                    aria-describedby={errors.title ? 'asmt-title-error' : undefined}
                  />
                  {errors.title && <FieldError id="asmt-title-error">{errors.title}</FieldError>}
                </Field>

                <Field orientation="vertical">
                  <FieldLabel htmlFor="asmt-desc">Description</FieldLabel>
                  <Textarea
                    id="asmt-desc"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Cumulative midterm covering modules 1–6."
                    aria-describedby="asmt-desc-desc"
                  />
                  <FieldDescription id="asmt-desc-desc">Optional · students will see this on the landing screen.</FieldDescription>
                </Field>
              </FieldGroup>

              <div className="flex flex-col gap-2">
                <Label>Quick start (optional)</Label>
                <RadioGroup
                  value={quickStart}
                  onValueChange={(v) => setQuickStart(v as QuickStart)}
                  className="flex flex-col gap-2"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer text-sm">
                    <RadioGroupItem value="blank" />
                    <span>Blank assessment</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-sm">
                    <RadioGroupItem value="copy" />
                    <span>Copy from existing</span>
                  </label>
                  {quickStart === 'copy' && (
                    <div className="ms-6">
                      <Select value={copyFromId} onValueChange={setCopyFromId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pick an existing assessment…" />
                        </SelectTrigger>
                        <SelectContent>
                          {courseAssessments.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </RadioGroup>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                Step 2 of 3 · How students take it
              </p>

              <div className="flex flex-col gap-2">
                <Label>Mode *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setMode('proctored')}
                    aria-pressed={mode === 'proctored'}
                    className={`flex flex-col items-start gap-1 h-auto rounded-lg border p-3 text-start whitespace-normal ${
                      mode === 'proctored' ? 'border-foreground bg-muted' : 'border-border hover:bg-muted/40'
                    }`}
                  >
                    <span className="text-sm font-semibold text-foreground">Proctored</span>
                    <span className="text-[11px] text-muted-foreground leading-snug">
                      Single window · lockdown ready · high-stakes
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setMode('self-paced')}
                    aria-pressed={mode === 'self-paced'}
                    className={`flex flex-col items-start gap-1 h-auto rounded-lg border p-3 text-start whitespace-normal ${
                      mode === 'self-paced' ? 'border-foreground bg-muted' : 'border-border hover:bg-muted/40'
                    }`}
                  >
                    <span className="text-sm font-semibold text-foreground">Self-paced</span>
                    <span className="text-[11px] text-muted-foreground leading-snug">
                      Open window · casual practice · low-stakes
                    </span>
                  </Button>
                </div>
              </div>

              <FieldGroup>
                <div className="flex gap-3">
                  <Field orientation="vertical" className="flex-1">
                    <FieldLabel htmlFor="asmt-duration">Allotted time</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="asmt-duration"
                        type="number"
                        min={5}
                        step={5}
                        value={duration}
                        onChange={(e) => {
                          setDuration(Math.max(5, parseInt(e.target.value) || 0))
                          if (errors.duration) setErrors({ ...errors, duration: '' })
                        }}
                        aria-invalid={!!errors.duration}
                        aria-describedby={errors.duration ? 'asmt-duration-error' : undefined}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>minutes</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    {errors.duration && <FieldError id="asmt-duration-error">{errors.duration}</FieldError>}
                  </Field>

                  <Field orientation="vertical" className="flex-1">
                    <FieldLabel htmlFor="asmt-target">Question count target</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="asmt-target"
                        type="number"
                        min={1}
                        step={5}
                        value={questionTarget}
                        onChange={(e) => {
                          setQuestionTarget(Math.max(1, parseInt(e.target.value) || 0))
                          if (errors.questionTarget) setErrors({ ...errors, questionTarget: '' })
                        }}
                        aria-invalid={!!errors.questionTarget}
                        aria-describedby={errors.questionTarget ? 'asmt-target-error' : undefined}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>questions</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    {errors.questionTarget && <FieldError id="asmt-target-error">{errors.questionTarget}</FieldError>}
                  </Field>
                </div>
              </FieldGroup>

              <p className="text-xs text-muted-foreground">
                Used for time-math in the builder. Adjust as you go.
              </p>

              <div className="flex flex-col gap-1.5 pt-2">
                <Label>Scoring</Label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={holdForReview}
                    onCheckedChange={(c) => setHoldForReview(c === true)}
                  />
                  <div>
                    <p className="text-sm text-foreground">Hold for faculty review (recommended for high-stakes)</p>
                    <p className="text-xs text-muted-foreground">
                      Default: 3-day review window before publishing results
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={!holdForReview}
                    onCheckedChange={(c) => setHoldForReview(c !== true)}
                  />
                  <div>
                    <p className="text-sm text-foreground">Show results immediately on submit (low-stakes only)</p>
                  </div>
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                Step 3 of 3 · When students take it
              </p>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <Checkbox
                  checked={scheduleNow}
                  onCheckedChange={(c) => setScheduleNow(c === true)}
                />
                <div>
                  <p className="text-sm text-foreground">Schedule now</p>
                  <p className="text-xs text-muted-foreground">
                    You can also do this later from the builder.
                  </p>
                </div>
              </label>

              {scheduleNow && (
                <FieldGroup>
                  <Field orientation="vertical">
                    <FieldLabel htmlFor="asmt-start-date">Starts</FieldLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="asmt-start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value)
                          if (errors.startDate) setErrors({ ...errors, startDate: '' })
                        }}
                        className="flex-1"
                        aria-invalid={!!errors.startDate}
                        aria-describedby={errors.startDate ? 'asmt-start-error' : undefined}
                      />
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-28"
                        aria-label="Start time"
                      />
                    </div>
                    {errors.startDate && <FieldError id="asmt-start-error">{errors.startDate}</FieldError>}
                  </Field>

                  <Field orientation="vertical">
                    <FieldLabel htmlFor="asmt-end-date">Ends</FieldLabel>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="asmt-end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value)
                          if (errors.endDate) setErrors({ ...errors, endDate: '' })
                        }}
                        className="flex-1"
                        aria-invalid={!!errors.endDate}
                        aria-describedby={errors.endDate ? 'asmt-end-error' : 'asmt-window-desc'}
                      />
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-28"
                        aria-label="End time"
                      />
                    </div>
                    {errors.endDate
                      ? <FieldError id="asmt-end-error">{errors.endDate}</FieldError>
                      : <FieldDescription id="asmt-window-desc">Time zone follows your account · you can change later.</FieldDescription>
                    }
                  </Field>
                </FieldGroup>
              )}

              <LocalBanner
                variant="info"
                icon="fa-clipboard-list-check"
                title={title || 'Untitled assessment'}
              >
                <p>
                  {course?.code ?? '—'} · {mode === 'proctored' ? 'Proctored' : 'Self-paced'} · {duration} min · target {questionTarget} Q
                </p>
                {scheduleNow && startDate && (
                  <p>
                    Opens {startDate} {startTime} · closes {endDate} {endTime}
                  </p>
                )}
              </LocalBanner>
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
                {submitting ? 'Creating…' : 'Create'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const labels = ['Basics', 'Type & Time', 'Schedule']
  return (
    <div className="flex items-center gap-1.5 mt-2 text-[10px] uppercase tracking-wider font-semibold">
      {labels.map((label, i) => {
        const idx = (i + 1) as 1 | 2 | 3
        const active = idx === step
        const done = idx < step
        return (
          <span key={label} className="flex items-center gap-1.5">
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
