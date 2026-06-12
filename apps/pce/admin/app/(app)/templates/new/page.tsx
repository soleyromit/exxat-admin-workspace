'use client'

import { useState, useRef, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import {
  Button, Badge, Input, Textarea,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import type { SurveyType, CourseTypeFilter } from '@/lib/pce-mock-data'

// 'details' sits between pick and every downstream step except import
// (import has its own name field on the upload screen)
type Step =
  | 'pick'
  | 'details'
  | 'copy-select'
  | 'import-upload'
  | 'import-review'

type PendingMethod = 'build' | 'copy'

interface TemplateCopyRow extends Record<string, unknown> {
  id: string
  name: string
  status: 'active' | 'draft'
  sectionsLabel: string
  lastModified: string
}

const COURSE_TYPE_OPTIONS: {
  value: CourseTypeFilter
  label: string
  description: string
  icon: string
}[] = [
  { value: 'any',      label: 'Any',      description: 'Works for all course types',               icon: 'fa-layer-group' },
  { value: 'didactic', label: 'Didactic', description: 'Lecture, lab, seminar, or online course',  icon: 'fa-chalkboard-teacher' },
  { value: 'clinical', label: 'Clinical', description: 'Rotation, placement, or practicum',        icon: 'fa-stethoscope' },
]

type AnswerType =
  | 'single_choice' | 'multiple_choice' | 'free_text'
  | 'title' | 'number' | 'select_dropdown' | 'date_picker'

const Q_TYPE_OPTIONS: { value: AnswerType; label: string }[] = [
  { value: 'single_choice',   label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'free_text',       label: 'Short / Long Answer' },
  { value: 'title',           label: 'Title' },
  { value: 'number',          label: 'Number' },
  { value: 'select_dropdown', label: 'Select from dropdown' },
  { value: 'date_picker',     label: 'Date picker' },
]

interface ExtractedQuestion {
  id: string
  text: string
  answerType: AnswerType
}

interface ExtractedSection {
  id: string
  title: string
  open: boolean
  questions: ExtractedQuestion[]
}

const MOCK_EXTRACTION: ExtractedSection[] = [
  {
    id: 'ext-s1', title: 'Course Content', open: true,
    questions: [
      { id: 'ext-q1', text: 'The course objectives were clearly stated.', answerType: 'single_choice' },
      { id: 'ext-q2', text: 'Course materials supported my learning.', answerType: 'single_choice' },
      { id: 'ext-q3', text: 'What would you change about this course?', answerType: 'free_text' },
    ],
  },
  {
    id: 'ext-s2', title: 'Instructor', open: false,
    questions: [
      { id: 'ext-q4', text: 'The instructor communicated expectations clearly.', answerType: 'single_choice' },
      { id: 'ext-q5', text: 'The instructor was available for questions.', answerType: 'single_choice' },
      { id: 'ext-q6', text: 'Any additional feedback for the instructor?', answerType: 'free_text' },
    ],
  },
]

// ── Shared shells ─────────────────────────────────────────────────────────────

function StepShell({ children, centered = false }: { children: React.ReactNode; centered?: boolean }) {
  return (
    <div
      className={`flex-1 overflow-y-auto flex flex-col ${centered ? 'items-center justify-center' : ''}`}
      style={{ padding: centered ? '48px 24px' : '40px 48px 60px' }}
    >
      {centered ? <div style={{ width: '100%', maxWidth: 540 }}>{children}</div> : children}
    </div>
  )
}

function StepFooter({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  nextIcon = 'fa-arrow-right',
}: {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  nextIcon?: string
}) {
  return (
    <div
      className="shrink-0 border-t border-border flex items-center justify-between"
      style={{ padding: '14px 48px', background: 'var(--background)' }}
    >
      <div>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Back
          </Button>
        )}
      </div>
      {onNext && (
        <Button variant="default" size="sm" disabled={nextDisabled} onClick={onNext}>
          {nextLabel}
          <i className={`fa-light ${nextIcon} text-xs`} aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}

// ── Option card (pick step) ───────────────────────────────────────────────────

function OptionCard({ icon, title, description, onClick }: {
  icon: string; title: string; description: string; onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full justify-start text-left rounded-xl flex items-center gap-5 h-auto"
      style={{ padding: '18px 20px' }}
      onClick={onClick}
    >
      <div
        className="flex items-center justify-center shrink-0 rounded-lg"
        style={{ width: 44, height: 44, background: 'var(--muted)', color: 'var(--muted-foreground)' }}
      >
        <i className={`fa-light ${icon} text-lg`} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold whitespace-normal">{title}</p>
        <p className="text-sm mt-0.5 whitespace-normal" style={{ color: 'var(--muted-foreground)' }}>{description}</p>
      </div>
      <i className="fa-light fa-arrow-right text-sm shrink-0" aria-hidden="true"
         style={{ color: 'var(--muted-foreground)' }} />
    </Button>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

function NewTemplateInner() {
  const { templates, createTemplate, user } = usePce()
  const router = useRouter()
  const params = useSearchParams()
  const isGeneral = params?.get('mode') === 'programmatic'
  const surveyType: SurveyType = isGeneral ? 'programmatic' : 'course_evaluation'

  const [step, setStep] = useState<Step>('pick')
  const [pendingMethod, setPendingMethod] = useState<PendingMethod>('build')

  // Details step fields
  const [tmplName, setTmplName] = useState('')
  const [tmplDesc, setTmplDesc] = useState('')
  const [courseType, setCourseType] = useState<CourseTypeFilter>('any')

  // Copy state
  const [copyFromId, setCopyFromId] = useState<string | null>(null)

  // Import state
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [importName, setImportName] = useState('')
  const [extractedSections, setExtractedSections] = useState<ExtractedSection[]>([])

  const modeTemplates = templates.filter(t =>
    isGeneral
      ? t.surveyType === 'programmatic'
      : (!t.surveyType || t.surveyType === 'course_evaluation')
  )

  const copySource = copyFromId ? modeTemplates.find(t => t.id === copyFromId) ?? null : null

  const copyTableRows = useMemo<TemplateCopyRow[]>(
    () => modeTemplates.map(t => {
      const sCount = t.templateSections?.length ?? 0
      const qCount = t.templateSections?.reduce((n, s) => n + s.questions.length, 0) ?? t.questionCount
      return {
        id: t.id,
        name: t.name,
        status: t.status as 'active' | 'draft',
        sectionsLabel: `${sCount} · ${qCount}q`,
        lastModified: t.lastModified ?? '—',
      }
    }),
    [modeTemplates]
  )

  const copyColumns = useMemo<ColumnDef<TemplateCopyRow>[]>(
    () => [
      {
        key: 'radio',
        label: '',
        width: 40,
        lockPin: true,
        defaultPin: 'left',
        cell: (row) => {
          const checked = copyFromId === row.id
          return (
            <span
              className="flex items-center justify-center shrink-0 rounded-full border-2"
              style={{
                width: 16, height: 16,
                borderColor: checked ? 'var(--foreground)' : 'var(--border)',
              }}
            >
              {checked && (
                <span className="rounded-full" style={{ width: 7, height: 7, background: 'var(--foreground)' }} />
              )}
            </span>
          )
        },
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        cell: (row) => <span className="text-sm font-medium">{row.name}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        width: 100,
        cell: (row) => (
          <Badge
            variant="secondary"
            className="rounded"
            style={row.status === 'active'
              ? { backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color-dark)', fontSize: 11, padding: '1px 6px' }
              : { fontSize: 11, padding: '1px 6px' }
            }
          >
            {row.status === 'active' ? 'Active' : 'Draft'}
          </Badge>
        ),
      },
      {
        key: 'sectionsLabel',
        label: 'Sections',
        width: 120,
        cell: (row) => <span className="text-sm text-muted-foreground">{row.sectionsLabel}</span>,
      },
      {
        key: 'lastModified',
        label: 'Last modified',
        width: 160,
        cell: (row) => <span className="text-sm text-muted-foreground">{row.lastModified}</span>,
      },
    ],
    [copyFromId]
  )

  // ── Pick handlers ─────────────────────────────────────────────────────────

  function goToDetails(method: PendingMethod) {
    setPendingMethod(method)
    setStep('details')
  }

  // ── Details "Continue" ────────────────────────────────────────────────────

  function handleDetailsContinue() {
    if (pendingMethod === 'build') {
      const id = createTemplate({
        name: tmplName.trim() || 'Untitled template',
        description: tmplDesc.trim() || undefined,
        sections: ['course_content'],
        status: 'draft',
        questionCount: 0,
        createdBy: user.name,
        surveyType,
        courseType,
        questions: { course_content: [], faculty_performance: [], course_director: [] },
        likertPointer: 5,
        templateSections: [],
      })
      router.push(`/templates/${id}`)
    } else {
      setStep('copy-select')
    }
  }

  // ── Copy handlers ─────────────────────────────────────────────────────────

  function handleCopyCreate() {
    if (!copySource) return
    const ts = Date.now()
    const id = createTemplate({
      name: tmplName.trim() || `Copy of ${copySource.name}`,
      description: tmplDesc.trim() || undefined,
      sections: copySource.sections,
      status: 'draft',
      questionCount: copySource.questionCount,
      createdBy: user.name,
      surveyType: copySource.surveyType,
      courseType,
      questions: copySource.questions,
      likertPointer: copySource.likertPointer,
      templateSections: copySource.templateSections?.map((sec, si) => ({
        ...sec,
        id: `sec-copy-${ts}-${si}`,
        questions: sec.questions.map((q, qi) => ({
          ...q,
          id: `q-copy-${ts}-${si}-${qi}`,
        })),
      })) ?? [],
    })
    router.push(`/templates/${id}`)
  }

  // ── Import handlers ───────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setImportName(file.name.replace(/\.[^.]+$/, ''))
    const ts = Date.now()
    setExtractedSections(
      MOCK_EXTRACTION.map((sec, si) => ({
        ...sec,
        id: `ext-${ts}-s${si}`,
        open: si === 0,
        questions: sec.questions.map((q, qi) => ({
          ...q,
          id: `ext-${ts}-q${si}-${qi}`,
        })),
      }))
    )
  }

  function handleImportCreate() {
    const ts = Date.now()
    const totalQ = extractedSections.reduce((n, s) => n + s.questions.length, 0)
    const id = createTemplate({
      name: importName.trim() || 'Imported template',
      sections: ['course_content'],
      status: 'draft',
      questionCount: totalQ,
      createdBy: user.name,
      surveyType,
      courseType: 'any',
      questions: { course_content: [], faculty_performance: [], course_director: [] },
      likertPointer: 5,
      templateSections: extractedSections.map((sec, si) => ({
        id: `sec-import-${ts}-${si}`,
        subjectKey: 'course_content' as const,
        title: sec.title,
        order: si,
        questions: sec.questions.map((q, qi) => ({
          id: `q-import-${ts}-${si}-${qi}`,
          text: q.text,
          answerType: q.answerType,
          order: qi,
        })),
      })),
    })
    router.push(`/templates/${id}`)
  }

  function updateExtractedQ(secId: string, qId: string, patch: Partial<ExtractedQuestion>) {
    setExtractedSections(prev =>
      prev.map(s =>
        s.id !== secId ? s : {
          ...s,
          questions: s.questions.map(q => q.id !== qId ? q : { ...q, ...patch }),
        }
      )
    )
  }

  function toggleSection(secId: string) {
    setExtractedSections(prev =>
      prev.map(s => s.id === secId ? { ...s, open: !s.open } : s)
    )
  }

  function resetImport() {
    setFileName(null)
    setImportName('')
    setExtractedSections([])
    setStep('pick')
  }

  const backHref = isGeneral ? '/templates/programmatic' : '/templates'

  const stepTitle: Record<Step, string> = {
    'pick':          'New template',
    'details':       'Template details',
    'copy-select':   'Copy existing',
    'import-upload': 'Import from document',
    'import-review': 'Review extracted questions',
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader
        breadcrumbs={[{ label: isGeneral ? 'Programmatic Templates' : 'Templates', href: backHref }]}
        title={stepTitle[step]}
      />

      {/* ── Pick ── */}
      {step === 'pick' && (
        <StepShell centered>
          <header className="mb-10 text-center">
            <h1 className="text-3xl font-normal mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              New template
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Choose how you want to start.
            </p>
          </header>
          <div className="flex flex-col gap-3">
            <OptionCard
              icon="fa-pen-line"
              title="Build new"
              description="Start with a blank template and add questions your way"
              onClick={() => goToDetails('build')}
            />
            {isGeneral && (
              <OptionCard
                icon="fa-copy"
                title="Copy existing"
                description="Start from a template you already have and remix it"
                onClick={() => goToDetails('copy')}
              />
            )}
            <OptionCard
              icon="fa-file-import"
              title="Import from document"
              description="Upload a PDF or Word document — we'll extract the questions for you"
              onClick={() => setStep('import-upload')}
            />
          </div>
        </StepShell>
      )}

      {/* ── Details ── */}
      {step === 'details' && (
        <>
          <StepShell centered>
            <header className="mb-8">
              <h2 className="text-2xl font-normal mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                {pendingMethod === 'copy' ? 'Name your copy' : 'Name your template'}
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {pendingMethod === 'copy'
                  ? "You'll pick which template to copy in the next step."
                  : 'You can always update these in the builder.'}
              </p>
            </header>

            {/* Name */}
            <div className="mb-5">
              <label htmlFor="tmpl-name" className="block text-sm font-medium mb-1.5">
                Template name
              </label>
              <Input
                id="tmpl-name"
                value={tmplName}
                onChange={e => setTmplName(e.target.value)}
                placeholder="e.g. Fall 2026 Clinical Rotation Evaluation"
                className="h-9 text-sm"
                autoFocus
                maxLength={120}
              />
            </div>

            {/* Description */}
            <div className="mb-7">
              <label htmlFor="tmpl-desc" className="block text-sm font-medium mb-1.5">
                Description{' '}
                <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>(optional)</span>
              </label>
              <Textarea
                id="tmpl-desc"
                value={tmplDesc}
                onChange={e => setTmplDesc(e.target.value)}
                placeholder="What is this template for? Who fills it out?"
                className="text-sm resize-none"
                rows={3}
                maxLength={300}
              />
            </div>

            {/* Course type — Airbnb-style radio cards */}
            <div>
              <p className="text-sm font-medium mb-3">Course type</p>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Course type">
                {COURSE_TYPE_OPTIONS.map(opt => {
                  const selected = courseType === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className="w-full text-left flex items-center gap-4 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={{
                        padding: '14px 16px',
                        borderColor: selected ? 'var(--foreground)' : 'var(--border)',
                        background: 'var(--background)',
                      }}
                      onClick={() => setCourseType(opt.value)}
                    >
                      {/* Radio dot */}
                      <div
                        className="shrink-0 rounded-full border-2 flex items-center justify-center"
                        style={{
                          width: 18, height: 18,
                          borderColor: selected ? 'var(--foreground)' : 'var(--border)',
                        }}
                      >
                        {selected && (
                          <div className="rounded-full" style={{ width: 8, height: 8, background: 'var(--foreground)' }} />
                        )}
                      </div>
                      {/* Icon */}
                      <div
                        className="shrink-0 flex items-center justify-center rounded-lg"
                        style={{ width: 36, height: 36, background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                      >
                        <i className={`fa-light ${opt.icon} text-sm`} aria-hidden="true" />
                      </div>
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{opt.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </StepShell>

          <StepFooter
            onBack={() => setStep('pick')}
            onNext={handleDetailsContinue}
            nextLabel={pendingMethod === 'build' ? 'Create template' : 'Choose template to copy'}
            nextIcon={pendingMethod === 'build' ? 'fa-check' : 'fa-arrow-right'}
          />
        </>
      )}

      {/* ── Copy: select ── */}
      {step === 'copy-select' && (
        <>
          <div className="flex-1 overflow-auto" style={{ padding: '20px 28px 28px' }}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  Select a template to copy
                </h2>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  {modeTemplates.length} template{modeTemplates.length !== 1 ? 's' : ''} available. Select one to copy it.
                </p>
              </div>
            <DataTable
              data={copyTableRows}
              columns={copyColumns}
              getRowId={(row) => row.id}
              selectable={false}
              searchable={false}
              onRowClick={(row) => setCopyFromId(row.id as string)}
              emptyState={
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <i className="fa-light fa-rectangle-list text-3xl" aria-hidden="true"
                     style={{ color: 'var(--muted-foreground)' }} />
                  <p className="text-sm font-medium">No templates yet</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Build your first template to copy it later.
                  </p>
                </div>
              }
            />
            </div>
          </div>

          <StepFooter
            onBack={() => setStep('details')}
            onNext={copyFromId ? handleCopyCreate : undefined}
            nextLabel="Copy & edit"
            nextDisabled={!copyFromId}
            nextIcon="fa-pencil"
          />
        </>
      )}

      {/* ── Import: upload ── */}
      {step === 'import-upload' && (
        <>
          <StepShell centered>
            <header className="mb-8 text-center">
              <h2 className="text-2xl font-normal mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Upload your document
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                We'll extract sections and questions automatically.<br />
                Supported: PDF, Word, plain text.
              </p>
            </header>

            <div className="mb-6">
              <label htmlFor="import-name" className="block text-sm font-medium mb-1.5">
                Template name
              </label>
              <Input
                id="import-name"
                value={importName}
                onChange={e => setImportName(e.target.value)}
                placeholder="Untitled template"
                className="h-9 text-sm"
              />
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="sr-only"
              onChange={handleFileChange}
            />

            {!fileName ? (
              <button
                type="button"
                className="w-full rounded-2xl border-2 border-dashed border-border flex flex-col items-center gap-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ padding: '48px 24px' }}
                onClick={() => fileRef.current?.click()}
              >
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: 56, height: 56, background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                >
                  <i className="fa-light fa-cloud-arrow-up text-2xl" aria-hidden="true" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Click to upload</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>PDF · DOCX · TXT</p>
                </div>
              </button>
            ) : (
              <div
                className="flex items-center gap-3 rounded-xl border border-border"
                style={{ padding: '14px 18px', background: 'var(--muted)' }}
              >
                <i className="fa-light fa-file-lines text-xl shrink-0" aria-hidden="true"
                   style={{ color: 'var(--muted-foreground)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--brand-color)' }}>
                    <i className="fa-light fa-circle-check mr-1" aria-hidden="true" />
                    Ready to extract
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove file"
                  onClick={() => { setFileName(null); setExtractedSections([]) }}
                >
                  <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                </Button>
              </div>
            )}
          </StepShell>

          <StepFooter
            onBack={() => { resetImport() }}
            onNext={fileName ? () => setStep('import-review') : undefined}
            nextLabel="Extract questions"
            nextDisabled={!fileName}
            nextIcon="fa-wand-magic-sparkles"
          />
        </>
      )}

      {/* ── Import: review ── */}
      {step === 'import-review' && (
        <>
          <StepShell>
            <header className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <i className="fa-light fa-file-lines text-sm" aria-hidden="true"
                   style={{ color: 'var(--muted-foreground)' }} />
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{fileName}</p>
              </div>
              <h2 className="text-lg font-semibold">Review extracted questions</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {extractedSections.reduce((n, s) => n + s.questions.length, 0)} questions across{' '}
                {extractedSections.length} section{extractedSections.length !== 1 ? 's' : ''} — edit text or change types before creating.
              </p>
            </header>

            <div className="mb-6" style={{ maxWidth: 480 }}>
              <label htmlFor="import-name-review" className="block text-sm font-medium mb-1.5">
                Template name
              </label>
              <Input
                id="import-name-review"
                value={importName}
                onChange={e => setImportName(e.target.value)}
                placeholder="Untitled template"
                className="h-9 text-sm"
              />
            </div>

            <div className="flex flex-col gap-3" style={{ maxWidth: 760 }}>
              {extractedSections.map((sec, si) => (
                <div
                  key={sec.id}
                  className="rounded-xl border border-border overflow-hidden"
                  style={{ background: 'var(--background)' }}
                >
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    style={{
                      padding: '12px 18px',
                      background: 'var(--muted)',
                      borderBottom: sec.open ? '1px solid var(--border)' : 'none',
                    }}
                    onClick={() => toggleSection(sec.id)}
                  >
                    <span
                      className="text-xs font-semibold tabular-nums shrink-0 rounded-md flex items-center justify-center"
                      style={{ width: 22, height: 22, background: 'var(--border)', color: 'var(--muted-foreground)' }}
                    >
                      {si + 1}
                    </span>
                    <span className="text-sm font-bold flex-1 min-w-0">{sec.title}</span>
                    <span className="text-xs shrink-0 mr-2" style={{ color: 'var(--muted-foreground)' }}>
                      {sec.questions.length} question{sec.questions.length !== 1 ? 's' : ''}
                    </span>
                    <i
                      className={`fa-solid fa-chevron-${sec.open ? 'up' : 'down'} text-xs shrink-0`}
                      aria-hidden="true"
                      style={{ color: 'var(--muted-foreground)' }}
                    />
                  </button>
                  {sec.open && (
                    <div className="flex flex-col">
                      {sec.questions.map((q, qi) => (
                        <div
                          key={q.id}
                          className="flex items-start gap-3"
                          style={{
                            padding: '12px 18px',
                            borderTop: qi > 0 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          <span
                            className="text-xs tabular-nums shrink-0 mt-2"
                            style={{ color: 'var(--muted-foreground)', width: 22, textAlign: 'right' }}
                          >
                            {qi + 1}
                          </span>
                          <div className="flex flex-col gap-2 flex-1 min-w-0">
                            <Input
                              value={q.text}
                              onChange={e => updateExtractedQ(sec.id, q.id, { text: e.target.value })}
                              placeholder="Question text"
                              className="h-8 text-sm"
                            />
                            <Select
                              value={q.answerType}
                              onValueChange={val => updateExtractedQ(sec.id, q.id, { answerType: val as AnswerType })}
                            >
                              <SelectTrigger className="h-7 text-xs" aria-label="Question type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Q_TYPE_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </StepShell>

          <StepFooter
            onBack={() => setStep('import-upload')}
            onNext={handleImportCreate}
            nextLabel="Create template"
            nextIcon="fa-check"
          />
        </>
      )}
    </div>
  )
}

export default function NewTemplatePage() {
  return (
    <Suspense>
      <NewTemplateInner />
    </Suspense>
  )
}
