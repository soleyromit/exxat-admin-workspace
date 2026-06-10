'use client'

/* Blueprint Setup Wizard — define intent & parameters before the builder */

import { useState } from 'react'
import { Button, Card, CardContent, Input, Textarea, Badge, ToggleSwitch, AvatarInitials } from '@exxatdesignux/ui'
import { Icon, LeoStar } from '../icons'
import { Field, useApp } from '../primitives'
import { FACULTY, PAST_ASSESSMENTS, type BuilderMeta } from '../data'

interface WizardStepMeta {
  title: string
  icon: string
  phase: string
  captures: string
  purpose: string
  why: string
  feeds: string
}

const WIZARD_STEPS: WizardStepMeta[] = [
  {
    title: 'Intent & details',
    icon: 'file-pen',
    phase: 'Phase 1–2 · Basics + intent',
    captures: 'Name · Type · Grading · Goal · Audience',
    purpose: 'Name the exam and capture the “why” behind it.',
    why: "Digitizing the intent keeps every collaborator and reviewer aligned without an offline meeting — the exam's goal travels with it.",
    feeds: 'Header context throughout the builder, and the alignment reviewers check against.',
  },
  {
    title: 'Courses & team',
    icon: 'users',
    phase: 'Phase 2 · Collaboration',
    captures: 'Course(s) · Syllabus · Owner · Collaborators',
    purpose: 'Link the exam to courses and delegate sections to co-authors.',
    why: 'Multi-course exams require a collaborator from each course; section delegation lets authors draft their parts in parallel.',
    feeds: 'Who owns which section in the builder — and the two-level review workflow that follows.',
  },
  {
    title: 'Starting point',
    icon: 'recycle',
    phase: 'V0 pathway',
    captures: 'Recycle · Generate with AI · From scratch',
    purpose: 'Choose how to begin building.',
    why: 'Recycling a past assessment ingests its structure, question mix and historical difficulty as a fully editable template — the V0 core pathway.',
    feeds: 'The sections and questions you land on when the builder opens.',
  },
  {
    title: 'Target blueprint',
    icon: 'chart-simple',
    phase: 'Phase 2 · Targets',
    captures: 'Topic % · Difficulty % · Question-type %',
    purpose: 'Set the target topic, difficulty and question-type mix.',
    why: 'These targets become the yardstick the builder measures the live exam against, flagging drift as you author.',
    feeds: "The overview panel's distribution tracking inside the builder.",
  },
]

/* The whole flow, drawn once, so you see what each step does before starting —
   and that it all flows into the Builder. */
function WizardFlowOverview({ step, onJump }: { step: number; onJump: (i: number) => void }) {
  return (
    <Card className="pad" style={{ marginBottom: 22 }}>
      <CardContent>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>How setup works — four steps, then the builder</div>
        <div className="hint">Each step digitizes a layer of the blueprint. Click any step to jump.</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, flexWrap: 'wrap' }}>
        {WIZARD_STEPS.map((s, i) => {
          const active = i === step
          const done = i < step
          return (
            <div style={{ display: 'contents' }} key={s.title}>
              <Button
                variant="ghost"
                onClick={() => onJump(i)}
                aria-label={`Jump to step ${i + 1}: ${s.title}`}
                aria-pressed={active}
               
                style={{
                  flex: '1 1 0',
                  minWidth: 150,
                  height: 'auto',
                  display: 'block',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '12px 13px',
                  borderRadius: 12,
                  borderColor: active ? 'var(--brand-color)' : 'var(--border)',
                  boxShadow: active ? '0 0 0 3px oklch(from var(--brand-color) l c h / 0.13)' : 'none',
                  background: active ? 'oklch(from var(--brand-color) l c h / 0.05)' : 'var(--card)',
                  whiteSpace: 'normal',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 999,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      background: done ? 'var(--chip-2)' : active ? 'var(--brand-color)' : 'var(--muted)',
                      color: done || active ? 'white' : 'var(--muted-foreground)',
                    }}
                  >
                    {done ? <Icon name="check" /> : i + 1}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2 }}>{s.title}</span>
                </div>
                <div className="hint" style={{ fontSize: 11, lineHeight: 1.4 }}>{s.captures}</div>
              </Button>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px', color: 'var(--border-control-3)', flexShrink: 0 }}>
                <Icon name="arrow-right" style={{ fontSize: 13 }} />
              </div>
            </div>
          )
        })}
        <Card
         
          style={{
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '12px 14px',
            borderRadius: 12,
            background: 'oklch(from var(--brand-color) l c h / 0.08)',
            borderColor: 'oklch(from var(--brand-color) l c h / 0.26)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="hammer" style={{ fontSize: 15, color: 'var(--brand-color-dark)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>Builder</span>
          </div>
          <div className="hint" style={{ fontSize: 11, marginTop: 6, maxWidth: 120, lineHeight: 1.4 }}>Author, configure & review</div>
        </Card>
      </div>
      </CardContent>
    </Card>
  )
}

/* The "what is this step for" band shown at the top of each step's content. */
function StepGuide({ step }: { step: number }) {
  const s = WIZARD_STEPS[step]
  if (!s) return null
  return (
    <div style={{ display: 'flex', gap: 13, padding: '13px 15px', borderRadius: 12, background: 'var(--muted)', marginBottom: 20, alignItems: 'flex-start' }}>
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--card)',
          color: 'var(--brand-color-dark)',
          flexShrink: 0,
          boxShadow: '0 1px 2px oklch(from var(--foreground) l c h / 0.06)',
        }}
      >
        <Icon name={s.icon} style={{ fontSize: 16 }} />
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{s.purpose}</span>
          <Badge variant="secondary" style={{ fontSize: 9.5 }}>{s.phase}</Badge>
        </div>
        <div className="hint" style={{ lineHeight: 1.45 }}>{s.why}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, fontSize: 11.5, color: 'var(--brand-color-dark)', fontWeight: 500 }}>
          <Icon name="arrow-right" style={{ fontSize: 11 }} />
          <span style={{ color: 'var(--muted-foreground)' }}>Feeds:</span> {s.feeds}
        </div>
      </div>
    </div>
  )
}

function DistroBlock({
  title,
  data,
  setData,
  colors,
}: {
  title: string
  data: Record<string, number>
  setData: (next: Record<string, number>) => void
  colors: string[]
}) {
  const keys = Object.keys(data)
  const total = keys.reduce((s, k) => s + data[k], 0)
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        <span className="hint" style={{ color: total === 100 ? 'var(--chip-2)' : 'var(--chart-4)' }}>
          {total}%{total !== 100 ? ' · adjust to 100' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', marginBottom: 14 }}>
        {keys.map((k, i) => (
          <div key={k} style={{ width: `${data[k]}%`, background: colors[i % colors.length] }}></div>
        ))}
      </div>
      {keys.map((k, i) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: colors[i % colors.length], flexShrink: 0 }}></span>
          <span style={{ fontSize: 12.5, width: 110, flexShrink: 0 }}>{k}</span>
          {/* DS exposes no Slider primitive — keep native range input per spec. */}
          <input
            type="range"
            min="0"
            max="60"
            value={data[k]}
            onChange={(e) => setData({ ...data, [k]: +e.target.value })}
            style={{ flex: 1, accentColor: 'var(--brand-color)' }}
            aria-label={`${title} — ${k}`}
          />
          <span style={{ fontSize: 12, fontWeight: 600, width: 38, textAlign: 'right' }}>{data[k]}%</span>
        </div>
      ))}
    </div>
  )
}

/* DS-compliant segmented control: bordered inline-flex of DS Buttons. */
function Segmented({
  options,
  value,
  onSelect,
  isSelected,
  isDisabled,
  renderLabel,
}: {
  options: readonly string[]
  value: string
  onSelect: (v: string) => void
  isSelected: (v: string) => boolean
  isDisabled?: (v: string) => boolean
  renderLabel?: (v: string) => React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        width: '100%',
        gap: 4,
        padding: 3,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        background: 'var(--muted)',
      }}
    >
      {options.map((x) => {
        const sel = isSelected(x)
        return (
          <Button
            key={x}
            type="button"
            variant={sel ? 'default' : 'ghost'}
            size="sm"
            aria-pressed={sel}
            disabled={isDisabled ? isDisabled(x) : false}
            onClick={() => onSelect(x)}
            style={{ flex: 1 }}
          >
            {renderLabel ? renderLabel(x) : x}
          </Button>
        )
      })}
    </div>
  )
}

export function BlueprintWizard({
  onCancel,
  onFinish,
}: {
  onCancel: () => void
  onFinish: (data: Partial<BuilderMeta>, pathway: string) => void
}) {
  const { notify } = useApp()
  const [step, setStep] = useState(0)
  const [pathway, setPathway] = useState('recycle') // recycle | scratch | ai
  const [recycleId, setRecycleId] = useState('p1')
  const [collabs, setCollabs] = useState<string[]>(['okafor', 'nair', 'ta'])
  const [courses, setCourses] = useState<string[]>(['MED-201'])
  const [type, setType] = useState<'Exam' | 'Quiz' | 'Assignment'>('Exam')
  const [graded, setGraded] = useState(true)
  const [name, setName] = useState('Cardiovascular Pharmacology — Midterm')
  const [intent, setIntent] = useState(
    'Evaluate foundational knowledge of cardiovascular pharmacology across antihypertensives, antiarrhythmics, heart-failure, and anticoagulation therapy.',
  )
  const [audience, setAudience] = useState('Year 2 · Doctor of Medicine')
  const [syllabus, setSyllabus] = useState(true)
  // target distribution sliders
  const [topicMix, setTopicMix] = useState<Record<string, number>>({
    Antihypertensives: 30,
    Antiarrhythmics: 25,
    'Heart Failure': 25,
    Anticoagulation: 20,
  })
  const [diffMix, setDiffMix] = useState<Record<string, number>>({ Easy: 30, Medium: 50, Hard: 20 })
  const [typeMix, setTypeMix] = useState<Record<string, number>>({ MCQ: 55, MSQ: 15, Essay: 15, Other: 15 })

  const steps = ['Intent & details', 'Courses & team', 'Starting point', 'Target blueprint']

  function finish() {
    onFinish(
      { name, course: courses[0], type, graded, intent, audience, collaborators: collabs as BuilderMeta['collaborators'], owner: 'schen' },
      pathway,
    )
  }

  const recycle = PAST_ASSESSMENTS.find((p) => p.id === recycleId)

  return (
    <div className="content" style={{ maxWidth: 1080 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">New assessment</h1>
          <p className="page-sub">Set the blueprint — Leo pre-fills what it can; you control everything.</p>
        </div>
        <Button type="button" variant="ghost" onClick={onCancel}>
          <Icon name="xmark" />Cancel
        </Button>
      </div>

      {/* full-flow overview map */}
      <WizardFlowOverview step={step} onJump={setStep} />

      <Card className="pad" style={{ minHeight: 380 }}>
        <StepGuide step={step} />
        {step === 0 && (
          <div style={{ maxWidth: 620 }}>
            <Field label="Assessment name" req>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="field-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Field label="Assessment type" req>
                <Segmented
                  options={['Exam', 'Quiz', 'Assignment'] as const}
                  value={type}
                  onSelect={(v) => setType(v as 'Exam' | 'Quiz' | 'Assignment')}
                  isSelected={(x) => type === x}
                  isDisabled={(x) => x === 'Assignment'}
                  renderLabel={(x) => (
                    <>
                      {x}
                      {x === 'Assignment' && <span style={{ fontSize: 10 }}> · soon</span>}
                    </>
                  )}
                />
              </Field>
              <Field label="Grading">
                <Segmented
                  options={['Graded', 'Ungraded'] as const}
                  value={graded ? 'Graded' : 'Ungraded'}
                  onSelect={(v) => setGraded(v === 'Graded')}
                  isSelected={(x) => (x === 'Graded' ? graded : !graded)}
                  isDisabled={(x) => x === 'Ungraded' && type === 'Exam'}
                />
              </Field>
            </div>
            {type === 'Exam' && (
              <div className="hint" style={{ marginTop: -8, marginBottom: 14 }}>
                Exams are always graded & summative. Ungraded is available for Quiz & Assignment.
              </div>
            )}
            <Field label="Primary goal / intent" hint="Digitizes the 'why' so collaborators and reviewers stay aligned without an offline meeting.">
              <Textarea rows={3} value={intent} onChange={(e) => setIntent(e.target.value)} />
            </Field>
            <Field label="Target audience level">
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div style={{ maxWidth: 680 }}>
            <Field
              label="Course association"
              req
              hint="Links to active courses from Exxat Prism or your LMS. With multiple courses, at least one collaborator from each is required."
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['MED-201', 'MED-301', 'PHRM-220'].map((c) => {
                  const active = courses.includes(c)
                  return (
                    <Button
                      type="button"
                      key={c}
                      variant={active ? 'default' : 'outline'}
                      size="sm"
                      aria-pressed={active}
                      onClick={() => setCourses((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]))}
                    >
                      <Icon name={active ? 'circle-check' : 'circle'} w={active ? 'solid' : 'light'} />
                      {c}
                    </Button>
                  )
                })}
              </div>
            </Field>
            <div className="ai-banner" style={{ marginBottom: 18 }}>
              <LeoStar />
              <div style={{ fontSize: 12.5 }}>
                <b>Prism integration.</b> Learning Objectives, competencies, and curriculum tags for <b>MED-201</b> will auto-fetch from Exxat Prism. For the MVP these can be populated manually.
              </div>
            </div>
            <Field label="Reference syllabus">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Button type="button" variant="outline" aria-pressed={syllabus} onClick={() => setSyllabus(true)}>
                  <Icon name="file-pdf" />MED-201_Syllabus_F26.pdf
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setSyllabus(true); notify('Syllabus synced from Exxat Prism — attached', 'success') }}>
                  <Icon name="rotate" />Sync from Prism
                </Button>
              </div>
              <span className="hint" style={{ marginTop: 8 }}>
                AI-driven syllabus parsing & topic mapping is a future capability — used now to ground sourcing.
              </span>
            </Field>
            <div className="divider"></div>
            <Field label="Primary owner / admin" hint="Responsible for final publishing.">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AvatarInitials initials={FACULTY.schen.initials} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Dr. Sarah Chen</div>
                  <div className="hint">Course Coordinator · you</div>
                </div>
              </div>
            </Field>
            <Field label="Collaborators & section delegation" hint="Co-authors get section-level drafting rights. You can change these anytime in the builder.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(['okafor', 'nair', 'ta'] as const).map((id) => {
                  const f = FACULTY[id]
                  const on = collabs.includes(id)
                  return (
                    <Card key={id} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12 }}>
                      <AvatarInitials initials={FACULTY[id].initials} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</div>
                        <div className="hint">{f.role}</div>
                      </div>
                      <ToggleSwitch
                        checked={on}
                        onChange={() => setCollabs((cs) => (on ? cs.filter((x) => x !== id) : [...cs, id]))}
                      />
                    </Card>
                  )
                })}
              </div>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 16 }}>How do you want to begin building?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
              {[
                { id: 'recycle', ic: 'recycle', t: 'Recycle past assessment', d: 'Ingest sections, question mix & historical difficulty. Then customize everything.', badge: 'V0 recommended' },
                { id: 'ai', ic: null, t: 'Generate with AI', d: 'Supply a topic, case, or slide deck — Leo drafts a structured quiz to edit.', badge: 'Cohere demo' },
                { id: 'scratch', ic: 'table-cells-large', t: 'Start from scratch', d: 'Build sections manually. Save the structure as a reusable blueprint.', badge: null },
              ].map((o) => (
                <Card
                  key={o.id}
                  onClick={() => setPathway(o.id)}
                  style={{
                    padding: 18,
                    cursor: 'pointer',
                    borderRadius: 16,
                    borderColor: pathway === o.id ? 'var(--brand-color)' : 'var(--border)',
                    boxShadow: pathway === o.id ? '0 0 0 3px oklch(from var(--brand-color) l c h / 0.16)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    {o.id === 'ai' ? (
                      <LeoStar style={{ fontSize: 20 }} />
                    ) : (
                      <Icon name={o.ic as string} style={{ fontSize: 19, color: 'var(--brand-color-dark)' }} />
                    )}
                    {o.badge && <Badge variant="secondary">{o.badge}</Badge>}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 5 }}>{o.t}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted-foreground)', lineHeight: 1.45 }}>{o.d}</div>
                </Card>
              ))}
            </div>

            {pathway === 'recycle' && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Select an assessment to use as a template</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PAST_ASSESSMENTS.map((p) => {
                    const on = recycleId === p.id
                    return (
                      <Card
                        key={p.id}
                        onClick={() => setRecycleId(p.id)}
                        style={{
                          padding: '14px 16px',
                          cursor: 'pointer',
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          borderColor: on ? 'var(--brand-color)' : 'var(--border)',
                          boxShadow: on ? '0 0 0 3px oklch(from var(--brand-color) l c h / 0.14)' : 'none',
                        }}
                      >
                        <Icon
                          name={on ? 'circle-check' : 'circle'}
                          w={on ? 'solid' : 'light'}
                          style={{ color: on ? 'var(--brand-color)' : 'var(--muted-foreground)', fontSize: 18 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {p.name}
                            {p.recommended && <Badge variant="secondary">Best match</Badge>}
                          </div>
                          <div className="hint" style={{ marginTop: 3 }}>
                            {p.cohort} · {p.sections} sections · {p.questions} questions · avg difficulty {p.avgDiff}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {Object.entries(p.mix).map(([k, v]) => (
                            <Badge key={k} variant="secondary">
                              {k} {v}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    )
                  })}
                </div>
                <div className="info-banner" style={{ marginTop: 14 }}>
                  <Icon name="circle-info" w="solid" />
                  <div>
                    Ingests structure, question type/category distribution, and historical difficulty data only — <b>template-based, not AI document parsing</b>. You keep full manual control after import.
                  </div>
                </div>
              </div>
            )}
            {pathway === 'ai' && (
              <div className="ai-banner">
                <LeoStar style={{ fontSize: 18 }} />
                <div style={{ fontSize: 13 }}>
                  Leo's <b>Quiz & Question Generator</b> opens in the builder once you finish setup — supply a syllabus topic, clinical case, or slide deck and it drafts a structured quiz ready to preview and edit.
                </div>
              </div>
            )}
            {pathway === 'scratch' && (
              <div className="info-banner">
                <Icon name="table-cells-large" w="solid" />
                <div>
                  You'll start with one empty section. Add sections and questions manually — then save this architecture as a reusable "from-scratch" blueprint.
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
            <div>
              <DistroBlock title="Topic weightage" data={topicMix} setData={setTopicMix} colors={['var(--chart-1)', 'var(--chart-2)', 'var(--chart-4)', 'var(--chart-5)']} />
              <DistroBlock title="Difficulty distribution" data={diffMix} setData={setDiffMix} colors={['var(--chart-2)', 'var(--chart-4)', 'var(--destructive)']} />
            </div>
            <div>
              <DistroBlock title="Question type distribution" data={typeMix} setData={setTypeMix} colors={['var(--chart-1)', 'var(--chart-3)', 'var(--chart-5)', 'var(--muted-foreground)']} />
              <div className="ai-banner" style={{ marginTop: 18 }}>
                <LeoStar />
                <div style={{ fontSize: 12.5 }}>
                  {pathway === 'recycle' ? (
                    <span>
                      Inherited from <b>{recycle?.name}</b>. Adjust any slider — the builder will flag drift from these targets as you author.
                    </span>
                  ) : (
                    <span>Set your targets. The builder's overview panel tracks the live exam against these as you author.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: 'flex', gap: 10, marginTop: 18, alignItems: 'center' }}>
        <Button type="button" variant="ghost" onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}>
          <Icon name="arrow-left" />
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        <span className="hint" style={{ marginLeft: 'auto' }}>
          Step {step + 1} of {steps.length}
        </span>
        {step < steps.length - 1 ? (
          <Button type="button" variant="default" onClick={() => setStep(step + 1)}>
            Continue
            <Icon name="arrow-right" w="solid" />
          </Button>
        ) : (
          <Button type="button" variant="default" style={{ background: 'var(--brand-color)', color: 'white' }} onClick={finish}>
            <Icon name="hammer" w="solid" />
            Open builder
          </Button>
        )}
      </div>
    </div>
  )
}
