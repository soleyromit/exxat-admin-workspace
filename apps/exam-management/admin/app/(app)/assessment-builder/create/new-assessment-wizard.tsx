'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input, Textarea, ToggleSwitch, Card } from '@exxatdesignux/ui'
import { mockCourses } from '@/lib/qb-mock-data'
import { facultyListRows } from '@/lib/faculty-mock-data'

type AsmtType = 'Exam' | 'Quiz' | 'Assignment'
type Grading = 'Graded' | 'Ungraded'
type StartMode = 'recycle' | 'ai' | 'scratch'

const STEPS = ['Intent & details', 'Courses & team', 'Starting point', 'Target blueprint'] as const

interface Dist { label: string; pct: number; color: string }
const TOPIC_INIT: Dist[] = [
  { label: 'Antihypertensives', pct: 30, color: 'var(--chart-1)' },
  { label: 'Antiarrhythmics', pct: 25, color: 'var(--chart-2)' },
  { label: 'Heart Failure', pct: 25, color: 'var(--chart-4)' },
  { label: 'Anticoagulation', pct: 20, color: 'var(--chart-3)' },
]
const QTYPE_INIT: Dist[] = [
  { label: 'MCQ', pct: 55, color: 'var(--chart-1)' },
  { label: 'MSQ', pct: 15, color: 'var(--chart-2)' },
  { label: 'Essay', pct: 15, color: 'var(--chart-4)' },
  { label: 'Other', pct: 15, color: 'var(--muted-foreground)' },
]
const DIFF_INIT: Dist[] = [
  { label: 'Easy', pct: 30, color: 'var(--chart-2)' },
  { label: 'Medium', pct: 50, color: 'var(--chart-4)' },
  { label: 'Hard', pct: 20, color: 'var(--chart-1)' },
]

const TEMPLATES = [
  { id: 't1', name: 'Cardiovascular Pharmacology — Midterm (Fall 2025)', meta: 'Year 2 · Fall 2025 · 3 sections · 26 questions · avg difficulty 0.64', best: true, mix: ['MCQ 14', 'MSQ 2', 'T/F 3', 'Match 2', 'Essay 2', 'FITB 1'] },
  { id: 't2', name: 'Diuretics & Electrolytes — Spring 2026', meta: 'Year 2 · Spring 2026 · 2 sections · 28 questions · avg difficulty 0.71', best: false, mix: ['MCQ 18', 'MSQ 3', 'T/F 4', 'Match 1', 'Essay 2'] },
  { id: 't3', name: 'Cardiovascular Pharmacology — Midterm (Fall 2024)', meta: 'Year 2 · Fall 2024 · 3 sections · 24 questions · avg difficulty 0.58', best: false, mix: ['MCQ 15', 'MSQ 3', 'T/F 2', 'Match 2', 'Essay 2'] },
]

export default function NewAssessmentWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseFromUrl = searchParams?.get('courseId') ?? null

  const [step, setStep] = useState(0)
  const [name, setName] = useState('Cardiovascular Pharmacology — Midterm')
  const [type, setType] = useState<AsmtType>('Exam')
  const [grading, setGrading] = useState<Grading>('Graded')
  const [intent, setIntent] = useState('Evaluate foundational knowledge of cardiovascular pharmacology across antihypertensives, antiarrhythmics, heart-failure, and anticoagulation therapy.')
  const [audience, setAudience] = useState('Year 2 · Doctor of Medicine')

  const [courseIds, setCourseIds] = useState<string[]>(courseFromUrl ? [courseFromUrl] : [mockCourses[0]?.id ?? ''])
  const [collabIds, setCollabIds] = useState<string[]>(facultyListRows.slice(1, 4).map(f => f.id))

  const [startMode, setStartMode] = useState<StartMode>('recycle')
  const [templateId, setTemplateId] = useState('t1')

  const [topic, setTopic] = useState<Dist[]>(TOPIC_INIT)
  const [qtype, setQtype] = useState<Dist[]>(QTYPE_INIT)
  const [diff, setDiff] = useState<Dist[]>(DIFF_INIT)

  const isLast = step === STEPS.length - 1

  function next() {
    if (isLast) {
      router.push(`/assessment-builder?new=1${courseIds[0] ? `&courseId=${courseIds[0]}` : ''}`)
      return
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }
  function back() { setStep(s => Math.max(s - 1, 0)) }

  return (
    <div className="flex flex-col h-full overflow-auto bg-background">
      <div className="mx-auto w-full max-w-[1180px] px-8 py-7">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">New assessment</h1>
            <p className="text-sm text-muted-foreground mt-1">Set the blueprint — Leo pre-fills what it can; you control everything.</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.push('/courses')}>
            <i className="fa-light fa-xmark" aria-hidden="true" />
            Cancel
          </Button>
        </div>

        {/* Stepper */}
        <div className="flex items-center mt-6 mb-6">
          {STEPS.map((label, i) => {
            const done = i < step
            const active = i === step
            const last = i === STEPS.length - 1
            return (
              <div key={label} className="flex items-center" style={{ flex: last ? '0 0 auto' : 1 }}>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={[
                      'flex size-6 items-center justify-center rounded-full border text-xs font-semibold',
                      done || active ? 'bg-[var(--brand-color)] border-[var(--brand-color)] text-white' : 'bg-card border-border text-muted-foreground',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {done ? <i className="fa-solid fa-check text-[10px]" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={`text-sm ${active ? 'font-semibold text-foreground' : done ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                </div>
                {!last && <div className={`h-px flex-1 mx-3 ${done ? 'bg-[var(--brand-color)]' : 'bg-border'}`} aria-hidden="true" />}
              </div>
            )
          })}
        </div>

        {/* Step panel */}
        <Card className="p-6">
          {step === 0 && <StepIntent {...{ name, setName, type, setType, grading, setGrading, intent, setIntent, audience, setAudience }} />}
          {step === 1 && <StepCourses {...{ courseIds, setCourseIds, collabIds, setCollabIds }} />}
          {step === 2 && <StepStarting {...{ startMode, setStartMode, templateId, setTemplateId }} />}
          {step === 3 && <StepBlueprint {...{ topic, setTopic, qtype, setQtype, diff, setDiff, templateName: TEMPLATES.find(t => t.id === templateId)?.name ?? '' }} />}
        </Card>

        {/* Footer */}
        <div className="flex items-center justify-between mt-5">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={step === 0 ? () => router.push('/courses') : back}>
            <i className="fa-light fa-arrow-left" aria-hidden="true" />
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
            <Button variant="default" size="sm" className="gap-1.5" onClick={next}>
              {isLast ? <><i className="fa-light fa-pen-ruler" aria-hidden="true" />Open builder</> : <>Continue<i className="fa-light fa-arrow-right" aria-hidden="true" /></>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Step 1: Intent & details ─────────────────────────────────────────────── */
function StepIntent(p: {
  name: string; setName: (v: string) => void
  type: AsmtType; setType: (v: AsmtType) => void
  grading: Grading; setGrading: (v: Grading) => void
  intent: string; setIntent: (v: string) => void
  audience: string; setAudience: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-5 max-w-[640px]">
      <Field label="Assessment name" required>
        <Input value={p.name} onChange={e => p.setName(e.target.value)} className="text-sm" />
      </Field>
      <div className="flex gap-8">
        <Field label="Assessment type" required>
          <Segmented value={p.type} onChange={p.setType} options={['Exam', 'Quiz', 'Assignment'] as const} soon={['Assignment']} />
        </Field>
        <Field label="Grading">
          <Segmented value={p.grading} onChange={p.setGrading} options={['Graded', 'Ungraded'] as const} />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">Exams are always graded &amp; summative. Ungraded is available for Quiz &amp; Assignment.</p>
      <Field label="Primary goal / intent">
        <Textarea value={p.intent} onChange={e => p.setIntent(e.target.value)} className="text-sm min-h-[76px] resize-y" />
        <p className="text-xs text-muted-foreground mt-1.5">Digitizes the &lsquo;why&rsquo; so collaborators and reviewers stay aligned without an offline meeting.</p>
      </Field>
      <Field label="Target audience level">
        <Input value={p.audience} onChange={e => p.setAudience(e.target.value)} className="text-sm" />
      </Field>
    </div>
  )
}

/* ── Step 2: Courses & team ───────────────────────────────────────────────── */
function StepCourses(p: {
  courseIds: string[]; setCourseIds: (v: string[]) => void
  collabIds: string[]; setCollabIds: (v: string[]) => void
}) {
  const courses = mockCourses.slice(0, 3)
  const collaborators = facultyListRows.slice(1, 4)
  const toggleCourse = (id: string) => p.setCourseIds(p.courseIds.includes(id) ? p.courseIds.filter(c => c !== id) : [...p.courseIds, id])
  const toggleCollab = (id: string) => p.setCollabIds(p.collabIds.includes(id) ? p.collabIds.filter(c => c !== id) : [...p.collabIds, id])
  const primary = courses.find(c => p.courseIds.includes(c.id)) ?? courses[0]

  return (
    <div className="flex flex-col gap-5 max-w-[720px]">
      <Field label="Course association" required>
        <div className="flex flex-wrap gap-2">
          {courses.map(c => {
            const on = p.courseIds.includes(c.id)
            return (
              <Button key={c.id} variant="outline" size="sm" onClick={() => toggleCourse(c.id)}
                className={`h-7 gap-1.5 ${on ? 'border-[var(--brand-color)] bg-[var(--brand-tint)] text-[var(--brand-color)]' : ''}`}>
                {on && <i className="fa-solid fa-check text-[10px]" aria-hidden="true" />}
                {c.code}
              </Button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">Links to active courses from Exxat Prism or your LMS. With multiple courses, at least one collaborator from each is required.</p>
      </Field>

      <div className="rounded-lg bg-[var(--brand-tint)] p-3">
        <p className="text-xs text-foreground">
          <i className="fa-light fa-wand-magic-sparkles mr-1.5 text-[var(--brand-color)]" aria-hidden="true" />
          <span className="font-semibold">Prism integration.</span> Learning Objectives, competencies, and curriculum tags for {primary?.code} will auto-fetch from Exxat Prism. For the MVP these can be populated manually.
        </p>
      </div>

      <Field label="Reference syllabus">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 h-8 text-sm text-foreground">
            <i className="fa-light fa-file-pdf text-muted-foreground" aria-hidden="true" />
            {primary?.code}_Syllabus_F26.pdf
          </span>
          <Button variant="outline" size="sm" className="gap-1.5">
            <i className="fa-light fa-rotate text-xs" aria-hidden="true" />
            Sync from Prism
          </Button>
        </div>
      </Field>

      <Field label="Primary owner / admin">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-[var(--brand-color)] text-xs font-semibold text-white" aria-hidden="true">SC</span>
          <div>
            <p className="text-sm font-medium text-foreground">Dr. Sarah Chen <span className="text-xs font-normal text-muted-foreground">· Course Coordinator · you</span></p>
            <p className="text-xs text-muted-foreground">Responsible for final publishing.</p>
          </div>
        </div>
      </Field>

      <Field label="Collaborators & section delegation">
        <div className="flex flex-col gap-2">
          {collaborators.map((f, i) => (
            <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
              <span className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white shrink-0 ${['bg-[var(--chart-1)]', 'bg-[var(--chart-2)]', 'bg-[var(--chart-4)]'][i % 3]}`} aria-hidden="true">
                {f.fullName.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{f.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{f.adminPosition}</p>
              </div>
              <label htmlFor={`delegate-${f.id}`} className="sr-only">Delegate section drafting to {f.fullName}</label>
              <ToggleSwitch id={`delegate-${f.id}`} checked={p.collabIds.includes(f.id)} onChange={() => toggleCollab(f.id)} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">Co-authors get section-level drafting rights. You can change these anytime in the builder.</p>
      </Field>
    </div>
  )
}

/* ── Step 3: Starting point ───────────────────────────────────────────────── */
function StepStarting(p: {
  startMode: StartMode; setStartMode: (v: StartMode) => void
  templateId: string; setTemplateId: (v: string) => void
}) {
  const MODES: { id: StartMode; icon: string; title: string; desc: string; tag?: string }[] = [
    { id: 'recycle', icon: 'fa-recycle', title: 'Recycle past assessment', desc: 'Ingest sections, question mix & historical difficulty. Then customize everything.', tag: 'V0 recommended' },
    { id: 'ai', icon: 'fa-wand-magic-sparkles', title: 'Generate with AI', desc: 'Supply a topic, case, or slide deck — Leo drafts a structured quiz to edit.', tag: 'Cohere demo' },
    { id: 'scratch', icon: 'fa-table-cells', title: 'Start from scratch', desc: 'Build sections manually. Save the structure as a reusable blueprint.' },
  ]
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-medium text-foreground">How do you want to begin building?</p>
      <div className="grid grid-cols-3 gap-3">
        {MODES.map(m => {
          const on = p.startMode === m.id
          return (
            <Button key={m.id} variant="outline" onClick={() => p.setStartMode(m.id)}
              className={`h-auto flex-col items-start gap-0 p-4 text-left whitespace-normal ${on ? 'border-[var(--brand-color)] bg-[var(--brand-tint)]' : ''}`}>
              <span className="flex w-full items-center justify-between mb-2">
                <i className={`fa-light ${m.icon} text-base ${on ? 'text-[var(--brand-color)]' : 'text-muted-foreground'}`} aria-hidden="true" />
                {m.tag && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded text-[var(--brand-color)] ${on ? 'bg-card' : 'bg-muted'}`}>{m.tag}</span>}
              </span>
              <span className="text-sm font-semibold text-foreground">{m.title}</span>
              <span className="text-xs font-normal text-muted-foreground mt-1">{m.desc}</span>
            </Button>
          )
        })}
      </div>

      {p.startMode === 'recycle' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Select an assessment to use as a template</p>
          {TEMPLATES.map(t => {
            const on = p.templateId === t.id
            return (
              <Button key={t.id} variant="outline" onClick={() => p.setTemplateId(t.id)}
                className={`h-auto w-full justify-start gap-3 px-4 py-3 text-left whitespace-normal ${on ? 'border-[var(--brand-color)] bg-[var(--brand-tint)]' : ''}`}>
                <i className={`fa-${on ? 'solid' : 'regular'} fa-circle${on ? '-check' : ''} text-sm shrink-0 ${on ? 'text-[var(--brand-color)]' : 'text-[var(--border-control-35)]'}`} aria-hidden="true" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-foreground">{t.name} {t.best && <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-card text-[var(--brand-color)]">Best match</span>}</span>
                  <span className="block text-xs font-normal text-muted-foreground">{t.meta}</span>
                </span>
                <span className="hidden md:flex gap-1 shrink-0">
                  {t.mix.map(m => <span key={m} className="text-[10px] font-normal text-muted-foreground bg-muted rounded px-1.5 py-0.5">{m}</span>)}
                </span>
              </Button>
            )
          })}
          <div className="rounded-lg bg-muted p-3 mt-1">
            <p className="text-xs text-muted-foreground">
              <i className="fa-light fa-circle-info mr-1.5" aria-hidden="true" />
              Ingests structure, question type/category distribution, and historical difficulty data only — <span className="font-semibold text-foreground">template-based, not AI document parsing.</span> You keep full manual control after import.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Step 4: Target blueprint ─────────────────────────────────────────────── */
function StepBlueprint(p: {
  topic: Dist[]; setTopic: (v: Dist[]) => void
  qtype: Dist[]; setQtype: (v: Dist[]) => void
  diff: Dist[]; setDiff: (v: Dist[]) => void
  templateName: string
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
      <DistPanel title="Topic weightage" rows={p.topic} onChange={p.setTopic} />
      <DistPanel title="Question type distribution" rows={p.qtype} onChange={p.setQtype} />
      <DistPanel title="Difficulty distribution" rows={p.diff} onChange={p.setDiff} />
      <div className="rounded-lg bg-[var(--brand-tint)] p-4 self-start">
        <p className="text-xs text-foreground">
          <i className="fa-light fa-wand-magic-sparkles mr-1.5 text-[var(--brand-color)]" aria-hidden="true" />
          Inherited from <span className="font-semibold">{p.templateName}</span>. Adjust any slider — the builder will flag drift from these targets as you author.
        </p>
      </div>
    </div>
  )
}

function DistPanel({ title, rows, onChange }: { title: string; rows: Dist[]; onChange: (v: Dist[]) => void }) {
  const total = rows.reduce((s, r) => s + r.pct, 0)
  const setPct = (i: number, v: number) => onChange(rows.map((r, j) => j === i ? { ...r, pct: v } : r))
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className={`text-xs font-semibold tabular-nums ${total === 100 ? 'text-[var(--chart-2)]' : 'text-[var(--chart-4)]'}`}>{total}%</span>
      </div>
      <div className="flex h-2 gap-[2px] rounded-full overflow-hidden mb-3">
        {rows.map(r => <div key={r.label} style={{ width: `${r.pct}%`, background: r.color }} />)}
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 w-36 shrink-0">
              <span className="size-2 rounded-full shrink-0" style={{ background: r.color }} aria-hidden="true" />
              <span className="text-xs text-foreground truncate">{r.label}</span>
            </span>
            <input
              type="range" min={0} max={100} value={r.pct}
              onChange={e => setPct(i, Number(e.target.value))}
              aria-label={`${r.label} percentage`}
              className="flex-1 accent-[var(--brand-color)]"
            />
            <span className="text-xs font-medium text-foreground tabular-nums w-9 text-right">{r.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── shared ──────────────────────────────────────────────────────────────── */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-foreground mb-1.5 block">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function Segmented<T extends string>({ value, onChange, options, soon = [] }: { value: T; onChange: (v: T) => void; options: readonly T[]; soon?: T[] }) {
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted">
      {options.map(opt => {
        const on = value === opt
        const disabled = soon.includes(opt)
        return (
          <Button key={opt} variant="ghost" size="sm" disabled={disabled}
            onClick={() => !disabled && onChange(opt)}
            aria-pressed={on}
            className={`h-7 px-3 ${on ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            {opt}{disabled && <span className="ml-1 text-[10px] text-muted-foreground">· soon</span>}
          </Button>
        )
      })}
    </div>
  )
}
