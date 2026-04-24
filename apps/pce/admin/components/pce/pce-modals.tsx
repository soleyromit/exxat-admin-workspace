'use client'

import { useState } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Input, Label, Checkbox, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Popover, PopoverTrigger, PopoverContent, Separator, Avatar, AvatarFallback,
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
  const { createTemplate, updateTemplate } = usePce()
  const [name, setName] = useState(template?.name ?? '')
  const [hasFacultyPerf, setHasFacultyPerf] = useState(
    template ? template.sections.includes('faculty_performance') : true
  )
  const [hasCourseDir, setHasCourseDir] = useState(
    template ? template.sections.includes('course_director') : false
  )
  const [status, setStatus] = useState<'active' | 'draft'>(template?.status ?? 'active')

  const handleSave = () => {
    const sections: TemplateSection[] = ['course_content']
    if (hasFacultyPerf) sections.push('faculty_performance')
    if (hasCourseDir) sections.push('course_director')

    if (template) {
      updateTemplate(template.id, { name, sections, status })
    } else {
      createTemplate({ name, sections, status, questionCount: 0, createdBy: 'Dr. Thompson' })
    }
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 sm:max-w-96 flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>{template ? 'Edit Template' : 'New Template'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-6 py-5 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tmpl-name">Template name</Label>
            <Input
              id="tmpl-name"
              placeholder="e.g. Standard PCE"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label>Sections</Label>
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox checked disabled />
                  <span className="text-sm font-medium">Course Content</span>
                </div>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>required</span>
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

        <SheetFooter className="px-6 py-4 border-t border-border flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()} className="flex-1">
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
          <div
            className="rounded-lg px-4 py-3 text-sm flex items-start gap-2"
            style={{ backgroundColor: 'var(--pce-impact-bg)', border: '1px solid var(--pce-impact-border)' }}
          >
            <i className="fa-light fa-triangle-exclamation mt-0.5 shrink-0" aria-hidden="true" style={{ color: 'var(--destructive)' }} />
            <span style={{ color: 'var(--foreground)' }}>
              {template.usedBySurveyCount} {template.usedBySurveyCount === 1 ? 'survey uses' : 'surveys use'} this template.
            </span>
          </div>
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
  const [deadline, setDeadline] = useState('')
  const [primaryInstructorId, setPrimaryInstructorId] = useState('')

  const activeTemplates = templates.filter(t => t.status === 'active')
  const selectedCourse = MOCK_COURSES.find(c => c.code === courseCode)
  const selectedInstructor = MOCK_FACULTY.find(f => f.id === primaryInstructorId)

  const handleCreate = () => {
    if (!templateId || !courseCode || !primaryInstructorId) return
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
      deadline: deadline || 'TBD',
    })
    onOpenChange(false)
    setTemplateId(''); setCourseCode(''); setDeadline(''); setPrimaryInstructorId('')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 sm:max-w-96 flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>Create Survey</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-6 py-5 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cs-template">Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="cs-template" className="w-full">
                <SelectValue placeholder="Select a template…" />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cs-course">Course</Label>
            <Select value={courseCode} onValueChange={setCourseCode}>
              <SelectTrigger id="cs-course" className="w-full">
                <SelectValue placeholder="Select a course…" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_COURSES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Input
              id="cs-deadline"
              type="text"
              placeholder="e.g. May 30, 2026"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cs-instructor">Primary instructor</Label>
            <Select value={primaryInstructorId} onValueChange={setPrimaryInstructorId}>
              <SelectTrigger id="cs-instructor" className="w-full">
                <SelectValue placeholder="Select instructor…" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_FACULTY.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={!templateId || !courseCode || !primaryInstructorId}
            className="flex-1"
          >
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

  const handleAdd = () => {
    const f = MOCK_FACULTY.find(f => f.id === selectedId)
    if (!f) return
    addGuestInstructor(surveyId, { id: f.id, name: f.name, initials: f.initials })
    onOpenChange(false)
    setSelectedId('')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:max-w-80 flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>Add Guest Lecturer</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-6 py-5 flex-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guest-select">Instructor</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger id="guest-select" className="w-full">
                <SelectValue placeholder="Search faculty…" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_FACULTY.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
          <Button onClick={handleAdd} disabled={!selectedId} className="flex-1">Add Guest</Button>
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
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Email sent to {remaining} student{remaining !== 1 ? 's' : ''}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Send an email reminder to{' '}
              <strong>{remaining} student{remaining !== 1 ? 's' : ''}</strong> who haven&apos;t responded yet.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">Cancel</Button>
              <Button size="sm" className="flex-1" onClick={() => setSent(true)}>Send</Button>
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 sm:max-w-96 flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>Share with Faculty</SheetTitle>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {survey.courseCode} — {survey.term}
          </p>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-6 py-5 flex-1">
          {/* Summary preview */}
          <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              Summary Preview
            </p>
            {response ? (
              response.sectionScores.map(s => (
                <div key={s.section} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {s.section === 'course_content' ? 'Course Content' :
                     s.section === 'faculty_performance' ? 'Faculty Performance' : 'Course Director'}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">avg {s.avg}/5</span>
                </div>
              ))
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No responses yet.</p>
            )}
            <Separator />
            <ResponseGauge
              rate={survey.responseRate}
              responseCount={survey.responseCount}
              enrollmentCount={survey.enrollmentCount}
              showBar={false}
            />
          </div>

          {/* Instructor notice */}
          <div className="flex flex-col gap-2">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
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
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>guest</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
          <Button
            onClick={() => { releaseSurvey(survey.id); onOpenChange(false) }}
            className="flex-1"
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
          <Button onClick={() => { onConfirm(); onOpenChange(false) }}>
            Release {surveyIds.length === 1 ? 'Survey' : 'All'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
