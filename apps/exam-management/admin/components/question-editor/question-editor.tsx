'use client'

/**
 * QUESTION EDITOR — unified editor for all question types.
 *
 * Used in three places:
 *   1. /questions/new                    — full-page authoring
 *   2. /questions/[id]/edit              — full-page edit of a saved question
 *   3. assessment-builder NewQuestionPanel — inline embed (compact = true)
 *
 * Design intent (from May 6 Aarti meeting + Vishaka's tagging principles):
 *   - Type picker is front-and-centre — switching type is a structural change
 *   - Stem + type-specific controls are the dominant column
 *   - Right rail holds the metadata (objective, difficulty, Bloom, tags)
 *   - AI enhance is a first-class affordance: suggest distractors, tighten stem,
 *     auto-tag objectives — every suggestion is accept/reject
 *   - Workflow: Draft → Save (in-bank) → Add to assessment
 *   - Validation is non-blocking: warnings inline, errors prevent Save
 */

import { useMemo, useState } from 'react'
import {
  Button, Badge, Input, Textarea, Label,
  Card, CardHeader, CardDescription, CardContent,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Checkbox,
  Tooltip, TooltipTrigger, TooltipContent,
  LocalBanner,
} from '@exxat/ds/packages/ui/src'
import { QBToggle } from '@/components/qb/toggle'
import {
  type EditorQType, type QuestionDraft, type QuestionPayload,
  type DraftValidationIssue, type KTypeStatement,
  QUESTION_TYPES, defaultPayload, validateDraft,
} from '@/lib/question-editor-types'
import type { CourseObjective } from '@/lib/faculty-mock-data'
import { MOCK_STANDARDS, groupedStandards, type Standard } from '@/lib/mock-standards'

// ─── Public props ──────────────────────────────────────────────────────────

export interface QuestionEditorProps {
  draft: QuestionDraft
  onChange: (draft: QuestionDraft) => void
  /** Course objectives available for tagging. */
  objectives: CourseObjective[]
  /** Compact = inline embed (no header card, slimmer rail). */
  compact?: boolean
  /** Called when faculty hits the primary save action. */
  onSave?: (draft: QuestionDraft, dest: SaveDestination) => void
  /** Called when faculty hits cancel / back. */
  onCancel?: () => void
  /** Show the "Add to assessment" save destination — only inside the builder. */
  showAddToAssessment?: boolean
}

export type SaveDestination =
  | 'draft'              // save as draft, stay in editor
  | 'bank'               // publish to QB, library row created
  | 'assessment'         // add to active assessment + bank

// ─── Main shell ────────────────────────────────────────────────────────────

export function QuestionEditor({
  draft, onChange, objectives, compact = false,
  onSave, onCancel, showAddToAssessment = false,
}: QuestionEditorProps) {
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null)
  const [aiThinking, setAiThinking] = useState(false)
  const issues = useMemo(() => validateDraft(draft), [draft])
  const errors = issues.filter(i => i.severity === 'error')
  const warnings = issues.filter(i => i.severity === 'warning')
  const canSave = errors.length === 0

  function update<K extends keyof QuestionDraft>(key: K, value: QuestionDraft[K]) {
    onChange({ ...draft, [key]: value })
  }

  function setType(type: EditorQType) {
    if (type === draft.type) return
    onChange({ ...draft, type, payload: defaultPayload(type) })
  }

  function updatePayload(payload: QuestionPayload) {
    onChange({ ...draft, payload })
  }

  // ─── AI enhance — mock suggestion engine ────────────────────────────────
  function runAi(action: 'tighten-stem' | 'add-distractors' | 'tag-objective') {
    setAiThinking(true)
    setTimeout(() => {
      setAiThinking(false)
      if (action === 'tighten-stem') {
        const tightened = draft.stem.trim().replace(/\s+/g, ' ').replace(/^(.{1,80}?)\b/, '$1').slice(0, 220)
        setAiSuggestion({
          kind: 'stem',
          before: draft.stem,
          after: tightened || 'A 67-year-old patient is being evaluated for the appropriate dosing of an aminoglycoside antibiotic. Which factor most directly influences the recommended dose?',
          rationale: 'Tightened wording, removed redundancy, anchored on clinical scenario per institution style guide.',
        })
      } else if (action === 'add-distractors' && (draft.payload.type === 'mcq' || draft.payload.type === 'multi-select')) {
        setAiSuggestion({
          kind: 'distractors',
          newDistractors: ['Patient body surface area only', 'Time of day medication is administered', 'Patient handedness'],
          rationale: 'Distractors selected to be plausible but distinguishable — they reflect common student misconceptions per cohort data.',
        })
      } else if (action === 'tag-objective') {
        const best = objectives[0]
        setAiSuggestion({
          kind: 'objective',
          objectiveId: best?.id ?? null,
          objectiveTitle: best?.title ?? '—',
          confidence: 0.86,
          rationale: 'Stem references dosing principles and clinical scenarios — strongest match to Apply-level objective on dose calculation.',
        })
      }
    }, 700)
  }

  function acceptAi() {
    if (!aiSuggestion) return
    if (aiSuggestion.kind === 'stem') {
      update('stem', aiSuggestion.after)
    } else if (aiSuggestion.kind === 'distractors' && (draft.payload.type === 'mcq' || draft.payload.type === 'multi-select')) {
      const newOpts = aiSuggestion.newDistractors.map(text => ({
        id: `opt-ai-${Math.random().toString(36).slice(2, 7)}`,
        text,
        correct: false,
      }))
      updatePayload({ ...draft.payload, options: [...draft.payload.options, ...newOpts] })
    } else if (aiSuggestion.kind === 'objective') {
      update('objectiveId', aiSuggestion.objectiveId)
    }
    setAiSuggestion(null)
  }

  return (
    <div className={`flex flex-col ${compact ? '' : 'h-full overflow-hidden'}`}>
      {/* Header ribbon */}
      {!compact && (
        <header className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Badge variant="secondary" className="rounded font-mono text-xs" suppressHydrationWarning>{draft.code}</Badge>
            <h1 className="text-sm font-semibold text-foreground truncate">
              {draft.stem.trim() ? draft.stem.trim().slice(0, 80) : 'New question'}
            </h1>
            <StateBadge state={draft.state} />
            {draft.aiOriginated && (
              <Badge variant="secondary" className="rounded text-xs gap-1">
                <i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" />
                AI draft
              </Badge>
            )}
            {draft.confidence && (
              <ConfidenceBadge level={draft.confidence} />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
            <Button variant="outline" size="sm" disabled={!canSave} onClick={() => onSave?.(draft, 'draft')}>
              <i className="fa-light fa-floppy-disk" aria-hidden="true" />
              Save draft
            </Button>
            {showAddToAssessment && (
              <Button size="sm" disabled={!canSave} onClick={() => onSave?.(draft, 'assessment')}>
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add to assessment
              </Button>
            )}
            <Button size="sm" disabled={!canSave} onClick={() => onSave?.(draft, 'bank')} variant={showAddToAssessment ? 'outline' : 'default'}>
              <i className="fa-light fa-bookmark" aria-hidden="true" />
              Save to bank
            </Button>
          </div>
        </header>
      )}

      <div className={`flex-1 ${compact ? '' : 'overflow-auto'}`}>
        <div className={`mx-auto ${compact ? 'max-w-none' : 'max-w-6xl'} grid gap-5 p-${compact ? '4' : '6'}`} style={{ gridTemplateColumns: compact ? '1fr 280px' : '1fr 320px' }}>
          {/* ─── Main column ─────────────────────────────────── */}
          <div className="flex flex-col gap-5">
            {/* Type picker */}
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-xs font-semibold text-muted-foreground mb-3">
                Question type
              </h2>
              <TypePickerGrid value={draft.type} onChange={setType} />
            </section>

            {/* Stem editor */}
            <section className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="stem" className="text-xs font-semibold text-muted-foreground">
                  Question stem <span className="text-destructive">*</span>
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runAi('tighten-stem')}
                      disabled={aiThinking || !draft.stem.trim()}
                      className="text-xs gap-1.5 h-7"
                    >
                      <i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" style={{ fontSize: 14 }} />
                      Tighten with AI
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rewrite for clarity and conciseness</TooltipContent>
                </Tooltip>
              </div>
              <Textarea
                id="stem"
                value={draft.stem}
                onChange={e => update('stem', e.target.value)}
                placeholder="Write the question. For clinical questions, anchor on a brief patient scenario."
                className="min-h-28 text-sm resize-y"
              />
              {aiSuggestion?.kind === 'stem' && (
                <AiSuggestionCard
                  title="Tightened stem"
                  body={
                    <div className="flex flex-col gap-2">
                      <p className="text-xs line-clamp-3 text-muted-foreground italic">{aiSuggestion.before || '—'}</p>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <i className="fa-light fa-arrow-down" aria-hidden="true" />
                        After
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{aiSuggestion.after}</p>
                    </div>
                  }
                  rationale={aiSuggestion.rationale}
                  onAccept={acceptAi}
                  onReject={() => setAiSuggestion(null)}
                />
              )}
            </section>

            {/* Type-specific control */}
            <section className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-muted-foreground">
                  Answer
                </h2>
                {(draft.payload.type === 'mcq' || draft.payload.type === 'multi-select') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => runAi('add-distractors')}
                    disabled={aiThinking || !draft.stem.trim()}
                    className="text-xs gap-1.5 h-7"
                  >
                    <i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" style={{ fontSize: 14 }} />
                    Suggest distractors
                  </Button>
                )}
              </div>
              <TypeControls
                payload={draft.payload}
                onChange={updatePayload}
                aiSuggestion={aiSuggestion?.kind === 'distractors' ? aiSuggestion : null}
                onAcceptAi={acceptAi}
                onRejectAi={() => setAiSuggestion(null)}
              />
            </section>

            {/* Question-level explanation — only for types without per-option rationale */}
            {draft.payload.type !== 'mcq' && draft.payload.type !== 'multi-select' && draft.payload.type !== 'true-false' && (
              <section className="rounded-xl border border-border bg-card p-4">
                <Label htmlFor="explanation" className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Rationale <span className="font-normal text-muted-foreground normal-case tracking-normal text-xs">— shown to students during review session</span>
                </Label>
                <Textarea
                  id="explanation"
                  value={draft.explanation}
                  onChange={e => update('explanation', e.target.value)}
                  placeholder="Explain the correct answer and any key distinctions students should understand."
                  className="min-h-20 text-sm resize-y"
                />
              </section>
            )}

            {/* Validation panel */}
            {(errors.length > 0 || warnings.length > 0) && (
              <ValidationPanel errors={errors} warnings={warnings} />
            )}
          </div>

          {/* ─── Right rail ─────────────────────────────────── */}
          <aside className="flex flex-col gap-4">
            <MetadataPanel
              draft={draft}
              objectives={objectives}
              onUpdate={update}
              aiSuggestion={aiSuggestion?.kind === 'objective' ? aiSuggestion : null}
              onRunAi={() => runAi('tag-objective')}
              onAcceptAi={acceptAi}
              onRejectAi={() => setAiSuggestion(null)}
              aiThinking={aiThinking}
            />
            <WorkflowPanel draft={draft} onUpdate={update} />
          </aside>
        </div>
      </div>

      {compact && (
        <footer className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-card shrink-0">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="outline" size="sm" disabled={!canSave} onClick={() => onSave?.(draft, 'draft')}>
            Save draft
          </Button>
          {showAddToAssessment && (
            <Button size="sm" disabled={!canSave} onClick={() => onSave?.(draft, 'assessment')}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add to assessment
            </Button>
          )}
        </footer>
      )}
    </div>
  )
}

// ─── Type picker grid ─────────────────────────────────────────────────────

function TypePickerGrid({ value, onChange }: { value: EditorQType; onChange: (t: EditorQType) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {QUESTION_TYPES.map(t => {
        const active = t.id === value
        return (
          <Button
            key={t.id}
            variant="ghost"
            size="sm"
            onClick={() => onChange(t.id)}
            aria-pressed={active}
            title={t.shortDescription}
            className="gap-1.5 h-7 px-2.5 text-xs rounded-full"
            style={{
              border: '1px solid var(--border)',
              background: active ? 'var(--muted)' : 'transparent',
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            <i
              className={`fa-light ${t.icon}`}
              aria-hidden="true"
              style={{ color: active ? 'var(--foreground)' : 'var(--muted-foreground)' }}
            />
            {t.label}
          </Button>
        )
      })}
    </div>
  )
}

// ─── K-type (complex MCQ) ─────────────────────────────────────────────────

function KTypeControls({ payload, onChange }: {
  payload: Extract<QuestionPayload, { type: 'k-type' }>
  onChange: (p: QuestionPayload) => void
}) {
  function updateStatement(id: string, patch: Partial<KTypeStatement>) {
    onChange({ ...payload, statements: payload.statements.map(s => s.id === id ? { ...s, ...patch } : s) })
  }
  function addStatement() {
    onChange({ ...payload, statements: [...payload.statements, { id: `ks-${Math.random().toString(36).slice(2, 9)}`, text: '', correct: false }] })
  }
  function removeStatement(id: string) {
    onChange({ ...payload, statements: payload.statements.filter(s => s.id !== id) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Statements</p>
        <p className="text-xs text-muted-foreground mb-3">Mark each statement as True or False. The correct combination key is the one whose selected pattern matches.</p>
        {payload.statements.map((stmt, idx) => (
          <div key={stmt.id} className="flex items-start gap-2 mb-2">
            <span className="text-xs font-mono text-muted-foreground mt-2 w-4 shrink-0">{String.fromCharCode(65 + idx)}.</span>
            <input
              value={stmt.text}
              onChange={e => updateStatement(stmt.id, { text: e.target.value })}
              placeholder={`Statement ${String.fromCharCode(65 + idx)}`}
              className="flex-1 text-sm"
              style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', fontSize: 13 }}
            />
            <Button
              variant={stmt.correct ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateStatement(stmt.id, { correct: true })}
              className="shrink-0"
              style={{ height: 36, minWidth: 56, fontSize: 12 }}
            >
              True
            </Button>
            <Button
              variant={!stmt.correct ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateStatement(stmt.id, { correct: false })}
              className="shrink-0"
              style={{ height: 36, minWidth: 56, fontSize: 12 }}
            >
              False
            </Button>
            {payload.statements.length > 2 && (
              <Button variant="ghost" size="sm" onClick={() => removeStatement(stmt.id)} aria-label="Remove statement" style={{ height: 36 }}>
                <i className="fa-light fa-xmark" aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addStatement} className="gap-1.5 mt-1">
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add statement
        </Button>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Combination keys</p>
        <p className="text-xs text-muted-foreground mb-3">Define what each answer key (A, B, C, D) means — which statements are true in that combination. Mark the correct key.</p>
        {payload.combinationKeys.map((key) => (
          <div key={key.id} className="flex items-center gap-2 mb-2">
            <Button
              variant={key.isCorrect ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ ...payload, combinationKeys: payload.combinationKeys.map(k => ({ ...k, isCorrect: k.id === key.id })) })}
              style={{ height: 32, width: 32, padding: 0, fontWeight: 700, fontSize: 13, flexShrink: 0 }}
              aria-label={`Mark key ${key.label} as correct`}
            >
              {key.label}
            </Button>
            <span className="text-xs text-muted-foreground flex-1">
              {payload.statements.length > 0
                ? payload.statements.map((s, i) => `${String.fromCharCode(65 + i)}=${s.correct ? 'T' : 'F'}`).join(', ')
                : 'Define statements above'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Type-specific controls ───────────────────────────────────────────────

function TypeControls({
  payload, onChange, aiSuggestion, onAcceptAi, onRejectAi,
}: {
  payload: QuestionPayload
  onChange: (p: QuestionPayload) => void
  aiSuggestion: Extract<AiSuggestion, { kind: 'distractors' }> | null
  onAcceptAi: () => void
  onRejectAi: () => void
}) {
  switch (payload.type) {
    case 'mcq':
    case 'multi-select':
      return (
        <McqControls
          payload={payload}
          onChange={onChange}
          aiSuggestion={aiSuggestion}
          onAcceptAi={onAcceptAi}
          onRejectAi={onRejectAi}
        />
      )
    case 'true-false':
      return <TrueFalseControls payload={payload} onChange={onChange} />
    case 'short-answer':
      return <ShortAnswerControls payload={payload} onChange={onChange} />
    case 'numeric':
      return <NumericControls payload={payload} onChange={onChange} />
    case 'essay':
      return <EssayControls payload={payload} onChange={onChange} />
    case 'fill-blank':
      return <FillBlankControls payload={payload} onChange={onChange} />
    case 'matching':
      return <MatchingControls payload={payload} onChange={onChange} />
    case 'ordering':
      return <OrderingControls payload={payload} onChange={onChange} />
    case 'hotspot':
      return <HotspotControls payload={payload} onChange={onChange} />
    case 'k-type':
      return <KTypeControls payload={payload} onChange={onChange} />
  }
}

// ─── MCQ / Multi-select ───────────────────────────────────────────────────

function McqControls({
  payload, onChange, aiSuggestion, onAcceptAi, onRejectAi,
}: {
  payload: Extract<QuestionPayload, { type: 'mcq' | 'multi-select' }>
  onChange: (p: QuestionPayload) => void
  aiSuggestion: Extract<AiSuggestion, { kind: 'distractors' }> | null
  onAcceptAi: () => void
  onRejectAi: () => void
}) {
  const isMulti = payload.type === 'multi-select'

  function setOption(idx: number, patch: Partial<{ text: string; correct: boolean; rationale: string; locked: boolean }>) {
    onChange({
      ...payload,
      options: payload.options.map((o, i) => i === idx ? { ...o, ...patch } : (
        !isMulti && patch.correct === true ? { ...o, correct: false } : o
      )),
    })
  }

  function addOption() {
    onChange({
      ...payload,
      options: [...payload.options, { id: `opt-${Math.random().toString(36).slice(2, 9)}`, text: '', correct: false }],
    })
  }

  function removeOption(idx: number) {
    if (payload.options.length <= 2) return
    onChange({ ...payload, options: payload.options.filter((_, i) => i !== idx) })
  }

  const cardStyle = (correct: boolean): React.CSSProperties => ({
    borderColor: correct ? 'var(--chart-2)' : 'var(--border)',
    background: 'var(--card)',
  })

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs text-muted-foreground -mt-1">
        {isMulti ? 'Mark all correct answers — students can earn partial credit.' : 'Mark exactly one correct answer.'}
      </p>

      {isMulti ? (
        <div className="flex flex-col gap-1.5">
          {payload.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            const missingRationale = opt.correct && !opt.rationale?.trim()
            return (
              <div key={opt.id} className="rounded-lg border overflow-hidden transition-colors" style={cardStyle(opt.correct)}>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <Checkbox
                    id={`opt-${opt.id}`}
                    checked={opt.correct}
                    onCheckedChange={c => setOption(i, { correct: !!c })}
                    aria-label={`Mark option ${letter} correct`}
                  />
                  <span className="font-mono text-xs font-bold w-4 shrink-0 text-center text-muted-foreground">{letter}</span>
                  <Input type="text" value={opt.text} onChange={e => setOption(i, { text: e.target.value })} placeholder={`Option ${letter}`} className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 h-8 px-1" />
                  {opt.correct && <Badge variant="secondary" className="text-xs shrink-0" style={{ color: 'var(--chart-2)' }}>Correct</Badge>}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" onClick={() => setOption(i, { locked: !opt.locked })} aria-label={opt.locked ? 'Unlock' : 'Lock position'} aria-pressed={!!opt.locked} disabled={!payload.shuffle} style={{ color: opt.locked ? 'var(--foreground)' : 'var(--muted-foreground)', opacity: !payload.shuffle ? 0.35 : 1 }}>
                        <i className={`fa-light ${opt.locked ? 'fa-lock' : 'fa-lock-open'}`} aria-hidden="true" style={{ fontSize: 13 }} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{!payload.shuffle ? 'Enable shuffle to lock positions' : opt.locked ? "Locked — won't shuffle" : 'Lock this position'}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeOption(i)} disabled={payload.options.length <= 2} aria-label={`Remove option ${letter}`}>
                        <i className="fa-light fa-trash-can" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove</TooltipContent>
                  </Tooltip>
                </div>
                {(opt.correct || opt.rationale) && (
                  <div className="px-3 pb-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-start gap-1.5 pt-2">
                      <i className="fa-light fa-quote-left shrink-0 mt-1 text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
                      <Textarea value={opt.rationale ?? ''} onChange={e => setOption(i, { rationale: e.target.value })} placeholder={opt.correct ? 'Explain why this is correct — students see this during review' : 'Explain why this distractor is wrong (optional)'} className="flex-1 text-xs min-h-[52px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-0" rows={2} />
                      {missingRationale && <span className="text-xs font-medium shrink-0 mt-1 text-chart-4">missing</span>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* MCQ — custom role="radiogroup" so the visual indicator is driven directly from opt.correct,
           not from Radix's internal data-state (which requires htmlFor→native input, not a button). */
        <div role="radiogroup" aria-label="Answer options" className="flex flex-col gap-1.5">
          {payload.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i)
            const missingRationale = opt.correct && !opt.rationale?.trim()
            const noCorrect = !payload.options.some(o => o.correct)
            function handleKeyDown(e: React.KeyboardEvent) {
              if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault()
                setOption((i + 1) % payload.options.length, { correct: true })
              } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault()
                setOption((i - 1 + payload.options.length) % payload.options.length, { correct: true })
              }
            }
            return (
              <div
                key={opt.id}
                role="radio"
                aria-checked={opt.correct}
                tabIndex={opt.correct || (noCorrect && i === 0) ? 0 : -1}
                onClick={() => setOption(i, { correct: true })}
                onKeyDown={handleKeyDown}
                className="rounded-lg border overflow-hidden transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                style={cardStyle(opt.correct)}
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  {/* Custom radio indicator — renders from opt.correct, no Radix dependency */}
                  <div
                    className="size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                    style={{ borderColor: opt.correct ? 'var(--chart-2)' : 'var(--border)' }}
                  >
                    {opt.correct && (
                      <div className="size-2 rounded-full" style={{ background: 'var(--chart-2)' }} />
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold w-4 shrink-0 text-center text-muted-foreground">{letter}</span>
                  <Input
                    type="text"
                    value={opt.text}
                    onChange={e => setOption(i, { text: e.target.value })}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => e.stopPropagation()}
                    placeholder={`Option ${letter}`}
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 h-8 px-1"
                    aria-label={`Option ${letter} text`}
                  />
                  {opt.correct && <Badge variant="secondary" className="text-xs shrink-0" style={{ color: 'var(--chart-2)' }}>Correct</Badge>}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={e => { e.stopPropagation(); setOption(i, { locked: !opt.locked }) }}
                        aria-label={opt.locked ? 'Unlock' : 'Lock position'}
                        aria-pressed={!!opt.locked}
                        disabled={!payload.shuffle}
                        style={{ color: opt.locked ? 'var(--foreground)' : 'var(--muted-foreground)', opacity: !payload.shuffle ? 0.35 : 1 }}
                      >
                        <i className={`fa-light ${opt.locked ? 'fa-lock' : 'fa-lock-open'}`} aria-hidden="true" style={{ fontSize: 13 }} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{!payload.shuffle ? 'Enable shuffle to lock positions' : opt.locked ? "Locked — won't shuffle" : 'Lock this position'}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={e => { e.stopPropagation(); removeOption(i) }}
                        disabled={payload.options.length <= 2}
                        aria-label={`Remove option ${letter}`}
                      >
                        <i className="fa-light fa-trash-can" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove</TooltipContent>
                  </Tooltip>
                </div>
                {(opt.correct || opt.rationale) && (
                  <div className="px-3 pb-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-start gap-1.5 pt-2">
                      <i className="fa-light fa-quote-left shrink-0 mt-1 text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
                      <Textarea
                        value={opt.rationale ?? ''}
                        onChange={e => setOption(i, { rationale: e.target.value })}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => e.stopPropagation()}
                        placeholder={opt.correct ? 'Explain why this is correct — students see this during review' : 'Explain why this distractor is wrong (optional)'}
                        className="flex-1 text-xs min-h-[52px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-0"
                        rows={2}
                        aria-label={`Rationale for option ${letter}`}
                      />
                      {missingRationale && <span className="text-xs font-medium shrink-0 mt-1 text-chart-4">missing</span>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div className="flex items-center justify-between gap-3 pt-1">
        <Button variant="outline" size="sm" onClick={addOption} className="gap-1.5">
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add option
        </Button>
        <div className="flex items-center gap-3">
          <ToggleSwitchRow
            id="shuffle"
            label="Shuffle options"
            checked={payload.shuffle}
            onChange={c => onChange({ ...payload, shuffle: c })}
          />
          {isMulti && (
            <ToggleSwitchRow
              id="partial"
              label="Partial credit"
              checked={payload.partialCredit}
              onChange={c => onChange({ ...payload, partialCredit: c })}
            />
          )}
        </div>
      </div>

      {aiSuggestion && (
        <AiSuggestionCard
          title={`AI suggested ${aiSuggestion.newDistractors.length} distractors`}
          body={
            <ul className="flex flex-col gap-1">
              {aiSuggestion.newDistractors.map((d, i) => (
                <li key={i} className="text-sm text-foreground flex items-center gap-2">
                  <span className="size-4 rounded-full bg-muted text-xs font-bold flex items-center justify-center text-muted-foreground">
                    {String.fromCharCode(65 + payload.options.length + i)}
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          }
          rationale={aiSuggestion.rationale}
          onAccept={onAcceptAi}
          onReject={onRejectAi}
        />
      )}
    </div>
  )
}

// ─── True / False ─────────────────────────────────────────────────────────

function TrueFalseControls({
  payload, onChange,
}: { payload: Extract<QuestionPayload, { type: 'true-false' }>; onChange: (p: QuestionPayload) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="True or False" className="flex gap-3">
        {([true, false] as const).map(val => {
          const isSelected = payload.correct === val
          return (
            <div
              key={String(val)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected || (!payload.correct && val) ? 0 : -1}
              onClick={() => onChange({ ...payload, correct: val })}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault()
                  onChange({ ...payload, correct: !val })
                }
              }}
              className={`flex-1 flex items-center gap-2 rounded-lg border px-4 py-3 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${isSelected ? 'border-chart-2/60 bg-muted/30' : 'border-border hover:bg-muted/20'}`}
            >
              <div
                className="size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                style={{ borderColor: isSelected ? 'var(--chart-2)' : 'var(--border)' }}
              >
                {isSelected && <div className="size-2 rounded-full" style={{ background: 'var(--chart-2)' }} />}
              </div>
              <i className={`fa-light ${val ? 'fa-circle-check text-chart-2' : 'fa-circle-xmark text-destructive'}`} aria-hidden="true" />
              <span className="text-sm font-medium">{val ? 'True' : 'False'}</span>
              {isSelected && <Badge variant="secondary" className="rounded text-xs ms-auto" style={{ color: 'var(--chart-2)' }}>Correct</Badge>}
            </div>
          )
        })}
      </div>
      <div className="relative">
        <Label htmlFor="tf-rationale" className="text-xs font-medium block mb-1">
          Rationale
          {!payload.rationale?.trim() && (
            <span className="ms-1.5 text-xs font-medium text-chart-4">missing</span>
          )}
        </Label>
        <Textarea
          id="tf-rationale"
          value={payload.rationale ?? ''}
          onChange={e => onChange({ ...payload, rationale: e.target.value })}
          placeholder="Explain why the statement is true or false — students see this during review"
          className="text-xs min-h-14 resize-none"
          style={!payload.rationale?.trim() ? { borderColor: 'var(--chart-4)' } : undefined}
          rows={2}
        />
      </div>
    </div>
  )
}

// ─── Short answer ─────────────────────────────────────────────────────────

function ShortAnswerControls({
  payload, onChange,
}: { payload: Extract<QuestionPayload, { type: 'short-answer' }>; onChange: (p: QuestionPayload) => void }) {
  function setAnswer(idx: number, value: string) {
    onChange({ ...payload, acceptedAnswers: payload.acceptedAnswers.map((a, i) => i === idx ? value : a) })
  }
  function addAnswer() {
    onChange({ ...payload, acceptedAnswers: [...payload.acceptedAnswers, ''] })
  }
  function removeAnswer(idx: number) {
    if (payload.acceptedAnswers.length <= 1) return
    onChange({ ...payload, acceptedAnswers: payload.acceptedAnswers.filter((_, i) => i !== idx) })
  }
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs text-muted-foreground -mt-1">
        Provide every accepted spelling/casing variant. Grading is exact-match against any one of them.
      </p>
      <ul className="flex flex-col gap-2">
        {payload.acceptedAnswers.map((a, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground w-6">
              {i === 0 ? 'Main' : `Alt ${i}`}
            </span>
            <Input value={a} onChange={e => setAnswer(i, e.target.value)} placeholder="Accepted answer" className="flex-1" />
            <Button variant="ghost" size="icon-sm" onClick={() => removeAnswer(i)} disabled={payload.acceptedAnswers.length <= 1} aria-label="Remove">
              <i className="fa-light fa-trash-can" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 pt-1">
        <Button variant="outline" size="sm" onClick={addAnswer} className="gap-1.5">
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add alternative
        </Button>
        <ToggleSwitchRow
          id="case"
          label="Case-sensitive"
          checked={payload.caseSensitive}
          onChange={c => onChange({ ...payload, caseSensitive: c })}
        />
      </div>
    </div>
  )
}

// ─── Numeric ──────────────────────────────────────────────────────────────

function NumericControls({
  payload, onChange,
}: { payload: Extract<QuestionPayload, { type: 'numeric' }>; onChange: (p: QuestionPayload) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <Label htmlFor="num-answer" className="text-xs font-medium block mb-1">Answer</Label>
        <Input
          id="num-answer"
          type="number"
          value={Number.isFinite(payload.answer) ? payload.answer : ''}
          onChange={e => onChange({ ...payload, answer: e.target.value === '' ? NaN : Number(e.target.value) })}
        />
      </div>
      <div>
        <Label htmlFor="num-tol" className="text-xs font-medium block mb-1">Tolerance ±</Label>
        <Input
          id="num-tol"
          type="number"
          value={payload.tolerance}
          onChange={e => onChange({ ...payload, tolerance: Number(e.target.value) })}
          min={0}
          step={0.01}
        />
      </div>
      <div>
        <Label htmlFor="num-units" className="text-xs font-medium block mb-1">Units</Label>
        <Input
          id="num-units"
          type="text"
          value={payload.units}
          onChange={e => onChange({ ...payload, units: e.target.value })}
          placeholder="mg, mL, mmHg…"
        />
      </div>
      <p className="col-span-3 text-xs text-muted-foreground">
        A response is correct if {Number.isFinite(payload.answer) ? `|response − ${payload.answer}| ≤ ${payload.tolerance}` : 'response is within tolerance of the answer'}{payload.units ? ` (units: ${payload.units})` : ''}.
      </p>
    </div>
  )
}

// ─── Essay ────────────────────────────────────────────────────────────────

function EssayControls({
  payload, onChange,
}: { payload: Extract<QuestionPayload, { type: 'essay' }>; onChange: (p: QuestionPayload) => void }) {
  function setRubric(idx: number, patch: Partial<typeof payload.rubric[0]>) {
    onChange({ ...payload, rubric: payload.rubric.map((r, i) => i === idx ? { ...r, ...patch } : r) })
  }
  function addCriterion() {
    onChange({
      ...payload,
      rubric: [...payload.rubric, { id: `rb-${Math.random().toString(36).slice(2, 9)}`, label: '', weight: 0, description: '' }],
    })
  }
  function removeCriterion(idx: number) {
    if (payload.rubric.length <= 1) return
    onChange({ ...payload, rubric: payload.rubric.filter((_, i) => i !== idx) })
  }
  const totalWeight = payload.rubric.reduce((s, r) => s + r.weight, 0)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Label htmlFor="essay-limit" className="text-xs font-medium">Word limit</Label>
        <Input
          id="essay-limit"
          type="number"
          value={payload.wordLimit}
          onChange={e => onChange({ ...payload, wordLimit: Number(e.target.value) })}
          min={0}
          className="w-32"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-medium">Rubric</Label>
          <span className={`text-xs font-mono tabular-nums ${totalWeight === 100 ? 'text-chart-2' : 'text-chart-4'}`}>
            Total: {totalWeight}%
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {payload.rubric.map((r, i) => (
            <li key={r.id} className="grid grid-cols-[1fr_80px_2fr_auto] gap-2 items-start">
              <Input value={r.label} onChange={e => setRubric(i, { label: e.target.value })} placeholder="Criterion (e.g. Clarity)" />
              <div className="relative">
                <Input
                  type="number"
                  value={r.weight}
                  onChange={e => setRubric(i, { weight: Number(e.target.value) })}
                  min={0} max={100}
                  className="pr-7"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
              <Input value={r.description} onChange={e => setRubric(i, { description: e.target.value })} placeholder="What earns full credit" />
              <Button variant="ghost" size="icon-sm" onClick={() => removeCriterion(i)} disabled={payload.rubric.length <= 1} aria-label="Remove criterion">
                <i className="fa-light fa-trash-can" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" onClick={addCriterion} className="gap-1.5 mt-2">
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add criterion
        </Button>
      </div>
    </div>
  )
}

// ─── Fill in the blank ────────────────────────────────────────────────────

function FillBlankControls({
  payload, onChange,
}: { payload: Extract<QuestionPayload, { type: 'fill-blank' }>; onChange: (p: QuestionPayload) => void }) {
  // Parse [[…]] tokens out of the template; sync `blanks` array length with token count.
  function setTemplate(value: string) {
    const tokens = Array.from(value.matchAll(/\[\[([^\]]*)\]\]/g)).map(m => m[1])
    const blanks = tokens.map((tok, i) => {
      const existing = payload.blanks[i]
      return existing ?? { id: `blk-${Math.random().toString(36).slice(2, 9)}-${i}`, acceptedAnswers: [tok], caseSensitive: false }
    })
    onChange({ ...payload, stemTemplate: value, blanks })
  }
  function setBlank(idx: number, patch: Partial<typeof payload.blanks[0]>) {
    onChange({ ...payload, blanks: payload.blanks.map((b, i) => i === idx ? { ...b, ...patch } : b) })
  }
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label htmlFor="fb-template" className="text-xs font-medium block mb-1">
          Sentence template
          <span className="ms-1 text-xs text-muted-foreground">— wrap blanks in <code className="font-mono">[[ ]]</code></span>
        </Label>
        <Textarea
          id="fb-template"
          value={payload.stemTemplate}
          onChange={e => setTemplate(e.target.value)}
          rows={3}
          className="text-sm"
        />
      </div>
      <FillBlankPreview template={payload.stemTemplate} />
      {payload.blanks.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium">Accepted answers per blank</Label>
          <ul className="flex flex-col gap-2">
            {payload.blanks.map((b, i) => (
              <li key={b.id} className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold w-7 text-center text-muted-foreground">
                  #{i + 1}
                </span>
                <Input
                  value={b.acceptedAnswers.join(' | ')}
                  onChange={e => setBlank(i, { acceptedAnswers: e.target.value.split('|').map(s => s.trim()).filter(Boolean) })}
                  placeholder="ATP | adenosine triphosphate"
                  className="flex-1"
                />
                <ToggleSwitchRow
                  id={`fb-case-${i}`}
                  label="Aa"
                  checked={b.caseSensitive}
                  onChange={c => setBlank(i, { caseSensitive: c })}
                />
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">Separate multiple accepted answers with <code className="font-mono">|</code>.</p>
        </div>
      )}
    </div>
  )
}

function FillBlankPreview({ template }: { template: string }) {
  const parts: Array<{ type: 'text'; value: string } | { type: 'blank'; idx: number }> = []
  let lastIdx = 0
  let blankIdx = 0
  template.replace(/\[\[([^\]]*)\]\]/g, (_match, _content, offset: number) => {
    if (offset > lastIdx) parts.push({ type: 'text', value: template.slice(lastIdx, offset) })
    parts.push({ type: 'blank', idx: blankIdx++ })
    lastIdx = offset + _match.length
    return _match
  })
  if (lastIdx < template.length) parts.push({ type: 'text', value: template.slice(lastIdx) })
  return (
    <Card
      size="sm"
      className="ring-0 border border-dashed border-border bg-muted/20"
    >
      <CardHeader>
        <CardDescription className="text-xs font-semibold text-muted-foreground">
          Student-facing preview
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground leading-relaxed">
          {parts.map((p, i) => p.type === 'text'
            ? <span key={i}>{p.value}</span>
            : (
              <span
                key={i}
                className="inline-block min-w-12 px-2 mx-0.5 rounded bg-background border-b-2 border-foreground/30 text-center text-xs font-mono text-muted-foreground align-baseline"
                style={{ paddingTop: 1, paddingBottom: 1 }}
              >
                #{p.idx + 1}
              </span>
            )
          )}
        </p>
      </CardContent>
    </Card>
  )
}

// ─── Matching ─────────────────────────────────────────────────────────────

function MatchingControls({
  payload, onChange,
}: { payload: Extract<QuestionPayload, { type: 'matching' }>; onChange: (p: QuestionPayload) => void }) {
  function setLeft(idx: number, patch: Partial<typeof payload.lefts[0]>) {
    onChange({ ...payload, lefts: payload.lefts.map((l, i) => i === idx ? { ...l, ...patch } : l) })
  }
  function setRight(idx: number, patch: Partial<typeof payload.rights[0]>) {
    onChange({ ...payload, rights: payload.rights.map((r, i) => i === idx ? { ...r, ...patch } : r) })
  }
  function addPair() {
    const r = { id: `r-${Math.random().toString(36).slice(2, 9)}`, text: '' }
    onChange({
      ...payload,
      lefts: [...payload.lefts, { id: `l-${Math.random().toString(36).slice(2, 9)}`, left: '', rightId: r.id }],
      rights: [...payload.rights, r],
    })
  }
  function removePair(idx: number) {
    if (payload.lefts.length <= 2) return
    const removedRightId = payload.lefts[idx].rightId
    onChange({
      ...payload,
      lefts: payload.lefts.filter((_, i) => i !== idx),
      rights: payload.rights.filter(r => r.id !== removedRightId),
    })
  }
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs text-muted-foreground -mt-1">
        Pair items on the left with their match on the right. Right column is shown shuffled to students.
      </p>
      <ul className="flex flex-col gap-2">
        {payload.lefts.map((l, i) => {
          const right = payload.rights.find(r => r.id === l.rightId)
          const rightIdx = right ? payload.rights.findIndex(r => r.id === right.id) : -1
          return (
            <li key={l.id} className="grid grid-cols-[1fr_24px_1fr_auto] gap-2 items-center">
              <Input value={l.left} onChange={e => setLeft(i, { left: e.target.value })} placeholder={`Term ${i + 1}`} />
              <i className="fa-light fa-arrow-right-arrow-left text-muted-foreground text-xs justify-self-center" aria-hidden="true" />
              <Input
                value={right?.text ?? ''}
                onChange={e => rightIdx >= 0 && setRight(rightIdx, { text: e.target.value })}
                placeholder={`Match ${i + 1}`}
              />
              <Button variant="ghost" size="icon-sm" onClick={() => removePair(i)} disabled={payload.lefts.length <= 2} aria-label="Remove pair">
                <i className="fa-light fa-trash-can" aria-hidden="true" />
              </Button>
            </li>
          )
        })}
      </ul>
      <Button variant="outline" size="sm" onClick={addPair} className="gap-1.5 self-start">
        <i className="fa-light fa-plus" aria-hidden="true" />
        Add pair
      </Button>
    </div>
  )
}

// ─── Ordering ─────────────────────────────────────────────────────────────

function OrderingControls({
  payload, onChange,
}: { payload: Extract<QuestionPayload, { type: 'ordering' }>; onChange: (p: QuestionPayload) => void }) {
  function move(idx: number, dir: -1 | 1) {
    const next = [...payload.items]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    next.forEach((it, i) => { it.canonicalIdx = i })
    onChange({ ...payload, items: next })
  }
  function setItem(idx: number, text: string) {
    onChange({ ...payload, items: payload.items.map((it, i) => i === idx ? { ...it, text } : it) })
  }
  function addItem() {
    onChange({
      ...payload,
      items: [...payload.items, { id: `o-${Math.random().toString(36).slice(2, 9)}`, text: '', canonicalIdx: payload.items.length }],
    })
  }
  function removeItem(idx: number) {
    if (payload.items.length <= 2) return
    const next = payload.items.filter((_, i) => i !== idx)
    next.forEach((it, i) => { it.canonicalIdx = i })
    onChange({ ...payload, items: next })
  }
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs text-muted-foreground -mt-1">
        Use ↑ / ↓ to set the canonical order. Items will be presented to students in shuffled order.
      </p>
      <ul className="flex flex-col gap-1.5">
        {payload.items.map((it, i) => (
          <li key={it.id} className="grid grid-cols-[24px_1fr_auto_auto] gap-2 items-center bg-muted/20 rounded-md px-2 py-1.5">
            <span className="font-mono text-xs font-bold text-muted-foreground text-center">{i + 1}</span>
            <Input value={it.text} onChange={e => setItem(i, e.target.value)} placeholder={`Step ${i + 1}`} />
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                <i className="fa-light fa-arrow-up text-xs" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => move(i, 1)} disabled={i === payload.items.length - 1} aria-label="Move down">
                <i className="fa-light fa-arrow-down text-xs" aria-hidden="true" />
              </Button>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => removeItem(i)} disabled={payload.items.length <= 2} aria-label="Remove">
              <i className="fa-light fa-trash-can" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5 self-start">
        <i className="fa-light fa-plus" aria-hidden="true" />
        Add step
      </Button>
    </div>
  )
}

// ─── Hotspot ──────────────────────────────────────────────────────────────

function HotspotControls({
  payload, onChange,
}: { payload: Extract<QuestionPayload, { type: 'hotspot' }>; onChange: (p: QuestionPayload) => void }) {
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top)  / rect.height) * 100
    onChange({
      ...payload,
      hotspots: [...payload.hotspots, {
        id: `hs-${Math.random().toString(36).slice(2, 9)}`,
        x: Math.max(0, x - 6),
        y: Math.max(0, y - 6),
        w: 12,
        h: 12,
        label: `Hotspot ${payload.hotspots.length + 1}`,
      }],
    })
  }
  function removeHotspot(id: string) {
    onChange({ ...payload, hotspots: payload.hotspots.filter(h => h.id !== id) })
  }
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <Input
          value={payload.imageUrl}
          onChange={e => onChange({ ...payload, imageUrl: e.target.value })}
          placeholder="Image URL (or upload)"
          className="flex-1"
        />
        <Button variant="outline" size="sm" className="gap-1.5">
          <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
          Upload
        </Button>
      </div>
      <div
        className="relative rounded-lg border-2 border-dashed border-border bg-muted/20 cursor-crosshair overflow-hidden"
        style={{ aspectRatio: '16 / 9' }}
        onClick={handleClick}
        role="button"
        aria-label="Click to mark hotspot"
        tabIndex={0}
      >
        {payload.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={payload.imageUrl} alt="" className="absolute inset-0 w-full h-full object-contain" draggable={false} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-1">
            <i className="fa-light fa-image text-2xl opacity-40" aria-hidden="true" />
            <span className="text-xs">Add an image, then click to mark correct regions</span>
          </div>
        )}
        {payload.hotspots.map(h => (
          <div
            key={h.id}
            className="absolute rounded border-2 border-brand bg-brand/12"
            style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%` }}
          >
            <span className="absolute -top-5 left-0 text-xs font-mono bg-brand text-brand-foreground px-1 rounded">
              {h.label}
            </span>
            <Button
              variant="destructive"
              size="icon-xs"
              onClick={(e) => { e.stopPropagation(); removeHotspot(h.id) }}
              className="absolute -top-1.5 -right-1.5 size-4 rounded-full"
              aria-label={`Remove ${h.label}`}
            >
              <i className="fa-solid fa-xmark text-[8px]" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {payload.hotspots.length} {payload.hotspots.length === 1 ? 'hotspot' : 'hotspots'} marked. Click anywhere on the image to add another.
      </p>
    </div>
  )
}

// ─── Metadata panel ───────────────────────────────────────────────────────

function MetadataPanel({
  draft, objectives, onUpdate,
  aiSuggestion, onRunAi, onAcceptAi, onRejectAi, aiThinking,
}: {
  draft: QuestionDraft
  objectives: CourseObjective[]
  onUpdate: <K extends keyof QuestionDraft>(key: K, value: QuestionDraft[K]) => void
  aiSuggestion: Extract<AiSuggestion, { kind: 'objective' }> | null
  onRunAi: () => void
  onAcceptAi: () => void
  onRejectAi: () => void
  aiThinking: boolean
}) {
  const objective = objectives.find(o => o.id === draft.objectiveId)
  return (
    <section className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <h2 className="text-xs font-semibold text-muted-foreground">Tagging</h2>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="meta-objective" className="text-xs font-medium">Course objective</Label>
          <span className="text-xs text-muted-foreground">one per question</span>
        </div>
        <Select value={draft.objectiveId ?? '__none__'} onValueChange={v => onUpdate('objectiveId', v === '__none__' ? null : v)}>
          <SelectTrigger id="meta-objective" className="text-xs">
            <SelectValue placeholder="Select objective…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">
              <span className="text-muted-foreground">None</span>
            </SelectItem>
            {objectives.map(o => (
              <SelectItem key={o.id} value={o.id}>
                <span className="line-clamp-1">{o.title}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {objective && (
          <p className="text-xs text-muted-foreground mt-1">
            <i className="fa-light fa-bullseye-pointer me-1" aria-hidden="true" />
            Bloom level: {objective.bloomsLevel}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1.5 h-7 mt-1.5 -ms-2"
          onClick={onRunAi}
          disabled={aiThinking || objectives.length === 0 || !draft.stem.trim()}
        >
          <i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" style={{ fontSize: 14 }} />
          AI suggest objective
        </Button>
        {aiSuggestion && (
          <AiSuggestionCard
            compact
            title={draft.objectiveId ? 'Replace objective?' : 'AI matched objective'}
            body={
              <div className="flex flex-col gap-1">
                {draft.objectiveId && objective && (
                  <p className="text-xs text-muted-foreground line-through">{objective.title}</p>
                )}
                <p className="text-xs text-foreground font-medium">{aiSuggestion.objectiveTitle}</p>
                <p className="text-xs text-muted-foreground">Match confidence: {Math.round(aiSuggestion.confidence * 100)}%</p>
              </div>
            }
            rationale={aiSuggestion.rationale}
            onAccept={onAcceptAi}
            onReject={onRejectAi}
          />
        )}
      </div>

      <div>
        <Label htmlFor="meta-difficulty" className="text-xs font-medium block mb-1">Difficulty</Label>
        <Select value={draft.difficulty} onValueChange={v => onUpdate('difficulty', v as QuestionDraft['difficulty'])}>
          <SelectTrigger id="meta-difficulty" className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="meta-bloom" className="text-xs font-medium block mb-1">Bloom level</Label>
        <Select value={draft.blooms} onValueChange={v => onUpdate('blooms', v as QuestionDraft['blooms'])}>
          <SelectTrigger id="meta-bloom" className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Remember">Remember</SelectItem>
            <SelectItem value="Understand">Understand</SelectItem>
            <SelectItem value="Apply">Apply</SelectItem>
            <SelectItem value="Analyze">Analyze</SelectItem>
            <SelectItem value="Evaluate">Evaluate</SelectItem>
            <SelectItem value="Create">Create</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="meta-tags" className="text-xs font-medium">Custom labels</Label>
          <span className="text-xs text-muted-foreground">comma-separated</span>
        </div>
        <Input
          id="meta-tags"
          value={draft.tags.join(', ')}
          onChange={e => onUpdate('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
          placeholder="e.g. faculty-review, NSAID, high-yield"
          className="text-xs"
        />
        {draft.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {draft.tags.map(t => (
              <Badge key={t} variant="secondary" className="rounded text-xs gap-1">
                {t}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onUpdate('tags', draft.tags.filter(x => x !== t))}
                  aria-label={`Remove ${t}`}
                  className="size-3 p-0 hover:bg-transparent"
                >
                  <i className="fa-solid fa-xmark text-[8px]" aria-hidden="true" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs font-medium">Standards</Label>
          <span className="text-xs text-muted-foreground">direct mapping</span>
        </div>
        <StandardsSelect
          selectedIds={draft.standardIds ?? []}
          onUpdate={ids => onUpdate('standardIds', ids)}
        />
      </div>
    </section>
  )
}

// ─── Workflow panel ───────────────────────────────────────────────────────

function WorkflowPanel({
  draft, onUpdate,
}: {
  draft: QuestionDraft
  onUpdate: <K extends keyof QuestionDraft>(key: K, value: QuestionDraft[K]) => void
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <h2 className="text-xs font-semibold text-muted-foreground">Workflow</h2>

      <div>
        <Label className="text-xs font-medium block mb-1">Confidence marker</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Used by reviewers to filter low-confidence drafts during bulk review.
        </p>
        <div className="flex gap-1.5">
          {(['high', 'low', null] as const).map(level => {
            const active = draft.confidence === level
            const label = level === null ? 'Clear' : level === 'high' ? 'High' : 'Low'
            return (
              <Button
                key={String(level)}
                variant="ghost"
                onClick={() => onUpdate('confidence', level)}
                aria-pressed={active}
                className={`flex-1 text-xs font-medium h-auto rounded-md px-2 py-1.5 border ${
                  active
                    ? level === 'high'
                      ? 'bg-chart-2/15 border-chart-2/40 text-chart-2'
                      : level === 'low'
                        ? 'bg-chart-4/15 border-chart-4/40 text-chart-4'
                        : 'bg-muted border-border text-foreground'
                    : 'bg-card border-border text-muted-foreground hover:bg-muted/30'
                }`}
              >
                {label}
              </Button>
            )
          })}
        </div>
      </div>

      <div>
        <Label className="text-xs font-medium block mb-1">Bulk-import status</Label>
        <p className="text-xs text-muted-foreground">
          {draft.aiOriginated
            ? 'This draft was generated by AI — flag any factual issues during review.'
            : 'Manually authored — no AI assist. AI enhance is still available per field.'}
        </p>
      </div>
    </section>
  )
}

// ─── Validation panel ─────────────────────────────────────────────────────

function ValidationPanel({ errors, warnings }: { errors: DraftValidationIssue[]; warnings: DraftValidationIssue[] }) {
  if (errors.length === 0 && warnings.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      {/* DS LocalBanner pair (was hand-rolled section with error+info icons,
          per dialog-banner-badge audit). Two banners so error vs warning gets
          distinct semantic + assistive-tech treatment. */}
      {errors.length > 0 && (
        <LocalBanner variant="error" title="Fix before saving">
          <ul className="flex flex-col gap-1 mt-1">
            {errors.map((e, i) => <li key={`e-${i}`}>{e.message}</li>)}
          </ul>
        </LocalBanner>
      )}
      {warnings.length > 0 && (
        <LocalBanner variant="info" title="Suggestions">
          <ul className="flex flex-col gap-1 mt-1">
            {warnings.map((w, i) => <li key={`w-${i}`}>{w.message}</li>)}
          </ul>
        </LocalBanner>
      )}
    </div>
  )
}

// ─── AI suggestion shared card ────────────────────────────────────────────

type AiSuggestion =
  | { kind: 'stem'; before: string; after: string; rationale: string }
  | { kind: 'distractors'; newDistractors: string[]; rationale: string }
  | { kind: 'objective'; objectiveId: string | null; objectiveTitle: string; confidence: number; rationale: string }

function AiSuggestionCard({
  title, body, rationale, onAccept, onReject, compact = false,
}: {
  title: string
  body: React.ReactNode
  rationale: string
  onAccept: () => void
  onReject: () => void
  compact?: boolean
}) {
  return (
    <div className={`rounded-lg border border-brand/30 bg-brand/5 ${compact ? 'p-2.5 mt-2' : 'p-3 mt-3'} flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        <i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" style={{ fontSize: compact ? 10 : 11 }} />
        <span className="text-xs font-semibold text-foreground">{title}</span>
      </div>
      <div>{body}</div>
      <p className="text-xs text-muted-foreground italic">
        {rationale}
      </p>
      <div className="flex items-center gap-1.5">
        <Button size="sm" onClick={onAccept} className="gap-1 h-7 text-xs">
          <i className="fa-light fa-check" aria-hidden="true" />
          Accept
        </Button>
        <Button size="sm" variant="ghost" onClick={onReject} className="gap-1 h-7 text-xs text-muted-foreground">
          <i className="fa-light fa-xmark" aria-hidden="true" />
          Reject
        </Button>
      </div>
    </div>
  )
}

// ─── Standards multi-select ───────────────────────────────────────────────────

function StandardsSelect({
  selectedIds,
  onUpdate,
}: {
  selectedIds: string[]
  onUpdate: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = MOCK_STANDARDS.filter(s => selectedIds.includes(s.id))
  const grouped = groupedStandards()

  function toggle(id: string) {
    onUpdate(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id])
  }

  return (
    <div className="flex flex-col gap-1.5">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map(s => (
            <Badge key={s.id} variant="secondary" className="rounded text-xs gap-1">
              <span className="font-mono text-muted-foreground">{s.framework}</span>
              {' '}{s.code}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => toggle(s.id)}
                aria-label={`Remove ${s.title}`}
                className="size-3 p-0 hover:bg-transparent"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" style={{ fontSize: 8 }} />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(o => !o)}
        className="gap-1.5 h-7 text-xs justify-start"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <i className="fa-light fa-plus" aria-hidden="true" />
        {selected.length === 0 ? 'Map to standard…' : 'Add more'}
      </Button>
      {open && (
        <div
          className="rounded-lg border border-border bg-card p-2"
          role="listbox"
          aria-multiselectable="true"
          aria-label="Available standards"
        >
          {Object.entries(grouped).map(([framework, stds]) => (
            <div key={framework}>
              <p className="text-xs font-semibold text-muted-foreground px-1 pt-2 pb-1">{framework}</p>
              {stds.map(s => {
                const checked = selectedIds.includes(s.id)
                return (
                  <label
                    key={s.id}
                    role="option"
                    aria-selected={checked}
                    className="flex items-start gap-2 px-1 py-1 rounded cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(s.id)}
                      aria-label={s.title}
                    />
                    <span className="text-xs leading-relaxed">
                      <span className="font-mono text-muted-foreground mr-1 text-xs">{s.code}</span>
                      {s.title}
                    </span>
                  </label>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Bits ─────────────────────────────────────────────────────────────────

function ToggleSwitchRow({
  id, label, checked, onChange,
}: { id: string; label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <QBToggle id={id} checked={checked} onChange={onChange} />
      <Label htmlFor={id} className="text-xs text-foreground cursor-pointer">{label}</Label>
    </div>
  )
}

function StateBadge({ state }: { state: QuestionDraft['state'] }) {
  const meta = state === 'draft' ? { label: 'Draft', icon: 'fa-hourglass',    bg: 'var(--muted)',         fg: 'var(--muted-foreground)' }
                                 : { label: 'Saved', icon: 'fa-circle-check', bg: 'color-mix(in oklch, var(--chart-2) 14%, var(--background))', fg: 'var(--chart-2)' }
  return (
    <Badge variant="secondary" className="rounded text-xs gap-1" style={{ backgroundColor: meta.bg, color: meta.fg }}>
      <i className={`fa-light ${meta.icon}`} aria-hidden="true" style={{ fontSize: 12 }} />
      {meta.label}
    </Badge>
  )
}

function ConfidenceBadge({ level }: { level: 'high' | 'low' }) {
  const meta = level === 'high'
    ? { label: 'High confidence', bg: 'color-mix(in oklch, var(--chart-2) 14%, var(--background))', fg: 'var(--chart-2)' }
    : { label: 'Low confidence',  bg: 'color-mix(in oklch, var(--chart-4) 14%, var(--background))', fg: 'var(--chart-4)' }
  return (
    <Badge variant="secondary" className="rounded text-xs" style={{ backgroundColor: meta.bg, color: meta.fg }}>
      {meta.label}
    </Badge>
  )
}
