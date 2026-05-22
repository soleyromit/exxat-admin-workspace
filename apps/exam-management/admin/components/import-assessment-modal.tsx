'use client'

import React, { useState } from 'react'
import { Button, Badge, LocalBanner } from '@exxat/ds/packages/ui/src'

type ImportStep = 'upload' | 'review' | 'confirming'

interface ParsedQuestion {
  id: string
  stem: string
  optionsCount: number
  matchedQBId: string | null     // null = new question (will be added to QB)
  matchedTitle: string | null
  confidence: number | null      // 0–1 if matched
}

// Mock parsed questions simulating what OCR + matching would return
const MOCK_PARSED: ParsedQuestion[] = [
  { id: 'p1', stem: 'A patient presents with acute kidney injury. Which aminoglycoside factor most directly influences dosing?', optionsCount: 4, matchedQBId: 'phar101-q001', matchedTitle: 'Apply dose-calculation methods...', confidence: 0.91 },
  { id: 'p2', stem: 'Which receptor subtype mediates bronchodilation when stimulated?', optionsCount: 4, matchedQBId: 'phar101-q003', matchedTitle: 'Distinguish receptor agonist vs antagonist...', confidence: 0.78 },
  { id: 'p3', stem: 'Describe the mechanism by which warfarin inhibits coagulation.', optionsCount: 4, matchedQBId: null, matchedTitle: null, confidence: null },
  { id: 'p4', stem: 'Which of the following is a first-line treatment for type 2 diabetes?', optionsCount: 5, matchedQBId: null, matchedTitle: null, confidence: null },
]

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  courseCode: string
  onImport: (questions: ParsedQuestion[]) => void
}

export function ImportAssessmentModal({ open, onOpenChange, courseCode, onImport }: Props) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [fileName, setFileName] = useState<string | null>(null)
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  if (!open) return null

  const matchedCount = MOCK_PARSED.filter(q => q.matchedQBId !== null).length
  const newCount = MOCK_PARSED.filter(q => q.matchedQBId === null).length

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      // Simulate parsing delay
      setTimeout(() => setStep('review'), 800)
    }
  }

  function toggleExclude(id: string) {
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleImport() {
    const toImport = MOCK_PARSED.filter(q => !excluded.has(q.id))
    onImport(toImport)
    onOpenChange(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'color-mix(in oklch, var(--foreground) 40%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onOpenChange(false) }}
    >
      <div style={{ background: 'var(--background)', borderRadius: 16, border: '1px solid var(--border)', width: '100%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 className="text-base font-semibold text-foreground">Import from PDF</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{courseCode} · We match to your question bank automatically</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} aria-label="Close" className="h-8 w-8 p-0">
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 14 }} />
          </Button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {step === 'upload' && (
            <div className="flex flex-col items-center gap-4">
              <div
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 w-full"
                style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}
              >
                <i className="fa-light fa-file-pdf" aria-hidden="true" style={{ fontSize: 36, color: 'var(--brand-color)' }} />
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Upload your paper exam</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF up to 50 MB · We extract questions and match to your QB</p>
                </div>
                <label>
                  <Button variant="default" size="sm" className="gap-2" asChild>
                    <span>
                      <i className="fa-light fa-upload" aria-hidden="true" />
                      Choose file
                    </span>
                  </Button>
                  <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              </div>
              {fileName && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <i className="fa-light fa-spinner fa-spin" aria-hidden="true" />
                  Parsing {fileName}…
                </div>
              )}
            </div>
          )}

          {step === 'review' && (
            <div className="flex flex-col gap-4">
              <LocalBanner variant="info" icon="fa-wand-magic-sparkles" title={`Found ${MOCK_PARSED.length} questions`}>
                <p>{matchedCount} matched to your QB · {newCount} will be added as new questions</p>
              </LocalBanner>

              <div className="flex flex-col gap-2">
                {MOCK_PARSED.map(q => (
                  <div
                    key={q.id}
                    className="rounded-lg border p-3 flex items-start gap-3"
                    style={{
                      borderColor: excluded.has(q.id) ? 'var(--muted)' : 'var(--border)',
                      background: excluded.has(q.id) ? 'var(--muted)' : 'var(--card)',
                      opacity: excluded.has(q.id) ? 0.5 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!excluded.has(q.id)}
                      onChange={() => toggleExclude(q.id)}
                      aria-label={`Include question ${q.id}`}
                      style={{ marginTop: 3, accentColor: 'var(--brand-color)', width: 14, height: 14, flexShrink: 0 }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed line-clamp-2">{q.stem}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {q.matchedQBId ? (
                          <>
                            <Badge variant="secondary" className="text-[9px]">
                              <i className="fa-light fa-link mr-1" aria-hidden="true" />
                              QB match
                            </Badge>
                            <span className="text-[10px] text-muted-foreground truncate">{q.matchedTitle}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">{Math.round((q.confidence ?? 0) * 100)}% confidence</span>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-[9px]">New question</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span className="text-xs text-muted-foreground">
              {MOCK_PARSED.length - excluded.size} of {MOCK_PARSED.length} questions selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleImport}
                disabled={excluded.size === MOCK_PARSED.length}
                className="gap-1.5"
              >
                <i className="fa-light fa-file-import" aria-hidden="true" />
                Create draft
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
