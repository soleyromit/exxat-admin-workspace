'use client'

/* AI features: Quiz & Question Generator (Cohere demo), Smart Replacement,
   Semantic Search. Component-substitution pass to @exxatdesignux/ui — modal
   chrome, buttons, cards, badges, inputs, checkboxes are now DS components.
   Staged generate animation, relevance ranking, and side-by-side replace
   comparison behavior are preserved unchanged. */

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Card,
  CardContent,
  Badge,
  Input,
  Textarea,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@exxatdesignux/ui'
import { Icon, LeoStar } from '../icons'
import { Field } from '../primitives'
import {
  QTYPE,
  qIcon,
  fmt2,
  QUESTION_BANK,
  type Question,
  type BankQuestion,
  type GeneratedQuestion,
} from '../data'

// ---- shared generated-question sample (for the demo) ----
const AI_GENERATED: GeneratedQuestion[] = [
  { id: 'g1', type: 'mcq', points: 4, difficulty: 'Medium', bloom: 'Understand', topic: 'Beta Blockers',
    stem: 'A patient with HFrEF and asthma needs a beta-blocker. Which agent is the safest initial choice?',
    options: [{ text: 'Metoprolol succinate (β1-selective)', correct: true }, { text: 'Propranolol (non-selective)', correct: false }, { text: 'Carvedilol (α/β blocker)', correct: false }, { text: 'Nadolol (non-selective)', correct: false }] },
  { id: 'g2', type: 'msq', points: 5, difficulty: 'Hard', bloom: 'Apply', topic: 'Heart Failure',
    stem: 'Select ALL guideline-directed medical therapies shown to reduce mortality in HFrEF.',
    options: [{ text: 'ARNI (sacubitril/valsartan)', correct: true }, { text: 'Beta-blocker', correct: true }, { text: 'MRA (spironolactone)', correct: true }, { text: 'SGLT2 inhibitor', correct: true }, { text: 'Loop diuretic', correct: false }] },
  { id: 'g3', type: 'tf', points: 2, difficulty: 'Easy', bloom: 'Remember', topic: 'ACE Inhibitors',
    stem: 'ACE inhibitors are contraindicated in pregnancy due to fetal renal toxicity.',
    options: [{ text: 'True', correct: true }, { text: 'False', correct: false }] },
  { id: 'g4', type: 'mcq', points: 4, difficulty: 'Medium', bloom: 'Apply', topic: 'Diuretics',
    stem: 'A patient on furosemide develops hypokalemia and metabolic alkalosis. Which add-on agent best counters both?',
    options: [{ text: 'Spironolactone', correct: true }, { text: 'Acetazolamide', correct: false }, { text: 'Hydrochlorothiazide', correct: false }, { text: 'Mannitol', correct: false }] },
  { id: 'g5', type: 'mcq', points: 4, difficulty: 'Hard', bloom: 'Analyze', topic: 'Antiarrhythmics',
    stem: "Which mechanism explains amiodarone's broad antiarrhythmic profile across multiple Vaughan-Williams classes?",
    options: [{ text: 'Blockade of K+, Na+, Ca2+ channels and β-receptors', correct: true }, { text: 'Pure potassium channel blockade', correct: false }, { text: 'Selective L-type calcium blockade', correct: false }, { text: 'Funny-current (If) inhibition', correct: false }] },
]

// Brand-tinted callout (replaces the scoped .ai-banner). Token-only bg/border.
function AIBanner({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      display: 'flex', gap: 11, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12,
      background: 'oklch(from var(--brand-color) l c h / 0.07)',
      border: '1px solid oklch(from var(--brand-color) l c h / 0.26)',
      ...style,
    }}>{children}</div>
  )
}

// Leo gradient tile (keeps the defined --leo-gradient token).
function LeoTile({ size = 38 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: 'var(--leo-gradient)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <LeoStar style={{ color: 'var(--primary-foreground)', fontSize: size * 0.45, filter: 'brightness(3)' }} />
    </div>
  )
}

function AIGenPanel({ onAccept, onClose, embedded }: { onAccept: (qs: GeneratedQuestion[]) => void; onClose: () => void; embedded?: boolean }) {
  const [stage, setStage] = useState<'input' | 'generating' | 'review'>('input')
  const [src, setSrc] = useState<'topic' | 'case' | 'deck'>('topic')
  const [topic, setTopic] = useState('Heart failure pharmacotherapy & guideline-directed medical therapy')
  const [count, setCount] = useState(5)
  const [types, setTypes] = useState<Record<string, boolean>>({ mcq: true, msq: true, tf: true })
  const [diff, setDiff] = useState('Mixed')
  const [progress, setProgress] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [picked, setPicked] = useState<string[]>(() => AI_GENERATED.map(g => g.id))

  const steps = ['Reading source material', 'Mapping to MED-201 learning objectives', 'Drafting question stems', 'Generating distractors & answer keys', 'Checking for cohort re-exposure']

  useEffect(() => {
    if (stage !== 'generating') return
    setProgress(0); setStepIdx(0)
    const iv = setInterval(() => setProgress(p => Math.min(100, p + 4)), 70)
    const sv = setInterval(() => setStepIdx(i => Math.min(steps.length - 1, i + 1)), 700)
    const done = setTimeout(() => { clearInterval(iv); clearInterval(sv); setStage('review') }, 3700)
    return () => { clearInterval(iv); clearInterval(sv); clearTimeout(done) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  const togglePick = (id: string) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  return (
    <div>
      {stage === 'input' && (
        <div>
          <AIBanner style={{ marginBottom: 18 }}>
            <LeoStar style={{ fontSize: 18 }} />
            <div style={{ fontSize: 13 }}>Supply a <b>syllabus topic</b>, <b>clinical case</b>, or <b>slide deck</b> — Leo drafts structured questions and formats them into a quiz ready to preview and edit.</div>
          </AIBanner>
          <Field label="Source">
            <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              {([['topic', 'Topic', 'book'], ['case', 'Clinical case', 'file-lines'], ['deck', 'Slide deck', 'layer-group']] as const).map(([k, l, ic]) => (
                <Button type="button" key={k} variant={src === k ? 'default' : 'outline'} size="sm" aria-pressed={src === k} onClick={() => setSrc(k)}><Icon name={ic} />{l}</Button>
              ))}
            </div>
          </Field>
          {src === 'topic' && <Field label="Topic or concept"><Textarea rows={2} value={topic} onChange={e => setTopic(e.target.value)} /></Field>}
          {src === 'case' && <Field label="Clinical case stem"><Textarea rows={3} placeholder="A 68-year-old with NYHA class III HFrEF presents with…" /></Field>}
          {src === 'deck' && (
            <Field label="Upload slide deck or reference">
              <div style={{ border: '1.5px dashed var(--border-control-35)', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--muted)' }}>
                <Icon name="file-import" style={{ fontSize: 20, color: 'var(--brand-color-dark)' }} />
                <div><div style={{ fontSize: 13, fontWeight: 500 }}>Lecture_07_HeartFailure.pptx</div><div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>14 slides · ready to ingest</div></div>
              </div>
            </Field>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Number of questions"><Input type="number" value={count} min={1} max={20} onChange={e => setCount(+e.target.value)} /></Field>
            <Field label="Difficulty">
              <Select value={diff} onValueChange={setDiff}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{['Mixed', 'Easy', 'Medium', 'Hard'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Question types">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.entries(QTYPE).map(([k, v]) => (
                <Button type="button" key={k} variant={types[k] ? 'default' : 'outline'} size="sm" aria-pressed={!!types[k]} onClick={() => setTypes(t => ({ ...t, [k]: !t[k] }))}>
                  <Icon name={qIcon(k)} />{v.short}
                </Button>
              ))}
            </div>
          </Field>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            {!embedded && <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>}
            <Button type="button" style={{ marginLeft: 'auto' }} onClick={() => setStage('generating')}><LeoStar style={{ filter: 'brightness(3)' }} />Generate quiz</Button>
          </div>
        </div>
      )}

      {stage === 'generating' && (
        <div style={{ padding: '26px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <LeoTile size={40} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Leo is drafting your quiz…</div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Cohere-powered · {count} questions on cardiovascular pharmacology</div>
            </div>
          </div>
          <div style={{ height: 8, background: 'var(--muted)', borderRadius: 999, overflow: 'hidden', marginBottom: 22 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--leo-gradient)', borderRadius: 999, transition: 'width .1s linear' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 11, opacity: i <= stepIdx ? 1 : 0.4, transition: 'opacity .3s' }}>
                <div style={{ width: 20, height: 20, borderRadius: 999, display: 'grid', placeItems: 'center', background: i < stepIdx ? 'var(--chip-2)' : i === stepIdx ? 'var(--brand-color)' : 'var(--muted)', color: 'var(--primary-foreground)', fontSize: 12 }}>
                  {i < stepIdx ? <Icon name="check" style={{ fontSize: 12 }} /> : <span>{i + 1}</span>}
                </div>
                <span style={{ fontSize: 13, fontWeight: i === stepIdx ? 600 : 400 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stage === 'review' && (
        <div>
          <AIBanner style={{ marginBottom: 16 }}>
            <LeoStar style={{ fontSize: 16 }} />
            <div style={{ fontSize: 12.5 }}><b>{AI_GENERATED.length} questions drafted.</b> Review and edit before adding — all are previously-unused to avoid re-exposure. Selected: {picked.length}.</div>
          </AIBanner>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: embedded ? 'none' : '44vh', overflowY: 'auto' }}>
            {AI_GENERATED.map(g => {
              const on = picked.includes(g.id)
              return (
                <Card key={g.id} style={{ borderRadius: 12, borderColor: on ? 'oklch(from var(--brand-color) l c h / 0.40)' : 'var(--border)' }}>
                  <CardContent style={{ padding: '13px 15px' }}>
                  <div style={{ display: 'flex', gap: 11 }}>
                    <Checkbox checked={on} onCheckedChange={() => togglePick(g.id)} aria-label={on ? 'Deselect question' : 'Select question'} style={{ marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Badge variant="outline"><Icon name={qIcon(g.type)} />{QTYPE[g.type].short}</Badge>
                        <Badge variant="secondary">{g.difficulty}</Badge>
                        <Badge variant="outline">{g.topic}</Badge>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted-foreground)' }}>{g.points} pts</span>
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.45 }}>{g.stem}</div>
                      <div style={{ marginTop: 7, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {g.options.map((o, i) => (
                          <div key={i} style={{ fontSize: 12, color: o.correct ? 'var(--chip-2)' : 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Icon name={o.correct ? 'circle-check' : 'circle'} style={{ fontSize: 12 }} />{o.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
            <Button type="button" variant="ghost" onClick={() => setStage('input')}><Icon name="arrow-left" />Regenerate</Button>
            <span style={{ marginLeft: 'auto' }} />
            <Button type="button" onClick={() => onAccept(AI_GENERATED.filter(g => picked.includes(g.id)))}><Icon name="plus" />Add {picked.length} to assessment</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AIQuizGenerator({ onAccept, onClose }: { onAccept: (qs: GeneratedQuestion[]) => void; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-[620px]">
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LeoTile />
            <div style={{ flex: 1 }}>
              <DialogTitle>AI Quiz &amp; Question Generator</DialogTitle>
              <DialogDescription>Draft a structured quiz from a topic, case, or slide deck</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <AIGenPanel onAccept={onAccept} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}

// ---- Smart Question Replacement ----
export function SmartReplace({ question, onAccept, onClose }: { question: Question; onAccept: (alt: Partial<Question>) => void; onClose: () => void }) {
  const alt: Partial<Question> & { psy: { p: number; disc: number; pbi: number } } = {
    stem: 'A 60-year-old with newly diagnosed hypertension and type 2 diabetes is started on an ACE inhibitor. Which effect on glomerular hemodynamics underlies its renoprotective benefit?',
    options: [
      { text: 'Efferent arteriolar dilation, lowering intraglomerular pressure', correct: true },
      { text: 'Afferent arteriolar dilation, raising filtration fraction', correct: false },
      { text: 'Increased angiotensin II–mediated efferent tone', correct: false },
      { text: 'Enhanced aldosterone-driven sodium retention', correct: false },
    ],
    topic: 'ACE Inhibitors', difficulty: 'Medium', bloom: 'Understand', psy: { p: 0.64, disc: 0.44, pbi: 0.41 },
  }
  const Q = ({ title, stem, opts, tone }: { title: string; stem: string; opts: { text: string; correct: boolean }[]; tone?: 'new' }) => (
    <Card style={{ borderRadius: 12, flex: 1, borderColor: tone === 'new' ? 'oklch(from var(--brand-color) l c h / 0.40)' : 'var(--border)' }}>
      <CardContent style={{ padding: 16 }}>
      <div style={{ marginBottom: 10 }}>
        <Badge variant={tone === 'new' ? 'default' : 'secondary'}>{title}</Badge>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.45, marginBottom: 10 }}>{stem}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {opts.map((o, i) => <div key={i} style={{ fontSize: 12, color: o.correct ? 'var(--chip-2)' : 'var(--muted-foreground)', display: 'flex', gap: 6, alignItems: 'center' }}><Icon name={o.correct ? 'circle-check' : 'circle'} style={{ fontSize: 12 }} />{o.text}</div>)}
      </div>
      </CardContent>
    </Card>
  )
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-[760px]">
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LeoTile />
            <div style={{ flex: 1 }}>
              <DialogTitle>Smart question replacement</DialogTitle>
              <DialogDescription>An equally relevant, previously-unused item — avoids re-exposure across cohorts</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
            <Q title="Current question" stem={question.stem} opts={question.options || [{ text: '—', correct: false }]} />
            <div style={{ display: 'grid', placeItems: 'center', color: 'var(--muted-foreground)' }}><Icon name="arrow-right" style={{ fontSize: 18 }} /></div>
            <Q title="Leo's suggestion" stem={alt.stem!} opts={alt.options!} tone="new" />
          </div>
          <AIBanner style={{ marginTop: 14 }}>
            <LeoStar />
            <div style={{ fontSize: 12.5 }}>Same learning objective and Bloom's level ({alt.bloom}), matched difficulty (index {fmt2(alt.psy.p)}), and <b>never administered to this cohort</b>. Discrimination {fmt2(alt.psy.disc)} · point-biserial {fmt2(alt.psy.pbi)}.</div>
          </AIBanner>
        </div>
        <DialogFooter>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', marginRight: 'auto' }}>You review and approve every AI replacement.</span>
          <Button type="button" variant="ghost" onClick={onClose}>Keep current</Button>
          <Button type="button" onClick={() => onAccept(alt)}><Icon name="check" />Accept replacement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- QB Detail Panel ----
function QBDetailPanel({ q, onSelect, onClose }: { q: BankQuestion & { rel: number }; onSelect: () => void; onClose: () => void }) {
  const SAMPLE_OPTIONS: Record<string, { text: string; correct: boolean }[]> = {
    qb1: [{ text: 'Bradykinin accumulation', correct: true }, { text: 'Prostaglandin release', correct: false }, { text: 'Direct mast cell activation', correct: false }, { text: 'Histamine release', correct: false }],
    qb3: [{ text: 'Nifedipine', correct: true }, { text: 'Diltiazem', correct: false }, { text: 'Verapamil', correct: false }, { text: 'Amlodipine', correct: false }],
    qb5: [{ text: 'Neprilysin inhibition → natriuretic peptide accumulation', correct: true }, { text: 'ACE inhibition → bradykinin accumulation', correct: false }, { text: 'ARB → AT1 blockade', correct: false }, { text: 'Direct vasodilation', correct: false }],
    qb9: [{ text: 'Thick ascending limb of the loop of Henle', correct: true }, { text: 'Proximal convoluted tubule', correct: false }, { text: 'Distal convoluted tubule', correct: false }, { text: 'Collecting duct', correct: false }],
  }
  const opts = SAMPLE_OPTIONS[q.id]
  const diffBar = (v: number, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--muted)', overflow: 'hidden' }}>
        <div style={{ width: `${v * 100}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, width: 32 }}>{fmt2(v)}</span>
    </div>
  )
  return (
    <div
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 360, background: 'var(--background)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 10 }}
      onClick={e => e.stopPropagation()}
    >
      {/* header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            <Badge variant="outline"><Icon name={qIcon(q.type)} />{QTYPE[q.type].short}</Badge>
            <Badge variant="secondary">{q.difficulty}</Badge>
            <Badge variant="outline">{q.topic}</Badge>
            {q.used && <Badge variant="outline"><Icon name="clock" />Used</Badge>}
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Close detail panel" onClick={onClose}>
          <Icon name="xmark" style={{ fontSize: 12 }} />
        </Button>
      </div>
      {/* body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        <div style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 14 }}>{q.stem}</div>
        {opts && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
            {opts.map((o, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, background: o.correct ? 'oklch(from var(--chart-2) l c h / 0.08)' : 'var(--muted)', border: `1px solid ${o.correct ? 'oklch(from var(--chart-2) l c h / 0.3)' : 'var(--border)'}` }}>
                <Icon name={o.correct ? 'circle-check' : 'circle'} style={{ fontSize: 13, color: o.correct ? 'var(--chart-2)' : 'var(--muted-foreground)', marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 12, lineHeight: 1.4 }}>{o.text}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Psychometrics</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <div><div className="hint" style={{ marginBottom: 4 }}>Difficulty index (p)</div>{diffBar(q.p, q.p > 0.9 || q.p < 0.3 ? 'var(--chart-4)' : 'var(--chart-2)')}</div>
          <div><div className="hint" style={{ marginBottom: 4 }}>Discrimination</div>{diffBar(q.disc, q.disc < 0.15 ? 'var(--destructive)' : q.disc < 0.3 ? 'var(--chart-4)' : 'var(--chart-2)')}</div>
          <div><div className="hint" style={{ marginBottom: 4 }}>Point-biserial</div>{diffBar(q.pbi, q.pbi < 0.1 ? 'var(--destructive)' : q.pbi < 0.25 ? 'var(--chart-4)' : 'var(--chart-2)')}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span className="hint">Bloom&apos;s</span><span>{q.bloom}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span className="hint">Topic</span><span>{q.topic}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span className="hint">Used before</span><span>{q.used ? 'Yes' : 'No'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span className="hint">Relevance</span><span style={{ fontWeight: 600, color: 'var(--brand-color-dark)' }}>{q.rel}%</span>
          </div>
        </div>
      </div>
      {/* footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <Button type="button" variant="default" style={{ width: '100%' }} onClick={onSelect}>
          <Icon name="plus" />Add to assessment
        </Button>
      </div>
    </div>
  )
}

// ---- Semantic Search (Question Bank) ----
export function SemanticSearch({ onAdd, onClose }: { onAdd: (qs: BankQuestion[]) => void; onClose: () => void }) {
  const [query, setQuery] = useState("fundamental cardiology pharmacology under Bloom's recall level")
  const [picked, setPicked] = useState<string[]>([])
  const [fTopic, setFTopic] = useState('Any')
  const [detail, setDetail] = useState<(BankQuestion & { rel: number }) | null>(null)
  const toggle = (id: string) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  // fake relevance ranking — stable per mount (no Math.random in render)
  const ranked = QUESTION_BANK.map((q, i) => ({ ...q, rel: Math.round(62 + ((i * 17) % 38)) })).sort((a, b) => b.rel - a.rel)
    .filter(q => fTopic === 'Any' || q.topic === fTopic)
  const topics = ['Any', ...Array.from(new Set(QUESTION_BANK.map(q => q.topic)))]

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-[820px]" style={{ height: '82vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--muted)', display: 'grid', placeItems: 'center', color: 'var(--brand-color-dark)', flexShrink: 0 }}><Icon name="rectangle-list" style={{ fontSize: 17 }} /></div>
            <div style={{ flex: 1 }}>
              <DialogTitle>Add from Question Bank</DialogTitle>
              <DialogDescription>AI semantic search — query natural-language concepts, not just keywords</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative' }}>
            <LeoStar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }} />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Describe what you're looking for…" style={{ paddingLeft: 36, paddingRight: 92 }} aria-label="Semantic search query" />
            <Badge variant="secondary" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>Semantic</Badge>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Filter:</span>
            <Select value={fTopic} onValueChange={setFTopic}>
              <SelectTrigger size="sm" style={{ width: 200 }}><SelectValue /></SelectTrigger>
              <SelectContent>{topics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm"><Icon name="gauge-high" />Bloom&apos;s: Any</Button>
            <Button type="button" variant="outline" size="sm"><Icon name="circle-half-stroke" />Difficulty: Any</Button>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginRight: detail ? 360 : 0, transition: 'margin-right 0.2s' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {ranked.map(q => {
              const on = picked.includes(q.id)
              const isDetail = detail?.id === q.id
              return (
                <Card key={q.id} style={{ borderRadius: 12, cursor: 'pointer', borderColor: isDetail ? 'var(--brand-color)' : on ? 'oklch(from var(--brand-color) l c h / 0.40)' : 'var(--border)' }} onClick={() => toggle(q.id)}>
                  <CardContent style={{ padding: '12px 14px', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <Checkbox checked={on} onCheckedChange={() => toggle(q.id)} aria-label={on ? 'Deselect question' : 'Select question'} onClick={e => e.stopPropagation()} style={{ marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' }}>
                      <Badge variant="outline"><Icon name={qIcon(q.type)} />{QTYPE[q.type].short}</Badge>
                      <Badge variant="secondary">{q.difficulty}</Badge>
                      <Badge variant="outline">{q.topic}</Badge>
                      {q.used && <Badge variant="outline"><Icon name="clock" />Used before</Badge>}
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 56, height: 6, borderRadius: 999, background: 'var(--muted)', overflow: 'hidden' }}>
                          <div style={{ width: `${q.rel}%`, height: '100%', borderRadius: 999, background: 'var(--brand-color)' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-color-dark)', width: 32 }}>{q.rel}%</span>
                      </span>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.4 }}>{q.stem}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{q.bloom} · p={fmt2(q.p)} · disc={fmt2(q.disc)} · pbi={fmt2(q.pbi)}</span>
                      <Button type="button" variant="ghost" size="sm" style={{ marginLeft: 'auto', fontSize: 12 }}
                        onClick={e => { e.stopPropagation(); setDetail(isDetail ? null : q) }}>
                        <Icon name={isDetail ? 'chevron-right' : 'expand'} style={{ fontSize: 11 }} />{isDetail ? 'Close' : 'View'}
                      </Button>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
        {detail && (
          <QBDetailPanel
            q={detail}
            onSelect={() => { if (!picked.includes(detail.id)) setPicked(p => [...p, detail.id]); setDetail(null) }}
            onClose={() => setDetail(null)}
          />
        )}
        <DialogFooter>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', marginRight: 'auto' }}>Adding pins a reference; editing here creates a local draft only.</span>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" disabled={!picked.length} onClick={() => onAdd(ranked.filter(q => picked.includes(q.id)))}><Icon name="plus" />Add {picked.length || ''} question{picked.length !== 1 ? 's' : ''}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
