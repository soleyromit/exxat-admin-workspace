'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { WizardNav } from '@/components/pce/wizard-nav'
import { StepProperties, type SurveyVisibility } from '@/components/pce/distribute-wizard/step-properties'
import { StepDistribution } from '@/components/pce/distribute-wizard/step-distribution'
import { StepSurveyDesign } from '@/components/pce/distribute-wizard/step-survey-design'
import { StepCommunication, type Reminder } from '@/components/pce/distribute-wizard/step-communication'
import { StepReportAccess, DEFAULT_REPORT_ACCESS, type ReportAccess } from '@/components/pce/distribute-wizard/step-report-access'
import { StepSuccess } from '@/components/pce/distribute-wizard/step-success'
import { StepDistributionGeneral } from '@/components/pce/distribute-wizard/step-distribution-general'
import { StepSurveyDesignGeneral } from '@/components/pce/distribute-wizard/step-survey-design-general'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  type SurveyType,
} from '@/lib/pce-mock-data'

const LATEST_TERM_ID = [...MOCK_PROGRAM_TERMS]
  .sort((a, b) => b.startDate.localeCompare(a.startDate))[0]?.id ?? ''

type WizardStep = 1 | 2 | 3 | 4 | 5 | 'success'

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
  const surveyMode: 'course_evaluation' | 'general' =
    params.get('mode') === 'programmatic' ? 'general' : 'course_evaluation'

  const [step, setStep] = useState<WizardStep>(1)

  // Step 1 — Properties
  const [surveyType, setSurveyType] = useState<SurveyType>(
    surveyMode === 'general' ? 'programmatic' : 'course_evaluation'
  )
  const [surveyTitle, setSurveyTitle] = useState('')
  const [keepAnonymous, setKeepAnonymous] = useState(false)
  const [termId, setTermId] = useState(LATEST_TERM_ID)
  const [surveyDescription, setSurveyDescription] = useState('')
  const [surveyVisibility, setSurveyVisibility] = useState<SurveyVisibility>('program')

  // Step 2 — Distribution
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set())

  // Step 3 — Survey Design
  const [templateAssignments, setTemplateAssignments] = useState<Record<string, string>>({})
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

  // Step 5 — Report Access
  const [reportAccess, setReportAccess] = useState<ReportAccess>(DEFAULT_REPORT_ACCESS)

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
  const publishedTemplates = templates.filter(t =>
    t.status === 'active' && (
      surveyMode === 'general'
        ? t.surveyType === 'programmatic'
        : (!t.surveyType || t.surveyType === 'course_evaluation')
    )
  )

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
      reminderEnabled: reminders.length > 0,
      reminderDaysBefore: reminders[0]?.daysBefore ?? 3,
      reportAccess: Object.fromEntries(
        Object.entries(reportAccess).map(([k, v]) => [k, Array.from(v)])
      ),
    })
    setStep('success')
  }

  function handleReset() {
    setStep(1)
    setSurveyType(surveyMode === 'general' ? 'programmatic' : 'course_evaluation')
    setSurveyTitle('')
    setKeepAnonymous(false)
    setTermId(LATEST_TERM_ID)
    setSurveyDescription('')
    setSurveyVisibility('program')
    setExcludedIds(new Set())
    setTemplateAssignments({})
    setGeneralTemplateId('')
    setOpenDate(undefined)
    setCloseDate(undefined)
    setReleaseDate(undefined)
    setSenderName('Exxat Surveys')
    setEmailSubject('Your course evaluation for {{course_name}} is now open')
    setEmailBody(DEFAULT_EMAIL_BODY)
    setReminders([])
    setReportAccess(DEFAULT_REPORT_ACCESS)
  }

  function handleStepNavClick(n: number) {
    // Only allow navigating to completed steps (< current step)
    if (typeof step === 'number' && n < step) {
      setStep(n as WizardStep)
    }
  }

  const currentStepNum = step === 'success' ? 6 : (step as number)
  const completedUpTo = step === 'success' ? 5 : (step as number) - 1

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader
        breadcrumbs={[{ label: 'Surveys', href: '/surveys' }]}
        title="Set up surveys"
      />
      <h1 className="sr-only">Set up surveys</h1>

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
              surveyTitle={surveyTitle}
              keepAnonymous={keepAnonymous}
              termId={termId}
              description={surveyDescription}
              visibility={surveyVisibility}
              onSurveyTitleChange={setSurveyTitle}
              onKeepAnonymousChange={setKeepAnonymous}
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
              openDate={openDate}
              closeDate={closeDate}
              onToggleOffering={handleToggleOffering}
              onSetExcluded={setExcludedIds}
              onApplyDatesToAll={(open, close) => { setOpenDate(open); setCloseDate(close) }}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && surveyMode === 'general' && (
            <StepSurveyDesignGeneral
              publishedTemplates={publishedTemplates}
              selectedTemplateId={generalTemplateId}
              onTemplateChange={setGeneralTemplateId}
              onBack={() => setStep(2)}
              onNext={() => setStep(4)}
            />
          )}

          {step === 3 && surveyMode !== 'general' && (
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
              onBack={() => setStep(3)}
              onNext={() => setStep(5)}
            />
          )}

          {step === 5 && (
            <StepReportAccess
              reportAccess={reportAccess}
              onReportAccessChange={setReportAccess}
              onBack={() => setStep(4)}
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

export default function PushSurveyPage() {
  return (
    <Suspense>
      <PushSurveyInner />
    </Suspense>
  )
}
