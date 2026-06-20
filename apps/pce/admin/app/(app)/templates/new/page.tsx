'use client'

import { useState, useRef, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import {
  Button, Badge, Input,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import type { SurveyType, CourseTypeFilter, TemplateQuestion } from '@/lib/pce-mock-data'


type Step =
  | 'pick'
  | 'copy-select'
  | 'import-upload'

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
  { value: 'didactic', label: 'Classroom based', description: 'Lecture or online didactic course',     icon: 'fa-chalkboard-teacher' },
  { value: 'clinical', label: 'Practice based',  description: 'Rotation, placement, or practicum',      icon: 'fa-stethoscope' },
  { value: 'seminar',  label: 'Lab based',       description: 'Lab or hands-on skills course',          icon: 'fa-flask' },
]

interface ExtractedSection {
  id: string
  title: string
  open: boolean
  questions: { id: string; text: string; answerType: string }[]
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

  function handleBuildNew() {
    const id = createTemplate({
      name: 'Untitled template',
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
    router.push(isGeneral ? `/templates/programmatic/${id}` : `/templates/${id}`)
  }

  // ── Copy handlers ─────────────────────────────────────────────────────────

  function handleCopyCreate() {
    if (!copySource) return
    const ts = Date.now()
    const id = createTemplate({
      name: `Copy of ${copySource.name}`,
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
    router.push(isGeneral ? `/templates/programmatic/${id}` : `/templates/${id}`)
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
          answerType: q.answerType as TemplateQuestion['answerType'],
          order: qi,
        })),
      })),
    })
    router.push(isGeneral ? `/templates/programmatic/${id}` : `/templates/${id}`)
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
    'copy-select':   'Copy existing',
    'import-upload': 'Import from document',
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
          <header className="mb-8 text-center">
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
              onClick={handleBuildNew}
            />
            {isGeneral && (
              <OptionCard
                icon="fa-copy"
                title="Copy existing"
                description="Start from a template you already have and remix it"
                onClick={() => setStep('copy-select')}
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
            onBack={() => setStep('pick')}
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
            onNext={fileName ? handleImportCreate : undefined}
            nextLabel="Create template"
            nextDisabled={!fileName}
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
