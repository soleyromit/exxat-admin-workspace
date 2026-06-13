'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { WizardNav } from '@/components/pce/wizard-nav'
import { usePce } from '@/components/pce/pce-state'
import { StepTerm } from '@/components/pce/activate-wizard/step-term'
import { StepCourses } from '@/components/pce/activate-wizard/step-courses'
import { StepDates } from '@/components/pce/activate-wizard/step-dates'
import { StepEmail, type ReminderDays } from '@/components/pce/activate-wizard/step-email'
import { StepReview } from '@/components/pce/activate-wizard/step-review'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
} from '@/lib/pce-mock-data'

const ACTIVATE_STEPS = [
  { n: 1, label: 'Term' },
  { n: 2, label: 'Courses' },
  { n: 3, label: 'Dates' },
  { n: 4, label: 'Email' },
  { n: 5, label: 'Review' },
]

type WizardStep = 1 | 2 | 3 | 4 | 5 | 'activated'

const LATEST_TERM_ID = [...MOCK_PROGRAM_TERMS]
  .filter(t => t.status === 'active')
  .sort((a, b) => b.startDate.localeCompare(a.startDate))[0]?.id
  ?? MOCK_PROGRAM_TERMS[0]?.id
  ?? ''

const DEFAULT_EMAIL_BODY = `Hi {{student_first_name}},

Your evaluation for {{course_name}} is open until {{close_date}}. Your responses are anonymous — your name will never be attached to your answers.

Take the survey: {{survey_link}}`

function dateFromYmd(s: string) {
  return new Date(s + 'T00:00:00')
}

function deriveWindowFromTermEnd(endDate: string) {
  const end = dateFromYmd(endDate)
  return {
    open:    new Date(end.getTime() - 7  * 86400_000),
    close:   new Date(end.getTime() + 14 * 86400_000),
    release: new Date(end.getTime() + 15 * 86400_000),
  }
}

function autoAssignTemplates(
  offerings: typeof MOCK_COURSE_OFFERINGS,
  templates: ReturnType<typeof usePce>['templates'],
): Record<string, string> {
  if (templates.length === 0) return {}
  const result: Record<string, string> = {}
  const single = templates.length === 1 ? templates[0] : null
  for (const o of offerings) {
    if (single) {
      result[o.id] = single.id
    } else {
      const byType = o.courseType
        ? templates.find(t => t.courseType === o.courseType)
        : undefined
      const fallback = templates[0]
      result[o.id] = (byType ?? fallback).id
    }
  }
  return result
}

export default function ActivatePage() {
  const { templates, pushSurveyBatch } = usePce()

  const publishedTemplates = templates.filter(
    t => t.status === 'active' && (!t.surveyType || t.surveyType === 'course_evaluation'),
  )

  // ── Step state ──────────────────────────────────────────────────────────────

  const [step, setStep] = useState<WizardStep>(1)

  // Step 1
  const [termId, setTermId] = useState(LATEST_TERM_ID)

  // Step 2
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())
  const [templateAssignments, setTemplateAssignments] = useState<Record<string, string>>({})

  // Step 3
  const [openDate, setOpenDate] = useState<Date | undefined>()
  const [closeDate, setCloseDate] = useState<Date | undefined>()
  const [releaseDate, setReleaseDate] = useState<Date | undefined>()

  // Step 4
  const [senderName, setSenderName] = useState('Exxat Surveys')
  const [emailSubject, setEmailSubject] = useState('Your course evaluation for {{course_name}} is now open')
  const [emailBody, setEmailBody] = useState(DEFAULT_EMAIL_BODY)
  const [reminderDays, setReminderDays] = useState<ReminderDays>(3)

  // ── Derived values ──────────────────────────────────────────────────────────

  const selectedTerm = MOCK_PROGRAM_TERMS.find(t => t.id === termId) ?? null

  const offeringsForTerm = useMemo(
    () => termId
      ? MOCK_COURSE_OFFERINGS.filter(o => o.termId === termId && o.status !== 'archived')
      : [],
    [termId],
  )

  const selectedOfferings = offeringsForTerm.filter(o => !excludedIds.has(o.id))

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleTermChange(id: string) {
    setTermId(id)
    setExcludedIds(new Set())
    setTemplateAssignments({})
    const term = MOCK_PROGRAM_TERMS.find(t => t.id === id)
    if (term) {
      const { open, close, release } = deriveWindowFromTermEnd(term.endDate)
      setOpenDate(open)
      setCloseDate(close)
      setReleaseDate(release)
    }
  }

  function handleStep1Next() {
    const newOfferings = offeringsForTerm
    setTemplateAssignments(autoAssignTemplates(newOfferings, publishedTemplates))
    setStep(2)
  }

  function handleActivate() {
    if (!selectedTerm || !openDate || !closeDate) return
    function toYmd(d: Date) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    pushSurveyBatch({
      surveyType: 'course_evaluation',
      termId,
      academicYear: selectedTerm.academicYear,
      programId: '',
      courseOfferingIds: selectedOfferings.map(o => o.id),
      templateAssignments,
      openDate: toYmd(openDate),
      closeDate: toYmd(closeDate),
      emailSubject,
      emailBody,
      reminderEnabled: reminderDays > 0,
      reminderDaysBefore: reminderDays > 0 ? reminderDays : 3,
      reportAccess: {},
    })
    setStep('activated')
  }

  function handleStepNavClick(n: number) {
    if (typeof step === 'number' && n < step) setStep(n as WizardStep)
  }

  function handleReset() {
    setStep(1)
    setTermId(LATEST_TERM_ID)
    setExcludedIds(new Set())
    setTemplateAssignments({})
    setOpenDate(undefined)
    setCloseDate(undefined)
    setReleaseDate(undefined)
    setSenderName('Exxat Surveys')
    setEmailSubject('Your course evaluation for {{course_name}} is now open')
    setEmailBody(DEFAULT_EMAIL_BODY)
    setReminderDays(3)
  }

  const currentStepNum = step === 'activated' ? 6 : (step as number)
  const completedUpTo  = step === 'activated' ? 5 : (step as number) - 1

  // ── Success screen ──────────────────────────────────────────────────────────

  if (step === 'activated' && selectedTerm) {
    const openLabel = openDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) ?? ''
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <SiteHeader
          breadcrumbs={[{ label: 'Evaluations', href: '/surveys' }]}
          title="Activate term evaluations"
        />
        <h1 className="sr-only">Term evaluations activated</h1>
        <div className="flex flex-1 overflow-auto items-start justify-center" style={{ padding: '64px 40px' }}>
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col items-center gap-8 text-center"
            style={{ maxWidth: 520 }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 64, height: 64, background: 'var(--brand-tint)' }}
            >
              <i className="fa-light fa-calendar-check" aria-hidden="true" style={{ fontSize: 30, color: 'var(--brand-color)' }} />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                {selectedTerm.name} evaluations scheduled
              </p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {selectedOfferings.length} survey{selectedOfferings.length !== 1 ? 's' : ''} scheduled.
                {openLabel ? ` Invitation emails fire on ${openLabel}.` : ''} No action needed until results are available.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Activate another term
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/surveys">
                  View evaluations
                  <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Wizard ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader
        breadcrumbs={[{ label: 'Evaluations', href: '/surveys' }]}
        title="Activate term evaluations"
      />
      <h1 className="sr-only">Activate term evaluations</h1>

      <WizardNav
        steps={ACTIVATE_STEPS}
        currentStep={currentStepNum}
        completedUpTo={completedUpTo}
        onStepClick={handleStepNavClick}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto" style={{ padding: '32px 40px 48px' }}>

          {step === 1 && (
            <StepTerm
              termId={termId}
              onTermChange={handleTermChange}
              onNext={handleStep1Next}
            />
          )}

          {step === 2 && selectedTerm && (
            <StepCourses
              offeringsForTerm={offeringsForTerm}
              selectedTerm={selectedTerm}
              excludedIds={excludedIds}
              templateAssignments={templateAssignments}
              publishedTemplates={publishedTemplates}
              onToggleOffering={id => {
                setExcludedIds(prev => {
                  const next = new Set(prev)
                  next.has(id) ? next.delete(id) : next.add(id)
                  return next
                })
              }}
              onSetExcluded={setExcludedIds}
              onTemplateChange={(offeringId, templateId) =>
                setTemplateAssignments(p => ({ ...p, [offeringId]: templateId }))
              }
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && selectedTerm && (
            <StepDates
              termEndDate={selectedTerm.endDate}
              openDate={openDate}
              closeDate={closeDate}
              releaseDate={releaseDate}
              onOpenDateChange={setOpenDate}
              onCloseDateChange={setCloseDate}
              onReleaseDateChange={setReleaseDate}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}

          {step === 4 && selectedTerm && (
            <StepEmail
              termEndDate={selectedTerm.endDate}
              termName={selectedTerm.name}
              senderName={senderName}
              emailSubject={emailSubject}
              emailBody={emailBody}
              reminderDays={reminderDays}
              onSenderNameChange={setSenderName}
              onEmailSubjectChange={setEmailSubject}
              onEmailBodyChange={setEmailBody}
              onReminderDaysChange={setReminderDays}
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
            />
          )}

          {step === 5 && selectedTerm && (
            <StepReview
              selectedTerm={selectedTerm}
              selectedOfferings={selectedOfferings}
              excludedCount={excludedIds.size}
              openDate={openDate}
              closeDate={closeDate}
              releaseDate={releaseDate}
              reminderDays={reminderDays}
              senderName={senderName}
              emailSubject={emailSubject}
              publishedTemplates={publishedTemplates}
              templateAssignments={templateAssignments}
              onBack={() => setStep(4)}
              onActivate={handleActivate}
            />
          )}

        </div>
      </div>
    </div>
  )
}
