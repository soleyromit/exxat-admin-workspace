'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
} from '@exxatdesignux/ui'
import type { TemplateQuestion } from '@/lib/pce-mock-data'

interface QBQuestion {
  id: string
  text: string
  answerType: 'likert' | 'free_text'
  category: string
}

const QB_QUESTIONS: QBQuestion[] = [
  // Communication
  { id: 'qb-c1', text: 'How effectively did the supervisor communicate expectations?', answerType: 'likert', category: 'Communication' },
  { id: 'qb-c2', text: 'How well did the supervisor listen to your concerns?', answerType: 'likert', category: 'Communication' },
  { id: 'qb-c3', text: 'How clearly were your learning goals explained?', answerType: 'likert', category: 'Communication' },
  // Clinical Skills
  { id: 'qb-cl1', text: 'How would you rate the supervisor\'s clinical knowledge?', answerType: 'likert', category: 'Clinical Skills' },
  { id: 'qb-cl2', text: 'How effectively did the supervisor model clinical procedures?', answerType: 'likert', category: 'Clinical Skills' },
  { id: 'qb-cl3', text: 'How well did the supervisor connect theory to clinical practice?', answerType: 'likert', category: 'Clinical Skills' },
  // Professionalism
  { id: 'qb-p1', text: 'How consistently did the supervisor demonstrate professional behavior?', answerType: 'likert', category: 'Professionalism' },
  { id: 'qb-p2', text: 'How approachable was the supervisor for questions and concerns?', answerType: 'likert', category: 'Professionalism' },
  // Feedback & Mentorship
  { id: 'qb-f1', text: 'How constructive was the feedback provided by your supervisor?', answerType: 'likert', category: 'Feedback & Mentorship' },
  { id: 'qb-f2', text: 'How timely was the feedback you received?', answerType: 'likert', category: 'Feedback & Mentorship' },
  { id: 'qb-f3', text: 'How well did the supervisor support your professional development?', answerType: 'likert', category: 'Feedback & Mentorship' },
  // Open-ended
  { id: 'qb-o1', text: 'What did your supervisor do particularly well?', answerType: 'free_text', category: 'Open-ended' },
  { id: 'qb-o2', text: 'What areas could your supervisor improve in?', answerType: 'free_text', category: 'Open-ended' },
  { id: 'qb-o3', text: 'Please share any additional comments about your experience.', answerType: 'free_text', category: 'Open-ended' },
]

interface QuestionBankPickerDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAddQuestions: (questions: Pick<TemplateQuestion, 'text' | 'answerType'>[]) => void
}

export function QuestionBankPickerDialog({
  open,
  onOpenChange,
  onAddQuestions,
}: QuestionBankPickerDialogProps) {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) { setSearch(''); setSelectedIds(new Set()) }
  }, [open])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return q
      ? QB_QUESTIONS.filter(item => item.text.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
      : QB_QUESTIONS
  }, [search])

  const grouped = useMemo(() => {
    const map = new Map<string, QBQuestion[]>()
    for (const q of filtered) {
      if (!map.has(q.category)) map.set(q.category, [])
      map.get(q.category)!.push(q)
    }
    return map
  }, [filtered])

  function toggle(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleAdd() {
    const selected = QB_QUESTIONS.filter(q => selectedIds.has(q.id))
    onAddQuestions(selected.map(q => ({ text: q.text, answerType: q.answerType })))
    onOpenChange(false)
  }

  const count = selectedIds.size

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg flex flex-col gap-0 p-0"
        style={{ maxHeight: '80vh' }}
      >
        <DialogHeader className="shrink-0 px-5 pt-5 pb-3">
          <DialogTitle>Question bank</DialogTitle>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Select one or more questions to add to this section.
          </p>
          <Input
            autoFocus
            placeholder="Search questions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mt-3 h-8 text-sm"
          />
        </DialogHeader>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4" style={{ minHeight: 0 }}>
          {grouped.size === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
              No questions match your search.
            </p>
          ) : (
            Array.from(grouped.entries()).map(([category, questions]) => (
              <div key={category} className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                  {category}
                </p>
                {questions.map(q => {
                  const checked = selectedIds.has(q.id)
                  return (
                    <div
                      key={q.id}
                      role="checkbox"
                      aria-checked={checked}
                      tabIndex={0}
                      onClick={() => toggle(q.id)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(q.id) } }}
                      className="flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors"
                      style={{
                        borderColor: checked ? 'var(--brand-color)' : 'var(--border)',
                        background: checked ? 'var(--brand-tint)' : 'var(--card)',
                      }}
                    >
                      {/* Checkbox indicator */}
                      <div
                        className="shrink-0 rounded flex items-center justify-center mt-0.5"
                        style={{
                          width: 16, height: 16,
                          border: checked ? 'none' : '1.5px solid var(--border)',
                          background: checked ? 'var(--brand-color)' : 'transparent',
                        }}
                      >
                        {checked && <i className="fa-solid fa-check text-white" aria-hidden="true" style={{ fontSize: 9 }} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug" style={{ color: checked ? 'var(--brand-color-dark)' : 'var(--foreground)' }}>
                          {q.text}
                        </p>
                      </div>

                      <span
                        className="shrink-0 text-xs rounded px-1.5 py-0.5 mt-0.5"
                        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                      >
                        {q.answerType === 'likert' ? 'Likert' : 'Free-text'}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className="shrink-0 border-t border-border px-5 pt-3 pb-4">
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="default" size="sm" disabled={count === 0} onClick={handleAdd}>
              {count > 0 ? `Add ${count} question${count !== 1 ? 's' : ''}` : 'Add questions'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
