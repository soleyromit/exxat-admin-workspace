'use client'

/* Question Editor drawer — 7 question types + per-type grading rules.
   Component-substitution pass onto @exxatdesignux/ui (Sheet + DS form controls). */

import { useState, type ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  ToggleSwitch,
} from '@exxatdesignux/ui'
import { Icon, LeoStar } from '../icons'
import { Field, useApp } from '../primitives'
import { QTYPE, qIcon, type Question, type Grading, type QOption } from '../data'

export function QuestionEditor({
  question,
  sectionName,
  onSave,
  onClose,
}: {
  question: Question
  sectionName?: string
  onSave: (q: Question) => void
  onClose: () => void
}) {
  const [q, setQ] = useState<Question>(() => JSON.parse(JSON.stringify(question)))
  const { notify } = useApp()
  const [improving, setImproving] = useState(false)

  function improveWithLeo() {
    setImproving(true)
    setTimeout(() => {
      setQ((prev) => {
        const next = { ...prev }
        if (prev.topic) next.stem = prev.stem
        // tighten options: ensure 4 plausible distractors flagged
        return next
      })
      setImproving(false)
      notify('Leo refined the stem and distractors for clarity')
    }, 1100)
  }

  const up = (patch: Partial<Question>) => setQ((prev) => ({ ...prev, ...patch }))
  const upGrade = (patch: Partial<Grading>) =>
    setQ((prev) => ({ ...prev, grading: { ...prev.grading, ...patch } }))
  const t = QTYPE[q.type]

  function setOpt(i: number, patch: Partial<QOption>) {
    const o = [...(q.options || [])]
    o[i] = { ...o[i], ...patch }
    up({ options: o })
  }
  function toggleCorrect(i: number) {
    if (q.type === 'mcq' || q.type === 'tf') {
      up({ options: (q.options || []).map((o, j) => ({ ...o, correct: j === i })) })
    } else {
      setOpt(i, { correct: !(q.options || [])[i].correct })
    }
  }

  return (
    <Sheet
      open
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <SheetContent
        side="right"
        className="w-[720px] max-w-[96vw] flex flex-col gap-0 p-0 sm:max-w-[720px]"
      >
        <SheetHeader className="flex-row items-center gap-3 px-6 py-4">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'var(--muted)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--brand-color-dark)',
            }}
          >
            <Icon name={qIcon(q.type)} style={{ fontSize: 16 }} />
          </div>
          <div style={{ flex: 1 }}>
            <SheetTitle style={{ fontSize: 15, fontWeight: 600 }}>
              {question.stem ? 'Edit question' : 'New question'}
            </SheetTitle>
            <SheetDescription>
              {sectionName} · {t.label}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* type + source */}
          <Field label="Question type">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {Object.entries(QTYPE).map(([k, v]) => (
                <Button
                  key={k}
                  type="button"
                  variant={q.type === k ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => up({ type: k as Question['type'] })}
                >
                  <Icon name={qIcon(k)} />
                  {v.short}
                </Button>
              ))}
            </div>
          </Field>

          {q.source && (
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 16,
                marginTop: 16,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'oklch(from var(--chart-1) l c h / 0.08)',
                color: 'var(--foreground)',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <Icon
                name={
                  q.source === 'ai'
                    ? 'wand-magic-sparkles'
                    : q.source === 'bank'
                      ? 'rectangle-list'
                      : 'pen'
                }
                style={{ marginTop: 1, color: 'var(--chip-1)' }}
              />
              <div>
                {q.source === 'bank' && (
                  <span>
                    <b>Pinned from Question Bank.</b> Editing here creates a{' '}
                    <b>local draft for this exam only</b> — the master institutional copy stays
                    untouched.
                  </span>
                )}
                {q.source === 'ai' && (
                  <span>
                    <b>AI-generated draft.</b> Review the stem, options, and key before adding to
                    the bank.
                  </span>
                )}
                {q.source === 'manual' && (
                  <span>
                    <b>Authored manually.</b> Tag it with a topic so it can be reused and
                    AI-searched later.
                  </span>
                )}
              </div>
            </div>
          )}

          <Field label="Question stem" req>
            <Textarea rows={3} value={q.stem} onChange={(e) => up({ stem: e.target.value })} />
          </Field>

          {/* type-specific body */}
          {(q.type === 'mcq' || q.type === 'msq' || q.type === 'tf') && (
            <Field
              label={
                q.type === 'msq'
                  ? 'Options — check all correct'
                  : 'Options — select the correct answer'
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(q.options || []).map((o, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => toggleCorrect(i)}
                      title="Mark correct"
                      aria-label="Mark correct"
                      style={{
                        color: o.correct ? 'var(--chip-2)' : 'var(--muted-foreground)',
                      }}
                    >
                      <Icon
                        name={
                          q.type === 'msq'
                            ? o.correct
                              ? 'square-check'
                              : 'square'
                            : o.correct
                              ? 'circle-check'
                              : 'circle'
                        }
                        style={{ fontSize: 18 }}
                      />
                    </Button>
                    <Input
                      value={o.text}
                      onChange={(e) => setOpt(i, { text: e.target.value })}
                      style={{
                        flex: 1,
                        borderColor: o.correct
                          ? 'oklch(from var(--chart-2) l c h / 0.5)'
                          : undefined,
                      }}
                    />
                    {q.type !== 'tf' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove option"
                        onClick={() =>
                          up({ options: (q.options || []).filter((_, j) => j !== i) })
                        }
                      >
                        <Icon name="trash" style={{ fontSize: 13 }} />
                      </Button>
                    )}
                  </div>
                ))}
                {q.type !== 'tf' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    style={{ alignSelf: 'flex-start' }}
                    onClick={() =>
                      up({ options: [...(q.options || []), { text: '', correct: false }] })
                    }
                  >
                    <Icon name="plus" />
                    Add option
                  </Button>
                )}
              </div>
            </Field>
          )}

          {q.type === 'fitb' && (
            <Field
              label="Accepted answers"
              hint="One per line. Matching logic configured in grading rules below."
            >
              <Textarea
                rows={3}
                value={(q.answers || []).join('\n')}
                onChange={(e) => up({ answers: e.target.value.split('\n') })}
              />
            </Field>
          )}

          {q.type === 'match' && (
            <Field label="Matching pairs">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(q.pairs || []).map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Input
                      value={p.left}
                      placeholder="Prompt"
                      onChange={(e) => {
                        const pr = [...(q.pairs || [])]
                        pr[i] = { ...p, left: e.target.value }
                        up({ pairs: pr })
                      }}
                      style={{ flex: 1 }}
                    />
                    <Icon name="right-left" style={{ color: 'var(--muted-foreground)' }} />
                    <Input
                      value={p.right}
                      placeholder="Match"
                      onChange={(e) => {
                        const pr = [...(q.pairs || [])]
                        pr[i] = { ...p, right: e.target.value }
                        up({ pairs: pr })
                      }}
                      style={{ flex: 1 }}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => up({ pairs: [...(q.pairs || []), { left: '', right: '' }] })}
                >
                  <Icon name="plus" />
                  Add pair
                </Button>
              </div>
            </Field>
          )}

          {q.type === 'hotspot' && (
            <Field
              label="Hotspot image"
              hint="Upload an image, then draw target regions (circle/polygon)."
            >
              <div
                style={{
                  border: '1.5px dashed var(--border-control-35)',
                  borderRadius: 12,
                  height: 160,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--muted-foreground)',
                  background: 'var(--muted)',
                  gap: 6,
                  textAlign: 'center',
                }}
              >
                <Icon name="location-crosshairs" style={{ fontSize: 24 }} />
                <div style={{ fontSize: 12 }}>
                  Drop nephron diagram · define {q.grading?.regions || 1} target region(s)
                </div>
              </div>
            </Field>
          )}

          {q.type === 'essay' && (
            <Field
              label="Grading rubric"
              hint="Attach named criteria with per-criterion points for structured manual grading."
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(q.grading?.rubric || []).map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Input
                      value={r.criterion}
                      onChange={(e) => {
                        const rb = [...(q.grading?.rubric || [])]
                        rb[i] = { ...r, criterion: e.target.value }
                        upGrade({ rubric: rb })
                      }}
                      style={{ flex: 1 }}
                    />
                    <Input
                      type="number"
                      value={r.points}
                      onChange={(e) => {
                        const rb = [...(q.grading?.rubric || [])]
                        rb[i] = { ...r, points: +e.target.value }
                        upGrade({ rubric: rb })
                      }}
                      style={{ width: 64 }}
                    />
                    <span className="hint">pts</span>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() =>
                    upGrade({
                      rubric: [...(q.grading?.rubric || []), { criterion: '', points: 1 }],
                    })
                  }
                >
                  <Icon name="plus" />
                  Add criterion
                </Button>
              </div>
            </Field>
          )}

          <div className="divider"></div>

          {/* metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <Field label="Points">
              <Input
                type="number"
                value={q.points}
                onChange={(e) => up({ points: +e.target.value })}
              />
            </Field>
            <Field label="Difficulty">
              <Select
                value={q.difficulty}
                onValueChange={(v) => up({ difficulty: v as Question['difficulty'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Easy', 'Medium', 'Hard'].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Bloom's level">
              <Select value={q.bloom} onValueChange={(v) => up({ bloom: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <Field label="Topic tag">
              <Input value={q.topic} onChange={(e) => up({ topic: e.target.value })} />
            </Field>
            <Field label="Bonus question">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40 }}>
                <ToggleSwitch checked={q.bonus} onChange={(v) => up({ bonus: v })} />
                <span className="hint">Excluded from total</span>
              </div>
            </Field>
          </div>

          <div className="divider"></div>

          {/* grading rules — per type */}
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Grading rules</div>
          <GradingRules type={q.type} grading={q.grading || {}} upGrade={upGrade} />
        </div>

        <SheetFooter className="flex-row items-center gap-2 border-t px-6 py-4">
          <Button type="button" size="sm" onClick={improveWithLeo} disabled={improving}>
            <LeoStar style={{ filter: 'brightness(3)' }} />
            {improving ? 'Improving…' : 'Improve with Leo'}
          </Button>
          <span style={{ marginLeft: 'auto' }}></span>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onSave(q)}>
            <Icon name="check" />
            Save question
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function GradingRules({
  type,
  grading,
  upGrade,
}: {
  type: Question['type']
  grading: Grading
  upGrade: (patch: Partial<Grading>) => void
}) {
  const Row = ({
    label,
    hint,
    children,
  }: {
    label: string
    hint?: string
    children?: ReactNode
  }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {hint && (
          <div className="hint" style={{ marginTop: 2 }}>
            {hint}
          </div>
        )}
      </div>
      {children}
    </div>
  )

  if (type === 'mcq')
    return (
      <div>
        <Row label="Option randomization" hint="Shuffle distractors per student">
          <ToggleSwitch
            checked={!!grading.randomize}
            onChange={(v) => upGrade({ randomize: v })}
          />
        </Row>
        <Row label="Distractor locking" hint="Pin options like 'All of the above' to the bottom">
          <ToggleSwitch checked={!!grading.lockLast} onChange={(v) => upGrade({ lockLast: v })} />
        </Row>
        <Row label="Negative marking" hint="Deduct fractional points for incorrect selection">
          <ToggleSwitch checked={!!grading.negative} onChange={(v) => upGrade({ negative: v })} />
        </Row>
      </div>
    )
  if (type === 'msq')
    return (
      <div>
        <Row label="Option randomization">
          <ToggleSwitch
            checked={!!grading.randomize}
            onChange={(v) => upGrade({ randomize: v })}
          />
        </Row>
        <Row label="Distractor locking">
          <ToggleSwitch checked={!!grading.lockLast} onChange={(v) => upGrade({ lockLast: v })} />
        </Row>
        <Row label="Scoring model">
          <div style={{ width: 220 }}>
            <Select
              value={grading.scoring || 'all-or-nothing'}
              onValueChange={(v) => upGrade({ scoring: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-or-nothing">All-or-nothing</SelectItem>
                <SelectItem value="partial-additive">Partial credit (additive)</SelectItem>
                <SelectItem value="partial-proportional">Partial credit (proportional)</SelectItem>
                <SelectItem value="right-minus-wrong">Right-minus-wrong</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Row>
      </div>
    )
  if (type === 'fitb')
    return (
      <div>
        <Row label="Match logic">
          <div style={{ display: 'flex', gap: 6 }}>
            <Button
              type="button"
              size="sm"
              variant={(grading.match || 'exact') === 'exact' ? 'default' : 'outline'}
              aria-pressed={(grading.match || 'exact') === 'exact'}
              onClick={() => upGrade({ match: 'exact' })}
            >
              Exact match
            </Button>
            <Button
              type="button"
              size="sm"
              variant={grading.match === 'contains' ? 'default' : 'outline'}
              aria-pressed={grading.match === 'contains'}
              onClick={() => upGrade({ match: 'contains' })}
            >
              Contains
            </Button>
          </div>
        </Row>
        <Row label="Case sensitive">
          <ToggleSwitch
            checked={!!grading.caseSensitive}
            onChange={(v) => upGrade({ caseSensitive: v })}
          />
        </Row>
        <Row label="Alternative spellings" hint="Defined in the accepted answers list above">
          <span className="hint">{grading.alts || 'edit above'}</span>
        </Row>
      </div>
    )
  if (type === 'match')
    return (
      <div>
        <Row label="Partial credit per pair" hint="Award points for each correctly matched pair">
          <ToggleSwitch
            checked={!!grading.partialPerPair}
            onChange={(v) => upGrade({ partialPerPair: v })}
          />
        </Row>
        <Row
          label="Extra distractors"
          hint="More target answers than prompts to prevent elimination guessing"
        >
          <ToggleSwitch
            checked={!!grading.extraDistractors}
            onChange={(v) => upGrade({ extraDistractors: v })}
          />
        </Row>
      </div>
    )
  if (type === 'hotspot')
    return (
      <div>
        <Row label="Target regions">
          <Input
            type="number"
            min={1}
            style={{ width: 70 }}
            value={grading.regions || 1}
            onChange={(e) => upGrade({ regions: +e.target.value })}
          />
        </Row>
        <Row label="Partial credit" hint="Award partial points across multiple hotspots">
          <ToggleSwitch checked={!!grading.partial} onChange={(v) => upGrade({ partial: v })} />
        </Row>
      </div>
    )
  if (type === 'essay')
    return (
      <div>
        <Row label="Word limit">
          <Input
            type="number"
            style={{ width: 90 }}
            value={grading.wordLimit || 0}
            onChange={(e) => upGrade({ wordLimit: +e.target.value })}
          />
        </Row>
        <Row label="Blind grading" hint="Hide student names during scoring">
          <ToggleSwitch
            checked={!!grading.blindGrading}
            onChange={(v) => upGrade({ blindGrading: v })}
          />
        </Row>
      </div>
    )
  if (type === 'tf')
    return (
      <div className="hint" style={{ padding: '8px 0' }}>
        True / False uses standard exact scoring. Set the correct answer above.
      </div>
    )
  return null
}
