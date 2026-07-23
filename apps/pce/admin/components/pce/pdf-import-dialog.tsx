'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from '@exxatdesignux/ui'
import type { TemplateQuestion } from '@/lib/pce-mock-data'

type Step = 'upload' | 'processing' | 'review'

interface ExtractedQuestion {
  id: string
  text: string
  answerType: 'likert' | 'free_text'
}

const MOCK_EXTRACTED: ExtractedQuestion[] = [
  { id: 'pdf-1', text: 'How would you rate the overall quality of instruction?', answerType: 'likert' },
  { id: 'pdf-2', text: 'Was the course content relevant to your clinical practice?', answerType: 'likert' },
  { id: 'pdf-3', text: 'How well were learning objectives communicated at the start?', answerType: 'likert' },
  { id: 'pdf-4', text: 'Rate the effectiveness of the teaching methods used.', answerType: 'likert' },
  { id: 'pdf-5', text: 'How accessible was your supervisor outside of scheduled sessions?', answerType: 'likert' },
  { id: 'pdf-6', text: 'What suggestions do you have for improving this experience?', answerType: 'free_text' },
]

interface PdfImportDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onAddQuestions: (questions: Pick<TemplateQuestion, 'text' | 'answerType'>[]) => void
}

export function PdfImportDialog({
  open,
  onOpenChange,
  onAddQuestions,
}: PdfImportDialogProps) {
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(MOCK_EXTRACTED.map(q => q.id)))

  useEffect(() => {
    if (open) { setStep('upload'); setFileName(null); setSelectedIds(new Set(MOCK_EXTRACTED.map(q => q.id))) }
  }, [open])

  function handleFilePick() {
    setFileName('evaluation-form-2025.pdf')
  }

  function handleProcess() {
    setStep('processing')
    setTimeout(() => setStep('review'), 1800)
  }

  function toggle(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleAdd() {
    const selected = MOCK_EXTRACTED.filter(q => selectedIds.has(q.id))
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
        {/* ── Upload step ── */}
        {step === 'upload' && (
          <>
            <DialogHeader className="shrink-0 px-5 pt-5 pb-4">
              <DialogTitle>Import from PDF</DialogTitle>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Upload a PDF and we'll extract questions automatically.
              </p>
            </DialogHeader>

            <div className="flex-1 px-5 pb-2">
              <div
                className="rounded-xl border border-dashed flex flex-col items-center gap-3 py-12 text-center"
                style={{ borderColor: 'var(--border)' }}
              >
                <i className="fa-light fa-cloud-arrow-up text-3xl" aria-hidden="true"
                   style={{ color: 'var(--muted-foreground)' }} />
                {fileName ? (
                  <div className="flex items-center gap-2">
                    <i className="fa-light fa-file-pdf text-sm" aria-hidden="true"
                       style={{ color: 'var(--brand-color)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {fileName}
                    </span>
                    <Button
                      variant="ghost" size="icon-sm" aria-label="Remove file"
                      onClick={() => setFileName(null)}
                    >
                      <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium">Drop a PDF here</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      or click to browse
                    </p>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={handleFilePick}>
                  <i className="fa-light fa-folder-open text-xs" aria-hidden="true" />
                  {fileName ? 'Choose different file' : 'Choose file'}
                </Button>
              </div>
            </div>

            <div className="shrink-0 border-t border-border px-5 pt-3 pb-4">
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button variant="default" size="sm" disabled={!fileName} onClick={handleProcess}>
                  Extract questions
                  <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
                </Button>
              </DialogFooter>
            </div>
          </>
        )}

        {/* ── Processing step ── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
            <i className="fa-light fa-spinner-third fa-spin text-3xl" aria-hidden="true"
               style={{ color: 'var(--brand-color)' }} />
            <div>
              <p className="text-sm font-medium">Extracting questions…</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                Analysing {fileName} for evaluation questions
              </p>
            </div>
          </div>
        )}

        {/* ── Review step ── */}
        {step === 'review' && (
          <>
            <DialogHeader className="shrink-0 px-5 pt-5 pb-3">
              <DialogTitle>Review extracted questions</DialogTitle>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {MOCK_EXTRACTED.length} questions found in <span className="font-medium">{fileName}</span>. Deselect any you don't want to add.
              </p>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-1.5" style={{ minHeight: 0 }}>
              {MOCK_EXTRACTED.map(q => {
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

            <div className="shrink-0 border-t border-border px-5 pt-3 pb-4">
              <DialogFooter>
                <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                  <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
                  Back
                </Button>
                <Button variant="default" size="sm" disabled={count === 0} onClick={handleAdd}>
                  {count > 0 ? `Add ${count} question${count !== 1 ? 's' : ''}` : 'Add questions'}
                </Button>
              </DialogFooter>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
