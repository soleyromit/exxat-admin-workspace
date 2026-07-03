'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@exxatdesignux/ui'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import type { TemplateImportDoc } from '@/lib/pce-mock-data'

interface TemplateImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Tab the generated content will land in, e.g. "Course" / "Faculty". */
  tabLabel: string
  /** File picked in the builder before this opened — generation starts on it. */
  fileName: string | null
  docs: TemplateImportDoc[]
  onImport: (doc: TemplateImportDoc) => void
}

export function TemplateImportDialog({ open, onOpenChange, tabLabel, fileName, docs, onImport }: TemplateImportDialogProps) {
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [generated, setGenerated] = useState<TemplateImportDoc | null>(null)

  // Mock: the "AI" reads the uploaded document and generates a structure.
  function runGenerate(name: string) {
    setActiveFile(name)
    setGenerated(null)
    setAnalyzing(true)
    const base = docs[0] ?? null
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setGenerated(base ? { ...base, name } : null)
      setAnalyzing(false)
    }, 900)
  }

  // The file is chosen in the builder (one click) — start generating as we open.
  useEffect(() => {
    if (open && fileName) { runGenerate(fileName) }
    if (!open) { setActiveFile(null); setGenerated(null); setAnalyzing(false) }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fileName])

  function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) runGenerate(file.name)
  }

  const sectionCount = generated?.sections.length ?? 0
  const questionCount = generated?.sections.reduce((n, s) => n + s.questions.length, 0) ?? 0
  const ready = !!generated && !analyzing

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Generate from a document</DialogTitle>
          <DialogDescription>
            We&apos;re generating sections and questions for {tabLabel} from your document. You can edit, reorder, or delete anything afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4" style={{ paddingTop: 2, paddingBottom: 2 }}>
          {/* Uploaded file + generation status */}
          <div className="flex items-center gap-2.5 rounded-md border border-border" style={{ padding: '10px 12px' }}>
            <i className="fa-light fa-file-lines" aria-hidden="true" style={{ fontSize: 15, color: 'var(--muted-foreground)' }} />
            <span className="text-sm flex-1 min-w-0 truncate">{activeFile ?? '—'}</span>
            {analyzing ? (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <i className="fa-light fa-spinner-third fa-spin" aria-hidden="true" />
                Generating…
              </span>
            ) : ready ? (
              <i className="fa-solid fa-circle-check" aria-hidden="true" style={{ fontSize: 14, color: 'var(--chart-2)' }} />
            ) : null}
          </div>

          {/* Generated structure preview */}
          {ready && (
            <div className="rounded-md border border-border overflow-hidden">
              <div style={{ padding: '8px 12px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <p className="text-xs font-medium">
                  Generated {sectionCount} section{sectionCount !== 1 ? 's' : ''} · {questionCount} question{questionCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex flex-col" style={{ padding: '4px 12px 8px', maxHeight: 220, overflowY: 'auto' }}>
                {generated!.sections.map((s, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-3 py-2 border-b border-border last:border-0">
                    <span className="text-sm min-w-0 truncate">{s.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {s.questions.length} question{s.questions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <input ref={replaceInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleReplace} aria-label="Choose a different document" />
        </div>

        <DialogFooter className="flex-row justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => replaceInputRef.current?.click()}
          >
            Choose a different document
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" disabled={!ready} onClick={() => generated && onImport(generated)}>
              {ready ? `Add ${sectionCount} section${sectionCount !== 1 ? 's' : ''} · ${questionCount} question${questionCount !== 1 ? 's' : ''}` : 'Add to template'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
