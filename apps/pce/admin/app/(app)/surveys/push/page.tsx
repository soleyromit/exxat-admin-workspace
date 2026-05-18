'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  Separator,
  SidebarTrigger,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Checkbox,
  LocalBanner,
  DatePickerField,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { TemplateSectionChips } from '@/components/pce/pce-badges'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  MOCK_FACULTY,
  MOCK_MASTER_COURSES,
  type PceTemplate,
  type ProgramTerm,
  type CourseOffering,
} from '@/lib/pce-mock-data'

function dateToYmd(d: Date | undefined): string {
  if (!d) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Step = 1 | 2 | 3

export default function PushSurveyPage() {
  const router = useRouter()
  const { templates, createSurvey } = usePce()

  const [step, setStep] = useState<Step>(1)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTermId, setSelectedTermId] = useState<string>('')
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<Set<string>>(new Set())
  const [openDate, setOpenDate] = useState<Date | undefined>(undefined)
  const [closeDate, setCloseDate] = useState<Date | undefined>(undefined)
  const [dateError, setDateError] = useState<string | null>(null)

  const publishedTemplates = templates.filter(t => t.status === 'active')
  const selectedTemplate = publishedTemplates.find(t => t.id === selectedTemplateId) ?? null
  const activeTerms = MOCK_PROGRAM_TERMS.filter(t => t.status === 'active')
  const selectedTerm = activeTerms.find(t => t.id === selectedTermId) ?? null

  const offeringsForTerm = useMemo(
    () => selectedTermId
      ? MOCK_COURSE_OFFERINGS.filter(o => o.termId === selectedTermId && o.status !== 'archived')
      : [],
    [selectedTermId]
  )

  function toggleOffering(id: string) {
    setSelectedOfferingIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedOfferingIds.size === offeringsForTerm.length) {
      setSelectedOfferingIds(new Set())
    } else {
      setSelectedOfferingIds(new Set(offeringsForTerm.map(o => o.id)))
    }
  }

  function validateDates(): boolean {
    if (!openDate || !closeDate) {
      setDateError('Both open date and close date are required.')
      return false
    }
    if (closeDate <= openDate) {
      setDateError('Close date must be after open date.')
      return false
    }
    setDateError(null)
    return true
  }

  function handlePush() {
    if (!validateDates()) return
    if (!selectedTemplate || !selectedTerm) return
    const offerings = offeringsForTerm.filter(o => selectedOfferingIds.has(o.id))
    offerings.forEach(offering => {
      const masterCourse = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
      const faculty = MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId)
      createSurvey({
        courseCode: masterCourse?.code ?? offering.masterCourseId,
        courseName: masterCourse?.name ?? '',
        term: selectedTerm.name,
        templateId: selectedTemplate.id,
        status: 'collecting',
        instructors: faculty
          ? [{ id: faculty.id, name: faculty.name, initials: faculty.initials, role: 'primary' as const }]
          : [],
        enrollmentCount: offering.enrolledCount,
        deadline: dateToYmd(closeDate),
      })
    })
    router.push('/surveys?pushed=1')
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/surveys" className="text-sm text-muted-foreground hover:underline">Surveys</Link>
        <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <h1 className="text-sm font-semibold flex-1">Push survey</h1>
      </header>

      <div className="flex-1 overflow-auto" style={{ padding: '32px 28px 48px' }}>
        <div style={{ maxWidth: 640 }}>
          <StepIndicator step={step} />

          {step === 1 && (
            <Step1
              publishedTemplates={publishedTemplates}
              selectedTemplateId={selectedTemplateId}
              onSelect={setSelectedTemplateId}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <Step2
              activeTerms={activeTerms}
              selectedTermId={selectedTermId}
              offeringsForTerm={offeringsForTerm}
              selectedOfferingIds={selectedOfferingIds}
              onTermChange={v => { setSelectedTermId(v); setSelectedOfferingIds(new Set()) }}
              onToggleOffering={toggleOffering}
              onToggleAll={toggleAll}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && selectedTemplate && selectedTerm && (
            <Step3
              selectedTemplate={selectedTemplate}
              selectedTerm={selectedTerm}
              selectedCount={selectedOfferingIds.size}
              openDate={openDate}
              closeDate={closeDate}
              dateError={dateError}
              onOpenDateChange={setOpenDate}
              onCloseDateChange={setCloseDate}
              onDismissError={() => setDateError(null)}
              onBack={() => setStep(2)}
              onPush={handlePush}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { n: 1 as Step, label: 'Select template' },
    { n: 2 as Step, label: 'Select courses' },
    { n: 3 as Step, label: 'Set window' },
  ]
  return (
    <div className="flex items-center mb-8">
      {steps.map(({ n, label }, i) => (
        <div key={n} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-full text-xs font-semibold shrink-0"
              style={{
                width: 24, height: 24,
                background: step >= n ? 'var(--brand-color)' : 'var(--muted)',
                color: step >= n ? '#fff' : 'var(--muted-foreground)',
              }}
            >
              {step > n
                ? <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 10 }} />
                : n}
            </div>
            <span className="text-sm" style={{
              color: step === n ? 'var(--foreground)' : 'var(--muted-foreground)',
              fontWeight: step === n ? 600 : 400,
            }}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="mx-3" style={{ width: 32, height: 1, background: 'var(--border)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: Select template ───────────────────────────────────────────────────

interface Step1Props {
  publishedTemplates: PceTemplate[]
  selectedTemplateId: string | null
  onSelect: (id: string) => void
  onNext: () => void
}

function Step1({ publishedTemplates, selectedTemplateId, onSelect, onNext }: Step1Props) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">Select a template</h2>
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Only published templates can be used to push a survey.
      </p>
      {publishedTemplates.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center rounded-lg border border-dashed" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm font-medium">No published templates yet</p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Publish a template first, then push it as a survey.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/templates">Go to Templates</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {publishedTemplates.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className="flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors w-full"
              style={{
                borderColor: selectedTemplateId === t.id ? 'var(--brand-color)' : 'var(--border)',
                background: selectedTemplateId === t.id
                  ? 'color-mix(in oklch, var(--brand-color) 5%, var(--background))'
                  : 'var(--background)',
              }}
            >
              <div
                className="mt-0.5 rounded-full shrink-0"
                style={{
                  width: 18, height: 18,
                  border: selectedTemplateId === t.id ? '5px solid var(--brand-color)' : '2px solid var(--border)',
                  background: 'var(--background)',
                }}
              />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span className="text-sm font-medium">{t.name}</span>
                <div className="flex items-center gap-3 flex-wrap">
                  <TemplateSectionChips sections={t.sections} />
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {t.questionCount} question{t.questionCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Modified {t.lastModified}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="flex justify-end pt-2">
        <Button variant="default" size="sm" disabled={!selectedTemplateId} onClick={onNext}>
          Next
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>
    </div>
  )
}

// ── Step 2: Select term + courses ─────────────────────────────────────────────

interface Step2Props {
  activeTerms: ProgramTerm[]
  selectedTermId: string
  offeringsForTerm: CourseOffering[]
  selectedOfferingIds: Set<string>
  onTermChange: (v: string) => void
  onToggleOffering: (id: string) => void
  onToggleAll: () => void
  onBack: () => void
  onNext: () => void
}

function Step2({ activeTerms, selectedTermId, offeringsForTerm, selectedOfferingIds, onTermChange, onToggleOffering, onToggleAll, onBack, onNext }: Step2Props) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">Select term and course offerings</h2>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Term</label>
        <Select value={selectedTermId} onValueChange={onTermChange}>
          <SelectTrigger className="w-64" aria-label="Select term">
            <SelectValue placeholder="Choose a term…" />
          </SelectTrigger>
          <SelectContent>
            {activeTerms.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name} · {t.academicYear}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedTermId && (
        <>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm font-medium">
              Course offerings
              {selectedOfferingIds.size > 0 && (
                <span className="ml-2 font-normal" style={{ color: 'var(--muted-foreground)' }}>
                  — {selectedOfferingIds.size} selected
                </span>
              )}
            </p>
            {offeringsForTerm.length > 0 && (
              <button onClick={onToggleAll} className="text-xs underline" style={{ color: 'var(--brand-color)' }}>
                {selectedOfferingIds.size === offeringsForTerm.length ? 'Deselect all' : 'Select all'}
              </button>
            )}
          </div>
          {offeringsForTerm.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No active course offerings for this term.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {offeringsForTerm.map(offering => {
                const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
                const faculty = MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId)
                const checked = selectedOfferingIds.has(offering.id)
                return (
                  <label
                    key={offering.id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors"
                    style={{
                      borderColor: checked ? 'var(--brand-color)' : 'var(--border)',
                      background: checked ? 'color-mix(in oklch, var(--brand-color) 5%, var(--background))' : 'var(--background)',
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggleOffering(offering.id)}
                      aria-label={`Select ${course?.code ?? offering.id}`}
                    />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="text-sm font-medium">{course?.code} — {course?.name}</span>
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {faculty?.name ?? 'Unassigned'} · {offering.enrolledCount} enrolled · {offering.cohort}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </>
      )}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" disabled={selectedOfferingIds.size === 0} onClick={onNext}>
          Next
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>
    </div>
  )
}

// ── Step 3: Set window + review ───────────────────────────────────────────────

interface Step3Props {
  selectedTemplate: PceTemplate
  selectedTerm: ProgramTerm
  selectedCount: number
  openDate: Date | undefined
  closeDate: Date | undefined
  dateError: string | null
  onOpenDateChange: (d: Date | undefined) => void
  onCloseDateChange: (d: Date | undefined) => void
  onDismissError: () => void
  onBack: () => void
  onPush: () => void
}

function Step3({ selectedTemplate, selectedTerm, selectedCount, openDate, closeDate, dateError, onOpenDateChange, onCloseDateChange, onDismissError, onBack, onPush }: Step3Props) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold">Set distribution window</h2>
      {dateError && (
        <LocalBanner variant="error" dismissible onDismiss={onDismissError}>
          {dateError}
        </LocalBanner>
      )}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Opens on</label>
          <DatePickerField value={openDate} onChange={onOpenDateChange} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Closes on</label>
          <DatePickerField value={closeDate} onChange={onCloseDateChange} />
        </div>
      </div>
      <div className="rounded-lg border border-border p-4 flex flex-col gap-3" style={{ background: 'var(--muted)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>Summary</p>
        <div className="flex flex-col gap-2 text-sm">
          <SummaryRow label="Template" value={selectedTemplate.name} />
          <SummaryRow label="Term" value={selectedTerm.name} />
          <SummaryRow label="Courses" value={`${selectedCount} course offering${selectedCount !== 1 ? 's' : ''}`} />
          <SummaryRow
            label="Window"
            value={`${openDate ? openDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} → ${closeDate ? closeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}`}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" onClick={onPush}>
          <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 12 }} />
          Push survey
        </Button>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span style={{ color: 'var(--muted-foreground)', minWidth: 80 }}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
