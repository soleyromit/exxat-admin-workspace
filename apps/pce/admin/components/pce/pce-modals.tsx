'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Label, Checkbox, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Popover, PopoverTrigger, PopoverContent, Separator, Avatar, AvatarFallback,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Field, FieldError,
  LocalBanner,
  DatePickerField,
  formatDateUS,
} from '@exxatdesignux/ui'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { ResponseGauge } from '@/components/pce/response-gauge'
import type { PceTemplate, PceSurvey, TemplateSection, Student } from '@/lib/pce-mock-data'
import {
  MOCK_COURSES, MOCK_FACULTY, MOCK_TERMS, SECTION_LABELS, MOCK_RESPONSES,
  MOCK_STUDENTS, EVAL_EMAIL_TEMPLATES,
} from '@/lib/pce-mock-data'

// ── CreateTemplateSheet ───────────────────────────────────────────────────────

interface CreateTemplateSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  template?: PceTemplate
}

export function CreateTemplateSheet({ open, onOpenChange, template }: CreateTemplateSheetProps) {
  const { templates, createTemplate, updateTemplate } = usePce()
  const [name, setName] = useState(template?.name ?? '')
  const [hasFacultyPerf, setHasFacultyPerf] = useState(
    template ? template.sections.includes('faculty_performance') : true
  )
  const [hasCourseDir, setHasCourseDir] = useState(
    template ? template.sections.includes('course_director') : false
  )
  const [status, setStatus] = useState<'active' | 'draft'>(template?.status ?? 'active')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validation pattern: accommodations/page.tsx:96-126.
  // Errors render inline (FieldError + aria-invalid). Save blocks on failure.
  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    const trimmed = name.trim()
    if (!trimmed) {
      next.name = 'Template name is required.'
    } else {
      const conflict = templates.some(t =>
        t.name.trim().toLowerCase() === trimmed.toLowerCase() && t.id !== template?.id
      )
      if (conflict) next.name = 'A template with this name already exists.'
    }
    return next
  }

  const handleSave = () => {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const sections: TemplateSection[] = ['course_content']
    if (hasFacultyPerf) sections.push('faculty_performance')
    if (hasCourseDir) sections.push('course_director')

    if (template) {
      updateTemplate(template.id, { name, sections, status })
    } else {
      createTemplate({ name, sections, status, questionCount: 0, createdBy: 'Dr. Thompson', questions: { course_content: [], faculty_performance: [], course_director: [] }, likertPointer: 5 })
    }
    setErrors({})
    onOpenChange(false)
  }

  function handleOpenChange(v: boolean) {
    onOpenChange(v)
    if (!v) setErrors({})
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-96 sm:max-w-96 flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>{template ? 'Edit Template' : 'New Template'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-6 py-5 flex-1 overflow-y-auto">
          <Field orientation="vertical">
            <Label htmlFor="tmpl-name">Template name</Label>
            <Input
              id="tmpl-name"
              placeholder="e.g. Standard PCE"
              value={name}
              onChange={e => setName(e.target.value)}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'tmpl-name-error' : undefined}
            />
            {errors.name && <FieldError id="tmpl-name-error">{errors.name}</FieldError>}
          </Field>

          <div className="flex flex-col gap-3">
            <Label>Sections</Label>
            <div className="flex flex-col gap-2 rounded-md bg-muted p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox checked disabled aria-label="Course Content (required section, cannot be unchecked)" />
                  <span className="text-sm font-medium">Course Content</span>
                </div>
                <span className="text-xs text-muted-foreground">required</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="fp"
                  checked={hasFacultyPerf}
                  onCheckedChange={v => setHasFacultyPerf(!!v)}
                />
                <Label htmlFor="fp" className="font-normal cursor-pointer">Faculty Performance</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cd"
                  checked={hasCourseDir}
                  onCheckedChange={v => setHasCourseDir(!!v)}
                />
                <Label htmlFor="cd" className="font-normal cursor-pointer">Course Director</Label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tmpl-status">Status</Label>
            <Select value={status} onValueChange={v => setStatus(v as 'active' | 'draft')}>
              <SelectTrigger id="tmpl-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="default" onClick={handleSave} disabled={!name.trim()}>
            {template ? 'Save Changes' : 'Create Template'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── DeleteTemplateDialog ──────────────────────────────────────────────────────

interface DeleteTemplateDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  template: PceTemplate | null
}

export function DeleteTemplateDialog({ open, onOpenChange, template }: DeleteTemplateDialogProps) {
  const { deleteTemplate } = usePce()

  if (!template) return null

  const hasActiveSurveys = template.usedBySurveyCount > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{template.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            {hasActiveSurveys
              ? `This template is used by ${template.usedBySurveyCount} ${template.usedBySurveyCount === 1 ? 'survey' : 'surveys'}. Deleting it will not affect existing surveys, but you won't be able to create new surveys from it.`
              : 'This template is not used by any active surveys and will be permanently removed.'
            }
          </DialogDescription>
        </DialogHeader>
        {hasActiveSurveys && (
          <LocalBanner variant="warning" title="In use">
            {template.usedBySurveyCount} {template.usedBySurveyCount === 1 ? 'survey uses' : 'surveys use'} this template.
          </LocalBanner>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => { deleteTemplate(template.id); onOpenChange(false) }}
          >
            {hasActiveSurveys ? 'Delete anyway' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── CreateSurveySheet ─────────────────────────────────────────────────────────

interface CreateSurveySheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function CreateSurveySheet({ open, onOpenChange }: CreateSurveySheetProps) {
  const { templates, createSurvey } = usePce()
  const [templateId, setTemplateId] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [term, setTerm] = useState('Spring 2026')
  const [deadline, setDeadline] = useState<Date | undefined>(undefined)
  const [primaryInstructorId, setPrimaryInstructorId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const activeTemplates = templates.filter(t => t.status === 'active')
  const selectedCourse = MOCK_COURSES.find(c => c.code === courseCode)
  const selectedInstructor = MOCK_FACULTY.find(f => f.id === primaryInstructorId)

  // Validation pattern: accommodations/page.tsx:96-126.
  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    if (!templateId) next.templateId = 'Pick a template.'
    if (!courseCode) next.courseCode = 'Pick a course.'
    if (!primaryInstructorId) next.primaryInstructorId = 'Pick a primary instructor.'
    return next
  }

  const handleCreate = () => {
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return
    createSurvey({
      courseCode,
      courseName: selectedCourse?.name ?? courseCode,
      term,
      templateId,
      status: 'draft',
      instructors: selectedInstructor
        ? [{ ...selectedInstructor, role: 'primary' }]
        : [],
      enrollmentCount: 30,
      deadline: deadline ? formatDateUS(deadline.toISOString()) : 'TBD',
    })
    setErrors({})
    onOpenChange(false)
    setTemplateId(''); setCourseCode(''); setDeadline(undefined); setPrimaryInstructorId('')
  }

  function handleOpenChange(v: boolean) {
    onOpenChange(v)
    if (!v) setErrors({})
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-96 sm:max-w-96 flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>Create Survey</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-6 py-5 flex-1 overflow-y-auto">
          {Object.keys(errors).length >= 2 && (
            <LocalBanner variant="error" title="Fix the following before saving">
              {Object.keys(errors).length} fields need attention.
            </LocalBanner>
          )}

          <Field orientation="vertical">
            <Label htmlFor="cs-template">Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger
                id="cs-template"
                className="w-full"
                aria-invalid={!!errors.templateId}
                aria-describedby={errors.templateId ? 'cs-template-error' : undefined}
              >
                <SelectValue placeholder="Select a template…" />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.templateId && <FieldError id="cs-template-error">{errors.templateId}</FieldError>}
          </Field>

          <Field orientation="vertical">
            <Label htmlFor="cs-course">Course</Label>
            <Select value={courseCode} onValueChange={setCourseCode}>
              <SelectTrigger
                id="cs-course"
                className="w-full"
                aria-invalid={!!errors.courseCode}
                aria-describedby={errors.courseCode ? 'cs-course-error' : undefined}
              >
                <SelectValue placeholder="Select a course…" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_COURSES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.courseCode && <FieldError id="cs-course-error">{errors.courseCode}</FieldError>}
          </Field>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cs-term">Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger id="cs-term" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOCK_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cs-deadline">Response deadline</Label>
            <DatePickerField
              id="cs-deadline"
              value={deadline}
              onChange={setDeadline}
            />
          </div>

          <Field orientation="vertical">
            <Label htmlFor="cs-instructor">Primary instructor</Label>
            <Select value={primaryInstructorId} onValueChange={setPrimaryInstructorId}>
              <SelectTrigger
                id="cs-instructor"
                className="w-full"
                aria-invalid={!!errors.primaryInstructorId}
                aria-describedby={errors.primaryInstructorId ? 'cs-instructor-error' : undefined}
              >
                <SelectValue placeholder="Select instructor…" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_FACULTY.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.primaryInstructorId && (
              <FieldError id="cs-instructor-error">{errors.primaryInstructorId}</FieldError>
            )}
          </Field>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="default" onClick={handleCreate}>
            Create Survey
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── AddGuestSheet ─────────────────────────────────────────────────────────────

interface AddGuestSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  surveyId: string
}

export function AddGuestSheet({ open, onOpenChange, surveyId }: AddGuestSheetProps) {
  const { addGuestInstructor } = usePce()
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    if (!selectedId) {
      setError('Pick an instructor.')
      return
    }
    const f = MOCK_FACULTY.find(f => f.id === selectedId)
    if (!f) {
      setError('Pick an instructor.')
      return
    }
    addGuestInstructor(surveyId, { id: f.id, name: f.name, initials: f.initials })
    setError(null)
    onOpenChange(false)
    setSelectedId('')
  }

  function handleOpenChange(v: boolean) {
    onOpenChange(v)
    if (!v) setError(null)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-80 sm:max-w-80 flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>Add Guest Lecturer</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-6 py-5 flex-1">
          <Field orientation="vertical">
            <Label htmlFor="guest-select">Instructor</Label>
            <Select value={selectedId} onValueChange={(v) => { setSelectedId(v); setError(null) }}>
              <SelectTrigger
                id="guest-select"
                className="w-full"
                aria-invalid={!!error}
                aria-describedby={error ? 'guest-select-error' : undefined}
              >
                <SelectValue placeholder="Search faculty…" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_FACULTY.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <FieldError id="guest-select-error">{error}</FieldError>}
          </Field>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="default" onClick={handleAdd}>Add Guest</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── CloseSurveyDialog ─────────────────────────────────────────────────────────

interface CloseSurveyDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  survey: PceSurvey | null
}

export function CloseSurveyDialog({ open, onOpenChange, survey }: CloseSurveyDialogProps) {
  const { closeSurvey } = usePce()
  if (!survey) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close survey?</DialogTitle>
          <DialogDescription>
            Closing {survey.courseCode} will stop accepting new responses. The survey will move to
            Pending Review before faculty can see results. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { closeSurvey(survey.id); onOpenChange(false) }}>
            Close Survey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Reminder guard-rail helpers ───────────────────────────────────────────────
// The confirm quotes when the last reminder went out and when the next scheduled
// one fires, so the admin can self-govern against double-nudging students.

function daysSinceIso(iso?: string): number | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const diff = Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86_400_000)
  return diff >= 0 ? diff : null
}

function daysUntilIso(iso?: string): number | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  const diff = Math.ceil((new Date(y, m - 1, d).getTime() - Date.now()) / 86_400_000)
  return diff >= 0 ? diff : null
}

const dayPhrase = (n: number, future = false) =>
  n === 0 ? (future ? 'later today' : 'today') : future ? `in ${n} day${n !== 1 ? 's' : ''}` : `${n} day${n !== 1 ? 's' : ''} ago`

/** One-sentence guard rail for a selection of surveys. Null when nothing to say. */
function reminderGuardrail(surveys: PceSurvey[]): string | null {
  if (surveys.length === 1) {
    const s = surveys[0]
    const last = daysSinceIso(s.lastReminderSentAt)
    const next = daysUntilIso(s.nextScheduledReminderAt)
    if (last != null && next != null)
      return `The last reminder went out ${dayPhrase(last)} and the next scheduled reminder goes out ${dayPhrase(next, true)}.`
    if (last != null) return `The last reminder went out ${dayPhrase(last)}.`
    if (next != null) return `The next scheduled reminder goes out ${dayPhrase(next, true)}.`
    return 'No reminder has been sent for this survey yet.'
  }
  const lastDays = surveys
    .map(s => daysSinceIso(s.lastReminderSentAt))
    .filter((n): n is number => n != null)
  const neverCount = surveys.length - lastDays.length
  if (lastDays.length === 0) return 'None of the selected surveys have been reminded yet.'
  const mostRecent = Math.min(...lastDays)
  const neverPart = neverCount > 0 ? ` ${neverCount} of them ${neverCount === 1 ? 'has' : 'have'} never been reminded.` : ''
  return `The most recent reminder across these courses went out ${dayPhrase(mostRecent)}.${neverPart}`
}

// ── SendReminderPopover ───────────────────────────────────────────────────────

interface SendReminderPopoverProps {
  survey: PceSurvey
  children: React.ReactNode
}

export function SendReminderPopover({ survey, children }: SendReminderPopoverProps) {
  const { sendSurveyReminder } = usePce()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const remaining = survey.enrollmentCount - survey.responseCount
  const guardrail = reminderGuardrail([survey])

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) setSent(false) }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        {sent ? (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <i className="fa-light fa-circle-check text-2xl" aria-hidden="true" style={{ color: 'var(--pce-status-released-fg)' }} />
            <p className="text-sm font-medium">Reminder sent</p>
            <p className="text-xs text-muted-foreground">
              Email sent to {remaining} student{remaining !== 1 ? 's' : ''}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Send an email reminder to{' '}
              <strong>{remaining} student{remaining !== 1 ? 's' : ''}</strong> who haven&apos;t responded yet.
            </p>
            {guardrail && (
              <p className="text-xs text-muted-foreground">{guardrail}</p>
            )}
            <div className="flex flex-row justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => { sendSurveyReminder([survey.id]); setSent(true) }}
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ── SendReminderDialog (single or bulk — table row action + bulk bar) ─────────

interface SendReminderDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  surveys: PceSurvey[]
  /** Called after send with the course codes — hosts show their own banner. */
  onSent?: (courseCodes: string) => void
}

/* Deterministic non-responder roster per survey (mock — responses stay
 * anonymous; completion status is tracked separately, which is what makes
 * targeted reminders possible without de-anonymizing answers). */
function hashStr(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h
}

function nonRespondersFor(s: PceSurvey): { students: Student[]; count: number } {
  const pool = MOCK_STUDENTS.filter(st => !s.cohort || st.cohort === s.cohort)
  const list = pool.length > 0 ? pool : MOCK_STUDENTS
  const count = Math.max(0, s.enrollmentCount - s.responseCount)
  const start = list.length > 0 ? hashStr(s.id) % list.length : 0
  const students = Array.from(
    { length: Math.min(count, list.length) },
    (_, i) => list[(start + i) % list.length],
  )
  return { students, count }
}

const REMINDER_TEMPLATES = EVAL_EMAIL_TEMPLATES.filter(t => t.type === 'reminder')

/** Full reminder WORKFLOW (was a bare confirm): who receives it, per course ·
 *  which email template goes out (live preview + merge fields) · where it sits
 *  against the scheduled cadence. Same props as before, so the hub's single-row
 *  and bulk paths and the dashboard all share this one flow. */
export function SendReminderDialog({ open, onOpenChange, surveys, onSent }: SendReminderDialogProps) {
  const { sendSurveyReminder } = usePce()
  const [templateId, setTemplateId] = useState(REMINDER_TEMPLATES[0]?.id ?? '')
  if (surveys.length === 0) return null

  const bulk = surveys.length > 1
  const nonResponders = surveys.reduce((n, s) => n + Math.max(0, s.enrollmentCount - s.responseCount), 0)
  const guardrail = reminderGuardrail(surveys)
  const template = REMINDER_TEMPLATES.find(t => t.id === templateId) ?? REMINDER_TEMPLATES[0]

  function handleSend() {
    sendSurveyReminder(surveys.map(s => s.id))
    onSent?.(surveys.map(s => s.courseCode).join(', '))
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showOverlay={false}
        showCloseButton={false}
        className="w-full sm:max-w-[560px] flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>
            {bulk ? `Send reminders — ${surveys.length} courses` : `Send reminder — ${surveys[0].courseCode}`}
          </SheetTitle>
          <SheetDescription>
            Out-of-schedule email to students who haven’t responded. Responses stay anonymous —
            completion status is tracked separately.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto flex flex-col gap-5 px-4">
          {/* ── Recipients — who actually gets this email ── */}
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">
              Recipients
              <span className="text-muted-foreground font-normal tabular-nums">
                {' '}· {nonResponders} student{nonResponders !== 1 ? 's' : ''}
              </span>
            </h3>
            <div className="rounded-lg border border-border overflow-hidden">
              {surveys.map((s, si) => {
                const { students, count } = nonRespondersFor(s)
                const shown = students.slice(0, bulk ? 3 : 6)
                const more = count - shown.length
                return (
                  <div key={s.id} className={si === surveys.length - 1 ? '' : 'border-b border-border'}>
                    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/40">
                      <p className="text-xs font-medium">
                        {s.courseCode}
                        <span className="text-muted-foreground font-normal"> — {s.courseName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {count} of {s.enrollmentCount} pending
                      </p>
                    </div>
                    {shown.map(st => (
                      <div key={st.id} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                        <span className="text-sm truncate">{st.firstName} {st.lastName}</span>
                        <span className="text-xs text-muted-foreground truncate">{st.email}</span>
                      </div>
                    ))}
                    {more > 0 && (
                      <p className="px-3 pb-2 text-xs text-muted-foreground tabular-nums">
                        +{more} more student{more !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Email template — what they receive ── */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="reminder-template" className="text-sm font-medium">
                Email template
              </Label>
              <Button variant="ghost" size="sm" asChild className="px-0 text-muted-foreground hover:text-foreground">
                <Link href="/admin/email-templates">
                  Manage templates
                  <i className="fa-light fa-arrow-right" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <Select value={template?.id ?? ''} onValueChange={setTemplateId}>
              <SelectTrigger id="reminder-template" className="h-8 text-sm" aria-label="Reminder email template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {template && (
              <div className="rounded-lg border border-border px-3 py-2.5 flex flex-col gap-1.5">
                <p className="text-sm font-medium">{template.subject}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-line">{template.body}</p>
                <p className="text-xs text-muted-foreground border-t border-border pt-1.5 mt-0.5">
                  {'{{merge_fields}}'} fill per student and course at send time.
                </p>
              </div>
            )}
          </section>

          {/* ── Cadence guardrail — where this sits against the schedule ── */}
          {guardrail && (
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-bell" aria-hidden="true" /> {guardrail}
            </p>
          )}
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="outline" size="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="default" size="default" onClick={handleSend}>
            Send {nonResponders} email{nonResponders !== 1 ? 's' : ''}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── EditEndDateDialog (single or bulk) ────────────────────────────────────────
// The extend-close-date flow (live pce-three "Edit End Dates"). Reminders are
// anchored to the close date, so the dialog states that impact explicitly.

interface EditEndDateDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  surveys: PceSurvey[]
}

export function EditEndDateDialog({ open, onOpenChange, surveys }: EditEndDateDialogProps) {
  const { extendSurveyDeadline } = usePce()
  const [newDate, setNewDate] = useState<Date | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  if (surveys.length === 0) return null

  const bulk = surveys.length > 1
  const codes = surveys.map(s => s.courseCode)
  const shownCodes = codes.slice(0, 4).join(', ') + (codes.length > 4 ? ` +${codes.length - 4} more` : '')

  function handleOpenChange(v: boolean) {
    onOpenChange(v)
    if (!v) { setNewDate(undefined); setError(null) }
  }

  function handleSave() {
    if (!newDate) {
      setError('Pick a new close date.')
      return
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (newDate < today) {
      setError('The new close date must be today or later.')
      return
    }
    const iso = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`
    extendSurveyDeadline(surveys.map(s => s.id), iso)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit close date{bulk ? 's' : ''}</DialogTitle>
          <DialogDescription>
            {bulk ? (
              <>Set a new close date for <strong>{surveys.length} surveys</strong> ({shownCodes}).</>
            ) : (
              <>
                <strong>{surveys[0].courseCode}</strong> currently closes{' '}
                <strong>{surveys[0].deadline}</strong>. Students can keep responding until the new date.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Field orientation="vertical">
          <Label htmlFor="eed-date">New close date</Label>
          <DatePickerField
            id="eed-date"
            value={newDate}
            onChange={(d) => { setNewDate(d); setError(null) }}
            aria-invalid={!!error}
            aria-describedby={error ? 'eed-date-error' : undefined}
          />
          {error && <FieldError id="eed-date-error">{error}</FieldError>}
        </Field>

        <p className="text-xs text-muted-foreground">
          Scheduled reminders are anchored to the close date — extending it shifts the remaining
          reminder schedule with it.
        </p>

        <DialogFooter>
          <Button variant="outline" size="default" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button variant="default" size="default" onClick={handleSave}>Save close date</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── ReleaseSheet ──────────────────────────────────────────────────────────────

interface ReleaseSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  survey: PceSurvey | null
}

export function ReleaseSheet({ open, onOpenChange, survey }: ReleaseSheetProps) {
  const { releaseSurvey } = usePce()
  if (!survey) return null

  const response = MOCK_RESPONSES.find(r => r.surveyId === survey.id)
  /* `response` represents a MOCK_RESPONSES entry with per-section averages.
     Its presence !== survey has responses. survey.responseCount is the truth
     on whether responses exist; section avgs only render if the mock supplies
     them. */
  const hasResponses = survey.responseCount > 0
  const hasSectionAvgs = Boolean(response?.sectionScores?.length)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 sm:max-w-96 flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>Release responses</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {survey.courseCode} — {survey.term}
          </p>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-6 py-5 flex-1 overflow-y-auto">
          {/* Summary preview — Card slot composition (DS-adoption registry §Card) */}
          <Card size="sm">
            <CardHeader>
              <CardDescription className="text-xs font-medium">
                Summary Preview
              </CardDescription>
              <CardTitle className="text-base font-semibold">
                {hasResponses
                  ? `${survey.responseCount} of ${survey.enrollmentCount} responded (${survey.responseRate}%)`
                  : 'No responses yet'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {hasResponses && (
                <ResponseGauge
                  rate={survey.responseRate}
                  responseCount={survey.responseCount}
                  enrollmentCount={survey.enrollmentCount}
                  showBar
                />
              )}
              {hasSectionAvgs && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-1.5">
                    {response!.sectionScores.map(s => (
                      <div key={s.section} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">
                          {s.section === 'course_content' ? 'Course Content' :
                           s.section === 'faculty_performance' ? 'Faculty Performance' : 'Course Director'}
                        </span>
                        <span className="text-sm font-semibold tabular-nums">avg {s.avg}/5</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {hasResponses && !hasSectionAvgs && (
                <p className="text-xs text-muted-foreground">
                  Section-level averages render after the response window closes.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Instructor notice */}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Once released, the following instructors will be able to view these results:
            </p>
            <div className="flex flex-col gap-1.5">
              {survey.instructors.map(i => (
                <div key={i.id} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-xs" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>{i.initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{i.name}</span>
                  {i.role === 'guest' && (
                    <span className="text-xs text-muted-foreground">guest</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DS Sheet footer convention: ghost Cancel left, primary action right.
            Not flex-1 on both — primary gets visual weight via solid variant. */}
        <SheetFooter className="px-6 py-4 border-t border-border flex flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={() => { releaseSurvey(survey.id); onOpenChange(false) }}
          >
            Release responses
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── ReleaseBulkDialog ─────────────────────────────────────────────────────────

interface ReleaseBulkDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  surveyIds: string[]
  onConfirm: () => void
}

export function ReleaseBulkDialog({ open, onOpenChange, surveyIds, onConfirm }: ReleaseBulkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Release {surveyIds.length} {surveyIds.length === 1 ? 'survey' : 'surveys'}?</DialogTitle>
          <DialogDescription>
            The selected {surveyIds.length === 1 ? 'survey' : `${surveyIds.length} surveys`} will be
            released and instructors will be notified by email.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="default" onClick={() => { onConfirm(); onOpenChange(false) }}>
            Release {surveyIds.length === 1 ? 'Survey' : 'All'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
