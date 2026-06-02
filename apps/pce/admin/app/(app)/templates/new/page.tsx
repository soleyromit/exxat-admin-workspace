'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Button } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import type { SurveyType } from '@/lib/pce-mock-data'

type Step = 'pick' | 'copy'

function NewTemplateInner() {
  const { templates, createTemplate, user } = usePce()
  const router = useRouter()
  const params = useSearchParams()
  const isGeneral = params.get('mode') === 'programmatic'
  const surveyType: SurveyType = isGeneral ? 'programmatic' : 'course_evaluation'

  const [step, setStep] = useState<Step>('pick')
  const [copyFromId, setCopyFromId] = useState<string | null>(null)

  const modeTemplates = templates.filter(t =>
    isGeneral
      ? t.surveyType === 'programmatic'
      : (!t.surveyType || t.surveyType === 'course_evaluation')
  )

  function handleBuildNew() {
    const id = createTemplate({
      name: 'Untitled template',
      sections: ['course_content'],
      status: 'draft',
      questionCount: 0,
      createdBy: user.name,
      surveyType,
      questions: { course_content: [], faculty_performance: [], course_director: [] },
      likertPointer: 5,
      templateSections: [],
    })
    router.push(`/templates/${id}`)
  }

  function handleCopyEdit() {
    if (!copyFromId) return
    const source = modeTemplates.find(t => t.id === copyFromId)
    if (!source) return
    const ts = Date.now()
    const id = createTemplate({
      name: `Copy of ${source.name}`,
      sections: source.sections,
      status: 'draft',
      questionCount: source.questionCount,
      createdBy: user.name,
      surveyType: source.surveyType,
      questions: source.questions,
      likertPointer: source.likertPointer,
      templateSections: source.templateSections?.map((sec, si) => ({
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

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader
        breadcrumbs={[{ label: isGeneral ? 'Programmatic Templates' : 'Templates', href: isGeneral ? '/templates/programmatic' : '/templates' }]}
        title={step === 'copy' ? 'Copy existing' : 'New template'}
      />

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center" style={{ padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>

          {/* ── Pick step ── */}
          {step === 'pick' && (
            <>
              <header className="mb-10 text-center">
                <h1
                  className="text-3xl font-normal mb-2"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  New template
                </h1>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Choose how you want to start.
                </p>
              </header>

              <div className="flex flex-col gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  className="group h-auto w-full justify-start gap-5 rounded-xl border border-border px-6 py-5 hover:bg-muted"
                  onClick={handleBuildNew}
                >
                  <div
                    className="flex items-center justify-center shrink-0 rounded-lg"
                    style={{ width: 44, height: 44, background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                  >
                    <i className="fa-light fa-pen-line text-lg" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      Build new
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      Start with a blank template and add questions your way
                    </p>
                  </div>
                  <i className="fa-light fa-arrow-right text-sm shrink-0" aria-hidden="true"
                     style={{ color: 'var(--muted-foreground)' }} />
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  className="group h-auto w-full justify-start gap-5 rounded-xl border border-border px-6 py-5 hover:bg-muted"
                  onClick={() => setStep('copy')}
                >
                  <div
                    className="flex items-center justify-center shrink-0 rounded-lg"
                    style={{ width: 44, height: 44, background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                  >
                    <i className="fa-light fa-copy text-lg" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      Copy existing
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      Start from a template you already have and remix it
                    </p>
                  </div>
                  <i className="fa-light fa-arrow-right text-sm shrink-0" aria-hidden="true"
                     style={{ color: 'var(--muted-foreground)' }} />
                </Button>
              </div>
            </>
          )}

          {/* ── Copy step ── */}
          {step === 'copy' && (
            <>
              <header className="mb-10 text-center">
                <h1
                  className="text-3xl font-normal mb-2"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Copy existing
                </h1>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  Select a template — all its sections and questions will be copied.
                </p>
              </header>

              <div className="rounded-xl border border-border overflow-hidden mb-4">
                {modeTemplates.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-16 text-center px-6">
                    <i className="fa-light fa-rectangle-list text-3xl" aria-hidden="true"
                       style={{ color: 'var(--muted-foreground)' }} />
                    <p className="text-sm font-medium">No templates yet</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      Build your first template to be able to copy it later.
                    </p>
                  </div>
                ) : (
                  modeTemplates.map((tmpl, i) => {
                    const selected = copyFromId === tmpl.id
                    const qCount = tmpl.templateSections?.reduce((n, s) => n + s.questions.length, 0) ?? tmpl.questionCount
                    return (
                      <div
                        key={tmpl.id}
                        role="button"
                        tabIndex={0}
                        className="flex items-center gap-4 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                        style={{
                          padding: '14px 20px',
                          paddingLeft: selected ? 18 : 20,
                          borderBottom: i < modeTemplates.length - 1 ? '1px solid var(--border)' : 'none',
                          background: selected ? 'var(--muted)' : 'transparent',
                          borderLeft: selected ? '2px solid var(--brand-color)' : '2px solid transparent',
                        }}
                        onClick={() => setCopyFromId(tmpl.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCopyFromId(tmpl.id) } }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tmpl.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                            {tmpl.templateSections?.length ?? 0} section{tmpl.templateSections?.length !== 1 ? 's' : ''} · {qCount} question{qCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {selected
                          ? <i className="fa-solid fa-circle-check text-sm shrink-0" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
                          : <i className="fa-light fa-circle text-sm shrink-0" aria-hidden="true" style={{ color: 'var(--border)' }} />
                        }
                      </div>
                    )
                  })
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => { setStep('pick'); setCopyFromId(null) }}>
                  <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
                  Back
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={!copyFromId}
                  onClick={handleCopyEdit}
                >
                  <i className="fa-light fa-copy text-xs" aria-hidden="true" />
                  Copy &amp; open in builder
                </Button>
              </div>
            </>
          )}

        </div>
      </div>
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
