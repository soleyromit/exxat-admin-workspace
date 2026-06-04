'use client'

import { useState } from 'react'
import { Button, Textarea } from '@exxatdesignux/ui'
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
        <span className="text-xs font-semibold text-foreground">Editing {question.code}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopyAndModify(question)}
          className="gap-1.5"
        >
          <i className="fa-light fa-copy" aria-hidden="true" />
          Copy &amp; modify
        </Button>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1">Question stem</p>
        <Textarea
          value={stem}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStem(e.target.value)}
          className="text-xs min-h-16 resize-y"
          aria-label="Question stem"
        />
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1">
          Rationale
          {!rationale.trim() && (
            <span className="text-muted-foreground"> — missing</span>
          )}
        </p>
        <Textarea
          value={rationale}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRationale(e.target.value)}
          placeholder="Explain why this answer is correct…"
          className="text-xs min-h-12 resize-y"
          aria-label="Rationale"
          style={{ borderColor: !rationale.trim() ? 'var(--chart-4)' : undefined }}
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
