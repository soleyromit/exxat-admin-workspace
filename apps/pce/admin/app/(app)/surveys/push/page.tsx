'use client'

import { useState, useMemo } from 'react'
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
  Avatar,
  AvatarFallback,
  Badge,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
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

function fmtDate(d: Date | undefined): string {
  if (!d) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

type Step = 1 | 2 | 3 | 'success'

export default function PushSurveyPage() {
  const { templates, createSurvey } = usePce()

  const [step, setStep] = useState<Step>(1)
  const [selectedTermId, setSelectedTermId] = useState('')
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())
  const [templatePerOffering, setTemplatePerOffering] = useState<Record<string, string>>({})
  const [openDate, setOpenDate] = useState<Date | undefined>()
  const [closeDate, setCloseDate] = useState<Date | undefined>()
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [dateError, setDateError] = useState<string | null>(null)

  const activeTerms = MOCK_PROGRAM_TERMS.filter(t => t.status === 'active')
  const selectedTerm = activeTerms.find(t => t.id === selectedTermId) ?? null

  const offeringsForTerm = useMemo(
    () => selectedTermId
      ? MOCK_COURSE_OFFERINGS.filter(o => o.termId === selectedTermId && o.status !== 'archived')
      : [],
    [selectedTermId]
  )

  const selectedOfferings = offeringsForTerm.filter(o => !excludedIds.has(o.id))
  const publishedTemplates = templates.filter(t => t.status === 'active')

  const totalEnrolled = selectedOfferings.reduce((sum, o) => sum + o.enrolledCount, 0)
  const assignedCount = selectedOfferings.filter(o => !!templatePerOffering[o.id]).length
  const uniqueTemplateNames = Array.from(new Set(
    selectedOfferings
      .map(o => publishedTemplates.find(t => t.id === templatePerOffering[o.id])?.name)
      .filter((n): n is string => !!n)
  ))

  function toggleOffering(id: string) {
    setExcludedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function buildAutoTemplates(offerings: CourseOffering[]): Record<string, string> {
    const result: Record<string, string> = {}
    if (publishedTemplates.length === 0) return result
    const single = publishedTemplates.length === 1 ? publishedTemplates[0] : null
    for (const offering of offerings) {
      if (single) {
        result[offering.id] = single.id
      } else {
        const matched = offering.courseType
          ? publishedTemplates.find(t => t.courseType === offering.courseType)
          : undefined
        result[offering.id] = (matched ?? publishedTemplates[0]).id
      }
    }
    return result
  }

  function handleTermChange(v: string) {
    setSelectedTermId(v)
    setExcludedIds(new Set())
    setTemplatePerOffering({})
  }

  function handleGoToStep2() {
    setTemplatePerOffering(buildAutoTemplates(selectedOfferings))
    setStep(2)
  }

  function validateDates(): boolean {
    if (!openDate || !closeDate) {
      setDateError('Both open and close dates are required.')
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
    if (!validateDates() || !selectedTerm) return
    selectedOfferings.forEach(offering => {
      const masterCourse = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
      const faculty = MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId)
      createSurvey({
        courseCode: masterCourse?.code ?? offering.masterCourseId,
        courseName: masterCourse?.name ?? '',
        term: selectedTerm.name,
        templateId: templatePerOffering[offering.id] ?? '',
        status: 'collecting',
        instructors: faculty
          ? [{ id: faculty.id, name: faculty.name, initials: faculty.initials, role: 'primary' as const }]
          : [],
        enrollmentCount: offering.enrolledCount,
        deadline: dateToYmd(closeDate),
      })
    })
    setStep('success')
  }

  function handleReset() {
    setStep(1)
    setSelectedTermId('')
    setExcludedIds(new Set())
    setTemplatePerOffering({})
    setOpenDate(undefined)
    setCloseDate(undefined)
    setReminderEnabled(false)
    setDateError(null)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <header
        className="flex items-center gap-2 border-b border-border shrink-0"
        style={{ padding: '18px 28px 14px' }}
      >
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/surveys" className="text-sm text-muted-foreground hover:underline">
          Surveys
        </Link>
        <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <span className="text-sm font-semibold flex-1">Push survey</span>
      </header>

      {/* Step tabs — Customer.io underline style */}
      {step !== 'success' && (
        <div
          className="flex items-center gap-0 border-b border-border shrink-0"
          style={{ paddingInline: 28 }}
        >
          {(['Scope', 'Design', 'Communication'] as const).map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3
            const isCurrent = step === n
            const isDone = typeof step === 'number' && step > n
            return (
              <div
                key={n}
                className="flex items-center gap-1.5 text-sm py-3 mr-6"
                style={{
                  borderBottom: isCurrent ? '2px solid var(--brand-color)' : '2px solid transparent',
                  color: isCurrent ? 'var(--foreground)' : 'var(--muted-foreground)',
                  fontWeight: isCurrent ? 600 : 400,
                  marginBottom: -1,
                }}
              >
                {isDone && (
                  <i className="fa-solid fa-check text-xs" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
                )}
                {label}
              </div>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto" style={{ padding: '28px 28px 48px' }}>
        {step === 'success' ? (
          <SuccessState
            selectedTerm={selectedTerm!}
            selectedOfferings={selectedOfferings}
            openDate={openDate}
            onReset={handleReset}
          />
        ) : (
          /* Two-column layout: main + context panel */
          <div className="flex gap-8 items-start" style={{ maxWidth: 900, marginInline: 'auto' }}>
            {/* Main content */}
            <div className="flex-1 min-w-0">
              {step === 1 && (
                <Step1
                  activeTerms={activeTerms}
                  selectedTermId={selectedTermId}
                  offeringsForTerm={offeringsForTerm}
                  selectedOfferings={selectedOfferings}
                  excludedIds={excludedIds}
                  onTermChange={handleTermChange}
                  onToggleOffering={toggleOffering}
                  onNext={handleGoToStep2}
                />
              )}
              {step === 2 && selectedTerm && (
                <Step2
                  publishedTemplates={publishedTemplates}
                  selectedOfferings={selectedOfferings}
                  selectedTerm={selectedTerm}
                  templatePerOffering={templatePerOffering}
                  onTemplateChange={(oid, tid) => setTemplatePerOffering(p => ({ ...p, [oid]: tid }))}
                  onBulkAssign={tid => {
                    const next = { ...templatePerOffering }
                    selectedOfferings.forEach(o => { next[o.id] = tid })
                    setTemplatePerOffering(next)
                  }}
                  assignedCount={assignedCount}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              )}
              {step === 3 && selectedTerm && (
                <Step3
                  dateError={dateError}
                  openDate={openDate}
                  closeDate={closeDate}
                  reminderEnabled={reminderEnabled}
                  onOpenDateChange={setOpenDate}
                  onCloseDateChange={setCloseDate}
                  onReminderChange={setReminderEnabled}
                  onDismissError={() => setDateError(null)}
                  onBack={() => setStep(2)}
                  onPush={handlePush}
                />
              )}
            </div>

            {/* Context panel — live summary */}
            <ContextPanel
              step={step as 1 | 2 | 3}
              selectedTerm={selectedTerm}
              selectedOfferings={selectedOfferings}
              totalEnrolled={totalEnrolled}
              assignedCount={assignedCount}
              uniqueTemplateNames={uniqueTemplateNames}
              openDate={openDate}
              closeDate={closeDate}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Context panel (right-side live summary) ────────────────────────────────────

interface ContextPanelProps {
  step: 1 | 2 | 3
  selectedTerm: ProgramTerm | null
  selectedOfferings: CourseOffering[]
  totalEnrolled: number
  assignedCount: number
  uniqueTemplateNames: string[]
  openDate: Date | undefined
  closeDate: Date | undefined
}

function ContextPanel({
  step,
  selectedTerm,
  selectedOfferings,
  totalEnrolled,
  assignedCount,
  uniqueTemplateNames,
  openDate,
  closeDate,
}: ContextPanelProps) {
  if (!selectedTerm) return <div style={{ width: 220 }} />

  return (
    <div
      className="flex flex-col gap-4 shrink-0 rounded-xl border border-border"
      style={{ width: 220, padding: '16px', background: 'var(--card)', position: 'sticky', top: 0 }}
    >
      {/* Term */}
      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
          Term
        </p>
        <p className="text-sm font-medium">{selectedTerm.name}</p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{selectedTerm.academicYear}</p>
      </div>

      <div className="border-t border-border" />

      {/* Courses */}
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Courses</span>
        <span className="text-sm font-semibold tabular-nums">{selectedOfferings.length}</span>
      </div>

      {/* Students */}
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Students</span>
        <span className="text-sm font-semibold tabular-nums">{totalEnrolled}</span>
      </div>

      {/* Templates — only show on step 2+ */}
      {step >= 2 && (
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm shrink-0" style={{ color: 'var(--muted-foreground)' }}>Templates</span>
          <div className="flex flex-col items-end gap-0.5">
            {uniqueTemplateNames.length === 0 ? (
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {assignedCount}/{selectedOfferings.length} assigned
              </span>
            ) : uniqueTemplateNames.map(n => (
              <span key={n} className="text-xs font-medium text-right">{n}</span>
            ))}
          </div>
        </div>
      )}

      {/* Window — only show on step 3 */}
      {step >= 3 && (openDate || closeDate) && (
        <>
          <div className="border-t border-border" />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              Window
            </p>
            <p className="text-sm">
              {fmtDate(openDate)}
              <span style={{ color: 'var(--muted-foreground)' }}> → </span>
              {fmtDate(closeDate)}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ── Course type badge ──────────────────────────────────────────────────────────

function CourseTypeBadge({ type }: { type: 'didactic' | 'clinical' }) {
  const isDidactic = type === 'didactic'
  return (
    <Badge
      variant="secondary"
      className="rounded shrink-0"
      style={{
        fontSize: 10,
        fontWeight: 500,
        paddingInline: 6,
        paddingBlock: 2,
        backgroundColor: isDidactic
          ? 'var(--brand-tint)'
          : 'color-mix(in oklch, var(--brand-color) 12%, var(--muted))',
        color: isDidactic
          ? 'var(--brand-color)'
          : 'var(--muted-foreground)',
      }}
    >
      {type}
    </Badge>
  )
}

// ── Step 1: Scope ─────────────────────────────────────────────────────────────

interface Step1Props {
  activeTerms: ProgramTerm[]
  selectedTermId: string
  offeringsForTerm: CourseOffering[]
  selectedOfferings: CourseOffering[]
  excludedIds: Set<string>
  onTermChange: (v: string) => void
  onToggleOffering: (id: string) => void
  onNext: () => void
}

function Step1({
  activeTerms,
  selectedTermId,
  offeringsForTerm,
  selectedOfferings,
  excludedIds,
  onTermChange,
  onToggleOffering,
  onNext,
}: Step1Props) {
  const canContinue = !!selectedTermId && selectedOfferings.length > 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Select term and courses</h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          All courses are included by default. Uncheck to exclude.
        </p>
      </div>

      {/* Term selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
          Term
        </label>
        <Select value={selectedTermId} onValueChange={onTermChange}>
          <SelectTrigger className="w-72" aria-label="Select term">
            <SelectValue placeholder="Choose a term…" />
          </SelectTrigger>
          <SelectContent>
            {activeTerms.map(t => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} · {t.academicYear}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Course list */}
      {selectedTermId && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              Course offerings
            </label>
            <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              {selectedOfferings.length} of {offeringsForTerm.length} included
            </span>
          </div>

          {offeringsForTerm.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: 'var(--muted-foreground)' }}>
              No active course offerings for this term.
            </p>
          ) : (
            <div
              className="flex flex-col rounded-xl border border-border overflow-hidden"
              style={{ background: 'var(--card)' }}
            >
              {offeringsForTerm.map((offering, i) => {
                const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
                const faculty = MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId)
                const checked = !excludedIds.has(offering.id)
                const isLast = i === offeringsForTerm.length - 1

                return (
                  <label
                    key={offering.id}
                    className="flex items-center gap-3 cursor-pointer transition-colors"
                    style={{
                      padding: '10px 14px',
                      borderBottom: isLast ? 'none' : '1px solid var(--border)',
                      background: checked ? 'var(--card)' : 'var(--muted)',
                      opacity: checked ? 1 : 0.6,
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggleOffering(offering.id)}
                      aria-label={`Include ${course?.code ?? offering.id}`}
                    />

                    {/* Faculty avatar */}
                    <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                      <AvatarFallback
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          backgroundColor: 'var(--avatar-initials-bg)',
                          color: 'var(--avatar-initials-fg)',
                        }}
                      >
                        {faculty?.initials ?? '—'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Course info */}
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold" style={{ letterSpacing: '-0.01em' }}>
                          {course?.code}
                        </span>
                        <span className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>
                          {course?.name}
                        </span>
                        {offering.courseType && (
                          <CourseTypeBadge type={offering.courseType} />
                        )}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                        {faculty?.name ?? (
                          <span style={{ color: 'color-mix(in oklch, var(--brand-color) 60%, var(--muted-foreground))' }}>
                            Unassigned
                          </span>
                        )}
                        <span style={{ marginInline: 4 }}>·</span>
                        {offering.enrolledCount} enrolled
                        {offering.status === 'planned' && (
                          <span style={{ marginInline: 4 }}>· Planned</span>
                        )}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button variant="outline" size="sm" asChild>
          <Link href="/surveys">
            <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
            Back
          </Link>
        </Button>
        <Button variant="default" size="sm" disabled={!canContinue} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>
    </div>
  )
}

// ── Step 2: Design ────────────────────────────────────────────────────────────

interface Step2Props {
  publishedTemplates: PceTemplate[]
  selectedOfferings: CourseOffering[]
  selectedTerm: ProgramTerm
  templatePerOffering: Record<string, string>
  assignedCount: number
  onTemplateChange: (offeringId: string, tmplId: string) => void
  onBulkAssign: (tmplId: string) => void
  onBack: () => void
  onNext: () => void
}

function Step2({
  publishedTemplates,
  selectedOfferings,
  selectedTerm,
  templatePerOffering,
  assignedCount,
  onTemplateChange,
  onBulkAssign,
  onBack,
  onNext,
}: Step2Props) {
  const canContinue = assignedCount === selectedOfferings.length && selectedOfferings.length > 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Assign templates</h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {selectedTerm.name} · {selectedOfferings.length} course{selectedOfferings.length !== 1 ? 's' : ''}
        </p>
      </div>

      {publishedTemplates.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 py-14 text-center rounded-xl border border-dashed"
          style={{ borderColor: 'var(--border)' }}
        >
          <i className="fa-light fa-file-lines text-3xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
          <div>
            <p className="text-sm font-medium">No published templates</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Publish a template to continue.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/templates" target="_blank" rel="noreferrer">
              Go to templates
              <i className="fa-light fa-arrow-up-right-from-square ml-1.5 text-xs" aria-hidden="true" />
            </a>
          </Button>
        </div>
      ) : (
        <>
          {/* Bulk assign — only show when multiple templates exist */}
          {publishedTemplates.length > 1 && (
            <div
              className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <span className="text-xs font-medium uppercase tracking-wide shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                Assign all
              </span>
              <Select value="" onValueChange={v => { if (v) onBulkAssign(v) }}>
                <SelectTrigger className="flex-1 h-8 text-sm" aria-label="Bulk assign template">
                  <SelectValue placeholder="Choose template for all courses…" />
                </SelectTrigger>
                <SelectContent>
                  {publishedTemplates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Per-offering rows inside a card */}
          <div
            className="flex flex-col rounded-xl border border-border overflow-hidden"
            style={{ background: 'var(--card)' }}
          >
            {selectedOfferings.map((offering, i) => {
              const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
              const assignedId = templatePerOffering[offering.id] ?? ''
              const isLast = i === selectedOfferings.length - 1
              const isAssigned = !!assignedId

              return (
                <div
                  key={offering.id}
                  className="flex items-center gap-3"
                  style={{
                    padding: '10px 14px',
                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {/* Course info */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-semibold shrink-0">{course?.code}</span>
                    <span className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>
                      {course?.name}
                    </span>
                    {offering.courseType && (
                      <CourseTypeBadge type={offering.courseType} />
                    )}
                    {isAssigned && !templatePerOffering[offering.id] && (
                      <Badge
                        variant="secondary"
                        className="rounded shrink-0"
                        style={{ fontSize: 10, backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color)' }}
                      >
                        Auto
                      </Badge>
                    )}
                  </div>

                  {/* Template select */}
                  <div style={{ minWidth: 200 }}>
                    <Select value={assignedId} onValueChange={v => onTemplateChange(offering.id, v)}>
                      <SelectTrigger
                        aria-label={`Template for ${course?.code ?? offering.id}`}
                        style={{
                          height: 32,
                          fontSize: 13,
                          borderColor: isAssigned ? 'var(--border-control-35)' : 'color-mix(in oklch, var(--destructive) 60%, var(--border))',
                        }}
                      >
                        <SelectValue placeholder="Choose…" />
                      </SelectTrigger>
                      <SelectContent>
                        {publishedTemplates.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Assignment progress + escape hatch */}
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {assignedCount} of {selectedOfferings.length} assigned
            </span>
            <a
              href="/templates"
              target="_blank"
              rel="noreferrer"
              className="text-xs"
              style={{ color: 'var(--brand-color)' }}
            >
              Create a template
              <i className="fa-light fa-arrow-up-right-from-square ml-1 text-xs" aria-hidden="true" />
            </a>
          </div>
        </>
      )}

      <div className="flex items-center justify-between pt-1">
        <Button variant="outline" size="sm" onClick={onBack}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Back
        </Button>
        <Button variant="default" size="sm" disabled={!canContinue} onClick={onNext}>
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </div>
    </div>
  )
}

// ── Step 3: Communication ─────────────────────────────────────────────────────

interface Step3Props {
  dateError: string | null
  openDate: Date | undefined
  closeDate: Date | undefined
  reminderEnabled: boolean
  onOpenDateChange: (d: Date | undefined) => void
  onCloseDateChange: (d: Date | undefined) => void
  onReminderChange: (v: boolean) => void
  onDismissError: () => void
  onBack: () => void
  onPush: () => void
}

function Step3({
  dateError,
  openDate,
  closeDate,
  reminderEnabled,
  onOpenDateChange,
  onCloseDateChange,
  onReminderChange,
  onDismissError,
  onBack,
  onPush,
}: Step3Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Set survey window</h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Students receive an email invitation on the open date.
        </p>
      </div>

      {dateError && (
        <LocalBanner variant="error" dismissible onDismiss={onDismissError}>
          {dateError}
        </LocalBanner>
      )}

      {/* Dates — side by side in a card */}
      <div
        className="grid gap-4 rounded-xl border border-border"
        style={{ padding: '16px', gridTemplateColumns: '1fr 1fr', background: 'var(--card)' }}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
            Opens on
          </label>
          <DatePickerField value={openDate} onChange={onOpenDateChange} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
            Closes on
          </label>
          <DatePickerField value={closeDate} onChange={onCloseDateChange} />
        </div>
      </div>

      {/* Anonymity note */}
      <div
        className="flex items-start gap-3 rounded-lg px-3 py-2.5"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <i className="fa-light fa-lock text-sm mt-0.5 shrink-0" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          All responses are anonymous. Student names are never linked to their answers.
        </p>
      </div>

      {/* Reminder */}
      <label className="flex items-center gap-3 cursor-pointer">
        <Checkbox
          checked={reminderEnabled}
          onCheckedChange={v => onReminderChange(!!v)}
          aria-label="Send reminder email 3 days before close"
        />
        <span className="text-sm">Send a reminder email 3 days before close date</span>
      </label>

      <div className="flex items-center justify-between pt-1">
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

// ── Success state ─────────────────────────────────────────────────────────────

function SuccessState({
  selectedTerm,
  selectedOfferings,
  openDate,
  onReset,
}: {
  selectedTerm: ProgramTerm
  selectedOfferings: CourseOffering[]
  openDate: Date | undefined
  onReset: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-8 py-16 text-center" style={{ maxWidth: 480, marginInline: 'auto' }}>
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 64, height: 64, background: 'var(--brand-tint)' }}
      >
        <i
          className="fa-light fa-circle-check"
          aria-hidden="true"
          style={{ fontSize: 32, color: 'var(--brand-color)' }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">
          {selectedOfferings.length} survey{selectedOfferings.length !== 1 ? 's' : ''} pushed
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {selectedTerm.name}
          {openDate && (
            <> · Opens {openDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</>
          )}
        </p>
      </div>

      {/* Course code pills */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {selectedOfferings.map(offering => {
          const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
          return (
            <span
              key={offering.id}
              className="rounded-full text-xs font-medium"
              style={{
                padding: '3px 10px',
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
              }}
            >
              {course?.code ?? offering.id}
            </span>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onReset}>
          Push another
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link href="/surveys">
            View surveys
            <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
          </Link>
        </Button>
      </div>
    </div>
  )
}
