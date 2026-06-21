'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { WizardNav } from '@/components/pce/wizard-nav'
import { StepProperties } from '@/components/pce/distribute-wizard/step-properties'
import { StepDistribution } from '@/components/pce/distribute-wizard/step-distribution'
import { StepSurveyDesign } from '@/components/pce/distribute-wizard/step-survey-design'
import { StepCommunication, type Reminder } from '@/components/pce/distribute-wizard/step-communication'
import { StepSuccess } from '@/components/pce/distribute-wizard/step-success'
import { StepSurveyDesignGeneral } from '@/components/pce/distribute-wizard/step-survey-design-general'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  type SurveyType,
  type PceTemplate,
} from '@/lib/pce-mock-data'

const LATEST_TERM_ID = [...MOCK_PROGRAM_TERMS]
  .sort((a, b) => b.startDate.localeCompare(a.startDate))[0]?.id ?? ''

type WizardStep = 1 | 2 | 3 | 'success'

// Pre-assign a default template to every (non-archived) offering in a term, so
// the merged "Scope and design" step shows assignments immediately. One template
// → all courses; otherwise match by courseType, falling back to the first.
function autoAssignTemplates(
  termId: string,
  publishedTemplates: PceTemplate[],
): Record<string, string> {
  const result: Record<string, string> = {}
  if (publishedTemplates.length === 0) return result
  const offerings = MOCK_COURSE_OFFERINGS.filter(
    o => o.termId === termId && o.status !== 'archived',
  )
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

function dateToYmd(d: Date | undefined): string {
  if (!d) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DEFAULT_EMAIL_BODY = `Hi {{student_first_name}},

Your evaluation for {{course_name}} is open until {{close_date}}. Your responses are anonymous — your name will never be attached to your answers.

Take the survey: {{survey_link}}`

function PushSurveyInner() {
  const { templates, pushSurveyBatch } = usePce()
  const params = useSearchParams()
  const pathname = usePathname()
  const surveyMode: 'course_evaluation' | 'general' =
    pathname.startsWith('/surveys/programmatic') || params.get('mode') === 'programmatic'
      ? 'general' : 'course_evaluation'

  const publishedTemplates = templates.filter(t =>
    t.status === 'active' && (
      surveyMode === 'general'
        ? t.surveyType === 'programmatic'
        : (!t.surveyType || t.surveyType === 'course_evaluation')
    )
  )

  const [step, setStep] = useState<WizardStep>(1)

  // Step 1 — Properties
  const [surveyType, setSurveyType] = useState<SurveyType>(
    surveyMode === 'general' ? 'programmatic' : 'course_evaluation'
  )
  const [surveyTitle, setSurveyTitle] = useState('')
  const [termId, setTermId] = useState(LATEST_TERM_ID)
  const [surveyDescription, setSurveyDescription] = useState('')

  // Step 1 — Design (templates) + Distribution scope
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())
  const [templateAssignments, setTemplateAssignments] = useState<Record<string, string>>(
    () => surveyMode !== 'general' ? autoAssignTemplates(LATEST_TERM_ID, publishedTemplates) : {}
  )
  const [generalTemplateId, setGeneralTemplateId] = useState<string>('')

  // Step 4 — Communication
  const [openDate, setOpenDate] = useState<Date | undefined>()
  const [closeDate, setCloseDate] = useState<Date | undefined>()
  const [releaseDate, setReleaseDate] = useState<Date | undefined>()
  const [senderName, setSenderName] = useState('Exxat Surveys')
  const [emailSubject, setEmailSubject] = useState(
    'Your course evaluation for {{course_name}} is now open'
  )
  const [emailBody, setEmailBody] = useState(DEFAULT_EMAIL_BODY)
  const [reminders, setReminders] = useState<Reminder[]>([])

  // ── Derived values ─────────────────────────────────────────────────────────

  const selectedTerm = MOCK_PROGRAM_TERMS.find(t => t.id === termId) ?? null
  const academicYear = selectedTerm?.academicYear ?? ''

  const offeringsForTerm = useMemo(
    () =>
      termId
        ? MOCK_COURSE_OFFERINGS.filter(o => o.termId === termId && o.status !== 'archived')
        : [],
    [termId]
  )

  const selectedOfferings = offeringsForTerm.filter(o => !excludedIds.has(o.id))

  // Step 1 ("Scope and design") gating — scope fields + a template for every course.
  const scopeValid = surveyMode === 'general'
    ? !!surveyTitle.trim()
    : (!!surveyTitle.trim() && !!termId)
  const designValid = surveyMode === 'general'
    ? !!generalTemplateId
    : (selectedOfferings.length > 0 && selectedOfferings.every(o => !!templateAssignments[o.id]))
  const canContinueStep1 = scopeValid && designValid

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleTermChange(v: string) {
    setTermId(v)
    setExcludedIds(new Set())
    setTemplateAssignments(
      surveyMode !== 'general' ? autoAssignTemplates(v, publishedTemplates) : {}
    )
  }

  function handleToggleOffering(id: string) {
    setExcludedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSelectAll() {
    setExcludedIds(new Set())
  }

  function handleDeselectAll() {
    setExcludedIds(new Set(offeringsForTerm.map(o => o.id)))
  }

  function handleBulkAssignByType(
    courseType: 'didactic' | 'clinical' | 'any',
    tmplId: string
  ) {
    const next = { ...templateAssignments }
    selectedOfferings.forEach(o => {
      if (courseType === 'any' || o.courseType === courseType) {
        next[o.id] = tmplId
      }
    })
    setTemplateAssignments(next)
  }

  function handlePush() {
    const openYmd = dateToYmd(openDate)
    const closeYmd = dateToYmd(closeDate)
    pushSurveyBatch({
      surveyType,
      termId,
      academicYear,
      programId: '',
      courseOfferingIds: selectedOfferings.map(o => o.id),
      templateAssignments,
      openDate: openYmd,
      closeDate: closeYmd,
      emailSubject,
      emailBody,
      reminderEnabled: reminders.length > 0,
      reminderDaysBefore: reminders[0]?.daysBefore ?? 3,
      reportAccess: {},
    })
    setStep('success')
  }

  function handleReset() {
    setStep(1)
    setSurveyType(surveyMode === 'general' ? 'programmatic' : 'course_evaluation')
    setSurveyTitle('')
    setTermId(LATEST_TERM_ID)
    setSurveyDescription('')
    setExcludedIds(new Set())
    setTemplateAssignments(
      surveyMode !== 'general' ? autoAssignTemplates(LATEST_TERM_ID, publishedTemplates) : {}
    )
    setGeneralTemplateId('')
    setOpenDate(undefined)
    setCloseDate(undefined)
    setReleaseDate(undefined)
    setSenderName('Exxat Surveys')
    setEmailSubject('Your course evaluation for {{course_name}} is now open')
    setEmailBody(DEFAULT_EMAIL_BODY)
    setReminders([])
  }

  function handleStepNavClick(n: number) {
    // Only allow navigating to completed steps (< current step)
    if (typeof step === 'number' && n < step) {
      setStep(n as WizardStep)
    }
  }

  const currentStepNum = step === 'success' ? 4 : (step as number)
  const completedUpTo = step === 'success' ? 3 : (step as number) - 1

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader
        breadcrumbs={[{
          label: surveyMode === 'general' ? 'Surveys' : 'Evaluations',
          href:  surveyMode === 'general' ? '/surveys/programmatic' : '/surveys',
        }]}
        title={surveyMode === 'general' ? 'Push survey' : 'Push evaluation'}
      />
      <h1 className="sr-only">{surveyMode === 'general' ? 'Push survey' : 'Push evaluation'}</h1>

      {/* Horizontal step bar — hidden on success step */}
      {step !== 'success' && (
        <WizardNav
          currentStep={currentStepNum}
          completedUpTo={completedUpTo}
          onStepClick={handleStepNavClick}
          mode={surveyMode}
        />
      )}

      {/* Full-width content */}
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto" style={{ padding: '32px 40px 48px' }}>
          {step === 1 && (
            <div className="flex flex-col gap-6" style={{ maxWidth: 680 }}>
              {/* Step header */}
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  Scope and design
                </h2>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {surveyMode === 'general'
                    ? 'Define the scope for this survey and choose its template.'
                    : 'Define the term and scope for this evaluation cycle, then set templates by course type.'}
                </p>
              </div>

              {/* Scope */}
              <StepProperties
                asSection
                surveyMode={surveyMode}
                surveyTitle={surveyTitle}
                termId={termId}
                description={surveyDescription}
                onSurveyTitleChange={setSurveyTitle}
                onTermChange={handleTermChange}
                onDescriptionChange={setSurveyDescription}
              />

              {/* Design */}
              <div className="border-t border-border pt-6 flex flex-col gap-1">
                <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  Design
                </h3>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {surveyMode === 'general'
                    ? 'Set a template for this survey.'
                    : 'Set a template for each course type. Expand to override individual courses.'}
                </p>
              </div>

              {surveyMode === 'general' ? (
                <StepSurveyDesignGeneral
                  asSection
                  publishedTemplates={publishedTemplates}
                  selectedTemplateId={generalTemplateId}
                  onTemplateChange={setGeneralTemplateId}
                />
              ) : (
                <StepSurveyDesign
                  key={termId}
                  asSection
                  selectedOfferings={selectedOfferings}
                  publishedTemplates={publishedTemplates}
                  templateAssignments={templateAssignments}
                  onTemplateChange={(offeringId, tmplId) =>
                    setTemplateAssignments(p => ({ ...p, [offeringId]: tmplId }))
                  }
                  onBulkAssignByType={handleBulkAssignByType}
                />
              )}

              {/* Single footer for the merged step */}
              <div className="border-t border-border pt-4 flex items-center justify-end">
                <Button
                  variant="default"
                  size="sm"
                  disabled={!canContinueStep1}
                  onClick={() => setStep(2)}
                >
                  Continue
                  <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && selectedTerm && (
            <StepDistribution
              offeringsForTerm={offeringsForTerm}
              selectedOfferings={selectedOfferings}
              excludedIds={excludedIds}
              selectedTerm={selectedTerm}
              openDate={openDate}
              closeDate={closeDate}
              onToggleOffering={handleToggleOffering}
              onSetExcluded={setExcludedIds}
              onApplyDatesToAll={(open, close) => { setOpenDate(open); setCloseDate(close) }}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <StepCommunication
              selectedOfferings={selectedOfferings}
              openDate={openDate}
              closeDate={closeDate}
              releaseDate={releaseDate}
              senderName={senderName}
              emailSubject={emailSubject}
              emailBody={emailBody}
              reminders={reminders}
              onOpenDateChange={setOpenDate}
              onCloseDateChange={setCloseDate}
              onReleaseDateChange={setReleaseDate}
              onSenderNameChange={setSenderName}
              onEmailSubjectChange={setEmailSubject}
              onEmailBodyChange={setEmailBody}
              onRemindersChange={setReminders}
              onBack={() => setStep(2)}
              onNext={handlePush}
            />
          )}

          {step === 'success' && selectedTerm && (
            <StepSuccess
              selectedOfferings={selectedOfferings}
              selectedTerm={selectedTerm}
              openDate={openDate}
              onReset={handleReset}
            />
          )}

        </div>
      </main>
    </div>
  )
}

export default function PushSurveyPage() {
  return (
    <Suspense>
      <PushSurveyInner />
    </Suspense>
  )
}
