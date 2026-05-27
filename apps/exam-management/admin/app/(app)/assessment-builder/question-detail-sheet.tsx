'use client'
import React, { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetTitle, Button } from '@exxat/ds/packages/ui/src'
import type { Question, QuestionVersionEntry, QuestionCollaborator } from '@/lib/qb-types'
import { MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'

type DetailTab = 'details' | 'stats' | 'versions' | 'collaborators'

// ─── Helper: PBI chip ────────────────────────────────────────────────────────

function PbiChip({ pbis }: { pbis: number | null | undefined }) {
  if (pbis === null || pbis === undefined) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 999,
        background: 'var(--muted)', color: 'var(--muted-foreground)',
        fontSize: 12, fontWeight: 500,
      }}>
        Manual grading
      </span>
    )
  }
  const isLow = pbis < 0.20
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      background: 'var(--muted)',
      color: isLow ? 'var(--qb-pbi-low-color)' : 'var(--qb-pbi-good-color)',
      fontSize: 12, fontWeight: 500,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isLow ? 'var(--chart-4)' : 'var(--chart-2)',
        flexShrink: 0,
      }} />
      {isLow && <span aria-hidden="true">⚠</span>}
      {' '}Pt. bi-serial {pbis.toFixed(2)}
    </span>
  )
}

// ─── Helper: Footer chip ─────────────────────────────────────────────────────

function FooterChip({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 999,
      background: 'var(--muted)',
      color: warn ? 'var(--qb-pbi-low-color)' : 'var(--muted-foreground)',
      fontSize: 12, fontWeight: 500,
    }}>
      {children}
    </span>
  )
}

// ─── Helper: Eyebrow label ───────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-xs font-semibold text-muted-foreground"
      style={{ marginBottom: 6 }}
    >
      {children}
    </div>
  )
}

// ─── Helper: Meta divider ────────────────────────────────────────────────────

function MetaDivider() {
  return (
    <div style={{
      height: 1, background: 'var(--border)',
      margin: '12px 0',
    }} />
  )
}

// ─── Type-specific preview components ────────────────────────────────────────

function StemBlock({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 10 }}>
      <Eyebrow>Question stem</Eyebrow>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--foreground)', margin: 0 }}>{children}</p>
      {note && <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '6px 0 0', fontStyle: 'italic' }}>{note}</p>}
    </div>
  )
}

function RationaleBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 4, padding: '6px 10px', background: 'var(--muted)', borderRadius: 6, fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
      <span style={{ fontWeight: 600, color: 'var(--foreground)', marginRight: 6 }}>{label}</span>
      {children}
    </div>
  )
}

/** Stacked MCQ — stem + options with per-option rationale (correct + "why incorrect") */
function MCQStackedPreview({ question }: { question: Question }) {
  const stemText = question.stemText ?? question.title
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <StemBlock>{stemText}</StemBlock>
      {question.options?.map(opt => (
        <div key={opt.key} style={{ marginBottom: 2 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            border: `1px solid ${opt.isCorrect ? 'var(--chart-2)' : 'var(--border)'}`,
            borderRadius: 7, padding: '9px 11px',
            background: opt.isCorrect ? 'oklch(0.97 0.025 160)' : 'transparent',
          }}>
            <span style={{
              flexShrink: 0, width: 24, height: 24, borderRadius: 5,
              background: opt.isCorrect ? 'var(--chart-2)' : 'var(--muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              color: opt.isCorrect ? '#fff' : 'var(--muted-foreground)',
            }}>
              {opt.key}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--foreground)', margin: 0 }}>{opt.text}</p>
              {opt.isCorrect && (
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--chart-2)', display: 'block', marginTop: 3 }}>✓ Correct</span>
              )}
            </div>
          </div>
          {opt.rationale && (
            <RationaleBlock label={opt.isCorrect ? `Rationale${opt.rationaleAuthor ? ` — ${opt.rationaleAuthor}` : ''}` : 'Why this is incorrect'}>
              {opt.rationale}
            </RationaleBlock>
          )}
        </div>
      ))}
    </div>
  )
}

/** Split MCQ — stem + correct rationale on left; options with distractor rationale on right */
function MCQSplitPreview({ question }: { question: Question }) {
  const stemText = question.stemText ?? question.title
  const correctOption = question.options?.find(o => o.isCorrect)
  return (
    <div style={{ display: 'flex', gap: 12, height: '100%' }}>
      {/* Left: stem + correct rationale */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 10 }}>
          <Eyebrow>Question stem</Eyebrow>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--foreground)', margin: 0 }}>{stemText}</p>
        </div>
        {correctOption?.rationale && (
          <div style={{
            background: 'color-mix(in srgb, var(--chart-2) 7%, var(--background))',
            border: '1px solid color-mix(in srgb, var(--chart-2) 25%, var(--background))',
            borderRadius: 8, padding: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--chart-2)', marginBottom: 5 }}>
              Rationale{correctOption.rationaleAuthor ? ` — ${correctOption.rationaleAuthor}` : ''}
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--foreground)', margin: 0 }}>{correctOption.rationale}</p>
          </div>
        )}
      </div>
      {/* Right: options + distractor rationale */}
      <div style={{ width: '44%', flexShrink: 0, overflowY: 'auto' }}>
        <Eyebrow>Select one answer</Eyebrow>
        {question.options?.map(opt => (
          <div key={opt.key} style={{ marginBottom: 6 }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              border: `1px solid ${opt.isCorrect ? 'var(--chart-2)' : 'var(--border)'}`,
              borderRadius: 7, padding: '7px 9px',
              background: opt.isCorrect ? 'oklch(0.97 0.025 160)' : 'transparent',
            }}>
              <span style={{
                flexShrink: 0, width: 22, height: 22, borderRadius: 4,
                background: opt.isCorrect ? 'var(--chart-2)' : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                color: opt.isCorrect ? '#fff' : 'var(--muted-foreground)',
              }}>
                {opt.key}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--foreground)', margin: 0 }}>{opt.text}</p>
                {opt.isCorrect && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--chart-2)', display: 'block', marginTop: 2 }}>✓ Correct</span>
                )}
              </div>
            </div>
            {!opt.isCorrect && opt.rationale && (
              <RationaleBlock label="Why incorrect">{opt.rationale}</RationaleBlock>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Ordering — numbered sequence with rationale per step */
function OrderingPreview({ question }: { question: Question }) {
  const stemText = question.stemText ?? question.title
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <StemBlock>{stemText}</StemBlock>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
        Correct sequence
      </div>
      {question.options?.map((opt, idx) => (
        <div key={opt.key} style={{ marginBottom: 2 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            border: '1px solid var(--chart-2)', borderRadius: 7, padding: '9px 11px',
            background: 'oklch(0.97 0.025 160)',
          }}>
            <span style={{
              flexShrink: 0, width: 24, height: 24, borderRadius: '50%',
              background: 'var(--chart-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}>
              {idx + 1}
            </span>
            <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--foreground)', margin: 0, flex: 1 }}>{opt.text}</p>
          </div>
          {opt.rationale && (
            <RationaleBlock label="Why this position">{opt.rationale}</RationaleBlock>
          )}
        </div>
      ))}
    </div>
  )
}

/** Matching — prompt → answer pairs with rationale */
function MatchingPreview({ question }: { question: Question }) {
  const stemText = question.stemText ?? question.title
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <StemBlock>{stemText}</StemBlock>
      {/* Column headers */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
        <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Drug / Prompt</div>
        <div style={{ flex: 2, fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Correct match</div>
      </div>
      {question.options?.map(opt => {
        // Split "Drug → Match" on first →
        const parts = opt.text.split('→')
        const prompt = parts[0]?.trim() ?? opt.text
        const match = parts.slice(1).join('→').trim()
        return (
          <div key={opt.key} style={{ marginBottom: 2 }}>
            <div style={{
              display: 'flex', alignItems: 'stretch', gap: 2,
              border: '1px solid var(--chart-2)', borderRadius: 7, overflow: 'hidden',
              background: 'oklch(0.97 0.025 160)',
            }}>
              {/* Key label */}
              <div style={{
                width: 28, flexShrink: 0,
                background: 'var(--chart-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                {opt.key}
              </div>
              {/* Prompt */}
              <div style={{ flex: 1, padding: '7px 8px', borderRight: '1px solid color-mix(in srgb, var(--chart-2) 30%, transparent)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>{prompt}</span>
              </div>
              {/* Arrow */}
              <div style={{ width: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--chart-2)', fontSize: 12 }}>→</div>
              {/* Match */}
              <div style={{ flex: 2, padding: '7px 8px' }}>
                <span style={{ fontSize: 12, color: 'var(--foreground)', lineHeight: 1.4 }}>{match || opt.text}</span>
              </div>
            </div>
            {opt.rationale && (
              <RationaleBlock label="Why this match">{opt.rationale}</RationaleBlock>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Fill blank (cloze) — stem with blank marker + answer revealed below */
function FillBlankPreview({ question }: { question: Question }) {
  const stemText = question.stemText ?? question.title
  const hasRubric = question.rubric && question.rubric.length > 0
  if (hasRubric) {
    // Long-form / essay fill-blank — render as essay
    return <EssayPreview question={question} />
  }
  // Cloze style — show blanks + answers
  const parts = stemText.split(/\[BLANK\]|\[___\]|___+/)
  const answers = question.options ?? []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
        <Eyebrow>Question stem</Eyebrow>
        <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--foreground)', margin: 0 }}>
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              {part}
              {i < parts.length - 1 && (
                <span style={{
                  display: 'inline-block',
                  borderBottom: '2px solid var(--chart-2)',
                  minWidth: 80, marginInline: 4, verticalAlign: 'bottom',
                  textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--chart-2)',
                  lineHeight: '1.4',
                }}>
                  {answers[i]?.text ?? '___'}
                </span>
              )}
            </React.Fragment>
          ))}
        </p>
      </div>
      {answers.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Correct answers</div>
          {answers.map((ans, i) => (
            <div key={ans.key} style={{ marginBottom: 2 }}>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                border: '1px solid var(--chart-2)', borderRadius: 7, padding: '8px 10px',
                background: 'oklch(0.97 0.025 160)',
              }}>
                <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--chart-2)', minWidth: 24 }}>
                  #{i + 1}
                </span>
                <p style={{ fontSize: 13, color: 'var(--foreground)', margin: 0, flex: 1 }}>{ans.text}</p>
              </div>
              {ans.rationale && (
                <RationaleBlock label="Rationale">{ans.rationale}</RationaleBlock>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}

/** Essay / long-form response */
function EssayPreview({ question }: { question: Question }) {
  const stemText = question.stemText ?? question.title
  const rubricTotal = question.rubric?.reduce((s, r) => s + r.points, 0) ?? 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <StemBlock note={question.minWordCount ? `Minimum ${question.minWordCount} words` : undefined}>
        {stemText}
      </StemBlock>
      {/* Student response area */}
      <div style={{
        background: 'var(--muted)', border: '1.5px solid var(--border)',
        borderRadius: 8, padding: 14, minHeight: 80,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Student response area</span>
        {question.minWordCount && (
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>0 / {question.minWordCount} words minimum</span>
        )}
      </div>
      {/* Rubric */}
      {question.rubric && question.rubric.length > 0 && (
        <div style={{
          background: 'color-mix(in srgb, var(--chart-2) 6%, var(--background))',
          border: '1px solid color-mix(in srgb, var(--chart-2) 22%, var(--background))',
          borderRadius: 8, padding: 13,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--chart-2)', marginBottom: 8 }}>
            Scoring rubric
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {question.rubric.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, paddingBottom: 5, borderBottom: `1px solid color-mix(in srgb, var(--chart-2) 15%, var(--background))` }}>
                <span style={{ fontSize: 12, color: 'var(--foreground)', flex: 1, lineHeight: 1.4 }}>{r.criterion}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', flexShrink: 0 }}>{r.points} pt{r.points !== 1 ? 's' : ''}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Total</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--chart-2)' }}>{rubricTotal} pts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Hotspot — placeholder with annotation zone marker */
function HotspotPreview({ question }: { question: Question }) {
  const stemText = question.stemText ?? question.title
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <StemBlock>{stemText}</StemBlock>
      <div style={{
        background: 'var(--muted)', border: '1px dashed var(--border)',
        borderRadius: 8, minHeight: 160, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
          Hotspot image — student taps the correct region
        </span>
        {/* Simulated correct zone */}
        <div style={{
          position: 'absolute', top: '30%', left: '55%',
          width: 48, height: 48, borderRadius: '50%',
          border: '2px solid var(--chart-2)',
          background: 'oklch(0.97 0.025 160)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'var(--chart-2)',
        }}>
          ✓
        </div>
      </div>
      {question.options?.[0]?.rationale && (
        <RationaleBlock label="Correct zone rationale">{question.options[0].rationale}</RationaleBlock>
      )}
    </div>
  )
}

// ─── Tab: Details ─────────────────────────────────────────────────────────────

function DetailsTab({ question }: { question: Question }) {
  const allLocations = [
    { folderPath: question.folderPath },
    ...(question.extraFolders ?? []),
  ]

  // Route rendering by question type
  function QuestionPreview() {
    switch (question.type) {
      case 'Ordering':
        return <OrderingPreview question={question} />
      case 'Matching':
        return <MatchingPreview question={question} />
      case 'Hotspot':
        return <HotspotPreview question={question} />
      case 'Fill blank': {
        const hasRubric = question.rubric && question.rubric.length > 0
        const hasOptions = question.options && question.options.length > 0
        return hasRubric || !hasOptions
          ? <EssayPreview question={question} />
          : <FillBlankPreview question={question} />
      }
      case 'MCQ':
      default:
        return question.layout === 'split'
          ? <MCQSplitPreview question={question} />
          : <MCQStackedPreview question={question} />
    }
  }

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%', overflow: 'hidden' }}>
      {/* Left: question preview */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
        <QuestionPreview />
      </div>

      {/* Right: meta sidebar */}
      <div style={{
        width: 224, flexShrink: 0, overflowY: 'auto',
        borderLeft: '1px solid var(--border)', paddingLeft: 14,
      }}>
        {/* Quick stats */}
        <Eyebrow>Quick stats</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Usage</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>
              {(question.usage ?? 0) > 0 ? `${question.usage}×` : 'Never'}
            </span>
          </div>
          {question.correctness !== undefined && question.correctness !== null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Correct %</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>
                {question.correctness}%
              </span>
            </div>
          )}
          {question.avgTimeSeconds !== undefined && question.avgTimeSeconds !== null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Avg time</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>
                {question.avgTimeSeconds < 60
                  ? `${question.avgTimeSeconds}s`
                  : `${Math.round(question.avgTimeSeconds / 60)}m`}
              </span>
            </div>
          )}
        </div>

        <MetaDivider />

        {/* Location in QB */}
        <Eyebrow>Location in QB</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {allLocations.map((loc, i) => (
            <div key={i} style={{
              fontSize: 12, color: 'var(--foreground)', lineHeight: 1.4,
              padding: '4px 8px', background: 'var(--muted)', borderRadius: 6,
            }}>
              {loc.folderPath.split(' / ').map((seg, si) => (
                <span key={si}>
                  {si > 0 && (
                    <i className="fa-light fa-chevron-right" aria-hidden="true"
                      style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 3px' }} />
                  )}
                  <span style={{ color: si === loc.folderPath.split(' / ').length - 1 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                    {seg}
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>

        <MetaDivider />

        {/* Classification */}
        <Eyebrow>Classification</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {question.tags.map(tag => (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 7px', borderRadius: 999,
                background: 'var(--muted)', color: 'var(--muted-foreground)',
                fontSize: 12, fontWeight: 500,
                border: '1px solid var(--border)',
              }}>
                {tag}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Bloom&apos;s:</span>
            <span style={{
              fontSize: 12, fontWeight: 600, color: 'var(--foreground)',
              padding: '1px 6px', background: 'var(--muted)', borderRadius: 4,
            }}>
              {question.blooms}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Stats ───────────────────────────────────────────────────────────────

function StatsTab({ question }: { question: Question }) {
  const pbis = question.pbis
  const pbisLow = pbis !== null && pbis !== undefined && pbis < 0.20
  const isEssay = !question.options || question.options.length === 0

  const diffColor: Record<string, string> = {
    Easy:   'var(--chart-2)',
    Medium: 'var(--muted-foreground)',
    Hard:   'var(--chart-4)',
  }

  const totalOptionSelections = question.optionDistribution
    ? question.optionDistribution.reduce((s, o) => s + o.count, 0)
    : 0

  return (
    <div style={{ overflowY: 'auto', height: '100%', paddingRight: 4 }}>
      {/* Banners */}
      {pbisLow && (
        <div style={{
          padding: '10px 14px', marginBottom: 14,
          background: 'var(--muted)',
          border: '1px solid var(--border)', borderRadius: 8,
          fontSize: 12, color: 'var(--qb-pbi-low-color)', lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            <i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ marginRight: 6 }} />
            Low point-biserial correlation ({pbis?.toFixed(2)})
          </div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Students who answer correctly aren&apos;t performing better overall</li>
            <li>Consider reviewing the stem for ambiguity</li>
            <li>Check if distractors are clearly wrong or all plausible</li>
          </ul>
        </div>
      )}
      {isEssay && pbis === null && (
        <div style={{
          padding: '10px 14px', marginBottom: 14,
          background: 'var(--muted)', border: '1px solid var(--border)',
          borderRadius: 8, fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5,
        }}>
          <i className="fa-light fa-circle-info" aria-hidden="true" style={{ marginRight: 6 }} />
          Point-biserial is not computed for essay questions. Grading is manual.
        </div>
      )}

      {/* Stats grid — 3 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        {/* Correctness */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '12px 14px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>
            {question.correctness !== null && question.correctness !== undefined
              ? `${question.correctness}%`
              : '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4 }}>Correctness</div>
        </div>
        {/* Avg time */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '12px 14px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--foreground)', lineHeight: 1 }}>
            {question.avgTimeSeconds !== null && question.avgTimeSeconds !== undefined
              ? question.avgTimeSeconds < 60
                ? `${question.avgTimeSeconds}s`
                : `${Math.round(question.avgTimeSeconds / 60)}m`
              : '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4 }}>Avg time</div>
        </div>
        {/* Difficulty */}
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '12px 14px', textAlign: 'center',
        }}>
          <div style={{
            fontSize: 22, fontWeight: 700, lineHeight: 1,
            color: diffColor[question.difficulty] ?? 'var(--foreground)',
          }}>
            {question.difficulty}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4 }}>Difficulty</div>
        </div>
      </div>

      {/* PBI tile — col-span-3 */}
      {pbis !== null && pbis !== undefined && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '12px 14px', marginBottom: 14,
        }}>
          <Eyebrow>Point-biserial correlation</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
            <span style={{
              fontSize: 28, fontWeight: 700,
              color: pbisLow ? 'var(--qb-pbi-low-color)' : 'var(--foreground)',
            }}>
              {pbis.toFixed(2)}
            </span>
            {pbisLow && (
              <span style={{ fontSize: 12, color: 'var(--qb-pbi-low-color)', fontWeight: 500 }}>Low</span>
            )}
          </div>
          {/* Horizontal bar with zone markers */}
          <div
            role="img"
            aria-label={`Point-biserial: ${pbis.toFixed(2)}. ${
              pbis < 0.2 ? 'Low — below 0.20 threshold.'
                : pbis < 0.3 ? 'Fair — between 0.20 and 0.30.'
                : 'Good — above 0.30.'
            }`}
          >
            <div style={{ position: 'relative', height: 8, background: 'var(--muted)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${Math.min(pbis * 100, 100)}%`,
                background: pbisLow ? 'var(--chart-4)' : 'var(--chart-2)',
                borderRadius: 4, transition: 'width .3s',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, position: 'relative' }}>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>0.00</span>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)', position: 'absolute', left: '20%' }}>0.20 fair</span>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)', position: 'absolute', left: '30%' }}>0.30 good</span>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>1.00</span>
            </div>
            <div style={{ position: 'relative', height: 14 }} />
          </div>
        </div>
      )}

      {/* Option distribution */}
      {question.optionDistribution && question.optionDistribution.length > 0 && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 8, overflow: 'hidden', marginBottom: 14,
        }}>
          <div style={{
            padding: '8px 14px', borderBottom: '1px solid var(--border)',
            fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)',
          }}>
            Option distribution ({question.totalAttempts ?? totalOptionSelections} attempts)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <caption style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
              Option distribution
            </caption>
            <thead>
              <tr style={{ background: 'var(--muted)' }}>
                <th style={{ padding: '5px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', width: 50 }}>Option</th>
                <th style={{ padding: '5px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', width: 60 }}>Count</th>
                <th style={{ padding: '5px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', width: 48 }}>%</th>
                <th style={{ padding: '5px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)' }}>Bar</th>
              </tr>
            </thead>
            <tbody>
              {question.optionDistribution.map(opt => {
                const pct = totalOptionSelections > 0 ? Math.round((opt.count / totalOptionSelections) * 100) : 0
                const matchedOption = question.options?.find(o => o.key === opt.key)
                const isCorrect = matchedOption?.isCorrect ?? false
                return (
                  <tr key={opt.key} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 12px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 20, height: 20, borderRadius: '50%',
                        background: isCorrect ? 'var(--chart-2)' : 'var(--muted)',
                        color: isCorrect ? 'var(--primary-foreground)' : 'var(--foreground)',
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {opt.key}
                      </span>
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: 12, color: 'var(--foreground)' }}>
                      {opt.count}
                    </td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>
                      {pct}%
                    </td>
                    <td style={{ padding: '6px 12px' }}>
                      <div style={{ height: 6, background: 'var(--muted)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: isCorrect ? 'var(--chart-2)' : 'var(--muted-foreground)',
                          borderRadius: 3, opacity: 0.7,
                        }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Question config grid — 2 cols */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Type', value: question.type },
          { label: 'Layout', value: question.layout ?? 'stacked' },
          { label: "Bloom's", value: question.blooms },
          { label: 'Difficulty', value: question.difficulty },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--muted)', borderRadius: 8, padding: '10px 12px',
          }}>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: Versions ────────────────────────────────────────────────────────────

function VersionsTab({
  versionHistory,
  viewingVersion,
  onView,
}: {
  versionHistory: QuestionVersionEntry[]
  viewingVersion: number
  onView: (v: number) => void
}) {
  return (
    <div style={{ overflowY: 'auto', height: '100%' }}>
      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 14, lineHeight: 1.5 }}>
        Any version can be used independently. Editing creates a new version.
      </p>
      <div style={{ position: 'relative' }}>
        {/* Timeline line */}
        <div style={{
          position: 'absolute', left: 10, top: 8, bottom: 8,
          width: 1, background: 'var(--border)',
        }} />
        {versionHistory.map((entry, idx) => {
          const isViewing = entry.version === viewingVersion
          return (
            <div key={entry.version} style={{
              display: 'flex', gap: 14, marginBottom: idx < versionHistory.length - 1 ? 20 : 0,
              position: 'relative',
            }}>
              {/* Dot */}
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                background: isViewing ? 'var(--brand-color)' : 'var(--muted)',
                border: `2px solid ${isViewing ? 'var(--brand-color)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1,
              }}>
                {isViewing && (
                  <i className="fa-solid fa-check" aria-hidden="true"
                    style={{ fontSize: 12, color: 'var(--primary-foreground)' }} />
                )}
              </div>
              {/* Content */}
              <div style={{ flex: 1, paddingBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
                    v{entry.version}{entry.isOriginal ? ' (Original)' : ''}
                  </span>
                  {isViewing ? (
                    <span style={{
                      fontSize: 12, fontWeight: 600, padding: '1px 7px', borderRadius: 999,
                      background: 'var(--brand-color)', color: 'var(--primary-foreground)',
                    }}>
                      Viewing
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(entry.version)}
                      style={{ fontSize: 12, padding: '0 8px' }}
                    >
                      View this version
                    </Button>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 6 }}>
                  {entry.modifiedBy} · {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {entry.changes.length > 0 && (
                  <div style={{
                    background: 'var(--muted)', borderRadius: 6, padding: '7px 10px', marginBottom: 6,
                  }}>
                    {entry.changes.map((c, ci) => (
                      <div key={ci} style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                        <span style={{ marginRight: 4 }}>·</span>{c}
                      </div>
                    ))}
                  </div>
                )}
                {entry.usedInAssessments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {entry.usedInAssessments.map(name => (
                      <span key={name} style={{
                        fontSize: 12, padding: '1px 7px', borderRadius: 999,
                        background: 'var(--muted)', color: 'var(--muted-foreground)',
                        border: '1px solid var(--border)',
                      }}>
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab: Collaborators ───────────────────────────────────────────────────────

function CollaboratorsTab({ collaborators }: { collaborators: QuestionCollaborator[] }) {
  const roleStyle: Record<string, { bg: string; color: string }> = {
    owner: { bg: 'var(--muted)', color: 'var(--brand-color)' },
    edit:  { bg: 'var(--muted)', color: 'var(--chart-1)' },
    view:  { bg: 'var(--muted)', color: 'var(--muted-foreground)' },
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%' }}>
      <Eyebrow>People with access</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
        {collaborators.map(c => {
          const persona = MOCK_QB_PERSONAS.find(p => p.id === c.personaId)
          const style = roleStyle[c.role] ?? roleStyle.view
          return (
            <div key={c.personaId} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8,
              background: 'var(--card)', border: '1px solid var(--border)',
            }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: persona?.color ?? 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--primary-foreground)',
              }}>
                {persona?.initials ?? c.personaId.slice(0, 2).toUpperCase()}
              </div>
              {/* Name */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>
                  {persona?.name ?? c.personaId}
                </div>
                {persona?.role && (
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                    {persona.role.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
              {/* Role chip */}
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                background: style.bg, color: style.color,
                textTransform: 'capitalize',
              }}>
                {c.role}
              </span>
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
        Access is managed at the folder level.
      </p>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function QuestionDetailSheet({
  questionId,
  questions,
  open,
  onOpenChange,
  onEdit,
}: {
  questionId: string | null
  questions: Question[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string) => void
}) {
  const question = questions.find(q => q.id === (questionId ?? ''))
  const [activeTab, setActiveTab] = useState<DetailTab>('details')
  const [viewingVersion, setViewingVersion] = useState<number | null>(null)

  useEffect(() => {
    setActiveTab('details')
    setViewingVersion(null)
  }, [questionId])

  if (!question) return null

  const versionHistory = question.versionHistory ?? []
  const collaborators = question.collaborators ?? []
  const displayVersion = viewingVersion ?? question.version
  const pbisLow = question.pbis !== null && question.pbis !== undefined && question.pbis < 0.2

  const tabs: Array<{ id: DetailTab; label: string; badge?: string | number; warn?: boolean }> = [
    { id: 'details',       label: 'Details' },
    { id: 'stats',         label: 'Stats', warn: pbisLow },
    { id: 'versions',      label: 'Versions', badge: versionHistory.length > 0 ? versionHistory.length : undefined },
    { id: 'collaborators', label: 'Collaborators', badge: collaborators.length > 0 ? collaborators.length : undefined },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        style={{
          width: '82vw', maxWidth: 960,
          display: 'flex', flexDirection: 'column',
          padding: 0,
        }}
      >
        {/* Visually-hidden title satisfies Radix DialogContent accessibility requirement */}
        <SheetTitle className="sr-only">{question.title}</SheetTitle>

        {/* ── Header (52px) ─────────────────────────────────────────────── */}
        <div style={{
          height: 52, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px', borderBottom: '1px solid var(--border)',
          background: 'var(--card)',
        }}>
          {/* Title */}
          <span
            className="text-sm font-semibold text-foreground truncate"
            style={{ flex: 1, minWidth: 0 }}
            title={question.title}
          >
            {question.title}
          </span>

          {/* Version selector — only if multiple versions */}
          {versionHistory.length > 1 && (
            <select
              value={displayVersion}
              onChange={e => setViewingVersion(Number(e.target.value))}
              aria-label="Select version"
              style={{
                fontSize: 12, padding: '2px 6px', borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--background)', color: 'var(--foreground)',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              {versionHistory.map(v => (
                <option key={v.version} value={v.version}>
                  Version {v.version}{v.isOriginal ? ' (Original)' : ''}
                </option>
              ))}
            </select>
          )}

          {/* PBI chip */}
          <PbiChip pbis={question.pbis} />

          {/* Edit button */}
          <Button
            size="sm"
            onClick={() => { onEdit(question.id); onOpenChange(false) }}
            className="gap-1.5"
            style={{ flexShrink: 0 }}
          >
            <i className="fa-light fa-pen" aria-hidden="true" />
            Edit question
          </Button>

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            aria-label="Close detail panel"
            style={{ minWidth: 44, minHeight: 44, flexShrink: 0 }}
          >
            <i className="fa-light fa-xmark" aria-hidden="true" />
          </Button>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────────── */}
        <div
          role="tablist"
          style={{
            display: 'flex', alignItems: 'stretch', flexShrink: 0,
            borderBottom: '1px solid var(--border)',
            background: 'var(--card)', padding: '0 16px',
          }}
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-controls={`panel-${tab.id}`}
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '0 14px', height: 38,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                  borderBottom: isActive ? '2px solid var(--foreground)' : '2px solid transparent',
                  marginBottom: -1,
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
                {tab.warn && (
                  <>
                    <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"
                      style={{ fontSize: 11, color: 'var(--chart-4)' }} />
                    <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
                      (has warning)
                    </span>
                  </>
                )}
                {tab.badge !== undefined && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, lineHeight: 1,
                    padding: '1px 5px', borderRadius: 999,
                    background: 'var(--muted)', color: 'var(--muted-foreground)',
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Tab panels ────────────────────────────────────────────────── */}
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          style={{ flex: 1, overflow: 'hidden', padding: '16px 20px' }}
        >
          {activeTab === 'details' && (
            <DetailsTab question={question} />
          )}
          {activeTab === 'stats' && (
            <StatsTab question={question} />
          )}
          {activeTab === 'versions' && (
            <VersionsTab
              versionHistory={versionHistory}
              viewingVersion={displayVersion}
              onView={v => setViewingVersion(v)}
            />
          )}
          {activeTab === 'collaborators' && (
            <CollaboratorsTab collaborators={collaborators} />
          )}
        </div>

        {/* ── Footer (50px) ─────────────────────────────────────────────── */}
        <div style={{
          height: 50, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', borderTop: '1px solid var(--border)',
          background: 'var(--card)',
        }}>
          {/* Left: chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FooterChip>Viewing v{displayVersion}</FooterChip>
            {pbisLow && (
              <FooterChip warn>
                <i className="fa-light fa-triangle-exclamation" aria-hidden="true" />
                {' '}Low PBI
              </FooterChip>
            )}
            {question.layout && (
              <FooterChip>{question.layout}</FooterChip>
            )}
          </div>
          {/* Right: actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" size="sm" disabled>
              Remove from section
            </Button>
            <Button
              size="sm"
              onClick={() => { onEdit(question.id); onOpenChange(false) }}
              className="gap-1.5"
            >
              <i className="fa-light fa-pen" aria-hidden="true" />
              Edit question
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
