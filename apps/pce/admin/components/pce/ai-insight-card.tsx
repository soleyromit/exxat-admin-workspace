'use client'

import * as React from 'react'

/**
 * AiInsightCard — workspace pulled-vs-AI lane affordance per
 * docs/patterns/viz/ai-vs-pulled-lane.md.
 *
 * Use at every analytics aggregation level (term dashboard, cohort dashboard,
 * course detail, faculty self-view) to surface AI-extracted themes BEFORE
 * question-level pulled metrics — per Aarti 2026-05-08 16:09 D14
 * ("AI summaries surface BEFORE question-level detail at every aggregation level").
 *
 * Affordance: fa-light fa-sparkles + var(--brand-color) + "AI insight" label
 * + source citation. Distinct from pulled-data cards which use no AI affordance.
 *
 * Per workspace ADR-005: "AI is good at finding themes and grouping the
 * information by themes. Just let AI do that work" (Aarti).
 *
 * Reserved icon: fa-star-christmas is for Leo only — never use here.
 *
 * UPGRADED 2026-05-09 (post viz-audit): adds optional themes chip row,
 * confidence indicator (3-dot), and stale-AI affordance.
 */

export type AIConfidence = 'high' | 'medium' | 'low'

export interface AITheme {
  id: string
  text: string
  /** Magnitude — drives chip prefix dots */
  mentionsCount: number
  totalContext: number
  /** Optional sentiment, used only for chip background hint */
  sentiment?: 'positive' | 'concern' | 'neutral'
}

interface Props {
  /** The themes / insight text. Specific, action-oriented; cite the source in props.source not in body. */
  body?: React.ReactNode
  /** Where the AI extracted from. e.g. "47 open-text responses · 6 themes". */
  source: string
  /** Optional title above the body. Defaults to "AI insight". */
  title?: string
  /** Optional structured themes — when present, rendered as chip row above body. */
  themes?: AITheme[]
  /** AI confidence — surfaced as 3-dot indicator next to title. */
  confidence?: AIConfidence
  /** Pulled-data refreshed since this AI run? Show "regenerate" affordance. */
  staleSince?: Date | string
  /** Action buttons rendered below body. */
  actions?: React.ReactNode
  /** Pre-body content (e.g., a stat row). */
  preBody?: React.ReactNode
  className?: string
}

export function AiInsightCard({
  body,
  source,
  title = 'AI insight',
  themes,
  confidence,
  staleSince,
  actions,
  preBody,
  className,
}: Props) {
  return (
    <section
      role="region"
      aria-label="AI insight"
      className={`rounded-lg border border-border p-4 bg-background ${className ?? ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <i
            className="fa-light fa-sparkles"
            style={{ color: 'var(--brand-color)' }}
            aria-hidden="true"
          />
          <span>{title}</span>
          {confidence && <ConfidenceDots level={confidence} />}
        </div>
        {staleSince && (
          <span
            className="flex items-center gap-1 text-xs text-muted-foreground"
            title="Underlying data refreshed since this AI run"
          >
            <i className="fa-light fa-clock-rotate-left" aria-hidden="true" />
            <span>Stale</span>
          </span>
        )}
      </div>

      {preBody && <div className="mb-2">{preBody}</div>}

      {themes && themes.length > 0 && (
        <ul className="flex flex-col gap-1.5 mb-3" aria-label="AI themes">
          {themes.map((theme) => (
            <li key={theme.id} className="flex items-center gap-2">
              <ThemeMagnitude
                count={theme.mentionsCount}
                max={Math.max(...themes.map(t => t.mentionsCount))}
                sentiment={theme.sentiment}
              />
              <span className="text-sm flex-1">{theme.text}</span>
              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                {theme.mentionsCount} of {theme.totalContext}
              </span>
            </li>
          ))}
        </ul>
      )}

      {body && <div className="text-sm text-foreground mb-2">{body}</div>}

      <p className="text-xs text-muted-foreground">
        Based on {source}
      </p>

      {actions && (
        <div className="flex flex-wrap gap-2 mt-3">
          {actions}
        </div>
      )}
    </section>
  )
}

function ConfidenceDots({ level }: { level: AIConfidence }) {
  const filled = level === 'high' ? 3 : level === 'medium' ? 2 : 1
  return (
    <span
      className="flex items-center gap-0.5 ms-1"
      aria-label={`AI confidence: ${level}`}
      title={`Confidence: ${level}`}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full"
          style={{
            background: i < filled ? 'var(--brand-color)' : 'var(--muted)',
          }}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

/**
 * Magnitude indicator — N filled dots (out of width-controlled total) showing
 * relative theme strength. Sentiment subtly tints (positive=chart-2, concern=chart-4).
 */
function ThemeMagnitude({
  count,
  max,
  sentiment,
}: {
  count: number
  max: number
  sentiment?: 'positive' | 'concern' | 'neutral'
}) {
  const dotCount = 12 // fixed budget of 12 micro-dots
  const filled = Math.max(1, Math.round((count / max) * dotCount))
  const color =
    sentiment === 'positive' ? 'var(--chart-2)' :
    sentiment === 'concern'  ? 'var(--chart-4)' :
                                'var(--brand-color)'
  return (
    <span
      className="flex items-center gap-px"
      style={{ minWidth: dotCount * 4 }}
      aria-hidden="true"
    >
      {Array.from({ length: dotCount }).map((_, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: 3,
            height: 3,
            background: i < filled ? color : 'var(--muted)',
          }}
        />
      ))}
    </span>
  )
}
