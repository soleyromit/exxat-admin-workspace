'use client'

import { useState } from 'react'
import { Button, Textarea } from '@exxat/ds/packages/ui/src'
import type { Question } from '@/lib/qb-types'

interface Props {
  question: Question
  onSave: (updated: Partial<Question> & { rationale: string }) => void
  onCancel: () => void
  onCopyAndModify: (question: Question) => void
}

export function InlineQuestionEditor({ question, onSave, onCancel, onCopyAndModify }: Props) {
  const [stem, setStem]           = useState(question.title)
  const [rationale, setRationale] = useState('')  // not on Question type yet — draft only

  return (
    <div
      style={{
        margin: '4px 12px 8px 24px',
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--card)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground">Editing {question.code}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopyAndModify(question)}
          className="gap-1.5 text-[11px] h-6"
        >
          <i className="fa-light fa-copy" aria-hidden="true" style={{ fontSize: 10 }} />
          Copy &amp; modify
        </Button>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground mb-1">Question stem</p>
        <Textarea
          value={stem}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStem(e.target.value)}
          className="text-xs min-h-16 resize-y"
          aria-label="Question stem"
        />
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground mb-1">
          Rationale
          {!rationale.trim() && (
            <span style={{ color: 'color-mix(in oklch, var(--foreground) 40%, oklch(80% 0.15 80))' }}> — missing</span>
          )}
        </p>
        <Textarea
          value={rationale}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRationale(e.target.value)}
          placeholder="Explain why this answer is correct…"
          className="text-xs min-h-12 resize-y"
          aria-label="Rationale"
          style={{ borderColor: !rationale.trim() ? 'color-mix(in oklch, var(--foreground) 30%, oklch(80% 0.15 80))' : undefined }}
        />
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => onSave({ title: stem, rationale })}
          disabled={!stem.trim()}
        >
          Save to QB
        </Button>
      </div>
    </div>
  )
}
