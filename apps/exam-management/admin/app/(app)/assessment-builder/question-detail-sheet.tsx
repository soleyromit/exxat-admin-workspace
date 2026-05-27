'use client'
import React, { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetClose, SheetTitle, Button, Collapsible, CollapsibleTrigger, CollapsibleContent, Separator, ToggleSwitch, Card } from '@exxat/ds/packages/ui/src'
import type { Question, QuestionVersionEntry, QuestionCollaborator, QuestionGradingConfig, ReferenceMaterial, DigitalToolsConfig } from '@/lib/qb-types'
import { MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'

type DetailTab = 'details' | 'config' | 'stats' | 'versions' | 'collaborators'

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
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 2 }}>
        Select one answer
      </div>
      {question.options?.map(opt => (
        <div key={opt.key} style={{ marginBottom: 2 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            border: `1px solid ${opt.isCorrect ? 'var(--chart-2)' : 'var(--border)'}`,
            borderRadius: 7, padding: '9px 11px',
            background: opt.isCorrect ? 'oklch(0.97 0.025 160)' : 'transparent',
          }}>
            {/* Radio affordance — circle = single-select */}
            <span style={{
              flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
              border: `2px solid ${opt.isCorrect ? 'var(--chart-2)' : 'var(--border)'}`,
              background: opt.isCorrect ? 'var(--chart-2)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700,
              color: opt.isCorrect ? 'var(--background)' : 'var(--muted-foreground)',
              marginTop: 1,
            }}>
              {opt.key}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--foreground)', margin: 0 }}>{opt.text}</p>
              {opt.isCorrect && (
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--chart-2)', display: 'block', marginTop: 3 }}>✓ Correct answer</span>
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
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--chart-2)', marginBottom: 5 }}>
              Rationale{correctOption.rationaleAuthor ? ` — ${correctOption.rationaleAuthor}` : ''}
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--foreground)', margin: 0 }}>{correctOption.rationale}</p>
          </div>
        )}
      </div>
      {/* Right: options + distractor rationale */}
      <div style={{ width: '44%', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6 }}>Select one answer</div>
        {question.options?.map(opt => (
          <div key={opt.key} style={{ marginBottom: 6 }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              border: `1px solid ${opt.isCorrect ? 'var(--chart-2)' : 'var(--border)'}`,
              borderRadius: 7, padding: '7px 9px',
              background: opt.isCorrect ? 'oklch(0.97 0.025 160)' : 'transparent',
            }}>
              {/* Radio affordance — circle = single-select */}
              <span style={{
                flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                border: `2px solid ${opt.isCorrect ? 'var(--chart-2)' : 'var(--border)'}`,
                background: opt.isCorrect ? 'var(--chart-2)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: opt.isCorrect ? 'var(--background)' : 'var(--muted-foreground)',
                marginTop: 1,
              }}>
                {opt.key}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--foreground)', margin: 0 }}>{opt.text}</p>
                {opt.isCorrect && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--chart-2)', display: 'block', marginTop: 2 }}>✓ Correct</span>
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
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
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
              fontSize: 12, fontWeight: 700, color: 'var(--primary-foreground)',
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
        <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Drug / Prompt</div>
        <div style={{ flex: 2, fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Correct match</div>
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
                fontSize: 12, fontWeight: 700, color: 'var(--primary-foreground)',
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
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Correct answers</div>
          {answers.map((ans, i) => (
            <div key={ans.key} style={{ marginBottom: 2 }}>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                border: '1px solid var(--chart-2)', borderRadius: 7, padding: '8px 10px',
                background: 'oklch(0.97 0.025 160)',
              }}>
                <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--chart-2)', minWidth: 24 }}>
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
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--chart-2)', marginBottom: 8 }}>
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
          fontSize: 12, fontWeight: 700, color: 'var(--chart-2)',
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

/** MSQ — Multiple Select: checkbox affordance, multiple correct answers */
function MSQPreview({ question }: { question: Question }) {
  const stemText = question.stemText ?? question.title
  const correctCount = question.options?.filter(o => o.isCorrect).length ?? 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <StemBlock>{stemText}</StemBlock>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 2 }}>
        Select all that apply — {correctCount} correct answer{correctCount !== 1 ? 's' : ''}
      </div>
      {question.options?.map(opt => (
        <div key={opt.key} style={{ marginBottom: 2 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            border: `1px solid ${opt.isCorrect ? 'var(--chart-2)' : 'var(--border)'}`,
            borderRadius: 7, padding: '9px 11px',
            background: opt.isCorrect ? 'oklch(0.97 0.025 160)' : 'transparent',
          }}>
            {/* Checkbox affordance — square = multi-select */}
            <span style={{
              flexShrink: 0, width: 20, height: 20, borderRadius: 4,
              border: `2px solid ${opt.isCorrect ? 'var(--chart-2)' : 'var(--border)'}`,
              background: opt.isCorrect ? 'var(--chart-2)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 1,
            }}>
              {opt.isCorrect && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 10, color: 'var(--primary-foreground)' }} />}
            </span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', marginRight: 6 }}>{opt.key}.</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--foreground)' }}>{opt.text}</span>
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

/** True/False — large T/F toggle affordance */
function TrueFalsePreview({ question }: { question: Question }) {
  const stemText = question.stemText ?? question.title
  const correctOpt = question.options?.find(o => o.isCorrect)
  const wrongOpt = question.options?.find(o => !o.isCorrect)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <StemBlock>{stemText}</StemBlock>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 2 }}>
        Select one — True or False
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {question.options?.map(opt => (
          <div key={opt.key} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '18px 14px', borderRadius: 10,
            border: `2px solid ${opt.isCorrect ? 'var(--chart-2)' : 'var(--border)'}`,
            background: opt.isCorrect ? 'oklch(0.97 0.025 160)' : 'transparent',
            cursor: 'default',
          }}>
            {/* Radio affordance */}
            <span style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${opt.isCorrect ? 'var(--chart-2)' : 'var(--border)'}`,
              background: opt.isCorrect ? 'var(--chart-2)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {opt.isCorrect && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 10, color: 'var(--primary-foreground)' }} />}
            </span>
            <span style={{
              fontSize: 18, fontWeight: 700,
              color: opt.isCorrect ? 'var(--chart-2)' : 'var(--muted-foreground)',
            }}>
              {opt.text}
            </span>
          </div>
        ))}
      </div>
      {correctOpt?.rationale && (
        <RationaleBlock label={`Rationale${correctOpt.rationaleAuthor ? ` — ${correctOpt.rationaleAuthor}` : ''}`}>
          {correctOpt.rationale}
        </RationaleBlock>
      )}
      {wrongOpt?.rationale && (
        <RationaleBlock label="Why the other option is incorrect">
          {wrongOpt.rationale}
        </RationaleBlock>
      )}
    </div>
  )
}

/** Short Answer — free text with keyword list + rubric */
function ShortAnswerPreview({ question }: { question: Question }) {
  const stemText = question.stemText ?? question.title
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
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Student response — short text</span>
        {question.minWordCount && (
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', flexShrink: 0 }}>0 / {question.minWordCount} words min</span>
        )}
      </div>
      {/* Expected keywords/phrases */}
      {question.options && question.options.length > 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>
            Expected keywords / acceptable phrases
          </div>
          {question.options.map((opt, i) => (
            <div key={opt.key} style={{ marginBottom: i < (question.options?.length ?? 0) - 1 ? 8 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{
                  flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--chart-2)',
                  minWidth: 20, paddingTop: 1,
                }}>
                  {opt.key}.
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', flex: 1 }}>{opt.text}</span>
              </div>
              {opt.rationale && (
                <div style={{ marginLeft: 28, marginTop: 3, fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                  {opt.rationale}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Rubric */}
      {question.rubric && question.rubric.length > 0 && (
        <div style={{
          background: 'color-mix(in srgb, var(--chart-2) 6%, var(--background))',
          border: '1px solid color-mix(in srgb, var(--chart-2) 22%, var(--background))',
          borderRadius: 8, padding: 13,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--chart-2)', marginBottom: 8 }}>
            Scoring rubric — {question.rubric.reduce((s, r) => s + r.points, 0)} pts total
          </div>
          {question.rubric.map((r, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', gap: 8,
              paddingBottom: 5, marginBottom: 5,
              borderBottom: i < (question.rubric?.length ?? 0) - 1 ? `1px solid color-mix(in srgb, var(--chart-2) 15%, var(--background))` : 'none',
            }}>
              <span style={{ fontSize: 12, color: 'var(--foreground)', flex: 1, lineHeight: 1.4 }}>{r.criterion}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', flexShrink: 0 }}>{r.points} pt{r.points !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Extended Matching — shared option pool + numbered sub-questions */
function ExtendedMatchingPreview({ question }: { question: Question }) {
  const stemText = question.stemText ?? question.title
  const pool = question.extendedMatchingPool ?? []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <StemBlock>{stemText}</StemBlock>
      {/* Option pool */}
      {pool.length > 0 && (
        <div style={{ background: 'var(--muted)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 8 }}>
            Option list — select from these for each question below
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 16px' }}>
            {pool.map(opt => (
              <div key={opt.key} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)', flexShrink: 0, minWidth: 18 }}>{opt.key}.</span>
                <span style={{ fontSize: 12, color: 'var(--foreground)' }}>{opt.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Sub-questions */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', marginTop: 2 }}>
        Questions — choose one option per stem
      </div>
      {question.options?.map((opt, idx) => {
        // Extract correct answer key from rationale prefix "X (Option Text) — explanation"
        const correctKey = opt.rationale?.match(/^([A-H])\s/)?.[1] ?? null
        const correctPoolItem = pool.find(p => p.key === correctKey)
        return (
          <div key={opt.key} style={{ marginBottom: 4 }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              border: '1px solid var(--border)', borderRadius: 7, padding: '10px 12px',
            }}>
              <span style={{
                flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                background: 'var(--muted)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)',
                marginTop: 1,
              }}>
                {idx + 1}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--foreground)', margin: 0 }}>{opt.text}</p>
                {correctPoolItem && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Correct answer:</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '1px 8px', borderRadius: 4,
                      background: 'oklch(0.97 0.025 160)', color: 'var(--chart-2)',
                      border: '1px solid var(--chart-2)',
                    }}>
                      {correctPoolItem.key} — {correctPoolItem.text}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {opt.rationale && (
              <RationaleBlock label="Rationale">{opt.rationale}</RationaleBlock>
            )}
          </div>
        )
      })}
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
      case 'MSQ':
        return <MSQPreview question={question} />
      case 'Fill blank': {
        const hasRubric = question.rubric && question.rubric.length > 0
        const hasOptions = question.options && question.options.length > 0
        return hasRubric || !hasOptions
          ? <EssayPreview question={question} />
          : <FillBlankPreview question={question} />
      }
      case 'True/False':
        return <TrueFalsePreview question={question} />
      case 'Short Answer':
        return <ShortAnswerPreview question={question} />
      case 'Extended Matching':
        return <ExtendedMatchingPreview question={question} />
      case 'Essay':
        return <EssayPreview question={question} />
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
  if (versionHistory.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
        <i className="fa-light fa-clock-rotate-left" aria-hidden="true" style={{ fontSize: 28, color: 'var(--muted-foreground)' }} />
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>No version history yet</p>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>Edits to this question will create new versions.</p>
      </div>
    )
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%' }}>
      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 14, lineHeight: 1.5 }}>
        Any version can be previewed here. Editing always creates a new version.
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

  if (collaborators.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
        <i className="fa-light fa-users" aria-hidden="true" style={{ fontSize: 28, color: 'var(--muted-foreground)' }} />
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>No collaborators</p>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>Access is managed at the folder level.</p>
      </div>
    )
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

// ─── SettingRow — icon + label + description + optional inline or below control ─

function SettingRow({
  icon,
  label,
  description,
  inlineControl,
  children,
}: {
  icon: string
  label: string
  description: string
  inlineControl?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'var(--muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 1,
        }}>
          <i className={`fa-light ${icon}`} aria-hidden="true" style={{ fontSize: 14, color: 'var(--muted-foreground)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', lineHeight: 1.3 }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2, lineHeight: 1.4 }}>{description}</div>
        </div>
        {inlineControl && (
          <div style={{ flexShrink: 0, marginTop: 2 }}>{inlineControl}</div>
        )}
      </div>
      {children && (
        <div style={{ marginLeft: 42 }}>{children}</div>
      )}
    </div>
  )
}

// ─── Grading rules section ────────────────────────────────────────────────────

function GradingRulesSection({
  question,
  config,
  onChange,
  assessmentNegativeMarking,
}: {
  question: Question
  config: QuestionGradingConfig
  onChange: (patch: Partial<QuestionGradingConfig>) => void
  assessmentNegativeMarking?: { enabled: boolean; fraction: number }
}) {
  const type = question.type

  const chipStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 12, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${active ? 'var(--brand-color)' : 'var(--border)'}`,
    background: active ? 'var(--brand-tint)' : 'transparent',
    color: active ? 'var(--brand-color)' : 'var(--muted-foreground)',
  })
  const focusRing = {
    onFocus: (e: React.FocusEvent<HTMLButtonElement>) => { e.currentTarget.style.outline = '2px solid var(--ring)'; e.currentTarget.style.outlineOffset = '2px' },
    onBlur:  (e: React.FocusEvent<HTMLButtonElement>) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.outlineOffset = '0' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Randomize options */}
      {['MCQ', 'MSQ', 'True/False', 'Ordering', 'Extended Matching'].includes(type) && (
        <SettingRow
          icon="fa-shuffle"
          label="Randomize answer order"
          description="Each student sees the options in a different random order."
          inlineControl={
            <ToggleSwitch
              checked={config.randomizeOptions ?? false}
              onChange={v => onChange({ randomizeOptions: v })}
            />
          }
        />
      )}

      {/* Negative marking */}
      {['MCQ', 'MSQ'].includes(type) && (
        <SettingRow
          icon="fa-circle-minus"
          label="Negative marking"
          description="Deduct points for each wrong answer. Override the assessment-level setting per question."
        >
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {([
              [null,  'Inherit'],
              [0,     'Off'],
              [0.25,  '−¼'],
              [0.33,  '−⅓'],
              [0.5,   '−½'],
            ] as const).map(([val, label]) => {
              const current = config.negativeMarkingWeight === undefined ? null : config.negativeMarkingWeight
              const isSelected = current === val
              return (
                <button key={String(val)} type="button" aria-pressed={isSelected}
                  onClick={() => onChange({ negativeMarkingWeight: val })}
                  style={chipStyle(isSelected)} {...focusRing}
                >{label}</button>
              )
            })}
          </div>
          {(config.negativeMarkingWeight === null || config.negativeMarkingWeight === undefined) && assessmentNegativeMarking && (
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
              {assessmentNegativeMarking.enabled
                ? `Assessment default: deduct −${assessmentNegativeMarking.fraction} per wrong answer`
                : 'Assessment default: off'}
            </p>
          )}
        </SettingRow>
      )}

      {/* MSQ scoring mode */}
      {type === 'MSQ' && (
        <SettingRow
          icon="fa-chart-bar"
          label="MSQ scoring mode"
          description="How partial credit is calculated when students select multiple answers."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {([
              ['standard',             'Standard — full credit for exact match'],
              ['all-or-nothing',       'All-or-nothing'],
              ['partial-additive',     'Partial — additive (points per correct option)'],
              ['partial-proportional', 'Partial — proportional'],
              ['right-minus-wrong',    'Right minus wrong'],
            ] as const).map(([val, label]) => (
              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio" name={`msq-mode-${question.id}`} value={val}
                  checked={(config.msqMode ?? 'standard') === val}
                  onChange={() => onChange({ msqMode: val })}
                  aria-label={label}
                  style={{ accentColor: 'var(--brand-color)' }}
                />
                <span style={{ color: 'var(--foreground)' }}>{label}</span>
              </label>
            ))}
          </div>
        </SettingRow>
      )}

      {/* Fill blank / Short Answer */}
      {['Fill blank', 'Short Answer'].includes(type) && (
        <>
          <SettingRow
            icon="fa-spell-check"
            label="Answer matching"
            description="Choose how strictly the student's response must match the correct answer."
          >
            <div style={{ display: 'flex', gap: 6 }}>
              {(['exact', 'contains'] as const).map(mode => {
                const active = (config.fillBlankMatchMode ?? 'exact') === mode
                return (
                  <button key={mode} type="button" aria-pressed={active}
                    onClick={() => onChange({ fillBlankMatchMode: mode })}
                    style={{ ...chipStyle(active), flex: 1, padding: '5px 0' }} {...focusRing}
                  >{mode === 'exact' ? 'Exact match' : 'Contains'}</button>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <ToggleSwitch
                checked={config.fillBlankCaseSensitive ?? false}
                onChange={v => onChange({ fillBlankCaseSensitive: v })}
              />
              <span style={{ fontSize: 13, color: 'var(--foreground)' }}>Case sensitive</span>
            </div>
          </SettingRow>
          <SettingRow
            icon="fa-input-text"
            label="Alternate accepted spellings"
            description="Additional correct spellings or phrasings — graded the same as the primary answer."
          >
            <input
              type="text" aria-label="Add alternate accepted answer"
              placeholder="Type and press Enter to add…"
              style={{ width: '100%', fontSize: 13, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const v = (e.currentTarget.value ?? '').trim()
                  if (v && !(config.alternateAcceptedAnswers ?? []).includes(v)) {
                    onChange({ alternateAcceptedAnswers: [...(config.alternateAcceptedAnswers ?? []), v] })
                    e.currentTarget.value = ''
                  }
                }
              }}
            />
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
              {(config.alternateAcceptedAnswers ?? []).map(ans => (
                <span key={ans} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}>
                  {ans}
                  <button type="button" aria-label={`Remove ${ans}`}
                    onClick={() => onChange({ alternateAcceptedAnswers: (config.alternateAcceptedAnswers ?? []).filter(a => a !== ans) })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 0, lineHeight: 1, fontFamily: 'inherit' }}
                  >
                    <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 10 }} />
                  </button>
                </span>
              ))}
            </div>
          </SettingRow>
        </>
      )}

      {/* Matching */}
      {type === 'Matching' && (
        <>
          <SettingRow
            icon="fa-link"
            label="Partial credit per pair"
            description="Award points for each correctly matched pair instead of requiring all pairs correct."
            inlineControl={
              <ToggleSwitch
                checked={config.matchPartialCredit ?? false}
                onChange={v => onChange({ matchPartialCredit: v })}
              />
            }
          />
          <SettingRow
            icon="fa-list-plus"
            label="Extra distractors"
            description="Add more answer options than prompts to prevent process-of-elimination."
            inlineControl={
              <ToggleSwitch
                checked={config.matchExtraDistractors ?? false}
                onChange={v => onChange({ matchExtraDistractors: v })}
              />
            }
          />
        </>
      )}

      {/* Hotspot */}
      {type === 'Hotspot' && (
        <>
          <SettingRow
            icon="fa-crosshairs"
            label="Multiple hotspot areas"
            description="Allow students to select more than one area on the image."
            inlineControl={
              <ToggleSwitch
                checked={config.hotspotMultipleAllowed ?? false}
                onChange={v => onChange({ hotspotMultipleAllowed: v })}
              />
            }
          />
          <SettingRow
            icon="fa-star-half"
            label="Partial credit per area"
            description="Award points for each correct area selected instead of requiring all areas."
            inlineControl={
              <ToggleSwitch
                checked={config.hotspotPartialCredit ?? false}
                onChange={v => onChange({ hotspotPartialCredit: v })}
              />
            }
          />
        </>
      )}

      {/* Essay */}
      {type === 'Essay' && (
        <>
          <SettingRow
            icon="fa-align-left"
            label="Word limit"
            description="Stop students from submitting a response over a set word count."
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number" min={10} max={5000}
                value={config.essayWordLimit ?? ''}
                onChange={e => onChange({ essayWordLimit: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="None"
                aria-label="Essay word limit"
                style={{ width: 80, fontSize: 13, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>words</span>
            </div>
          </SettingRow>
          <SettingRow
            icon="fa-eye-slash"
            label="Blind grading"
            description="Hide the student's name during manual grading to reduce bias."
            inlineControl={
              <ToggleSwitch
                checked={config.essayBlindGrading ?? false}
                onChange={v => onChange({ essayBlindGrading: v })}
              />
            }
          />
        </>
      )}
    </div>
  )
}

// ─── Per-question tools section ───────────────────────────────────────────────

function QuestionToolsSection({
  config,
  onChange,
  assessmentDigitalTools,
}: {
  config: QuestionGradingConfig
  onChange: (patch: Partial<QuestionGradingConfig>) => void
  assessmentDigitalTools?: DigitalToolsConfig
}) {
  const chipStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 12, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
    border: `1px solid ${active ? 'var(--brand-color)' : 'var(--border)'}`,
    background: active ? 'var(--brand-tint)' : 'transparent',
    color: active ? 'var(--brand-color)' : 'var(--muted-foreground)',
  })
  const focusRing = {
    onFocus: (e: React.FocusEvent<HTMLButtonElement>) => { e.currentTarget.style.outline = '2px solid var(--ring)'; e.currentTarget.style.outlineOffset = '2px' },
    onBlur:  (e: React.FocusEvent<HTMLButtonElement>) => { e.currentTarget.style.outline = 'none'; e.currentTarget.style.outlineOffset = '0' },
  }

  const calcOptions: Array<['none' | 'basic' | 'scientific' | undefined, string]> = [
    [undefined, 'Inherit'], ['none', 'Off'], ['basic', 'Basic'], ['scientific', 'Scientific'],
  ]
  const highlightOptions: Array<[boolean | null | undefined, string]> = [
    [undefined, 'Inherit'], [true, 'On'], [false, 'Off'],
  ]
  const elimOptions: Array<[boolean | null | undefined, string]> = [
    [undefined, 'Inherit'], [true, 'On'], [false, 'Off'],
  ]

  const showElimPreview = config.answerEliminationOverride === true ||
    (config.answerEliminationOverride === undefined && assessmentDigitalTools?.answerElimination === true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Calculator */}
      <SettingRow
        icon="fa-calculator"
        label="Calculator"
        description="Override which calculator (if any) the student can access during this question."
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {calcOptions.map(([val, label]) => {
            const active = config.calculatorOverride === val
            return (
              <button key={label} type="button" aria-pressed={active}
                onClick={() => onChange({ calculatorOverride: val })}
                style={chipStyle(active)} {...focusRing}>{label}</button>
            )
          })}
        </div>
        {config.calculatorOverride === undefined && assessmentDigitalTools && (
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
            Assessment default: {assessmentDigitalTools.calculator === 'none' ? 'off' : assessmentDigitalTools.calculator}
          </p>
        )}
      </SettingRow>

      {/* Text highlighting */}
      <SettingRow
        icon="fa-highlighter"
        label="Text highlighting"
        description="Students can select and highlight passage text while reading the question stem."
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {highlightOptions.map(([val, label]) => {
            const active = (config.textHighlightOverride === undefined ? undefined : config.textHighlightOverride) === val
            return (
              <button key={label} type="button" aria-pressed={active}
                onClick={() => onChange({ textHighlightOverride: val === undefined ? undefined : val })}
                style={chipStyle(active)} {...focusRing}>{label}</button>
            )
          })}
        </div>
        {config.textHighlightOverride === undefined && assessmentDigitalTools && (
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
            Assessment default: {assessmentDigitalTools.textHighlight ? 'on' : 'off'}
          </p>
        )}
      </SettingRow>

      {/* Answer elimination */}
      <SettingRow
        icon="fa-strikethrough"
        label="Answer elimination"
        description="Students can cross out options they want to rule out — without committing to a selection."
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {elimOptions.map(([val, label]) => {
            const active = config.answerEliminationOverride === val
            return (
              <button key={label} type="button" aria-pressed={active}
                onClick={() => onChange({ answerEliminationOverride: val })}
                style={chipStyle(active)} {...focusRing}>{label}</button>
            )
          })}
        </div>
        {config.answerEliminationOverride === undefined && assessmentDigitalTools && (
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
            Assessment default: {assessmentDigitalTools.answerElimination ? 'on' : 'off'}
          </p>
        )}
        {/* Visual preview — student-side view of crossed-out option */}
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 0 5px', fontStyle: 'italic' }}>
            {showElimPreview ? 'Student view with elimination on:' : 'Student view with elimination off:'}
          </p>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'var(--background)' }}>
            {/* Option A — untouched */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: '1px solid var(--border)' }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)',
              }}>A</span>
              <span style={{ fontSize: 12, color: 'var(--foreground)' }}>Ceftriaxone</span>
            </div>
            {/* Option B — eliminated (strike through) */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
              borderBottom: '1px solid var(--border)',
              opacity: showElimPreview ? 0.45 : 1,
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)',
              }}>B</span>
              <span style={{
                fontSize: 12, color: 'var(--foreground)', flex: 1,
                textDecoration: showElimPreview ? 'line-through' : 'none',
              }}>Tramadol</span>
              {showElimPreview && (
                <i className="fa-light fa-strikethrough" aria-hidden="true"
                  style={{ fontSize: 11, color: 'var(--muted-foreground)' }} />
              )}
            </div>
            {/* Option C — untouched */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px' }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: '2px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)',
              }}>C</span>
              <span style={{ fontSize: 12, color: 'var(--foreground)' }}>Vancomycin</span>
            </div>
          </div>
        </div>
      </SettingRow>

      {/* On-screen keyboard */}
      <SettingRow
        icon="fa-keyboard"
        label="On-screen keyboard"
        description="Show a virtual keyboard for text-input questions — useful for tablet and accessibility use."
        inlineControl={
          <ToggleSwitch
            checked={config.onScreenKeyboard ?? false}
            onChange={v => onChange({ onScreenKeyboard: v })}
          />
        }
      />
    </div>
  )
}

// ─── Per-question references section ──────────────────────────────────────────

function ReferencesSection({
  config,
  onChange,
}: {
  config: QuestionGradingConfig
  onChange: (patch: Partial<QuestionGradingConfig>) => void
}) {
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  const refs = config.referenceMaterials ?? []

  function addRef() {
    const trimLabel = label.trim()
    const trimUrl = url.trim()
    if (!trimLabel || !trimUrl) return
    const newRef: ReferenceMaterial = {
      id: `ref-${Date.now()}`,
      label: trimLabel,
      url: trimUrl,
    }
    onChange({ referenceMaterials: [...refs, newRef] })
    setLabel('')
    setUrl('')
  }

  function removeRef(id: string) {
    onChange({ referenceMaterials: refs.filter(r => r.id !== id) })
  }

  const inputStyle: React.CSSProperties = {
    fontSize: 13, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6,
    background: 'var(--background)', color: 'var(--foreground)', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>Attach materials students can open during this question — formularies, diagrams, guides.</p>

      {/* Reference list — empty state + items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {refs.length === 0 ? (
          <div style={{
            border: '1px dashed var(--border)', borderRadius: 8, padding: '16px 12px',
            display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted-foreground)',
          }}>
            <i className="fa-light fa-file-lines" aria-hidden="true" style={{ fontSize: 16, flexShrink: 0 }} />
            <span style={{ fontSize: 13 }}>No references added yet. Use the form below to attach one or more materials.</span>
          </div>
        ) : refs.map(ref => (
          <div key={ref.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8,
            background: 'var(--card)',
          }}>
            <i className="fa-light fa-paperclip" aria-hidden="true" style={{ fontSize: 13, color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ref.label}</p>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ref.url}</p>
            </div>
            <button
              type="button"
              aria-label={`Remove reference ${ref.label}`}
              onClick={() => removeRef(ref.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 4, flexShrink: 0, fontFamily: 'inherit', lineHeight: 1 }}
              onFocus={e => { e.currentTarget.style.outline = '2px solid var(--ring)'; e.currentTarget.style.outlineOffset = '2px' }}
              onBlur={e => { e.currentTarget.style.outline = 'none' }}
            >
              <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 13 }} />
            </button>
          </div>
        ))}
      </div>

      {/* Add reference form */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--muted)' }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted-foreground)', margin: 0 }}>Add a reference</p>
        <input
          type="text"
          placeholder="Label (e.g. Drug reference table)"
          value={label}
          onChange={e => setLabel(e.target.value)}
          aria-label="Reference label"
          style={{ ...inputStyle, width: '100%' }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="url"
            placeholder="https://…"
            value={url}
            onChange={e => setUrl(e.target.value)}
            aria-label="Reference URL"
            style={{ ...inputStyle, flex: 1 }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRef() } }}
          />
          <button
            type="button"
            aria-label="Add reference"
            onClick={addRef}
            disabled={!label.trim() || !url.trim()}
            style={{
              padding: '5px 14px', fontSize: 12, borderRadius: 6, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', background: 'var(--brand-color)', color: 'var(--primary-foreground)', fontWeight: 600,
              opacity: (!label.trim() || !url.trim()) ? 0.4 : 1,
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Config — collapsible accordion sections ─────────────────────────────

function ConfigAccordionSection({
  icon,
  label,
  defaultOpen = true,
  children,
}: {
  icon: string
  label: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="gap-0 py-0 rounded-xl">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            aria-expanded={open}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-left bg-transparent border-0 cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 hover:bg-muted/40 transition-colors"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
              <i className={`fa-light ${icon}`} aria-hidden="true" style={{ fontSize: 13, color: 'var(--muted-foreground)' }} />
            </div>
            <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
            <i
              className={`fa-light ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`}
              aria-hidden="true"
              style={{ fontSize: 12, color: 'var(--muted-foreground)' }}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator />
          <div className="px-4 py-4">
            {children}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function ConfigTab({
  question,
  config,
  onChange,
  assessmentNegativeMarking,
  assessmentDigitalTools,
  bonus,
  onBonusChange,
}: {
  question: Question
  config: QuestionGradingConfig
  onChange: (patch: Partial<QuestionGradingConfig>) => void
  assessmentNegativeMarking?: { enabled: boolean; fraction: number }
  assessmentDigitalTools?: DigitalToolsConfig
  bonus?: boolean
  onBonusChange?: (v: boolean) => void
}) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {onBonusChange !== undefined && (
        <ConfigAccordionSection icon="fa-star" label="Bonus" defaultOpen>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>Mark as bonus question</div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                Points awarded but not counted against the total marks denominator.
              </div>
            </div>
            <ToggleSwitch
              checked={bonus ?? false}
              onChange={onBonusChange}
            />
          </div>
        </ConfigAccordionSection>
      )}
      <ConfigAccordionSection icon="fa-scale-balanced" label="Grading rules" defaultOpen>
        <GradingRulesSection
          question={question}
          config={config}
          onChange={onChange}
          assessmentNegativeMarking={assessmentNegativeMarking}
        />
      </ConfigAccordionSection>
      <ConfigAccordionSection icon="fa-sliders" label="Tools" defaultOpen>
        <QuestionToolsSection
          config={config}
          onChange={onChange}
          assessmentDigitalTools={assessmentDigitalTools}
        />
      </ConfigAccordionSection>
      <ConfigAccordionSection icon="fa-paperclip" label="References" defaultOpen={false}>
        <ReferencesSection
          config={config}
          onChange={onChange}
        />
      </ConfigAccordionSection>
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
  gradingConfig,
  onGradingConfigChange,
  assessmentNegativeMarking,
  assessmentDigitalTools,
  bonus,
  onBonusChange,
}: {
  questionId: string | null
  questions: Question[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string) => void
  gradingConfig?: QuestionGradingConfig
  onGradingConfigChange?: (patch: Partial<QuestionGradingConfig>) => void
  assessmentNegativeMarking?: { enabled: boolean; fraction: number }
  assessmentDigitalTools?: DigitalToolsConfig
  bonus?: boolean
  onBonusChange?: (v: boolean) => void
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
    ...(onGradingConfigChange ? [{ id: 'config' as const, label: 'Config' }] : []),
    { id: 'stats',         label: 'Stats', warn: pbisLow },
    { id: 'versions',      label: 'Versions', badge: versionHistory.length > 0 ? versionHistory.length : undefined },
    { id: 'collaborators', label: 'Collaborators', badge: collaborators.length > 0 ? collaborators.length : undefined },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{
          width: '82vw', maxWidth: 960,
          display: 'flex', flexDirection: 'column',
          padding: 0,
        }}
      >
        {/* Visually-hidden title satisfies Radix DialogContent accessibility requirement */}
        <SheetTitle className="sr-only">{question.title}</SheetTitle>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{
          height: 52, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 12px 0 16px', borderBottom: '1px solid var(--border)',
          background: 'var(--card)',
        }}>
          {/* Type badge */}
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
            background: 'var(--muted)', color: 'var(--muted-foreground)',
            flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            {question.type}
          </span>
          {/* Title */}
          <span
            className="text-sm font-semibold text-foreground truncate"
            style={{ flex: 1, minWidth: 0 }}
            title={question.title}
          >
            {question.title}
          </span>
          {/* Close — single, DS-native */}
          <SheetClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close panel" style={{ flexShrink: 0 }}>
              <i className="fa-light fa-xmark" aria-hidden="true" />
            </Button>
          </SheetClose>
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
          style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '16px 20px' }}
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
          {activeTab === 'config' && onGradingConfigChange && (
            <ConfigTab
              question={question}
              config={gradingConfig ?? {}}
              onChange={onGradingConfigChange}
              assessmentNegativeMarking={assessmentNegativeMarking}
              assessmentDigitalTools={assessmentDigitalTools}
              bonus={bonus}
              onBonusChange={onBonusChange}
            />
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div style={{
          height: 50, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 16px', borderTop: '1px solid var(--border)',
          background: 'var(--card)', gap: 8,
        }}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <i className="fa-light fa-circle-minus" aria-hidden="true" />
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
      </SheetContent>
    </Sheet>
  )
}
