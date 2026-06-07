'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Field, FieldLabel, FieldError,
  Input,
  Badge,
  RadioGroup, RadioGroupItem,
  Separator,
  DatePickerField,
} from '@exxatdesignux/ui'
import { useAssessmentDrafts } from '@/lib/assessment-draft-store'
import { mockCourses, mockCourseOfferings, mockAssessments } from '@/lib/qb-mock-data'
import type { AssessmentType } from '@/lib/qb-types'

type BlueprintMode = 'scratch' | 'template' | 'ai'

interface CreateAssessmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  offeringId?: string
}

const TYPES: { value: AssessmentType; icon: string; label: string; description: string }[] = [
  {
    value: 'Exam',
    icon: 'fa-file-certificate',
    label: 'Exam',
    description: 'Formal and proctored. Goes through 2-level review before publishing.',
  },
  {
    value: 'Quiz',
    icon: 'fa-clipboard-question',
    label: 'Quiz',
    description: 'Low-stakes. Publish directly when ready — no review required.',
  },
]

const BLUEPRINTS: { value: BlueprintMode; icon: string; label: string; description: string }[] = [
  {
    value: 'scratch',
    icon: 'fa-file-pen',
    label: 'Start from scratch',
    description: 'Define sections and add questions manually.',
  },
  {
    value: 'template',
    icon: 'fa-copy',
    label: 'Use past assessment',
    description: 'Copy section structure from a previous exam.',
  },
  {
    value: 'ai',
    icon: 'fa-sparkles',
    label: 'Generate with AI',
    description: 'Describe a topic and Leo drafts a full question set.',
  },
]

export function CreateAssessmentModal({
  open, onOpenChange, courseId, offeringId,
}: CreateAssessmentModalProps) {
  const router = useRouter()
  const { addDraft } = useAssessmentDrafts()

  const course = mockCourses.find(c => c.id === courseId)
  const offerings = mockCourseOfferings.filter(o => o.courseId === courseId)
  const resolvedOfferingId = offeringId ?? offerings[0]?.id ?? ''
  const prevAssessments = mockAssessments.filter(a => a.courseId === courseId)

  const [type, setType] = useState<AssessmentType>('Exam')
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [visibleDate, setVisibleDate] = useState<Date | undefined>()
  const [opensDate, setOpensDate] = useState<Date | undefined>()
  const [cutoffDate, setCutoffDate] = useState<Date | undefined>()
  const [blueprintMode, setBlueprintMode] = useState<BlueprintMode>('scratch')
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setType('Exam')
    setName('')
    setNameError('')
    setVisibleDate(undefined)
    setOpensDate(undefined)
    setCutoffDate(undefined)
    setBlueprintMode('scratch')
    setTemplateId(null)
    setSubmitting(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleCreate = () => {
    if (!name.trim()) {
      setNameError('Name is required.')
      return
    }
    if (!course || !resolvedOfferingId) return
    setSubmitting(true)

    const draft = addDraft({
      courseId,
      offeringId: resolvedOfferingId,
      title: name.trim(),
      questionCount: 0,
      durationMinutes: type === 'Exam' ? 90 : 30,
      diffDistribution: { Easy: 0, Medium: 0, Hard: 0 },
    })

    reset()
    onOpenChange(false)
    router.push(`/assessment-builder?draftId=${draft.id}&courseId=${courseId}`)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 max-h-[90vh] flex flex-col">

        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-base">New assessment</DialogTitle>
          {course && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="secondary" className="gap-1 font-normal text-xs">
                <span className="font-medium text-foreground">{course.code}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground truncate max-w-[200px]">{course.name}</span>
              </Badge>
              <i
                className="fa-light fa-lock text-[10px] text-muted-foreground"
                aria-hidden="true"
                aria-label="Course is fixed to this context"
              />
            </div>
          )}
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 flex flex-col gap-6">

            {/* Type */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">
                Type <span className="text-destructive" aria-hidden="true">*</span>
              </p>
              <RadioGroup
                value={type}
                onValueChange={v => setType(v as AssessmentType)}
                className="gap-2"
                aria-label="Assessment type"
              >
                {TYPES.map(t => (
                  <label
                    key={t.value}
                    className="flex items-center gap-3 rounded-lg border border-border p-[10px_14px] cursor-pointer transition-colors has-[[data-state=checked]]:border-[var(--brand-color)] has-[[data-state=checked]]:bg-[var(--brand-tint)]"
                  >
                    <RadioGroupItem value={t.value} className="sr-only" />
                    <i
                      className={`fa-light ${t.icon} text-sm shrink-0 ${type === t.value ? 'text-[var(--brand-color)]' : 'text-muted-foreground'}`}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{t.label}</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">{t.description}</p>
                    </div>
                    {type === t.value && (
                      <i className="fa-solid fa-circle-check text-sm shrink-0 text-[var(--brand-color)]" aria-hidden="true" />
                    )}
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Name */}
            <Field orientation="vertical">
              <FieldLabel htmlFor="asmt-name">
                Name <span className="text-destructive" aria-hidden="true">*</span>
              </FieldLabel>
              <Input
                id="asmt-name"
                autoFocus
                value={name}
                onChange={e => { setName(e.target.value); if (nameError) setNameError('') }}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                placeholder={type === 'Exam' ? 'e.g. Midterm Examination 1' : 'e.g. Week 3 Check-in Quiz'}
                aria-required="true"
                aria-invalid={!!nameError}
                aria-describedby={nameError ? 'asmt-name-error' : undefined}
              />
              {nameError && <FieldError id="asmt-name-error">{nameError}</FieldError>}
            </Field>

            {/* Availability — 3-stage window per PRD §4.7.1 */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">Availability</p>
              <p className="text-xs text-muted-foreground mb-3">
                Set now or later in Settings. Three stages: card visible → exam opens → hard cutoff.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <Field orientation="vertical">
                  <FieldLabel className="text-xs">Visible date</FieldLabel>
                  <DatePickerField
                    value={visibleDate}
                    onChange={d => setVisibleDate(d ?? undefined)}
                  />
                </Field>
                <Field orientation="vertical">
                  <FieldLabel className="text-xs">Opens</FieldLabel>
                  <DatePickerField
                    value={opensDate}
                    onChange={d => setOpensDate(d ?? undefined)}
                  />
                </Field>
                <Field orientation="vertical">
                  <FieldLabel className="text-xs">Cutoff</FieldLabel>
                  <DatePickerField
                    value={cutoffDate}
                    onChange={d => setCutoffDate(d ?? undefined)}
                  />
                </Field>
              </div>
            </div>
          </div>

          <Separator />

          {/* Optional section */}
          <div className="px-6 py-5 flex flex-col gap-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Optional — configure now or after creating
            </p>

            {/* Blueprint method */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Start from</p>
              <RadioGroup
                value={blueprintMode}
                onValueChange={v => {
                  setBlueprintMode(v as BlueprintMode)
                  if (v !== 'template') setTemplateId(null)
                }}
                className="gap-2"
                aria-label="Blueprint starting point"
              >
                {BLUEPRINTS.map(b => (
                  <label
                    key={b.value}
                    className="flex items-center gap-3 rounded-lg border border-border p-[10px_14px] cursor-pointer transition-colors has-[[data-state=checked]]:border-[var(--brand-color)] has-[[data-state=checked]]:bg-[var(--brand-tint)]"
                  >
                    <RadioGroupItem value={b.value} className="sr-only" />
                    <i
                      className={`fa-light ${b.icon} text-sm shrink-0 ${blueprintMode === b.value ? 'text-[var(--brand-color)]' : 'text-muted-foreground'}`}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{b.label}</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">{b.description}</p>
                    </div>
                    {blueprintMode === b.value && (
                      <i className="fa-solid fa-circle-check text-sm shrink-0 text-[var(--brand-color)]" aria-hidden="true" />
                    )}
                  </label>
                ))}
              </RadioGroup>

              {/* Past assessment picker */}
              {blueprintMode === 'template' && (
                <div className="mt-2 rounded-lg border border-border overflow-hidden">
                  {prevAssessments.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-3 py-3">
                      No previous assessments found for this course.
                    </p>
                  ) : (
                    prevAssessments.map((pa, idx) => {
                      const isSelected = templateId === pa.id
                      return (
                        <Button
                          key={pa.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => setTemplateId(pa.id)}
                          className={[
                            'flex items-center gap-3 justify-start h-auto px-3 py-2.5 w-full rounded-none font-normal',
                            idx < prevAssessments.length - 1 ? 'border-b border-border' : '',
                            isSelected ? 'bg-[var(--brand-tint)] hover:bg-[var(--brand-tint)]' : '',
                          ].filter(Boolean).join(' ')}
                        >
                          <i
                            className={`${isSelected ? 'fa-solid fa-circle-check text-[var(--brand-color)]' : 'fa-light fa-circle text-muted-foreground'} text-xs shrink-0`}
                            aria-hidden="true"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-semibold text-foreground truncate">{pa.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {pa.questionCount}q · {pa.durationMinutes} min
                            </p>
                          </div>
                        </Button>
                      )
                    })
                  )}
                </div>
              )}

              {/* AI mode helper */}
              {blueprintMode === 'ai' && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5">
                  <i className="fa-light fa-circle-info text-xs text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    After creating, you&apos;ll describe your topic or upload a slide deck and Leo will draft the full question set for review.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3 border-t border-border shrink-0">
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="default" size="sm" disabled={submitting} onClick={handleCreate}>
            {submitting ? 'Creating…' : 'Create assessment'}
            {!submitting && (
              <i className="fa-light fa-arrow-right ms-1.5" aria-hidden="true" />
            )}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
