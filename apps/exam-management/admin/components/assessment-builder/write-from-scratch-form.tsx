'use client'

import { useState } from 'react'
import { Button, Separator } from '@exxatdesignux/ui'
import type { QType, QDiff } from '@/lib/qb-types'
import type { GeneratedQuestion } from '@/lib/add-questions-types'

const Q_TYPES: QType[] = [
  'MCQ',
  'MSQ',
  'True/False',
  'Fill blank',
  'Matching',
  'Hotspot',
  'Essay',
]

const DIFFICULTIES: QDiff[] = ['Easy', 'Medium', 'Hard']

export interface WriteFromScratchFormProps {
  /** When set, pre-populates form for editing a generated question */
  prefill?: GeneratedQuestion
  onSave: (question: GeneratedQuestion) => void
  onCancel: () => void
}

interface MCQOption {
  key: string
  text: string
  isCorrect: boolean
}

function defaultOptions(type: QType): MCQOption[] {
  if (type === 'True/False') {
    return [
      { key: 'A', text: 'True', isCorrect: false },
      { key: 'B', text: 'False', isCorrect: false },
    ]
  }
  return [
    { key: 'A', text: '', isCorrect: false },
    { key: 'B', text: '', isCorrect: false },
    { key: 'C', text: '', isCorrect: false },
  ]
}

export function WriteFromScratchForm({
  prefill,
  onSave,
  onCancel,
}: WriteFromScratchFormProps) {
  const [stem, setStem] = useState(prefill?.stemText ?? '')
  const [type, setType] = useState<QType>(prefill?.type ?? 'MCQ')
  const [difficulty, setDifficulty] = useState<QDiff>(prefill?.difficulty ?? 'Medium')
  const [options, setOptions] = useState<MCQOption[]>(
    prefill?.options?.map(o => ({ key: o.key, text: o.text, isCorrect: o.isCorrect })) ??
      defaultOptions(prefill?.type ?? 'MCQ')
  )
  const [matchPairs, setMatchPairs] = useState<{ left: string; right: string }[]>(
    prefill?.matchPairs ?? [{ left: '', right: '' }]
  )
  const [modelAnswer, setModelAnswer] = useState(prefill?.modelAnswer ?? '')
  const [wordMin, setWordMin] = useState(prefill?.wordLimitMin?.toString() ?? '')
  const [wordMax, setWordMax] = useState(prefill?.wordLimitMax?.toString() ?? '')

  const canSave = stem.trim().length > 0

  function handleTypeChange(newType: QType) {
    setType(newType)
    setOptions(defaultOptions(newType))
  }

  function setOptionCorrect(key: string) {
    if (type === 'MSQ') {
      setOptions(opts =>
        opts.map(o => (o.key === key ? { ...o, isCorrect: !o.isCorrect } : o))
      )
    } else {
      setOptions(opts =>
        opts.map(o => ({ ...o, isCorrect: o.key === key }))
      )
    }
  }

  function setOptionText(key: string, text: string) {
    setOptions(opts => opts.map(o => (o.key === key ? { ...o, text } : o)))
  }

  function addOption() {
    const nextKey = String.fromCharCode(65 + options.length)
    setOptions(opts => [...opts, { key: nextKey, text: '', isCorrect: false }])
  }

  function addMatchPair() {
    setMatchPairs(pairs => [...pairs, { left: '', right: '' }])
  }

  function setMatchPairValue(i: number, side: 'left' | 'right', value: string) {
    setMatchPairs(pairs =>
      pairs.map((p, idx) => (idx === i ? { ...p, [side]: value } : p))
    )
  }

  function handleSave() {
    if (!canSave) return
    const question: GeneratedQuestion = {
      id: `write-${Date.now()}`,
      type,
      difficulty,
      stemText: stem,
      source: 'ai',
      options:
        ['MCQ', 'MSQ', 'True/False'].includes(type)
          ? options
              .filter(o => o.text.trim())
              .map(o => ({ ...o, isSuggestedCorrect: false }))
          : undefined,
      matchPairs:
        type === 'Matching'
          ? matchPairs.filter(p => p.left.trim() && p.right.trim())
          : undefined,
      modelAnswer: ['Fill blank', 'Short Answer'].includes(type) ? modelAnswer : undefined,
      wordLimitMin: type === 'Essay' && wordMin ? parseInt(wordMin) : undefined,
      wordLimitMax: type === 'Essay' && wordMax ? parseInt(wordMax) : undefined,
    }
    onSave(question)
  }

  const isOptionType = ['MCQ', 'MSQ', 'True/False'].includes(type)

  return (
    <div className="border-b border-[var(--border)] bg-[var(--background)]">
      {/* Form header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <span className="text-xs font-medium text-[var(--foreground)]">
          Writing new question
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          aria-label="Cancel write from scratch"
          className="w-6 h-6"
        >
          <i className="fa-regular fa-xmark text-xs" aria-hidden="true" />
        </Button>
      </div>

      <div className="px-3 py-3 space-y-4">
        {/* Stem */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--muted-foreground)]">
            QUESTION STEM
          </label>
          <textarea
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            value={stem}
            onChange={e => setStem(e.target.value)}
            rows={3}
            placeholder="Enter question text…"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none resize-none focus:border-[var(--brand-color)] transition-colors"
            aria-label="Question stem"
          />
        </div>

        {/* Type + Difficulty row */}
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-[var(--muted-foreground)]">
              TYPE
            </label>
            <select
              value={type}
              onChange={e => handleTypeChange(e.target.value as QType)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 h-8 text-sm outline-none"
              aria-label="Question type"
            >
              {Q_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-[var(--muted-foreground)]">
              DIFFICULTY
            </label>
            <select
              value={difficulty}
              onChange={e => setDifficulty(e.target.value as QDiff)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 h-8 text-sm outline-none"
              aria-label="Difficulty level"
            >
              {DIFFICULTIES.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Separator />

        {/* MCQ / MSQ / True-False options */}
        {isOptionType && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted-foreground)]">
              {type === 'MSQ' ? 'ANSWER OPTIONS (check all correct)' : 'ANSWER OPTIONS (click to mark correct)'}
            </label>
            {options.map(opt => (
              <div key={opt.key} className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setOptionCorrect(opt.key)}
                  aria-label={`Mark option ${opt.key} as correct`}
                  aria-pressed={opt.isCorrect}
                  className={[
                    'shrink-0 w-5 h-5 rounded-full border transition-colors',
                    opt.isCorrect
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-[var(--border)] hover:border-[var(--brand-color)]',
                  ].join(' ')}
                >
                  {opt.isCorrect && (
                    <i className="fa-solid fa-check text-[10px]" aria-hidden="true" />
                  )}
                </Button>
                {type === 'True/False' ? (
                  <span className="flex-1 text-sm text-[var(--foreground)]">{opt.text}</span>
                ) : (
                  <input
                    type="text"
                    value={opt.text}
                    onChange={e => setOptionText(opt.key, e.target.value)}
                    placeholder={`Option ${opt.key}`}
                    aria-label={`Option ${opt.key} text`}
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 h-8 text-sm outline-none focus:border-[var(--brand-color)] transition-colors"
                  />
                )}
              </div>
            ))}
            {type !== 'True/False' && options.length < 6 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full border-dashed text-xs text-[var(--muted-foreground)]"
              >
                <i className="fa-regular fa-plus text-xs" aria-hidden="true" />
                Add option {String.fromCharCode(65 + options.length)}
              </Button>
            )}
          </div>
        )}

        {/* Fill in the Blank / Short Answer */}
        {['Fill blank', 'Short Answer'].includes(type) && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--muted-foreground)]">
              MODEL ANSWER
            </label>
            <input
              type="text"
              value={modelAnswer}
              onChange={e => setModelAnswer(e.target.value)}
              placeholder="Enter the correct answer…"
              aria-label="Model answer"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 h-8 text-sm outline-none focus:border-[var(--brand-color)] transition-colors"
            />
          </div>
        )}

        {/* Matching */}
        {type === 'Matching' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--muted-foreground)]">
              MATCH PAIRS
            </label>
            {matchPairs.map((pair, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={pair.left}
                  onChange={e => setMatchPairValue(i, 'left', e.target.value)}
                  placeholder="Left prompt"
                  aria-label={`Pair ${i + 1} left`}
                  className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 h-8 text-sm outline-none focus:border-[var(--brand-color)] transition-colors"
                />
                <i className="fa-regular fa-arrow-right text-[var(--muted-foreground)] text-xs shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  value={pair.right}
                  onChange={e => setMatchPairValue(i, 'right', e.target.value)}
                  placeholder="Right match"
                  aria-label={`Pair ${i + 1} right`}
                  className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 h-8 text-sm outline-none focus:border-[var(--brand-color)] transition-colors"
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addMatchPair}
              className="w-full border-dashed text-xs text-[var(--muted-foreground)]"
            >
              <i className="fa-regular fa-plus text-xs" aria-hidden="true" />
              Add pair
            </Button>
          </div>
        )}

        {/* Hotspot */}
        {type === 'Hotspot' && (
          <div className="rounded-md border border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-2 h-24 text-sm text-[var(--muted-foreground)]">
            <i className="fa-regular fa-image text-xl" aria-hidden="true" />
            <span>Upload hotspot image (not implemented in mock)</span>
          </div>
        )}

        {/* Essay */}
        {type === 'Essay' && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-[var(--muted-foreground)]">
                  MIN WORDS
                </label>
                <input
                  type="number"
                  value={wordMin}
                  onChange={e => setWordMin(e.target.value)}
                  placeholder="e.g. 100"
                  aria-label="Minimum word count"
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 h-8 text-sm outline-none"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-[var(--muted-foreground)]">
                  MAX WORDS
                </label>
                <input
                  type="number"
                  value={wordMax}
                  onChange={e => setWordMax(e.target.value)}
                  placeholder="e.g. 500"
                  aria-label="Maximum word count"
                  className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-2 h-8 text-sm outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Rubric upload available after save (not in V0 write form)
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2.5 border-t border-[var(--border)]">
        <Button variant="ghost" size="sm" className="text-xs" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          className="text-xs"
          disabled={!canSave}
          onClick={handleSave}
        >
          Save &amp; add to section
        </Button>
      </div>
    </div>
  )
}
