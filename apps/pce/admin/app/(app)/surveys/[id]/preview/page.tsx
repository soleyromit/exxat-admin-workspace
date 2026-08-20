'use client'

// ============================================================================
// Survey Preview — the survey EXACTLY as a student experiences it (ST-12).
// Fidelity source: apps/pce/student/app/surveys/[id]/page.tsx (the real form):
// sticky course header, progress bar, section breadcrumb pills, per-section
// rating pills + optional free text, footer Previous/Next.
// Viewer logic matches the student's evaluation structure: course/general
// sections render once; FACULTY sections repeat once per evaluatee
// (survey.instructors), same as results scoring (instructorBlocks).
// Likert scale length comes from the template's likertPointer.
// Mobbin: Workable assessment preview (persistent "previewing" strip),
// 15Five likert pills with anchor labels.
// Deviations from the student form (documented):
//  • Next is NOT gated on answers — this is a verification tool; blocking
//    navigation would be hostile. Submit is permanently disabled.
//  • Field mapping: the student app's mock model marks required questions as
//    q.type === 'rating'; the admin template model expresses the same fact as
//    q.answerType === 'likert'. Semantically identical — likert = required,
//    free text = optional — the field name differs because the data models do.
//  • Selection states use inline borderColor/backgroundColor on DS Buttons —
//    deliberately replicating the student form's own selection treatment
//    (student/app/surveys/[id]/page.tsx RatingInput) with theme tokens, so the
//    admin sees the same affordance the student gets. Accepted DS-contract
//    exception for this replica surface only.
// ============================================================================

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  Textarea,
  LocalBanner,
  Badge,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { usePce } from '@/components/pce/pce-state'
import { EmptyState } from '@/components/empty-state'
import { EVAL_DEFAULT_SCALE, type TemplateQuestion, type PceInstructor } from '@/lib/pce-mock-data'

// Faculty sections are answered once per instructor — same rule the results
// page uses to render instructorBlocks (surveys/[id]/page.tsx).
const isFacultySubject = (k: string) =>
  k === 'course_instructor' || k === 'faculty' || k === 'faculty_performance'

interface PreviewSection {
  id: string
  title: string
  /** Evaluatee name when this is a per-instructor repetition of a faculty section. */
  subtitle?: string
  questions: TemplateQuestion[]
}

/** Endpoint labels for non-5-point scales; full agreement labels for 5-point. */
function scaleLabels(points: number): (string | null)[] {
  if (points === EVAL_DEFAULT_SCALE.points) return EVAL_DEFAULT_SCALE.labels
  return Array.from({ length: points }, (_, i) =>
    i === 0 ? 'Strongly Disagree' : i === points - 1 ? 'Strongly Agree' : null,
  )
}

export default function SurveyPreviewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { surveys, templates } = usePce()

  const survey = surveys.find(s => s.id === params?.id)
  const template = survey ? templates.find(t => t.id === survey.templateId) : null

  const [sectionIndex, setSectionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number | string>>({})

  // Build the student's section sequence: course/general once, faculty × evaluatee.
  const sections: PreviewSection[] = useMemo(() => {
    if (!template || !survey) return []
    const base = template.templateSections?.length
      ? [...template.templateSections].sort((a, b) => a.order - b.order)
      : template.sections.map(s => ({
          id: s,
          subjectKey: s as string,
          title: s === 'course_content' ? 'Course Content' : s === 'faculty_performance' ? 'Faculty Performance' : 'Course Director',
          questions: template.questions[s] ?? [],
          order: 0,
        }))

    return base.flatMap<PreviewSection>(section => {
      if (isFacultySubject(section.subjectKey) && survey.instructors.length > 0) {
        return survey.instructors.map((instructor: PceInstructor) => ({
          id: `${section.id}-${instructor.id}`,
          title: section.title,
          subtitle: instructor.name,
          questions: section.questions,
        }))
      }
      return [{ id: section.id, title: section.title, questions: section.questions }]
    }).filter(s => s.questions.length > 0)
  }, [template, survey])

  if (!survey || !template || sections.length === 0) {
    return (
      <>
        <SiteHeader breadcrumbs={[{ label: 'Dashboard', href: '/course-evaluation/dashboard' }]} title="Preview" />
        <div className="flex items-center justify-center flex-1 px-7 py-12">
          <EmptyState
            align="center"
            icon="fa-file-magnifying-glass"
            title="Nothing to preview"
            description={!survey ? "This survey doesn't exist." : 'This survey has no template with questions assigned yet.'}
            footer={
              <Button variant="outline" size="sm" asChild>
                <Link href={survey ? `/surveys/${survey.id}` : '/surveys'}>Back</Link>
              </Button>
            }
          />
        </div>
      </>
    )
  }

  const section = sections[sectionIndex]
  const total = sections.length
  const progress = Math.round(((sectionIndex + 1) / total) * 100)
  const isLast = sectionIndex === total - 1
  const points = template.likertPointer
  const labels = scaleLabels(points)

  const requiredQs = section.questions.filter(q => q.answerType === 'likert')

  return (
    <>
      <SiteHeader
        breadcrumbs={[
          { label: 'Dashboard', href: '/course-evaluation/dashboard' },
          { label: `${survey.courseCode}`, href: `/surveys/${survey.id}` },
        ]}
        title="Student preview"
      />

      {/* Persistent preview strip — Workable pattern */}
      <div className="px-7 pt-3">
        <LocalBanner variant="info" title="Preview Mode">
          You&apos;re viewing this evaluation exactly as a student will. Responses entered here are not recorded.
        </LocalBanner>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Student top bar replica: course identity + section position */}
        <div className="max-w-2xl mx-auto w-full px-6 pt-6 pb-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {survey.courseCode} — {survey.courseName}
            </p>
            <p className="text-xs text-muted-foreground">{survey.term}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-medium" style={{ color: 'var(--brand-color)' }}>
              Section {sectionIndex + 1} of {total}
            </span>
            <Button variant="outline" size="sm" onClick={() => router.push(`/surveys/${survey.id}`)}>
              Close Preview
            </Button>
          </div>
        </div>

        {/* Progress bar — mirrors the student form's top progress (same hand-rolled
            4px track as the student app; DS ships no Progress primitive) */}
        <div className="max-w-2xl mx-auto w-full px-6 pb-3">
          <div
            className="h-1 w-full rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--muted)' }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Survey progress"
          >
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: 'var(--brand-color)' }}
            />
          </div>
        </div>

        {/* Section breadcrumb pills — student form pattern; brand pill for the
            active step is a documented fidelity exception (student UI replica) */}
        <div className="max-w-2xl mx-auto w-full px-6 pb-4 flex items-center gap-2 overflow-x-auto">
          {sections.map((s, i) => (
            <Button
              key={s.id}
              variant="ghost"
              size="sm"
              onClick={() => setSectionIndex(i)}
              className="text-xs h-auto px-2.5 py-1 rounded-full shrink-0"
              style={{
                backgroundColor: i === sectionIndex ? 'var(--brand-color)' : i < sectionIndex ? 'var(--brand-tint)' : 'transparent',
                color: i === sectionIndex ? 'var(--primary-foreground)' : i < sectionIndex ? 'var(--brand-color)' : 'var(--muted-foreground)',
              }}
              aria-current={i === sectionIndex ? 'step' : undefined}
            >
              {i < sectionIndex && <i className="fa-solid fa-check text-xs" aria-hidden="true" />}
              {s.title}
              {s.subtitle ? ` · ${s.subtitle.split(' ').slice(-1)[0]}` : ''}
            </Button>
          ))}
        </div>

        {/* Form instructions (template-level, first section only) */}
        {sectionIndex === 0 && template.formInstructionTitle && (
          <div className="max-w-2xl mx-auto w-full px-6 pb-4">
            <p className="text-sm font-semibold">{template.formInstructionTitle}</p>
            {template.formInstructionDescription && (
              <p className="text-sm text-muted-foreground mt-0.5">{template.formInstructionDescription}</p>
            )}
          </div>
        )}

        {/* Section content — student SectionForm replica */}
        <main className="max-w-2xl mx-auto w-full px-6 pb-8 flex flex-col gap-8">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-foreground">{section.title}</h1>
              {section.subtitle && (
                <Badge variant="secondary" className="font-normal">{section.subtitle}</Badge>
              )}
            </div>
            {section.subtitle && (
              <p className="text-sm text-muted-foreground">
                These questions are answered separately for each faculty member — you&apos;re viewing the set for {section.subtitle}.
              </p>
            )}
            {/* Per-question completion dots — student pattern */}
            {requiredQs.length > 0 && (
              <div className="flex gap-1.5 mt-1" aria-hidden="true">
                {requiredQs.map(q => (
                  <span
                    key={q.id}
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor: answers[`${section.id}-${q.id}`] !== undefined ? 'var(--brand-color)' : 'var(--border)',
                      transition: 'background-color 0.15s ease',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {section.questions.map((q, i) => (
            <PreviewQuestion
              key={q.id}
              question={q}
              index={i}
              points={points}
              labels={labels}
              value={answers[`${section.id}-${q.id}`]}
              onAnswer={(v) => setAnswers(prev => ({ ...prev, [`${section.id}-${q.id}`]: v }))}
            />
          ))}
        </main>
      </div>

      {/* Footer nav — student form replica; Submit permanently disabled */}
      <footer className="sticky bottom-0 flex items-center justify-between border-t border-border px-7 py-3 bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSectionIndex(i => i - 1)}
          disabled={sectionIndex === 0}
        >
          Previous
        </Button>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {sections.map((_, i) => (
            <span
              key={i}
              className="size-1.5 rounded-full"
              style={{ backgroundColor: i <= sectionIndex ? 'var(--brand-color)' : 'var(--muted)' }}
            />
          ))}
        </div>
        {isLast ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Submitting is disabled in preview</span>
            <Button variant="default" size="sm" disabled>
              Submit
            </Button>
          </div>
        ) : (
          <Button variant="default" size="sm" onClick={() => setSectionIndex(i => i + 1)}>
            Next
          </Button>
        )}
      </footer>
    </>
  )
}

// ── Question renderers — likert pills / free text / choices ──────────────────

function PreviewQuestion({
  question,
  index,
  points,
  labels,
  value,
  onAnswer,
}: {
  question: TemplateQuestion
  index: number
  points: number
  labels: (string | null)[]
  value: number | string | undefined
  onAnswer: (v: number | string) => void
}) {
  const isLikert = question.answerType === 'likert'
  const isChoice = (question.answerType === 'single_choice' || question.answerType === 'multiple_choice') && !!question.choices?.length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <span className="text-sm font-medium tabular-nums mt-0.5 shrink-0 w-5 text-right text-muted-foreground">
          {index + 1}.
        </span>
        <p className="text-sm font-medium text-foreground">
          {question.text}
          {isLikert && <span className="ms-1 text-xs font-normal text-muted-foreground">(required)</span>}
        </p>
      </div>

      {isLikert ? (
        <div className="ms-8 flex flex-col gap-2">
          <div className="flex gap-2" role="radiogroup" aria-label={question.text}>
            {Array.from({ length: points }, (_, i) => i + 1).map(n => (
              <Button
                key={n}
                variant="outline"
                size="sm"
                role="radio"
                aria-checked={value === n}
                aria-label={labels[n - 1] ?? `${n} of ${points}`}
                onClick={() => onAnswer(n)}
                className="flex-1 h-auto py-2.5 rounded-lg"
                style={{
                  borderColor: value === n ? 'var(--brand-color)' : 'var(--border)',
                  backgroundColor: value === n ? 'var(--brand-tint)' : 'var(--background)',
                }}
              >
                <span
                  className="flex size-7 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: value === n ? 'var(--brand-color)' : 'var(--muted)',
                    color: value === n ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  }}
                >
                  {n}
                </span>
              </Button>
            ))}
          </div>
          <div className="flex">
            {Array.from({ length: points }, (_, i) => (
              <span key={i} className="flex-1 text-center text-xs text-muted-foreground leading-tight px-0.5">
                {labels[i] ?? ''}
              </span>
            ))}
          </div>
        </div>
      ) : isChoice ? (
        <div className="ms-8 flex flex-col gap-1.5">
          {question.choices!.map(choice => {
            const selected = value === choice
            return (
              <Button
                key={choice}
                variant="outline"
                size="sm"
                onClick={() => onAnswer(choice)}
                className="justify-start h-auto py-2.5 rounded-lg text-sm font-normal"
                style={{
                  borderColor: selected ? 'var(--brand-color)' : 'var(--border)',
                  backgroundColor: selected ? 'var(--brand-tint)' : 'var(--background)',
                }}
              >
                {choice}
              </Button>
            )
          })}
        </div>
      ) : (
        <div className="ms-8">
          <Textarea
            className="resize-none"
            style={{ minHeight: 80 }}
            placeholder="Share your thoughts… (optional)"
            value={(value as string) ?? ''}
            onChange={e => onAnswer(e.target.value)}
            rows={3}
            aria-label={question.text}
          />
        </div>
      )}
    </div>
  )
}
