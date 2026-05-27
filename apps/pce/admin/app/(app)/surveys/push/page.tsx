'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Separator, SidebarTrigger } from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { WizardNav } from '@/components/pce/wizard-nav'
import { StepProperties, type SurveyVisibility } from '@/components/pce/distribute-wizard/step-properties'
import { StepDistribution } from '@/components/pce/distribute-wizard/step-distribution'
import { StepSurveyDesign } from '@/components/pce/distribute-wizard/step-survey-design'
import { StepCommunication } from '@/components/pce/distribute-wizard/step-communication'
import { StepSuccess } from '@/components/pce/distribute-wizard/step-success'
import { StepDistributionGeneral } from '@/components/pce/distribute-wizard/step-distribution-general'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  type SurveyType,
} from '@/lib/pce-mock-data'

type WizardStep = 1 | 2 | 3 | 4 | 'success'

function dateToYmd(d: Date | undefined): string {
  if (!d) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DEFAULT_EMAIL_BODY = `Hi {{student_first_name}},

Your evaluation for {{course_name}} is open until {{close_date}}. Your responses are anonymous — your name will never be attached to your answers.

Take the survey: {{survey_link}}`

export default function PushSurveyPage() {
  const { templates, pushSurveyBatch, surveyMode } = usePce()

  const [step, setStep] = useState<WizardStep>(1)

  // Step 1 — Properties
  const [surveyType, setSurveyType] = useState<SurveyType>(
    surveyMode === 'general' ? 'programmatic' : 'course_evaluation'
  )
  const [termId, setTermId] = useState('')
  const [surveyDescription, setSurveyDescription] = useState('')
  const [surveyVisibility, setSurveyVisibility] = useState<SurveyVisibility>('program')

  // Step 2 — Distribution
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())

  // Step 3 — Survey Design
  const [templateAssignments, setTemplateAssignments] = useState<Record<string, string>>({})

  // Step 4 — Communication
  const [openDate, setOpenDate] = useState<Date | undefined>()
  const [closeDate, setCloseDate] = useState<Date | undefined>()
  const [emailSubject, setEmailSubject] = useState(
    'Your course evaluation for {{course_name}} is now open'
  )
  const [emailBody, setEmailBody] = useState(DEFAULT_EMAIL_BODY)
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3)

  // Step 5 — Report Access
  const [instructorAccess, setInstructorAccess] = useState(true)
  const [coordinatorAccess, setCoordinatorAccess] = useState(true)

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
  const publishedTemplates = templates.filter(t => t.status === 'active')

  const allAssigned =
    selectedOfferings.length > 0 &&
    selectedOfferings.every(o => !!templateAssignments[o.id])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleTermChange(v: string) {
    setTermId(v)
    setExcludedIds(new Set())
    setTemplateAssignments({})
  }

  function buildAutoTemplates(): Record<string, string> {
    const result: Record<string, string> = {}
    if (publishedTemplates.length === 0) return result
    const single = publishedTemplates.length === 1 ? publishedTemplates[0] : null
    for (const offering of selectedOfferings) {
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

  function handleStep1Next() {
    if (surveyMode !== 'general') {
      setTemplateAssignments(buildAutoTemplates())
    }
    setStep(2)
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
      reminderEnabled,
      reminderDaysBefore,
      instructorAccess,
      coordinatorAccess,
    })
    setStep('success')
  }

  function handleReset() {
    setStep(1)
    setSurveyType(surveyMode === 'general' ? 'programmatic' : 'course_evaluation')
    setTermId('')
    setSurveyDescription('')
    setSurveyVisibility('program')
    setExcludedIds(new Set())
    setTemplateAssignments({})
    setOpenDate(undefined)
    setCloseDate(undefined)
    setEmailSubject('Your course evaluation for {{course_name}} is now open')
    setEmailBody(DEFAULT_EMAIL_BODY)
    setReminderEnabled(false)
    setReminderDaysBefore(3)
    setInstructorAccess(true)
    setCoordinatorAccess(true)
  }

  function handleStepNavClick(n: number) {
    // Only allow navigating to completed steps (< current step)
    if (typeof step === 'number' && n < step) {
      setStep(n as WizardStep)
    }
  }

  const currentStepNum = step === 'success' ? 5 : (step as number)
  const completedUpTo = step === 'success' ? 4 : (step as number) - 1

  // ── Render ─────────────────────────────────────────────────────────────────

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
        <i
          className="fa-light fa-chevron-right text-xs"
          aria-hidden="true"
          style={{ color: 'var(--muted-foreground)' }}
        />
        <span className="text-sm font-semibold flex-1">Push surveys</span>
      </header>

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left nav (220px) — hidden on success step */}
        {step !== 'success' && (
          <WizardNav
            currentStep={currentStepNum}
            completedUpTo={completedUpTo}
            onStepClick={handleStepNavClick}
          />
        )}

        {/* Right content */}
        <div className="flex-1 overflow-auto" style={{ padding: '32px 40px 48px' }}>
          {step === 1 && (
            <StepProperties
              surveyMode={surveyMode}
              termId={termId}
              description={surveyDescription}
              visibility={surveyVisibility}
              onTermChange={handleTermChange}
              onDescriptionChange={setSurveyDescription}
              onVisibilityChange={setSurveyVisibility}
              onNext={handleStep1Next}
            />
          )}

          {step === 2 && surveyMode === 'general' && (
            <StepDistributionGeneral
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 2 && surveyMode !== 'general' && selectedTerm && (
            <StepDistribution
              offeringsForTerm={offeringsForTerm}
              selectedOfferings={selectedOfferings}
              excludedIds={excludedIds}
              selectedTerm={selectedTerm}
              instructorAccess={instructorAccess}
              coordinatorAccess={coordinatorAccess}
              publishedTemplates={publishedTemplates}
              templateAssignments={templateAssignments}
              onToggleOffering={handleToggleOffering}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onInstructorAccessChange={setInstructorAccess}
              onCoordinatorAccessChange={setCoordinatorAccess}
              onTemplateChange={(offeringId, tmplId) =>
                setTemplateAssignments(p => ({ ...p, [offeringId]: tmplId }))
              }
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <StepSurveyDesign
              selectedOfferings={selectedOfferings}
              publishedTemplates={publishedTemplates}
              templateAssignments={templateAssignments}
              onTemplateChange={(offeringId, tmplId) =>
                setTemplateAssignments(p => ({ ...p, [offeringId]: tmplId }))
              }
              onBulkAssignByType={handleBulkAssignByType}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}

          {step === 4 && (
            <StepCommunication
              openDate={openDate}
              closeDate={closeDate}
              emailSubject={emailSubject}
              emailBody={emailBody}
              reminderEnabled={reminderEnabled}
              reminderDaysBefore={reminderDaysBefore}
              onOpenDateChange={setOpenDate}
              onCloseDateChange={setCloseDate}
              onEmailSubjectChange={setEmailSubject}
              onEmailBodyChange={setEmailBody}
              onReminderEnabledChange={setReminderEnabled}
              onReminderDaysChange={setReminderDaysBefore}
              onBack={() => setStep(3)}
              onPush={handlePush}
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
      </div>
    </div>
  )
}
