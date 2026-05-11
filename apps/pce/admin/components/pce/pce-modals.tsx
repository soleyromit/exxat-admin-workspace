'use client'

import { useState } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Label, Checkbox, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Popover, PopoverTrigger, PopoverContent, Separator, Avatar, AvatarFallback,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Field, FieldError,
  LocalBanner,
  DatePickerField,
  formatDateUS,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { SurveyStatusBadge } from '@/components/pce/pce-badges'
import { ResponseGauge } from '@/components/pce/response-gauge'
import type { PceTemplate, PceSurvey, TemplateSection } from '@/lib/pce-mock-data'
import {
  MOCK_COURSES, MOCK_FACULTY, MOCK_TERMS, SECTION_LABELS, MOCK_RESPONSES,
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
      createTemplate({ name, sections, status, questionCount: 0, createdBy: 'Dr. Thompson' })
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
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
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

// ── SendReminderPopover ───────────────────────────────────────────────────────

interface SendReminderPopoverProps {
  survey: PceSurvey
  children: React.ReactNode
}

export function SendReminderPopover({ survey, children }: SendReminderPopoverProps) {
  const [sent, setSent] = useState(false)
  const remaining = survey.enrollmentCount - survey.responseCount

  return (
    <Popover onOpenChange={() => setSent(false)}>
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
            <div className="flex flex-row justify-end gap-2">
              <Button variant="ghost" size="sm">Cancel</Button>
              <Button variant="default" size="sm" onClick={() => setSent(true)}>Send</Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
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
          <SheetTitle>Share with Faculty</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {survey.courseCode} — {survey.term}
          </p>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-6 py-5 flex-1 overflow-y-auto">
          {/* Summary preview — Card slot composition (DS-adoption registry §Card) */}
          <Card size="sm">
            <CardHeader>
              <CardDescription className="uppercase tracking-wide text-[11px]">
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
            Share with Faculty
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
