'use client'

/* AssessmentBuilder — sections, questions, drag-drop, AI, overview panel,
   Configure & Delivery tabs, and all modals. Faithful port of AssessmentBuilder
   in the Claude Design builder.jsx (overview layout = sidebar, AI entry = modal,
   density = card — the chosen product defaults). */

import { useState, useRef, useEffect } from 'react'
import { Button, Tabs, TabsList, TabsTrigger, Badge, Input, AvatarGroup, AvatarInitials } from '@exxatdesignux/ui'
import { Icon, LeoStar } from './icons'
import { useApp } from './primitives'
import { AssessmentStatusBadge } from './assessment-status-badge'
import {
  FACULTY, totalQuestions,
  type Section, type Question, type BuilderMeta,
  type GeneratedQuestion, type BankQuestion, type QTypeKey, type Difficulty,
} from './data'
import { SectionCard } from './builder/section-card'
import { BuilderStart } from './builder/builder-start'
import { OverviewPanel } from './builder/overview-panel'
import { QuestionEditor } from './builder/question-editor'
import { AIQuizGenerator, SmartReplace, SemanticSearch } from './builder/ai-tools'
import { ConfigureTab, DeliveryTab } from './builder/configure-tab'
import { CollabPanel } from './builder/collab-panel'
import { PreviewSim } from './builder/preview-sim'

type Tab = 'build' | 'configure' | 'delivery'
interface DragState { type: 'q' | 'sec'; secId: string; qId?: string }

export interface AssessmentBuilderProps {
  meta: BuilderMeta
  setMeta: (fn: (m: BuilderMeta) => BuilderMeta) => void
  sections: Section[]
  setSections: (fn: (s: Section[]) => Section[]) => void
  persona?: string
  autoAI?: boolean
  clearAutoAI?: () => void
  smartTarget?: { q: Question } | null
  clearSmartTarget?: () => void
  onBack: () => void
  onReview: () => void
}

export function AssessmentBuilder({
  meta, setMeta, sections, setSections, persona = 'coordinator',
  autoAI, clearAutoAI, smartTarget, clearSmartTarget, onBack, onReview,
}: AssessmentBuilderProps) {
  const [tab, setTab] = useState<Tab>('build')
  const [selected, setSelected] = useState<string[]>([])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [editing, setEditing] = useState<{ secId: string; q: Question } | null>(null)
  const [replacing, setReplacing] = useState<{ secId: string; q: Question } | null>(null)
  const [showAI, setShowAI] = useState(false)
  const [aiTargetSec, setAiTargetSec] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchTargetSec, setSearchTargetSec] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showCollab, setShowCollab] = useState(false)
  const drag = useRef<DragState | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const flagRef = useRef<HTMLDivElement | null>(null)
  const { notify, openLeo } = useApp()
  const askLeo = () => openLeo({ title: meta.name, sections })

  useEffect(() => {
    if (autoAI) { setAiTargetSec(sections[sections.length - 1]?.id || null); setShowAI(true); clearAutoAI?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAI])
  useEffect(() => {
    if (smartTarget && smartTarget.q) {
      const sec = sections.find(s => s.questions.some(q => q.id === smartTarget.q.id)) || sections[0]
      if (sec) setReplacing({ secId: sec.id, q: smartTarget.q })
      clearSmartTarget?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smartTarget])

  const isInstructor = persona === 'instructor'

  function updateSection(secId: string, fn: (s: Section) => Section) {
    setSections(prev => prev.map(s => (s.id === secId ? fn(s) : s)))
  }
  function toggleSelect(qId: string) {
    setSelected(s => (s.includes(qId) ? s.filter(x => x !== qId) : [...s, qId]))
  }
  function saveQuestion(q: Question) {
    if (!editing) return
    const isNew = !editing.q.stem
    updateSection(editing.secId, s => ({ ...s, questions: isNew ? [...s.questions, q] : s.questions.map(x => (x.id === q.id ? q : x)) }))
    setEditing(null)
  }
  function newQuestion(secId: string) {
    setEditing({ secId, q: { id: 'q' + Date.now(), type: 'mcq', points: 4, bonus: false, topic: '', bloom: 'Understand', difficulty: 'Medium', source: 'manual', stem: '', options: [{ text: '', correct: true }, { text: '', correct: false }, { text: '', correct: false }, { text: '', correct: false }], grading: { randomize: true } } })
  }
  function deleteQuestion(secId: string, qId: string) {
    updateSection(secId, s => ({ ...s, questions: s.questions.filter(q => q.id !== qId) }))
  }
  function acceptReplace(alt: Partial<Question>) {
    if (!replacing) return
    updateSection(replacing.secId, s => ({ ...s, questions: s.questions.map(q => (q.id === replacing.q.id ? { ...q, ...alt, flagged: null, source: 'bank' } : q)) }))
    setReplacing(null)
  }
  function addAIQuestions(qs: GeneratedQuestion[]) {
    const secId = aiTargetSec || sections[sections.length - 1].id
    const mapped: Question[] = qs.map(g => ({ ...g, bonus: false, source: 'ai', grading: { randomize: true } }))
    updateSection(secId, s => ({ ...s, questions: [...s.questions, ...mapped] }))
    setShowAI(false); setAiTargetSec(null)
  }
  function addBankQuestions(qs: BankQuestion[]) {
    const secId = searchTargetSec || sections[sections.length - 1].id
    const mapped: Question[] = qs.map(g => ({
      id: 'bk' + Date.now() + Math.random().toString(36).slice(2, 5),
      type: g.type as QTypeKey, points: 4, bonus: false, topic: g.topic, bloom: g.bloom,
      difficulty: g.difficulty as Difficulty, source: 'bank', stem: g.stem,
      options: g.type === 'mcq' || g.type === 'tf' ? [{ text: 'Correct option', correct: true }, { text: 'Distractor', correct: false }] : undefined,
      psy: { p: g.p, disc: g.disc, pbi: g.pbi }, grading: { randomize: true },
    }))
    updateSection(secId, s => ({ ...s, questions: [...s.questions, ...mapped] }))
    setShowSearch(false); setSearchTargetSec(null)
  }
  function addSection() {
    setSections(prev => [...prev, { id: 'sec' + Date.now(), name: 'New Section', owner: meta.owner, reviewStatus: 'not-started', timeLimit: 20, preRead: false, questions: [] }])
  }
  const freshSection = (): Section => ({ id: 'sec' + Date.now(), name: 'Section A', owner: meta.owner, reviewStatus: 'in-progress', timeLimit: 30, preRead: false, questions: [] })
  function startScratch() { setSections(() => [freshSection()]) }
  function startRecycle() { /* recycle handled by parent in real flow */ setSections(() => [freshSection()]); notify('Blueprint ingested — customize every section freely') }
  function startAI() { const s = freshSection(); setSections(() => [s]); setAiTargetSec(s.id); setShowAI(true) }
  function startBank() { const s = freshSection(); setSections(() => [s]); setSearchTargetSec(s.id); setShowSearch(true) }
  function bulkMove(targetSec: string) {
    const moved: Question[] = []
    setSections(prev => {
      const next = prev.map(s => ({ ...s, questions: s.questions.filter(q => { if (selected.includes(q.id)) { moved.push(q); return false } return true }) }))
      return next.map(s => (s.id === targetSec ? { ...s, questions: [...s.questions, ...moved] } : s))
    })
    setSelected([])
  }

  // drag & drop
  function onQDragStart(secId: string, qId: string) { drag.current = { type: 'q', secId, qId }; setDragId(qId) }
  function onQDrop(targetSec: string, targetQId: string | null) {
    const d = drag.current; if (!d || d.type !== 'q') return
    setSections(prev => {
      let moved: Question | undefined
      const next = prev.map(s => ({ ...s, questions: s.questions.filter(q => { if (q.id === d.qId) { moved = q; return false } return true }) }))
      return next.map(s => {
        if (s.id !== targetSec || !moved) return s
        const qs = [...s.questions]
        const idx = targetQId ? qs.findIndex(q => q.id === targetQId) : qs.length
        qs.splice(idx < 0 ? qs.length : idx, 0, moved)
        return { ...s, questions: qs }
      })
    })
    drag.current = null; setDragId(null)
  }
  function onSecDragStart(secId: string) { drag.current = { type: 'sec', secId }; setDragId(secId) }
  function onSecDrop(targetSec: string) {
    const d = drag.current; if (!d || d.type !== 'sec' || d.secId === targetSec) return
    setSections(prev => {
      const arr = [...prev]
      const from = arr.findIndex(s => s.id === d.secId)
      const to = arr.findIndex(s => s.id === targetSec)
      const [m] = arr.splice(from, 1); arr.splice(to, 0, m)
      return arr
    })
    drag.current = null; setDragId(null)
  }

  const editingSectionName = editing ? sections.find(s => s.id === editing.secId)?.name : undefined

  const questionArea = (
    <div>
      {/* toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{sections.length} sections · {totalQuestions(sections)} questions</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Button type="button" variant="outline" size="sm" onClick={() => { setSearchTargetSec(null); setShowSearch(true) }}><Icon name="magnifying-glass" />Search bank</Button>
          <Button type="button" variant="default" size="sm" onClick={() => { setAiTargetSec(null); setShowAI(true) }}><LeoStar />AI generate</Button>
        </div>
      </div>

      {/* bulk bar */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', borderRadius: 'var(--radius)', background: 'var(--muted)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <Icon name="square-check" style={{ color: 'var(--brand-color)' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.length} selected</span>
          <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />
          <span className="hint">Move to:</span>
          {sections.map(s => <Button type="button" key={s.id} variant="ghost" size="sm" onClick={() => bulkMove(s.id)}>{s.name.replace(/^Section [A-Z] — /, '')}</Button>)}
          <Button type="button" variant="ghost" size="sm" style={{ marginLeft: 'auto' }} onClick={() => setSelected([])}>Clear</Button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sections.map(sec => (
          <SectionCard
            key={sec.id}
            sec={sec}
            collapsed={!!collapsed[sec.id]}
            disabled={isInstructor && sec.owner !== 'okafor'}
            selectedIds={selected}
            dragId={dragId}
            onToggleCollapse={() => setCollapsed(c => ({ ...c, [sec.id]: !c[sec.id] }))}
            onRename={name => updateSection(sec.id, s => ({ ...s, name }))}
            onSelect={toggleSelect}
            onEditQuestion={q => setEditing({ secId: sec.id, q })}
            onReplaceQuestion={q => setReplacing({ secId: sec.id, q })}
            onDeleteQuestion={qId => deleteQuestion(sec.id, qId)}
            onNewQuestion={() => newQuestion(sec.id)}
            onAddBank={() => { setSearchTargetSec(sec.id); setShowSearch(true) }}
            onAddAI={() => { setAiTargetSec(sec.id); setShowAI(true) }}
            onSettings={() => setShowCollab(true)}
            onSecDragStart={() => onSecDragStart(sec.id)}
            onSecDrop={() => onSecDrop(sec.id)}
            onQDragStart={qId => onQDragStart(sec.id, qId)}
            onQDrop={targetQId => onQDrop(sec.id, targetQId)}
            onQDragEnd={() => { drag.current = null; setDragId(null) }}
            flagRef={el => { if (el) flagRef.current = el }}
          />
        ))}
      </div>
      <Button type="button" variant="outline" style={{ marginTop: 16 }} onClick={addSection}><Icon name="plus" />Add section</Button>
    </div>
  )

  return (
    <div className="content wide" style={{ maxWidth: 1400 }}>
        <h1 className="sr-only">{meta.name} — assessment builder</h1>
        {/* header */}
        <div className="page-head" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Button type="button" variant="ghost" size="sm" onClick={onBack}><Icon name="arrow-left" />All assessments</Button>
              <AssessmentStatusBadge state={meta.state} />
              {isInstructor && <Badge variant="outline"><Icon name="user" />Delegated: Section B</Badge>}
            </div>
            <Input aria-label="Assessment title" value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))} style={{ fontSize: 20, fontWeight: 600, height: 'auto', padding: '6px 10px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="hint">{meta.course} · {meta.type} · {meta.graded ? 'Graded' : 'Ungraded'} · {meta.security}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AvatarGroup>
                  {[meta.owner, ...meta.collaborators].slice(0, 5).map(id => (
                    <AvatarInitials key={id} size="sm" initials={FACULTY[id].initials} />
                  ))}
                </AvatarGroup>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowCollab(true)}><Icon name="user-plus" />Manage team</Button>
              </div>
            </div>
          </div>
          <div className="actions">
            <Button type="button" variant="outline" onClick={() => setShowPreview(true)}><Icon name="play" />Preview &amp; simulate</Button>
            <Button type="button" variant="outline" onClick={() => notify('Draft saved · ' + totalQuestions(sections) + ' questions')}><Icon name="check" />Save draft</Button>
            {isInstructor
              ? <Button type="button" variant="default" onClick={onReview}><Icon name="paper-plane" />Submit Section B</Button>
              : <Button type="button" variant="default" onClick={onReview}><Icon name="paper-plane" />Submit for review</Button>}
          </div>
        </div>

        {/* sub tabs */}
        <Tabs
          value={tab}
          onValueChange={v => { if (v !== 'review') setTab(v as Tab) }}
          className="flex flex-col"
          style={{ marginBottom: 22 }}
        >
          <TabsList aria-label="Builder sections">
            {([['build', 'Build', 'list-check'], ['configure', 'Configure', 'gear'], ['delivery', 'Delivery & Security', 'shield-halved'], ['review', 'Review & Publish', 'paper-plane']] as const).map(([id, label, ic]) => (
              <TabsTrigger key={id} value={id} onClick={id === 'review' ? () => onReview() : undefined}>
                <Icon name={ic} />{label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {tab === 'build' && (
          sections.length === 0
            ? <BuilderStart name={meta.name} onRecycle={startRecycle} onScratch={startScratch} onAI={startAI} onBank={startBank} />
            : <div style={{ display: 'grid', gridTemplateColumns: '1fr 332px', gap: 24, alignItems: 'start' }}>
                {questionArea}
                <OverviewPanel sections={sections} onAskLeo={askLeo} onJumpFlags={() => flagRef.current?.scrollIntoView({ block: 'center' })} />
              </div>
        )}
        {tab === 'configure' && <ConfigureTab meta={meta} />}
        {tab === 'delivery' && <DeliveryTab meta={meta} setMeta={setMeta} />}

        {/* modals */}
        {editing && <QuestionEditor question={editing.q} sectionName={editingSectionName} onSave={saveQuestion} onClose={() => setEditing(null)} />}
        {replacing && <SmartReplace question={replacing.q} onAccept={acceptReplace} onClose={() => setReplacing(null)} />}
        {showAI && <AIQuizGenerator onAccept={addAIQuestions} onClose={() => setShowAI(false)} />}
        {showSearch && <SemanticSearch onAdd={addBankQuestions} onClose={() => setShowSearch(false)} />}
        {showPreview && <PreviewSim sections={sections} meta={meta} onClose={() => setShowPreview(false)} />}
        {showCollab && <CollabPanel meta={meta} setMeta={setMeta} sections={sections} setSections={setSections} onClose={() => setShowCollab(false)} />}
    </div>
  )
}
